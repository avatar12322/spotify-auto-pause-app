import { app, BrowserWindow, Tray, Menu, ipcMain, shell, dialog, nativeImage } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';
import { AppConfig, MonitoringStatus, LogEntry } from '../types/api.types';

class SpotifyAutoPauseApp {
  private mainWindow: BrowserWindow | null = null;
  private setupWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private backendProcess: ChildProcess | null = null;
  private isQuiting = false;
  private isSetupComplete = false;
  private configPath: string; 
  private readonly API_PORT = 5098;
  private readonly API_BASE_URL = `http://localhost:${this.API_PORT}`;

  constructor() {
  // Ustaw prawidłową ścieżkę w zależności od środowiska
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    // Development: zapisz w folderze projektu
    this.configPath = path.join(__dirname, '../../config.json');
  } else {
    // Production: zapisz w folderze userData (AppData)
    this.configPath = path.join(app.getPath('userData'), 'spotify-auto-pause-config.json');
  }
  
  console.log('Environment:', isDev ? 'development' : 'production');
  console.log('Config path set to:', this.configPath);
  
  // Upewnij się że folder istnieje
  const configDir = path.dirname(this.configPath);
  if (!fs.existsSync(configDir)) {
    console.log('Creating config directory:', configDir);
    fs.mkdirSync(configDir, { recursive: true });
  }
}

  private loadConfig(): AppConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        const config = JSON.parse(data);
        console.log('Loaded config:', { 
          setupComplete: config.setupComplete, 
          hasSpotifyConfig: !!config.spotifyConfig,
          hasClientId: !!config.spotifyConfig?.clientId 
        });
        return config;
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
    
    return {
      apiPort: this.API_PORT,
      backendPath: '',
      setupComplete: false
    };
  }

  private saveConfig(config: AppConfig): void {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
      console.log('Config saved successfully:', { 
        setupComplete: config.setupComplete, 
        hasSpotifyConfig: !!config.spotifyConfig 
      });
    } catch (error) {
      console.error('Error saving config:', error);
    }
  }

  async init(): Promise<void> {
    await this.checkSetup();
    this.setupIPC();
    
    app.whenReady().then(async () => {
      await this.startBackendService();
      this.createTray();

      console.log('App ready, setup complete:', this.isSetupComplete);
      
      // ZAWSZE używaj showMainWindow() do decyzji
      this.showMainWindow();
    });

    app.on('window-all-closed', () => {
      // Keep running in tray
    });

    app.on('activate', () => {
      this.showMainWindow();
    });

    app.on('before-quit', () => {
      this.isQuiting = true;
      this.stopBackendService();
    });
  }

  private async checkSetup() {
  try {
    const config = this.loadConfig();
    
    this.isSetupComplete = !!(config.setupComplete === true && 
                             config.spotifyConfig?.clientId && 
                             config.spotifyConfig?.clientSecret);
                             
    console.log('Setup check result:', {
      isSetupComplete: this.isSetupComplete,
      setupComplete: config.setupComplete,
      hasClientId: !!config.spotifyConfig?.clientId,
      hasClientSecret: !!config.spotifyConfig?.clientSecret
    });
  } catch (error) {
    console.log('Config error, showing setup:', error);
    this.isSetupComplete = false;
  }
}

  private async startBackendService(): Promise<void> {
    try {
      const isDev = process.env.NODE_ENV === 'development';
      const backendPath = isDev 
        ? path.join(__dirname, '../../../backend/SpotifyAutoPause.API/bin/Debug/net8.0/SpotifyAutoPause.API.exe')
        : path.join(process.resourcesPath, 'backend/SpotifyAutoPause.API.exe');

      if (!fs.existsSync(backendPath)) {
        console.log(`Backend executable not found at: ${backendPath}`);
        if (isDev) {
          console.log('Development mode: Backend executable not found, continuing without it');
          return;
        } else {
          throw new Error(`Backend executable not found at: ${backendPath}`);
        }
      }

      this.backendProcess = spawn(backendPath, [], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          ASPNETCORE_URLS: `http://localhost:${this.API_PORT}`
        }
      });

      this.backendProcess.stdout?.on('data', (data) => {
        console.log(`Backend: ${data}`);
      });

      this.backendProcess.stderr?.on('data', (data) => {
        console.error(`Backend Error: ${data}`);
      });

      this.backendProcess.on('close', (code) => {
        console.log(`Backend process exited with code ${code}`);
      });

      await this.waitForBackend();
      
    } catch (error) {
      console.error('Failed to start backend service:', error);
      if (process.env.NODE_ENV !== 'development') {
        this.showBackendError(error as Error);
      }
    }
  }

  private async waitForBackend(timeout = 10000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        await axios.get(`${this.API_BASE_URL}/health`);
        console.log('Backend service is ready');
        return;
      } catch {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    throw new Error('Backend service failed to start within timeout');
  }

  private stopBackendService(): void {
    if (this.backendProcess) {
      this.backendProcess.kill('SIGTERM');
      this.backendProcess = null;
    }
  }

  private createMainWindow(): void {
    // Sprawdź czy okno już istnieje
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.show();
      this.mainWindow.focus();
      return;
    }

    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 900,
      minWidth: 1000,
      minHeight: 700,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload/preload.js')
      },
      icon: this.getAppIcon(),
      show: false,
      skipTaskbar: false,
      resizable: true,
      maximizable: true,
      title: 'Spotify Auto-Pause'
    });

    this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.webContents.openDevTools();
    }

    this.mainWindow.on('close', (event) => {
      if (!this.isQuiting) {
        event.preventDefault();
        this.mainWindow?.hide();
      }
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private createSetupWindow(): void {
    // Sprawdź czy okno setup już istnieje
    if (this.setupWindow && !this.setupWindow.isDestroyed()) {
      this.setupWindow.show();
      this.setupWindow.focus();
      return;
    }

    this.setupWindow = new BrowserWindow({
      width: 800,
      height: 1000,
      minWidth: 700,
      minHeight: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload/preload.js')
      },
      icon: this.getAppIcon(),
      resizable: true,
      maximizable: true,
      title: 'Spotify Auto-Pause - Konfiguracja'
    });

    this.setupWindow.loadFile(path.join(__dirname, '../renderer/setup.html'));

    if (process.env.NODE_ENV === 'development') {
      this.setupWindow.webContents.openDevTools();
    }

    this.setupWindow.on('closed', () => {
      this.setupWindow = null;
    });
  }

  private getAppIcon(): string {
    const assetsPath = path.join(__dirname, '../../assets');
    
    switch (process.platform) {
      case 'win32':
        return path.join(assetsPath, 'icon.ico');
      case 'darwin':
        return path.join(assetsPath, 'icon.icns');
      default:
        return path.join(assetsPath, 'icon.png');
    }
  }

  private createTray(): void {
    const trayIconPath = path.join(__dirname, '../../assets/tray-icon.png');
    
    let icon: Electron.NativeImage;
    if (fs.existsSync(trayIconPath)) {
      icon = nativeImage.createFromPath(trayIconPath);
    } else {
      icon = nativeImage.createEmpty();
    }

    this.tray = new Tray(icon);
    this.updateTrayMenu();
    this.tray.setToolTip('Spotify Auto-Pause');
    
    this.tray.on('double-click', () => {
      this.showMainWindow();
    });
  }

  private async updateTrayMenu(): Promise<void> {
  let status: MonitoringStatus;
  try {
    const response = await axios.get(`${this.API_BASE_URL}/api/monitoring/status`);
    status = response.data;
  } catch {
    status = { 
      isRunning: false,
      currentThreshold: 0,
      silenceRequired: 0,
      excludedApps: [],
      lastActivity: undefined,     
      activeSessions: [],          
      isPausedByScript: false       
    };
  }
  // Sprawdź aktualny stan konfiguracji dla menu
  const config = this.loadConfig();
  const isConfigured: boolean = !!(config.setupComplete && config.spotifyConfig?.clientId);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Spotify Auto-Pause', enabled: false },
    { type: 'separator' },
    {
      label: status.isRunning ? 'Stop Monitoring' : 'Start Monitoring',
      enabled: isConfigured,  // Teraz to jest zawsze boolean
      click: () => this.toggleMonitoring()
    },
    {
      label: 'Open Panel',
      click: () => this.showMainWindow()
    },
    {
      label: `Status: ${status.isRunning ? 'Active' : isConfigured ? 'Ready' : 'Not Configured'}`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Spotify Dashboard',
      click: () => shell.openExternal('https://developer.spotify.com/dashboard/')
    },
    {
      label: isConfigured ? 'Reconfigure' : 'Configure',
      click: async () => {
        // Resetuj konfigurację i otwórz setup
        this.isSetupComplete = false;
        const appConfig = this.loadConfig();
        appConfig.setupComplete = false;
        this.saveConfig(appConfig);
        
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.close();
          this.mainWindow = null;
        }
        
        this.createSetupWindow();
        this.setupWindow?.show();
        this.setupWindow?.focus();
      }
    },
    { type: 'separator' },
    {
      label: 'Exit',
      click: () => this.quit()
    }
  ]);

  this.tray?.setContextMenu(contextMenu);
}

  private async toggleMonitoring(): Promise<void> {
    try {
      await axios.post(`${this.API_BASE_URL}/api/monitoring/toggle`);
      await this.updateTrayMenu();
    } catch (error) {
      console.error('Failed to toggle monitoring:', error);
    }
  }

  private showMainWindow(): void {
  // ZAWSZE sprawdź aktualny stan konfiguracji
  const config = this.loadConfig();
  const isConfigValid = !!(config.setupComplete === true && 
                          config.spotifyConfig?.clientId && 
                          config.spotifyConfig?.clientSecret);
  
  // Aktualizuj flagę klasy
  this.isSetupComplete = isConfigValid;
  
  console.log('showMainWindow called:', {
    isConfigValid,
    setupComplete: config.setupComplete,
    hasClientId: !!config.spotifyConfig?.clientId,
    currentFlag: this.isSetupComplete
  });

  if (!isConfigValid) {
    // Zamknij główne okno jeśli istnieje
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.close();
      this.mainWindow = null;
    }
    
    this.createSetupWindow();
    this.setupWindow?.show();
    this.setupWindow?.focus();
  } else {
    // Zamknij okno setup jeśli istnieje  
    if (this.setupWindow && !this.setupWindow.isDestroyed()) {
      this.setupWindow.close();
      this.setupWindow = null;
    }
    
    this.createMainWindow();
    this.mainWindow?.show();
    this.mainWindow?.focus();
  }
}

  private showBackendError(error: Error): void {
    dialog.showErrorBox(
      'Backend Service Error',
      `Failed to start backend service:\n\n${error.message}\n\nPlease ensure .NET 8 runtime is installed.`
    );
  }

  private closeAllWindows(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.close();
      this.mainWindow = null;
    }
    
    if (this.setupWindow && !this.setupWindow.isDestroyed()) {
      this.setupWindow.close();
      this.setupWindow = null;
    }
  }

  private quit(): void {
    this.isQuiting = true;
    this.closeAllWindows();
    this.stopBackendService();
    app.quit();
  }

  // IPC Handlers
  private setupIPC(): void {
    ipcMain.handle('api-request', async (event, method: string, endpoint: string, data?: any) => {
      try {
        const url = `${this.API_BASE_URL}${endpoint}`;
        const response = await axios({ method, url, data });
        return { success: true, data: response.data };
      } catch (error: any) {
        console.error(`API request failed: ${method} ${endpoint}`, error);
        return { success: false, error: error.message, data: error.response?.data };
      }
    });

    ipcMain.handle('complete-setup', async (event, config) => {
      try {
        console.log('Complete setup started with config:', {
          clientId: config.clientId ? config.clientId.substring(0, 8) + '...' : 'missing',
          hasSecret: !!config.clientSecret,
          redirectUri: config.redirectUri
        });
        
        // Zapisz konfigurację Spotify do backendu
        const backendResponse = await axios.post(`${this.API_BASE_URL}/api/config/spotify`, config);
        console.log('Backend config save response:', backendResponse.status);
        
        // Zapisz konfigurację lokalnie
        const appConfig = this.loadConfig();
        appConfig.setupComplete = true;
        appConfig.spotifyConfig = {
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          redirectUri: config.redirectUri
        };
        
        this.saveConfig(appConfig);
        
        // Aktualizuj flagę w klasie
        this.isSetupComplete = true;
        
        console.log('Setup completed successfully');
        
        // Zamknij okno setup natychmiast
        if (this.setupWindow && !this.setupWindow.isDestroyed()) {
          this.setupWindow.close();
          this.setupWindow = null;
        }
        
        // Otwórz główne okno z małym opóźnieniem
        setTimeout(() => {
          console.log('Opening main window after setup completion');
          this.createMainWindow();
          this.mainWindow?.show();
          this.mainWindow?.focus();
        }, 500);
        
        return { success: true };
      } catch (error: any) {
        console.error('Setup completion error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('refresh-main-window', async () => {
      try {
        console.log('Refresh main window requested');
        
        // Sprawdź konfigurację ponownie
        await this.checkSetup();
        
        // Użyj showMainWindow do przełączenia
        this.showMainWindow();
        
        return { success: true };
      } catch (error) {
        console.error('Error refreshing main window:', error);
        return { success: false, error: (error as Error).message };
      }
    });

    ipcMain.handle('open-external', (event, url) => {
      console.log('main.js openExternal called with:', url, typeof url);
      
      if (!url || typeof url !== 'string') {
        console.error('Invalid URL passed to openExternal:', url);
        return;
      }
      
      try {
        shell.openExternal(url);
        console.log('Successfully opened external URL');
      } catch (error) {
        console.error('Error opening external URL:', error);
      }
    });

    ipcMain.handle('get-config', () => {
      return this.loadConfig();
    });

    ipcMain.handle('save-config', (event, config: AppConfig) => {
      this.saveConfig(config);
      return { success: true };
    });

    ipcMain.handle('force-setup', async () => {
      try {
        // Zamknij główne okno jeśli istnieje
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.close();
          this.mainWindow = null;
        }
        
        // Ustaw flagę że setup nie jest ukończony
        this.isSetupComplete = false;
        
        // Aktualizuj config
        const appConfig = this.loadConfig();
        appConfig.setupComplete = false;
        this.saveConfig(appConfig);
        
        // Otwórz okno setup
        this.createSetupWindow();
        this.setupWindow?.show();
        this.setupWindow?.focus();
        
        return { success: true };
      } catch (error) {
        console.error('Error in force-setup:', error);
        return { success: false, error: (error as Error).message };
      }
    });

    // Handler do resetu konfiguracji
    ipcMain.handle('reset-config', async () => {
      try {
        // Reset backend config
        await axios.delete(`${this.API_BASE_URL}/api/config`);
        
        // Reset local config
        const defaultConfig: AppConfig = {
          apiPort: this.API_PORT,
          backendPath: '',
          setupComplete: false
        };
        this.saveConfig(defaultConfig);
        this.isSetupComplete = false;
        
        // Przełącz na setup
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.close();
          this.mainWindow = null;
        }
        
        this.createSetupWindow();
        this.setupWindow?.show();
        this.setupWindow?.focus();
        
        return { success: true };
      } catch (error) {
        console.error('Error resetting config:', error);
        return { success: false, error: (error as Error).message };
      }
    });
  }
}

// Start the application
const appInstance = new SpotifyAutoPauseApp();
appInstance.init();
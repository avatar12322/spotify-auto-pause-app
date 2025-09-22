import './styles/main.css';
import { ApiService, ApiDebugService } from './services/ApiService';
import { UIManager } from './components/UIManager';
import { SetupManager } from './components/SetupManager';
import { MonitoringStatus } from '../types/api.types';
import { i18n } from './services/I18nService';
import { I18nDomHelper } from './services/I18nDomHelper';
import { createLanguageSelector } from './components/LanguageSelector';


class SpotifyAutoPauseApp {
  private uiManager: UIManager;
  private setupManager: SetupManager | null = null;
  private isSetupMode = false;
  private status: MonitoringStatus | null = null;
  private updateInterval: number | null = null;

  private async showProcessSelector(): Promise<void> {
  try {
    const response = await ApiService.getActiveProcesses();
    
    if (response && response.length > 0) {
      this.uiManager.createProcessSelectorModal(response);
    } else {
      this.uiManager.showError(i18n.t('messages.noProcesses'));
    }
  } catch (error) {
    console.error('Error loading processes:', error);
    this.uiManager.showError(i18n.t('modals.error.processesFailed'));
  }
}

static async getActiveProcesses(): Promise<any[]> {
  try {
    const response = await window.electronAPI.apiRequest('GET', '/api/monitoring/processes');
    return response.success ? response.data || [] : [];
  } catch (error) {
    console.error('Error getting active processes:', error);
    return [];
  }
}

  constructor() {
  this.detectMode();
  this.uiManager = new UIManager();
  
  if (this.isSetupMode) {
    this.setupManager = new SetupManager();
    this.setupManager.setupEventListeners();
  } else {
    this.setupMainEventListeners();
    this.startPeriodicUpdates();
  }

    this.setupCommonEventListeners();

    this.initializeI18n();
  }

  private detectMode(): void {
    this.isSetupMode = document.title.includes('Konfiguracja') || 
                      document.querySelector('.setup-container') !== null;
  }

  private initializeI18n(): void {
  // Inicjalizuj system tłumaczeń
  I18nDomHelper.initialize();
  
  // Stwórz language selector
  createLanguageSelector('language-container');
  
  // Nasłuchuj zmiany języka i aktualizuj dynamiczne teksty
  window.addEventListener('languageChanged', () => {
    this.updateDynamicTexts();
  });
  
  // Pierwsza aktualizacja dynamicznych tekstów
  this.updateDynamicTexts();
}

private updateDynamicTexts(): void {
  // Aktualizuj przyciski toggle
  const toggleBtn = document.getElementById('toggleBtn');
  const btnText = toggleBtn?.querySelector('.btn-text');
  if (btnText && this.status) {
    btnText.textContent = this.status.isRunning 
      ? i18n.t('buttons.stopMonitoring')
      : i18n.t('buttons.startMonitoring');
  }
  
  // Aktualizuj status text
  const statusText = document.querySelector('.status-text');
  if (statusText && this.status) {
    statusText.textContent = this.status.isRunning 
      ? i18n.t('status.active')
      : i18n.t('status.inactive');
  }
}

  private setupMainEventListeners(): void {
    const elements = this.uiManager.getElements();

    

    // Toggle monitoring button
    elements.toggleBtn?.addEventListener('click', async () => {
      const success = await ApiService.toggleMonitoring();
      if (success) {
        await this.updateStatus();
      } else {
        this.uiManager.showError(i18n.t('modals.error.configFailed'));
      }
    });

    // Threshold slider
    elements.thresholdSlider?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      if (elements.thresholdValue) {
        elements.thresholdValue.textContent = target.value;
      }
    });

    elements.thresholdSlider?.addEventListener('change', () => {
      this.updateSettings();
    });

    // Silence time slider
    elements.silenceSlider?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      if (elements.silenceValue) {
        elements.silenceValue.textContent = target.value;
      }
    });

    elements.silenceSlider?.addEventListener('change', () => {
      this.updateSettings();
    });

    // App management
    document.getElementById('addAppBtn')?.addEventListener('click', () => {
      this.showAddAppModal();
    });

    document.getElementById('confirmAddApp')?.addEventListener('click', () => {
      this.addExcludedApp();
    });

    document.getElementById('cancelAddApp')?.addEventListener('click', () => {
      this.uiManager.hideModal('addAppModal');
    });

    // Logs
    document.getElementById('clearLogsBtn')?.addEventListener('click', async () => {
      const success = await ApiService.clearLogs();
      if (success) {
        this.uiManager.updateLogs([]);
      }
    });

    document.getElementById('refreshLogsBtn')?.addEventListener('click', async () => {
      const logs = await ApiService.getLogs();
      this.uiManager.updateLogs(logs);
    });

    document.getElementById('selectFromProcesses')?.addEventListener('click', async () => {
      await this.showProcessSelector();
    });

    

    // Remove app handlers (delegated)
    elements.excludedAppsEl?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('remove-app')) {
        const appName = target.getAttribute('data-app');
        if (appName) {
          this.removeExcludedApp(appName);
        }
      }
    });
  }

  private setupCommonEventListeners(): void {
    // Spotify dashboard button
    document.getElementById('spotifyDashboardBtn')?.addEventListener('click', () => {
      window.electronAPI.openExternal('https://developer.spotify.com/dashboard/');
    });

    document.getElementById('openSpotifyDashboard')?.addEventListener('click', () => {
      window.electronAPI.openExternal('https://developer.spotify.com/dashboard/');
    });
    document.getElementById('resetConfigBtn')?.addEventListener('click', () => {
        this.resetConfiguration();
    });
  }

  private async debugApiResponse(): Promise<void> {
  console.log('=== DEBUGGING API RESPONSE ===');
  await ApiDebugService.debugStatus();
}

  private async resetConfiguration(): Promise<void> {
  const confirmed = confirm(i18n.t('messages.confirmReset'));
  
  if (confirmed) {
    try {
      await window.electronAPI.apiRequest('DELETE', '/api/config');
      await window.electronAPI.forceSetup();
    } catch (error) {
      console.error('Error resetting configuration:', error);
      alert(i18n.t('messages.resetFailed'));
    }
  }
}

  private async updateStatus(): Promise<void> {
  
  const status = await ApiService.getStatus();
  if (status) {
    this.status = status; // ApiService już normalizuje dane
    this.uiManager.updateStatus(this.status);
  }
}

  private async updateSettings(): Promise<void> {
  const elements = this.uiManager.getElements();
  if (!elements.thresholdSlider || !elements.silenceSlider || !this.status) return;

  const threshold = parseFloat(elements.thresholdSlider.value);
  const silenceSeconds = parseFloat(elements.silenceSlider.value);

  console.log('Current status excludedApps:', this.status.excludedApps);
  console.log('Type of excludedApps:', typeof this.status.excludedApps);
  console.log('Is array:', Array.isArray(this.status.excludedApps));

  const success = await ApiService.updateSettings(threshold, silenceSeconds, this.status.excludedApps);
  if (!success) {
    console.error('Failed to update settings');
    this.uiManager.showError('Nie udało się zaktualizować ustawień');
  } else {
    console.log('Settings updated successfully');
  }
}

  private showAddAppModal(): void {
    const modal = document.getElementById('addAppModal') as HTMLElement;
    const input = document.getElementById('newAppName') as HTMLInputElement;
    
    if (modal) {
      modal.style.display = 'flex';
      if (input) {
        input.value = '';
        input.focus();
      }
    }
  }

  private async addExcludedApp(): Promise<void> {
    const input = document.getElementById('newAppName') as HTMLInputElement;
    const appName = input?.value.trim().toLowerCase();
    
    if (!appName || !this.status) return;

    if (this.status.excludedApps.includes(appName)) {
      alert(i18n.t('messages.appAlreadyExcluded'));
      return;
    }

    const newExcludedApps = [...this.status.excludedApps, appName];
    const success = await ApiService.updateSettings(
      this.status.currentThreshold,
      this.status.silenceRequired,
      newExcludedApps
    );

    if (success) {
      this.status.excludedApps = newExcludedApps;
      this.uiManager.updateExcludedApps(newExcludedApps);
      this.uiManager.hideModal('addAppModal');
    }
  }

  private async removeExcludedApp(appName: string): Promise<void> {
    if (!this.status) return;

    const newExcludedApps = this.status.excludedApps.filter(app => app !== appName);
    const success = await ApiService.updateSettings(
      this.status.currentThreshold,
      this.status.silenceRequired,
      newExcludedApps
    );

    if (success) {
      this.status.excludedApps = newExcludedApps;
      this.uiManager.updateExcludedApps(newExcludedApps);
    }
  }

  private async startPeriodicUpdates(): Promise<void> {
    // Initial load
    await this.updateStatus();
    await ApiDebugService.debugLogs();
    const logs = await ApiService.getLogs();
    this.uiManager.updateLogs(logs);
    
    // Periodic updates
    this.updateInterval = window.setInterval(async () => {
      await this.updateStatus();
      
      // Update logs less frequently
      if (Math.random() < 0.3) {
        const logs = await ApiService.getLogs();
        this.uiManager.updateLogs(logs);
      }
    }, 2000);
  }

  private stopPeriodicUpdates(): void {
    if (this.updateInterval) {
      window.clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  public destroy(): void {
    this.stopPeriodicUpdates();
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SpotifyAutoPauseApp();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
  // Cleanup if needed
});
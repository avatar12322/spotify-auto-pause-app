// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  source: 'frontend' | 'backend';
}


// App Config type - DODANY INTERFACE
export interface AppConfig {
  apiPort: number;
  backendPath: string;
  setupComplete: boolean;
  language?: 'pl' | 'en';
  spotifyConfig?: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
}

// Monitoring types
export interface MonitoringStatus {
  isRunning: boolean;
  currentThreshold: number;
  silenceRequired: number;
  excludedApps: string[];
  lastActivity?: string;
  activeSessions: AudioSessionInfo[];
  isPausedByScript: boolean;
}

export interface AudioSessionInfo {
  processName: string;
  processId: number;
  peakLevel: number;
  isActive: boolean;
  isExcluded: boolean;
}

// Log types
export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  source: 'frontend' | 'backend';
}

// Spotify types
export interface CurrentTrack {
  name: string;
  artist: string;
  album: string;
  isPlaying: boolean;
  progressMs: number;
  durationMs: number;
}

// Setup types
export interface SpotifyConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

// DOM Element types
export interface DOMElements {
  statusIndicator: HTMLElement | null;
  toggleBtn: HTMLElement | null;
  currentStatusEl: HTMLElement | null;
  lastActivityEl: HTMLElement | null;
  thresholdSlider: HTMLInputElement | null;
  thresholdValue: HTMLElement | null;
  silenceSlider: HTMLInputElement | null;
  silenceValue: HTMLElement | null;
  excludedAppsEl: HTMLElement | null;
  logsContainer: HTMLElement | null;
}

export interface SetupElements {
  clientIdInput: HTMLInputElement | null;
  clientSecretInput: HTMLInputElement | null;
  redirectUriInput: HTMLInputElement | null;
  authorizeBtn: HTMLElement | null;
  authStatus: HTMLElement | null;
}

// Global window interface extension
declare global {
  interface Window {
    electronAPI: {
      apiRequest: (method: string, endpoint: string, data?: any) => Promise<ApiResponse<any>>;
      completeSetup: (config: any) => Promise<ApiResponse<boolean>>;
      openExternal: (url: string) => void;
      forceSetup: () => Promise<ApiResponse<boolean>>;
      refreshMainWindow: () => Promise<ApiResponse<boolean>>;
      getConfig: () => Promise<AppConfig>; // POPRAWIONY TYP
      saveConfig: (config: AppConfig) => Promise<ApiResponse<boolean>>; // POPRAWIONY TYP
      resetConfig: () => Promise<ApiResponse<boolean>>;
      onStatusUpdate: (callback: (data: any) => void) => void;
      onNewLog: (callback: (log: any) => void) => void;
      removeAllListeners: (channel: string) => void;
      getVersions: () => {
        node: string;
        chrome: string;
        electron: string;
      };
    };
  }
}
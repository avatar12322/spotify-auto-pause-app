import { ApiResponse, MonitoringStatus, LogEntry } from '../../types/api.types';

export class ApiService {
  // Funkcja normalizująca odpowiedź z backend
  private static normalizeMonitoringStatus(rawStatus: any): MonitoringStatus {
    // Sprawdź czy to jest podwójnie opakowana odpowiedź
    let actualData = rawStatus;
    
    // Jeśli rawStatus ma strukturę ApiResponse, wyciągnij rzeczywiste dane
    if (rawStatus.success !== undefined && rawStatus.data !== undefined) {
      console.log('Detected nested ApiResponse structure, extracting data...');
      actualData = rawStatus.data;
    }
    
    // Jeśli dalej mamy zagnieżdżoną strukturę
    if (actualData.success !== undefined && actualData.data !== undefined) {
      console.log('Detected double-nested structure, extracting again...');
      actualData = actualData.data;
    }
    
    console.log('Actual monitoring data after extraction:', actualData);
    
    // Mapuj excludedApplications -> excludedApps jeśli istnieje
    if (actualData.excludedApplications && !actualData.excludedApps) {
      actualData.excludedApps = Array.isArray(actualData.excludedApplications) 
        ? actualData.excludedApplications 
        : [];
    }
    
    // Upewnij się że excludedApps jest tablicą
    if (!Array.isArray(actualData.excludedApps)) {
      console.warn('excludedApps is not an array, normalizing:', actualData.excludedApps);
      actualData.excludedApps = [];
    }
    
    return actualData as MonitoringStatus;
  }

  static async getStatus(): Promise<MonitoringStatus | null> {
    try {
      const response = await window.electronAPI.apiRequest('GET', '/api/monitoring/status');
      if (response.success && response.data) {
        const normalizedStatus = this.normalizeMonitoringStatus(response.data);
        console.log('Normalized monitoring status:', normalizedStatus);
        return normalizedStatus;
      }
      return null;
    } catch (error) {
      console.error('Error getting status:', error);
      return null;
    }
  }

  static async toggleMonitoring(): Promise<boolean> {
    try {
      const response = await window.electronAPI.apiRequest('POST', '/api/monitoring/toggle');
      return response.success;
    } catch (error) {
      console.error('Error toggling monitoring:', error);
      return false;
    }
  }

  static async updateSettings(threshold: number, silenceSeconds: number, excludedApps: string[]): Promise<boolean> {
    try {
      // Upewnij się że excludedApps jest tablicą
      const normalizedExcludedApps = Array.isArray(excludedApps) ? excludedApps : [];
      
      const settings = {
        threshold,
        silenceSeconds,
        excludedApps: normalizedExcludedApps
      };

      console.log('Sending settings to API:', settings);

      const response = await window.electronAPI.apiRequest('PUT', '/api/config/monitoring', settings);
      console.log('Settings update response:', response);
      
      return response.success;
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  }

  static async getLogs(): Promise<LogEntry[]> {
    try {
      const response = await window.electronAPI.apiRequest('GET', '/api/logs');
      
      if (response.success) {
        let logsData = response.data;
        
        // Sprawdź czy to zagnieżdżona struktura
        if (logsData && logsData.success !== undefined && logsData.data !== undefined) {
          logsData = logsData.data;
        }
        
        // Upewnij się że to tablica
        if (Array.isArray(logsData)) {
          return logsData;
        } else {
          console.warn('Logs data is not an array:', logsData);
          return [];
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error getting logs:', error);
      return [];
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

  static async clearLogs(): Promise<boolean> {
    try {
      const response = await window.electronAPI.apiRequest('DELETE', '/api/logs');
      return response.success;
    } catch (error) {
      console.error('Error clearing logs:', error);
      return false;
    }
  }

  static async getCurrentTrack(): Promise<any> {
    try {
      const response = await window.electronAPI.apiRequest('GET', '/api/spotify/current-track');
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Error getting current track:', error);
      return null;
    }
  }
}

// Dodaj też debug funkcję do testowania logs
export class ApiDebugService {
  static async debugStatus(): Promise<void> {
    try {
      console.log('=== DEBUG: Raw API Response ===');
      const response = await window.electronAPI.apiRequest('GET', '/api/monitoring/status');
      console.log('Raw response:', response);
      
      if (response.success && response.data) {
        console.log('Raw data type:', typeof response.data);
        console.log('Raw data keys:', Object.keys(response.data));
        
        // Sprawdź czy to podwójnie zagnieżdżona struktura
        let actualData = response.data;
        if (actualData.success !== undefined && actualData.data !== undefined) {
          console.log('Found nested structure, checking inner data...');
          actualData = actualData.data;
          console.log('Inner data keys:', Object.keys(actualData));
        }
        
        console.log('Final actual data:', actualData);
        console.log('excludedApplications:', actualData.excludedApplications);
        console.log('excludedApps:', actualData.excludedApps);
        console.log('isRunning:', actualData.isRunning);
        console.log('currentThreshold:', actualData.currentThreshold);
      }
    } catch (error) {
      console.error('Debug error:', error);
    }
  }

  static async debugLogs(): Promise<void> {
    try {
      console.log('=== DEBUG: Logs API Response ===');
      const response = await window.electronAPI.apiRequest('GET', '/api/logs');
      console.log('Raw logs response:', response);
      
      if (response.success && response.data) {
        console.log('Logs data type:', typeof response.data);
        console.log('Logs data keys:', Object.keys(response.data));
        console.log('Is logs data array?', Array.isArray(response.data));
        console.log('Logs data:', response.data);
        
        // Sprawdź czy zagnieżdżone
        if (response.data.success !== undefined && response.data.data !== undefined) {
          console.log('Found nested logs structure');
          console.log('Inner logs data:', response.data.data);
          console.log('Is inner data array?', Array.isArray(response.data.data));
        }
      }
    } catch (error) {
      console.error('Debug logs error:', error);
    }
  }
}
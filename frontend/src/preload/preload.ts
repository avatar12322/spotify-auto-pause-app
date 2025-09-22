import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {

    refreshMainWindow: () => ipcRenderer.invoke('refresh-main-window'),
    
    // Status operations
    getStatus: () => ipcRenderer.invoke('get-status'),
    toggleMonitoring: () => ipcRenderer.invoke('toggle-monitoring'),
    
    // API operations
    apiRequest: (method: string, endpoint: string, data?: any) => 
        ipcRenderer.invoke('api-request', method, endpoint, data),
    
    // Spotify operations
    openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
    completeSetup: (config: any) => ipcRenderer.invoke('complete-setup', config),
    
    // Config operations
    getConfig: () => ipcRenderer.invoke('get-config'),
    saveConfig: (config: any) => ipcRenderer.invoke('save-config', config),
    resetConfig: () => ipcRenderer.invoke('reset-config'),
    
    // Event listeners
    onStatusUpdate: (callback: (data: any) => void) => {
        ipcRenderer.on('status-update', (_event: Electron.IpcRendererEvent, data: any) => callback(data));
    },

    onNewLog: (callback: (log: any) => void) => {
        ipcRenderer.on('new-log', (_event: Electron.IpcRendererEvent, log: any) => callback(log));
    },
    
    // Remove listeners
    removeAllListeners: (channel: string) => {
        ipcRenderer.removeAllListeners(channel);
    },

    forceSetup: () => ipcRenderer.invoke('force-setup'),
    
    // Version info
    getVersions: () => ({
        node: process.versions.node,
        chrome: process.versions.chrome,
        electron: process.versions.electron
    })
    
});
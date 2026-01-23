const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // App paths
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  getWorkspacePath: () => ipcRenderer.invoke('get-workspace-path'),
  
  // Platform info
  platform: process.platform,
  isElectron: true,
  
  // IPC communication
  on: (channel, callback) => {
    const validChannels = ['new-chat'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },
  
  removeListener: (channel, callback) => {
    const validChannels = ['new-chat'];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, callback);
    }
  }
});

// Expose setup window specific APIs
contextBridge.exposeInMainWorld('electronAPI', {
  selectWorkspace: () => ipcRenderer.invoke('select-workspace'),
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  skipSetup: () => ipcRenderer.invoke('skip-setup')
});

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('api', {
  platform: process.platform,
  appVersion: () => process.versions.electron
});

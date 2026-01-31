const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    executeCommand: (command, args) => ipcRenderer.invoke('system-command', { command, args }),
    processInput: (text) => ipcRenderer.invoke('process-input', text),
    onSpeechUpdate: (callback) => ipcRenderer.on('speech-update', callback),
});

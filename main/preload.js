const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    executeCommand: (command, args) => ipcRenderer.invoke('system-command', { command, args }),
    processInput: (text) => ipcRenderer.invoke('process-input', text),
    transcribeAudio: (audioBuffer) => ipcRenderer.invoke('transcribe-audio', audioBuffer),
    onSpeechUpdate: (callback) => ipcRenderer.on('speech-update', callback),
    onStreamText: (callback) => ipcRenderer.on('stream-text', (event, text) => callback(text)),
    getConfig: () => ipcRenderer.invoke('get-config'),
    getVoiceConfig: () => ipcRenderer.invoke('get-voice-config'),
    onApplyTheme: (callback) => ipcRenderer.on('apply-theme', (event, theme) => callback(theme))
});


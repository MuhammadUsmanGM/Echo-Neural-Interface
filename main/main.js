const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const GeminiBrain = require('../services/gemini');
const SystemActions = require('../services/system');
require('dotenv').config();

let mainWindow;
let brain;

// Initialize the brain if API key is present
if (process.env.GOOGLE_AI_API_KEY) {
    brain = new GeminiBrain(process.env.GOOGLE_AI_API_KEY);
}

function createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    
    // Transparent, always-on-top window
    const windowWidth = 350;
    const windowHeight = 450;

    mainWindow = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        x: width - windowWidth - 20,
        y: height - windowHeight - 20,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        skipTaskbar: true,
        resizable: true,
        hasShadow: false
    });

    mainWindow.loadFile(path.join(__dirname, '../ui/index.html'));
}

app.whenReady().then(createWindow);

// Handle voice/text commands from the UI
ipcMain.handle('process-input', async (event, text) => {
    if (!brain) return { success: false, text: "API Key missing. Please set it in .env" };
    
    try {
        const response = await brain.processCommand(text);
        
        if (response.type === 'action') {
            // Execute the system action
            let result;
            const cmd = response.command.toLowerCase();
            const argsStr = response.args.join(' ');

            if (cmd.includes('chrome') || cmd.includes('search') || cmd.includes('web')) {
                result = await SystemActions.searchWeb(argsStr || text);
            } else if (cmd.includes('mkdir') || cmd.includes('folder')) {
                result = await SystemActions.createFolder(argsStr || "New Folder");
            } else {
                result = await SystemActions.openApp(cmd);
            }
            return { success: true, text: response.text || "Action completed, sir.", action: response.command };
        }
        
        return { success: true, text: response.text };
    } catch (error) {
        console.error("Gemini Error:", error);
        return { success: false, text: "I encountered an error processing that, sir." };
    }
});

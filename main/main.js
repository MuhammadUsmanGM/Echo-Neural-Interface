const { app, BrowserWindow, ipcMain, screen, globalShortcut, Menu, Tray } = require('electron');
const path = require('path');
const GeminiBrain = require('../services/gemini');
const WhisperService = require('../services/whisper');
const SystemActions = require('../services/system');
const ConfigManager = require('../scripts/config-manager');
const PluginManager = require('../scripts/plugin-manager');
const Scheduler = require('../scripts/scheduler');
const { CHANNELS, THEMES, COMMANDS, MESSAGES } = require('../utils/constants');
require('dotenv').config();

let mainWindow;
let tray;
let isQuitting = false;
let brain;
let whisper;
let scheduler;
const config = new ConfigManager();
const pluginManager = new PluginManager();

async function initializeBrain() {
    const provider = config.get('aiProvider') || 'google';
    const apiKeys = config.get('apiKeys') || {};
    const apiKey = apiKeys[provider] || process.env.GOOGLE_AI_API_KEY;
    const model = config.get('model') || 'gemini-2.0-flash-lite';
    
    // Initialize Whisper Service based on provider
    const voiceProvider = config.get('voiceProvider') || 'browser';
    if (voiceProvider === 'whisper') {
        if (apiKeys.openai) {
            whisper = new WhisperService({ 
                mode: 'cloud', 
                apiKey: apiKeys.openai 
            });
        }
    } else if (voiceProvider === 'whisper-local') {
        whisper = new WhisperService({ 
            mode: 'local',
            localPath: config.get('localWhisperPath'),
            modelPath: config.get('localWhisperModel')
        });
    }
    
    if (apiKey) {
        // Load plugins first
        await pluginManager.loadPlugins();
        
        // Convert plugin commands to Gemini tool format
        const pluginTools = pluginManager.listPlugins().filter(p => p.enabled).flatMap(p => {
            const plugin = pluginManager.plugins.get(p.name);
            return Object.keys(plugin.commands).map(cmdName => ({
                name: cmdName,
                description: plugin.commandDescriptions?.[cmdName] || `Execute ${cmdName} command`,
                parameters: {
                    type: "OBJECT",
                    properties: {
                        args: { type: "STRING", description: "Arguments for the command" }
                    }
                }
            }));
        });

        brain = new GeminiBrain(apiKey, pluginTools, model);
    }
}

function createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    
    // Get user preferences
    const windowSize = config.getWindowSize(config.get('size') || 'medium');
    const position = config.getWindowPosition(
        config.get('position') || 'bottom-right',
        { width, height },
        windowSize
    );
    const alwaysOnTop = config.get('alwaysOnTop') !== false;
    const startOnBoot = config.get('startOnBoot') === true;

    // Apply start on boot setting
    app.setLoginItemSettings({
        openAtLogin: startOnBoot,
        path: app.getPath('exe') // Correct specialized path for packaged app
    });

    mainWindow = new BrowserWindow({
        width: windowSize.width,
        height: windowSize.height,
        x: position.x,
        y: position.y,
        frame: false,
        transparent: true,
        alwaysOnTop: alwaysOnTop,
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

    // Create Context Menu (Right-Click)
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Echo AI Agent', enabled: false },
        { type: 'separator' },
        { 
            label: 'Hide (Ctrl+Shift+E)', 
            click: () => mainWindow.hide() 
        },
        { type: 'separator' },
        { 
            label: 'Quit Echo', 
            click: () => app.quit() 
        }
    ]);

    // Attach context menu to window
    mainWindow.webContents.on('context-menu', (e, params) => {
        contextMenu.popup(mainWindow, params.x, params.y);
    });

    // Register global hotkey
    const hotkey = config.get('hotkey') || 'CommandOrControl+Shift+E';
    globalShortcut.register(hotkey, () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
                mainWindow.focus();
            }
        }
    });

    // Create Tray Icon
    try {
        let trayIcon;
        const iconPath = path.join(__dirname, '../assets/icon.png');
        
        // Check if icon exists, otherwise use fallback
        const fs = require('fs');
        if (fs.existsSync(iconPath)) {
            trayIcon = iconPath;
        } else {
            // Use generating utility for fallback
            try {
                const { createTrayIcon } = require('../utils/tray-icon');
                trayIcon = createTrayIcon();
            } catch (err) {
                console.log('Fallback icon generation failed:', err);
            }
        }
        
        if (trayIcon) {
            tray = new Tray(trayIcon);
            
            const trayMenu = Menu.buildFromTemplate([
                { label: 'Echo AI Agent', enabled: false },
                { type: 'separator' },
                { 
                    label: 'Show Interface', 
                    click: () => {
                        mainWindow.show();
                        mainWindow.focus();
                    }
                },
                { 
                    label: 'Hide', 
                    click: () => mainWindow.hide() 
                },
                { type: 'separator' },
                { 
                    label: 'Quit Echo', 
                    click: () => {
                        isQuitting = true;
                        app.quit();
                    }
                }
            ]);
            
            tray.setToolTip('Echo AI Agent');
            tray.setContextMenu(trayMenu);
            
            tray.on('click', () => {
                if (mainWindow.isVisible()) {
                    mainWindow.hide();
                } else {
                    mainWindow.show();
                    mainWindow.focus();
                }
            });
        }
    } catch (e) {
        console.log('Tray icon could not be created:', e);
    }

    // Send theme configuration to renderer
    mainWindow.webContents.on('did-finish-load', () => {
        const theme = config.get('theme') || 'cyan';
        const themeColors = config.getThemeColors(theme);
        mainWindow.webContents.send('apply-theme', themeColors);
    });

    // Handle minimize/close to tray
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow.hide();
            return false;
        }
    });

    mainWindow.on('minimize', (event) => {
        event.preventDefault();
        mainWindow.hide();
    });
}

// Global error handlers
process.on('uncaughtException', (error) => {
    console.error('Critical Error:', error);
    // Optionally show a dialog to the user
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Initialize system
app.whenReady().then(async () => {
    await initializeBrain();
    createWindow();
    
    // Initialize scheduler for background tasks
    try {
        scheduler = new Scheduler();
        console.log('Scheduler initialized');
        
        // Notify user that Echo is running in background
        const NotificationManager = require('../scripts/notification-manager');
        const notifier = new NotificationManager();
        // Only notify on startup if configured (default true)
        if (config.get('startupNotification') !== false) {
             notifier.notifyStartup();
        }
    } catch (error) {
        console.error('Failed to initialize scheduler/notifications:', error);
    }
    
    // Auto-update check (runs once per day)
    try {
        const { checkForUpdatesOnStartup } = require('../scripts/auto-update');
        await checkForUpdatesOnStartup();
    } catch (error) {
        // Silently fail - don't interrupt user experience
        console.error('Auto-update check failed:', error);
    }
});

app.on('will-quit', () => {
    // Unregister all shortcuts
    globalShortcut.unregisterAll();
});

// Handle voice/text commands from the UI
ipcMain.handle('process-input', async (event, text) => {
    if (!brain) return { success: false, text: "API Key missing. Please run 'echo setup' first." };
    
    try {
        const response = await brain.processCommand(text);
        
        if (response.type === 'action') {
            // Execute the system action
            let result;
            const cmd = response.command.toLowerCase();
            const argsStr = Array.isArray(response.args) ? response.args.join(' ') : response.args;

            // Enhanced command routing
            if (cmd.includes('chrome') || cmd.includes('search') || cmd.includes('web')) {
                result = await SystemActions.searchWeb(argsStr || text);
            } else if (cmd.includes('mkdir') || cmd.includes('folder')) {
                result = await SystemActions.createFolder(argsStr || "New Folder");
            } else if (cmd.includes('screenshot')) {
                result = await SystemActions.takeScreenshot();
            } else if (cmd.includes('system') || cmd.includes('info')) {
                result = SystemActions.getSystemInfo();
            } else if (cmd.includes('time') || cmd.includes('date')) {
                result = SystemActions.getDateTime();
            } else if (cmd.includes('list') || cmd.includes('files')) {
                result = await SystemActions.listFiles(argsStr);
            } else if (cmd.includes('copy')) {
                const [source, dest] = argsStr.split(' to ');
                result = await SystemActions.copyFile(source, dest);
            } else if (cmd.includes('delete')) {
                result = await SystemActions.deleteFile(argsStr);
            } else if (cmd.includes('url') || cmd.includes('open')) {
                result = await SystemActions.openUrl(argsStr);
            } else {
                result = await SystemActions.openApp(cmd);
            }
            
            return { success: true, text: response.text || "Action completed, sir.", action: response.command };
        
        } else if (response.type === 'plugin_action') {
            // Execute plugin command
            const result = await pluginManager.executeCommand(response.command, response.args);
            
            if (result.success) {
                return { success: true, text: result.result.message || "Plugin executed successfully.", action: response.command };
            } else {
                return { success: false, text: `Plugin error: ${result.error}` };
            }
        }
        
        return { success: true, text: response.text };
    } catch (error) {
        console.error("Gemini Error:", error);
        return { success: false, text: "I encountered an error processing that, sir." };
    }
});

// Get configuration
ipcMain.handle('get-config', async () => {
    return {
        theme: config.get('theme') || 'cyan',
        themeColors: config.getThemeColors(config.get('theme') || 'cyan')
    };
});

ipcMain.handle('get-voice-config', async () => {
    return {
        provider: config.get('voiceProvider') || 'browser'
    };
});

ipcMain.handle('transcribe-audio', async (event, audioBuffer) => {
    if (!whisper) {
        // Fallback to re-init if whisper was missing
        const apiKeys = config.get('apiKeys') || {};
        if (apiKeys.openai) {
            whisper = new WhisperService(apiKeys.openai);
        } else {
            return { success: false, error: "OpenAI API Key missing for Whisper." };
        }
    }

    try {
        const text = await whisper.transcribe(Buffer.from(audioBuffer));
        return { success: true, text };
    } catch (error) {
        return { success: false, error: error.message };
    }
});


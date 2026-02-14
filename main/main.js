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
    const apiKey = apiKeys[provider] || process.env[provider === 'google' ? 'GOOGLE_AI_API_KEY' : `${provider.toUpperCase()}_API_KEY`];
    const model = config.get('model'); // Let service handle default if null
    
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
        
        // Load appropriate brain service
        switch (provider) {
            case 'openai':
                const OpenAIBrain = require('../services/openai');
                // Convert plugins to OpenAI tools format
                const openaiTools = pluginManager.listPlugins().filter(p => p.enabled).flatMap(p => {
                    const plugin = pluginManager.plugins.get(p.name);
                    return Object.keys(plugin.commands).map(cmdName => ({
                        name: cmdName,
                        description: plugin.commandDescriptions?.[cmdName] || `Execute ${cmdName}`,
                        parameters: {
                            type: "object",
                            properties: {
                                args: { type: "string", description: "Arguments string" }
                            }
                        }
                    }));
                });
                brain = new OpenAIBrain(apiKey, openaiTools, model || 'gpt-4o-mini');
                break;

            case 'anthropic':
                const AnthropicBrain = require('../services/anthropic');
                // Convert plugins to Anthropic tools format
                const anthropicTools = pluginManager.listPlugins().filter(p => p.enabled).flatMap(p => {
                    const plugin = pluginManager.plugins.get(p.name);
                    return Object.keys(plugin.commands).map(cmdName => ({
                        name: cmdName,
                        description: plugin.commandDescriptions?.[cmdName] || `Execute ${cmdName}`,
                        parameters: {
                            type: "object",
                            properties: {
                                args: { type: "string", description: "Arguments string" }
                            }
                        }
                    }));
                });
                brain = new AnthropicBrain(apiKey, anthropicTools, model || 'claude-3-5-haiku-latest');
                break;

            case 'deepseek':
                const DeepSeekBrain = require('../services/deepseek');
                // DeepSeek uses OpenAI format
                const deepseekTools = pluginManager.listPlugins().filter(p => p.enabled).flatMap(p => {
                    const plugin = pluginManager.plugins.get(p.name);
                    return Object.keys(plugin.commands).map(cmdName => ({
                        name: cmdName,
                        description: plugin.commandDescriptions?.[cmdName] || `Execute ${cmdName}`,
                        parameters: {
                            type: "object",
                            properties: {
                                args: { type: "string", description: "Arguments string" }
                            }
                        }
                    }));
                });
                brain = new DeepSeekBrain(apiKey, deepseekTools, model || 'deepseek-chat');
                break;

            case 'google':
            default:
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
                brain = new GeminiBrain(apiKey, pluginTools, model || 'gemini-2.0-flash-lite');
                break;
        }
        console.log(`Initialized brain with provider: ${provider}`);
    } else {
        console.warn(`No API key found for provider: ${provider}`);
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
        // Stream progress callback
        const onProgress = (chunk) => {
            event.sender.send('stream-text', chunk);
        };

        const response = await brain.processCommand(text, onProgress);
        
        let result = { success: true, text: response.text, action: null };

        if (response.type === 'action' || response.type === 'plugin_action') {
            const cmd = response.command; // .toLowerCase() removed to preserve case for plugins
            const args = response.args;
            const isBaseTool = response.type === 'action'; // Based on previous logic, 'action' is system

            // Execute action
            if (isBaseTool) {
                // ... (Existing SystemActions logic) ...
                // Re-implementing concise routing for clarity and safety
                let actionResult;
                const lowerCmd = cmd.toLowerCase();
                const argsStr = Array.isArray(args) ? args.join(' ') : args;

                if (lowerCmd.includes('chrome') || lowerCmd.includes('search') || lowerCmd.includes('web')) {
                    actionResult = await SystemActions.searchWeb(argsStr || text);
                } else if (lowerCmd.includes('mkdir') || lowerCmd.includes('folder')) {
                    actionResult = await SystemActions.createFolder(argsStr || "New Folder");
                } else if (lowerCmd.includes('screenshot')) {
                    actionResult = await SystemActions.takeScreenshot();
                } else if (lowerCmd.includes('system') || lowerCmd.includes('info')) {
                    actionResult = SystemActions.getSystemInfo();
                } else if (lowerCmd.includes('time') || lowerCmd.includes('date')) {
                    actionResult = SystemActions.getDateTime();
                } else if (lowerCmd.includes('list') || lowerCmd.includes('files')) {
                    actionResult = await SystemActions.listFiles(argsStr);
                } else if (lowerCmd.includes('copy')) {
                    const [source, dest] = argsStr.split(' to ');
                    actionResult = await SystemActions.copyFile(source, dest);
                } else if (lowerCmd.includes('delete')) {
                    actionResult = await SystemActions.deleteFile(argsStr);
                } else if (lowerCmd.includes('url') || lowerCmd.includes('open') && lowerCmd.includes('http')) {
                    actionResult = await SystemActions.openUrl(argsStr);
                } else {
                    actionResult = await SystemActions.openApp(cmd);
                }
                
                result.text = response.text || "Action completed, sir.";
                result.action = cmd;
            } else {
                // Plugin Action
                const pluginResult = await pluginManager.executeCommand(cmd, args);
                if (pluginResult.success) {
                    result.text = pluginResult.result.message || "Plugin executed successfully.";
                    result.action = cmd;
                } else {
                    result.success = false;
                    result.text = `Plugin error: ${pluginResult.error}`;
                }
            }
        }
        
        return result;
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


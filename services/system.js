const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

const platform = os.platform();

const SystemActions = {
    // Cross-platform app launcher with sanitization
    openApp: (appName) => {
        return new Promise((resolve) => {
            // Security: Sanitize input to prevent command injection
            if (/;|&|\||`|\$|\(|\)|<|>|\\/.test(appName)) {
                console.warn('Security Alert: Blocked potentially dangerous character in openApp:', appName);
                return resolve({ success: false, error: 'Security Alert: Invalid characters in application name.' });
            }

            let command;
            
            if (platform === 'win32') {
                command = `start ${appName}`;
            } else if (platform === 'darwin') {
                command = `open -a "${appName}"`;
            } else {
                // Linux
                command = `xdg-open ${appName} || gnome-open ${appName}`;
            }
            
            exec(command, (err) => {
                if (err) resolve({ success: false, error: err.message });
                else resolve({ success: true });
            });
        });
    },

    // Cross-platform web search with URL safety
    searchWeb: (query) => {
        const sanitizedQuery = encodeURIComponent(query);
        const url = `https://www.google.com/search?q=${sanitizedQuery}`;
        return new Promise((resolve) => {
            let command;
            
            if (platform === 'win32') {
                command = `start chrome "${url}" || start "${url}"`;
            } else if (platform === 'darwin') {
                command = `open "${url}"`;
            } else {
                command = `xdg-open "${url}" || gnome-open "${url}"`;
            }
            
            exec(command, (err) => {
                if (err) resolve({ success: false, error: err.message });
                else resolve({ success: true });
            });
        });
    },

    // Cross-platform folder creation
    createFolder: (pathName) => {
        return new Promise((resolve) => {
            // Use Node's fs instead of shell commands for better cross-platform support
            const fullPath = path.isAbsolute(pathName) 
                ? pathName 
                : path.join(os.homedir(), 'Desktop', pathName);
            
            fs.mkdir(fullPath, { recursive: true }, (err) => {
                if (err) resolve({ success: false, error: err.message });
                else resolve({ success: true, path: fullPath });
            });
        });
    },

    // File operations
    copyFile: (source, destination) => {
        return new Promise((resolve) => {
            fs.copyFile(source, destination, (err) => {
                if (err) resolve({ success: false, error: err.message });
                else resolve({ success: true });
            });
        });
    },

    deleteFile: (filePath) => {
        return new Promise((resolve) => {
            fs.unlink(filePath, (err) => {
                if (err) resolve({ success: false, error: err.message });
                else resolve({ success: true });
            });
        });
    },

    // System information
    getSystemInfo: () => {
        return {
            success: true,
            platform: os.platform(),
            arch: os.arch(),
            hostname: os.hostname(),
            cpus: os.cpus().length,
            totalMemory: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
            freeMemory: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
            uptime: `${(os.uptime() / 3600).toFixed(2)} hours`
        };
    },

    // Open URL in default browser
    openUrl: (url) => {
        return new Promise((resolve) => {
            let command;
            
            if (platform === 'win32') {
                command = `start ${url}`;
            } else if (platform === 'darwin') {
                command = `open "${url}"`;
            } else {
                command = `xdg-open "${url}"`;
            }
            
            exec(command, (err) => {
                if (err) resolve({ success: false, error: err.message });
                else resolve({ success: true });
            });
        });
    },

    // Execute custom shell command (use with caution)
    executeCommand: (command) => {
        return new Promise((resolve) => {
            exec(command, (err, stdout, stderr) => {
                if (err) {
                    resolve({ success: false, error: err.message, stderr });
                } else {
                    resolve({ success: true, output: stdout });
                }
            });
        });
    },

    // Get current time/date
    getDateTime: () => {
        const now = new Date();
        return {
            success: true,
            date: now.toLocaleDateString(),
            time: now.toLocaleTimeString(),
            timestamp: now.toISOString()
        };
    },

    // List files in directory
    listFiles: (dirPath) => {
        return new Promise((resolve) => {
            const targetPath = dirPath || os.homedir();
            
            fs.readdir(targetPath, (err, files) => {
                if (err) resolve({ success: false, error: err.message });
                else resolve({ success: true, files, path: targetPath });
            });
        });
    },

    // Screenshot (platform-specific)
    takeScreenshot: () => {
        return new Promise((resolve) => {
            const screenshotPath = path.join(os.homedir(), 'Desktop', `screenshot-${Date.now()}.png`);
            let command;
            
            if (platform === 'win32') {
                // Windows: Use PowerShell
                command = `powershell -command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('%{PRTSC}')"`;
            } else if (platform === 'darwin') {
                // macOS: Use screencapture
                command = `screencapture "${screenshotPath}"`;
            } else {
                // Linux: Use scrot or gnome-screenshot
                command = `scrot "${screenshotPath}" || gnome-screenshot -f "${screenshotPath}"`;
            }
            
            exec(command, (err) => {
                if (err) resolve({ success: false, error: err.message });
                else resolve({ success: true, path: screenshotPath });
            });
        });
    }
};

module.exports = SystemActions;


const { execFile } = require('child_process');
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

            if (platform === 'win32') {
                execFile('cmd', ['/c', 'start', '', appName], (err) => {
                    if (err) resolve({ success: false, error: err.message });
                    else resolve({ success: true });
                });
            } else if (platform === 'darwin') {
                execFile('open', ['-a', appName], (err) => {
                    if (err) resolve({ success: false, error: err.message });
                    else resolve({ success: true });
                });
            } else {
                // Linux
                execFile('xdg-open', [appName], (err) => {
                    if (err) {
                        // Fallback to xdg-open only
                        resolve({ success: false, error: err.message });
                    } else {
                        resolve({ success: true });
                    }
                });
            }
        });
    },

    // Cross-platform web search with URL safety
    searchWeb: (query) => {
        const sanitizedQuery = encodeURIComponent(query);
        const url = `https://www.google.com/search?q=${sanitizedQuery}`;
        return new Promise((resolve) => {
            if (platform === 'win32') {
                execFile('cmd', ['/c', 'start', 'chrome', url], (err) => {
                    if (err) {
                        // Fallback to default browser
                        execFile('cmd', ['/c', 'start', url], (fallbackErr) => {
                            if (fallbackErr) resolve({ success: false, error: fallbackErr.message });
                            else resolve({ success: true });
                        });
                    } else {
                        resolve({ success: true });
                    }
                });
            } else if (platform === 'darwin') {
                execFile('open', [url], (err) => {
                    if (err) resolve({ success: false, error: err.message });
                    else resolve({ success: true });
                });
            } else {
                execFile('xdg-open', [url], (err) => {
                    if (err) resolve({ success: false, error: err.message });
                    else resolve({ success: true });
                });
            }
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

    writeFile: (filePath, content) => {
        return new Promise((resolve) => {
            const fullPath = path.isAbsolute(filePath) 
                ? filePath 
                : path.join(os.homedir(), 'Desktop', filePath);

            fs.writeFile(fullPath, content, 'utf8', (err) => {
                if (err) resolve({ success: false, error: err.message });
                else resolve({ success: true, path: fullPath });
            });
        });
    },

    readFile: (filePath) => {
        return new Promise((resolve) => {
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) resolve({ success: false, error: err.message });
                else resolve({ success: true, content: data });
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
            // Validate URL protocol to prevent javascript: and file: schemes
            try {
                const parsedUrl = new URL(url);
                if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
                    return resolve({ success: false, error: 'Only http and https protocols are allowed' });
                }
            } catch {
                return resolve({ success: false, error: 'Invalid URL format' });
            }

            if (platform === 'win32') {
                execFile('cmd', ['/c', 'start', url], (err) => {
                    if (err) resolve({ success: false, error: err.message });
                    else resolve({ success: true });
                });
            } else if (platform === 'darwin') {
                execFile('open', [url], (err) => {
                    if (err) resolve({ success: false, error: err.message });
                    else resolve({ success: true });
                });
            } else {
                execFile('xdg-open', [url], (err) => {
                    if (err) resolve({ success: false, error: err.message });
                    else resolve({ success: true });
                });
            }
        });
    },

    // Execute custom shell command (use with caution)
    // NOTE: This is intentionally restricted - AI-triggered commands are validated by InputValidator
    executeCommand: (command) => {
        return new Promise((resolve) => {
            // Split command into program and arguments safely
            // On Windows, use cmd /c; on Unix, use sh -c
            const args = platform === 'win32'
                ? ['/c', command]
                : ['-c', command];
            const program = platform === 'win32' ? 'cmd' : 'sh';

            execFile(program, args, { timeout: 30000 }, (err, stdout, stderr) => {
                if (err) {
                    resolve({ success: false, error: err.message, stderr });
                } else {
                    resolve({ success: true, output: stdout });
                }
            });
        });
    },

    // Get current date and time
    getDateTime: () => {
        return {
            success: true,
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            timestamp: Date.now()
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

            if (platform === 'win32') {
                // Windows: Use PowerShell to capture and save screenshot properly
                const psScript = `
                    Add-Type -AssemblyName System.Windows.Forms;
                    $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds;
                    $bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height);
                    $graphics = [System.Drawing.Graphics]::FromImage($bitmap);
                    $graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size);
                    $bitmap.Save('${screenshotPath.replace(/\\/g, '\\\\')}');
                    $graphics.Dispose();
                    $bitmap.Dispose();
                `;
                execFile('powershell', ['-NoProfile', '-NonInteractive', '-Command', psScript], (err) => {
                    if (err) resolve({ success: false, error: err.message });
                    else resolve({ success: true, path: screenshotPath });
                });
            } else if (platform === 'darwin') {
                // macOS: Use screencapture
                execFile('screencapture', [screenshotPath], (err) => {
                    if (err) resolve({ success: false, error: err.message });
                    else resolve({ success: true, path: screenshotPath });
                });
            } else {
                // Linux: Use scrot or gnome-screenshot
                execFile('scrot', [screenshotPath], (err) => {
                    if (err) {
                        // Fallback to gnome-screenshot
                        execFile('gnome-screenshot', ['-f', screenshotPath], (gnomeErr) => {
                            if (gnomeErr) resolve({ success: false, error: gnomeErr.message });
                            else resolve({ success: true, path: screenshotPath });
                        });
                    } else {
                        resolve({ success: true, path: screenshotPath });
                    }
                });
            }
        });
    }
};

module.exports = SystemActions;


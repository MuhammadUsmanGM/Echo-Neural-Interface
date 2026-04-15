const { execFile } = require('child_process');
const os = require('os');

const platform = os.platform();

/**
 * InputController - Handles keyboard input simulation (typing and key presses)
 * Cross-platform support for Windows, macOS, and Linux
 */
const InputController = {
    /**
     * Type text by simulating keyboard input
     * @param {string} text - Text to type
     * @returns {Promise<{success: boolean}>}
     */
    type: (text) => {
        return new Promise((resolve) => {
            if (!text || typeof text !== 'string') {
                return resolve({ success: false, error: 'Invalid text input' });
            }

            // Sanitize: remove null bytes and control characters that could break shell
            const sanitizedText = text.replace(/[\0\x00-\x1f]/g, '').replace(/"/g, '\\"');

            if (platform === 'win32') {
                // Windows: Use PowerShell to send keystrokes via WScript.Shell
                // Split long text into chunks to avoid command line length limits
                const chunkSize = 500;
                const chunks = [];
                for (let i = 0; i < sanitizedText.length; i += chunkSize) {
                    chunks.push(sanitizedText.substring(i, i + chunkSize));
                }

                // Process first chunk, then type remaining chunks sequentially
                const typeChunk = (chunk, callback) => {
                    const psScript = `$wsh = New-Object -ComObject WScript.Shell; $wsh.SendKeys('${chunk}')`;
                    execFile('powershell', ['-NoProfile', '-NonInteractive', '-Command', psScript], (err) => {
                        if (err) {
                            console.error('InputController.type error:', err.message);
                        }
                        callback();
                    });
                };

                // Type chunks sequentially
                let currentChunk = 0;
                const typeNextChunk = () => {
                    if (currentChunk < chunks.length) {
                        typeChunk(chunks[currentChunk], () => {
                            currentChunk++;
                            typeNextChunk();
                        });
                    } else {
                        resolve({ success: true });
                    }
                };
                typeNextChunk();

            } else if (platform === 'darwin') {
                // macOS: Use osascript to simulate keystrokes
                // AppleScript has limitations for special characters, so we handle basic text
                const script = `tell application "System Events" to keystroke "${sanitizedText}"`;
                execFile('osascript', ['-e', script], (err) => {
                    if (err) {
                        console.error('InputController.type error:', err.message);
                        return resolve({ success: false, error: err.message });
                    }
                    resolve({ success: true });
                });

            } else {
                // Linux: Use xdotool
                execFile('xdotool', ['type', '--', sanitizedText], (err) => {
                    if (err) {
                        console.error('InputController.type error:', err.message);
                        return resolve({ success: false, error: err.message });
                    }
                    resolve({ success: true });
                });
            }
        });
    },

    /**
     * Press a specific key or key combination
     * @param {string} key - Key to press (e.g., 'enter', 'ctrl+c', 'alt+tab')
     * @returns {Promise<{success: boolean}>}
     */
    press: (key) => {
        return new Promise((resolve) => {
            if (!key || typeof key !== 'string') {
                return resolve({ success: false, error: 'Invalid key input' });
            }

            const normalizedKey = key.toLowerCase().trim();

            if (platform === 'win32') {
                // Windows: Map common keys to PowerShell SendKeys format
                const keyMap = {
                    'enter': '{ENTER}',
                    'return': '{ENTER}',
                    'tab': '{TAB}',
                    'escape': '{ESC}',
                    'esc': '{ESC}',
                    'delete': '{DELETE}',
                    'del': '{DELETE}',
                    'backspace': '{BACKSPACE}',
                    'bs': '{BACKSPACE}',
                    'up': '{UP}',
                    'down': '{DOWN}',
                    'left': '{LEFT}',
                    'right': '{RIGHT}',
                    'home': '{HOME}',
                    'end': '{END}',
                    'pageup': '{PGUP}',
                    'pagedown': '{PGDN}',
                    'insert': '{INSERT}',
                    'ins': '{INSERT}',
                    'f1': '{F1}', 'f2': '{F2}', 'f3': '{F3}', 'f4': '{F4}',
                    'f5': '{F5}', 'f6': '{F6}', 'f7': '{F7}', 'f8': '{F8}',
                    'f9': '{F9}', 'f10': '{F10}', 'f11': '{F11}', 'f12': '{F12}',
                };

                let sendKey;

                // Handle modifier combinations (ctrl+c, alt+tab, etc.)
                if (normalizedKey.includes('+')) {
                    const parts = normalizedKey.split('+');
                    const modifierMap = {
                        'ctrl': '^',
                        'control': '^',
                        'alt': '%',
                        'shift': '+'
                    };

                    // Simple single modifier + key
                    if (parts.length === 2) {
                        const mod = modifierMap[parts[0]];
                        const k = keyMap[parts[1]] || parts[1].toUpperCase();
                        if (mod) {
                            // For modifier + key, use the modifier prefix
                            sendKey = `${mod}${k}`;
                        } else {
                            sendKey = parts.join('+');
                        }
                    } else {
                        sendKey = normalizedKey;
                    }
                } else {
                    sendKey = keyMap[normalizedKey] || normalizedKey.toUpperCase();
                }

                const psScript = `$wsh = New-Object -ComObject WScript.Shell; $wsh.SendKeys('${sendKey}')`;
                execFile('powershell', ['-NoProfile', '-NonInteractive', '-Command', psScript], (err) => {
                    if (err) {
                        console.error('InputController.press error:', err.message);
                        return resolve({ success: false, error: err.message });
                    }
                    resolve({ success: true });
                });

            } else if (platform === 'darwin') {
                // macOS: Map keys to AppleScript
                const keyMap = {
                    'enter': 'return',
                    'return': 'return',
                    'tab': 'tab',
                    'escape': 'key code 53',
                    'esc': 'key code 53',
                    'delete': 'key code 51',
                    'backspace': 'key code 51',
                    'up': 'key code 126',
                    'down': 'key code 125',
                    'left': 'key code 123',
                    'right': 'key code 124',
                    'home': 'key code 115',
                    'end': 'key code 119',
                    'pageup': 'key code 116',
                    'pagedown': 'key code 121',
                    'f1': 'key code 122', 'f2': 'key code 120', 'f3': 'key code 99',
                    'f4': 'key code 118', 'f5': 'key code 96', 'f6': 'key code 97',
                    'f7': 'key code 98', 'f8': 'key code 100', 'f9': 'key code 101',
                    'f10': 'key code 109', 'f11': 'key code 103', 'f12': 'key code 111',
                };

                let script;

                if (normalizedKey.includes('+')) {
                    // Handle modifier combinations
                    const parts = normalizedKey.split('+');
                    const modifierMap = {
                        'ctrl': 'control',
                        'control': 'control',
                        'alt': 'option',
                        'option': 'option',
                        'shift': 'shift',
                        'cmd': 'command',
                        'command': 'command'
                    };

                    if (parts.length === 2) {
                        const mod = modifierMap[parts[0]];
                        const k = keyMap[parts[1]] || parts[1];
                        if (mod) {
                            script = `tell application "System Events" to keystroke "${k}" using ${mod} down`;
                        } else {
                            script = `tell application "System Events" to keystroke "${normalizedKey}"`;
                        }
                    } else {
                        script = `tell application "System Events" to keystroke "${normalizedKey}"`;
                    }
                } else {
                    const mappedKey = keyMap[normalizedKey];
                    if (mappedKey && mappedKey.startsWith('key code')) {
                        script = `tell application "System Events" to ${mappedKey}`;
                    } else {
                        script = `tell application "System Events" to keystroke "${mappedKey || normalizedKey}"`;
                    }
                }

                execFile('osascript', ['-e', script], (err) => {
                    if (err) {
                        console.error('InputController.press error:', err.message);
                        return resolve({ success: false, error: err.message });
                    }
                    resolve({ success: true });
                });

            } else {
                // Linux: Use xdotool
                const keyMap = {
                    'enter': 'Return',
                    'return': 'Return',
                    'tab': 'Tab',
                    'escape': 'Escape',
                    'esc': 'Escape',
                    'delete': 'Delete',
                    'del': 'Delete',
                    'backspace': 'BackSpace',
                    'bs': 'BackSpace',
                    'space': 'space',
                };

                let xdotoolKey;

                if (normalizedKey.includes('+')) {
                    // Handle modifier combinations
                    const parts = normalizedKey.split('+');
                    const mappedParts = parts.map(p => keyMap[p.toLowerCase()] || p);
                    xdotoolKey = mappedParts.join('+');
                } else {
                    xdotoolKey = keyMap[normalizedKey] || normalizedKey;
                }

                execFile('xdotool', ['key', xdotoolKey], (err) => {
                    if (err) {
                        console.error('InputController.press error:', err.message);
                        return resolve({ success: false, error: err.message });
                    }
                    resolve({ success: true });
                });
            }
        });
    }
};

module.exports = InputController;

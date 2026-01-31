const { exec } = require('child_process');

const SystemActions = {
    openApp: (appName) => {
        // Simple Windows 'start' command
        return new Promise((resolve) => {
            exec(`start ${appName}`, (err) => {
                if (err) resolve({ success: false, error: err.message });
                else resolve({ success: true });
            });
        });
    },

    searchWeb: (query) => {
        const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        return new Promise((resolve) => {
            exec(`start chrome "${url}"`, (err) => {
                if (err) {
                    // Fallback to default browser if chrome fails
                    exec(`start ${url}`, (err2) => {
                        if (err2) resolve({ success: false, error: err2.message });
                        else resolve({ success: true });
                    });
                } else resolve({ success: true });
            });
        });
    },

    createFolder: (pathName) => {
        return new Promise((resolve) => {
            exec(`mkdir "${pathName}"`, (err) => {
                if (err) resolve({ success: false, error: err.message });
                else resolve({ success: true });
            });
        });
    }
};

module.exports = SystemActions;

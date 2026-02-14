const notifier = require('node-notifier');
const path = require('path');
const os = require('os');

class NotificationManager {
    constructor() {
        this.appName = 'Echo AI Agent';
        // Use a high-res icon if available, otherwise fallback
        this.iconPath = path.join(__dirname, '..', 'assets', 'icon.png'); 
    }

    /**
     * Send a desktop notification
     * @param {string} title - Notification title
     * @param {string} message - Body of the notification
     * @param {boolean} sound - Whether to play a system sound
     * @param {string} type - 'info', 'warning', 'error', 'success' (affects icon/sound on some OS)
     */
    notify(title, message, sound = true, type = 'info') {
        const options = {
            title: title || this.appName,
            message: message,
            sound: sound,
            wait: false, // Don't wait for user interaction unless needed
            appID: 'com.echo.ai.agent', // For Windows 10/11 Action Center
        };

        // Add icon if it exists (placeholder logic as we don't have an asset folder yet)
        // options.icon = this.iconPath;

        try {
            notifier.notify(options, (err, response, metadata) => {
                if (err) {
                    console.error('Notification Error:', err);
                }
            });
            return true;
        } catch (error) {
            console.error('Failed to send notification:', error);
            return false;
        }
    }

    /**
     * Send a startup notification
     */
    notifyStartup() {
        this.notify('Echo Online', 'I am running in the background, awaiting your command.', false);
    }

    /**
     * Send a success notification
     */
    success(message) {
        this.notify('Success', message, false);
    }

    /**
     * Send an error notification
     */
    error(message) {
        this.notify('System Alert', message, true);
    }

    /**
     * Send a reminder notification (persistent until clicked)
     */
    remind(message) {
        notifier.notify({
            title: '⏰ Reminder',
            message: message,
            sound: true,
            wait: true, // Wait for user to dismiss
            timeout: 30 // Auto dismiss after 30 sec if ignored
        });
    }
}

module.exports = NotificationManager;

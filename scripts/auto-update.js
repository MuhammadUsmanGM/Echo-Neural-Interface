const UpdateManager = require('./scripts/update-manager');
const ConfigManager = require('./scripts/config-manager');
const chalk = require('chalk');

/**
 * Auto-update checker that runs on Echo startup
 * Checks for updates silently and notifies the user
 */
async function checkForUpdatesOnStartup() {
    const config = new ConfigManager();
    const updater = new UpdateManager();

    // Check if auto-update check is disabled
    const autoUpdateCheck = config.get('autoUpdateCheck');
    if (autoUpdateCheck === false) {
        return;
    }

    // Check last update check time to avoid checking too frequently
    const lastCheck = config.get('lastUpdateCheck');
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000; // 24 hours

    if (lastCheck && (now - lastCheck) < ONE_DAY) {
        // Already checked within the last 24 hours
        return;
    }

    try {
        const updateInfo = await updater.silentUpdateCheck();

        // Save the check timestamp
        config.set('lastUpdateCheck', now);

        if (updateInfo.available) {
            // Display notification
            updater.displayUpdateNotification(updateInfo);
        }
    } catch (error) {
        // Silently fail - don't interrupt the user experience
        console.error('Auto-update check failed:', error.message);
    }
}

module.exports = { checkForUpdatesOnStartup };

const { execSync } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');
const https = require('https');
const packageJson = require('../package.json');

class UpdateManager {
    constructor() {
        this.currentVersion = packageJson.version;
        this.packageName = packageJson.name;
        this.updateCheckUrl = `https://registry.npmjs.org/${this.packageName}/latest`;
    }

    /**
     * Check if an update is available
     */
    async checkForUpdates() {
        return new Promise((resolve) => {
            https.get(this.updateCheckUrl, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const latestInfo = JSON.parse(data);
                        const latestVersion = latestInfo.version;
                        
                        resolve({
                            updateAvailable: this.compareVersions(latestVersion, this.currentVersion) > 0,
                            currentVersion: this.currentVersion,
                            latestVersion: latestVersion,
                            changelog: latestInfo.description || 'No changelog available'
                        });
                    } catch (error) {
                        resolve({
                            updateAvailable: false,
                            error: 'Failed to parse version data',
                            currentVersion: this.currentVersion
                        });
                    }
                });
            }).on('error', (error) => {
                resolve({
                    updateAvailable: false,
                    error: error.message,
                    currentVersion: this.currentVersion
                });
            });
        });
    }

    /**
     * Compare two semantic versions
     * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
     */
    compareVersions(v1, v2) {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);

        for (let i = 0; i < 3; i++) {
            if (parts1[i] > parts2[i]) return 1;
            if (parts1[i] < parts2[i]) return -1;
        }
        return 0;
    }

    /**
     * Perform the update
     */
    async performUpdate() {
        const spinner = ora('Checking for updates...').start();

        try {
            const updateInfo = await this.checkForUpdates();

            if (updateInfo.error) {
                spinner.fail(chalk.red('Update check failed: ' + updateInfo.error));
                return { success: false, error: updateInfo.error };
            }

            if (!updateInfo.updateAvailable) {
                spinner.succeed(chalk.green(`You're already on the latest version (${this.currentVersion})`));
                return { success: true, alreadyLatest: true, version: this.currentVersion };
            }

            spinner.text = `Update available: ${chalk.yellow(this.currentVersion)} → ${chalk.green(updateInfo.latestVersion)}`;
            spinner.succeed();

            console.log(chalk.cyan('\n📦 Installing update...\n'));

            const updateSpinner = ora('Updating Echo AI Agent...').start();

            try {
                // Update the package globally
                execSync(`npm install -g ${this.packageName}@latest`, {
                    stdio: 'pipe',
                    encoding: 'utf8'
                });

                updateSpinner.succeed(chalk.green(`✓ Successfully updated to version ${updateInfo.latestVersion}!`));
                
                console.log(chalk.cyan('\n🎉 Echo has been updated successfully!'));
                console.log(chalk.gray('   Restart Echo to use the new version.\n'));

                return {
                    success: true,
                    previousVersion: this.currentVersion,
                    newVersion: updateInfo.latestVersion
                };

            } catch (updateError) {
                updateSpinner.fail(chalk.red('Update failed'));
                console.error(chalk.red('\n❌ Error during update:'));
                console.error(chalk.gray(updateError.message));
                console.log(chalk.yellow('\n💡 Try updating manually with:'));
                console.log(chalk.cyan(`   npm install -g ${this.packageName}@latest\n`));

                return {
                    success: false,
                    error: updateError.message
                };
            }

        } catch (error) {
            spinner.fail(chalk.red('Update process failed'));
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Silent update check (for auto-update on startup)
     */
    async silentUpdateCheck() {
        try {
            const updateInfo = await this.checkForUpdates();
            
            if (updateInfo.updateAvailable && !updateInfo.error) {
                return {
                    available: true,
                    current: updateInfo.currentVersion,
                    latest: updateInfo.latestVersion
                };
            }
            
            return { available: false };
        } catch (error) {
            return { available: false, error: error.message };
        }
    }

    /**
     * Display update notification
     */
    displayUpdateNotification(updateInfo) {
        console.log(chalk.yellow('\n╔════════════════════════════════════════════════════════╗'));
        console.log(chalk.yellow('║') + chalk.bold.white('           🎉 UPDATE AVAILABLE!                    ') + chalk.yellow('║'));
        console.log(chalk.yellow('╠════════════════════════════════════════════════════════╣'));
        console.log(chalk.yellow('║') + `  Current Version: ${chalk.red(updateInfo.current)}                        ` + chalk.yellow('║'));
        console.log(chalk.yellow('║') + `  Latest Version:  ${chalk.green(updateInfo.latest)}                        ` + chalk.yellow('║'));
        console.log(chalk.yellow('╠════════════════════════════════════════════════════════╣'));
        console.log(chalk.yellow('║') + chalk.white('  Update now with: ') + chalk.cyan('echo update') + '                  ' + chalk.yellow('║'));
        console.log(chalk.yellow('╚════════════════════════════════════════════════════════╝\n'));
    }

    /**
     * Auto-update with user confirmation
     */
    async autoUpdate() {
        const inquirer = require('inquirer');
        const updateInfo = await this.silentUpdateCheck();

        if (!updateInfo.available) {
            return { success: false, reason: 'No update available' };
        }

        console.log(chalk.cyan('\n🔔 A new version of Echo is available!\n'));
        console.log(`  Current: ${chalk.yellow(updateInfo.current)}`);
        console.log(`  Latest:  ${chalk.green(updateInfo.latest)}\n`);

        const { shouldUpdate } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'shouldUpdate',
                message: 'Would you like to update now?',
                default: true
            }
        ]);

        if (shouldUpdate) {
            return await this.performUpdate();
        } else {
            console.log(chalk.gray('\nUpdate skipped. You can update later with: ') + chalk.cyan('echo update\n'));
            return { success: false, reason: 'User declined' };
        }
    }
}

module.exports = UpdateManager;

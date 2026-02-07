const ConfigManager = require('./config-manager');
const chalk = require('chalk');
const inquirer = require('inquirer');

const config = new ConfigManager();

async function uninstall() {
    console.log(chalk.red('⚠️  Uninstalling Echo AI Agent Configuration'));
    
    const answers = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'deleteConfig',
            message: 'Do you want to delete all configuration files and preferences?',
            default: false
        }
    ]);

    if (answers.deleteConfig) {
        config.clear();
        console.log(chalk.green('✓ Configuration cleared.'));
    } else {
        console.log(chalk.yellow('ℹ️  Configuration preserved.'));
    }
    
    console.log(chalk.cyan('\nEcho AI Agent has been uninstalled from your system.'));
    console.log(chalk.gray('If you installed it globally, you can remove the package with:'));
    console.log(chalk.white('npm uninstall -g echo-ai-agent'));
}

// Only run if called directly
if (require.main === module) {
    uninstall();
}

module.exports = uninstall;

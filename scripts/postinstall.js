const chalk = require('chalk');

const { getLogo } = require('../utils/branding');

function postInstall() {
    console.log('\n');
    console.log(getLogo());
    console.log(chalk.gray('              Premium Desktop Assistant v1.0.5             '));
    console.log('\n');
    
    console.log(chalk.green.bold('  ✓ Installation Successful!'));
    console.log(chalk.gray('  Welcome to the future of desktop automation.'));
    
    console.log('\n' + chalk.yellow.bold('  👉 NEXT STEP: SETUP'));
    console.log(chalk.white('  To configure your API key, theme, and startup preferences, run:'));
    console.log('\n      ' + chalk.bgCyan.black.bold(' echo setup ') + '\n');
    
    console.log(chalk.white('  Then launch Echo with:'));
    console.log('      ' + chalk.cyan('echo start') + '\n');
    
    console.log(chalk.gray('  Need help? Run ') + chalk.white('echo --help') + '\n');
}

if (require.main === module) {
    postInstall();
}

module.exports = postInstall;

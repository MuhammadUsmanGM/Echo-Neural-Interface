const chalk = require('chalk');

function postInstall() {
    console.log('\n');
    console.log(chalk.cyan('╔═══════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║                                                               ║'));
    console.log(chalk.cyan('║') + chalk.bold.white('                    ECHO AI AGENT                          ') + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.gray('              Premium Desktop Assistant v1.0.0             ') + chalk.cyan('║'));
    console.log(chalk.cyan('║                                                               ║'));
    console.log(chalk.cyan('╚═══════════════════════════════════════════════════════════════╝'));
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

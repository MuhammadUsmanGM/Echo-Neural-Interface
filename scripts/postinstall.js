const chalk = require('chalk');
const ora = require('ora');

const spinner = ora({
  text: 'Setting up Echo AI Agent...',
  color: 'cyan'
});

async function postInstall() {
  try {
    spinner.start();
    
    // Simulate setup tasks
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    spinner.succeed('Echo AI Agent installed successfully!');
    
    console.log(chalk.cyan('\n╔═══════════════════════════════════════╗'));
    console.log(chalk.cyan('║') + '     ' + chalk.bold.white('ECHO AI AGENT') + '                ' + chalk.cyan('║'));
    console.log(chalk.cyan('║') + '     ' + chalk.gray('Your JARVIS-like Assistant') + '      ' + chalk.cyan('║'));
    console.log(chalk.cyan('╚═══════════════════════════════════════╝\n'));
    
    console.log(chalk.green('✓ Installation complete!\n'));
    console.log(chalk.bold('Quick Start:\n'));
    console.log('  1. Run setup wizard:  ' + chalk.cyan('echo setup'));
    console.log('  2. Launch Echo:       ' + chalk.cyan('echo start'));
    console.log('  3. Get help:          ' + chalk.cyan('echo --help\n'));
    
    console.log(chalk.gray('Need an API key? Get one free at: ') + chalk.blue('https://aistudio.google.com/\n'));
    
  } catch (error) {
    spinner.fail('Installation encountered an issue');
    console.error(chalk.red(error.message));
  }
}

// Only run if called directly (not when required as module)
if (require.main === module) {
  postInstall();
}

module.exports = postInstall;

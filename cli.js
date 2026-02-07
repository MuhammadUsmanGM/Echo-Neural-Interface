#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const packageJson = require('./package.json');
const setupWizard = require('./scripts/setup-wizard');
const ConfigManager = require('./scripts/config-manager');

const config = new ConfigManager();

// ASCII Art Banner
const banner = `
${chalk.cyan('╔═══════════════════════════════════════╗')}
${chalk.cyan('║')}     ${chalk.bold.white('ECHO AI AGENT')}                ${chalk.cyan('║')}
${chalk.cyan('║')}     ${chalk.gray('Your JARVIS-like Assistant')}      ${chalk.cyan('║')}
${chalk.cyan('╚═══════════════════════════════════════╝')}
`;

program
  .name('echo')
  .description('A premium JARVIS-inspired AI assistant for your desktop')
  .version(packageJson.version);

program
  .command('start')
  .description('Launch Echo AI Agent')
  .option('-d, --debug', 'Run in debug mode')
  .action((options) => {
    console.log(banner);
    
    // Check if configured
    if (!config.get('configured')) {
      console.log(chalk.yellow('⚠️  Echo is not configured yet. Running setup wizard...\n'));
      setupWizard.run().then(() => {
        launchEcho(options.debug);
      });
    } else {
      launchEcho(options.debug);
    }
  });

program
  .command('setup')
  .description('Run the interactive setup wizard')
  .action(async () => {
    console.log(banner);
    await setupWizard.run();
  });

program
  .command('config')
  .description('Manage Echo configuration')
  .option('-l, --list', 'List all configuration')
  .option('-s, --set <key> <value>', 'Set a configuration value')
  .option('-g, --get <key>', 'Get a configuration value')
  .option('-r, --reset', 'Reset to default configuration')
  .action((options) => {
    if (options.list) {
      console.log(chalk.cyan('\n📋 Current Configuration:\n'));
      const allConfig = config.store;
      Object.keys(allConfig).forEach(key => {
        console.log(`  ${chalk.bold(key)}: ${chalk.gray(JSON.stringify(allConfig[key]))}`);
      });
    } else if (options.set) {
      const [key, value] = options.set;
      config.set(key, value);
      console.log(chalk.green(`✓ Set ${key} = ${value}`));
    } else if (options.get) {
      const value = config.get(options.get);
      console.log(chalk.cyan(`${options.get}: ${value}`));
    } else if (options.reset) {
      config.clear();
      console.log(chalk.green('✓ Configuration reset to defaults'));
    } else {
      console.log(chalk.yellow('Use --list, --set, --get, or --reset'));
    }
  });

program
  .command('themes')
  .description('List available themes')
  .action(() => {
    console.log(chalk.cyan('\n🎨 Available Themes:\n'));
    const themes = {
      'cyan': { color: '#00f2ff', description: 'Classic JARVIS (Default)' },
      'purple': { color: '#a855f7', description: 'Royal Purple' },
      'green': { color: '#00ff88', description: 'Matrix Green' },
      'gold': { color: '#ffd700', description: 'Iron Man Gold' },
      'red': { color: '#ff0055', description: 'Cyberpunk Red' },
      'blue': { color: '#0088ff', description: 'Ocean Blue' }
    };
    
    Object.keys(themes).forEach(name => {
      const theme = themes[name];
      console.log(`  ${chalk.hex(theme.color)('●')} ${chalk.bold(name)} - ${chalk.gray(theme.description)}`);
    });
    
    console.log(chalk.gray('\nUse: echo config --set theme <name>'));
  });

const { execSync } = require('child_process');

program
  .command('info')
  .description('Display system and Echo information')
  .action(() => {
    console.log(banner);
    console.log(chalk.cyan('📊 System Information:\n'));
    console.log(`  ${chalk.bold('Version:')} ${packageJson.version}`);
    console.log(`  ${chalk.bold('Node:')} ${process.version}`);
    console.log(`  ${chalk.bold('Platform:')} ${process.platform}`);
    console.log(`  ${chalk.bold('Architecture:')} ${process.arch}`);
    console.log(`  ${chalk.bold('Configured:')} ${config.get('configured') ? chalk.green('Yes') : chalk.red('No')}`);
    console.log(`  ${chalk.bold('Theme:')} ${config.get('theme') || 'cyan'}`);
    console.log(`  ${chalk.bold('API Key Set:')} ${config.get('apiKey') ? chalk.green('Yes') : chalk.red('No')}`);

    // Simple update check
    try {
        const latest = execSync(`npm view ${packageJson.name} version`, { encoding: 'utf8' }).trim();
        if (latest && latest !== packageJson.version) {
            console.log(chalk.yellow(`\n⚠️  Update available: ${latest} (Current: ${packageJson.version})`));
            console.log(chalk.white(`   Run `) + chalk.cyan(`npm install -g ${packageJson.name}`) + chalk.white(` to update.`));
        } else {
            console.log(chalk.green('\n✓ You are using the latest version.'));
        }
    } catch (e) {
        // Ignore network errors during update check
    }
  });

// Default action (no command)
program.action(() => {
  console.log(banner);
  console.log(chalk.gray('Run ') + chalk.cyan('echo start') + chalk.gray(' to launch Echo'));
  console.log(chalk.gray('Run ') + chalk.cyan('echo --help') + chalk.gray(' for more commands\n'));
});

program.parse(process.argv);

// If no arguments provided, show banner and help
if (!process.argv.slice(2).length) {
  console.log(banner);
  console.log(chalk.gray('Run ') + chalk.cyan('echo start') + chalk.gray(' to launch Echo'));
  console.log(chalk.gray('Run ') + chalk.cyan('echo --help') + chalk.gray(' for more commands\n'));
}

function launchEcho(debug = false) {
  console.log(chalk.cyan('🚀 Launching Echo...\n'));
  
  const electronPath = require('electron');
  const appPath = path.join(__dirname, 'main', 'main.js');
  
  const args = [appPath];
  if (debug) args.push('--inspect');
  
  const child = spawn(electronPath, args, {
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  child.on('close', (code) => {
    if (code !== 0) {
      console.log(chalk.red(`\n❌ Echo exited with code ${code}`));
    }
  });
}

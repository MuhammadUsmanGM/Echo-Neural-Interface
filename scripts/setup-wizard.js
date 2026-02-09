const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const ConfigManager = require('./config-manager');

const config = new ConfigManager();

async function run() {
  console.log(chalk.cyan.bold('\n🔧 Echo Setup Wizard\n'));
  console.log(chalk.gray('Let\'s configure your AI assistant...\n'));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'apiKey',
      message: 'Enter your Google Gemini API Key (Get one at https://aistudio.google.com/):',
      validate: (input) => {
        if (!input || input.trim().length === 0) {
          return 'API Key is required. Get one from https://aistudio.google.com/';
        }
        return true;
      }
    },
    {
      type: 'list',
      name: 'theme',
      message: 'Choose your theme:',
      choices: [
        { name: chalk.cyan('● Cyan (Classic JARVIS)'), value: 'cyan' },
        { name: chalk.hex('#a855f7')('● Purple (Royal)'), value: 'purple' },
        { name: chalk.green('● Green (Matrix)'), value: 'green' },
        { name: chalk.hex('#ffd700')('● Gold (Iron Man)'), value: 'gold' },
        { name: chalk.red('● Red (Cyberpunk)'), value: 'red' },
        { name: chalk.blue('● Blue (Ocean)'), value: 'blue' }
      ],
      default: 'cyan'
    },
    {
      type: 'list',
      name: 'position',
      message: 'Where should Echo appear on your screen?',
      choices: [
        { name: 'Bottom Right (Recommended)', value: 'bottom-right' },
        { name: 'Bottom Left', value: 'bottom-left' },
        { name: 'Top Right', value: 'top-right' },
        { name: 'Top Left', value: 'top-left' },
        { name: 'Center', value: 'center' }
      ],
      default: 'bottom-right'
    },
    {
      type: 'list',
      name: 'size',
      message: 'Choose window size:',
      choices: [
        { name: 'Small (250x350)', value: 'small' },
        { name: 'Medium (350x450) - Recommended', value: 'medium' },
        { name: 'Large (450x550)', value: 'large' }
      ],
      default: 'medium'
    },
    {
      type: 'confirm',
      name: 'alwaysOnTop',
      message: 'Keep Echo always on top of other windows?',
      default: true
    },
    {
      type: 'confirm',
      name: 'startOnBoot',
      message: 'Start Echo automatically when you log in?',
      default: false
    },
    {
      type: 'list',
      name: 'voiceProvider',
      message: 'How would you like to handle voice recognition?',
      choices: [
        { name: 'Browser Built-in (Fastest, requires online)', value: 'browser' },
        { name: 'Whisper (Local, High Accuracy, requires Python)', value: 'whisper' }
      ],
      default: 'browser'
    }
  ]);

  // Whisper Configuration Logic
  if (answers.voiceProvider === 'whisper') {
    const { execSync } = require('child_process');
    let hasWhisper = false;
    
    try {
        // Check if whisper is installed
        execSync('whisper --help', { stdio: 'ignore' });
        hasWhisper = true;
    } catch (e) {
        hasWhisper = false;
    }

    if (!hasWhisper) {
        console.log(chalk.yellow('\n⚠️  Whisper not found on your system.'));
        const installWhisper = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'install',
                message: 'Do you want to download and install OpenAI Whisper via pip now?',
                default: true
            }
        ]);

        if (installWhisper.install) {
            console.log(chalk.cyan('\n⬇️  Installing OpenAI Whisper... (This may take a moment)'));
            try {
                execSync('pip install openai-whisper', { stdio: 'inherit' });
                console.log(chalk.green('✓ Whisper installed successfully!'));
                hasWhisper = true;
            } catch (err) {
                console.log(chalk.red('❌ Failed to install Whisper. Please ensure Python and pip are installed and in your PATH.'));
                console.log(chalk.gray('Falling back to Browser Voice API.'));
                answers.voiceProvider = 'browser';
            }
        } else {
            console.log(chalk.gray('Falling back to Browser Voice API.'));
            answers.voiceProvider = 'browser';
        }
    }

    if (hasWhisper) {
        const whisperStartup = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'startup',
                message: 'Do you want Whisper to start automatically when Echo starts?',
                default: true
            }
        ]);
        config.set('whisperStartup', whisperStartup.startup);
    }
  }

  // Save configuration
  config.set('apiKey', answers.apiKey);
  config.set('theme', answers.theme);
  config.set('position', answers.position);
  config.set('size', answers.size);
  config.set('alwaysOnTop', answers.alwaysOnTop);
  config.set('startOnBoot', answers.startOnBoot);
  config.set('voiceProvider', answers.voiceProvider);
  config.set('configured', true);

  // Create/update .env file
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = `GOOGLE_AI_API_KEY=${answers.apiKey}\n`;
  fs.writeFileSync(envPath, envContent);

  console.log(chalk.green('\n✓ Configuration saved successfully!'));
  console.log(chalk.gray('\nYou can change these settings anytime with:'));
  console.log(chalk.cyan('  echo config --list'));
  console.log(chalk.cyan('  echo setup\n'));
}

module.exports = { run };

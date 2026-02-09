const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const ConfigManager = require('./config-manager');
const AI_MODELS = require('./ai-models');

const { printLogo } = require('../utils/branding');

const config = new ConfigManager();

async function run() {
  printLogo();
  console.log(chalk.gray('  Configure your AI brain and start your journey...\n'));

  // 1. Select AI Provider
  const { provider } = await inquirer.prompt([
    {
      type: 'list',
      name: 'provider',
      message: 'Select your AI Provider:',
      choices: [
        { name: 'Google Gemini (Free tier available)', value: 'google' },
        { name: 'OpenAI (GPT-4o)', value: 'openai' },
        { name: 'Anthropic (Claude)', value: 'anthropic' },
        { name: 'DeepSeek (Affordable & Powerful)', value: 'deepseek' }
      ]
    }
  ]);

  // 2. Enter API Key
  const { apiKey } = await inquirer.prompt([
    {
      type: 'input',
      name: 'apiKey',
      message: `Enter your ${AI_MODELS[provider].name} API Key:`,
      validate: (input) => input.trim() ? true : 'API Key is required.'
    }
  ]);

  // 3. Personalization
  const { userName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'userName',
      message: 'What should Echo call you?',
      default: config.get('userName') || 'Friend'
    }
  ]);

  // 4. Select Voice Engine
  console.log(chalk.cyan('\n🎙️  Voice Intelligence'));
  const { voiceProvider } = await inquirer.prompt([
    {
      type: 'list',
      name: 'voiceProvider',
      message: 'Select Voice Recognition Engine:',
      choices: [
        { name: '🌐 Browser API (Native, Fast, Free)', value: 'browser' },
        { name: '☁️  Whisper Cloud (Top Accuracy, OpenAI Key required)', value: 'whisper' },
        { name: '🏠 Whisper Local (Privacy, One-time Setup)', value: 'whisper-local' }
      ],
      default: config.get('voiceProvider') || 'browser'
    }
  ]);

  // 5. Startup Preference
  const { startOnBoot } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'startOnBoot',
      message: 'Launch Echo automatically on system startup?',
      default: false
    }
  ]);

  const apiKeys = config.get('apiKeys') || {};
  apiKeys[provider] = apiKey;

  // Handle Whisper Cloud specific requirements
  if (voiceProvider === 'whisper' && !apiKeys.openai) {
    console.log(chalk.yellow('\n⚠️  Whisper Cloud requires an OpenAI API key.'));
    const { whisperKey } = await inquirer.prompt([
      {
        type: 'input',
        name: 'whisperKey',
        message: 'Enter your OpenAI API Key:',
        validate: (input) => input.trim() ? true : 'Key is required for Whisper.'
      }
    ]);
    apiKeys.openai = whisperKey;
  }

  // Save AI & User Configuration
  config.set('apiKeys', apiKeys);
  config.set('aiProvider', provider);
  config.set('model', AI_MODELS[provider].defaultModel);
  config.set('userName', userName);
  config.set('voiceProvider', voiceProvider);
  config.set('startOnBoot', startOnBoot);
  config.set('configured', true);

  // Auto-enable core plugins
  const PluginManager = require('./plugin-manager');
  const pm = new PluginManager();
  const allPlugins = pm.listPlugins();
  
  if (allPlugins.length > 0) {
    const defaults = ['example-plugin', 'productivity-plugin', 'system-control-plugin', 'workflow-plugin'];
    const toEnable = defaults.filter(d => allPlugins.some(p => p.name === d));
    config.set('plugins', toEnable);
  }

  // Create/update .env for backward compatibility with Gemini service
  if (provider === 'google') {
    const envPath = path.join(__dirname, '..', '.env');
    fs.writeFileSync(envPath, `GOOGLE_AI_API_KEY=${apiKey}\n`);
  }

  console.log(chalk.green('\n✓ Echo configured successfully!'));
  console.log(chalk.white(`  Brain Provider: ${AI_MODELS[provider].name}`));
  console.log(chalk.white(`  Voice Engine:   ${voiceProvider.charAt(0).toUpperCase() + voiceProvider.slice(1)}`));
  console.log(chalk.white(`  Start on Boot:  ${startOnBoot ? 'Enabled' : 'Disabled'}`));
  
  console.log(chalk.gray('\nFor themes, voice settings, and workflows, run:'));
  console.log(chalk.cyan('  echo config'));
  console.log(chalk.gray(`Your Echo awaits, ${userName}.\n`));

  // Final Action: Launch everything!
  const { spawn } = require('child_process');
  
  // 3. Setup Local Whisper if selected
  if (voiceProvider === 'whisper-local') {
    try {
      const { setup: setupWhisper } = require('./whisper-setup');
      console.log(chalk.yellow('🏠 Initializing Local Whisper environment...'));
      await setupWhisper();
    } catch (e) {
      console.log(chalk.red('❌ Local Whisper setup failed. Please run manually: echo startup'));
    }
  }

  // 1. Launch Documentation Hub
  try {
    const { startServer } = require('./docs-server');
    console.log(chalk.yellow('🚀 Launching Echo Documentation Hub...'));
    startServer();
  } catch (e) {}

  // 2. Launch Echo Agent UI (Electron)
  setTimeout(() => {
    console.log(chalk.cyan('✨ Initializing Holographic Neural Interface...'));
    const electron = require('electron');
    // Using electron from node_modules if possible, otherwise rely on system
    const electronExecutable = process.platform === 'win32' ? 'electron.cmd' : 'electron';
    const mainPath = path.join(__dirname, '..', 'main', 'main.js');
    
    const child = spawn(electronExecutable, [mainPath], {
      detached: true,
      stdio: 'ignore',
      shell: true // Required for .cmd on Windows
    });
    child.unref();
  }, 1500);
}

module.exports = { run };

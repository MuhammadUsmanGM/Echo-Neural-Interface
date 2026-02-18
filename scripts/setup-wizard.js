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
  console.log(chalk.yellow('  💡 Navigation: Use ↑↓ arrows to move, Enter to select/edit, Tab to skip\n'));

  // Collect all configuration in one flow
  const setupConfig = {
    provider: null,
    apiKey: null,
    model: null,
    userName: null,
    voiceProvider: null,
    whisperKey: null,
    startOnBoot: false,
    plugins: []
  };

  // ========== STEP 1: AI Provider Selection ==========
  console.log(chalk.cyan.bold('🧠 AI Intelligence Provider\n'));
  const { provider } = await inquirer.prompt([
    {
      type: 'list',
      name: 'provider',
      message: 'Select your AI Provider:',
      choices: [
        {
          name: '🟢 Google Gemini  (Free tier, Fast, Multimodal)',
          value: 'google',
          short: 'Google Gemini'
        },
        {
          name: '🔵 OpenAI  (GPT-4o, Most Popular)',
          value: 'openai',
          short: 'OpenAI'
        },
        {
          name: '🟣 Anthropic  (Claude, Best for Reasoning)',
          value: 'anthropic',
          short: 'Anthropic'
        },
        {
          name: '🔷 DeepSeek  (Affordable & Powerful)',
          value: 'deepseek',
          short: 'DeepSeek'
        }
      ],
      pageSize: 4,
      loop: false
    }
  ]);
  setupConfig.provider = provider;

  // ========== STEP 2: API Key ==========
  console.log(chalk.cyan.bold('\n🔑 API Credentials\n'));
  const providerName = AI_MODELS[provider].name;
  const apiKeyInstructions = AI_MODELS[provider].apiKeyUrl || `Get your API key from ${providerName}`;

  console.log(chalk.yellow(`  ℹ️  ${apiKeyInstructions}\n`));

  const { apiKey } = await inquirer.prompt([
    {
      type: 'password',
      name: 'apiKey',
      message: `Enter your ${providerName} API Key:`,
      validate: (input) => {
        if (!input.trim()) return 'API Key is required.';
        if (input.trim().length < 10) return 'API Key seems too short. Please check.';
        return true;
      }
    }
  ]);
  setupConfig.apiKey = apiKey;

  // ========== STEP 3: Model Selection ==========
  console.log(chalk.cyan.bold('\n🤖 AI Model\n'));
  const models = AI_MODELS[provider].models;
  const { model } = await inquirer.prompt([
    {
      type: 'list',
      name: 'model',
      message: `Select ${providerName} Model:`,
      choices: models.map(m => ({
        name: m.name + chalk.gray(` - ${m.description || 'Default model'}`),
        value: m.id,
        short: m.name
      })),
      default: models.findIndex(m => m.id === AI_MODELS[provider].defaultModel) || 0,
      pageSize: Math.min(models.length, 8),
      loop: false
    }
  ]);
  setupConfig.model = model;

  // ========== STEP 4: Personalization ==========
  console.log(chalk.cyan.bold('\n👤 Personalization\n'));
  const { userName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'userName',
      message: 'What should Echo call you?',
      default: config.get('userName') || 'Friend',
      validate: (input) => input.trim() ? true : 'Name cannot be empty.'
    }
  ]);
  setupConfig.userName = userName;

  // ========== STEP 5: Voice Engine ==========
  console.log(chalk.cyan.bold('\n🎙️  Voice Recognition\n'));
  const { voiceProvider } = await inquirer.prompt([
    {
      type: 'list',
      name: 'voiceProvider',
      message: 'Select Voice Recognition Engine:',
      choices: [
        {
          name: '🌐 Browser API  (Native, Fast, Free - Recommended)',
          value: 'browser',
          short: 'Browser API'
        },
        {
          name: '☁️  Whisper Cloud  (Best Accuracy, Needs OpenAI Key)',
          value: 'whisper',
          short: 'Whisper Cloud'
        },
        {
          name: '🏠 Whisper Local  (Privacy-Focused, Offline)',
          value: 'whisper-local',
          short: 'Whisper Local'
        }
      ],
      default: config.get('voiceProvider') || 'browser',
      pageSize: 3,
      loop: false
    }
  ]);
  setupConfig.voiceProvider = voiceProvider;

  // Handle Whisper Cloud API Key if needed
  if (voiceProvider === 'whisper') {
    const existingKeys = config.get('apiKeys') || {};
    if (!existingKeys.openai) {
      console.log(chalk.yellow('\n⚠️  Whisper Cloud requires an OpenAI API key.\n'));
      const { openaiKey } = await inquirer.prompt([
        {
          type: 'password',
          name: 'openaiKey',
          message: 'Enter your OpenAI API Key:',
          validate: (input) => {
            if (!input.trim()) return 'API Key is required.';
            if (input.trim().length < 10) return 'API Key seems too short.';
            return true;
          }
        }
      ]);
      setupConfig.whisperKey = openaiKey;
    }
  }

  // ========== STEP 6: Startup Preference ==========
  console.log(chalk.cyan.bold('\n🚀 Startup Settings\n'));
  const { startOnBoot } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'startOnBoot',
      message: 'Launch Echo automatically when you log in?',
      default: false
    }
  ]);
  setupConfig.startOnBoot = startOnBoot;

  // ========== STEP 7: Plugin Selection ==========
  console.log(chalk.cyan.bold('\n🧩 Plugins\n'));
  const PluginManager = require('./plugin-manager');
  const pm = new PluginManager();
  const allPlugins = pm.listPlugins();

  if (allPlugins.length > 0) {
    const { plugins } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'plugins',
        message: 'Enable Plugins (Space to toggle, Enter to confirm):',
        choices: allPlugins.map(p => ({
          name: `${p.name} - ${p.description || 'Plugin'}`,
          value: p.name,
          checked: ['example-plugin', 'productivity-plugin', 'system-control-plugin', 'workflow-plugin'].includes(p.name)
        })),
        pageSize: Math.min(allPlugins.length, 8)
      }
    ]);
    setupConfig.plugins = plugins;
  }

  // ========== Save Configuration ==========
  console.log(chalk.cyan.bold('\n💾 Saving Configuration...\n'));

  const apiKeys = config.get('apiKeys') || {};
  apiKeys[setupConfig.provider] = setupConfig.apiKey;
  if (setupConfig.whisperKey) {
    apiKeys.openai = setupConfig.whisperKey;
  }

  config.set('apiKeys', apiKeys);
  config.set('aiProvider', setupConfig.provider);
  config.set('model', setupConfig.model);
  config.set('userName', setupConfig.userName);
  config.set('voiceProvider', setupConfig.voiceProvider);
  config.set('startOnBoot', setupConfig.startOnBoot);
  config.set('plugins', setupConfig.plugins);
  config.set('configured', true);

  // Create/update .env for backward compatibility
  if (setupConfig.provider === 'google') {
    const envPath = path.join(__dirname, '..', '.env');
    fs.writeFileSync(envPath, `GOOGLE_AI_API_KEY=${setupConfig.apiKey}\n`);
  }

  // ========== Summary ==========
  console.log(chalk.green.bold('\n✅ Configuration Complete!\n'));
  console.log(chalk.white('  ┌─────────────────────────────────────────┐'));
  console.log(chalk.white('  │  📊 Configuration Summary              │'));
  console.log(chalk.white('  ├─────────────────────────────────────────┤'));
  console.log(chalk.white(`  │  🧠 AI Provider:    ${chalk.cyan(providerName.padEnd(22))}│`));
  console.log(chalk.white(`  │  🤖 Model:          ${chalk.cyan(setupConfig.model.padEnd(22))}│`));
  console.log(chalk.white(`  │  👤 Your Name:      ${chalk.cyan(setupConfig.userName.padEnd(22))}│`));
  console.log(chalk.white(`  │  🎙️  Voice Engine:   ${chalk.cyan(setupConfig.voiceProvider.padEnd(22))}│`));
  console.log(chalk.white(`  │  🚀 Startup:        ${chalk.cyan((setupConfig.startOnBoot ? 'Auto-start' : 'Manual').padEnd(22))}│`));
  console.log(chalk.white(`  │  🧩 Plugins:        ${chalk.cyan(setupConfig.plugins.length.toString().padEnd(22))}│`));
  console.log(chalk.white('  └─────────────────────────────────────────┘'));

  console.log(chalk.gray('\n✨ Echo is ready to serve you!\n'));
  console.log(chalk.gray('  Additional settings available via:'));
  console.log(chalk.cyan('    echo-ai config'));
  console.log(chalk.cyan('    echo-ai themes'));
  console.log(chalk.cyan('    echo-ai workflows\n'));

  // ========== Launch Echo ==========
  const { spawn } = require('child_process');

  // Setup Local Whisper if selected
  if (setupConfig.voiceProvider === 'whisper-local') {
    try {
      const { setup: setupWhisper } = require('./whisper-setup');
      console.log(chalk.yellow('🏠 Initializing Local Whisper environment...'));
      await setupWhisper();
    } catch (e) {
      console.log(chalk.red('❌ Local Whisper setup failed. Configure manually via: echo-ai config'));
    }
  }

  // Launch Documentation Hub
  try {
    const { startServer } = require('./docs-server');
    console.log(chalk.yellow('📚 Launching Echo Documentation Hub...'));
    startServer();
  } catch (e) {}

  // Launch Echo Agent UI
  setTimeout(() => {
    console.log(chalk.cyan('✨ Initializing Holographic Neural Interface...\n'));
    const electron = require('electron');
    const electronExecutable = process.platform === 'win32' ? 'electron.cmd' : 'electron';
    const mainPath = path.join(__dirname, '..', 'main', 'main.js');

    const child = spawn(electronExecutable, [mainPath], {
      detached: true,
      stdio: 'ignore',
      shell: true
    });
    child.unref();
  }, 1500);
}

module.exports = { run };

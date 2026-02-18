#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const packageJson = require('./package.json');
const setupWizard = require('./scripts/setup-wizard');
const ConfigManager = require('./scripts/config-manager');

const { getLogo } = require('./utils/branding');

const config = new ConfigManager();

// ASCII Art Banner
const banner = getLogo();

program
  .name('echo-ai')
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
  .option('--clear-memory', 'Clear all conversation memory')
  .option('--enable-startup', 'Enable Echo start on boot')
  .option('--disable-startup', 'Disable Echo start on boot')
  .action(async (options) => {
    const listConfig = () => {
      console.log(chalk.cyan('\n📋 Current Configuration:\n'));
      const c = config.store;

      console.log(chalk.yellow('🎨 Appearance'));
      console.log(`  ${chalk.bold('Theme:')} ${c.theme || 'default'} ${chalk.hex(config.getThemeColors(c.theme).core)('●')}`);
      console.log(`  ${chalk.bold('Window Size:')} ${c.size || 'medium'}`);
      console.log(`  ${chalk.bold('Position:')} ${c.position || 'bottom-right'}`);
      console.log(`  ${chalk.bold('Always on Top:')} ${c.alwaysOnTop ? chalk.green('Yes') : chalk.red('No')}`);
      
      console.log(chalk.yellow('\n🔊 System'));
      console.log(`  ${chalk.bold('Start on Boot:')} ${c.startOnBoot ? chalk.green('Enabled') : chalk.gray('Disabled')}`);
      console.log(`  ${chalk.bold('Memory:')} ${c.memoryEnabled !== false ? chalk.green('Enabled') : chalk.red('Disabled')}`);
      
      console.log(chalk.yellow('\n👤 Personalization'));
      console.log(`  ${chalk.bold('Echo calls you:')} ${c.userName || 'Friend'}`);

      console.log(chalk.yellow('\n🤖 AI Intelligence'));
      const AI_MODELS = require('./scripts/ai-models');
      const provider = c.aiProvider || 'google';
      const providerName = AI_MODELS[provider] ? AI_MODELS[provider].name : provider;
      console.log(`  ${chalk.bold('Provider:')} ${providerName}`);
      console.log(`  ${chalk.bold('Active Model:')} ${c.model || 'Default'}`);
      
      console.log(chalk.yellow('\n🔑 Credentials'));
      const apiKeys = c.apiKeys || {};
      const currentKey = apiKeys[provider] || '(Not Set)';
      const maskedKey = currentKey.length > 8 ? `${currentKey.substring(0, 4)}...${currentKey.substring(currentKey.length - 4)}` : currentKey;
      console.log(`  ${chalk.bold('API Key:')} ${maskedKey}`);
      
      console.log(chalk.yellow('\n🧩 Plugins'));
      if (c.plugins && c.plugins.length > 0) {
        c.plugins.forEach(p => console.log(`  - ${p}`));
      } else {
        console.log(chalk.gray('  (No plugins installed)'));
      }
      console.log('');
    };

    if (options.list) {
      listConfig();
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
    } else if (options.clearMemory) {
      const MemoryManager = require('./scripts/memory-manager');
      const memory = new MemoryManager();
      memory.clearMemory();
      console.log(chalk.green('✓ All conversational memory has been cleared, sir.'));
    } else if (options.enableStartup) {
      config.set('startOnBoot', true);
      console.log(chalk.green('✓ Echo will now start automatically on boot.'));
    } else if (options.disableStartup) {
      config.set('startOnBoot', false);
      console.log(chalk.yellow('⚠️  Echo will no longer start on boot.'));
    } else {
      // Interactive Mode
      const { default: inquirer } = require('inquirer');

      const mainMenu = async () => {
        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'Echo Configuration Management:',
            pageSize: 10,
            choices: [
              { name: '📋 View Status', value: 'list' },
              { name: '🎨 Appearance Settings', value: 'appearance' },
              { name: '👤 Personalization', value: 'personalization' },
              { name: '🤖 AI Intelligence', value: 'ai' },
              { name: '🎙️  Voice Settings', value: 'voice' },
              { name: '📚 Documentation Hub', value: 'docs' },
              { name: '🧠 Memory Management', value: 'memory' },
              { name: '🧩 Plugin Management', value: 'plugins' },
              { name: '⌨️  Workflow Macros', value: 'workflows' },
              { name: '🚀 Startup Settings', value: 'startup' },
              { name: '🔄 Auto-Update Settings', value: 'autoupdate' },
              { name: '🔔 Notification Settings', value: 'notify' },
              { name: '⚠️  Reset All Settings', value: 'reset' },
              new inquirer.Separator(),
              { name: '❌ Exit', value: 'exit' }
            ]
          }
        ]);

        if (action === 'exit') return;

        switch (action) {
          case 'list':
            listConfig();
            break;
            
          case 'docs':
            const { startServer } = require('./scripts/docs-server');
            startServer();
            return; // Exit config after starting docs as it's a separate process usually
            
          case 'appearance':
            const appAnswers = await inquirer.prompt([
              {
                type: 'list',
                name: 'theme',
                message: 'Select Theme:',
                choices: ['cyan', 'purple', 'green', 'gold', 'red', 'blue'],
                default: config.get('theme')
              },
              {
                type: 'list',
                name: 'size',
                message: 'Window Size:',
                choices: ['small', 'medium', 'large'],
                default: config.get('size')
              }
            ]);
            config.set('theme', appAnswers.theme);
            config.set('size', appAnswers.size);
            console.log(chalk.green('✓ Appearance updated.'));
            break;

          case 'personalization':
            const { newName } = await inquirer.prompt([
              {
                type: 'input',
                name: 'newName',
                message: 'What should Echo call you?',
                default: config.get('userName') || 'Friend'
              }
            ]);
            config.set('userName', newName);
            console.log(chalk.green(`✓ Echo will now call you ${newName}.`));
            break;

          case 'voice':
            const { voiceProvider } = await inquirer.prompt([
              {
                type: 'list',
                name: 'voiceProvider',
                message: 'Select Voice Recognition Engine:',
                choices: [
                  { name: '🌐 Browser API (Fast, Free, No key needed)', value: 'browser' },
                  { name: '☁️  Whisper Cloud (Top-tier, Requires OpenAI key)', value: 'whisper' },
                  { name: '🏠 Whisper Local (Privacy, One-time Setup)', value: 'whisper-local' }
                ],
                default: config.get('voiceProvider') || 'browser'
              }
            ]);
            
            if (voiceProvider === 'whisper' && (!config.get('apiKeys') || !config.get('apiKeys').openai)) {
              console.log(chalk.yellow('\n⚠️  Whisper requires an OpenAI API key.'));
              const { openAIKey } = await inquirer.prompt([
                {
                  type: 'input',
                  name: 'openAIKey',
                  message: 'Enter your OpenAI API Key:',
                  validate: (i) => i.trim() ? true : 'Key is required for Whisper.'
                }
              ]);
              const keys = config.get('apiKeys') || {};
              keys.openai = openAIKey;
              config.set('apiKeys', keys);
            }

            if (voiceProvider === 'whisper-local') {
              const { setup } = require('./scripts/whisper-setup');
              await setup();
            } else {
              config.set('voiceProvider', voiceProvider);
              console.log(chalk.green(`✓ Voice engine set to ${voiceProvider === 'whisper' ? 'Whisper Cloud' : 'Browser API'}.`));
            }
            break;

          case 'memory':
            const memAction = await inquirer.prompt([
              {
                type: 'list',
                name: 'type',
                message: 'Memory Management:',
                choices: [
                  { name: config.get('memoryEnabled') !== false ? '🔴 Disable Memory' : '🟢 Enable Memory', value: 'toggle' },
                  { name: '🗑️  Clear All Memory', value: 'clear' },
                  { name: '⬅️  Back', value: 'back' }
                ]
              }
            ]);
            
            if (memAction.type === 'toggle') {
                const current = config.get('memoryEnabled') !== false;
                config.set('memoryEnabled', !current);
                console.log(chalk.green(`✓ Conversational memory is now ${!current ? 'Enabled' : 'Disabled'}.`));
            } else if (memAction.type === 'clear') {
                const confirm = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'sure',
                        message: chalk.red.bold('Are you absolutely sure? Echo will lose all its personal memory and conversation history about you.'),
                        default: false
                    }
                ]);
                if (confirm.sure) {
                    const MemoryManager = require('./scripts/memory-manager');
                    new MemoryManager().clearMemory();
                    console.log(chalk.green('✓ Local memory has been purified, sir.'));
                }
            }
            break;

          case 'plugins':
            // Redirect to the existing plugins interactive logic
            console.log(chalk.cyan('\nRedirecting to Plugin Manager...'));
            const PluginManager = require('./scripts/plugin-manager');
            const generator = require('./scripts/plugin-generator');
            const pm = new PluginManager();
            const allPlugins = pm.listPlugins();
            
            const { pluginAction } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'pluginAction',
                    message: 'Plugin Management:',
                    choices: [
                        { name: '✅ Toggle Plugins', value: 'toggle' },
                        { name: '🛠️  Create New Plugin', value: 'create' },
                        { name: '⬅️  Back', value: 'back' }
                    ]
                }
            ]);

            if (pluginAction === 'back') break;
            if (pluginAction === 'create') {
                await generator.run();
                break;
            }

            const pluginAnswers = await inquirer.prompt([
                {
                  type: 'checkbox',
                  name: 'enabledPlugins',
                  message: 'Toggle Plugins:',
                  choices: allPlugins.map(p => ({
                    name: `${p.name} (${p.description})`,
                    value: p.name,
                    checked: p.enabled
                  }))
                }
            ]);
            config.set('plugins', pluginAnswers.enabledPlugins);
            console.log(chalk.green('✓ Plugin configuration updated.'));
            case 'startup':
            const currentStartup = config.get('startOnBoot') === true;
            const startupConfirm = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'enable',
                    message: currentStartup ? 'Echo is set to start on boot. Would you like to disable this?' : 'Would you like Echo to start automatically when you log in?',
                    default: !currentStartup
                }
            ]);
            config.set('startOnBoot', currentStartup ? !startupConfirm.enable : startupConfirm.enable);
            console.log(chalk.green(`✓ Startup preference updated.`));
            break;

          case 'ai':
            const AI_MODELS = require('./scripts/ai-models');
            const currentProvider = config.get('aiProvider') || 'google';
            const providerData = AI_MODELS[currentProvider];
            
            if (!providerData) {
                console.log(chalk.red('⚠️ Invalid provider configured. Please run "echo-ai setup".'));
                break;
            }

            const { selectedModel } = await inquirer.prompt([
              {
                type: 'list',
                name: 'selectedModel',
                message: `Select model for ${providerData.name}:`,
                choices: providerData.models.map(m => ({
                    name: m.name + (m.id === config.get('model') ? chalk.green(' (Active)') : ''),
                    value: m.id
                })),
                default: config.get('model')
              }
            ]);
            
            config.set('model', selectedModel);
            console.log(chalk.green(`✓ Active model set to ${selectedModel}.`));
            break;

          case 'reset':
            const resetConfirm = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'sure',
                    message: chalk.red('Reset all settings to factory defaults? (This will NOT clear memory history)'),
                    default: false
                }
            ]);
            if (resetConfirm.sure) {
                config.clear();
                console.log(chalk.green('✓ System reset to defaults.'));
            }
            break;
            
          case 'autoupdate':
            const currentAutoUpdate = config.get('autoUpdateCheck') !== false;
            const autoUpdateConfirm = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'enable',
                    message: currentAutoUpdate 
                        ? 'Auto-update check is enabled. Would you like to disable it?' 
                        : 'Would you like Echo to automatically check for updates on startup?',
                    default: !currentAutoUpdate
                }
            ]);
            config.set('autoUpdateCheck', currentAutoUpdate ? !autoUpdateConfirm.enable : autoUpdateConfirm.enable);
            console.log(chalk.green(`✓ Auto-update check ${currentAutoUpdate && autoUpdateConfirm.enable ? 'disabled' : 'enabled'}.`));
            break;

          case 'notify':
            const currentNotify = config.get('startupNotification') !== false;
            const notifyConfirm = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'enable',
                    message: currentNotify 
                        ? 'Startup notifications are enabled. Would you like to disable them?' 
                        : 'Would you like Echo to notify you when it starts up?',
                    default: !currentNotify
                }
            ]);
            config.set('startupNotification', currentNotify ? !notifyConfirm.enable : notifyConfirm.enable);
            console.log(chalk.green(`✓ Startup notifications ${currentNotify && notifyConfirm.enable ? 'disabled' : 'enabled'}.`));
            break;
            
          case 'workflows':
            const workflowManager = require('./scripts/workflow-manager-cli');
            await workflowManager.run();
            break;
        }

        // Loop back to menu unless exited
        await mainMenu();
      };

      await mainMenu();
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

    console.log(chalk.gray('\nUse: echo-ai config --set theme <name>'));
  });

program
  .command('memory')
  .description('Manage Echo conversational memory')
  .option('-c, --clear', 'Clear all saved memory (history and facts)')
  .option('-e, --enable', 'Enable conversational memory')
  .option('-d, --disable', 'Disable conversational memory')
  .option('-s, --search <query>', 'Search conversation history')
  .action((options) => {
    const MemoryManager = require('./scripts/memory-manager');
    const memory = new MemoryManager();

    if (options.clear) {
      memory.clearMemory();
      console.log(chalk.green('✓ All conversational memory has been cleared, sir.'));
    } else if (options.enable) {
      config.set('memoryEnabled', true);
      console.log(chalk.green('✓ Conversational memory is now enabled.'));
    } else if (options.disable) {
      config.set('memoryEnabled', false);
      console.log(chalk.yellow('⚠️  Conversational memory is now disabled.'));
    } else if (options.search) {
      const results = memory.searchHistory(options.search);
      if (results.length === 0) {
        console.log(chalk.yellow(`No results found for "${options.search}"`));
      } else {
        console.log(chalk.cyan(`\nFound ${results.length} matches for "${options.search}":\n`));
        results.slice(-10).forEach(msg => {
          const role = msg.role === 'user' ? chalk.green('You') : chalk.blue('Echo');
          const time = new Date(msg.timestamp).toLocaleString();
          console.log(`  [${chalk.gray(time)}] ${role}: ${msg.parts[0].text.substring(0, 100)}${msg.parts[0].text.length > 100 ? '...' : ''}`);
        });
        if (results.length > 10) console.log(chalk.gray(`\n...and ${results.length - 10} earlier results.`));
        console.log('');
      }
    } else {
      const enabled = config.get('memoryEnabled') !== false;
      console.log(chalk.cyan('\n🧠 Memory Status:'));
      console.log(`  State: ${enabled ? chalk.green('Enabled') : chalk.red('Disabled')}`);
      console.log(chalk.gray('\nUse --enable, --disable, or --clear to manage memory.\n'));
    }
  });

program
  .command('workflows')
  .description('Manage custom multi-action workflows')
  .action(async () => {
    const workflowManager = require('./scripts/workflow-manager-cli');
    await workflowManager.run();
  });

program
  .command('reminders')
  .alias('schedule')
  .description('Manage scheduled tasks and reminders')
  .option('-l, --list', 'List all scheduled tasks')
  .option('-a, --add <message>', 'Quick add a reminder')
  .option('-t, --time <time>', 'Time for the reminder (use with --add)')
  .action(async (options) => {
    const Scheduler = require('./scripts/scheduler');
    const scheduler = new Scheduler();

    if (options.list) {
      const tasks = scheduler.getTasks();
      if (tasks.length === 0) {
        console.log(chalk.gray('\n  No scheduled tasks.\n'));
        return;
      }

      console.log(chalk.cyan('\n⏰ Scheduled Tasks:\n'));
      tasks.forEach(task => {
        const status = task.enabled ? chalk.green('✓') : chalk.gray('✗');
        const nextRun = task.enabled ? new Date(task.nextRun).toLocaleString() : 'Disabled';
        console.log(`  ${status} ${chalk.bold(task.name)}`);
        console.log(`    ${chalk.gray(`Next: ${nextRun}`)}\n`);
      });
    } else if (options.add) {
      const time = options.time || 'in 1 hour';
      const parsed = scheduler.parseNaturalTime(time);
      
      const task = scheduler.addTask({
        name: `Reminder: ${options.add}`,
        type: 'reminder',
        schedule: parsed.schedule,
        action: options.add,
        recurring: parsed.recurring
      });

      console.log(chalk.green(`\n✓ Reminder set for ${new Date(task.nextRun).toLocaleString()}\n`));
    } else {
      // Interactive mode
      const schedulerCli = require('./scripts/scheduler-cli');
      await schedulerCli.run();
    }
  });


program
  .command('startup')
  .description('Manage Echo start-on-boot settings')
  .option('-e, --enable', 'Enable Echo start on boot')
  .option('-d, --disable', 'Disable Echo start on boot')
  .action((options) => {
    if (options.enable) {
      config.set('startOnBoot', true);
      console.log(chalk.green('✓ Echo will now start automatically when you log in.'));
      console.log(chalk.gray('Note: This takes effect on your next system restart.'));
    } else if (options.disable) {
      config.set('startOnBoot', false);
      console.log(chalk.yellow('⚠️  Echo will no longer start on boot.'));
    } else {
      const enabled = config.get('startOnBoot') === true;
      console.log(chalk.cyan('\n🚀 Startup Status:'));
      console.log(`  Start on Boot: ${enabled ? chalk.green('Enabled') : chalk.gray('Disabled')}`);
      console.log(chalk.gray('\nUse --enable or --disable to change this setting.\n'));
    }
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
            console.log(chalk.white(`   Run `) + chalk.cyan(`echo-ai update`) + chalk.white(` to update.`));
        } else {
            console.log(chalk.green('\n✓ You are using the latest version.'));
        }
    } catch (e) {
        // Ignore network errors during update check
    }
  });

program
  .command('update')
  .description('Update Echo to the latest version')
  .option('--check', 'Only check for updates without installing')
  .action(async (options) => {
    console.log(banner);
    const UpdateManager = require('./scripts/update-manager');
    const updater = new UpdateManager();

    if (options.check) {
      const spinner = require('ora')('Checking for updates...').start();
      const updateInfo = await updater.checkForUpdates();
      
      if (updateInfo.error) {
        spinner.fail(chalk.red('Update check failed: ' + updateInfo.error));
        return;
      }

      spinner.stop();

      if (updateInfo.updateAvailable) {
        console.log(chalk.cyan('\n🔔 Update Available!\n'));
        console.log(`  ${chalk.bold('Current Version:')} ${chalk.yellow(updateInfo.currentVersion)}`);
        console.log(`  ${chalk.bold('Latest Version:')}  ${chalk.green(updateInfo.latestVersion)}`);
        console.log(chalk.gray('\nRun ') + chalk.cyan('echo-ai update') + chalk.gray(' to install.\n'));
      } else {
        console.log(chalk.green(`\n✓ You're already on the latest version (${updateInfo.currentVersion})\n`));
      }
    } else {
      await updater.performUpdate();
    }
  });


program
  .command('docs')
  .description('Launch the Echo local Documentation Hub')
  .action(() => {
    const { startServer } = require('./scripts/docs-server');
    startServer();
  });

program
  .command('plugins')
  .description('Manage Echo plugins')
  .option('-l, --list', 'List all installed plugins')
  .option('-e, --enable <name>', 'Enable a plugin')
  .option('-d, --disable <name>', 'Disable a plugin')
  .option('-c, --create', 'Create a new plugin template')
  .action(async (options) => {
    const PluginManager = require('./scripts/plugin-manager');
    const generator = require('./scripts/plugin-generator');
    const pm = new PluginManager();
    const inquirer = require('inquirer');
    
    if (options.create) {
      await generator.run();
      return;
    }
    
    if (options.list) {
      const plugins = pm.listPlugins();
      console.log(chalk.cyan('\n🧩 Installed Plugins:\n'));
      
      if (plugins.length === 0) {
        console.log(chalk.gray('  No plugins found in the plugins directory.'));
      } else {
        plugins.forEach(p => {
          const status = p.enabled ? chalk.green('Enabled') : chalk.gray('Disabled');
          console.log(`  ${chalk.bold(p.name)} v${p.version} [${status}]`);
          console.log(`  ${chalk.gray(p.description)}`);
          console.log(`  ${chalk.gray('File: ' + p.filename)}\n`);
        });
      }
    } else if (options.enable) {
      if (pm.enablePlugin(options.enable)) {
        console.log(chalk.green(`✓ Plugin '${options.enable}' enabled.`));
      } else {
        console.log(chalk.yellow(`⚠️  Plugin '${options.enable}' is already enabled or not found.`));
      }
    } else if (options.disable) {
      if (pm.disablePlugin(options.disable)) {
        console.log(chalk.green(`✓ Plugin '${options.disable}' disabled.`));
      } else {
        console.log(chalk.yellow(`⚠️  Plugin '${options.disable}' is already disabled or not found.`));
      }
    } else {
      // Interactive Mode
      const allPlugins = pm.listPlugins();
      if (allPlugins.length === 0) {
        console.log(chalk.yellow('\n⚠️  No plugins found in the plugins directory.'));
        console.log(chalk.gray('Drop .js files into the "plugins" folder to extend Echo.\n'));
        return;
      }

      console.log(chalk.cyan('\n🧩 Interactive Plugin Manager'));
      const { choice } = await inquirer.prompt([
        {
          type: 'list',
          name: 'choice',
          message: 'What would you like to do?',
          choices: [
            { name: '✅ Toggle Plugins', value: 'toggle' },
            { name: '🛠️  Create New Plugin', value: 'create' },
            { name: '❌ Cancel', value: 'cancel' }
          ]
        }
      ]);

      if (choice === 'cancel') return;
      if (choice === 'create') {
        await generator.run();
        return;
      }

      const answers = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'enabledPlugins',
          message: 'Select plugins to enable (Space to toggle, Enter to save):',
          choices: allPlugins.map(p => ({
            name: `${p.name} (${p.description})`,
            value: p.name,
            checked: p.enabled
          }))
        }
      ]);

      const ConfigManager = require('./scripts/config-manager');
      const config = new ConfigManager();
      config.set('plugins', answers.enabledPlugins);
      console.log(chalk.green('\n✓ Plugin configuration updated successfully!\n'));
    }
  });

// Default action (no command) - show banner and quick help
program.action(() => {
  console.log(banner);
  console.log(chalk.gray('Run ') + chalk.cyan('echo-ai start') + chalk.gray(' to launch Echo'));
  console.log(chalk.gray('Run ') + chalk.cyan('echo-ai --help') + chalk.gray(' for more commands\n'));
});

program.parse(process.argv);

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

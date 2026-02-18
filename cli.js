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
    // Check if configured
    if (!config.get('configured')) {
      console.log(chalk.yellow('⚠️  Echo is not configured yet. Running setup wizard...\n'));
      setupWizard.run().then(() => {
        launchEcho(options.debug);
      });
    } else {
      console.log(banner);
      launchEcho(options.debug);
    }
  });

program
  .command('setup')
  .description('Run the interactive setup wizard')
  .action(async () => {
    // Logo is printed by setupWizard.run() - no need to print here
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
        console.log(chalk.cyan.bold('\n⚙️  Echo Configuration Management\n'));
        console.log(chalk.gray('  Use ↑↓ arrow keys to navigate, Enter to select\n'));
        
        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'Select an option:',
            pageSize: 12,
            choices: [
              { name: '📋 View Current Configuration', value: 'list', short: 'View Config' },
              { name: '🎨 Appearance Settings', value: 'appearance', short: 'Appearance' },
              { name: '👤 Personalization', value: 'personalization', short: 'Personalization' },
              { name: '🤖 AI Intelligence', value: 'ai', short: 'AI Settings' },
              { name: '🎙️  Voice Settings', value: 'voice', short: 'Voice' },
              { name: '🧠 Memory Management', value: 'memory', short: 'Memory' },
              { name: '🧩 Plugin Management', value: 'plugins', short: 'Plugins' },
              { name: '⌨️  Workflow Macros', value: 'workflows', short: 'Workflows' },
              { name: '🚀 Startup Settings', value: 'startup', short: 'Startup' },
              { name: '🔄 Auto-Update Settings', value: 'autoupdate', short: 'Auto-Update' },
              { name: '🔔 Notification Settings', value: 'notify', short: 'Notifications' },
              new inquirer.Separator('───'),
              { name: '📚 Documentation Hub', value: 'docs', short: 'Docs' },
              { name: '⚠️  Reset All Settings', value: 'reset', short: 'Reset' },
              new inquirer.Separator(),
              { name: '❌ Exit', value: 'exit', short: 'Exit' }
            ],
            loop: false
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
            return;

          case 'appearance':
            console.log(chalk.cyan.bold('\n🎨 Appearance Settings\n'));
            console.log(chalk.gray('  Use ↑↓ arrow keys to navigate, Enter to select\n'));
            const appAnswers = await inquirer.prompt([
              {
                type: 'list',
                name: 'theme',
                message: 'Select Theme:',
                choices: [
                  { name: '🔵 Cyan  (Classic JARVIS)', value: 'cyan', short: 'Cyan' },
                  { name: '🟣 Purple  (Royal)', value: 'purple', short: 'Purple' },
                  { name: '🟢 Green  (Matrix)', value: 'green', short: 'Green' },
                  { name: '🟡 Gold  (Iron Man)', value: 'gold', short: 'Gold' },
                  { name: '🔴 Red  (Cyberpunk)', value: 'red', short: 'Red' },
                  { name: '🔷 Blue  (Ocean)', value: 'blue', short: 'Blue' }
                ],
                default: ['cyan', 'purple', 'green', 'gold', 'red', 'blue'].indexOf(config.get('theme')) || 0,
                pageSize: 6,
                loop: false
              },
              {
                type: 'list',
                name: 'size',
                message: 'Window Size:',
                choices: [
                  { name: '📱 Small  (Compact)', value: 'small', short: 'Small' },
                  { name: '💻 Medium  (Balanced)', value: 'medium', short: 'Medium' },
                  { name: '🖥️  Large  (Full View)', value: 'large', short: 'Large' }
                ],
                default: ['small', 'medium', 'large'].indexOf(config.get('size')) || 1,
                pageSize: 3,
                loop: false
              }
            ]);
            config.set('theme', appAnswers.theme);
            config.set('size', appAnswers.size);
            console.log(chalk.green('\n✓ Appearance updated successfully.'));
            break;

          case 'personalization':
            console.log(chalk.cyan.bold('\n👤 Personalization\n'));
            const { newName } = await inquirer.prompt([
              {
                type: 'input',
                name: 'newName',
                message: 'What should Echo call you?',
                default: config.get('userName') || 'Friend',
                validate: (input) => input.trim() ? true : 'Name cannot be empty.'
              }
            ]);
            config.set('userName', newName);
            console.log(chalk.green(`\n✓ Echo will now call you ${chalk.cyan(newName)}.`));
            break;

          case 'voice':
            console.log(chalk.cyan.bold('\n🎙️  Voice Recognition Settings\n'));
            console.log(chalk.gray('  Use ↑↓ arrow keys to navigate, Enter to select\n'));
            const { voiceProvider } = await inquirer.prompt([
              {
                type: 'list',
                name: 'voiceProvider',
                message: 'Select Voice Recognition Engine:',
                choices: [
                  { name: '🌐 Browser API  (Native, Fast, Free)', value: 'browser', short: 'Browser API' },
                  { name: '☁️  Whisper Cloud  (Best Accuracy, OpenAI Key)', value: 'whisper', short: 'Whisper Cloud' },
                  { name: '🏠 Whisper Local  (Privacy, Offline)', value: 'whisper-local', short: 'Whisper Local' }
                ],
                default: ['browser', 'whisper', 'whisper-local'].indexOf(config.get('voiceProvider')) || 0,
                pageSize: 3,
                loop: false
              }
            ]);

            if (voiceProvider === 'whisper' && (!config.get('apiKeys') || !config.get('apiKeys').openai)) {
              console.log(chalk.yellow('\n⚠️  Whisper Cloud requires an OpenAI API key.\n'));
              const { openAIKey } = await inquirer.prompt([
                {
                  type: 'input',
                  name: 'openAIKey',
                  message: 'Enter your OpenAI API Key:',
                  validate: (i) => i.trim() ? true : 'Key is required for Whisper.',
                  mask: '*'
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
              console.log(chalk.green(`\n✓ Voice engine set to ${voiceProvider === 'whisper' ? 'Whisper Cloud' : 'Browser API'}.`));
            }
            break;

          case 'memory':
            console.log(chalk.cyan.bold('\n🧠 Memory Management\n'));
            console.log(chalk.gray('  Use ↑↓ arrow keys to navigate, Enter to select\n'));
            const memEnabled = config.get('memoryEnabled') !== false;
            const memAction = await inquirer.prompt([
              {
                type: 'list',
                name: 'type',
                message: 'Select Action:',
                choices: [
                  { name: memEnabled ? '🔴 Disable Memory' : '🟢 Enable Memory', value: 'toggle', short: memEnabled ? 'Disable' : 'Enable' },
                  { name: '🗑️  Clear All Memory', value: 'clear', short: 'Clear Memory' },
                  { name: '⬅️  Back', value: 'back', short: 'Back' }
                ],
                pageSize: 3,
                loop: false
              }
            ]);

            if (memAction.type === 'toggle') {
                const current = config.get('memoryEnabled') !== false;
                config.set('memoryEnabled', !current);
                console.log(chalk.green(`\n✓ Conversational memory is now ${!current ? chalk.green('Enabled') : chalk.red('Disabled')}.`));
            } else if (memAction.type === 'clear') {
                const confirm = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'sure',
                        message: chalk.red.bold('⚠️  Are you sure? Echo will lose all memory and conversation history.'),
                        default: false
                    }
                ]);
                if (confirm.sure) {
                    const MemoryManager = require('./scripts/memory-manager');
                    new MemoryManager().clearMemory();
                    console.log(chalk.green('\n✓ All memory has been cleared.'));
                }
            }
            break;

          case 'plugins':
            console.log(chalk.cyan.bold('\n🧩 Plugin Management\n'));
            console.log(chalk.gray('  Use ↑↓ arrow keys to navigate, Enter to select\n'));
            const PluginManager = require('./scripts/plugin-manager');
            const generator = require('./scripts/plugin-generator');
            const pm = new PluginManager();
            const allPlugins = pm.listPlugins();

            const { pluginAction } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'pluginAction',
                    message: 'Select Action:',
                    choices: [
                        { name: '✅ Toggle Plugins', value: 'toggle', short: 'Toggle' },
                        { name: '🛠️  Create New Plugin', value: 'create', short: 'Create' },
                        { name: '⬅️  Back', value: 'back', short: 'Back' }
                    ],
                    pageSize: 3,
                    loop: false
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
                  message: 'Toggle Plugins (Space to select, Enter to confirm):',
                  choices: allPlugins.map(p => ({
                    name: `${p.name} - ${p.description || 'Plugin'}`,
                    value: p.name,
                    checked: p.enabled
                  })),
                  pageSize: Math.min(allPlugins.length, 8)
                }
            ]);
            config.set('plugins', pluginAnswers.enabledPlugins);
            console.log(chalk.green('\n✓ Plugin configuration updated.'));
            break;

          case 'startup':
            const currentStartup = config.get('startOnBoot') === true;
            console.log(chalk.cyan.bold('\n🚀 Startup Settings\n'));
            const startupConfirm = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'enable',
                    message: currentStartup 
                        ? 'Echo is set to start on boot. Would you like to disable this?' 
                        : 'Would you like Echo to start automatically when you log in?',
                    default: !currentStartup
                }
            ]);
            config.set('startOnBoot', currentStartup ? !startupConfirm.enable : startupConfirm.enable);
            console.log(chalk.green(`\n✓ Startup preference: ${currentStartup && startupConfirm.enable ? chalk.red('Disabled') : chalk.green('Enabled')}.`));
            break;

          case 'ai':
            const AI_MODELS = require('./scripts/ai-models');
            const currentProvider = config.get('aiProvider') || 'google';
            const providerData = AI_MODELS[currentProvider];

            if (!providerData) {
                console.log(chalk.red('\n⚠️  Invalid provider configured. Please run "echo-ai setup".'));
                break;
            }

            console.log(chalk.cyan.bold(`\n🤖 AI Model Selection - ${providerData.name}\n`));
            console.log(chalk.gray('  Use ↑↓ arrow keys to navigate, Enter to select\n'));
            const { selectedModel } = await inquirer.prompt([
              {
                type: 'list',
                name: 'selectedModel',
                message: `Select Model:`,
                choices: providerData.models.map(m => ({
                    name: m.name + chalk.gray(` - ${m.description || 'Default model'}`),
                    value: m.id,
                    short: m.name
                })),
                default: providerData.models.findIndex(m => m.id === config.get('model')) || 0,
                pageSize: Math.min(providerData.models.length, 8),
                loop: false
              }
            ]);

            config.set('model', selectedModel);
            console.log(chalk.green(`\n✓ Active model set to ${chalk.cyan(selectedModel)}.`));
            break;

          case 'reset':
            console.log(chalk.cyan.bold('\n⚠️  Reset Configuration\n'));
            const resetConfirm = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'sure',
                    message: chalk.red.bold('Reset all settings to factory defaults? (Memory will be preserved)'),
                    default: false
                }
            ]);
            if (resetConfirm.sure) {
                config.clear();
                console.log(chalk.green('\n✓ System reset to factory defaults.'));
            }
            break;

          case 'autoupdate':
            const currentAutoUpdate = config.get('autoUpdateCheck') !== false;
            console.log(chalk.cyan.bold('\n🔄 Auto-Update Settings\n'));
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
            console.log(chalk.green(`\n✓ Auto-update check ${currentAutoUpdate && autoUpdateConfirm.enable ? chalk.red('Disabled') : chalk.green('Enabled')}.`));
            break;

          case 'notify':
            const currentNotify = config.get('startupNotification') !== false;
            console.log(chalk.cyan.bold('\n🔔 Notification Settings\n'));
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
            console.log(chalk.green(`\n✓ Startup notifications ${currentNotify && notifyConfirm.enable ? chalk.red('Disabled') : chalk.green('Enabled')}.`));
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

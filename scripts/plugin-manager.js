const fs = require('fs');
const path = require('path');
const ConfigManager = require('./config-manager');

class PluginManager {
    constructor() {
        this.config = new ConfigManager();
        this.plugins = new Map();
        this.pluginDir = path.join(__dirname, '..', 'plugins');
        
        // Create plugins directory if it doesn't exist
        if (!fs.existsSync(this.pluginDir)) {
            fs.mkdirSync(this.pluginDir, { recursive: true });
        }
    }

    /**
     * Load all plugins from the plugins directory
     */
    async loadPlugins() {
        const enabledPlugins = this.config.get('plugins') || [];
        
        try {
            const files = fs.readdirSync(this.pluginDir);
            
            for (const file of files) {
                if (file.endsWith('.js')) {
                    const pluginPath = path.join(this.pluginDir, file);
                    await this.loadPlugin(pluginPath);
                }
            }
            
            console.log(`Loaded ${this.plugins.size} plugin(s)`);
        } catch (error) {
            console.error('Error loading plugins:', error);
        }
    }

    /**
     * Load a single plugin
     */
    async loadPlugin(pluginPath) {
        try {
            const plugin = require(pluginPath);
            
            // Validate plugin structure
            if (!plugin.name || !plugin.commands) {
                throw new Error('Invalid plugin structure. Must have name and commands.');
            }
            
            // Check if plugin is enabled
            const enabledPlugins = this.config.get('plugins') || [];
            if (!enabledPlugins.includes(plugin.name)) {
                console.log(`Plugin ${plugin.name} is disabled. Skipping...`);
                return;
            }
            
            this.plugins.set(plugin.name, plugin);
            console.log(`Loaded plugin: ${plugin.name} v${plugin.version || '1.0.0'}`);
            
            // Run plugin initialization if it exists
            if (plugin.init && typeof plugin.init === 'function') {
                await plugin.init();
            }
        } catch (error) {
            console.error(`Error loading plugin ${pluginPath}:`, error);
        }
    }

    /**
     * Execute a command from a plugin
     */
    async executeCommand(commandName, args) {
        for (const [pluginName, plugin] of this.plugins) {
            if (plugin.commands[commandName]) {
                try {
                    const result = await plugin.commands[commandName](args);
                    return { success: true, plugin: pluginName, result };
                } catch (error) {
                    return { 
                        success: false, 
                        plugin: pluginName, 
                        error: error.message 
                    };
                }
            }
        }
        
        return { success: false, error: 'Command not found in any plugin' };
    }

    /**
     * Get all available commands from all plugins
     */
    getAvailableCommands() {
        const commands = [];
        
        for (const [pluginName, plugin] of this.plugins) {
            for (const commandName of Object.keys(plugin.commands)) {
                commands.push({
                    plugin: pluginName,
                    command: commandName,
                    description: plugin.commandDescriptions?.[commandName] || 'No description'
                });
            }
        }
        
        return commands;
    }

    /**
     * Enable a plugin
     */
    enablePlugin(pluginName) {
        const enabledPlugins = this.config.get('plugins') || [];
        if (!enabledPlugins.includes(pluginName)) {
            enabledPlugins.push(pluginName);
            this.config.set('plugins', enabledPlugins);
            return true;
        }
        return false;
    }

    /**
     * Disable a plugin
     */
    disablePlugin(pluginName) {
        const enabledPlugins = this.config.get('plugins') || [];
        const index = enabledPlugins.indexOf(pluginName);
        if (index > -1) {
            enabledPlugins.splice(index, 1);
            this.config.set('plugins', enabledPlugins);
            this.plugins.delete(pluginName);
            return true;
        }
        return false;
    }

    /**
     * List all installed plugins (both enabled and disabled)
     */
    listPlugins() {
        const plugins = [];
        const enabledPlugins = this.config.get('plugins') || [];
        
        try {
            const files = fs.readdirSync(this.pluginDir);
            
            for (const file of files) {
                if (file.endsWith('.js')) {
                    const pluginPath = path.join(this.pluginDir, file);
                    try {
                        // Clear cache to get fresh plugin data
                        delete require.cache[require.resolve(pluginPath)];
                        const plugin = require(pluginPath);
                        
                        if (plugin.name && plugin.commands) {
                            plugins.push({
                                name: plugin.name,
                                version: plugin.version || '1.0.0',
                                description: plugin.description || 'No description',
                                enabled: enabledPlugins.includes(plugin.name),
                                filename: file,
                                commands: Object.keys(plugin.commands).length
                            });
                        }
                    } catch (e) {
                        // Skip invalid plugins
                    }
                }
            }
        } catch (error) {
            console.error('Error listing plugins:', error);
        }
        
        return plugins;
    }
}

module.exports = PluginManager;

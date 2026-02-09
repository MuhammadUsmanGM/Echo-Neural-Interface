/**
 * Workflow Plugin for Echo
 * 
 * Allows users to execute multiple system actions as a single command.
 */

const SystemActions = require('../services/system');
const ConfigManager = require('../scripts/config-manager');

module.exports = {
    name: 'workflow-plugin',
    version: '1.0.0',
    description: 'Execute custom multi-action workflows.',
    author: 'Echo Team',

    init: async function() {
        this.config = new ConfigManager();
    },

    commands: {
        /**
         * Execute a named workflow
         * Usage: "Echo, run my morning workflow"
         */
        workflow: async function(args) {
            if (!args) return { success: false, message: 'Please specify a workflow name, sir.' };
            
            const workflows = this.config.get('workflows') || {};
            // Try to find the workflow name (case-insensitive)
            const targetName = Object.keys(workflows).find(name => name.toLowerCase() === args.toLowerCase());
            
            if (!targetName) {
                return { success: false, message: `I couldn't find a workflow named "${args}", sir.` };
            }

            const actions = workflows[targetName];
            if (!Array.isArray(actions)) {
                return { success: false, message: 'Invalid workflow format detected.' };
            }

            // Execute all actions in the workflow
            const results = [];
            for (const action of actions) {
                try {
                    let result;
                    switch (action.type) {
                        case 'app':
                            result = await SystemActions.openApp(action.value);
                            break;
                        case 'url':
                            result = await SystemActions.openUrl(action.value);
                            break;
                        case 'search':
                            result = await SystemActions.searchWeb(action.value);
                            break;
                        case 'command':
                            result = await SystemActions.executeCommand(action.value);
                            break;
                        default:
                            result = { success: false, error: 'Unknown action type' };
                    }
                    results.push({ action: action.type, success: result.success });
                } catch (e) {
                    results.push({ action: action.type, success: false, error: e.message });
                }
            }

            const successCount = results.filter(r => r.success).length;
            return {
                success: true,
                message: `Workflow "${targetName}" completed. executed ${successCount} of ${actions.length} actions successfully.`
            };
        }
    },

    commandDescriptions: {
        workflow: 'Execute a predefined sequence of actions'
    }
};

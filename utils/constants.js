/**
 * Application Constants
 * Improving maintainability by centralizing magic strings.
 */

module.exports = {
    // IPC Channels
    CHANNELS: {
        PROCESS_INPUT: 'process-input',
        GET_CONFIG: 'get-config',
        APPLY_THEME: 'apply-theme',
        SYSTEM_COMMAND: 'system-command'
    },
    
    // Command Types
    COMMANDS: {
        ACTION: 'action',
        PLUGIN: 'plugin_action',
        SPEECH: 'speech'
    },
    
    // Theme Colors
    THEMES: {
        CYAN: 'cyan',
        PURPLE: 'purple',
        GREEN: 'green',
        GOLD: 'gold',
        RED: 'red',
        BLUE: 'blue'
    },
    
    // Messages
    MESSAGES: {
        API_KEY_MISSING: "API Key missing. Please run 'echo setup' first.",
        ERROR_PROCESSING: "I encountered an error processing that, sir.",
        ACTION_COMPLETED: "Action completed, sir.",
        MIC_ACCESS_DENIED: "MIC ACCESS DENIED",
        THINKING: "THINKING...",
        LISTENING: "LISTENING...",
        ERROR_IN_BRAIN: "ERROR IN BRAIN"
    }
};

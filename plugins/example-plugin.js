/**
 * Example Plugin for Echo AI Agent
 * 
 * This is a sample plugin that demonstrates how to extend Echo with custom commands.
 * Copy this file to create your own plugins!
 */

module.exports = {
    // Plugin metadata
    name: 'example-plugin',
    version: '1.0.0',
    description: 'An example plugin showing how to create custom commands',
    author: 'Echo Team',

    // Optional: Initialize plugin (runs once when loaded)
    init: async function() {
        console.log('Example plugin initialized!');
    },

    // Command definitions
    commands: {
        /**
         * Example command: greet
         * Usage: "Echo, greet John"
         */
        greet: async function(args) {
            const name = args || 'there';
            return {
                success: true,
                message: `Hello, ${name}! This is a custom command from the example plugin.`
            };
        },

        /**
         * Example command: calculate
         * Usage: "Echo, calculate 5 + 3"
         */
        calculate: async function(args) {
            try {
                // Simple calculator (be careful with eval in production!)
                const result = eval(args);
                return {
                    success: true,
                    message: `The result is ${result}`
                };
            } catch (error) {
                return {
                    success: false,
                    message: 'Invalid calculation'
                };
            }
        },

        /**
         * Example command: joke
         * Usage: "Echo, tell me a joke"
         */
        joke: async function(args) {
            const jokes = [
                "Why don't scientists trust atoms? Because they make up everything!",
                "Why did the scarecrow win an award? He was outstanding in his field!",
                "Why don't eggs tell jokes? They'd crack each other up!",
                "What do you call a bear with no teeth? A gummy bear!",
                "Why did the bicycle fall over? It was two tired!"
            ];
            
            const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
            
            return {
                success: true,
                message: randomJoke
            };
        },

        /**
         * Example command: weather (mock)
         * Usage: "Echo, what's the weather"
         */
        weather: async function(args) {
            // In a real plugin, you'd call a weather API here
            return {
                success: true,
                message: 'The weather is sunny with a chance of code! 🌞 (This is a mock response)'
            };
        }
    },

    // Optional: Command descriptions for help
    commandDescriptions: {
        greet: 'Greet someone by name',
        calculate: 'Perform a simple calculation',
        joke: 'Tell a random joke',
        weather: 'Get weather information (mock)'
    },

    // Optional: Cleanup when plugin is disabled
    cleanup: async function() {
        console.log('Example plugin cleaned up!');
    }
};

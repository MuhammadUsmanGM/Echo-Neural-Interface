const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiBrain {
    constructor(apiKey, customTools = []) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        
        // Base system tools
        this.baseTools = [
            {
                name: "execute_system_command",
                description: "Execute a system action or shell command on the user's computer",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        command: { type: "STRING", description: "The command to run (e.g., 'start chrome', 'mkdir test', 'screenshot')" },
                        args: { type: "ARRAY", items: { type: "STRING" }, description: "Arguments for the command" }
                    },
                    required: ["command"]
                }
            }
        ];

        // Merge base tools with plugin tools
        // Plugins should provide tools in Google Generative AI function declaration format
        this.allTools = [...this.baseTools, ...customTools];

        this.model = this.genAI.getGenerativeModel({
            model: "gemini-2.0-flash-lite",
            systemInstruction: "You are Echo, a highly sophisticated, JARVIS-inspired AI agent. " +
                               "Your personality is professional, slightly witty, and exceptionally helpful. " +
                               "You have control over the user's system and can perform various tasks like opening apps, managing files, and searching the web. " +
                               "You also have access to external plugins if available. " +
                               "Always refer to the user as 'Sir' (or their preferred title) unless told otherwise. " +
                               "Keep your spoken responses concise, elegant, and ready for text-to-speech. " +
                               "If a user asks for 'help' or 'what can you do', list your capabilities briefly: creating folders, searching the web, system info, taking screenshots, and any loaded plugins. " +
                               "If a user asks for something outside your direct control, check if a plugin tool is available."
        });
    }

    async processCommand(userInput) {
        // Create chat with all available tools
        const chat = this.model.startChat({
            tools: [{ functionDeclarations: this.allTools }]
        });

        try {
            const result = await chat.sendMessage(userInput);
            const response = result.response;
            
            // Handle tool calls
            const calls = response.functionCalls();
            if (calls && calls.length > 0) {
                const call = calls[0];
                
                // Check if it's a dynamic plugin tool (not the base system command)
                const isBaseTool = call.name === "execute_system_command";
                
                return {
                    type: isBaseTool ? 'action' : 'plugin_action',
                    command: call.name === "execute_system_command" ? call.args.command : call.name,
                    args: call.args.args || call.args, // Handle different arg structures
                    text: "Processing your request, sir."
                };
            }

            return {
                type: 'speech',
                text: response.text()
            };
        } catch (error) {
            console.error("Gemini Processing Error:", error);
            return {
                type: 'speech',
                text: "I apologize, sir. I'm having trouble connecting to my neural network right now."
            };
        }
    }
}

module.exports = GeminiBrain;

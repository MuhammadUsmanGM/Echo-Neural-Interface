const { GoogleGenerativeAI } = require("@google/generative-ai");
const MemoryManager = require("../scripts/memory-manager");
const ConfigManager = require("../scripts/config-manager");

class GeminiBrain {
    constructor(apiKey, customTools = [], modelName = "gemini-2.0-flash-lite") {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.memory = new MemoryManager();
        this.config = new ConfigManager();
        
        // Base system tools
        this.baseTools = [
            {
                name: "execute_system_command",
                description: "Execute a system action or request",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        command: { type: "STRING", description: "The action to perform: 'create_folder', 'write_file', 'read_file', 'open_app', 'web_search', 'screenshot', 'system_info', 'run_terminal_command', 'type_text', 'press_key'" },
                        args: { type: "OBJECT", description: "Arguments (e.g. { command: 'git status' } or { text: 'Hello' } or { key: 'ENTER' })" }
                    },
                    required: ["command"]
                }
            }
        ];

        // Merge base tools with plugin tools
        // Plugins should provide tools in Google Generative AI function declaration format
        this.allTools = [...this.baseTools, ...customTools];

        const userName = this.config.get('userName') || 'Friend';

        this.model = this.genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: `You are Echo, a highly sophisticated, human-like AI agent. ` +
                               `Your personality is professional, slightly witty, and exceptionally helpful. ` +
                               `The person you are assisting is named ${userName}. Use this name naturally in conversation. ` +
                               `You have control over the user's system and can perform various tasks like opening apps, managing files, and searching the web. ` +
                               `CRITICAL SAFETY RULE: You are authorized to run terminal commands via 'run_terminal_command' ONLY when the user EXPLICITLY asks you to run a specific command or perform an action that requires it. ` +
                               `Never execute arbitrary commands autonomously or guess. If unsure, ask for confirmation. ` +
                               `You also have access to external plugins if available. ` +
                               `Keep your spoken responses concise, elegant, and ready for text-to-speech. ` +
                               `If a user asks for 'help' or 'what can you do', list your capabilities briefly: creating folders, searching the web, system info, taking screenshots, running terminal commands (upon request), and shortcuts.`
        });
    }

    async processCommand(userInput, onProgress) {
        const memoryEnabled = this.config.get('memoryEnabled') !== false;
        let history = [];
        
        if (memoryEnabled) {
            history = this.memory.getHistory();
        }

        // Create chat with all available tools and history
        const chat = this.model.startChat({
            tools: [{ functionDeclarations: this.allTools }],
            history: history
        });

        try {
            // Use streaming API
            const result = await chat.sendMessageStream(userInput);
            
            let fullText = '';
            let functionCall = null;
            
            if (memoryEnabled) {
                this.memory.saveMessage('user', userInput);
            }

            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                // Check if it's a function call (Gemini usually sends this in one go, but we check parts)
                const calls = chunk.functionCalls();
                
                if (calls && calls.length > 0) {
                    functionCall = calls[0];
                    break; // Stop streaming text if it's a tool call
                }
                
                if (chunkText) {
                    fullText += chunkText;
                    if (onProgress) onProgress(chunkText);
                }
            }

            // Handle Function Calls
            if (functionCall) {
                const call = functionCall;
                const fnName = call.name;
                const args = call.args;

                // Save model thought/intent if any text preceded the tool call
                if (fullText && memoryEnabled) {
                    this.memory.saveMessage('model', fullText);
                }

                return {
                    type: 'action', // or plugin_action logic
                    command: fnName,
                    args: args, // Gemini args are already an object
                    text: fullText || "Processing action..."
                };
            }

            // Save final response
            if (memoryEnabled) {
                this.memory.saveMessage('model', fullText);
            }

            return {
                type: 'speech',
                text: fullText
            };

        } catch (error) {
            console.error("Gemini Error:", error);
            // Fallback for non-streaming or errors
            return { success: false, text: "I encountered an error processing that, sir." };
        }
    }
}

module.exports = GeminiBrain;

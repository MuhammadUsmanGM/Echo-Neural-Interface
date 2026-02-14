const https = require('https');
const MemoryManager = require("../scripts/memory-manager");
const ConfigManager = require("../scripts/config-manager");

class OpenAIBrain {
    constructor(apiKey, customTools = [], modelName = "gpt-4o-mini") {
        this.apiKey = apiKey;
        this.modelName = modelName;
        this.memory = new MemoryManager();
        this.config = new ConfigManager();
        
        // Base system tools
        this.baseTools = [
            {
                type: "function",
                function: {
                    name: "execute_system_command",
                    description: "Execute a system action or shell command on the user's computer",
                    parameters: {
                        type: "object",
                        properties: {
                            command: { type: "string", description: "The command to run (e.g., 'start chrome', 'mkdir test', 'screenshot')" },
                            args: { type: "array", items: { type: "string" }, description: "Arguments for the command" }
                        },
                        required: ["command"]
                    }
                }
            }
        ];

        // Convert custom Echo tools to OpenAI format
        this.customTools = customTools.map(tool => ({
            type: "function",
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters
            }
        }));

        this.allTools = [...this.baseTools, ...this.customTools];
    }

    async processCommand(userInput) {
        const memoryEnabled = this.config.get('memoryEnabled') !== false;
        let messages = [];

        // System Prompt
        const userName = this.config.get('userName') || 'Friend';
        const systemPrompt = `You are Echo, a highly sophisticated, human-like AI agent. ` +
                             `Your personality is professional, slightly witty, and exceptionally helpful. ` +
                             `The person you are assisting is named ${userName}. Use this name naturally in conversation. ` +
                             `You have control over the user's system and can perform various tasks like opening apps, managing files, and searching the web. ` +
                             `Keep your spoken responses concise, elegant, and ready for text-to-speech.`;

        messages.push({ role: "system", content: systemPrompt });

        // Load History
        if (memoryEnabled) {
            const history = this.memory.getHistory(10); // limited context for faster response
            history.forEach(msg => {
                // Map Gemini format (parts[0].text) to OpenAI format
                const content = msg.parts && msg.parts[0] ? msg.parts[0].text : "";
                if (content) {
                    messages.push({ 
                        role: msg.role === 'model' ? 'assistant' : 'user', 
                        content: content 
                    });
                }
            });
        }

        // Add current user message
        messages.push({ role: "user", content: userInput });

        try {
            // Save user message to memory
            if (memoryEnabled) {
                this.memory.saveMessage('user', userInput);
            }

            const response = await this.callOpenAI(messages, this.allTools);
            const choice = response.choices[0];
            const message = choice.message;

            // Handle Tool Calls
            if (message.tool_calls) {
                const toolCall = message.tool_calls[0];
                const functionName = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments);

                const isBaseTool = functionName === "execute_system_command";
                
                // Save rudimentary "thinking" response
                if (memoryEnabled && message.content) {
                    this.memory.saveMessage('model', message.content);
                }

                return {
                    type: isBaseTool ? 'action' : 'plugin_action',
                    command: isBaseTool ? args.command : functionName,
                    args: isBaseTool ? (args.args || []) : args,
                    text: message.content || "Processing your request, sir."
                };
            }

            // Normal Text Response
            const responseText = message.content;
            
            if (memoryEnabled) {
                this.memory.saveMessage('model', responseText);
            }

            return {
                type: 'speech',
                text: responseText
            };

        } catch (error) {
            console.error("OpenAI Processing Error:", error);
            return {
                type: 'speech',
                text: "I apologize, sir. I'm having trouble connecting to the OpenAI neural network."
            };
        }
    }

    callOpenAI(messages, tools) {
        return new Promise((resolve, reject) => {
            const data = JSON.stringify({
                model: this.modelName,
                messages: messages,
                tools: tools,
                tool_choice: "auto"
            });

            const options = {
                hostname: 'api.openai.com',
                path: '/v1/chat/completions',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Length': data.length
                }
            };

            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            resolve(JSON.parse(body));
                        } catch (e) {
                            reject(e);
                        }
                    } else {
                        reject(new Error(`OpenAI API Error: ${res.statusCode} ${body}`));
                    }
                });
            });

            req.on('error', (e) => reject(e));
            req.write(data);
            req.end();
        });
    }
}

module.exports = OpenAIBrain;

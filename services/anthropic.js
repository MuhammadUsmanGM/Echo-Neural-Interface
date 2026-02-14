const https = require('https');
const MemoryManager = require("../scripts/memory-manager");
const ConfigManager = require("../scripts/config-manager");

class AnthropicBrain {
    constructor(apiKey, customTools = [], modelName = "claude-3-5-haiku-latest") {
        this.apiKey = apiKey;
        this.modelName = modelName;
        this.memory = new MemoryManager();
        this.config = new ConfigManager();
        
        // Base system tools
        this.baseTools = [
            {
                name: "execute_system_command",
                description: "Execute a system action or shell command on the user's computer",
                input_schema: {
                    type: "object",
                    properties: {
                        command: { type: "string", description: "The command to run (e.g., 'start chrome', 'mkdir test', 'screenshot')" },
                        args: { type: "array", items: { type: "string" }, description: "Arguments for the command" }
                    },
                    required: ["command"]
                }
            }
        ];

        // Convert custom Echo tools to Anthropic format
        this.customTools = customTools.map(tool => ({
            name: tool.name,
            description: tool.description,
            input_schema: tool.parameters
        }));

        this.allTools = [...this.baseTools, ...this.customTools];
    }

    async processCommand(userInput) {
        const memoryEnabled = this.config.get('memoryEnabled') !== false;
        let messages = [];

        // Load History
        if (memoryEnabled) {
            const history = this.memory.getHistory(10);
            history.forEach(msg => {
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

        const userName = this.config.get('userName') || 'Friend';
        const systemPrompt = `You are Echo, a highly sophisticated, human-like AI agent. ` +
                             `Your personality is professional, slightly witty, and exceptionally helpful. ` +
                             `The person you are assisting is named ${userName}. Use this name naturally in conversation. ` +
                             `You have control over the user's system and can perform various tasks like opening apps, managing files, and searching the web. ` +
                             `Keep your spoken responses concise, elegant, and ready for text-to-speech.`;

        try {
            if (memoryEnabled) {
                this.memory.saveMessage('user', userInput);
            }

            const response = await this.callAnthropic(messages, systemPrompt, this.allTools);
            
            // Check for tool use
            if (response.stop_reason === "tool_use") {
                const toolBlock = response.content.find(block => block.type === "tool_use");
                
                if (toolBlock) {
                    const functionName = toolBlock.name;
                    const args = toolBlock.input;
                    const isBaseTool = functionName === "execute_system_command";
                    
                    return {
                        type: isBaseTool ? 'action' : 'plugin_action',
                        command: isBaseTool ? args.command : functionName,
                        args: isBaseTool ? (args.args || []) : args,
                        text: "Processing request, sir."
                    };
                }
            }

            // Normal Text Response
            const textBlock = response.content.find(block => block.type === "text");
            const responseText = textBlock ? textBlock.text : "I didn't get a response.";
            
            if (memoryEnabled) {
                this.memory.saveMessage('model', responseText);
            }

            return {
                type: 'speech',
                text: responseText
            };

        } catch (error) {
            console.error("Anthropic Processing Error:", error);
            return {
                type: 'speech',
                text: "I apologize, sir. Connection to Anthropic services failed."
            };
        }
    }

    callAnthropic(messages, systemPrompt, tools) {
        return new Promise((resolve, reject) => {
            const data = JSON.stringify({
                model: this.modelName,
                max_tokens: 1024,
                system: systemPrompt,
                messages: messages,
                tools: tools
            });

            const options = {
                hostname: 'api.anthropic.com',
                path: '/v1/messages',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
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
                        reject(new Error(`Anthropic API Error: ${res.statusCode} ${body}`));
                    }
                });
            });

            req.on('error', (e) => reject(e));
            req.write(data);
            req.end();
        });
    }
}

module.exports = AnthropicBrain;

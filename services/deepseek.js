const https = require('https');
const MemoryManager = require("../scripts/memory-manager");
const ConfigManager = require("../scripts/config-manager");

class DeepSeekBrain {
    constructor(apiKey, customTools = [], modelName = "deepseek-chat") {
        this.apiKey = apiKey;
        this.modelName = modelName;
        this.memory = new MemoryManager();
        this.config = new ConfigManager();
        
        // DeepSeek is OpenAI-compatible
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

    async processCommand(userInput, onProgress) {
        const memoryEnabled = this.config.get('memoryEnabled') !== false;
        let messages = [];

        const userName = this.config.get('userName') || 'Friend';
        const systemPrompt = `You are Echo, a highly sophisticated, human-like AI agent. ` +
                             `Your personality is professional, slightly witty, and exceptionally helpful. ` +
                             `The person you are assisting is named ${userName}. Use this name naturally in conversation. ` +
                             `Keep your spoken responses concise, elegant, and ready for text-to-speech.`;

        messages.push({ role: "system", content: systemPrompt });

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

        messages.push({ role: "user", content: userInput });

        try {
            if (memoryEnabled) {
                this.memory.saveMessage('user', userInput);
            }

            const response = await this.callDeepSeekStream(messages, this.allTools, onProgress);

            if (response.toolCall) {
                const functionName = response.toolCall.name;
                const args = response.toolCall.args;
                const isBaseTool = functionName === "execute_system_command";

                return {
                    type: isBaseTool ? 'action' : 'plugin_action',
                    command: isBaseTool ? args.command : functionName,
                    args: isBaseTool ? (args.args || []) : args,
                    text: response.text || "Processing your request."
                };
            }

            const responseText = response.text;

            if (memoryEnabled) {
                this.memory.saveMessage('model', responseText);
            }

            return {
                type: 'speech',
                text: responseText
            };

        } catch (error) {
            console.error("DeepSeek Processing Error:", error);
            return {
                type: 'speech',
                text: "I apologize, sir. DeepSeek services are currently unreachable."
            };
        }
    }

    callDeepSeekStream(messages, tools, onProgress) {
        return new Promise((resolve, reject) => {
            const data = JSON.stringify({
                model: this.modelName,
                messages: messages,
                tools: tools,
                tool_choice: "auto",
                stream: true
            });

            const options = {
                hostname: 'api.deepseek.com',
                path: '/chat/completions',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Length': Buffer.byteLength(data)
                }
            };

            let fullText = '';
            let toolCall = null;
            let currentToolCall = { name: '', args: '' };

            const req = https.request(options, (res) => {
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    let errorBody = '';
                    res.on('data', chunk => errorBody += chunk);
                    res.on('end', () => {
                        reject(new Error(`DeepSeek API Error: ${res.statusCode} ${errorBody}`));
                    });
                    return;
                }

                res.on('data', chunk => {
                    const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);

                            if (data === '[DONE]') {
                                continue;
                            }

                            try {
                                const parsed = JSON.parse(data);
                                const delta = parsed.choices[0]?.delta;

                                if (!delta) continue;

                                if (delta.content) {
                                    fullText += delta.content;
                                    if (onProgress) {
                                        onProgress(delta.content);
                                    }
                                }

                                if (delta.tool_calls) {
                                    const tc = delta.tool_calls[0];
                                    if (tc.function?.name) {
                                        currentToolCall.name = tc.function.name;
                                    }
                                    if (tc.function?.arguments) {
                                        currentToolCall.args += tc.function.arguments;
                                    }
                                }
                            } catch (e) {
                                // Log parse errors for debugging instead of silently ignoring
                                console.warn('DeepSeek stream JSON parse error:', e.message);
                            }
                        }
                    }
                });

                res.on('end', () => {
                    if (currentToolCall.name) {
                        try {
                            toolCall = {
                                name: currentToolCall.name,
                                args: JSON.parse(currentToolCall.args)
                            };
                        } catch (e) {
                            console.error('Failed to parse tool call args:', e);
                        }
                    }

                    resolve({
                        text: fullText,
                        toolCall: toolCall
                    });
                });
            });

            req.on('error', (e) => reject(e));
            req.write(data);
            req.end();
        });
    }
}

module.exports = DeepSeekBrain;

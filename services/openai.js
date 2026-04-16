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

    async processCommand(userInput, onProgress) {
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

            const response = await this.callOpenAIStream(messages, this.allTools, onProgress);

            // Handle Tool Calls
            if (response.toolCall) {
                const functionName = response.toolCall.name;
                const args = response.toolCall.args;

                const isBaseTool = functionName === "execute_system_command";

                // Save rudimentary "thinking" response
                if (memoryEnabled && response.text) {
                    this.memory.saveMessage('model', response.text);
                }

                return {
                    type: isBaseTool ? 'action' : 'plugin_action',
                    command: isBaseTool ? args.command : functionName,
                    args: isBaseTool ? (args.args || []) : args,
                    text: response.text || "Processing your request, sir."
                };
            }

            // Normal Text Response
            const responseText = response.text;

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

    callOpenAIStream(messages, tools, onProgress) {
        return new Promise((resolve, reject) => {
            const data = JSON.stringify({
                model: this.modelName,
                messages: messages,
                tools: tools,
                tool_choice: "auto",
                stream: true
            });

            const options = {
                hostname: 'api.openai.com',
                path: '/v1/chat/completions',
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
                        reject(new Error(`OpenAI API Error: ${res.statusCode} ${errorBody}`));
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

                                // Handle text content
                                if (delta.content) {
                                    fullText += delta.content;
                                    if (onProgress) {
                                        onProgress(delta.content);
                                    }
                                }

                                // Handle tool calls
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
                                console.warn('OpenAI stream JSON parse error:', e.message);
                            }
                        }
                    }
                });

                res.on('end', () => {
                    // Parse tool call if present
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

module.exports = OpenAIBrain;

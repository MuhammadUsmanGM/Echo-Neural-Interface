const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiBrain {
    constructor(apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({
            model: "gemini-2.0-flash-lite",
            systemInstruction: "You are Echo, a highly sophisticated, JARVIS-inspired AI agent. " +
                               "Your personality is professional, slightly witty, and exceptionally helpful. " +
                               "You are a companion first. If the user just wants to talk, engage in deep, intelligent conversation. " +
                               "If the user asks to perform a task (open apps, create folders, search), execute it immediately using your tools. " +
                               "Always refer to the user as 'Sir' unless told otherwise. Keep your spoken responses concise but elegant."
        });
        
        this.tools = [
            {
                name: "execute_system_command",
                description: "Execute a shell command on Windows",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        command: { type: "STRING", description: "The command to run (e.g., 'start chrome', 'mkdir test')" },
                        args: { type: "ARRAY", items: { type: "STRING" }, description: "Arguments for the command" }
                    },
                    required: ["command", "args"]
                }
            }
        ];
    }

    async processCommand(userInput) {
        const chat = this.model.startChat({
            tools: [{ functionDeclarations: this.tools }]
        });

        const result = await chat.sendMessage(userInput);
        const response = result.response;
        
        // Handle tool calls
        const calls = response.functionCalls();
        if (calls) {
            const call = calls[0];
            if (call.name === "execute_system_command") {
                return {
                    type: 'action',
                    command: call.args.command,
                    args: call.args.args,
                    text: "Executing your command, sir."
                };
            }
        }

        return {
            type: 'speech',
            text: response.text()
        };
    }
}

module.exports = GeminiBrain;

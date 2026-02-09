/**
 * AI Models Configuration
 * Defines supported providers, models, and their defaults.
 */

const AI_MODELS = {
    google: {
        name: 'Google Gemini',
        defaultModel: 'gemini-2.0-flash-lite',
        models: [
            { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite (Fastest)' },
            { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Balanced)' },
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Most Intelligent)' }
        ]
    },
    openai: {
        name: 'OpenAI',
        defaultModel: 'gpt-4o-mini',
        models: [
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast)' },
            { id: 'gpt-4o', name: 'GPT-4o (Powerful)' },
            { id: 'o1-mini', name: 'o1 Mini (Reasoning)' }
        ]
    },
    anthropic: {
        name: 'Anthropic',
        defaultModel: 'claude-3-5-haiku-latest',
        models: [
            { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku (Speed)' },
            { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet (Premium)' }
        ]
    },
    deepseek: {
        name: 'DeepSeek',
        defaultModel: 'deepseek-chat',
        models: [
            { id: 'deepseek-chat', name: 'DeepSeek Chat (V3)' },
            { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner (R1)' }
        ]
    }
};

module.exports = AI_MODELS;

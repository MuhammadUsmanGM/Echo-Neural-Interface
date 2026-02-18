// Mock dependencies before imports
jest.mock('../scripts/memory-manager');
jest.mock('../scripts/config-manager');
jest.mock('@google/generative-ai');

const GeminiBrain = require('../services/gemini');
const MemoryManager = require('../scripts/memory-manager');

describe('GeminiBrain', () => {
  let geminiBrain;
  let mockMemory;
  let mockConfig;

  beforeEach(() => {
    mockMemory = {
      getHistory: jest.fn().mockReturnValue([]),
      saveMessage: jest.fn()
    };

    mockConfig = {
      get: jest.fn((key) => {
        if (key === 'memoryEnabled') return true;
        if (key === 'userName') return 'TestUser';
        return null;
      })
    };

    MemoryManager.mockImplementation(() => mockMemory);

    // Mock ConfigManager
    const ConfigManager = require('../scripts/config-manager');
    ConfigManager.mockImplementation(() => mockConfig);

    geminiBrain = new GeminiBrain('test-api-key', [], 'gemini-2.0-flash-lite');
  });

  describe('constructor', () => {
    test('should initialize with API key and model', () => {
      expect(geminiBrain).toBeDefined();
      expect(geminiBrain.baseTools).toHaveLength(1);
      expect(geminiBrain.baseTools[0].name).toBe('execute_system_command');
    });

    test('should merge custom tools with base tools', () => {
      const customTools = [
        {
          name: 'custom_tool',
          description: 'A custom tool',
          parameters: { type: 'OBJECT', properties: {} }
        }
      ];

      const brain = new GeminiBrain('test-key', customTools);
      expect(brain.allTools.length).toBeGreaterThan(1);
    });
  });

  describe('processCommand', () => {
    test('should handle errors gracefully', async () => {
      geminiBrain.model = {
        startChat: jest.fn().mockReturnValue({
          sendMessageStream: jest.fn().mockRejectedValue(new Error('API Error'))
        })
      };

      const result = await geminiBrain.processCommand('Test');

      expect(result.success).toBe(false);
      expect(result.text).toContain('error');
    });
  });
});

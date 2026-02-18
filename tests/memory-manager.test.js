const { getLogger } = require('../utils/logger');
const { getErrorHandler } = require('../utils/error-handler');

describe('MemoryManager', () => {
  const MemoryManager = require('../scripts/memory-manager');
  const fs = require('fs');
  const path = require('path');
  const os = require('os');

  let memoryManager;
  let testMemoryDir;

  beforeEach(() => {
    // Create a test-specific memory directory
    testMemoryDir = path.join(os.tmpdir(), '.echo-memory-test-' + Date.now());
    memoryManager = new MemoryManager();
    memoryManager.memoryDir = testMemoryDir;
    memoryManager.historyFile = path.join(testMemoryDir, 'chat-history.enc');
    memoryManager.factsFile = path.join(testMemoryDir, 'user-facts.enc');
    memoryManager.init();
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testMemoryDir)) {
      fs.rmSync(testMemoryDir, { recursive: true, force: true });
    }
  });

  describe('saveMessage', () => {
    test('should save a message to history', () => {
      memoryManager.saveMessage('user', 'Hello Echo');
      const history = memoryManager.getAllHistory();

      expect(history).toHaveLength(1);
      expect(history[0].role).toBe('user');
      expect(history[0].parts[0].text).toBe('Hello Echo');
    });

    test('should truncate messages exceeding max length', () => {
      const longMessage = 'a'.repeat(15000);
      memoryManager.saveMessage('user', longMessage);
      const history = memoryManager.getAllHistory();

      expect(history[0].parts[0].text.length).toBeLessThanOrEqual(memoryManager.maxMessageLength + 20);
      expect(history[0].parts[0].text).toContain('[truncated]');
    });

    test('should prune old messages when exceeding max history size', () => {
      // Save more than max messages
      for (let i = 0; i < memoryManager.maxHistorySize + 10; i++) {
        memoryManager.saveMessage('user', `Message ${i}`);
      }

      const history = memoryManager.getAllHistory();
      expect(history.length).toBeLessThanOrEqual(memoryManager.maxHistorySize);
    });
  });

  describe('getHistory', () => {
    test('should return limited history for context window', () => {
      // Save 100 messages
      for (let i = 0; i < 100; i++) {
        memoryManager.saveMessage('user', `Message ${i}`);
      }

      const history = memoryManager.getHistory();
      expect(history.length).toBe(memoryManager.maxContextWindow);
      expect(history[history.length - 1].parts[0].text).toBe('Message 99');
    });

    test('should respect custom limit parameter', () => {
      for (let i = 0; i < 50; i++) {
        memoryManager.saveMessage('user', `Message ${i}`);
      }

      const history = memoryManager.getHistory(10);
      expect(history.length).toBe(10);
    });
  });

  describe('encryption', () => {
    test('should encrypt and decrypt data correctly', () => {
      const originalText = 'Sensitive data';
      const encrypted = memoryManager.encrypt(originalText);
      const decrypted = memoryManager.decrypt(encrypted);

      expect(decrypted).toBe(originalText);
      expect(encrypted).not.toBe(originalText);
    });

    test('should return null for invalid encrypted data', () => {
      const result = memoryManager.decrypt('invalid:data');
      expect(result).toBeNull();
    });
  });

  describe('getMemoryStats', () => {
    test('should return accurate memory statistics', () => {
      for (let i = 0; i < 50; i++) {
        memoryManager.saveMessage('user', `Message ${i}`);
      }

      const stats = memoryManager.getMemoryStats();
      expect(stats.messageCount).toBe(50);
      expect(stats.maxMessages).toBe(memoryManager.maxHistorySize);
      expect(stats.totalSizeBytes).toBeGreaterThan(0);
    });
  });

  describe('searchHistory', () => {
    test('should find messages matching query', () => {
      memoryManager.saveMessage('user', 'Open Chrome browser');
      memoryManager.saveMessage('user', 'What is the weather?');
      memoryManager.saveMessage('user', 'Open Firefox');

      const results = memoryManager.searchHistory('open');
      expect(results).toHaveLength(2);
      expect(results[0].parts[0].text).toContain('Chrome');
    });
  });

  describe('clearMemory', () => {
    test('should clear all memory files', () => {
      memoryManager.saveMessage('user', 'Test message');
      memoryManager.saveFact('name', 'John');

      expect(fs.existsSync(memoryManager.historyFile)).toBe(true);
      expect(fs.existsSync(memoryManager.factsFile)).toBe(true);

      memoryManager.clearMemory();

      expect(fs.existsSync(memoryManager.historyFile)).toBe(false);
      expect(fs.existsSync(memoryManager.factsFile)).toBe(false);
    });
  });
});

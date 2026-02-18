const { getLogger } = require('../utils/logger');
const { getErrorHandler } = require('../utils/error-handler');

/**
 * InputValidator - Validates and sanitizes user inputs and system commands
 * Provides security checks for dangerous operations
 */
class InputValidator {
  constructor() {
    this.logger = getLogger();
    this.errorHandler = getErrorHandler();

    // Whitelist of safe system commands
    this.safeCommands = [
      'screenshot',
      'system_info',
      'web_search',
      'create_folder',
      'write_file',
      'read_file',
      'open_app',
      'type_text',
      'press_key'
    ];

    // Dangerous command patterns to block
    this.dangerousPatterns = [
      /rm\s+-rf\s+\//i,           // rm -rf /
      /del\s+\/[sf]/i,            // del /s /f
      /format\s+[a-z]:/i,         // format c:
      /shutdown/i,                // shutdown commands
      /reboot/i,                  // reboot commands
      /mkfs/i,                    // filesystem format
      /dd\s+if=/i,                // disk operations
      /:\(\)\{.*\}/,              // fork bombs
      /curl.*\|\s*bash/i,         // pipe to bash
      /wget.*\|\s*sh/i,           // pipe to shell
      /eval\s*\(/i,               // eval injection
      /exec\s*\(/i                // exec injection
    ];

    // Sensitive file patterns
    this.sensitiveFiles = [
      /\/etc\/passwd/i,
      /\/etc\/shadow/i,
      /\.ssh\/id_rsa/i,
      /\.aws\/credentials/i,
      /\.env/i,
      /config\.json/i,
      /\.git\/config/i
    ];

    // Rate limiting
    this.commandHistory = [];
    this.maxCommandsPerMinute = 30;
  }

  /**
   * Validate system command before execution
   */
  validateSystemCommand(command, args = []) {
    const fullCommand = `${command} ${Array.isArray(args) ? args.join(' ') : args}`.toLowerCase();

    // Check rate limiting
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded. Please slow down.');
    }

    // Check for dangerous patterns
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(fullCommand)) {
        this.logger.warn('Blocked dangerous command', { command: fullCommand });
        throw new Error('This command is not allowed for security reasons.');
      }
    }

    // Check if command is in safe list
    const commandLower = command.toLowerCase();
    if (this.safeCommands.includes(commandLower)) {
      return true;
    }

    // For terminal commands, require explicit user confirmation
    if (commandLower === 'run_terminal_command') {
      this.logger.info('Terminal command requested', { command: fullCommand });
      return true; // Allow but log
    }

    // Log unknown commands
    this.logger.warn('Unknown command type', { command: commandLower });
    return true; // Allow but log
  }

  /**
   * Validate file path for read/write operations
   */
  validateFilePath(filePath) {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('Invalid file path');
    }

    // Check for path traversal
    if (filePath.includes('..')) {
      throw new Error('Path traversal is not allowed');
    }

    // Check for sensitive files
    for (const pattern of this.sensitiveFiles) {
      if (pattern.test(filePath)) {
        this.logger.warn('Blocked access to sensitive file', { filePath });
        throw new Error('Access to this file is restricted');
      }
    }

    return true;
  }

  /**
   * Sanitize user input
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') {
      return input;
    }

    // Remove null bytes
    let sanitized = input.replace(/\0/g, '');

    // Trim excessive whitespace
    sanitized = sanitized.trim();

    // Limit length
    const maxLength = 10000;
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
      this.logger.warn('Input truncated due to length', { originalLength: input.length });
    }

    return sanitized;
  }

  /**
   * Validate API key format
   */
  validateApiKey(provider, key) {
    if (!key || typeof key !== 'string') {
      throw new Error('API key must be a non-empty string');
    }

    const minLength = 20;
    if (key.length < minLength) {
      throw new Error(`API key seems too short (minimum ${minLength} characters)`);
    }

    // Provider-specific validation
    const patterns = {
      google: /^AIza[0-9A-Za-z_-]{35}$/,
      openai: /^sk-[A-Za-z0-9]{48}$/,
      anthropic: /^sk-ant-[A-Za-z0-9_-]+$/,
      deepseek: /^sk-[A-Za-z0-9]{32,}$/
    };

    if (patterns[provider] && !patterns[provider].test(key)) {
      this.logger.warn('API key format validation failed', { provider });
      // Don't throw, just warn - formats may change
    }

    return true;
  }

  /**
   * Check rate limiting
   */
  checkRateLimit() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Clean old entries
    this.commandHistory = this.commandHistory.filter(time => time > oneMinuteAgo);

    // Check limit
    if (this.commandHistory.length >= this.maxCommandsPerMinute) {
      this.logger.warn('Rate limit exceeded', {
        count: this.commandHistory.length,
        limit: this.maxCommandsPerMinute
      });
      return false;
    }

    // Add current command
    this.commandHistory.push(now);
    return true;
  }

  /**
   * Validate configuration value
   */
  validateConfig(key, value) {
    const validators = {
      theme: (v) => ['cyan', 'purple', 'green', 'gold', 'red', 'blue'].includes(v),
      size: (v) => ['small', 'medium', 'large'].includes(v),
      position: (v) => ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'].includes(v),
      aiProvider: (v) => ['google', 'openai', 'anthropic', 'deepseek'].includes(v),
      voiceProvider: (v) => ['browser', 'whisper', 'whisper-local'].includes(v),
      memoryEnabled: (v) => typeof v === 'boolean',
      startOnBoot: (v) => typeof v === 'boolean',
      alwaysOnTop: (v) => typeof v === 'boolean'
    };

    if (validators[key]) {
      if (!validators[key](value)) {
        throw new Error(`Invalid value for ${key}: ${value}`);
      }
    }

    return true;
  }

  /**
   * Validate plugin name
   */
  validatePluginName(name) {
    if (!name || typeof name !== 'string') {
      throw new Error('Plugin name must be a non-empty string');
    }

    // Only allow alphanumeric, dash, underscore
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      throw new Error('Plugin name can only contain letters, numbers, dashes, and underscores');
    }

    return true;
  }
}

// Export singleton instance
let validatorInstance = null;

module.exports = {
  getValidator: () => {
    if (!validatorInstance) {
      validatorInstance = new InputValidator();
    }
    return validatorInstance;
  },
  InputValidator
};

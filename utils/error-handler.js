const { getLogger } = require('../utils/logger');

/**
 * ErrorHandler - Centralized error handling for Echo AI Agent
 * Provides consistent error handling, logging, and user-friendly messages
 */
class ErrorHandler {
  constructor() {
    this.logger = getLogger();
  }

  /**
   * Handle API errors with appropriate user messages
   */
  handleApiError(provider, error) {
    this.logger.error(`API Error from ${provider}`, error, { provider });

    const errorMessages = {
      'ENOTFOUND': `Cannot reach ${provider} servers. Please check your internet connection.`,
      'ETIMEDOUT': `Request to ${provider} timed out. Please try again.`,
      'ECONNREFUSED': `Connection to ${provider} was refused. Service may be down.`,
      '401': `Invalid API key for ${provider}. Please check your configuration.`,
      '403': `Access forbidden by ${provider}. Check your API key permissions.`,
      '429': `Rate limit exceeded for ${provider}. Please wait a moment.`,
      '500': `${provider} is experiencing issues. Please try again later.`,
      '503': `${provider} service is temporarily unavailable.`
    };

    // Check for specific error codes
    if (error.code && errorMessages[error.code]) {
      return errorMessages[error.code];
    }

    // Check for HTTP status codes in error message
    for (const [code, message] of Object.entries(errorMessages)) {
      if (error.message && error.message.includes(code)) {
        return message;
      }
    }

    // Generic fallback
    return `I encountered an error connecting to ${provider}. Please try again.`;
  }

  /**
   * Handle system command errors
   */
  handleSystemError(command, error) {
    this.logger.error(`System command failed: ${command}`, error, { command });

    const errorMessages = {
      'ENOENT': `Command or file not found: ${command}`,
      'EACCES': `Permission denied for: ${command}`,
      'EPERM': `Operation not permitted: ${command}`,
      'EEXIST': `File or folder already exists`,
      'ENOSPC': `Not enough disk space to complete operation`
    };

    if (error.code && errorMessages[error.code]) {
      return errorMessages[error.code];
    }

    return `Failed to execute: ${command}. ${error.message}`;
  }

  /**
   * Handle memory/storage errors
   */
  handleStorageError(operation, error) {
    this.logger.error(`Storage error during ${operation}`, error, { operation });

    if (error.code === 'ENOSPC') {
      return 'Storage is full. Please free up some space.';
    }

    if (error.code === 'EACCES') {
      return 'Permission denied accessing storage.';
    }

    return `Storage error during ${operation}. Please try again.`;
  }

  /**
   * Handle plugin errors
   */
  handlePluginError(pluginName, error) {
    this.logger.error(`Plugin error: ${pluginName}`, error, { plugin: pluginName });

    return `Plugin "${pluginName}" encountered an error: ${error.message}`;
  }

  /**
   * Handle validation errors
   */
  handleValidationError(field, message) {
    this.logger.warn(`Validation error: ${field}`, { field, message });
    return `Invalid ${field}: ${message}`;
  }

  /**
   * Wrap async functions with error handling
   */
  async wrapAsync(fn, context = 'operation') {
    try {
      return await fn();
    } catch (error) {
      this.logger.error(`Error in ${context}`, error, { context });
      throw error;
    }
  }

  /**
   * Safe execution with fallback
   */
  async safeExecute(fn, fallback, context = 'operation') {
    try {
      return await fn();
    } catch (error) {
      this.logger.error(`Error in ${context}, using fallback`, error, { context });
      return fallback;
    }
  }

  /**
   * Retry logic for transient failures with exponential backoff and jitter
   */
  async retry(fn, maxRetries = 3, delay = 1000, context = 'operation') {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        this.logger.warn(`Retry ${i + 1}/${maxRetries} for ${context}`, {
          context,
          attempt: i + 1,
          error: error.message
        });

        if (i < maxRetries - 1) {
          // Exponential backoff with jitter to prevent thundering herd
          const exponentialDelay = delay * Math.pow(2, i);
          const jitter = Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, exponentialDelay + jitter));
        }
      }
    }

    this.logger.error(`All retries failed for ${context}`, lastError, { context, maxRetries });
    throw lastError;
  }

  /**
   * Format error for user display
   */
  formatUserError(error, context = '') {
    if (typeof error === 'string') {
      return error;
    }

    if (error.userMessage) {
      return error.userMessage;
    }

    const contextPrefix = context ? `${context}: ` : '';
    return `${contextPrefix}${error.message || 'An unexpected error occurred'}`;
  }
}

// Export singleton instance
let errorHandlerInstance = null;

module.exports = {
  getErrorHandler: () => {
    if (!errorHandlerInstance) {
      errorHandlerInstance = new ErrorHandler();
    }
    return errorHandlerInstance;
  },
  ErrorHandler
};

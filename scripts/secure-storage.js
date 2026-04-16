const { safeStorage } = require('electron');
const Conf = require('conf').default;

/**
 * SecureStorage - Encrypts sensitive data using Electron's safeStorage API
 * Falls back to base64 encoding if encryption is unavailable
 */
class SecureStorage {
  constructor() {
    this.store = new Conf({
      projectName: 'echo-ai-agent-secure',
      encryptionKey: 'echo-secure-key-v1'
    });

    // Check if encryption is available
    this.encryptionAvailable = false;
    try {
      if (safeStorage && safeStorage.isEncryptionAvailable()) {
        this.encryptionAvailable = true;
      }
    } catch (e) {
      console.warn('Encryption not available, using fallback');
    }
  }

  /**
   * Encrypt and store a value
   */
  setSecure(key, value) {
    if (!value) {
      this.store.delete(key);
      return;
    }

    try {
      if (this.encryptionAvailable) {
        const buffer = safeStorage.encryptString(value);
        this.store.set(key, {
          encrypted: true,
          data: buffer.toString('base64')
        });
      } else {
        // Fallback: base64 encoding (NOT secure - just obfuscation)
        console.warn(`SecureStorage: Storing '${key}' as base64 (NOT ENCRYPTED). ` +
                     'File system access would expose this value.');
        this.store.set(key, {
          encrypted: false,
          data: Buffer.from(value).toString('base64')
        });
      }
    } catch (error) {
      console.error('Failed to store secure value:', error);
      throw new Error('Failed to store secure value');
    }
  }

  /**
   * Retrieve and decrypt a value
   */
  getSecure(key) {
    try {
      const stored = this.store.get(key);
      if (!stored || !stored.data) {
        return null;
      }

      if (stored.encrypted && this.encryptionAvailable) {
        const buffer = Buffer.from(stored.data, 'base64');
        return safeStorage.decryptString(buffer);
      } else {
        // Fallback: base64 decoding
        return Buffer.from(stored.data, 'base64').toString('utf8');
      }
    } catch (error) {
      console.error('Failed to retrieve secure value:', error);
      return null;
    }
  }

  /**
   * Check if a key exists
   */
  hasSecure(key) {
    return this.store.has(key);
  }

  /**
   * Delete a secure value
   */
  deleteSecure(key) {
    this.store.delete(key);
  }

  /**
   * Clear all secure storage
   */
  clearAll() {
    this.store.clear();
  }

  /**
   * Migrate plain text API keys to encrypted storage
   */
  migrateFromPlainText(plainTextKeys) {
    if (!plainTextKeys || typeof plainTextKeys !== 'object') {
      return;
    }

    Object.keys(plainTextKeys).forEach(provider => {
      const key = plainTextKeys[provider];
      if (key && typeof key === 'string') {
        this.setSecure(`apiKey_${provider}`, key);
      }
    });
  }

  /**
   * Get all API keys as an object
   */
  getAllApiKeys() {
    const keys = {};
    const providers = ['google', 'openai', 'anthropic', 'deepseek'];

    providers.forEach(provider => {
      const key = this.getSecure(`apiKey_${provider}`);
      if (key) {
        keys[provider] = key;
      }
    });

    return keys;
  }

  /**
   * Set API key for a provider
   */
  setApiKey(provider, key) {
    this.setSecure(`apiKey_${provider}`, key);
  }

  /**
   * Get API key for a provider
   */
  getApiKey(provider) {
    return this.getSecure(`apiKey_${provider}`);
  }

  /**
   * Delete API key for a provider
   */
  deleteApiKey(provider) {
    this.deleteSecure(`apiKey_${provider}`);
  }
}

module.exports = SecureStorage;

const Conf = require('conf');
const path = require('path');

class ConfigManager {
  constructor() {
    this.config = new Conf({
      projectName: 'echo-ai-agent',
      defaults: {
        configured: false,
        theme: 'cyan',
        position: 'bottom-right',
        size: 'medium',
        userName: 'User',
        aiProvider: 'google',
        model: 'gemini-2.0-flash-lite',
        apiKeys: {}, // DEPRECATED: Use SecureStorage instead
        voice: 'auto',
        hotkey: 'CommandOrControl+Shift+E',
        alwaysOnTop: true,
        startOnBoot: false,
        voiceProvider: 'browser',
        whisperStartup: false,
        memoryEnabled: true,
        workflows: {},
        plugins: ['example-plugin', 'productivity-plugin', 'system-control-plugin', 'workflow-plugin', 'reminder-plugin'],
        autoUpdateCheck: true,
        lastUpdateCheck: null,
        startupNotification: true,
        secureStorageMigrated: false
      }
    });

    // Initialize secure storage for API keys
    this.secureStorage = null;
    this._initSecureStorage();
  }

  _initSecureStorage() {
    try {
      // Only initialize in Electron context
      if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
        const SecureStorage = require('./secure-storage');
        this.secureStorage = new SecureStorage();

        // Auto-migrate old API keys if not already done
        if (!this.config.get('secureStorageMigrated')) {
          const oldKeys = this.config.get('apiKeys');
          if (oldKeys && Object.keys(oldKeys).length > 0) {
            this.secureStorage.migrateFromPlainText(oldKeys);
            this.config.set('apiKeys', {}); // Clear old keys
            this.config.set('secureStorageMigrated', true);
            console.log('✓ API keys migrated to secure storage');
          }
        }
      }
    } catch (error) {
      console.warn('Secure storage not available:', error.message);
    }
  }

  get(key) {
    // Intercept apiKeys access and redirect to secure storage
    if (key === 'apiKeys' && this.secureStorage) {
      return this.secureStorage.getAllApiKeys();
    }
    return this.config.get(key);
  }

  set(key, value) {
    // Intercept apiKeys setting and redirect to secure storage
    if (key === 'apiKeys' && this.secureStorage && value) {
      Object.keys(value).forEach(provider => {
        this.secureStorage.setApiKey(provider, value[provider]);
      });
      return;
    }
    this.config.set(key, value);
  }

  /**
   * Get API key for a specific provider (secure)
   */
  getApiKey(provider) {
    if (this.secureStorage) {
      return this.secureStorage.getApiKey(provider);
    }
    // Fallback to old storage
    const keys = this.config.get('apiKeys') || {};
    return keys[provider];
  }

  /**
   * Set API key for a specific provider (secure)
   */
  setApiKey(provider, key) {
    if (this.secureStorage) {
      this.secureStorage.setApiKey(provider, key);
    } else {
      // Fallback to old storage
      const keys = this.config.get('apiKeys') || {};
      keys[provider] = key;
      this.config.set('apiKeys', keys);
    }
  }

  has(key) {
    return this.config.has(key);
  }

  delete(key) {
    this.config.delete(key);
  }

  clear() {
    this.config.clear();
  }

  get store() {
    return this.config.store;
  }

  getThemeColors(themeName) {
    const themes = {
      cyan: { core: '#00f2ff', glow: 'rgba(0, 242, 255, 0.5)' },
      purple: { core: '#a855f7', glow: 'rgba(168, 85, 247, 0.5)' },
      green: { core: '#00ff88', glow: 'rgba(0, 255, 136, 0.5)' },
      gold: { core: '#ffd700', glow: 'rgba(255, 215, 0, 0.5)' },
      red: { core: '#ff0055', glow: 'rgba(255, 0, 85, 0.5)' },
      blue: { core: '#0088ff', glow: 'rgba(0, 136, 255, 0.5)' }
    };
    return themes[themeName] || themes.cyan;
  }

  getWindowPosition(position, screenSize, windowSize) {
    const positions = {
      'top-left': { x: 20, y: 20 },
      'top-right': { x: screenSize.width - windowSize.width - 20, y: 20 },
      'bottom-left': { x: 20, y: screenSize.height - windowSize.height - 20 },
      'bottom-right': { 
        x: screenSize.width - windowSize.width - 20, 
        y: screenSize.height - windowSize.height - 20 
      },
      'center': { 
        x: (screenSize.width - windowSize.width) / 2, 
        y: (screenSize.height - windowSize.height) / 2 
      }
    };
    return positions[position] || positions['bottom-right'];
  }

  getWindowSize(size) {
    const sizes = {
      small: { width: 250, height: 350 },
      medium: { width: 350, height: 450 },
      large: { width: 450, height: 550 }
    };
    return sizes[size] || sizes.medium;
  }
}

module.exports = ConfigManager;

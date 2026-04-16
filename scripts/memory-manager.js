const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

class MemoryManager {
    constructor() {
        this.memoryDir = path.join(os.homedir(), '.echo-memory');
        this.historyFile = path.join(this.memoryDir, 'chat-history.enc');
        this.factsFile = path.join(this.memoryDir, 'user-facts.enc');

        // Encryption setup
        this.algorithm = 'aes-256-cbc';
        // Use safeStorage key if available, otherwise fallback to machine-based key
        this.key = this.deriveEncryptionKey();

        // Memory limits
        this.maxHistorySize = 1000; // Maximum messages to keep
        this.maxContextWindow = 50; // Maximum messages to send to AI
        this.maxMessageLength = 10000; // Maximum length per message
        this.maxTotalSize = 10 * 1024 * 1024; // 10MB max file size

        this.init();
    }

    /**
     * Derive encryption key with improved security
     * Uses safeStorage if available, otherwise uses machine-specific key
     */
    deriveEncryptionKey() {
        try {
            // Try to use Electron's safeStorage for a more secure key
            const { safeStorage } = require('electron');
            if (safeStorage && safeStorage.isEncryptionAvailable()) {
                // Generate a stable key from safeStorage
                const encrypted = safeStorage.encryptString('echo-memory-key-stable-seed');
                return crypto.scryptSync(encrypted.toString('hex'), 'echo-salt-v2', 32);
            }
        } catch (e) {
            // safeStorage not available, fallback to machine-based key
        }

        // Fallback: machine-based key (still better than nothing for local storage)
        const machineInfo = os.hostname() + os.userInfo().username + os.platform();
        return crypto.scryptSync(machineInfo, 'echo-salt-v2', 32);
    }

    init() {
        if (!fs.existsSync(this.memoryDir)) {
            fs.mkdirSync(this.memoryDir, { recursive: true });
        }

        // Check and prune if needed on initialization
        this.pruneIfNeeded();
    }

    /**
     * Encrypt data
     */
    encrypt(text) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    }

    /**
     * Decrypt data
     */
    decrypt(text) {
        try {
            const textParts = text.split(':');
            const iv = Buffer.from(textParts.shift(), 'hex');
            const encryptedText = Buffer.from(textParts.join(':'), 'hex');
            const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
            let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (e) {
            return null;
        }
    }

    /**
     * Store a message in history with automatic pruning
     */
    saveMessage(role, text) {
        // Truncate message if too long
        if (text.length > this.maxMessageLength) {
            text = text.substring(0, this.maxMessageLength) + '... [truncated]';
        }

        let history = this.getAllHistory();
        history.push({
            role,
            parts: [{ text }],
            timestamp: new Date().toISOString()
        });

        // Prune old messages if exceeding limit
        if (history.length > this.maxHistorySize) {
            history = history.slice(-this.maxHistorySize);
        }

        const encryptedData = this.encrypt(JSON.stringify(history));

        // Check file size before writing
        if (Buffer.byteLength(encryptedData) > this.maxTotalSize) {
            // Emergency pruning - keep only recent half
            history = history.slice(-Math.floor(this.maxHistorySize / 2));
            const prunedData = this.encrypt(JSON.stringify(history));
            fs.writeFileSync(this.historyFile, prunedData);
        } else {
            fs.writeFileSync(this.historyFile, encryptedData);
        }
    }

    /**
     * Get chat history for AI context window
     * @param {number} limit Number of recent messages to retrieve (default: 50)
     */
    getHistory(limit = null) {
        const effectiveLimit = limit || this.maxContextWindow;
        const fullHistory = this.getAllHistory();
        // Return only the most recent messages for the AI context window
        return fullHistory.slice(-effectiveLimit);
    }

    /**
     * Get all stored history
     */
    getAllHistory() {
        if (!fs.existsSync(this.historyFile)) {
            return [];
        }
        try {
            const encryptedData = fs.readFileSync(this.historyFile, 'utf8');
            const decryptedData = this.decrypt(encryptedData);
            if (decryptedData === null) {
                // Decryption failed - likely key mismatch
                console.warn('Memory decryption failed. Data may be inaccessible due to key change.');
                return [];
            }
            return JSON.parse(decryptedData);
        } catch (e) {
            console.error('Error reading history:', e);
            return [];
        }
    }

    /**
     * Get memory usage statistics
     */
    getMemoryStats() {
        const history = this.getAllHistory();
        let totalSize = 0;

        if (fs.existsSync(this.historyFile)) {
            totalSize += fs.statSync(this.historyFile).size;
        }
        if (fs.existsSync(this.factsFile)) {
            totalSize += fs.statSync(this.factsFile).size;
        }

        return {
            messageCount: history.length,
            totalSizeBytes: totalSize,
            totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
            maxMessages: this.maxHistorySize,
            utilizationPercent: ((history.length / this.maxHistorySize) * 100).toFixed(1)
        };
    }

    /**
     * Prune old messages if needed
     */
    pruneIfNeeded() {
        const stats = this.getMemoryStats();

        // If over 90% capacity, prune to 70%
        if (stats.messageCount > this.maxHistorySize * 0.9) {
            const history = this.getAllHistory();
            const targetSize = Math.floor(this.maxHistorySize * 0.7);
            const prunedHistory = history.slice(-targetSize);

            const encryptedData = this.encrypt(JSON.stringify(prunedHistory));
            fs.writeFileSync(this.historyFile, encryptedData);

            console.log(`Memory pruned: ${stats.messageCount} -> ${targetSize} messages`);
        }
    }

    /**
     * Search history for keywords
     * @param {string} query Search query
     */
    searchHistory(query) {
        const history = this.getAllHistory();
        const lowerQuery = query.toLowerCase();

        return history.filter(msg => {
            const text = msg.parts?.[0]?.text?.toLowerCase();
            return text && text.includes(lowerQuery);
        });
    }

    /**
     * Clear all memory files
     */
    clearMemory() {
        if (fs.existsSync(this.historyFile)) fs.unlinkSync(this.historyFile);
        if (fs.existsSync(this.factsFile)) fs.unlinkSync(this.factsFile);

        // Also clear legacy unencrypted files if they exist
        const legacyHistory = path.join(this.memoryDir, 'chat-history.json');
        const legacyFacts = path.join(this.memoryDir, 'user-facts.json');
        if (fs.existsSync(legacyHistory)) fs.unlinkSync(legacyHistory);
        if (fs.existsSync(legacyFacts)) fs.unlinkSync(legacyFacts);

        return true;
    }

    /**
     * Store a specific fact about the user
     */
    saveFact(key, value) {
        const facts = this.getFacts();
        facts[key] = value;
        const encryptedData = this.encrypt(JSON.stringify(facts));
        fs.writeFileSync(this.factsFile, encryptedData);
    }

    /**
     * Get all known facts
     */
    getFacts() {
        if (!fs.existsSync(this.factsFile)) {
            return {};
        }
        try {
            const encryptedData = fs.readFileSync(this.factsFile, 'utf8');
            const decryptedData = this.decrypt(encryptedData);
            return decryptedData ? JSON.parse(decryptedData) : {};
        } catch (e) {
            return {};
        }
    }
}

module.exports = MemoryManager;

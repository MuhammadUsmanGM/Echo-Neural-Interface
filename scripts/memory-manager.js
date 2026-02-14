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
        // Unique key based on machine info (simplified for local use)
        this.key = crypto.scryptSync(os.hostname() + os.userInfo().username, 'echo-salt', 32);
        
        this.init();
    }

    init() {
        if (!fs.existsSync(this.memoryDir)) {
            fs.mkdirSync(this.memoryDir, { recursive: true });
        }
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
     * Store a message in history
     */
    saveMessage(role, text) {
        let history = this.getAllHistory();
        history.push({
            role,
            parts: [{ text }],
            timestamp: new Date().toISOString()
        });
        
        // No arbitrary limit on local storage
        // history = history.slice(-50); 
        
        const encryptedData = this.encrypt(JSON.stringify(history));
        fs.writeFileSync(this.historyFile, encryptedData);
    }

    /**
     * Get chat history for Gemini context window
     * @param {number} limit Number of recent messages to retrieve (default: 50)
     */
    getHistory(limit = 50) {
        const fullHistory = this.getAllHistory();
        // Return only the most recent messages for the AI context window
        // to avoid hitting token limits while preserving full history on disk
        return fullHistory.slice(-limit);
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
            return decryptedData ? JSON.parse(decryptedData) : [];
        } catch (e) {
            console.error('Error reading history:', e);
            return [];
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
            const text = msg.parts[0].text.toLowerCase();
            return text.includes(lowerQuery);
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

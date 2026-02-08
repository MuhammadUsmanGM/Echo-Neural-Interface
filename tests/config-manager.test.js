const ConfigManager = require('../scripts/config-manager');
const fs = require('fs');

// Mock `conf` to avoid writing to disk during tests
jest.mock('conf', () => {
    return class MockConf {
        constructor() {
            this.store = {};
        }
        get(key) { return this.store[key]; }
        set(key, val) { this.store[key] = val; }
        has(key) { return key in this.store; }
        delete(key) { delete this.store[key]; }
        clear() { this.store = {}; }
    };
});

describe('ConfigManager', () => {
    let config;

    beforeEach(() => {
        config = new ConfigManager();
    });

    test('should set and get values correctly', () => {
        config.set('theme', 'purple');
        expect(config.get('theme')).toBe('purple');
    });

    test('should return default window size', () => {
        const size = config.getWindowSize('medium');
        expect(size).toEqual({ width: 350, height: 450 });
    });

    test('should return correct theme colors for cyan', () => {
        const colors = config.getThemeColors('cyan');
        expect(colors.core).toBe('#00f2ff');
    });

    // Add more tests as needed
});

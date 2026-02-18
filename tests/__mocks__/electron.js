// Mock Electron module for testing
module.exports = {
  app: {
    getPath: jest.fn((name) => {
      if (name === 'logs') return '/tmp/echo-logs';
      if (name === 'userData') return '/tmp/echo-data';
      return '/tmp';
    }),
    getVersion: jest.fn(() => '1.0.6'),
    getName: jest.fn(() => 'echo-ai-agent'),
    setLoginItemSettings: jest.fn(),
    whenReady: jest.fn(() => Promise.resolve()),
    on: jest.fn(),
    quit: jest.fn()
  },
  BrowserWindow: jest.fn().mockImplementation(() => ({
    loadFile: jest.fn(),
    on: jest.fn(),
    webContents: {
      send: jest.fn(),
      on: jest.fn()
    },
    show: jest.fn(),
    hide: jest.fn(),
    focus: jest.fn(),
    isVisible: jest.fn(() => true)
  })),
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn()
  },
  screen: {
    getPrimaryDisplay: jest.fn(() => ({
      workAreaSize: { width: 1920, height: 1080 }
    }))
  },
  globalShortcut: {
    register: jest.fn(),
    unregisterAll: jest.fn()
  },
  Menu: {
    buildFromTemplate: jest.fn(() => ({
      popup: jest.fn()
    }))
  },
  Tray: jest.fn().mockImplementation(() => ({
    setToolTip: jest.fn(),
    setContextMenu: jest.fn(),
    on: jest.fn()
  })),
  safeStorage: {
    isEncryptionAvailable: jest.fn(() => true),
    encryptString: jest.fn((str) => Buffer.from(str)),
    decryptString: jest.fn((buf) => buf.toString())
  }
};

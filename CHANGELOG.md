# Changelog

All notable changes to Echo AI Agent will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.5] - 2026-02-07

### 🛡️ Security & Reliability Updates
- **Security**: Replaced `eval()` in plugins with safer `Function` constructor validation.
- **Security**: Added input sanitization for system commands to prevent injection attacks.
- **Architecture**: Implemented `electron-log` for robust error logging.
- **DX**: Added ESLint, Prettier, and Jest configuration for better development practices.
- **CI/CD**: Added GitHub Actions workflow for automated testing and linting.
- **UX**: Improved accessibility (ARIA labels) and added specific help instructions to the AI.

## [1.0.0] - 2026-02-07

### 🎉 Initial Release

#### Added
- ✨ Beautiful holographic UI with animated blobs and rings
- 🧠 Google Gemini 2.0 Flash Lite integration for AI-powered commands
- 🎤 Voice control using Web Speech API
- 🔊 Text-to-speech responses
- 🎨 6 stunning themes (Cyan, Purple, Green, Gold, Red, Blue)
- 💻 Cross-platform support (Windows, macOS, Linux)
- ⚙️ Interactive setup wizard
- 🔧 Configuration management system
- ⌨️ Global hotkey support (Ctrl+Shift+E)
- 📦 npm package with CLI interface
- 🌐 Web search functionality
- 📁 File and folder management
- 📸 Screenshot capability
- 🖥️ System information queries
- ⏰ Time and date commands
- 📂 Directory listing
- 🔗 URL opening in default browser

#### Features
- Transparent, always-on-top window
- Customizable window position (5 presets)
- Customizable window size (3 sizes)
- Real-time audio visualization
- Persistent configuration storage
- Post-install welcome message
- Comprehensive CLI commands

#### Documentation
- Professional README with badges
- MIT License
- Setup guide
- Command examples
- Configuration documentation

---

## [Unreleased]

### Planned Features
- [ ] Plugin system for custom commands
- [ ] Cloud sync for settings
- [ ] Multi-language support
- [ ] Custom wake word detection
- [ ] Advanced automation workflows
- [ ] Mobile companion app
- [ ] Integration with smart home devices
- [ ] Voice training for better recognition

---

## Version History

### Version 1.0.0 - Initial Release
The first public release of Echo AI Agent, featuring a complete JARVIS-inspired desktop assistant with voice control, AI intelligence, and beautiful UI.

---

[1.0.0]: https://github.com/MuhammadUsmanGM/Echo/releases/tag/v1.0.0

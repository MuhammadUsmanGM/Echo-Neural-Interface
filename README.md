<div align="center">

# 🤖 Echo AI Agent

### *Your Personal JARVIS-Inspired Desktop Assistant*

[![npm version](https://img.shields.io/npm/v/echo-ai-agent.svg?style=flat-square)](https://www.npmjs.com/package/echo-ai-agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/node/v/echo-ai-agent.svg?style=flat-square)](https://nodejs.org)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=flat-square)](https://github.com/MuhammadUsmanGM/Echo)

**Voice-controlled • AI-powered • Beautiful • Cross-platform**

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Themes](#-themes) • [Commands](#-commands) • [Contributing](#-contributing)

</div>

---

## ✨ Features

### 🎨 **Premium Holographic UI**
- Stunning animated holographic core with liquid morphing effects
- Multiple beautiful themes (Cyan, Purple, Green, Gold, Red, Blue)
- Transparent, always-on-top window that doesn't interrupt your workflow
- Smooth CSS3 animations for a premium feel

### 🧠 **AI-Powered Intelligence**
- Powered by **Google Gemini 2.0 Flash Lite** for advanced reasoning
- Natural language understanding for intuitive commands
- Context-aware responses with JARVIS-like personality
- Function calling for seamless system integration

### 🎤 **Voice & Text Control**
- Hands-free voice commands using Web Speech API
- Text-to-speech responses with customizable voices
- Real-time audio visualization that reacts to your voice
- Automatic wake-up on voice detection

### 💻 **Cross-Platform System Control**
- **Windows**, **macOS**, and **Linux** support
- Open applications, search the web, manage files
- Take screenshots, get system info, check time/date
- Create folders, copy/delete files, and more

### ⚙️ **Highly Customizable**
- 6 stunning pre-built themes
- Configurable window position and size
- Global hotkey support (default: `Ctrl+Shift+E`)
- Always-on-top toggle
- Persistent configuration storage

### 🔌 **Developer-Friendly**
- Clean, modular architecture
- Easy to extend with custom commands
- Plugin system ready
- Well-documented codebase

---

## 🚀 Installation

### Quick Install (Recommended)

```bash
npm install -g echo-ai-agent
```

### From Source

```bash
git clone https://github.com/MuhammadUsmanGM/Echo.git
cd Echo
npm install
```

---

## 📖 Usage

### First Time Setup

Run the interactive setup wizard:

```bash
echo setup
```

This will guide you through:
1. Setting up your Google Gemini API key ([Get one free](https://aistudio.google.com/))
2. Choosing your theme
3. Configuring window position and size
4. Setting preferences

### Launch Echo

```bash
echo start
```

Or simply:

```bash
echo
```

### CLI Commands

```bash
echo start          # Launch Echo AI Agent
echo setup          # Run setup wizard
echo config --list  # View current configuration
echo themes         # List available themes
echo info           # Display system information
echo --help         # Show all commands
```

---

## 🎨 Themes

Echo comes with 6 stunning themes:

| Theme | Color | Description |
|-------|-------|-------------|
| **Cyan** | ![#00f2ff](https://via.placeholder.com/15/00f2ff/000000?text=+) `#00f2ff` | Classic JARVIS (Default) |
| **Purple** | ![#a855f7](https://via.placeholder.com/15/a855f7/000000?text=+) `#a855f7` | Royal Purple |
| **Green** | ![#00ff88](https://via.placeholder.com/15/00ff88/000000?text=+) `#00ff88` | Matrix Green |
| **Gold** | ![#ffd700](https://via.placeholder.com/15/ffd700/000000?text=+) `#ffd700` | Iron Man Gold |
| **Red** | ![#ff0055](https://via.placeholder.com/15/ff0055/000000?text=+) `#ff0055` | Cyberpunk Red |
| **Blue** | ![#0088ff](https://via.placeholder.com/15/0088ff/000000?text=+) `#0088ff` | Ocean Blue |

**Change theme:**
```bash
echo config --set theme purple
```

---

## 🎯 Commands

### Voice Command Examples

- **"Open Chrome and search for the latest news"**
- **"Create a folder named Project-Echo on my desktop"**
- **"What's the current time?"**
- **"Take a screenshot"**
- **"Show me system information"**
- **"Open Spotify"**
- **"List files in my home directory"**

### Supported Actions

| Action | Example Command |
|--------|----------------|
| 🌐 Web Search | "Search for AI news" |
| 📁 Create Folder | "Create a folder named MyProject" |
| 📸 Screenshot | "Take a screenshot" |
| 🖥️ System Info | "Show system information" |
| ⏰ Time/Date | "What time is it?" |
| 📂 List Files | "List files in Documents" |
| 🚀 Open Apps | "Open VS Code" |
| 🔗 Open URL | "Open github.com" |

---

## ⚙️ Configuration

### Configuration File

Echo stores configuration in `~/.config/echo-ai-agent/config.json`

### Available Settings

```javascript
{
  "theme": "cyan",              // cyan, purple, green, gold, red, blue
  "position": "bottom-right",   // top-left, top-right, bottom-left, bottom-right, center
  "size": "medium",             // small, medium, large
  "alwaysOnTop": true,          // true, false
  "hotkey": "CommandOrControl+Shift+E",
  "apiKey": "your_api_key_here"
}
```

### Manage Configuration

```bash
# View all settings
echo config --list

# Set a value
echo config --set theme purple
echo config --set position center
echo config --set size large

# Reset to defaults
echo config --reset
```

---

## 🔑 API Key Setup

Echo uses Google's Gemini AI for intelligent command processing.

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Create a free API key
3. Run `echo setup` and enter your key
4. Or manually set it: `echo config --set apiKey YOUR_KEY`

**Note:** The free tier includes generous limits perfect for personal use.

---

## 🛠️ Development

### Project Structure

```
Echo/
├── cli.js                 # CLI entry point
├── main/
│   ├── main.js           # Electron main process
│   └── preload.js        # Preload script
├── services/
│   ├── gemini.js         # AI brain
│   └── system.js         # System actions
├── scripts/
│   ├── config-manager.js # Configuration management
│   ├── setup-wizard.js   # Interactive setup
│   └── postinstall.js    # Post-install script
├── ui/
│   ├── index.html        # UI markup
│   ├── style.css         # Styles
│   └── renderer.js       # Renderer process
└── package.json
```

### Run in Development Mode

```bash
npm run dev
```

### Build from Source

```bash
git clone https://github.com/MuhammadUsmanGM/Echo.git
cd Echo
npm install
npm start
```

---

## 🌟 Why Echo?

| Feature | Echo | Other Assistants |
|---------|------|------------------|
| **Beautiful UI** | ✅ Holographic animations | ❌ CLI or basic UI |
| **Privacy** | ✅ Local-first, minimal cloud | ❌ Cloud-dependent |
| **Customizable** | ✅ Themes, positions, sizes | ❌ Fixed appearance |
| **Cross-Platform** | ✅ Windows, macOS, Linux | ⚠️ Limited platforms |
| **Open Source** | ✅ MIT License | ❌ Proprietary |
| **Extensible** | ✅ Plugin-ready architecture | ❌ Closed system |
| **Free** | ✅ Completely free | ⚠️ Paid or limited |

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Ideas for Contributions

- 🎨 New themes
- 🔌 Plugin system implementation
- 🌍 Internationalization (i18n)
- 📱 Mobile companion app
- 🧪 Test coverage
- 📚 Documentation improvements

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Gemini AI** for the intelligent brain
- **Electron** for cross-platform desktop support
- **Web Speech API** for voice recognition
- Inspired by **JARVIS** from Iron Man

---

## 📞 Support

- 🐛 **Bug Reports:** [GitHub Issues](https://github.com/MuhammadUsmanGM/Echo/issues)
- 💡 **Feature Requests:** [GitHub Discussions](https://github.com/MuhammadUsmanGM/Echo/discussions)
- 📧 **Contact:** [Your Email]

---

## 🗺️ Roadmap

- [ ] Plugin system for custom commands
- [ ] Cloud sync for settings
- [ ] Mobile companion app
- [ ] Multi-language support
- [ ] Custom wake word detection
- [ ] Integration with smart home devices
- [ ] Advanced automation workflows
- [ ] Voice training for better recognition

---

<div align="center">

**Made with ❤️ by Muhammad Usman**

⭐ Star this repo if you find it helpful!

[Report Bug](https://github.com/MuhammadUsmanGM/Echo/issues) • [Request Feature](https://github.com/MuhammadUsmanGM/Echo/issues) • [Documentation](https://github.com/MuhammadUsmanGM/Echo#readme)

</div>

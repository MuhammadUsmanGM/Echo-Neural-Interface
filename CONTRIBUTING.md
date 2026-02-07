# Contributing to Echo AI Agent

First off, thank you for considering contributing to Echo! It's people like you that make Echo such a great tool. 🎉

## 🌟 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if applicable**
- **Include your environment details** (OS, Node version, Echo version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List examples of how it would be used**

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Write clear commit messages**
6. **Submit a pull request**

## 🎨 Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/Echo.git
cd Echo

# Install dependencies
npm install

# Run in development mode
npm run dev
```

## 📝 Coding Standards

### JavaScript Style Guide

- Use **ES6+** features
- Use **const** and **let**, avoid **var**
- Use **arrow functions** where appropriate
- Use **async/await** instead of callbacks
- Add **comments** for complex logic
- Keep functions **small and focused**

### Code Formatting

```javascript
// Good
async function processCommand(text) {
    const result = await brain.analyze(text);
    return result;
}

// Bad
function processCommand(text, callback) {
    brain.analyze(text, function(err, result) {
        callback(err, result);
    });
}
```

### Naming Conventions

- **camelCase** for variables and functions
- **PascalCase** for classes
- **UPPER_CASE** for constants
- **Descriptive names** that explain purpose

## 🧪 Testing

Before submitting a PR:

1. Test on your target platform(s)
2. Verify all existing features still work
3. Test edge cases
4. Check for console errors

## 📚 Documentation

- Update README.md if adding features
- Add JSDoc comments for new functions
- Update CHANGELOG.md
- Include examples in documentation

## 🎯 Areas for Contribution

### High Priority

- 🔌 **Plugin System** - Allow users to extend Echo with custom commands
- 🧪 **Test Coverage** - Add unit and integration tests
- 🌍 **Internationalization** - Support multiple languages
- 📱 **Mobile App** - Companion app for mobile devices

### Medium Priority

- 🎨 **New Themes** - Create additional color themes
- 🔊 **Voice Improvements** - Better voice recognition and synthesis
- ⚡ **Performance** - Optimize startup time and memory usage
- 📖 **Documentation** - Improve guides and examples

### Good First Issues

- 🐛 **Bug Fixes** - Fix reported issues
- 📝 **Documentation** - Improve README and guides
- 🎨 **UI Tweaks** - Small visual improvements
- ♿ **Accessibility** - Make Echo more accessible

## 🏗️ Project Structure

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
│   ├── config-manager.js # Configuration
│   ├── setup-wizard.js   # Setup wizard
│   └── postinstall.js    # Post-install
├── ui/
│   ├── index.html        # UI markup
│   ├── style.css         # Styles
│   └── renderer.js       # Renderer process
└── package.json
```

## 🔄 Git Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Code refactoring

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
feat: add plugin system
fix: resolve theme switching bug
docs: update installation guide
refactor: simplify config manager
```

### Example Workflow

```bash
# Create a feature branch
git checkout -b feature/plugin-system

# Make changes and commit
git add .
git commit -m "feat: add basic plugin architecture"

# Push to your fork
git push origin feature/plugin-system

# Create a pull request on GitHub
```

## 🎨 Adding a New Theme

1. Open `scripts/config-manager.js`
2. Add your theme to the `getThemeColors` method:

```javascript
getThemeColors(themeName) {
    const themes = {
        // ... existing themes
        mytheme: { 
            core: '#ff00ff', 
            glow: 'rgba(255, 0, 255, 0.5)' 
        }
    };
    return themes[themeName] || themes.cyan;
}
```

3. Update `cli.js` to include your theme in the list
4. Test the theme thoroughly
5. Submit a PR with screenshots

## 🔌 Creating a Plugin (Future)

When the plugin system is implemented, plugins will follow this structure:

```javascript
module.exports = {
    name: 'my-plugin',
    version: '1.0.0',
    commands: {
        'my-command': async (args) => {
            // Your command logic
            return { success: true, message: 'Done!' };
        }
    }
};
```

## 📋 Checklist Before Submitting PR

- [ ] Code follows the style guidelines
- [ ] Self-review of code completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings or errors
- [ ] Tested on target platform(s)
- [ ] CHANGELOG.md updated

## 💬 Questions?

Feel free to:
- Open an issue for discussion
- Join our community discussions
- Reach out to maintainers

## 📜 Code of Conduct

### Our Pledge

We are committed to making participation in this project a harassment-free experience for everyone.

### Our Standards

- **Be respectful** and inclusive
- **Be collaborative** and helpful
- **Be patient** with newcomers
- **Accept constructive criticism** gracefully
- **Focus on what's best** for the community

## 🙏 Thank You!

Your contributions make Echo better for everyone. We appreciate your time and effort! ⭐

---

**Happy Coding!** 🚀

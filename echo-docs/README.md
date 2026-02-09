<div align="center">

# 📗 Echo Documentation Hub

### *The Emerald Portal: Technical & Visual Guide*

**React + TypeScript + Vite + Lucide**

[Visual UI](#-visual-ui) • [System Logic](#-system-logic) • [Developer SDK](#-developer-sdk) • [Build Guide](#-build-guide)

</div>

---

## 🏛️ Architecture Overview

The **Echo Documentation Hub** is a high-performance, single-page application (SPA) designed to serve as the definitive offline manual for the Echo AI Agent. It leverages a modern React stack to provide a fluid, premium browsing experience with Zero-Latency navigation.

### 🎨 Design System
- **Emerald Brand Identity**: Built on a palette of `Emerald Green (#50C878)`, `Deep Slate`, and `Glassmorphic Translucency`.
- **Responsive Layout**: Fluid sidebar navigation that collapses on mobile viewports.
- **Dynamic Content Sections**: Uses intersection observers to trace user progress through the manual.

---

## 🛠️ Main Components

### 1. `App.tsx` (The Engine)
The central orchestrator of the documentation. It manages:
- **Navigation State**: Tracking the active reading section.
- **Theme Engine**: Seamlessly switching between Light/Dark modes.
- **Content Hierarchy**: Organizing complex system settings into digestible `DocSection` blocks.

### 2. `DocSection.tsx`
A specialized wrapper for documentation content. It automatically registers with the navigation layout and provides consistent styling for headers, text content, and grid layouts.

### 3. `Terminal.tsx`
A custom-built CLI simulator component used to demonstrate real `echo` commands. It features interactive syntax highlighting and curated output examples.

---

## 🚀 Development & Build

### Local Development
To work on the documentation portal locally:

```bash
cd echo-docs
npm install
npm run dev
```

### Production Build
The documentation must be compiled into static assets for the `echo docs` server to deliver them via Port 1138.

```bash
npm run build
```
*Note: The build output is exported to the root `docs/` or `dist/` directory depending on deployment configuration.*

---

## 🔌 Integration with Echo CLI

The documentation hub is not just a website; it's a first-class citizen of the Echo CLI ecosystem.
- **Server**: Spun up by `scripts/docs-server.js`.
- **Port Management**: Features an automated fallback system (tries 1138, then 1139, 1140, 1141).
- **Mime Typing**: Fully supports high-definition assets like `.webp` logos and `.svg` neural diagrams.

---

<div align="center">

**Part of the Echo AI Ecosystem**

[Main Repository](https://github.com/MuhammadUsmanGM/Echo-Neural-Interface) • [Report Issues](https://github.com/MuhammadUsmanGM/Echo-Neural-Interface/issues)

</div>

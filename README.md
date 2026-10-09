# TerraMind — Your Offline AI Nature Companion

> **"AI that helps you disconnect from the screen and reconnect with the world."**  
> Built for the **Hacktoberfest 2026 DEV Challenge: "Touch Grass"**.

TerraMind uses local artificial intelligence for a mindful purpose: getting you away from glowing screens and into sensory-rich outdoor exploration. Receive personalized outdoor missions, explore phone-free in an immersive distraction-free mode, and record your natural discoveries in a private, encrypted local journal.

---

## 🌿 Product Overview

Most modern AI apps are designed to keep you trapped in a chat box, staring at a browser. TerraMind flips the paradigm:
1. **Calibrate**: Input your available time (10 min to 3 hours), energy level (Low, Medium, High), and nature interests (Birdwatching, Trees, Mindfulness, Macro Photography, Streams, Insects, etc.).
2. **Synthesize**: Local Ollama AI (`llama3.2`) or our built-in Offline Botanical Heuristic Engine creates a tailored outdoor expedition with step-by-step instructions, equipment, safety notes, and an interactive discovery checklist.
3. **Touch Grass**: Switch into **Screen-Free Distraction-Free Mode**, place your device in your pocket, and explore the outdoors. Pull it out only to check off sensory discoveries with satisfying haptic feedback and gentle audio chimes.
4. **Reflect**: Return home and record observations in your private local **Field Journal**.

---

## 🚀 Key Features

- **Local Ollama Integration**: Genuine on-device AI generation via Ollama HTTP API (`http://localhost:11434`), supporting `/api/tags`, `/api/version`, and `/api/generate` or `/api/chat`.
- **Offline Botanical Heuristic Engine**: Full standalone offline generation for when you're off-grid or don't have Ollama running. Transparent provenance labeling ensures you always know which engine produced your mission.
- **Distraction-Free Exploration Mode**: High-contrast, large-touch-target screen-free view designed for cold fingers and direct sunlight.
- **100% Private IndexedDB Persistence**: All missions, checklist progress, notes, and journal entries are stored strictly inside your browser's local IndexedDB. Zero remote database telemetry, zero tracking, zero cloud accounts.
- **Progressive Web App (PWA)**: Installable to your home screen or desktop with service worker caching, manifest, maskable icons, and full offline accessibility.
- **Field Journal with Moods & Tags**: Log thoughts with botanical states of mind (Radiant, Grounded, Quiet, Distracted), location, weather, and category tags.
- **Real Progress Metrics**: No fake gamification or fabricated stats. Accurately sums real minutes spent outdoors and verified checklist discoveries.
- **Full Data Ownership**: Export your entire dataset as a clean JSON archive anytime, or wipe everything with one-click data clearance.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Local AI**: Ollama (`llama3.2`, `llama3.1`, `mistral`, `gemma2`, `phi3`)
- **Backend / Proxy**: Express, tsx, Node.js (with proxy support for Ollama CORS mitigation)
- **Local Persistence**: Browser IndexedDB (`TerraMindDB`)
- **PWA Tooling**: `vite-plugin-pwa`, Web App Manifest, Service Worker CacheFirst strategies
- **Icons & Motion**: Lucide React, Motion

---

## 📦 Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm**
- **Ollama** (optional, for local LLM generation): [Download Ollama](https://ollama.com)

---

## ⚙️ Installation & Development

### 1. Clone & Install
```bash
git clone https://github.com/your-username/terramind.git
cd terramind
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:3000`.

### 3. Build for Production
```bash
npm run build
npm start
```

---

## 🦙 Ollama Local AI Setup

TerraMind connects directly to your local Ollama daemon.

### 1. Install & Launch Ollama
Download and install Ollama from [ollama.com](https://ollama.com).

### 2. Pull Recommended Model
In your terminal, pull the default `llama3.2` model:
```bash
ollama pull llama3.2
```
*(You can also use `llama3.1`, `mistral`, `gemma2`, or `phi3` — all selectable in TerraMind Settings).*

### 3. Run Ollama with Cross-Origin Support (Optional for direct browser fetch)
If connecting directly from the browser without the proxy:
```bash
# macOS / Linux
OLLAMA_ORIGINS="*" ollama serve

# Windows (PowerShell)
$env:OLLAMA_ORIGINS="*" ; ollama serve
```

### 4. Test Connection
Open TerraMind, navigate to **Settings**, and click **Test Ollama Connection**. You'll see latency, daemon version, and automatically discovered models.

---

## 🔒 Privacy & Data Storage Explanation

- **Zero Cloud Databases**: Your entries are never stored on external servers or SaaS analytics.
- **Local IndexedDB**: Stored in your client's browser profile. Clearing your browser storage clears the app. Use the **Export Complete JSON Archive** in Settings to back up your notes anytime.
- **Transparent AI Provenance**: TerraMind never fakes AI output. Offline heuristic missions are clearly badged with *"Generated by Offline Botanical Heuristic Engine"*, while Ollama missions display *"Generated by Ollama (llama3.2)"*.

---

## 📱 Offline & PWA Usage

1. Open TerraMind in Chrome, Edge, or Safari.
2. Tap **Install App** in the top navigation bar or browser menu.
3. Launch directly from your home screen or dock.
4. When venturing off-grid or away from cell service, previously saved missions and journal entries remain completely available.

---

## ⚖️ Hacktoberfest 2026

Created for the Hacktoberfest DEV Challenge: **"Touch Grass"**.  
*Take a breath, put down the phone, and explore.*

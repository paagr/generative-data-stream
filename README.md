# Generative Data Stream

An experimental audio-visual environment where **System Metadata** and **Web Audio API** converge into a unique electronic music composition.

### 🧬 Core Concept
The application bridges the gap between hardware and art. It reads your device's physical specifications and translates them into a rhythmic and visual structure. The environment reacts to your specific battery level, RAM, and browser dimensions.

### 🎹 Generative Features
* **Battery-Driven Tempo:** The BPM is mapped to your current battery level via `navigator.getBattery`
* **Hardware Synthesis:** Oscillator types (Sine, Square, Sawtooth) adapt based on `deviceMemory`
* **Procedural Visuals:** A recursive grid fragments and displays system telemetry (CPU cores, platform, language)
* **Algorithmic Reverb:** A convolution impulse response is generated at runtime based on the exact second of initialization

### 🚀 Quick Start

**1. Clone and Install**
```bash
git clone git@github.com:paagr/generative-data-stream.git
cd generative-data-stream
npm install
```

**2. Run Development Server**
```bash
npm run dev
```

**3. Build for Production**
```bash
npm run build
```

### 🎼 Sound Engine
The engine cycles through a 3-chord progression. Every 32 steps, the grid regenerates and the harmonic center shifts. Percussive "clicks" are generated via white noise buffers with high-pass filters that scale based on the visual complexity of the DOM.

### 🛠 Tech Stack
* **Vite 7:** Fast Next-Generation Frontend Tooling.
* **Web Audio API:** Real-time synthesis and convolution.
* **CSS Grid:** Fractal-like layouts generated on the fly.
* **Vanilla JS:** Low-overhead recursive logic.
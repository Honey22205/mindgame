# NEXUS · MindGym — Daily Cognitive Fitness & Habit Mastery

> **A thoughtful, beautifully crafted personal cognitive gym, deep work focus timer, and habit companion designed to sharpen your memory, mental math speed, and focus in just 3 minutes a day.**

---

## 👨‍💻 Created by
**Made with ❤️ by Honey**

---

## 🌟 Overview

**NEXUS · MindGym** is a human-centered, daily cognitive training and productivity application built with clean Apple & Elevate-inspired aesthetics. Rather than cluttered dashboards or generic templates, MindGym focuses on real, tangible daily self-improvement through engaging micro-workouts, mindful deep work sessions, and consistent habit streaks.

---

## ✨ Core Features

### 1. ⚡ Speed Math Sprint (Mental Agility)
- Rapid 45-second arithmetic sprint (Addition, Subtraction, Multiplication).
- Consecutive correct answers unlock **Combo Multipliers** (`2x`, `3x`, `4x`) with rising pentatonic audio chimes.
- Real-time accuracy %, average solve time, and score benchmarking.

### 2. 🧩 Memory Matrix (Spatial Working Memory)
- Dynamic 3×3 to 5×5 grid patterns that illuminate for 1.4 seconds and then hide.
- Recall and tap the remembered tiles from short-term memory.
- Progressive difficulty curve with a 3-lives system and visual memory calibration.

### 3. 🎯 Stroop Focus Test (Cognitive Reflex & Inhibition)
- High-intensity color-word conflict test designed to exercise prefrontal executive control.
- Split-second Yes / No decision-making under time pressure.
- Measures response time in milliseconds (`avg 340ms`) and percentage accuracy.

### 4. 🌲 Focus Garden (Deep Work Pomodoro + Ambient Soundscapes)
- 15, 25, 45, or 60-minute deep work sessions with an animated digital bonsai tree that sprouts leaves as you stay focused.
- **Procedural Ambient Soundscapes** (built via Web Audio API, zero external assets):
  - 🌧️ Soft Gentle Rain
  - 🔥 Crackling Campfire
  - 🌊 Ocean Waves
  - 🔇 Silent Mode
- Completed sessions plant permanent trees in your **Focus Forest** gallery and reward Focus Points.

### 5. ✨ Routine Quests (Daily Habits)
- Track hydration, morning reading, daily cognitive training, and deep work blocks with 1-tap completion.
- Satisfying completion chimes, progress rings, and daily streak counters (`6 Day Streak`).

### 6. 🧠 Composite Brain Score Index
- Dynamic composite algorithm tracking your 4 cognitive pillars:
  - **Agility** (Speed Math)
  - **Memory** (Memory Matrix)
  - **Focus** (Stroop & Focus Garden)
  - **Language** (Verbal processing)
- Automatic local persistence with zero cloud latency.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, custom glassmorphism surfaces (`backdrop-filter`)
- **Audio & Haptics**: Procedural Web Audio API sound synthesizer (wooden clicks, marimba chords, rain & campfire sound generators)
- **Backend / API**: Node.js, Express (`server.ts`)
- **Storage**: LocalStorage with event-driven subscriptions and vector sync queue

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or newer)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/nexus-mindgym.git

# Navigate to project directory
cd nexus-mindgym

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be live at `http://localhost:3000`.

### Production Build
```bash
npm run build
npm start
```

---

## 📱 Mobile & PWA Experience

- Conforms strictly to touch targets $\ge 44\text{px}$.
- Includes device frame switcher: **iPhone 16 Pro**, **Pixel 9 Pro**, and **Edge-to-Edge** responsive view.
- Supports offline execution with local persistence and background caching.

---

## 📄 License

This project is licensed under the Apache 2.0 License.

**Crafted with care by Honey · 2026**

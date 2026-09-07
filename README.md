# ⚡ LifeLine Voice — Emergency Response Command

> **Hands-Free, Real-Time Emergency First Aid Dispatcher** — powered by ultra-low-latency LLMs, Web Speech architecture, and sensory hardware telemetry.

Built for the **AI Builders Hackathon: Solving the Paradox of Intelligence Systems — The Limits of Foundation Models**.

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Next.js 15](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-Llama%203.1-orange)
![Web Speech API](https://img.shields.io/badge/Web%20Speech-STT%20%2F%20TTS-blueviolet)

---

## 📑 Table of Contents

- [The Core Paradox](#the-core-paradox-the-limits-of-foundation-models)
- [The Solution](#the-solution-system-architecture-over-raw-intelligence)
- [Adaptive Mobile-First Architecture](#adaptive-mobile-first-architecture)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Hackathon Evaluation Summary](#hackathon-evaluation-summary)
- [License](#license)

---

## 🎯 The Core Paradox: The Limits of Foundation Models

State-of-the-art Foundation Models (LLMs) possess vast medical intelligence, yet in life-or-death physical emergencies, **raw Foundation Models completely fail**:

1. **The Latency Trap (Seconds Kill)** — In Sudden Cardiac Arrest (SCA), irreversible brain damage begins within 3–4 minutes. Standard LLM pipelines that deliberate, generate chain-of-thought (`thinking`) tokens, or take 4–8 seconds to respond are dangerously slow.
2. **The "Disembodied Mind" Problem** — A raw text model can state *"compress the chest at 100–120 beats per minute"*, but in a panic, humans cannot maintain accurate auditory-motor rhythm without sensory hardware telemetry.
3. **The Mobile & Physical Barrier** — Rescuers have their hands covered in fluids or occupied performing CPR. Chatboxes, typing on touchscreens, and phones dimming or locking during rescue make standard AI models unusable.
4. **Chattiness & Hallucination Risk** — Raw models tend to be conversational, offering disclaimers, pleasantries, or verbose medical background when immediate, imperative commands dictate survival.

## 💡 The Solution: System Architecture Over Raw Intelligence

**LifeLine Voice** resolves the Foundation Model Paradox by wrapping ultra-fast inference into a **deterministic, multimodal emergency operating layer**:

```text
┌───────────────────────────────────────────────────────────┐
│                   PHYSICAL RESCUE SCENE                   │
│       High Adrenaline · Contaminated Hands · Noise        │
└──────────────────────────────┬────────────────────────────┘
                              │ Voice Command (STT)
                              ▼
┌───────────────────────────────────────────────────────────┐
│             HYBRID DUAL-ENGINE DISPATCH LAYER             │
├─────────────────────────────┼─────────────────────────────┤
│  CRITICAL PROTOCOLS         │  COMPLEX MEDICAL Q&A        │
│  • Sudden Cardiac Arrest    │  • "Nosebleed bleeding"     │
│  • Severe Choking           │  • "Chemical burns"         │
│  • Arterial Bleeding        │  • "Diabetic shock"         │
├─────────────────────────────┼─────────────────────────────┤
│  Local Deterministic        │  Groq Llama-3.1 Engine      │
│  Rescue Protocol (0 ms)     │  Deterministic system prompt│
│                             │  output max 2 sentences     │
└──────────────┴─────────────────────────────┴──────────────┘
              │                             │              
              ▼                             ▼              
┌───────────────────────────────────────────────────────────┐
│                 MULTIMODAL SENSORY OUTPUT                 │
│   • Sensory Metronome — 110 BPM optical heartbeat pulse   │
│   • Hands-Free Text-to-Speech — instant audio dispatch    │
│    • Auto-Resuming Screen Wake Lock (visibilitychange)    │
│  • Device-Aware Mobile Speech Lifecycle (iOS / Android)   │
│    • Swiss-Brutalist High-Contrast Adaptive Typography    │
│            • One-Tap Emergency 112 Dial Bridge            │
└───────────────────────────────────────────────────────────┘
```

## 📱 Adaptive Mobile-First Architecture

Mobile operating systems enforce strict sandbox and power-saving policies that break standard browser AI workflows. LifeLine Voice incorporates dedicated mobile-hardened countermeasures:

| Challenge on Mobile | System Failure Without Architecture | LifeLine Voice Solution |
| --- | --- | --- |
| Continuous Listening | Mobile OS forcibly kills the microphone after 3–5 s of silence (no-speech / aborted crash). | Discrete adaptive windows: desktop runs continuous listening; mobile switches to single-utterance windows with silent error reset. |
| iOS Audio Autoplay Policy | Safari blocks `speechSynthesis` when triggered asynchronously by an AI API response. | User-gesture audio unlock: the first tap triggers a silent synthetic utterance, priming the iOS audio engine for hands-free speech. |
| Mobile Screen Timeout | Phones dim and sleep after ~30 s of inactivity, locking the rescuer out during CPR. | Auto-resuming Screen Wake Lock: a `visibilitychange` listener re-acquires the screen lock whenever the app regains focus. |
| 300 ms Tap Latency | Mobile browsers delay touch events to detect double taps. | `touch-action: manipulation` enforced globally on all emergency controls for true 0 ms touch response. |

## 🚀 Key Features

### 🎙️ Hands-Free Operational Loop (Web Speech API)

Native browser Speech Recognition and Speech Synthesis (pl-PL & en-US).

The rescuer taps once, sets the phone beside the victim, and issues voice commands. Spoken instructions are read aloud automatically through the phone speaker — no need to look at the screen while performing chest compressions.

### ⚡ Zero-Latency Deterministic Fallback vs. Dynamic AI Guidance

- **Deterministic Local Path (0 ms)** — Core life-threatening emergencies (CPR, choking, severe bleeding, unconsciousness) trigger visual and auditory action protocols instantly, without waiting for network calls.
- **Dynamic AI Reasoning (Groq Llama 3.1)** — Complex, open-ended queries (e.g., *"Patient has a nosebleed, what should I do?"*) are routed to Groq's low-latency inference engine, stripped of thinking tokens and constrained to strictly 2 actionable sentences.

### 💓 110 BPM Sensory Metronome with Context Lock

ERC/AHA guidelines require continuous chest compressions at 100–120 BPM. The built-in metronome flashes the screen perimeter in an optical heartbeat rhythm (110 BPM).

**Medical Safety Interlock** — The metronome is strictly locked to the CPR context. If the user switches to bleeding or choking, the metronome pauses automatically to prevent dangerous chest compressions on conscious patients.

### 🛡️ Screen Wake Lock Hardware Telemetry

Integrates the browser-native Screen Wake Lock API to prevent mobile screens from dimming or locking during critical rescue procedures — no contaminated hands ever need to touch the phone.

### 🌐 Instant Bilingual Localization (PL / EN)

One-tap toggle between Polish and English locales; voice synthesis switches between native Polish and English accents automatically.

## 🛠️ Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 15 (App Router, React Hooks, Turbopack) |
| AI Inference | Groq Cloud API (`llama-3.1-8b-instant`, fallback orchestration) |
| Speech Processing | Web Speech API (`SpeechRecognition` & `speechSynthesis`) |
| Hardware Telemetry | Screen Wake Lock API, `visibilitychange` auto-recovery |
| Styling & UI | Tailwind CSS, Lucide React, high-contrast emergency design system |
| Device Handling | Adaptive desktop / mobile audio focus detection |

## 📦 Getting Started

### Prerequisites

- Node.js 18+
- pnpm or npm
- Free Groq API key ([console.groq.com](https://console.groq.com/))

### Installation

Clone the repository:

```bash
git clone https://github.com/AdamBabinicz/lifeline-voice.git
cd lifeline-voice
```

Install dependencies:

```bash
pnpm install
```

Set up environment variables — create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_GROQ_API_KEY=gsk_your_groq_api_key_here
```

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏆 Hackathon Evaluation Summary

| Judging Criteria | How LifeLine Voice Solves It |
| --- | --- |
| Solving the Paradox (20%) | Turns raw, chatty LLMs into a real-time, deterministic, physically grounded rescue system that overcomes latency and hallucination. |
| Technical Implementation (20%) | Clean hybrid architecture: Web Speech STT/TTS + Groq API + auto-resuming Mobile Wake Lock + context-locked sensory metronome. |
| Innovation & Creativity (20%) | Moves away from generic text chatbots toward hands-free sensory audio/visual emergency hardware dispatch. |
| Design & UX (20%) | High-contrast Swiss-Brutalist emergency typography designed for legibility during adrenaline-fueled panic. |
| Completeness & Polish (20%) | Mobile-hardened (iOS/Android audio unlocking, error recovery), bilingual (PL/EN), zero-crash fallbacks. |

## 📜 License

Distributed under the [MIT License](LICENSE).

---

> ⚠️ **Disclaimer:** LifeLine Voice is a hackathon prototype built for educational purposes — it is **not** a certified medical device. In a real emergency, always call your local emergency number (112 in the EU) first.

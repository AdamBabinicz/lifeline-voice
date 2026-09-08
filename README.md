# ⚡ LifeLine Voice — Emergency Response Command

> **Hands-Free, Real-Time Emergency First Aid Dispatcher** — powered by ultra-low-latency LLMs, Web Speech architecture, and sensory hardware telemetry.

Built for the **AI Builders Hackathon: Solving the Paradox of Intelligence Systems — The Limits of Foundation Models**.

> ⚠️ **Safety notice:** LifeLine Voice is a hackathon prototype and does **not** replace emergency dispatchers, certified first-aid guidance, or professional medical care. In a real emergency, always call your local emergency number (112 in the EU) first.

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Next.js 15](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-Llama%203.1-orange)
![Web Speech API](https://img.shields.io/badge/Web%20Speech-STT%20%2F%20TTS-blueviolet)

---

## 🎬 Video Demo (For the Jury)

> **Watch the live demo / presentation video here:** [LifeLine Voice — Video Presentation](https://www.youtube.com/watch?v=e7ny73qZxac)

---

## 📑 Table of Contents

- [The Core Paradox](#the-core-paradox-the-limits-of-foundation-models)
- [The Solution](#the-solution-system-architecture-over-raw-intelligence)
- [Safety Architecture](#safety-architecture)
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
2. **The "Disembodied Mind" Problem** — A raw text model can state _"compress the chest at 100–120 beats per minute"_, but in a panic, humans cannot maintain accurate auditory-motor rhythm without sensory hardware telemetry.
3. **The Mobile & Physical Barrier** — Rescuers have their hands covered in fluids or occupied performing CPR. Chatboxes, typing on touchscreens, and phones dimming or locking during rescue make standard AI models unusable.
4. **Chattiness & "Obvious" Advice** — Raw models tend to be conversational or offer trivial background when immediate, imperative commands and non-obvious expert steps (e.g., removing jewelry before swelling) dictate survival.

## 💡 The Solution: System Architecture Over Raw Intelligence

**LifeLine Voice** resolves the Foundation Model Paradox by wrapping ultra-fast inference into a **deterministic, multimodal emergency operating layer**:

```text
┌─────────────────────────────────────────────────────────────┐
│                    PHYSICAL RESCUE SCENE                    │
│         High Adrenaline · Contaminated Hands · Noise        │
└──────────────────────────────┬──────────────────────────────┘
                               │ Voice Command (STT)           
                               ▼                               
┌─────────────────────────────────────────────────────────────┐
│              HYBRID DUAL-ENGINE DISPATCH LAYER              │
├──────────────────────────────┼──────────────────────────────┤
│  CRITICAL PROTOCOLS          │  COMPLEX MEDICAL Q&A         │
│  • Sudden Cardiac Arrest     │  • "Nosebleed bleeding"      │
│  • Severe Choking            │  • "Chemical burns"          │
│  • Arterial Bleeding         │  • "Diabetic shock"          │
├──────────────────────────────┼──────────────────────────────┤
│  Local Deterministic         │  Secure Server-Side Proxy    │
│  Rescue Protocol (no network)│  Next.js Route Handler proxy │
│                              │  Prompt Guardrails · 3 snt.  │
│                              │  jewelry · ice · no vomiting │
└──────────────┴──────────────────────────────┴───────────────┘
               │                              │                
               ▼                              ▼                
┌─────────────────────────────────────────────────────────────┐
│                  MULTIMODAL SENSORY OUTPUT                  │
│   • Sensory Metronome — 110 BPM optical heartbeat pulse     │
│   • Hands-Free Text-to-Speech — instant audio dispatch      │
│    • Auto-Resuming Screen Wake Lock (visibilitychange)      │
│  • Device-Aware Mobile Speech Lifecycle (iOS / Android)     │
│    • Swiss-Brutalist High-Contrast Adaptive Typography      │
│            • One-Tap Emergency 112 Dial Bridge              │
└─────────────────────────────────────────────────────────────┘
```

## 🛡️ Safety Architecture

LifeLine Voice is designed as a **safety-first system**: the generative model is only one component, and every failure path has a designed response.

- **Emergency escalation first** — a persistent one-tap bridge to the 112 emergency number is always available, and every protocol and AI answer reinforces calling emergency services.
- **Deterministic routing for critical scenarios** — life-threatening protocols (CPR, choking, severe bleeding, unconsciousness) never depend on LLM generation; they are locally hardcoded and activate with no network round-trip.
- **Context locking** — the 110 BPM metronome is locked to the CPR context only and pauses automatically in other scenarios to prevent dangerous chest compressions on conscious patients.
- **Bounded AI responses** — the AI layer is constrained by explicit system-prompt guardrails: answers in at most 3 sentences, immediate action first, no diagnosing, no inventing procedures, no background chatter.
- **Graceful failure fallback** — API errors (Model-Not-Found 404, overload 429) and missing connectivity are handled by falling back to the local deterministic protocols — the system never blocks a rescuer mid-rescue.
- **Prototype disclaimer** — the app is a hackathon prototype, not a certified medical device (see the safety notice above and the disclaimer below).

## 📱 Adaptive Mobile-First Architecture

Mobile operating systems enforce strict sandbox and power-saving policies that break standard browser AI workflows. LifeLine Voice incorporates dedicated mobile-hardened countermeasures:

| Challenge on Mobile       | System Failure Without Architecture                                                         | LifeLine Voice Solution                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Continuous Listening      | Mobile OS forcibly kills the microphone after 3–5 s of silence (no-speech / aborted crash). | Discrete adaptive windows: desktop runs continuous listening; mobile switches to single-utterance windows with silent error reset.  |
| iOS Audio Autoplay Policy | Safari blocks `speechSynthesis` when triggered asynchronously by an AI API response.        | User-gesture audio unlock: the first tap triggers a silent synthetic utterance, priming the iOS audio engine for hands-free speech. |
| Mobile Screen Timeout     | Phones dim and sleep after ~30 s of inactivity, locking the rescuer out during CPR.         | Auto-resuming Screen Wake Lock: a `visibilitychange` listener re-acquires the screen lock whenever the app regains focus.           |
| 300 ms Tap Latency        | Mobile browsers delay touch events to detect double taps.                                   | `touch-action: manipulation` enforced globally on all emergency controls for immediate, tap-delay-free touch response.              |

## 🚀 Key Features

### 🎙️ Hands-Free Operational Loop (Web Speech API)

Native browser Speech Recognition and Speech Synthesis (pl-PL & en-US).

The rescuer taps once, sets the phone beside the victim, and issues voice commands. Spoken instructions are read aloud automatically through the phone speaker — no need to look at the screen while performing chest compressions.

### ⚡ Zero-Latency Deterministic Fallback vs. Dynamic AI Guidance

- **Deterministic Local Path (no network round-trip)** — Core life-threatening emergencies (CPR, choking, severe bleeding, unconsciousness) trigger visual and auditory action protocols immediately, without waiting for any network call.
- **Dynamic AI Reasoning (Secure Server-Side Proxy)** — Complex, open-ended queries (e.g., _"Patient has a nosebleed, what should I do?"_) are routed through a secure Next.js Route Handler: the Groq API key never leaves the server (zero browser exposure), only the final answer returns. The endpoint strips thinking tokens and applies a **constrained emergency system prompt** with explicit guardrails — answers in at most 3 sentences, immediate action first, no diagnosing, no inventing procedures — while surfacing non-obvious, actionable steps: *slide off rings before swelling locks them on*, *cool the burn with running water*, *never induce vomiting* after corrosive ingestion.

### 🔒 Secure Server-Side AI Proxy (Route Handler)

All AI requests are routed through a secure Next.js Route Handler — never a direct browser-to-Groq call.

- **Security**: API keys are protected server-side (no exposure to Client/Browser).
- **Stability**: Automatically handles Model-Not-Found (404) and API-Overload (429) errors with graceful fallback to the local deterministic protocols.
- **Speed**: Direct server-to-server connection with Groq Cloud for low-latency responses.

### 💓 110 BPM Sensory Metronome with Context Lock

ERC/AHA guidelines require continuous chest compressions at 100–120 BPM. The built-in metronome flashes the screen perimeter in an optical heartbeat rhythm (110 BPM).

**Medical Safety Interlock** — The metronome is strictly locked to the CPR context. If the user switches to bleeding or choking, the metronome pauses automatically to prevent dangerous chest compressions on conscious patients.

### 🛡️ Screen Wake Lock Hardware Telemetry

Integrates the browser-native Screen Wake Lock API to prevent mobile screens from dimming or locking during critical rescue procedures — no contaminated hands ever need to touch the phone.

### 🌐 Instant Bilingual Localization (PL / EN)

One-tap toggle between Polish and English locales; voice synthesis switches between native Polish and English accents automatically.

## 🛠️ Tech Stack

| Layer              | Technology                                                        |
| ------------------ | ----------------------------------------------------------------- |
| Framework          | Next.js 15 (App Router, React Hooks, Turbopack)                   |
| Architecture       | Secure Server-Side Route Handler Proxy (API keys never reach the browser) |
| AI Inference       | Groq Cloud API (`llama-3.1-8b-instant`) — accessed only via the Secure Route Handler |
| Prompting          | Constrained emergency system prompt: non-obvious steps (jewelry, ice, no vomiting), max 3 sentences |
| Speech Processing  | Web Speech API (`SpeechRecognition` & `speechSynthesis`)          |
| Hardware Telemetry | Screen Wake Lock API, `visibilitychange` auto-recovery            |
| Styling & UI       | Tailwind CSS, Lucide React, high-contrast emergency design system |
| Device Handling    | Adaptive desktop / mobile audio focus detection                   |

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

Set up environment variables — create a `.env.local` file in the project root (read **server-side only**, never shipped to the browser):

```env
GROQ_API_KEY=gsk_your_groq_api_key_here
```

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏆 Hackathon Evaluation Summary

| Judging Criteria               | How LifeLine Voice Solves It                                                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Solving the Paradox (20%)      | Turns raw, chatty LLMs into a real-time deterministic rescue system: expert-level advice (jewelry, ice, no vomiting) instead of trivial chatter, activated without any network round-trip. |
| Technical Implementation (20%) | Clean hybrid architecture: Web Speech STT/TTS + secure server-side Groq proxy (Route Handler) + auto-resuming Mobile Wake Lock + context-locked metronome. |
| Innovation & Creativity (20%)  | Moves away from generic chatbots toward hands-free sensory dispatch — plus a constrained emergency prompt that teaches non-obvious survival steps.  |
| Design & UX (20%)              | High-contrast Swiss-Brutalist emergency typography designed for legibility during adrenaline-fueled panic.                          |
| Completeness & Polish (20%)    | Mobile-hardened (iOS/Android audio unlocking, error recovery), bilingual (PL/EN), graceful error fallbacks, API keys secured server-side. |

## 📜 License

Distributed under the [MIT License](LICENSE).

---

> ⚠️ **Disclaimer:** LifeLine Voice is a hackathon prototype built for educational purposes — it is **not** a certified medical device. In a real emergency, always call your local emergency number (112 in the EU) first.

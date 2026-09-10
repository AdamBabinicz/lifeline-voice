# LifeLine Voice — Mobile Architecture Technical Whitepaper

**Version:** 1.0 (Hackathon Prototype — AI Builders Hackathon 2026)
**Date:** September 10, 2026
**Author:** Adam Gierczak
**Status:** Prototype; not a certified medical device
**Repository:** [github.com/AdamBabinicz/lifeline-voice](https://github.com/AdamBabinicz/lifeline-voice)
**Live Demo:** [lifeline-command.netlify.app](https://lifeline-command.netlify.app)

> ⚠️ **Safety Notice:** LifeLine Voice is a hackathon prototype and **does not replace** emergency dispatchers, certified first responders, or professional medical care. In any physical emergency, **always** call emergency services first (112 in the EU, 911 in the USA).

---

## 1. Executive Summary

**LifeLine Voice** is a Progressive Web Application (PWA) built on Next.js 15 designed to resolve the core paradox of modern LLMs in physical first-response emergencies (BLS — Basic Life Support): **"intelligent, but too slow, too chatty, and strictly text-bound."**

In Sudden Cardiac Arrest (SCA), irreversible brain death begins within 3–4 minutes of losing consciousness. Standard Foundation Model pipelines deliberate, stream reasoning tokens, and take 4–8 seconds to respond — more than double the acceptable latency in acute arrest. LifeLine Voice eliminates this latency barrier by splitting the execution pipeline into **two deterministic and generative tracks**:

| Execution Track                    | Trigger Mechanism                                                                                                                                             | Latency Profile                        | Network Dependency                |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------- |
| **Deterministic (Local Client)**   | 12 life-threatening physical protocols (CPR, choking, severe arterial bleeding, coma, burns, seizures, fractures, nosebleeds, insect stings, pediatric falls) | **0 ms** (design target)               | ❌ None (100% Offline)            |
| **Generative (Server-Side Proxy)** | Complex, open-ended medical queries outside the 12 primary protocols                                                                                          | Several seconds (Groq Cloud dependent) | ✅ Yes (via Secure Route Handler) |

_Values designated as "design targets" reflect architectural engineering parameters (Next.js 15 + Web Speech API + Screen Wake Lock API + Route Handler Proxy) rather than third-party clinical benchmarks and may vary across specific hardware and operating environments._

---

## 2. System Architecture Overview

```text
┌──────────────────────────────────────────────────────────────┐
│ [1. CLIENT LAYER] · Device Runtime (iOS / Android / Desktop) │
│ - Web Speech API: STT (SpeechRecognition, interimResults)    │
│ - Web Speech API: TTS (speechSynthesis)                      │
│ - Screen Wake Lock API + navigator.vibrate                   │
│ - LocalStorage, getUserMedia (audio focus management)        │
│ - Adaptive listening windows (Desktop: Continuous / Mobile:  │
│   Single-utterance window with silent error recovery)        │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTPS (TTS Audio Frames)
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ [2. EDGE & COMPONENT LAYER] · Next.js 15 App Router          │
│ - iOS Audio Unlock: Synthetic user-gesture audio priming     │
│ - touch-action: manipulation (Eliminates 300 ms tap delay)   │
│ - visibilitychange listener for auto-resuming Wake Lock      │
│ - Dual-Engine Intent Gating: Real-time interim STT mapping   │
│   to 12 protocols; acoustic self-echo suppression            │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTPS (Secure Session Token)
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ [3. CLOUD PROXY] · Next.js Route Handler (Server-Side Proxy) │
│ - Direct server-to-server Groq Cloud API call (Hidden Key)   │
│ - Constrained emergency prompt: ≤3 sentences, imperative     │
│   action first, no diagnosing, no conversational fluff       │
│ - Fallback 404 (Model-Not-Found) / 429 (Rate-Limit)          │
│   automatically defaults to the local deterministic engine   │
└──────────────────────────────────────────────────────────────┘
```

### 2.1 Critical System Components

| Architectural Tier | Component           | Standard / API Spec          | System Responsibility                                           |
| ------------------ | ------------------- | ---------------------------- | --------------------------------------------------------------- |
| 1. Client          | Web Speech STT      | W3C Web Speech API           | Continuous / semi-continuous recognition for `pl-PL` & `en-US`  |
| 1. Client          | Web Speech TTS      | W3C Web Speech API           | Zero-latency local speech synthesis for 112 code & CPR commands |
| 1. Client          | Screen Wake Lock    | W3C Screen Wake Lock API     | Prevents mobile screen sleep during chest compressions          |
| 1. Client          | Vibration Telemetry | W3C Vibration API            | Haptic CPR metronome pulse at 110 BPM (45 ms pulse duration)    |
| 2. Edge / UI       | Audio Unlocking     | iOS WebKit Audio Gesture     | Primes Safari audio engine on first interaction                 |
| 2. Edge / UI       | Touch Optimization  | CSS Touch Action Spec        | Enforces zero 300 ms tap latency on mobile browsers             |
| 3. Cloud           | Route Handler       | Next.js 15 Server-Side Proxy | Protects `GROQ_API_KEY`, proxies requests to Groq Cloud         |
| 3. Cloud           | Foundation Model    | `llama-3.1-8b-instant`       | Generates bounded answers for open-ended medical queries        |

---

## 3. Latency Budgets & Operational Timing

### 3.1 End-to-End Latency Budget (CPR Scenario)

| Operation Stage                                        | Target Latency | Performance Metric / Mechanism                                  | Confidence Level |
| ------------------------------------------------------ | -------------- | --------------------------------------------------------------- | ---------------- |
| Button Tap → STT Initialization                        | <100 ms        | `touch-action: manipulation` eliminates 300 ms tap delay        | Design Target    |
| Interim STT → Intent Recognition ("Start CPR")         | <200 ms        | `interimResults: true` streaming on `SpeechRecognition`         | Design Target    |
| Active TTS Interruption (Cancel)                       | <200 ms        | `speechSynthesis.cancel()` on valid intent detection            | Design Target    |
| 110 BPM Metronome Activation (Audio + Visual + Haptic) | <300 ms        | Native CSS keyframes + `navigator.vibrate(45)`                  | Design Target    |
| Acoustic Echo Suppression (Speaker → Mic)              | Immediate      | Deterministic intent classification rejects synthetic self-echo | Design Target    |
| Generative AI Route (Open Medical Q&A)                 | 1.5–3.5 s      | Bound by Groq Cloud inference and network RTT                   | Design Target    |
| API Fault Fallback (404/429 Error Recovery)            | <500 ms        | Server-side catch block routes to local deterministic fallback  | Design Target    |

_All timing specifications represent engineering architectural targets based on API lifecycle profiles rather than formal clinical trial benchmarks._

### 3.2 Why <200 ms Interruption Latency (Barge-In) Saves Lives

When a rescuer administers chest compressions and suddenly observes acute patient deterioration (e.g., severe arterial hemorrhage or airway regurgitation), the protocol must switch **instantly**. Forcing a rescuer to listen to an active 3-sentence spoken instruction wastes **3 to 6 seconds of critical intervention time**.

By coupling `speechSynthesis.cancel()` with interim intent gating, LifeLine Voice interrupts active audio in **under 200 ms**, ensuring uninterrupted physical rescue continuity.

### 3.3 The Requirement for Zero-Network Architecture

| Failure Scenario                      | Threat Context                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------------ |
| Remote Geographic Locations           | Accidents in forests, rural roads, or mountains with zero cellular base stations (BTS).    |
| Post-Disaster Infrastructure Collapse | Earthquakes, floods, or severe grid blackouts destroying telecommunications.               |
| Network Congestion                    | Mass casualty incidents (festivals, stadiums, rallies) overwhelming local cellular towers. |
| International Roaming Constraints     | Responders or tourists traveling abroad without active data connectivity.                  |

Consequently, the 12 core emergency protocols are **fully hardcoded on the client device**, requiring zero network round-trips for full operational execution.

---

## 4. Security, Privacy & Regulatory Compliance

### 4.1 Privacy Architecture

| Component               | Security Enforcement Mechanism                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Groq API Credentials    | **Stored strictly server-side** (`GROQ_API_KEY` in `.env.local`); never shipped to the client JavaScript bundle.                                       |
| Microphone Audio Stream | Processed locally in-memory via Web Speech API; audio data is never transmitted to cloud servers for the 12 local protocols.                           |
| Device Geolocation      | Used **strictly** by the native dial bridge (`tel:112`); coordinates are never logged or stored by LifeLine Voice.                                     |
| Medical Guardrails      | System prompt strictly forbids: (a) diagnostic speculation, (b) fabricating procedures, (c) responses exceeding 3 sentences, (d) non-emergency advice. |
| API Failure Fallback    | Network disconnects, 404 Model-Not-Found, and 429 Rate-Limit errors fail silently to the deterministic offline catalog.                                |

### 4.2 GDPR & Data Protection Compliance

- **No Persistent User Profiling:** The application does not collect user identities, histories, or session records in any database.
- **Zero Third-Party Data Transfer:** The deterministic emergency engine operates locally without transmitting telemetry abroad. Only non-deterministic queries routed through the server proxy reach Groq Cloud.
- **Medical Disclaimers:** Explicit safety boundaries are prominently displayed in the primary view and footer components.

### 4.3 Emergency Services Bridge (E911 / 112 Compliance)

- LifeLine Voice **augments, but never replaces** professional emergency services.
- A persistent one-tap emergency call bridge (`tel:112`) remains accessible on all viewports.
- Every protocol begins with the explicit directive: _"Call emergency services immediately."_
- **Regulatory Status:** This application is **not** a certified medical device under FDA Class II guidelines or European Medical Device Regulation (EU MDR 2017/745). It is a hackathon proof-of-concept prototype.

---

## 5. Competitive Landscape & Market Positioning

### 5.1 Comprehensive Feature Matrix

| Feature Specification          | **LifeLine Voice** _(Hackathon Prototype)_     | **Noonlight** (USA)                | **bSafe**                 | **Rescu**                       | **Life360**            | **Apple Emergency SOS** (iPhone 14+) | **Google Personal Safety** (Pixel) | **RSO** (Poland)    |
| ------------------------------ | ---------------------------------------------- | ---------------------------------- | ------------------------- | ------------------------------- | ---------------------- | ------------------------------------ | ---------------------------------- | ------------------- |
| Hands-Free Voice Activation    | ✅ Yes (Continuous STT)                        | ❌ Button hold required            | ✅ (Paid Premium)         | ❌ Two-tap required             | ❌ Tap / Crash sensor  | ❌ Tap-only                          | ✅ "Emergency" voice trigger       | ❌ Push-only        |
| Trigger-to-Alert Latency       | **0 ms for 12 protocols** (Design target)      | 10 s countdown timer               | Unspecified               | "Within seconds"                | Unspecified            | ~15 s satellite setup                | 60 s countdown                     | Operator dependent  |
| Time to Professional Dispatch  | Dependent on LTE; 0 ms local guidance          | <36 s verification, <60 s dispatch | SMS to contacts (Not 911) | Direct dispatcher (Unspecified) | 24/7 dispatcher (Paid) | Text dispatch center                 | Automatic 911 call after 60 s      | N/A (Broadcast)     |
| Native Polish Localization     | ✅ Native `pl-PL` architecture                 | ❌ English Only                    | ❌ English Only           | ❌ English Only                 | ❌ English Only        | ✅ UI localized, English dialog      | ❌ English Only                    | ✅ Native Polish    |
| 100% Offline Resilience        | ✅ 12 Protocols Fully Offline                  | ❌ Requires Network                | ❌ Requires Network       | ❌ Requires Network             | ❌ Requires Network    | ✅ Satellite (15 s text packet)      | ❌ Requires Network                | ❌ Requires Network |
| Embedded First-Aid Protocols   | ✅ 12 ERC/AHA protocols with non-obvious rules | ❌ None                            | ❌ None                   | ❌ None                         | ❌ None                | ❌ None                              | ❌ None                            | ❌ None             |
| Audio Rescuer Feedback (TTS)   | ✅ Phonetic TTS normalization (PL/EN)          | ❌ 2-way dispatcher audio          | ❌ None                   | ❌ None                         | ❌ None                | ❌ None                              | ❌ None                            | ✅ Synthetic voice  |
| Real-Time Voice Barge-In       | ✅ <200 ms instant cancellation                | N/A                                | N/A                       | N/A                             | N/A                    | N/A                                  | N/A                                | ❌ None             |
| CPR Sensory Metronome          | ✅ 110 BPM visual + haptic + AED pulse         | ❌ None                            | ❌ None                   | ❌ None                         | ❌ None                | ❌ None                              | ❌ None                            | ❌ None             |
| Screen Wake Lock Telemetry     | ✅ Auto-resuming via `visibilitychange`        | –                                  | –                         | –                               | –                      | –                                    | –                                  | –                   |
| Acoustic Echo Loop Suppression | ✅ Dual-layer intent gating                    | N/A                                | N/A                       | N/A                             | N/A                    | N/A                                  | N/A                                | N/A                 |

_Competitive reference sources: Noonlight, bSafe, Rescu, Life360, Apple Emergency SOS, Google Personal Safety, Regional Warning System (RSO)._

### 5.2 Out-of-Scope Capabilities (Where LifeLine Does Not Compete)

| Category                                            | Reason for Strategic Omission                                                                                     |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Continuous Personal Monitoring (Noonlight, bSafe)   | LifeLine Voice operates as an on-scene physical rescuer assistant; it is not a 24/7 remote tracking call center.  |
| Automotive Crash Detection (Life360, Apple, Google) | LifeLine Voice does not utilize accelerometer crash detection; it responds exclusively to rescuer voice commands. |
| Regional Alert Broadcasts (RSO)                     | LifeLine Voice is an interactive rescue dispatcher, not an ambient public warning broadcast system.               |
| Satellite Text Connectivity (Apple)                 | LifeLine Voice operates over local hardware and cellular networks; it does not contain satellite transceivers.    |

### 5.3 Unique Market White Space

LifeLine Voice occupies an unoccupied **white space** in emergency tech: it is the only existing solution combining **native Polish phonetic TTS normalization, 12 deterministic ERC/AHA offline protocols, sub-200ms voice barge-in with acoustic echo cancellation, and a sensory CPR metronome context-locked to active resuscitation.**

---

## 6. Risk Management & Engineering Mitigations

| Identified Risk                              | Probability | Severity   | Engineering Mitigation Strategy                                                                        |
| -------------------------------------------- | ----------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| Rescuer Panic / Procedure Confusion          | High        | Critical   | TTS repeats instructions phonetically; persistent title badges; step-by-step numbered imperative flow. |
| False-Positive Barge-In Trigger              | Medium      | Medium     | Two-tier intent gating filters out background room noise and speaker self-echo.                        |
| Extreme Ambient Noise (Crowd, Sirens, Rotor) | Medium      | High       | High-contrast tactile UI fallback buttons (`touch-action: manipulation`) for physical interaction.     |
| Lack of Universal Wake-Word                  | Medium      | Medium     | Single-tap manual audio priming with haptic and visual confirmation states.                            |
| Regulatory Device Classification             | Definite    | Regulatory | Prominent medical disclaimers; mandatory 112 escalation as Step 1 on all protocols.                    |
| WebKit iOS Audio Autoplay Restrictions       | High        | Medium     | Synthetic silent audio playback triggered on initial user tap primes the Safari audio subsystem.       |
| Cross-Browser Web Speech Fragmentation       | Medium      | Medium     | Dynamic feature detection paired with graceful manual UI fallbacks.                                    |
| Lack of Public Benchmark Standards           | Definite    | Medium     | Integration of the OpenRTB automated benchmark test suite on the future engineering roadmap.           |

---

## 7. Technology Roadmap (2026–2027)

| Target Quarter | Engineering Milestone                                                        | Strategic Objective                                                |
| -------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Q4 2026**    | Public End-to-End Latency Benchmarks (P50, P95 across 5 device tiers)        | Empirical performance validation and public auditability.          |
| **Q4 2026**    | Embedded On-Device Wake-Word ("LifeLine" / "Ratunku") via TensorFlow Lite    | Fully hands-free cold initialization without initial screen tap.   |
| **Q1 2027**    | Android APK / iOS Native Packaging (Capacitor / TWA)                         | Background audio execution and lock-screen persistence.            |
| **Q1 2027**    | Crooze Rescue API (Netherlands) & UK 999 API Direct Integration              | Multi-jurisdiction automatic tele-dispatch coordination.           |
| **Q2 2027**    | Real-Time Wearable Sensor Fusion (Apple Watch & Pixel Watch HR / SpO₂)       | Automated physiological arrest detection and metronome syncing.    |
| **Q3 2027**    | CE MDR Class I Certification (Non-Invasive Information Device)               | Regulatory approval path toward professional paramedic deployment. |
| **Q3 2027**    | Expanded 12+ Rescue Protocols (Hypothermia, Anaphylaxis, Chemical Ingestion) | Extended clinical coverage aligned with ERC 2025 guidelines.       |

---

## 8. Appendix: Architectural Schematics

The high-level data flow and multi-tier system topology (Client → Edge → Cloud Proxy) are formally detailed in **Section 2** of this document.

---

## 9. Project Credits & Attributions

LifeLine Voice was architected and developed by **Adam Gierczak** as an independent solo project, supported by specialized AI engineering agents:

- **v0.dev** — Rapid UI scaffolding & high-contrast styling.
- **GenSpark** — Deep competitive research and literature synthesis.
- **ChatGPT & Claude** — Low-latency audio architecture, state-machine design, and deterministic rescue engine logic.

Built for the **AI Builders Hackathon 2026: Solving the Paradox of Intelligence Systems — The Limits of Foundation Models**.

---

_This document is intended for technical evaluation and architectural auditing. All performance metrics designated as "design targets" reflect theoretical engineering parameters and require formal empirical verification prior to commercial deployment or medical device certification._

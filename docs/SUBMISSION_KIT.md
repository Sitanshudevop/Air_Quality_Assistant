# PromptWars Virtual Challenge 6 — Submission Kit

Project: **Saans (सांस) — Urban Air Quality Assistant**  
Challenge 6: *Urban Air Quality Assistant (India-Only)*

---

## 1. Short Honest Project Description (Elevator Pitch)

> **"Saans" (सांस)** is a production-grade GenAI assistant designed specifically for North Indian urban families navigating severe winter smog. Built from scratch with zero boilerplate kits, Saans pairs a pure TypeScript deterministic calculation engine (modeling Indian CPCB AQI breakpoints, WHO 2021 air quality guidelines, and US EPA respiratory inhaled dose physics) with purpose-limited Google Gemini narration. 
>
> Families configure their household profile (toddlers, asthmatic elders, daily commuters, home window sealing, cooking fuel), and Saans generates time-blocked low-emission routines, room-specific DIY indoor hacks (such as Corsi-Rosenthal boxes and CADR room sizing), and quantified *"What If I Choose...?"* impact comparisons showing exact exposure reductions (%) and trip $\text{CO}_2\text{e}$ savings. 
>
> Crucially, Saans never lets AI hallucinate health math or safety advice: all numbers originate strictly from the peer-reviewed domain engine, every response carries visible provenance (`source: 'gemini' | 'rules'`), red-flag medical symptoms trigger immediate bilingual emergency triage, and live Gemini works for any visitor in production with no personal API key required.

---

## 2. Gen AI Usage Statement: What Uses Gemini vs. What is Rule-Based

To ensure total transparency, scientific accuracy, and compliance with the competition's strict disqualification prevention rules, Saans strictly delineates AI text generation from physical and mathematical calculations:

| Capability | Engine Type | Details & Mechanism |
| :--- | :--- | :--- |
| **AQI Calculation & Categories** | **Deterministic Rules** | Piecewise linear interpolation across statutory Indian CPCB breakpoints (`src/domain/aqi.ts`). Zero LLM involvement. |
| **Respiratory Inhaled Dose Model** | **Deterministic Math** | Physical formula multiplying particulate concentration, minute ventilation rate, duration, microenvironment penetration, and mask filtration efficiency (`src/domain/exposure.ts`). |
| **All Numbers & Quantified % Deltas** | **Domain Engine Only** | Every number displayed in the UI (exposure delta %, pollutant concentration, CADR room sizing, travel $\text{CO}_2\text{e}$) comes from `src/domain/assumptions.ts`. |
| **Daily Schedule Generation** | **Deterministic Rules** | Generates the 8-period daily action schedule, rationale codes, and effort/cost bands based on CPCB AQI and user profile (`src/domain/routine.ts`). |
| **Daily Routine Narration** | **Google Gemini** | The `narrate-plan` task personalizes and synthesizes the rule-generated schedule into empathetic, readable household guidance. |
| **Impact Comparison Explanation** | **Google Gemini** | The `explain-impact` task translates mathematical exposure differentials into everyday plain-language advice. |
| **Grounded Assistant Chat** | **Google Gemini** | Context-grounded Q&A answering questions using exclusively the active weather facts, user profile, and engine outputs. |
| **Community Broadcast Notices** | **Google Gemini** | The `community-message` task drafts copyable WhatsApp updates and RWA circulars tailored to the active AQI tier. |
| **Medical Emergency Redirection** | **Deterministic Rules** | Emergency triage (`server/safety.ts`) scans user queries for cardiac/respiratory red flags in English, Hindi, and Hinglish, bypassing the LLM completely to issue fixed emergency guidance. |
| **Numeric Grounding Verifier** | **Server-Side Validation** | RegEx scanner verifies that all numbers appearing in Gemini's responses match allowed engine facts; if ungrounded numbers are found, it retries once, then transparently falls back to deterministic rule text. |

---

## 3. 90-Second Demo Video Script

**Target Duration**: Exactly 90 seconds (1 minute 30 seconds)  
**Tone**: Crisp, empathetic, authoritative, and developer-focused  
**Visuals**: Screen recording of live application running in browser  

---

### [00:00 - 00:15] Hook & Problem Context
- **Visual**: Open the live application at [http://localhost:5173](http://localhost:5173). Show the calm hero header: *"Saans (सांस) — Urban Air Quality Assistant"*. Switch theme toggle to Dark Mode and show the red *"Severe Smog (AQI 425)"* banner.
- **Voiceover**: 
  > *"Every winter across North India, millions of families wake up to toxic smog. But generic air apps only show scary numbers without telling families what to actually do. Meet Saans — an intelligent, production-grade assistant built from scratch for Google PromptWars Virtual Challenge 6."*

---

### [00:15 - 00:30] Zero-Friction Demo Mode & Today Dashboard
- **Visual**: Click *"Explore Demo Mode"*. Show the 1-click snapshot dropdown (Delhi, Lucknow, Mumbai, Bengaluru). Highlight the *"Today Dashboard"* with CPCB estimated category, individual pollutant breakdown, and WHO 2021 comparison.
- **Voiceover**: 
  > *"First-time visitors get an instant, zero-setup experience. In Demo Mode, realistic winter smog snapshots load immediately. The Today dashboard estimates Indian CPCB AQI, breaks down PM2.5, NO2, and ozone, and renders a custom accessible SVG 24-hour outlook chart showing the safest windows to ventilate."*

---

### [00:30 - 00:48] Profile-Tailored Routines & Indoor Hacks
- **Visual**: Open the *"Profile Wizard"*. Show selected household tags: *Toddler + Asthmatic Grandparent*, *Metro Commuter*, *Air Purifier: Living Room*. Click *"Save"*, then click the *"Daily Routine"* tab. Show the time-blocked schedule and the live Gemini narration card with its green `Gemini live` provenance badge.
- **Voiceover**: 
  > *"Saans tailors every recommendation to household vulnerability. Based on our asthmatic grandparent and toddler profile, our deterministic engine generates an 8-period low-emission routine. Gemini personalizes the narration, while our server-side grounding engine mathematically guarantees the AI never invents numbers."*

---

### [00:48 - 01:06] "What If I Choose...?" Impact Explainer
- **Visual**: Switch to the *"Impact Explainer"* tab. Select *"Two-Wheeler Unmasked"* vs. *"Metro + N95 Respirator"*. Point to the quantified **"-87% Relative Inhaled Dose"** exposure reduction and travel $\text{CO}_2\text{e}$ savings card.
- **Voiceover**: 
  > *"Under 'What If I Choose...?', families can compare everyday choices before stepping outside. Powered by US EPA inhalation dose physics and peer-reviewed Indian transport studies, Saans quantifies the exact relative exposure reduction and carbon savings — complete with uncertainty ranges."*

---

### [01:06 - 01:20] Grounded Chat, Multilingual Guardrails & Community Kit
- **Visual**: Click the *"Assistant"* chat tab. Type in Hinglish: *"Mujhe seene mein dard aur saans lene mein dikkat ho rahi hai"*. Watch the safety guardrail trigger an immediate emergency red-flag alert to seek medical care without doctor hallucination. Switch to *"Community Kit"* and click *"Copy WhatsApp Notice"*.
- **Voiceover**: 
  > *"Our serverless AI proxy is strictly purpose-limited. Emergency symptoms in English, Hindi, or Hinglish trigger instant life-safety alerts. Plus, RWAs and schools get one-click WhatsApp broadcast templates for neighborhood action."*

---

### [01:20 - 01:30] Conclusion & Live Production Deployment
- **Visual**: Show the footer: 100% WCAG 2.2 AA accessibility, zero client secret leaks, and live Vercel deployment.
- **Voiceover**: 
  > *"With zero client API keys required, 100% table-driven domain test coverage, and strict provenance tracking, Saans is ready to protect urban communities today. Thank you."*

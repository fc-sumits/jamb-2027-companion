# Sturdy ⚡ — JAMB 2027 Study Companion

**Live app:** https://fc-sumits.github.io/jamb-2027-companion/

A recall-first study companion built for one mission: **300+ in JAMB 2027** (practice target 320+), exam day **15 March 2027**.

## What's inside

- **1,800 verified questions** — 60 daily quizzes (20 Qs) + 12 Grand quizzes (50 Qs) across Use of English, Physics, Chemistry and Biology, with explanations for every answer.
- **Live calendar** — the programme is built from real dates, not counters. Weekdays carry daily quizzes in order, Saturdays carry Grand quizzes, Sundays rest, and everything counts down to 15 March 2027. Miss a day? It shows as catch-up; the calendar never shifts.
- **Energy-based sessions** — Zombie (10 min), Normal (full loop), Beast (everything). The app builds the mission; you just press start.
- **Spaced repetition** — every wrong or guessed answer becomes a review card that returns exactly when memory starts to fade, paced against the exam date.
- **Don't-Move-On lock** — score below 60% and that session feeds straight back into review.
- **Mistake Vault** — six error tags (concept gap, formula missing, vocabulary gap, misread, careless, out of time) with repair-first rule: ten old mistakes reviewed per ten new questions.
- **Full CBT mock** — 180 questions, 2 hours, question palette with flag-and-return. Real exam conditions.
- **Pop-up ambushes** — random 3-question recall strikes (off / chill / normal / extreme).
- **Projected score** — running /400 projection against your 320 target.
- **Offline PWA** — install it, use it with zero network. Everything is stored on-device (IndexedDB).
- **FSRS spaced repetition** — full FSRS-4.5 scheduler (per-card stability + difficulty, legacy SM-2 cards migrate automatically), ambushes weighted toward cards closest to forgetting, and per-card recall stats in the Vault.
- **Quiz player polish** — swipe gestures, pace timer, keyboard shortcuts (1–4, Enter, F), question bookmarking, smooth transitions.
- **Habit machinery** — streak freezes (one auto-consumed grace token per week), Sundays never break the streak, Sunday weekly recap, milestone badges.
- **Syllabus tracker + AI tutor** — every JAMB topic auto-ticks as quiz days cover it; teach-it-back mode graded Feynman-style by Groq; failed teach-backs resurface as drills in missions.
- **Mock CBT realism** — section navigation (English → Physics → Chemistry → Biology), review-after-submit with explanations, and a mock score progression chart.
- **February revision system** — per-topic repair kits (mistakes + retest + curated YouTube concept video), full-mock Saturdays wired into the calendar, and a Final-72-Hours plan screen.
- **Android APK** — run the "Build Sturdy Android APK" workflow from the Actions tab to get an installable debug APK (Capacitor wrapper).

## API keys (optional, free tiers)

Groq (AI tutor) and YouTube Data API (repair videos) keys are pasted into **Settings** inside the app. They are stored only in your browser and sent nowhere except Groq/Google directly. YouTube usage is playlist-first (1 quota unit, cached forever); search is only used on an explicit tap.

## Tech

Zero-build vanilla JS + hand-crafted CSS. No frameworks, no npm, no build step — every push to `main` deploys straight to GitHub Pages. Quiz data lives as plain JS files so the app even works from `file://`.

## Development


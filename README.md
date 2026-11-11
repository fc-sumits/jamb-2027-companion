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

## Tech

Zero-build vanilla JS + hand-crafted CSS. No frameworks, no npm, no build step — every push to `main` deploys straight to GitHub Pages. Quiz data lives as plain JS files so the app even works from `file://`.

## Development

```
git clone https://github.com/fc-sumits/jamb-2027-companion
# open index.html in a browser, or serve the folder statically
```

## Roadmap

See the [issue tracker](https://github.com/fc-sumits/jamb-2027-companion/issues) for milestones M1–M6: quiz polish, streaks, FSRS upgrades, AI tutor (Groq), concept repair videos (YouTube API), and APK wrapper.

---

Built with 💛 for Faheem. Deploy pipeline: push to main → GitHub Actions → Pages. *Sturdy things are built slowly, on schedule, every day.*
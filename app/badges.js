/* ============================================================
   Sturdy — Milestone badges. Evaluated after every session;
   earned badges are stored in kv "badges" and toasted once.
   ============================================================ */
"use strict";

const BADGES = [
  { id: "first-session", emo: "🌱", name: "Day One", desc: "Complete your first session" },
  { id: "q100", emo: "💯", name: "Century", desc: "Answer 100 questions" },
  { id: "q500", emo: "🔥", name: "Five Hundred", desc: "Answer 500 questions" },
  { id: "q1000", emo: "🏔️", name: "One Thousand", desc: "Answer 1,000 questions" },
  { id: "perfect", emo: "🏆", name: "Flawless", desc: "Score 100% in a session" },
  { id: "streak7", emo: "⚡", name: "Seven Straight", desc: "7-day streak" },
  { id: "streak30", emo: "🌙", name: "Thirty Strong", desc: "30-day streak" },
  { id: "streak100", emo: "👑", name: "The Hundred", desc: "100-day streak" },
  { id: "first-mock", emo: "🖥️", name: "Simulation", desc: "Complete a full mock CBT" },
  { id: "repair10", emo: "🛠️", name: "Fixer", desc: "Repair 10 mistakes" },
  { id: "grand1", emo: "🎯", name: "Grand Survivor", desc: "Finish your first Grand quiz" },
  { id: "teach1", emo: "🎓", name: "Teacher", desc: "Pass a Feynman teach-back" },
  { id: "mock300", emo: "🚀", name: "Beyond 300", desc: "Score 300+ equivalent in a mock" }
];

async function earnedBadges() {
  return (await DB.get("kv", "badges")) || {};
}

/* Rebuilds the full badge picture and returns the ids newly earned. */
async function evaluateBadges() {
  const [sessions, doneMap, streak, answeredTotal, repairs] = await Promise.all([
    State.sessions(), State.doneMap(), streakInfo(),
    DB.get("kv", "answeredTotal"), DB.get("kv", "lastRepair")
  ]);
  const teachbacks = (await DB.get("kv", "teachbacks")) || {};
  const have = await earnedBadges();

  const stats = {
    sessions,
    answered: answeredTotal || 0,
    streak: streak.current,
    perfect: sessions.some(s => s.pct === 100),
    mocks: sessions.filter(s => s.kind === "mock"),
    bestMock: Math.max(0, ...sessions.filter(s => s.kind === "mock").map(s => s.pct)),
    repairs: (repairs && repairs.count) || 0,
    grand: Object.keys(doneMap).some(k => k.indexOf(":grand") !== -1),
    teachPass: Object.keys(teachbacks).some(t => teachbacks[t] && teachbacks[t].verdict === "pass")
  };

  const tests = {
    "first-session": stats.sessions.length >= 1,
    "q100": stats.answered >= 100,
    "q500": stats.answered >= 500,
    "q1000": stats.answered >= 1000,
    "perfect": stats.perfect,
    "streak7": stats.streak >= 7,
    "streak30": stats.streak >= 30,
    "streak100": stats.streak >= 100,
    "first-mock": stats.mocks.length >= 1,
    "repair10": stats.repairs >= 10,
    "grand1": stats.grand,
    "teach1": stats.teachPass,
    "mock300": stats.bestMock >= Math.round(300 / 4)
  };

  const fresh = [];
  BADGES.forEach(b => {
    if (!have[b.id] && tests[b.id]) { have[b.id] = U.todayISO(); fresh.push(b); }
  });
  if (fresh.length) await DB.set("kv", "badges", have);
  return fresh;
}

function badgeGrid(earned, limit) {
  return html`<div class="badge-grid">
    ${BADGES.slice(0, limit || BADGES.length).map(b => html`<div class="badge ${earned[b.id] ? "earned" : ""}" title="${b.desc}">
      <span class="emo">${b.emo}</span>
      <span class="name">${b.name}</span>
      <span class="date">${earned[b.id] ? earned[b.id].slice(5) : "locked"}</span>
    </div>`)}
  </div>`;
}

/* ============================================================
   Sturdy — Review queue (spaced repetition) and Stats dashboard
   ============================================================ */
"use strict";

/* ---------- Review queue ---------- */
async function renderReview(container) {
  const [cards, debt] = await Promise.all([State.cards(), repairDebt()]);
  const due = SRS.dueCards(cards);
  const upcoming = cards.slice().sort((a, b) => a.due < b.due ? -1 : 1).filter(c => c.due > U.todayISO());

  const view = html`<div class="fade-in">
    <div class="topbar"><h1>Review</h1><span class="chip info">spaced repetition</span></div>

    ${debt.needsRepair ? html`<div class="lock-banner"><span class="ico">🛠️</span><div><b>Repair first.</b> ${debt.newSinceReview} new questions since your last review, ${debt.openMistakes} open mistakes. The rule: ten old mistakes reviewed for every ten new questions.</div></div>` : ""}

    <div class="card" style="text-align:center">
      <div style="display:flex;justify-content:center">${ring(due.length ? 100 : 0, String(due.length), "due now")}</div>
      ${due.length
        ? html`<button class="btn primary block big" style="margin-top:14px" id="start-review">Start review · ${Math.min(20, due.length)} cards</button>`
        : html`<p class="small muted" style="margin-top:12px">Queue is clear. Every wrong or unsure answer lands here and comes back exactly when memory starts to fade.</p>`}
    </div>

    ${upcoming.length ? html`<div class="card">
      <h3>Coming back</h3>
      ${upcoming.slice(0, 6).map(c => {
        const q = Bank.byRef(c.ref);
        return html`<div class="row">
          <div class="grow"><div class="title">${q ? q.q.slice(0, 64) : c.ref}</div><div class="sub">${q ? q.s : ""}</div></div>
          <span class="chip">${c.due === U.addDays(U.todayISO(), 1) ? "tomorrow" : c.due}</span>
        </div>`;
      })}
    </div>` : ""}
  </div>`;
  mount(container, view);

  const btn = view.querySelector("#start-review");
  if (btn) btn.addEventListener("click", async () => {
    const batch = due.slice(0, 20).map(c => Bank.byRef(c.ref)).filter(Boolean);
    if (!batch.length) return;
    const result = await runQuiz(App.view, {
      title: "Review", questions: batch, mode: "practice", kind: "review"
    });
    for (const a of result.answers) {
      const card = await DB.get("cards", a.ref);
      if (!card) continue;
      const grade = !a.correct ? 0 : (a.confidence === "guessing" ? 1 : a.confidence === "fairly" ? 2 : 3);
      await DB.put("cards", SRS.next(card, grade, Settings.cache.retention));
    }
    await recordSession(result);
    U.toast("Review banked. " + result.firstTryCorrect + "/" + result.total + " clean. ✓");
    App.nav("review");
  });
}

/* ---------- Stats dashboard ---------- */
async function renderStats(container) {
  const [sessions, streak, proj, mistakes] = await Promise.all([
    State.sessions(), streakInfo(), projectedScore(), State.mistakes()
  ]);
  const quizzes = sessions.filter(s => s.kind === "daily" || s.kind === "grand" || s.kind === "mock");
  const avg = quizzes.length
    ? quizzes.reduce((a, s) => a + s.pct, 0) / quizzes.length : 0;
  const answered = quizzes.reduce((a, s) => a + s.total, 0);

  // last 28 days activity strip
  const cells = [];
  for (let i = 27; i >= 0; i--) {
    const iso = U.addDays(U.todayISO(), -i);
    const l = await DB.get("kv", "log:" + iso);
    const n = l ? l.answered : 0;
    const lvl = n === 0 ? "" : n < 10 ? "l1" : n < 25 ? "l2" : "l3";
    cells.push(html`<div class="cal-cell ${lvl}" title="${iso}: ${n} answered"></div>`);
  }

  // traffic-light per completed session, weakest first
  const doneMap = await State.doneMap();
  const topicRows = [];
  Object.keys(doneMap).forEach(key => {
    topicRows.push({ key, st: doneMap[key] });
  });
  topicRows.sort((a, b) => a.st.pct - b.st.pct);

  const view = html`<div class="fade-in">
    <div class="topbar"><h1>Stats</h1><span class="chip gold">${icon("flame")} ${streak.current}-day streak</span></div>

    <div class="card">
      <div style="display:flex;align-items:center;gap:16px">
        <div style="flex:1">
          <div class="hero-num">${proj ? proj.score : "—"}<span style="font-size:18px;color:var(--text-3)">/400</span></div>
          <div class="hero-sub">projected score · target 320+</div>
          ${proj ? html`<div style="margin-top:10px">${bar(U.clamp(proj.score / 4, 0, 100))}</div>` : ""}
        </div>
        ${proj && proj.acc.English != null ? ring(proj.acc.English, U.fmtPct(proj.acc.English), "English") : ""}
      </div>
      ${proj ? html`<div class="chip-row" style="margin-top:12px">
        ${["Physics", "Chemistry", "Biology"].map(s => proj.acc[s] != null ? html`<span class="chip ${proj.acc[s] >= 85 ? "good" : proj.acc[s] >= 60 ? "gold" : "bad"}">${s} ${Math.round(proj.acc[s])}%</span>` : "")}
      </div>` : html`<p class="tiny muted" style="margin-top:10px">Take your first quizzes to unlock the projection.</p>`}
    </div>

    <div class="stat-grid">
      <div class="card"><div class="big-num">${U.fmtPct(avg)}</div><div class="tiny muted">average score</div></div>
      <div class="card"><div class="big-num">${answered}</div><div class="tiny muted">questions answered</div></div>
      <div class="card"><div class="big-num">${mistakes.filter(m => !m.resolved).length}</div><div class="tiny muted">open mistakes</div></div>
      <div class="card"><div class="big-num">${quizzes.length}</div><div class="tiny muted">sessions done</div></div>
    </div>

    <div class="card">
      <h3>Last 28 days <span class="muted tiny" style="font-weight:600">· no zero days</span></h3>
      <div class="cal" style="margin-top:10px">${cells}</div>
    </div>

    ${topicRows.length ? html`<div class="card">
      <h3>Session mastery <span class="muted tiny" style="font-weight:600">· weakest first</span></h3>
      ${topicRows.slice(0, 10).map(r => {
        const parts = r.key.replace("w", "").split(":");
        const name = parts[1] === "grand" ? "Grand Quiz" : "Day " + (Number(parts[1].replace("d", "")) );
        return html`<div class="row">
          <div class="grow">
            <div class="title">Week ${parts[0]} · ${name} <span class="muted tiny">· ${r.st.pct >= 85 ? "strong" : r.st.pct >= 60 ? "ok" : "needs repair"}</span></div>
            <div style="margin-top:6px">${bar(r.st.pct, r.st.pct >= 85 ? "good" : r.st.pct >= 60 ? "" : "bad")}</div>
          </div>
          <span class="chip ${r.st.pct >= 85 ? "good" : r.st.pct >= 60 ? "gold" : "bad"}">${r.st.pct}%</span>
        </div>`;
      })}
    </div>` : ""}
  </div>`;
  mount(container, view);
}
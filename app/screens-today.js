/* ============================================================
   Sturdy — Today screen, energy missions, and the live calendar
   ============================================================ */
"use strict";

/* ---------- Onboarding ---------- */
function renderOnboarding(container) {
  mount(container, html`<div class="fade-in">
    <div class="boot-splash" style="min-height:60vh">
      <div class="boot-logo">S</div>
      <h1 style="margin-top:10px">Welcome to Sturdy</h1>
      <p class="muted small center" style="max-width:340px">
        Your recall-first companion for JAMB 2027: 1,800 verified questions,
        spaced review, a mistake vault, and full CBT mocks. Everything works offline.
      </p>
    </div>
    <div class="card">
      <label class="field">Programme start date (Day 1)</label>
      <input type="date" id="ob-start" value="${Settings.cache.programmeStart}" />
      <p class="tiny muted" style="margin-top:8px">The calendar is built from this date: weekdays carry daily quizzes, Saturdays carry Grand quizzes, and everything counts down to 15 March 2027.</p>
      <button class="btn primary block big" style="margin-top:14px" id="ob-go">Start my programme</button>
    </div>
  </div>`);
  container.querySelector("#ob-go").addEventListener("click", async () => {
    const v = container.querySelector("#ob-start").value || "2026-11-11";
    await Settings.save({ programmeStart: v, onboarded: true });
    U.toast("Day 1 set. Let's work. 💪");
    State.invalidate();
    App.nav("today");
  });
}

/* ---------- Today ---------- */
async function renderToday(container) {
  const settings = Settings.cache;
  if (!settings.onboarded) { renderOnboarding(container); return; }

  const [doneMap, streak, debt, badges] = await Promise.all([
    State.doneMap(), streakInfo(), repairDebt(), earnedBadges()
  ]);
  const mission = Prog.todayMission(doneMap);
  const log = (await DB.get("kv", "log:" + U.todayISO())) || { braindump: "", slept: false, answered: 0 };
  const dte = U.daysToExam();
  const doneCount = Object.keys(doneMap).length;
  const totalSessions = Prog.totalDays() + 12;
  const isSunday = U.isoToDate(U.todayISO()).getDay() === 0;
  const failCounts = await State.failCounts();

  const view = html`<div>
    <div class="topbar">
      <div class="brand">
        <div class="brand-mark">S</div>
        <div>
          <div class="brand-name">Sturdy</div>
          <div class="brand-sub">${greeting()}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <span class="chip gold">${icon("flame")} ${streak.current}</span>
        <button class="icon-btn" id="theme-toggle" title="Toggle theme">${icon(settings.theme === "dark" ? "sun" : "moon")}</button>
      </div>
    </div>

    <div class="card" style="background:linear-gradient(135deg,var(--card),var(--card-2))">
      <div style="display:flex;align-items:center;gap:16px">
        <div style="flex:1">
          <div class="hero-num">${dte}<span style="font-size:18px;color:var(--text-3)"> days</span></div>
          <div class="hero-sub">until JAMB · 15 March 2027</div>
        </div>
        ${ring(100 * doneCount / totalSessions, doneCount + "/" + totalSessions, "sessions")}
      </div>
    </div>

    ${dte <= 3 && dte > 0 ? html`<button class="lock-banner final72" id="f72-banner" style="width:100%;text-align:left;cursor:pointer"><span class="ico">🏁</span><div><b>Final 72 hours.</b> The plan for the last three days is ready. Tap to open it.</div></button>` : ""}
    ${dte === 0 ? html`<div class="lock-banner" style="background:linear-gradient(135deg,var(--gold),var(--gold-2));color:#10142a"><span class="ico">🎯</span><div><b>It's exam day.</b> Eat something familiar, arrive 90 minutes early, and run your two-pass strategy. Everything you did here is in you. Go.</div></div>` : ""}
    ${debt.needsRepair ? html`<div class="lock-banner"><span class="ico">🛠️</span><div><b>Repair first.</b> You have ${debt.openMistakes} open mistakes and ${debt.newSinceReview} new questions since your last review. Your mission starts with a mistake review.</div></div>` : ""}
    ${mission.overdue.length ? html`<div class="lock-banner" style="background:var(--accent-soft);border-color:var(--accent)"><span class="ico">⏰</span><div><b>Catch-up:</b> ${mission.overdue.length} scheduled session(s) behind you. Clear them at your pace — the calendar never moved.</div></div>` : ""}
    ${isSunday ? html`<div id="weekly-recap"></div>` : ""}

    <div class="card" id="mission-card">
      <h2>How is your energy right now?</h2>
      <p class="small muted" style="margin:6px 0 14px">One honest tap. The app builds the whole session; you just press start.</p>
      <div class="energy-grid">
        <button class="energy-btn" data-e="zombie"><span class="emo">🧟</span>Zombie<small>10–15 min survival mode</small></button>
        <button class="energy-btn" data-e="normal"><span class="emo">🙂</span>Normal<small>35–50 min full loop</small></button>
        <button class="energy-btn" data-e="beast"><span class="emo">🔥</span>Beast<small>90–120 min everything</small></button>
      </div>
      <div id="mission-plan" style="margin-top:14px"></div>
    </div>

    <div class="card">
      <h3>Brain-dump warm-up <span class="muted tiny" style="font-weight:600">· 2 minutes, no notes</span></h3>
      <textarea id="braindump" placeholder="Write everything you remember from yesterday's topics...">${log.braindump || ""}</textarea>
      <div class="btn-row" style="margin-top:10px">
        <button class="btn ghost" id="save-dump">Save</button>
        <button class="btn ${log.slept ? "good" : "ghost"}" id="sleep-toggle">${log.slept ? "🌙 7h+ logged" : "😴 I slept 7h+"}</button>
      </div>
    </div>

    <div class="card">
      <h3>Milestones</h3>
      ${badgeGrid(badges)}
      <p class="tiny muted" style="margin-top:8px">Badges unlock themselves as you work. Full gallery in Stats.</p>
    </div>
  </div>`;
  mount(container, view);

  const f72 = view.querySelector("#f72-banner");
  if (f72) f72.addEventListener("click", () => App.nav("final72"));

  if (isSunday) renderWeeklyRecap(view.querySelector("#weekly-recap"));

  function greeting() {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  }

  view.querySelector("#theme-toggle").addEventListener("click", () => {
    const t = Settings.cache.theme === "dark" ? "light" : "dark";
    Settings.save({ theme: t }).then(() => App.nav("today"));
  });

  view.querySelector("#save-dump").addEventListener("click", async () => {
    const key = "log:" + U.todayISO();
    const l = (await DB.get("kv", key)) || { answered: 0, correct: 0, xp: 0, slept: false, braindump: "" };
    l.braindump = view.querySelector("#braindump").value;
    await DB.set("kv", key, l);
    U.toast("Brain dump saved 🧠");
  });

  view.querySelector("#sleep-toggle").addEventListener("click", async () => {
    const key = "log:" + U.todayISO();
    const l = (await DB.get("kv", key)) || { answered: 0, correct: 0, xp: 0, slept: false, braindump: "" };
    l.slept = !l.slept;
    await DB.set("kv", key, l);
    renderToday(container);
  });

  /* energy -> mission plan */
  view.querySelectorAll(".energy-btn").forEach(b => {
    b.addEventListener("click", async () => {
      view.querySelectorAll(".energy-btn").forEach(x => x.classList.remove("sel"));
      b.classList.add("sel");
      const energy = b.getAttribute("data-e");
      const plan = await buildMission(energy, mission, debt);
      const box = view.querySelector("#mission-plan");
      box.innerHTML = "";
      box.appendChild(plan);
    });
  });
}

/* ---------- Sunday weekly recap ---------- */
async function renderWeeklyRecap(box) {
  const today = U.todayISO();
  const monday = U.addDays(today, -6); // last Monday (today is Sunday)
  const [sessions, doneMap] = await Promise.all([State.sessions(), State.doneMap()]);
  const weekSessions = sessions.filter(s => s.date >= monday && s.date <= today);
  const answered = weekSessions.reduce((a, s) => a + s.total, 0);
  const acc = weekSessions.length
    ? Math.round(weekSessions.reduce((a, s) => a + s.pct, 0) / weekSessions.length) : 0;

  // weakest subject of the week
  const accSum = {}, accN = {};
  weekSessions.forEach(s => {
    if (!s.subjectPct) return;
    Object.keys(s.subjectPct).forEach(sub => {
      accSum[sub] = (accSum[sub] || 0) + s.subjectPct[sub];
      accN[sub] = (accN[sub] || 0) + 1;
    });
  });
  let weakest = null;
  Object.keys(accSum).forEach(sub => {
    const v = accSum[sub] / accN[sub];
    if (!weakest || v < weakest.v) weakest = { sub, v: Math.round(v) };
  });

  // sessions completed this week (from doneMap dates)
  let doneThisWeek = 0;
  Object.keys(doneMap).forEach(k => { if (doneMap[k] && doneMap[k].date >= monday && doneMap[k].date <= today) doneThisWeek++; });

  box.appendChild(html`<div class="card recap">
    <h3>📋 Weekly recap <span class="muted tiny" style="font-weight:600">· ${prettyDate(monday).replace(",", "")} → Saturday</span></h3>
    <div class="stat-grid" style="margin-top:10px">
      <div><div class="big-num">${doneThisWeek}</div><div class="tiny muted">sessions done</div></div>
      <div><div class="big-num">${answered}</div><div class="tiny muted">questions</div></div>
      <div><div class="big-num">${acc}%</div><div class="tiny muted">average</div></div>
    </div>
    ${weakest ? html`<p class="small" style="margin-top:10px">Weakest subject this week: <b style="color:var(--gold)">${weakest.sub} (${weakest.v}%)</b> — give it an extra pass this week.</p>`
      : html`<p class="small muted" style="margin-top:10px">No sessions yet this week. Sunday is rest — Monday you go again.</p>`}
  </div>`);
}

async function buildMission(energy, mission, debt) {
  const parts = [];

  function sessionBtn(label, sub, session) {
    const b = html`<button class="btn primary block" style="margin-bottom:10px">
      <span>${label}</span>${sub ? html`<span class="tiny" style="opacity:0.75"> · ${sub}</span>` : ""}
    </button>`;
    b.addEventListener("click", () => App.launchSession(session));
    return b;
  }

  const cards = await State.cards();
  const due = SRS.dueCards(cards);
  const fails = await State.failCounts();
  const failKey = s => s.type === "daily" ? "w" + s.week + ":" + s.dayId : s.type === "grand" ? "w" + s.week + ":grand" : null;
  // Don't-Move-On escalation: previously failed sessions bubble to the top
  const esc = list => list.slice().sort((a, b) => {
    const fa = (fails[failKey(a)] || {}).count || 0;
    const fb = (fails[failKey(b)] || {}).count || 0;
    return fb - fa;
  });
  const escNote = s => {
    const f = fails[failKey(s)];
    return f && f.count >= 2 ? " · failed " + f.count + "× — going again until it's clean" : "";
  };

  // weak topics (failed teach-backs) resurface as drills
  const weak = typeof weakTopics === "function" ? await weakTopics() : [];
  if (weak.length && energy !== "zombie") {
    const drillQs = [];
    const weeks = Bank.weeks();
    Object.keys(weeks).forEach(w => {
      (weeks[w].daily || []).forEach(d => {
        const text = (d.topics || []).join(" · ").toLowerCase();
        if (weak.some(t => t.name.toLowerCase().split(" ").some(word => word.length > 4 && text.indexOf(word) !== -1))) {
          d.questions.forEach(q => drillQs.push(Object.assign({}, q)));
        }
      });
    });
    if (drillQs.length) {
      parts.push(html`<div class="lock-banner" style="background:var(--gold-soft,rgba(245,196,81,0.12));border-color:var(--gold)"><span class="ico">🟠</span><div><b>Weak topics resurfacing:</b> ${weak.map(t => t.name).join(", ")}. A drill is queued below.</div></div>`);
      weak._drill = U.shuffle(drillQs).slice(0, 10);
    }
  }

  if (energy === "zombie") {
    parts.push(html`<p class="small muted">Survival mode: 5 quick recall shots. That's a win for today. 🛟</p>`);
    if (due.length) parts.push(sessionBtn("Review " + Math.min(5, due.length) + " cards", "your scheduled mistakes", { type: "review", limit: 5 }));
    else if (mission.todays.length || mission.overdue.length) {
      const s = mission.todays[0] || mission.overdue[0];
      const qs = (s.type === "daily" ? s.day.questions : s.type === "grand" ? s.grand.questions : null);
      if (qs) parts.push(sessionBtn("Micro quiz · 5 questions", s.label, { type: s.type, week: s.week, dayId: s.dayId, day: s.day, grand: s.grand, questions: qs.slice(0, 5), partial: true }));
    } else parts.push(html`<p class="small muted">Nothing scheduled — you are ahead. Rest is productive too. 🌙</p>`);
  } else if (energy === "normal") {
    parts.push(html`<p class="small muted">Full loop: today's quiz, then any due review cards.</p>`);
    if (debt.needsRepair) parts.push(sessionBtn("Repair: 10 mistakes", "repair-first rule", { type: "review", limit: 10, mistakesOnly: true }));
    esc(mission.overdue.slice(0, 2)).forEach(s => {
      parts.push(sessionBtn("Catch-up · " + s.label + escNote(s), s.type === "daily" ? "20 questions" : s.type === "grand" ? "50 questions" : "180 questions · 2 hours", sessionFromSched(s)));
    });
    esc(mission.todays).forEach(s => {
      parts.push(sessionBtn(s.label + escNote(s), s.type === "daily" ? "20 questions · pace timer" : s.type === "grand" ? "50 questions · weekly checkpoint" : "180 questions · full CBT", sessionFromSched(s)));
    });
    if (weak._drill) parts.push(sessionBtn("Weak-topic drill · " + weak._drill.length + " questions", "from failed teach-backs", { type: "review", questions: weak._drill, label: "Weak-topic drill" }));
    if (due.length) parts.push(sessionBtn("Review " + Math.min(15, due.length) + " due cards", "spaced repetition (FSRS)", { type: "review", limit: Math.min(15, due.length) }));
    if (!mission.todays.length && !mission.overdue.length && !due.length) parts.push(html`<p class="small muted">Nothing scheduled today — enjoy the rest day, or run a mock from the More tab.</p>`);
  } else {
    parts.push(html`<p class="small muted">Beast mode: catch-up + today + full review.</p>`);
    esc(mission.overdue).forEach(s => parts.push(sessionBtn("Catch-up · " + s.label + escNote(s), "", sessionFromSched(s))));
    esc(mission.todays).forEach(s => parts.push(sessionBtn(s.label + escNote(s), "", sessionFromSched(s))));
    if (weak._drill) parts.push(sessionBtn("Weak-topic drill · " + weak._drill.length + " questions", "", { type: "review", questions: weak._drill, label: "Weak-topic drill" }));
    if (due.length) parts.push(sessionBtn("Review all " + due.length + " due cards", "", { type: "review", limit: due.length }));
    if (!mission.todays.length && !mission.overdue.length && !due.length) parts.push(html`<p class="small muted">Nothing scheduled today — Beast mode says: run a mock from the More tab. 💪</p>`);
  }

  const box = document.createElement("div");
  parts.forEach(p => box.appendChild(p));
  return box;
}

function sessionFromSched(s) {
  if (s.type === "mockday") {
    return { type: "mockday", mockDate: s.date, questions: null, label: s.label };
  }
  return {
    type: s.type,
    week: s.week,
    dayId: s.dayId,
    day: s.day,
    grand: s.grand,
    questions: s.type === "daily" ? s.day.questions : s.grand.questions,
    label: s.label
  };
}

/* ---------- Calendar (live, date-accurate) ---------- */
let calCursor = null; // "YYYY-MM"

async function renderCalendar(container) {
  const doneMap = await State.doneMap();
  const sched = Prog.schedule();
  const today = U.todayISO();
  if (!calCursor) calCursor = today.slice(0, 7);

  const byDate = {};
  sched.forEach(s => { (byDate[s.date] = byDate[s.date] || []).push(s); });

  const parts = calCursor.split("-").map(Number);
  const yy = parts[0], mm = parts[1];
  const first = new Date(yy, mm - 1, 1);
  const daysInMonth = new Date(yy, mm, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday-first

  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(html`<div></div>`);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = yy + "-" + String(mm).padStart(2, "0") + "-" + String(d).padStart(2, "0");
    const items = byDate[iso] || [];
    const isToday = iso === today;
    const isExam = iso === U.examDate();
    const isPast = iso < today;
    const rest = items.length && items.every(x => x.type === "rest");
    const hasGrand = items.some(x => x.type === "grand");

    let cls = "cal-day";
    let tag = "";
    if (isExam) { cls += " exam"; tag = "EXAM"; }
    else if (rest && !isToday) { cls += " rest"; }
    else if (hasGrand) { cls += " grandday"; tag = "G"; }
    else if (items.length && items[0].type === "mockday") {
      cls += " mockday"; tag = "M";
      if (isPast) cls += doneMap["mockday:" + iso] ? " done" : " miss";
    }
    else if (items.length) {
      const w = items[0].week;
      tag = "W" + w;
      if (isPast) cls += doneMap["w" + w + ":" + items[0].dayId] ? " done" : " miss";
    }
    if (isToday) cls += " today";

    const cell = html`<button class="${cls}" data-date="${iso}">
      <span class="dnum">${d}</span>
      ${tag ? html`<span class="dtag">${tag}</span>` : html`<span class="dtag">&nbsp;</span>`}
    </button>`;
    cell.addEventListener("click", () => showDayDetail(iso, items, doneMap, container));
    cells.push(cell);
  }

  const view = html`<div class="fade-in">
    <div class="topbar">
      <h1>Calendar</h1>
      <span class="chip gold">${U.daysToExam()} days to exam</span>
    </div>
    <div class="card">
      <div class="cal-head">
        <button class="icon-btn" id="cal-prev">‹</button>
        <h2>${U.MON[mm - 1]} ${yy}</h2>
        <button class="icon-btn" id="cal-next">›</button>
      </div>
      <div class="cal-grid">
        ${["M", "T", "W", "T", "F", "S", "S"].map(d => html`<div class="cal-dow">${d}</div>`)}
        ${cells}
      </div>
      <hr class="divider"/>
      <div class="chip-row">
        <span class="chip good">Done</span>
        <span class="chip bad">Missed</span>
        <span class="chip">Daily quiz</span>
        <span class="chip info">G · Grand quiz</span>
        <span class="chip">M · Full mock</span>
        <span class="chip gold">Exam day</span>
      </div>
    </div>
    <div id="day-detail"></div>
  </div>`;
  mount(container, view);

  view.querySelector("#cal-prev").addEventListener("click", () => {
    let y = yy, m = mm;
    m--; if (m < 1) { m = 12; y--; }
    calCursor = y + "-" + String(m).padStart(2, "0");
    renderCalendar(container);
  });
  view.querySelector("#cal-next").addEventListener("click", () => {
    let y = yy, m = mm;
    m++; if (m > 12) { m = 1; y++; }
    calCursor = y + "-" + String(m).padStart(2, "0");
    renderCalendar(container);
  });

  function showDayDetail(iso, items, dm, root) {
    const box = root.querySelector("#day-detail");
    box.innerHTML = "";
    if (!items.length || items.every(x => x.type === "rest")) {
      box.appendChild(html`<div class="card quiet center small muted">${prettyDate(iso)} · Rest day — recover, or review a few cards.</div>`);
      return;
    }
    const card = html`<div class="card"><h3>${prettyDate(iso)}</h3></div>`;
    items.forEach(s => {
      if (s.type === "rest") return;
      if (s.type === "exam") {
        card.appendChild(html`<div class="row"><span class="emo">🎯</span><div class="grow"><div class="title">JAMB UTME — exam day</div><div class="sub">Everything since Day 1 was for this morning.</div></div></div>`);
        return;
      }
      if (s.type === "mockday") {
        const done = dm["mockday:" + iso];
        const isToday = iso === U.todayISO();
        const row = html`<div class="row">
          <div class="grow"><div class="title">${s.label}</div><div class="sub">180 questions · 2 hours · real CBT conditions</div></div>
          ${done ? html`<span class="chip good">${done.pct}%</span>`
            : (isToday || iso < U.todayISO()) ? html`<button class="btn primary small">Start</button>`
            : html`<span class="chip">Scheduled</span>`}
        </div>`;
        const btn = row.querySelector("button");
        if (btn) btn.addEventListener("click", () => App.launchSession(sessionFromSched(s)));
        card.appendChild(row);
        return;
      }
      const key = "w" + s.week + ":" + s.dayId;
      const done = dm[key];
      const isToday = iso === U.todayISO();
      const row = html`<div class="row">
        <div class="grow">
          <div class="title">${s.label}</div>
          <div class="sub">${s.type === "daily" ? s.day.topics.join(" · ") : "50 questions · the full week"}</div>
        </div>
        ${done ? html`<span class="chip ${done.passed ? "good" : "bad"}">${done.pct}%</span>`
          : (isToday || iso < U.todayISO()) ? html`<button class="btn primary small">Start</button>`
          : html`<span class="chip">Scheduled</span>`}
      </div>`;
      const btn = row.querySelector("button");
      if (btn) btn.addEventListener("click", () => App.launchSession(sessionFromSched(s)));
      card.appendChild(row);
    });
    box.appendChild(card);
  }
}

function prettyDate(iso) {
  const d = U.isoToDate(iso);
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()] + ", " + d.getDate() + " " + U.MON[d.getMonth()];
}

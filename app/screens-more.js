/* ============================================================
   Sturdy — More tab: Mistake Vault, Mock setup, Settings
   ============================================================ */
"use strict";

/* ---------- More ---------- */
function renderMore(container) {
  const view = html`<div class="fade-in">
    <div class="topbar"><h1>More</h1></div>
    <div class="card center" style="background:linear-gradient(135deg,var(--card),var(--card-2))">
      <div class="boot-logo" style="margin:0 auto 10px">S</div>
      <h2>Sturdy</h2>
      <p class="tiny muted">1,800 questions · spaced review · CBT mocks · offline-first</p>
    </div>
    ${[
      ["vault", "🛠️", "Mistake Vault", "Every wrong answer, tagged and repairable"],
      ["mock", "🖥️", "Mock mode", "Full 180-question CBT simulation, 2 hours"],
      ["review", "🔁", "Review queue", "Spaced repetition, exam-paced"],
      ["stats", "📈", "Stats", "Projected score, streaks, mastery map"],
      ["calendar", "🗓️", "Calendar", "The live programme, date-accurate"],
      ["settings", "⚙️", "Settings", "Theme, keys, retention, backup"]
    ].map(r => {
      const row = html`<button class="row-btn" data-route="${r[0]}">
        <span class="emo">${r[1]}</span>
        <span class="grow"><span class="title">${r[2]}</span><span class="sub">${r[3]}</span></span>
        <span class="chev">›</span>
      </button>`;
      row.addEventListener("click", () => App.nav(r[0]));
      return row;
    })}
  </div>`;
  mount(container, view);
}

/* ---------- Mistake Vault ---------- */
const TAGS = ["Concept gap", "Formula missing", "Vocabulary gap", "Misread", "Careless", "Ran out of time"];
const TAG_EMO = ["🧠", "📐", "📖", "👀", "⚡", "⏱️"];

async function renderVault(container) {
  const mistakes = await State.mistakes();
  const open = mistakes.filter(m => !m.resolved);
  const byTag = {};
  open.forEach(m => { byTag[m.tag] = (byTag[m.tag] || 0) + 1; });
  const topTags = Object.keys(byTag).sort((a, b) => byTag[b] - byTag[a]);

  const view = html`<div class="fade-in">
    <div class="topbar"><h1>Mistake Vault</h1><span class="chip bad">${open.length} open</span></div>

    <div class="card">
      <h3>Your error patterns</h3>
      ${topTags.length ? topTags.map(t => html`<div class="row">
        <span class="emo">${TAG_EMO[TAGS.indexOf(t)] || "•"}</span>
        <div class="grow"><div class="title">${t}</div><div style="margin-top:6px">${bar(100 * byTag[t] / open.length)}</div></div>
        <span class="chip">${byTag[t]}</span>
      </div>`) : html`<p class="small muted">No open mistakes. Either you're flawless or you haven't started. 😄</p>`}
    </div>

    ${open.length ? html`<div class="card">
      <h3>Repair session</h3>
      <p class="small muted">Re-attempt your worst mistakes until they're clean. Ten old mistakes before every ten new questions — that's the rule.</p>
      <button class="btn primary block big" id="repair-btn">Repair ${Math.min(10, open.length)} mistakes</button>
    </div>` : ""}

    <div class="card">
      <h3>All mistakes</h3>
      ${mistakes.length ? mistakes.slice().reverse().slice(0, 30).map((m, i) => {
        const q = Bank.byRef(m.ref);
        const idx = TAGS.indexOf(m.tag);
        return html`<div class="row">
          <span class="emo">${TAG_EMO[idx] || "•"}</span>
          <div class="grow">
            <div class="title">${q ? q.q.slice(0, 70) : m.ref}</div>
            <div class="sub">${m.date} · ${q ? q.s : ""}</div>
          </div>
          ${m.resolved ? html`<span class="chip good">fixed</span>` : html`<select class="tag-select" data-i="${mistakes.length - 1 - i}">
            ${TAGS.map(t => html`<option ${t === m.tag ? "selected" : ""}>${t}</option>`)}
          </select>`}
        </div>`;
      }) : html`<p class="small muted">Empty for now. Mistakes are fuel — they'll pile up here, tagged and ready to burn.</p>`}
    </div>
  </div>`;
  mount(container, view);

  const rb = view.querySelector("#repair-btn");
  if (rb) rb.addEventListener("click", async () => {
    const batch = open.slice(0, 10).map(m => Bank.byRef(m.ref)).filter(Boolean);
    const result = await runQuiz(App.view, { title: "Repair", questions: batch, mode: "practice", kind: "review", mistakesOnly: true });
    for (const a of result.answers) {
      if (!a.correct) continue;
      const ms = await DB.getAll("mistakes");
      const m = ms.find(x => x.ref === a.ref && !x.resolved);
      if (m) { m.resolved = true; await DB.put("mistakes", m); }
    }
    // answered repair questions count toward the 10-per-10 rule
    const key = "lastRepair";
    const prev = (await DB.get("kv", key)) || { count: 0 };
    await DB.set("kv", key, { date: U.todayISO(), count: prev.count + result.total });
    U.toast("Repair done. Clean ones leave the vault. ✨");
    App.nav("vault");
  });

  view.querySelectorAll(".tag-select").forEach(sel => {
    sel.addEventListener("change", async () => {
      const ms = await DB.getAll("mistakes");
      const m = ms[Number(sel.getAttribute("data-i"))];
      if (m) { m.tag = sel.value; await DB.put("mistakes", m); U.toast("Tagged: " + sel.value); }
    });
  });
}

/* ---------- Mock setup ---------- */
async function renderMockSetup(container) {
  const doneMap = await State.doneMap();
  const mocks = Object.keys(doneMap).filter(k => k.indexOf("mock:") === 0).length;
  const view = html`<div class="fade-in">
    <div class="topbar"><h1>Mock mode</h1><span class="chip info">CBT simulator</span></div>
    <div class="card">
      <h3>Full JAMB simulation</h3>
      <div class="chip-row" style="margin:10px 0">
        <span class="chip">English 60</span><span class="chip">Physics 40</span>
        <span class="chip">Chemistry 40</span><span class="chip">Biology 40</span>
        <span class="chip gold">180 Qs · 2 hours</span>
      </div>
      <ul class="small muted" style="margin:0 0 14px 18px;padding:0">
        <li>Question palette with flag-and-return, exactly like the real CBT</li>
        <li>Two-pass strategy encouraged: bank the easy marks first</li>
        <li>Timer, auto-submit, no pauses — train the real conditions</li>
      </ul>
      <div class="big-num" style="margin-bottom:10px">${mocks} <span class="tiny muted">mocks completed</span></div>
      <button class="btn primary block big" id="start-mock">Start mock exam</button>
      <p class="tiny muted center" style="margin-top:8px">Recommended: one mock every Saturday from late February.</p>
    </div>
  </div>`;
  mount(container, view);
  view.querySelector("#start-mock").addEventListener("click", async () => {
    const qs = Bank.buildMock();
    await runQuiz(App.view, { title: "Mock UTME", questions: qs, mode: "mock", kind: "mock" });
  });
}

/* ---------- Settings ---------- */
async function renderSettings(container) {
  const s = Settings.cache;
  const view = html`<div class="fade-in">
    <div class="topbar"><h1>Settings</h1></div>

    <div class="card">
      <h3>Appearance</h3>
      <div class="btn-row">
        <button class="btn ${s.theme === "dark" ? "primary" : "ghost"}" id="th-dark">🌙 Dark</button>
        <button class="btn ${s.theme === "light" ? "primary" : "ghost"}" id="th-light">☀️ Light</button>
      </div>
    </div>

    <div class="card">
      <h3>Programme</h3>
      <label class="field">Day 1 date</label>
      <input type="date" id="set-start" value="${s.programmeStart}" />
      <label class="field" style="margin-top:14px">Target retention — <span id="ret-val">${Math.round(s.retention * 100)}%</span></label>
      <input type="range" min="0.8" max="0.95" step="0.01" value="${s.retention}" id="set-ret" />
      <p class="tiny muted">Higher = reviews come back sooner (more work, stronger memory). 85% is the sweet spot.</p>
      <label class="field" style="margin-top:14px">Pop-up ambushes</label>
      <div class="btn-row">
        ${["off", "chill", "normal", "extreme"].map(m =>
          html`<button class="btn ${s.ambush === m ? "primary" : "ghost"} amb" data-m="${m}">${m[0].toUpperCase() + m.slice(1)}</button>`)}
      </div>
    </div>

    <div class="card">
      <h3>API keys <span class="muted tiny" style="font-weight:600">· optional, stored only on this device</span></h3>
      <label class="field">Groq API key <span class="tiny muted">(AI tutor features)</span></label>
      <input type="password" id="set-groq" value="${s.groqKey || ""}" placeholder="gsk_..." />
      <label class="field" style="margin-top:10px">YouTube Data API key <span class="tiny muted">(concept repair videos)</span></label>
      <input type="password" id="set-yt" value="${s.ytKey || ""}" placeholder="AIza..." />
      <p class="tiny muted">Keys never leave your browser except to call Groq/Google directly.</p>
    </div>

    <div class="card">
      <h3>Data</h3>
      <div class="btn-row">
        <button class="btn ghost" id="export-btn">⬇️ Export backup</button>
        <button class="btn danger" id="erase-btn">Erase everything</button>
      </div>
      <p class="tiny muted" style="margin-top:8px">Backup includes progress, review cards, and the mistake vault.</p>
    </div>

    <p class="tiny muted center" style="margin:16px 0 40px">Sturdy · built for one person's 300+ · exam 15 March 2027</p>
  </div>`;
  mount(container, view);

  view.querySelector("#th-dark").addEventListener("click", () => Settings.save({ theme: "dark" }).then(() => App.nav("settings")));
  view.querySelector("#th-light").addEventListener("click", () => Settings.save({ theme: "light" }).then(() => App.nav("settings")));
  view.querySelectorAll(".amb").forEach(b => b.addEventListener("click", () =>
    Settings.save({ ambush: b.getAttribute("data-m") }).then(() => App.nav("settings"))));

  view.querySelector("#set-start").addEventListener("change", e => {
    Settings.save({ programmeStart: e.target.value || "2026-11-11" }).then(() => { State.invalidate(); U.toast("Day 1 updated — calendar rebuilt"); });
  });
  const ret = view.querySelector("#set-ret");
  ret.addEventListener("input", () => { view.querySelector("#ret-val").textContent = Math.round(ret.value * 100) + "%"; });
  ret.addEventListener("change", () => Settings.save({ retention: Number(ret.value) }));

  view.querySelector("#set-groq").addEventListener("change", e => Settings.save({ groqKey: e.target.value.trim() }));
  view.querySelector("#set-yt").addEventListener("change", e => Settings.save({ ytKey: e.target.value.trim() }));

  view.querySelector("#export-btn").addEventListener("click", async () => {
    const data = { exported: U.todayISO(), settings: Settings.cache, cards: await DB.getAll("cards"), mistakes: await DB.getAll("mistakes"), sessions: await DB.getAll("sessions") };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sturdy-backup-" + U.todayISO() + ".json";
    a.click();
  });

  view.querySelector("#erase-btn").addEventListener("click", async () => {
    if (!confirm("Erase ALL progress, cards and mistakes? This cannot be undone.")) return;
    await DB.clear("kv"); await DB.clear("cards"); await DB.clear("mistakes"); await DB.clear("sessions");
    await Settings.save({ onboarded: false });
    State.invalidate();
    U.toast("Everything erased. Fresh start.");
    App.nav("today");
  });
}
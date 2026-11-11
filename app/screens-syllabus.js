/* ============================================================
   Sturdy — Syllabus tracker + teach-it-back (Feynman mode)
   Topics auto-tick as related quiz days are completed; weak
   topics (failed teach-backs) resurface in missions.
   ============================================================ */
"use strict";

/* Map completed sessions -> syllabus topic progress. */
async function syllabusProgress() {
  const [doneMap, teachbacks] = await Promise.all([State.doneMap(), DB.get("kv", "teachbacks")]);
  const tb = teachbacks || {};
  const weeks = Bank.weeks();
  const out = [];

  Object.keys(window.SYLLABUS).forEach(subject => {
    const topics = window.SYLLABUS[subject].map(t => {
      let sum = 0, n = 0, days = [];
      Object.keys(weeks).forEach(w => {
        (weeks[w].daily || []).forEach(d => {
          const key = "w" + w + ":" + d.id;
          if (!doneMap[key]) return;
          const text = (d.topics || []).join(" · ").toLowerCase();
          if (t.keys.some(k => text.indexOf(k) !== -1)) {
            sum += doneMap[key].pct; n++; days.push(key);
          }
        });
      });
      const teach = tb[subject + ":" + t.id] || null;
      return {
        subject, id: t.id, name: t.name,
        touchedDays: n, avgPct: n ? Math.round(sum / n) : null,
        done: n > 0 && (!teach || teach.verdict !== "weak"),
        weak: !!(teach && teach.verdict === "weak"),
        teach
      };
    });
    out.push({ subject, topics });
  });
  return out;
}

function weakTopics() {
  return State.teachbacks().then(tb => {
    const map = tb || {};
    /* stored as one kv record: subject:topicId -> {verdict, missing, date} */
    const out = [];
    Object.keys(window.SYLLABUS).forEach(subject => {
      window.SYLLABUS[subject].forEach(t => {
        const r = map[subject + ":" + t.id];
        if (r && r.verdict === "weak") out.push({ subject, id: t.id, name: t.name, missing: r.missing || [] });
      });
    });
    return out;
  });
}

/* Patch: State.teachbacks helper lives on State via kv directly */
State.teachbacks = function () { return DB.get("kv", "teachbacks"); };

/* ---------- Syllabus screen ---------- */
async function renderSyllabus(container) {
  const prog = await syllabusProgress();
  const total = prog.reduce((a, s) => a + s.topics.length, 0);
  const done = prog.reduce((a, s) => a + s.topics.filter(t => t.done).length, 0);

  const view = html`<div class="fade-in">
    <div class="topbar"><h1>Syllabus</h1><span class="chip ${done === total ? "good" : "info"}">${done}/${total} topics</span></div>

    <div class="card">
      <h3>Coverage</h3>
      <div style="margin-top:8px">${bar(100 * done / total)}</div>
      <p class="tiny muted" style="margin-top:8px">Topics tick themselves as your quiz days cover them. Fail a teach-back and a topic turns amber until you repair it.</p>
    </div>

    ${prog.map(sec => html`<div class="card">
      <h3>${sec.subject} <span class="muted tiny" style="font-weight:600">· ${sec.topics.filter(t => t.done).length}/${sec.topics.length}</span></h3>
      ${sec.topics.map(t => {
        const row = html`<div class="row syl-row" data-s="${t.subject}" data-id="${t.id}">
          <span class="emo">${t.weak ? "🟠" : t.done ? "✅" : "⬜"}</span>
          <div class="grow">
            <div class="title">${t.name}</div>
            <div class="sub">${t.weak ? "needs repair — teach it back again"
              : t.touchedDays ? t.touchedDays + " quiz day(s) · avg " + t.avgPct + "%"
              : "not covered yet"}</div>
          </div>
          <button class="btn ghost small">Teach it back</button>
        </div>`;
        row.addEventListener("click", () => renderTeachBack(container, t.subject, t.id, t.name));
        return row;
      })}
    </div>`)}
  </div>`;
  mount(container, view);
}

/* ---------- Teach-it-back (Feynman grader) ---------- */
async function renderTeachBack(container, subject, topicId, topicName) {
  const tb = (await State.teachbacks()) || {};
  const prev = tb[subject + ":" + topicId] || null;

  const view = html`<div class="fade-in">
    <div class="topbar">
      <button class="icon-btn" id="tb-back">‹</button>
      <div><h1 style="font-size:20px">Teach it back</h1><div class="tiny muted">${subject} · ${topicName}</div></div>
    </div>

    <div class="card">
      <h3>Your explanation</h3>
      <p class="small muted">Close every book. Explain ${topicName} as if teaching a junior student — definitions, how it works, one example. Then the AI examiner grades what's missing or wrong.</p>
      <textarea id="tb-text" rows="8" placeholder="This topic is about... The key idea is... For example..."></textarea>
      <div class="btn-row" style="margin-top:10px">
        <button class="btn primary" id="tb-grade">Grade my explanation</button>
        ${prev ? html`<span class="chip ${prev.verdict === "pass" ? "good" : "bad"}">last: ${prev.verdict === "pass" ? "passed" : "weak"} ${prev.date || ""}</span>` : ""}
      </div>
      <div id="tb-result" style="margin-top:14px"></div>
    </div>

    ${prev && prev.missing && prev.missing.length ? html`<div class="card">
      <h3>Last gaps</h3>
      ${prev.missing.map(m => html`<div class="row"><span class="emo">•</span><div class="grow"><div class="title">${m}</div></div></div>`)}
    </div>` : ""}
  </div>`;
  mount(container, view);

  view.querySelector("#tb-back").addEventListener("click", () => App.nav("syllabus"));
  view.querySelector("#tb-grade").addEventListener("click", async () => {
    const text = view.querySelector("#tb-text").value.trim();
    const box = view.querySelector("#tb-result");
    if (text.length < 40) { U.toast("Write at least a few sentences — that's the point of the technique. ✍️"); return; }
    if (!AI.hasKey()) {
      box.innerHTML = "";
      box.appendChild(emptyState("🔑", "Groq key needed", "Add your free Groq API key in Settings to use the Feynman grader."));
      return;
    }
    const btn = view.querySelector("#tb-grade");
    btn.disabled = true; btn.textContent = "Grading…";
    box.innerHTML = "";
    try {
      const grade = await AI.feynmanGrade(topicName, subject, text);
      const passed = grade.verdict === "pass";
      // store verdict -> drives weak-topic resurfacing + syllabus colour
      const all = (await State.teachbacks()) || {};
      all[subject + ":" + topicId] = { verdict: grade.verdict, missing: grade.missing || [], wrong: grade.wrong || [], date: U.todayISO() };
      await DB.set("kv", "teachbacks", all);
      State.invalidate();
      box.appendChild(html`<div class="card" style="background:var(--card-2)">
        <div class="chip ${passed ? "good" : "bad"}">${passed ? "✅ Passed" : "🟠 Weak spots found"}</div>
        ${grade.tip ? html`<p class="small" style="margin-top:10px">💡 ${grade.tip}</p>` : ""}
        ${grade.missing && grade.missing.length ? html`<h3 style="margin-top:12px">Missing</h3>${grade.missing.map(m => html`<div class="row"><span class="emo">➖</span><div class="grow"><div class="title">${m}</div></div></div>`)}` : ""}
        ${grade.wrong && grade.wrong.length ? html`<h3 style="margin-top:12px">Wrong</h3>${grade.wrong.map(m => html`<div class="row"><span class="emo">✖️</span><div class="grow"><div class="title">${m}</div></div></div>`)}` : ""}
      </div>`);
      if (passed) U.toast("Teach-back passed. That topic is yours. 🎓");
      else U.toast("Weak spots listed — they'll resurface in your missions. 🟠");
      await evaluateBadges();
    } catch (e) {
      box.appendChild(emptyState("⚠️", "Couldn't grade", AI.friendlyError(e)));
    }
    btn.disabled = false; btn.textContent = "Grade my explanation";
  });
}

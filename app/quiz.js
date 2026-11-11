/* ============================================================
   Sturdy quiz player — practice (confidence + retry) and mock CBT
   M1: swipe gestures, pace timer, keyboard shortcuts, bookmarks,
       smooth transitions. M5: section navigation, review-after-submit.
   ============================================================ */
"use strict";

/* runQuiz(container, opts) -> Promise<result>
   opts: { title, questions, mode: 'practice'|'mock', kind, week, dayId, mockDate }
   result: { kind, week, dayId, pct, total, firstTryCorrect, answers } */
function runQuiz(container, opts) {
  return new Promise(resolve => {
    const qs = opts.questions.slice();
    const answers = qs.map(q => ({
      ref: q.ref || null, s: q.s, q: q.q, correct: false,
      confidence: null, pick: null, tries: 0, mistakeTag: null
    }));
    const flagged = new Set();
    let idx = 0;
    let timerIv = null;
    let keyHandler = null;
    let qStart = Date.now();
    let paceTotal = 0, paceN = 0;
    let bookmarks = {};

    document.body.classList.add("in-quiz");

    /* ---------- shared plumbing ---------- */
    function cleanup() {
      if (timerIv) clearInterval(timerIv);
      if (keyHandler) document.removeEventListener("keydown", keyHandler);
      document.body.classList.remove("in-quiz");
    }

    function finish() {
      cleanup();
      const total = qs.length;
      const firstTry = answers.filter(a => a.correct).length;
      const result = {
        kind: opts.kind || "daily",
        week: opts.week, dayId: opts.dayId,
        mockDate: opts.mockDate || null,
        pct: total ? Math.round(100 * firstTry / total) : 0,
        total, firstTryCorrect: firstTry,
        answers
      };
      resolve(result);
    }

    /* keyboard shortcuts (desktop) */
    function attachKeys() {
      keyHandler = e => {
        if (opts.mode === "mock") {
          if (e.key >= "1" && e.key <= "4") { picks[idx] = Number(e.key) - 1; render(); }
          else if (e.key === "ArrowRight" || e.key === "n") { if (idx < qs.length - 1) { idx++; render(); } }
          else if (e.key === "ArrowLeft" || e.key === "p") { if (idx > 0) { idx--; render(); } }
          else if (e.key === "f" || e.key === "F") { if (flagged.has(idx)) flagged.delete(idx); else flagged.add(idx); render(); }
          return;
        }
        const a = answers[idx];
        const q = qs[idx];
        const revealed = a.tries >= 2 || (a.pick !== null && a.correct);
        if (!a.confidence) {
          if (e.key === "1") { a.confidence = "sure"; renderQ(); }
          else if (e.key === "2") { a.confidence = "fairly"; renderQ(); }
          else if (e.key === "3") { a.confidence = "guessing"; renderQ(); }
          return;
        }
        if (!revealed && e.key >= "1" && e.key <= "4" && Number(e.key) <= q.o.length) {
          pickOption(Number(e.key) - 1);
          return;
        }
        if (revealed && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          if (idx < qs.length - 1) { idx++; qStart = Date.now(); renderQ(); }
          else renderResults();
        }
      };
      document.addEventListener("keydown", keyHandler);
    }

    /* swipe gestures (mobile) */
    let touchX = null, touchY = null;
    container.addEventListener("touchstart", e => {
      touchX = e.touches[0].clientX; touchY = e.touches[0].clientY;
    }, { passive: true });
    container.addEventListener("touchend", e => {
      if (touchX == null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      const dy = e.changedTouches[0].clientY - touchY;
      touchX = touchY = null;
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy)) return;
      if (opts.mode === "mock") {
        if (dx < 0 && idx < qs.length - 1) { idx++; render(); }
        else if (dx > 0 && idx > 0) { idx--; render(); }
      } else {
        const a = answers[idx];
        const revealed = a.tries >= 2 || (a.pick !== null && a.correct);
        if (dx < 0 && revealed && idx < qs.length - 1) { idx++; qStart = Date.now(); renderQ(); }
      }
    }, { passive: true });

    /* pace helper */
    function paceChip(secs) {
      const target = Settings.cache.paceTarget || 45;
      const cls = secs <= target ? "good" : secs <= target * 1.6 ? "gold" : "bad";
      const word = secs <= target ? "ahead" : secs <= target * 1.6 ? "on pace" : "over";
      return html`<span class="chip ${cls}">⏱ ${secs}s · ${word}</span>`;
    }

    /* bookmarks */
    function toggleBookmark(ref) {
      const today = U.todayISO();
      if (bookmarks[ref]) delete bookmarks[ref];
      else bookmarks[ref] = today;
      DB.set("kv", "bookmarks", bookmarks);
      U.toast(bookmarks[ref] ? "Bookmarked ⭐" : "Bookmark removed");
    }

    /* ---------------- MOCK MODE ---------------- */
    if (opts.mode === "mock") {
    const picks = new Array(qs.length).fill(null);
    let secondsLeft = 120 * 60;
    let sections = [];
    let reviewFilter = "wrong";

    function buildSections() {
      sections = [];
      qs.forEach((q, i) => {
        let s = sections.find(x => x.name === q.s);
        if (!s) { s = { name: q.s, start: i, count: 0 }; sections.push(s); }
        s.count++;
      });
    }

    function render() {
      const answered = picks.filter(p => p !== null).length;
      const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
      const ss = String(secondsLeft % 60).padStart(2, "0");
      const q = qs[idx];
      const secsUsed = Math.round((Date.now() - qStart) / 1000);
      mount(container, html`<div class="fade-in">
        <div class="q-progress">
          <span class="mock-timer ${secondsLeft < 300 ? "low" : ""}">${mm}:${ss}</span>
          <div class="grow">${bar(100 * (idx + 1) / qs.length)}</div>
          <span class="q-count">${idx + 1}/${qs.length}</span>
        </div>
        <div class="card q-anim">
          <div class="q-subject">${subjectTag(q.s)}<span class="tiny muted" style="margin-left:8px">swipe or use keys 1–4 · F to flag</span></div>
          <p class="q-text">${q.q}</p>
          <div id="mock-opts"></div>
          <div class="btn-row" style="margin-top:12px">
            <button class="btn ghost" id="m-prev" ${idx === 0 ? "disabled" : ""}>‹ Prev</button>
            <button class="btn ghost" id="m-flag">${flagged.has(idx) ? "🚩 Flagged" : "🏳️ Flag"}</button>
            <button class="btn ghost" id="m-next" ${idx === qs.length - 1 ? "disabled" : ""}>Next ›</button>
          </div>
        </div>
        <div class="card">
          <div class="chip-row" style="margin-bottom:10px">
            ${sections.map(s => html`<button class="chip sect ${q.s === s.name ? "info" : ""}" data-s="${s.name}">${s.name} · ${s.count}</button>`)}
          </div>
          <div class="palette" id="palette"></div>
          <div class="chip-row" style="margin:10px 0">
            <span class="chip good">${answered} answered</span>
            <span class="chip gold">${flagged.size} flagged</span>
            <span class="chip">${qs.length - answered} left</span>
          </div>
          <button class="btn primary block big" id="m-submit">Submit mock</button>
        </div>
      </div>`);

      const optsBox = container.querySelector("#mock-opts");
      q.o.forEach((o, oi) => {
        const b = html`<button class="opt ${picks[idx] === oi ? "correct" : ""}">
          <span class="opt-key">${"ABCD"[oi]}</span><span>${o}</span>
        </button>`;
        b.addEventListener("click", () => { picks[idx] = oi; render(); });
        optsBox.appendChild(b);
      });

      const pal = container.querySelector("#palette");
      qs.forEach((_, i) => {
        const cell = html`<button class="pal-cell ${i === idx ? "current" : ""} ${picks[i] !== null ? "answered" : ""} ${flagged.has(i) ? "flagged" : ""}">${i + 1}</button>`;
        cell.addEventListener("click", () => { idx = i; qStart = Date.now(); render(); });
        pal.appendChild(cell);
      });

      container.querySelectorAll(".sect").forEach(b => b.addEventListener("click", () => {
        const s = sections.find(x => x.name === b.getAttribute("data-s"));
        if (s) { idx = s.start; qStart = Date.now(); render(); }
      }));
      container.querySelector("#m-prev").addEventListener("click", () => { if (idx > 0) { idx--; qStart = Date.now(); render(); } });
      container.querySelector("#m-next").addEventListener("click", () => { if (idx < qs.length - 1) { idx++; qStart = Date.now(); render(); } });
      container.querySelector("#m-flag").addEventListener("click", () => {
        if (flagged.has(idx)) flagged.delete(idx); else flagged.add(idx);
        render();
      });
      container.querySelector("#m-submit").addEventListener("click", () => {
        const unanswered = qs.length - answered;
        if (!confirm(unanswered ? unanswered + " question(s) unanswered. Submit anyway?" : "Submit your mock?")) return;
        submitMock();
      });
    }

    function submitMock() {
      if (timerIv) { clearInterval(timerIv); timerIv = null; }
      answers.forEach((a, i) => {
        if (picks[i] !== null) { a.pick = picks[i]; a.correct = picks[i] === qs[i].a; a.tries = 1; }
      });
      renderMockReview();
    }

    /* review-after-submit: every question, your pick vs the answer, with explanations */
    function renderMockReview() {
      const wrongs = answers.filter(a => !a.correct).length;
      function list() {
        return qs.map((q, i) => ({ q, a: answers[i], i }))
          .filter(x => reviewFilter === "all" || (reviewFilter === "wrong" && !x.a.correct) || (reviewFilter === "flagged" && flagged.has(x.i)));
      }
      mount(container, html`<div class="fade-in">
        <div class="topbar"><h1>Mock review</h1>
          <div class="chip-row">
            <button class="chip ${reviewFilter === "wrong" ? "bad" : ""}" data-f="wrong">${wrongs} wrong</button>
            <button class="chip ${reviewFilter === "flagged" ? "gold" : ""}" data-f="flagged">${flagged.size} flagged</button>
            <button class="chip ${reviewFilter === "all" ? "info" : ""}" data-f="all">all ${qs.length}</button>
          </div>
        </div>
        <div id="rev-list">
          ${list().map(x => html`<div class="card">
            <div class="row" style="align-items:flex-start">
              <span class="emo">${x.a.correct ? "✅" : "❌"}</span>
              <div class="grow">
                <div class="sub">${subjectTag(x.q.s)} · Question ${x.i + 1}</div>
                <p class="q-text" style="font-size:14px;margin:6px 0">${x.q.q}</p>
                ${x.q.o.map((o, oi) => html`<div class="review-opt ${oi === x.q.a ? "correct" : x.a.pick === oi ? "wrong" : ""}">
                  <span class="opt-key">${"ABCD"[oi]}</span><span>${o}</span>
                  ${oi === x.a.pick && !x.a.correct ? html`<span class="tiny" style="margin-left:auto;color:var(--bad);font-weight:700">your pick</span>` : ""}
                </div>`)}
                ${x.q.e ? html`<div class="explain">💡 ${x.q.e}</div>` : ""}
              </div>
            </div>
          </div>`)}
        </div>
        <button class="btn primary block big" id="rev-done" style="margin-bottom:40px">Done — save my score</button>
      </div>`);
      container.querySelectorAll("[data-f]").forEach(b => b.addEventListener("click", () => {
        reviewFilter = b.getAttribute("data-f"); renderMockReview();
      }));
      container.querySelector("#rev-done").addEventListener("click", finish);
    }

    timerIv = setInterval(() => {
      secondsLeft--;
      const el = container.querySelector(".mock-timer");
      if (el) {
        const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
        const ss = String(secondsLeft % 60).padStart(2, "0");
        el.textContent = mm + ":" + ss;
      }
      if (secondsLeft <= 0) {
        clearInterval(timerIv); timerIv = null;
        answers.forEach((a, i) => {
          if (picks[i] !== null) { a.pick = picks[i]; a.correct = picks[i] === qs[i].a; a.tries = 1; }
        });
        U.toast("Time's up — auto-submitted. ⏱️");
        renderMockReview();
      }
    }, 1000);

    buildSections();
    attachKeys();
    render();
    return;
  }

  /* ---------------- PRACTICE MODE ---------------- */
  function pickOption(oi) {
    const q = qs[idx];
    const a = answers[idx];
    a.tries++;
    a.pick = oi;
    if (oi === q.a) {
      a.correct = a.tries === 1; // first-try correctness
      a._secs = Math.round((Date.now() - qStart) / 1000);
      paceTotal += a._secs; paceN++;
      renderQ();
    } else if (a.tries >= 2) {
      a.correct = false;
      a._secs = Math.round((Date.now() - qStart) / 1000);
      paceTotal += a._secs; paceN++;
      renderQ(); // reveal
    } else {
      U.toast("Not quite — one more try. 👀", 1600);
      const btns = container.querySelectorAll("#q-body .opt");
      if (btns[oi]) { btns[oi].classList.add("wrong"); btns[oi].disabled = true; }
    }
  }

  function renderQ() {
    const q = qs[idx];
    const a = answers[idx];
    const revealed = a.tries >= 2 || (a.pick !== null && a.correct);
    const bm = a.ref && bookmarks[a.ref];

    mount(container, html`<div class="fade-in">
      <div class="q-progress">
        <span class="q-count">${opts.title || "Quiz"} · ${idx + 1}/${qs.length}</span>
        <div class="grow">${bar(100 * (idx + 1) / qs.length)}</div>
        ${a.ref ? html`<button class="icon-btn bm ${bm ? "on" : ""}" id="bm-btn" title="Bookmark question">${bm ? "⭐" : "☆"}</button>` : ""}
      </div>
      ${paceN ? html`<div class="pace-row tiny muted">pace · ${Math.round(paceTotal / paceN)}s per question so far</div>` : ""}
      <div class="card q-anim">
        <div class="q-subject">${subjectTag(q.s)}</div>
        <p class="q-text">${q.q}</p>
        <div id="q-body"></div>
      </div>
    </div>`);
    const body = container.querySelector("#q-body");
    const bmBtn = container.querySelector("#bm-btn");
    if (bmBtn) bmBtn.addEventListener("click", () => { toggleBookmark(a.ref); renderQ(); });

    /* step 1: confidence tap */
    if (!a.confidence) {
      body.appendChild(html`<p class="small muted" style="margin-bottom:10px">Before you answer — how well do you know this?</p>`);
      const row = html`<div class="confidence-row"></div>`;
      [["sure", "😎 I'm sure"], ["fairly", "🤔 Fairly sure"], ["guessing", "🎲 Guessing"]].forEach(pair => {
        const b = html`<button class="btn ghost">${pair[1]}</button>`;
        b.addEventListener("click", () => { a.confidence = pair[0]; qStart = Date.now(); renderQ(); });
        row.appendChild(b);
      });
      body.appendChild(row);
      return;
    }

    /* step 2: options */
    q.o.forEach((o, oi) => {
      let cls = "";
      if (revealed && oi === q.a) cls = "correct";
      else if (a.pick === oi && !a.correct) cls = "wrong";
      const b = html`<button class="opt ${cls}" ${revealed ? "disabled" : ""}>
        <span class="opt-key">${"ABCD"[oi]}</span><span>${o}</span>
      </button>`;
      b.addEventListener("click", () => pickOption(oi));
      body.appendChild(b);
    });

    /* step 3: explanation + pace + next */
    if (revealed) {
      if (q.e) body.appendChild(html`<div class="explain">💡 ${q.e}</div>`);
      const row = html`<div class="btn-row" style="margin-top:12px;align-items:center">${paceChip(a._secs || 0)}</div>`;
      const btn = html`<button class="btn primary block big" style="margin-top:10px">${idx < qs.length - 1 ? "Next question" : "See results"}</button>`;
      btn.addEventListener("click", () => {
        if (idx < qs.length - 1) { idx++; qStart = Date.now(); renderQ(); }
        else renderResults();
      });
      body.appendChild(row);
      body.appendChild(btn);
    }
  }

  function renderResults() {
    const total = qs.length;
    const firstTry = answers.filter(x => x.correct).length;
    const pct = total ? Math.round(100 * firstTry / total) : 0;
    const subj = {}, subjN = {};
    answers.forEach(x => {
      if (!x.s) return;
      subj[x.s] = (subj[x.s] || 0) + (x.correct ? 1 : 0);
      subjN[x.s] = (subjN[x.s] || 0) + 1;
    });
    const wrongs = answers.filter(x => !x.correct);
    const avgPace = paceN ? Math.round(paceTotal / paceN) : null;

    mount(container, html`<div class="fade-in">
      <div class="card result-hero">
        <div class="result-pct" style="color:${pct >= 85 ? "var(--good)" : pct >= 60 ? "var(--gold)" : "var(--bad)"}">${pct}%</div>
        <p class="small muted" style="margin-top:4px">${firstTry}/${total} clean first tries${avgPace ? " · " + avgPace + "s per question" : ""}</p>
        <div style="display:flex;justify-content:center;margin-top:12px">${ring(pct, U.fmtPct(pct), "score")}</div>
        <div class="chip-row" style="justify-content:center;margin-top:12px">
          ${Object.keys(subj).map(s => html`<span class="chip ${100 * subj[s] / subjN[s] >= 85 ? "good" : 100 * subj[s] / subjN[s] >= 60 ? "gold" : "bad"}">${s} ${Math.round(100 * subj[s] / subjN[s])}%</span>`)}
        </div>
        ${pct < 60 && opts.kind !== "review" ? html`<p class="small" style="margin-top:12px;color:var(--bad);font-weight:700">🔒 Below 60% — this session goes back into review. Don't move on.</p>` : ""}
      </div>
      ${wrongs.length ? html`<div class="card">
        <h3>Tag your misses <span class="muted tiny" style="font-weight:600">· builds your Mistake Vault</span></h3>
        <div id="tag-list"></div>
        ${AI.hasKey() ? html`<button class="btn ghost block" id="autopsy-btn" style="margin-top:12px">🧠 AI autopsy: why were these tempting?</button><div id="autopsy-out"></div>` : ""}
      </div>` : html`<div class="card center"><p class="small" style="color:var(--good);font-weight:700">Flawless. Every question clean. 🏆</p></div>`}
      <button class="btn primary block big" id="finish-btn" style="margin-bottom:40px">Done</button>
    </div>`);

    const tagList = container.querySelector("#tag-list");
    const TAGS = ["Concept gap", "Formula missing", "Vocabulary gap", "Misread", "Careless", "Ran out of time"];
    wrongs.forEach(x => {
      const row = html`<div class="row">
        <div class="grow"><div class="title">${x.q.slice(0, 70)}</div><div class="sub">${x.s}</div></div>
        <select class="tag-select">
          ${TAGS.map(t => html`<option ${x.mistakeTag === t ? "selected" : ""}>${t}</option>`)}
        </select>
      </div>`;
      row.querySelector("select").addEventListener("change", e => { x.mistakeTag = e.target.value; });
      tagList.appendChild(row);
    });

    const autopsyBtn = container.querySelector("#autopsy-btn");
    if (autopsyBtn) autopsyBtn.addEventListener("click", async () => {
      const out = container.querySelector("#autopsy-out");
      autopsyBtn.disabled = true; autopsyBtn.textContent = "🧠 Thinking…";
      const target = wrongs.filter(x => x.pick != null && x.pick !== qs[answers.indexOf(x)].a).slice(0, 3);
      for (const x of target) {
        const q = qs[answers.indexOf(x)];
        try {
          const au = await AI.autopsy(q.q, q.s, q.o, q.a, x.pick);
          out.appendChild(html`<div class="explain" style="margin-top:8px">
            <b>Why "${(q.o[x.pick] || "").slice(0, 40)}" tempts:</b> ${au.why || "—"}<br/><b>The rule:</b> ${au.rule || "—"}</div>`);
        } catch (e) {
          U.toast(AI.friendlyError(e), 3600);
          break;
        }
      }
      autopsyBtn.style.display = "none";
    });

    container.querySelector("#finish-btn").addEventListener("click", finish);
  }

  /* preload bookmarks, then start (practice mode) */
  DB.get("kv", "bookmarks").then(bm => {
    bookmarks = bm || {};
    renderQ();
    attachKeys();
  });
  });
}

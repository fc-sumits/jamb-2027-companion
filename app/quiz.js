/* ============================================================
   Sturdy quiz player — practice (confidence + retry) and mock CBT
   ============================================================ */
"use strict";

/* runQuiz(container, opts) -> Promise<result>
   opts: { title, questions, mode: 'practice'|'mock', kind, week, dayId }
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

    document.body.classList.add("in-quiz");

    function cleanup() {
      if (timerIv) clearInterval(timerIv);
      document.body.classList.remove("in-quiz");
    }

    function finish() {
      cleanup();
      const total = qs.length;
      const firstTry = answers.filter(a => a.correct).length;
      const result = {
        kind: opts.kind || "daily",
        week: opts.week, dayId: opts.dayId,
        pct: total ? Math.round(100 * firstTry / total) : 0,
        total, firstTryCorrect: firstTry,
        answers
      };
      resolve(result);
    }

    /* ---------------- MOCK MODE ---------------- */
    if (opts.mode === "mock") {
      const picks = new Array(qs.length).fill(null);
      let secondsLeft = 120 * 60;

      function render() {
        const answered = picks.filter(p => p !== null).length;
        const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
        const ss = String(secondsLeft % 60).padStart(2, "0");
        const q = qs[idx];
        mount(container, html`<div class="fade-in">
          <div class="q-progress">
            <span class="mock-timer">${mm}:${ss}</span>
            <div class="grow">${bar(100 * (idx + 1) / qs.length)}</div>
            <span class="q-count">${idx + 1}/${qs.length}</span>
          </div>
          <div class="card">
            <div class="q-subject">${subjectTag(q.s)}</div>
            <p class="q-text">${q.q}</p>
            <div id="mock-opts"></div>
            <div class="btn-row" style="margin-top:12px">
              <button class="btn ghost" id="m-prev">‹ Prev</button>
              <button class="btn ghost" id="m-flag">${flagged.has(idx) ? "🚩 Flagged" : "🏳️ Flag"}</button>
              <button class="btn ghost" id="m-next">Next ›</button>
            </div>
          </div>
          <div class="card">
            <div class="palette" id="palette"></div>
            <div class="chip-row" style="margin-bottom:10px">
              <span class="chip good">${answered} answered</span>
              <span class="chip gold">${flagged.size} flagged</span>
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
          cell.addEventListener("click", () => { idx = i; render(); });
          pal.appendChild(cell);
        });

        container.querySelector("#m-prev").addEventListener("click", () => { if (idx > 0) { idx--; render(); } });
        container.querySelector("#m-next").addEventListener("click", () => { if (idx < qs.length - 1) { idx++; render(); } });
        container.querySelector("#m-flag").addEventListener("click", () => {
          if (flagged.has(idx)) flagged.delete(idx); else flagged.add(idx);
          render();
        });
        container.querySelector("#m-submit").addEventListener("click", () => {
          const unanswered = qs.length - answered;
          if (!confirm(unanswered ? unanswered + " question(s) unanswered. Submit anyway?" : "Submit your mock?")) return;
          answers.forEach((a, i) => {
            if (picks[i] !== null) { a.pick = picks[i]; a.correct = picks[i] === qs[i].a; a.tries = 1; }
          });
          finish();
        });
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
          answers.forEach((a, i) => {
            if (picks[i] !== null) { a.pick = picks[i]; a.correct = picks[i] === qs[i].a; a.tries = 1; }
          });
          U.toast("Time's up — auto-submitted. ⏱️");
          finish();
        }
      }, 1000);

      render();
      return;
    }

    /* ---------------- PRACTICE MODE ---------------- */
    function renderQ() {
      const q = qs[idx];
      const a = answers[idx];
      const revealed = a.tries >= 2 || (a.pick !== null && a.correct);

      mount(container, html`<div class="fade-in">
        <div class="q-progress">
          <span class="q-count">${opts.title || "Quiz"} · ${idx + 1}/${qs.length}</span>
          <div class="grow">${bar(100 * (idx + 1) / qs.length)}</div>
        </div>
        <div class="card">
          <div class="q-subject">${subjectTag(q.s)}</div>
          <p class="q-text">${q.q}</p>
          <div id="q-body"></div>
        </div>
      </div>`);
      const body = container.querySelector("#q-body");

      /* step 1: confidence tap */
      if (!a.confidence) {
        body.appendChild(html`<p class="small muted" style="margin-bottom:10px">Before you answer — how well do you know this?</p>`);
        const row = html`<div class="confidence-row"></div>`;
        [["sure", "😎 I'm sure"], ["fairly", "🤔 Fairly sure"], ["guessing", "🎲 Guessing"]].forEach(pair => {
          const b = html`<button class="btn ghost">${pair[1]}</button>`;
          b.addEventListener("click", () => { a.confidence = pair[0]; renderQ(); });
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
        b.addEventListener("click", () => {
          a.tries++;
          a.pick = oi;
          if (oi === q.a) {
            a.correct = a.tries === 1; // first-try correctness
            renderQ();
          } else if (a.tries >= 2) {
            a.correct = false;
            renderQ(); // reveal
          } else {
            U.toast("Not quite — one more try. 👀", 1600);
            b.classList.add("wrong");
            b.disabled = true;
          }
        });
        body.appendChild(b);
      });

      /* step 3: explanation + next */
      if (revealed) {
        if (q.e) body.appendChild(html`<div class="explain">💡 ${q.e}</div>`);
        const btn = html`<button class="btn primary block big" style="margin-top:12px">${idx < qs.length - 1 ? "Next question" : "See results"}</button>`;
        btn.addEventListener("click", () => {
          if (idx < qs.length - 1) { idx++; renderQ(); }
          else renderResults();
        });
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

      mount(container, html`<div class="fade-in">
        <div class="card result-hero">
          <div class="result-pct" style="color:${pct >= 85 ? "var(--good)" : pct >= 60 ? "var(--gold)" : "var(--bad)"}">${pct}%</div>
          <p class="small muted" style="margin-top:4px">${firstTry}/${total} clean first tries</p>
          <div style="display:flex;justify-content:center;margin-top:12px">${ring(pct, U.fmtPct(pct), "score")}</div>
          <div class="chip-row" style="justify-content:center;margin-top:12px">
            ${Object.keys(subj).map(s => html`<span class="chip ${100 * subj[s] / subjN[s] >= 85 ? "good" : 100 * subj[s] / subjN[s] >= 60 ? "gold" : "bad"}">${s} ${Math.round(100 * subj[s] / subjN[s])}%</span>`)}
          </div>
          ${pct < 60 && opts.kind !== "review" ? html`<p class="small" style="margin-top:12px;color:var(--bad);font-weight:700">🔒 Below 60% — this session goes back into review. Don't move on.</p>` : ""}
        </div>
        ${wrongs.length ? html`<div class="card">
          <h3>Tag your misses <span class="muted tiny" style="font-weight:600">· builds your Mistake Vault</span></h3>
          <div id="tag-list"></div>
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

      container.querySelector("#finish-btn").addEventListener("click", finish);
    }

    renderQ();
  });
}
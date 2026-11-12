/* ============================================================
   Sturdy — App shell: routing, nav, session launcher, ambushes, boot
   ============================================================ */
"use strict";

const App = {
  view: null,
  routes: {
    today: { render: renderToday, icon: "home", label: "Today" },
    calendar: { render: renderCalendar, icon: "cal", label: "Calendar" },
    study: { render: renderStudy, icon: "grid", label: "Study" },
    review: { render: renderReview, icon: "repeat", label: "Review" },
    stats: { render: renderStats, icon: "chart", label: "Stats" },
    more: { render: renderMore, icon: "grid", label: "More" },
    lesson: { render: renderLesson, icon: "grid", label: "Lesson", hidden: true },
    recall: { render: renderRecall, icon: "repeat", label: "Recall", hidden: true },
    cards: { render: renderCards, icon: "repeat", label: "Flashcards", hidden: true },
    vault: { render: renderVault, icon: "shield", label: "Vault", hidden: true },
    kits: { render: renderKits, icon: "shield", label: "Repair kits", hidden: true },
    syllabus: { render: renderSyllabus, icon: "grid", label: "Syllabus", hidden: true },
    final72: { render: renderFinal72, icon: "flame", label: "Final 72h", hidden: true },
    mock: { render: renderMockSetup, icon: "play", label: "Mock", hidden: true },
    settings: { render: renderSettings, icon: "gear", label: "Settings", hidden: true }
  },

  nav(route) {
    location.hash = "#/" + route;
  },

  async render() {
    const route = (location.hash || "#/today").replace("#/", "") || "today";
    const r = this.routes[route] || this.routes.today;
    this.view = document.getElementById("app");
    document.body.classList.toggle("in-quiz", false);
    await r.render(this.view);
    this.renderNav(route);
    if (route === "today") maybeAmbush();
  },

  renderNav(active) {
    let nav = document.getElementById("bottom-nav");
    if (!nav) {
      nav = document.createElement("nav");
      nav.id = "bottom-nav";
      document.body.appendChild(nav);
    }
    nav.innerHTML = "";
    Object.keys(this.routes).filter(k => !this.routes[k].hidden).forEach(k => {
      const r = this.routes[k];
      const b = html`<button class="nav-btn ${k === active ? "active" : ""}">
        ${icon(r.icon)}<span>${r.label}</span>
      </button>`;
      b.addEventListener("click", () => this.nav(k));
      nav.appendChild(b);
    });
  },

  async launchSession(session) {
    // attach ref strings so results can map back to the bank
    let questions = session.questions;
    if (session.type === "mockday") {
      questions = Bank.buildMock();
    }
    const qs = questions.map(q => Object.assign({}, q));
    if (session.type === "daily") {
      qs.forEach((q, i) => { q.ref = "w" + session.week + ":" + session.dayId + ":" + i; });
    } else if (session.type === "grand") {
      qs.forEach((q, i) => { q.ref = "w" + session.week + ":grand:" + i; });
    }
    const result = await runQuiz(this.view, {
      title: session.label || session.title || "Session",
      questions: qs,
      mode: session.mode || (session.type === "mockday" ? "mock" : "practice"),
      kind: session.type === "mockday" ? "mock" : (session.type || session.kind || "daily"),
      week: session.week,
      dayId: session.dayId,
      mockDate: session.mockDate || null
    });
    if (!result) { this.render(); return; }

    // Don't-Move-On lock
    if (result.kind !== "mock" && result.pct < 60) {
      U.toast("Below 60% — this one isn't done with you. It's back in review. 🔒", 4200);
    }

    // spaced repetition: wrong or guessed -> review card
    if (result.kind !== "mock") {
      const cards = await State.cards();
      const known = {};
      cards.forEach(c => { known[c.ref] = c; });
      for (const a of result.answers) {
        if (!a.ref) continue;
        if (!a.correct || a.confidence === "guessing") {
          const card = known[a.ref] || { ref: a.ref, ease: 2.5, interval: 0, reps: 0, due: U.todayISO(), lapses: 0 };
          await DB.put("cards", SRS.next(card, !a.correct ? 0 : 1, Settings.cache.retention));
        }
      }
    }

    await recordSession(result);
    State.invalidate();

    if (result.kind === "mock") {
      this.nav("stats");
    } else {
      this.nav("today");
    }
  }
};

/* ---------- Pop-up ambushes (adaptive) ----------
   Questions are weighted toward cards closest to forgetting
   (lowest FSRS retrievability). Surviving 3/3 twice in a row
   escalates the count and pulls harder.
   Learned-pool rule: once you have checked subtopics in the
   Study tab, ambushes only strike from studied material. */
let lastAmbush = 0;

async function ambushLevel() {
  const st = (await DB.get("kv", "ambushStats")) || { streak3: 0 };
  return Math.min(2, Math.floor((st.streak3 || 0) / 2)); // 0, 1 or 2
}

function maybeAmbush() {
  const mode = Settings.cache.ambush;
  if (!mode || mode === "off") return;
  const prob = mode === "chill" ? 0.15 : mode === "normal" ? 0.35 : 0.6;
  if (Math.random() > prob) return;
  if (Date.now() - lastAmbush < 8 * 60 * 1000) return;
  lastAmbush = Date.now();
  setTimeout(showAmbush, 90 * 1000); // strikes ~90s after opening Today
}

async function showAmbush() {
  if (document.body.classList.contains("in-quiz")) return;
  const level = await ambushLevel();
  const count = 3 + level; // 3 → 4 → 5 as you prove yourself
  /* weight toward cards closest to forgetting */
  const cards = await State.cards();
  const cardMap = {};
  cards.forEach(c => { cardMap[c.ref] = c; });
  let pool = Bank.ambushPool();
  if (!pool.length) return;
  /* learned-pool restriction: only ambush what has been studied */
  try {
    const skeys = await Study.studiedKeys();
    if (skeys.length) {
      const filtered = pool.filter(q => Study.matchQ(q, skeys));
      if (filtered.length >= 12) pool = filtered;
    }
  } catch (e) { /* study module not ready — keep full pool */ }
  const scored = pool.map(q => ({
    q,
    w: cardMap[q.ref] ? 1 - SRS.retrievability(cardMap[q.ref]) : 0.5 + Math.random() * 0.25
  }));
  scored.sort((a, b) => b.w - a.w);
  const qs = scored.slice(0, Math.min(count, 14)).map(x => x.q);
  let i = 0, correct = 0;
  const overlay = html`<div class="ambush-overlay">
    <div class="card ambush-card">
      <span class="chip gold">⚡ Ambush${level ? " · level " + (level + 1) : ""}</span>
      <div id="amb-body" style="margin-top:12px"></div>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  const body = overlay.querySelector("#amb-body");

  function showQ() {
    if (i >= qs.length) { finish(); return; }
    const q = qs[i];
    const chip = overlay.querySelector(".chip");
    if (chip) chip.textContent = "⚡ Ambush · " + (i + 1) + "/" + qs.length;
    body.innerHTML = "";
    const block = html`<div>
      <p class="q-text">${q.q}</p>
      ${q.o.map((o, oi) => html`<button class="opt" data-i="${oi}"><span class="opt-key">${"ABCD"[oi]}</span><span>${o}</span></button>`)}
      <div class="ambush-timer"><div id="amb-bar"></div></div>
    </div>`;
    body.appendChild(block);
    let t = 60;
    const bar2 = block.querySelector("#amb-bar");
    const iv = setInterval(() => {
      t--;
      bar2.style.width = (t / 60 * 100) + "%";
      if (t <= 0) { clearInterval(iv); reveal(-1); }
    }, 1000);
    block.querySelectorAll(".opt").forEach(b => b.addEventListener("click", () => {
      clearInterval(iv); reveal(Number(b.getAttribute("data-i")));
    }));
    function reveal(pick) {
      block.querySelectorAll(".opt").forEach((b, oi) => {
        b.disabled = true;
        if (oi === q.a) b.classList.add("correct");
        else if (oi === pick) b.classList.add("wrong");
      });
      if (pick === q.a) correct++;
      setTimeout(() => { i++; showQ(); }, 1100);
    }
  }

  async function finish() {
    overlay.remove();
    U.toast(correct === qs.length ? "Ambush survived. " + correct + "/" + qs.length + " ⚡" : "Ambush: " + correct + "/" + qs.length + " — misses go to review.", 3600);
    // adaptive difficulty stat + daily log only (ambushes never pollute the Vault)
    const st = (await DB.get("kv", "ambushStats")) || { hits: 0, seen: 0, streak3: 0 };
    st.hits += correct;
    st.seen += qs.length;
    st.streak3 = correct === qs.length ? (st.streak3 || 0) + 1 : 0;
    await DB.set("kv", "ambushStats", st);
    const logKey = "log:" + U.todayISO();
    const log = (await DB.get("kv", logKey)) || { answered: 0, correct: 0, xp: 0, slept: false, braindump: "" };
    log.answered = (log.answered || 0) + qs.length;
    log.correct = (log.correct || 0) + correct;
    log.xp = (log.xp || 0) + correct * 5;
    await DB.set("kv", logKey, log);
    if (correct < qs.length) {
      for (const q of qs) {
        const ref = q.ref || ("ambush:" + U.todayISO() + ":" + qs.indexOf(q));
        const card = (await DB.get("cards", ref)) || { ref, ease: 2.5, interval: 0, reps: 0, due: U.todayISO(), lapses: 0 };
        await DB.put("cards", SRS.next(card, 1, Settings.cache.retention));
      }
    }
    State.invalidate();
  }

  showQ();
}

/* ---------- Boot ---------- */
async function boot() {
  await Settings.load();
  document.documentElement.setAttribute("data-theme", Settings.cache.theme);

  // prefill the curated Biology playlists once (user can still edit in Settings)
  try {
    const yt = Settings.cache.ytPlaylists || {};
    if (!yt.Biology) {
      const bio = "PL11XVymvna4LBiFISDoynUF4SclrMuEny,PLB0IxFe_OTeNVy1HW7FCM61YPk_ps0_4C,PL7BYUWfV903V4Ww-AbFekSWoio8mwJKZ9";
      Settings.cache.ytPlaylists = Object.assign({}, yt, { Biology: bio });
      if (typeof Settings.save === "function") await Settings.save({ ytPlaylists: Settings.cache.ytPlaylists });
      else await DB.set("kv", "settings", Settings.cache);
    }
  } catch (e) { /* non-fatal */ }

  window.addEventListener("hashchange", () => App.render());
  await App.render();

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    try { navigator.serviceWorker.register("sw.js"); } catch (e) { /* offline still works via cache */ }
  }

  // capture the PWA install prompt for the Settings install button
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    window._sturdyInstallEvent = e;
  });
}

document.addEventListener("DOMContentLoaded", boot);

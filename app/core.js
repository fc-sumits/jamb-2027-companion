/* ============================================================
   Sturdy core — utils, storage, settings, bank, programme, SRS
   Zero-build vanilla JS. No dependencies.
   ============================================================ */
"use strict";

/* ---------- Utils ---------- */
const U = {
  toISO(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  },
  isoToDate(iso) {
    const p = iso.split("-").map(Number);
    return new Date(p[0], p[1] - 1, p[2]);
  },
  todayISO() { return U.toISO(new Date()); },
  addDays(iso, n) { const d = U.isoToDate(iso); d.setDate(d.getDate() + n); return U.toISO(d); },
  daysBetween(a, b) {
    return Math.round((U.isoToDate(b) - U.isoToDate(a)) / 86400000);
  },
  examDate() { return "2027-03-15"; },
  daysToExam() { return Math.max(0, U.daysBetween(U.todayISO(), U.examDate())); },
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },
  fmtPct(x) { return Math.round(x) + "%"; },
  clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); },
  toast(msg, ms) {
    let t = document.getElementById("toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(U._toastT);
    U._toastT = setTimeout(() => t.classList.remove("show"), ms || 2600);
  },
  MON: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
};

/* ---------- IndexedDB ---------- */
const DB = {
  _db: null,
  open() {
    if (DB._db) return Promise.resolve(DB._db);
    return new Promise((res, rej) => {
      const req = indexedDB.open("sturdy", 2);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv", { keyPath: "k" });
        if (!db.objectStoreNames.contains("cards")) db.createObjectStore("cards", { keyPath: "ref" });
        if (!db.objectStoreNames.contains("mistakes")) db.createObjectStore("mistakes", { keyPath: "id" });
        if (!db.objectStoreNames.contains("sessions")) db.createObjectStore("sessions", { keyPath: "id" });
        if (!db.objectStoreNames.contains("attempts")) db.createObjectStore("attempts", { keyPath: "id" });
        if (!db.objectStoreNames.contains("ai")) db.createObjectStore("ai", { keyPath: "id" });
        if (!db.objectStoreNames.contains("yt")) db.createObjectStore("yt", { keyPath: "id" });
      };
      req.onsuccess = () => { DB._db = req.result; res(DB._db); };
      req.onerror = () => rej(req.error);
    });
  },
  _tx(store, mode) {
    return DB.open().then(db => db.transaction(store, mode).objectStore(store));
  },
  get(store, key) {
    return DB._tx(store, "readonly").then(s => new Promise((res, rej) => {
      const r = s.get(key);
      r.onsuccess = () => res(store === "kv" ? (r.result ? r.result.v : null) : r.result);
      r.onerror = () => rej(r.error);
    }));
  },
  set(store, key, val) {
    return DB._tx(store, "readwrite").then(s => new Promise((res, rej) => {
      const r = s.put({ k: key, v: val });
      r.onsuccess = () => res(true);
      r.onerror = () => rej(r.error);
    }));
  },
  put(store, val) {
    return DB._tx(store, "readwrite").then(s => new Promise((res, rej) => {
      const r = s.put(val);
      r.onsuccess = () => res(true);
      r.onerror = () => rej(r.error);
    }));
  },
  getAll(store) {
    return DB._tx(store, "readonly").then(s => new Promise((res, rej) => {
      const r = s.getAll();
      r.onsuccess = () => res(r.result || []);
      r.onerror = () => rej(r.error);
    }));
  },
  clear(store) {
    return DB._tx(store, "readwrite").then(s => new Promise((res, rej) => {
      const r = s.clear();
      r.onsuccess = () => res(true);
      r.onerror = () => rej(r.error);
    }));
  }
};

/* ---------- Settings ---------- */
const Settings = {
  cache: null,
  defaults: {
    theme: "dark",
    programmeStart: "2026-11-11",
    ambush: "normal",
    retention: 0.85,
    paceTarget: 45, /* seconds per practice question */
    ytPlaylists: { Physics: "", Chemistry: "", Biology: "", English: "" },
    groqKey: "",
    ytKey: "",
    onboarded: false
  },
  async load() {
    const saved = (await DB.get("kv", "settings")) || {};
    Settings.cache = Object.assign({}, Settings.defaults, saved);
    document.documentElement.setAttribute("data-theme", Settings.cache.theme);
    try { localStorage.setItem("sturdy.theme", Settings.cache.theme); } catch (e) {}
    return Settings.cache;
  },
  async save(patch) {
    Settings.cache = Object.assign({}, Settings.cache, patch);
    await DB.set("kv", "settings", Settings.cache);
    if (patch.theme) {
      document.documentElement.setAttribute("data-theme", patch.theme);
      try { localStorage.setItem("sturdy.theme", patch.theme); } catch (e) {}
    }
    return Settings.cache;
  }
};

/* ---------- Question bank ---------- */
const Bank = {
  _daily: null, _grand: null, _pool: null,
  weeks() { return window.WEEK_DATA || {}; },
  allDaily() {
    if (Bank._daily) return Bank._daily;
    const out = [];
    const weeks = Bank.weeks();
    Object.keys(weeks).forEach(w => {
      weeks[w].daily.forEach((d, di) => {
        d.questions.forEach((q, qi) => {
          out.push(Object.assign({ week: Number(w), dayIndex: di, dayId: d.id, dayLabel: d.day, qIndex: qi, ref: "w" + w + ":" + d.id + ":" + qi }, q));
        });
      });
    });
    Bank._daily = out;
    return out;
  },
  allGrand() {
    if (Bank._grand) return Bank._grand;
    const out = [];
    const weeks = Bank.weeks();
    Object.keys(weeks).forEach(w => {
      if (weeks[w].grand) {
        weeks[w].grand.questions.forEach((q, qi) => {
          out.push(Object.assign({ week: Number(w), grand: true, qIndex: qi, ref: "w" + w + ":grand:" + qi }, q));
        });
      }
    });
    Bank._grand = out;
    return out;
  },
  byRef(ref) {
    return Bank.allDaily().find(q => q.ref === ref) || Bank.allGrand().find(q => q.ref === ref) || null;
  },
  /* fact-like pool for ambushes: short factual stems. With a count, returns a random sample. */
  ambushPool(count) {
    if (!Bank._pool) {
      Bank._pool = Bank.allDaily().filter(q =>
        (q.s === "English" || q.s === "Biology" || q.s === "Chemistry") &&
        q.q.length < 130 && q.o.every(o => o.length < 46)
      );
    }
    if (!count) return Bank._pool;
    return U.shuffle(Bank._pool.slice()).slice(0, count).map(q => Object.assign({}, q, { ref: q.ref }));
  },
  /* Full CBT mock: 180 questions sampled like the real UTME (Eng 60, Phys 40, Chem 40, Bio 40) */
  buildMock() {
    const pick = (subject, n) =>
      U.shuffle(Bank.allDaily().filter(q => q.s === subject)).slice(0, n);
    return [].concat(
      pick("English", 60),
      pick("Physics", 40),
      pick("Chemistry", 40),
      pick("Biology", 40)
    );
  }
};

/* ---------- Calendar-accurate programme ----------
   Real dates, not progress. From the programme start date:
   - each weekday (Mon-Fri) carries the next daily quiz in order (60 total)
   - Saturday carries the Grand quiz of the week just completed, once
   - Sunday (and everything after the bank) rests
   Miss a day and it shows as catch-up; the calendar itself never shifts. */
const Prog = {
  _sched: null, _schedStart: null,
  schedule() {
    const start = Settings.cache.programmeStart;
    if (Prog._sched && Prog._schedStart === start) return Prog._sched;
    const weeks = Bank.weeks();
    const out = [];
    let dailyIdx = 0;
    const grandPlaced = {};
    let date = start;
    const end = U.addDays(U.examDate(), 7);
    /* February revision: full CBT mocks on these Saturdays */
    const MOCK_DAYS = ["2027-02-13", "2027-02-20", "2027-02-27", "2027-03-06", "2027-03-13"];
    while (date <= end) {
      const dow = U.isoToDate(date).getDay(); // 0 Sun .. 6 Sat
      if (date === U.examDate()) {
        out.push({ type: "exam", date, label: "JAMB UTME · exam day" });
      } else if (dow === 0) {
        out.push({ type: "rest", date, label: "Rest day" });
      } else if (dow === 6) {
        const wk = Math.floor(dailyIdx / 5);
        if (wk >= 1 && wk <= 12 && weeks[wk] && weeks[wk].grand && !grandPlaced[wk]) {
          grandPlaced[wk] = true;
          out.push({ type: "grand", date, week: wk, grand: weeks[wk].grand, label: "Week " + wk + " · Grand Quiz" });
        } else if (MOCK_DAYS.indexOf(date) !== -1) {
          out.push({ type: "mockday", date, label: "Full Mock · CBT simulation" });
        } else {
          out.push({ type: "rest", date, label: "Rest day" });
        }
      } else {
        const wk = Math.floor(dailyIdx / 5) + 1;
        if (dailyIdx < 60 && weeks[wk] && weeks[wk].daily[dailyIdx % 5]) {
          const d = weeks[wk].daily[dailyIdx % 5];
          out.push({ type: "daily", date, week: wk, dayId: d.id, day: d, label: "Week " + wk + " · Day " + (dailyIdx % 5 + 1) });
          dailyIdx++;
        } else {
          out.push({ type: "rest", date, label: "Rest day" });
        }
      }
      date = U.addDays(date, 1);
    }
    Prog._sched = out;
    Prog._schedStart = start;
    return out;
  },
  totalDays() { return 60; },

  todayMission(doneMap) {
    const today = U.todayISO();
    const sched = Prog.schedule();
    const weeks = Bank.weeks();
    const weekStarted = wk => {
      // a Grand quiz becomes due once at least one daily of that week is done
      for (let i = 0; i < 5; i++) {
        const d = weeks[wk] && weeks[wk].daily[i];
        if (d && doneMap["w" + wk + ":" + d.id]) return true;
      }
      return false;
    };
    const todays = [], overdue = [];
    sched.forEach(s => {
      if (s.type === "rest" || s.type === "exam") return;
      const key = s.type === "daily" ? "w" + s.week + ":" + s.dayId
        : s.type === "grand" ? "w" + s.week + ":grand"
        : "mockday:" + s.date;
      if (doneMap[key]) return;
      if (s.type === "grand" && !weekStarted(s.week)) return;
      if (s.date === today) todays.push(s);
      else if (s.date < today) overdue.push(s);
    });
    return { todays, overdue };
  }
};

/* ---------- Spaced repetition: FSRS (exam-paced) ----------
   Full FSRS-4.5 scheduler with per-card stability (s) and
   difficulty (d). Cards saved by v1 (SM-2: ease/interval) are
   migrated on their next review. Intervals stay capped relative
   to the days left before 15 March 2027. */
const SRS = {
  W: [0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755],
  DECAY: -0.5,
  FACTOR: 19 / 81,

  /* migrate a legacy SM-2 card (ease/interval) to FSRS fields */
  normalize(card) {
    const c = Object.assign({}, card);
    if (c.s == null) c.s = Math.max(0.5, c.interval || 3);
    if (c.d == null) c.d = U.clamp(11 - (c.ease || 2.5) * 2.4, 1, 10);
    if (c.last == null) c.last = c.due || U.todayISO();
    return c;
  },

  retrievability(card, whenISO) {
    const c = SRS.normalize(card);
    const t = Math.max(0, U.daysBetween(c.last, whenISO || U.todayISO()));
    return Math.pow(1 + SRS.FACTOR * t / c.s, SRS.DECAY);
  },

  initStability(g) { return SRS.W[g - 1]; },
  initDifficulty(g) { return U.clamp(SRS.W[4] - (g - 3) * SRS.W[5], 1, 10); },

  nextDifficulty(d, g) {
    let dn = d - SRS.W[6] * (g - 3);
    dn = SRS.W[7] * SRS.initDifficulty(4) + (1 - SRS.W[7]) * dn;
    return U.clamp(dn, 1, 10);
  },

  nextRecallStability(s, d, r, g) {
    const hardPenalty = g === 2 ? SRS.W[15] : 1;
    const easyBonus = g === 4 ? SRS.W[16] : 1;
    return s * (1 + Math.exp(SRS.W[8]) * (11 - d) * Math.pow(s, -SRS.W[9]) *
      (Math.exp((1 - r) * SRS.W[10]) - 1) * hardPenalty * easyBonus);
  },

  nextForgetStability(s, d, r) {
    return SRS.W[11] * Math.pow(d, -SRS.W[12]) * (Math.pow(s + 1, SRS.W[13]) - 1) * Math.exp((1 - r) * SRS.W[14]);
  },

  intervalFor(stability, retention) {
    const r = U.clamp(retention || 0.85, 0.7, 0.99);
    return Math.max(1, Math.round((stability / SRS.FACTOR) * (Math.pow(r, 1 / SRS.DECAY) - 1)));
  },

  /* grade: 0 lapse · 1 hard · 2 good · 3 easy (FSRS G = grade+1) */
  next(card, grade, retention) {
    const today = U.todayISO();
    const c = SRS.normalize(card);
    const g = U.clamp(grade, 0, 3) + 1;
    const r = SRS.retrievability(c, today);
    c.reps = (c.reps || 0) + 1;

    if (c.reps === 1) {
      /* first review of a brand-new card: FSRS initial state */
      c.s = SRS.initStability(g);
      c.d = SRS.initDifficulty(g);
      if (g === 1) c.lapses = (c.lapses || 0) + 1;
    } else if (g === 1) {
      /* lapse: stability drops via the forget curve */
      c.s = SRS.nextForgetStability(c.s, c.d, r);
      c.d = SRS.nextDifficulty(c.d, 1);
      c.lapses = (c.lapses || 0) + 1;
      c.interval = 1;
    } else {
      /* successful recall */
      c.s = SRS.nextRecallStability(c.s, c.d, r, g);
      c.d = SRS.nextDifficulty(c.d, g);
      c.interval = SRS.intervalFor(c.s, retention);
      /* exam pacing: never schedule further than ~15% of remaining days */
      const cap = Math.max(1, Math.floor(U.daysToExam() * 0.15));
      c.interval = U.clamp(c.interval, 1, cap);
    }

    c.s = Math.round(c.s * 100) / 100;
    c.d = Math.round(c.d * 100) / 100;
    c.last = today;
    c.due = U.addDays(today, Math.max(1, g === 1 ? 1 : c.interval));
    return c;
  },

  dueCards(cards) {
    const today = U.todayISO();
    return cards.filter(c => c.due <= today).sort((a, b) => a.due < b.due ? -1 : 1);
  },

  /* cards sorted by how close to forgetting (lowest retrievability first) */
  fadingCards(cards) {
    const today = U.todayISO();
    return cards.slice().sort((a, b) => SRS.retrievability(a, today) - SRS.retrievability(b, today));
  }
};

/* ---------- Cached state ---------- */
const State = {
  _doneMap: null, _cards: null, _sessions: null, _mistakes: null,
  invalidate() {
    State._doneMap = State._cards = State._sessions = State._mistakes = null;
  },
  async doneMap() {
    if (State._doneMap) return State._doneMap;
    const kvs = await DB.getAll("kv");
    const map = {};
    kvs.forEach(r => {
      if (r.k && r.k.indexOf("done:") === 0) map[r.k.slice(5)] = r.v;
    });
    State._doneMap = map;
    return map;
  },
  async cards() { if (!State._cards) State._cards = await DB.getAll("cards"); return State._cards; },
  async sessions() { if (!State._sessions) State._sessions = await DB.getAll("sessions"); return State._sessions; },
  async mistakes() { if (!State._mistakes) State._mistakes = await DB.getAll("mistakes"); return State._mistakes; },
  async failCounts() {
    const kvs = await DB.getAll("kv");
    const map = {};
    kvs.forEach(r => { if (r.k && r.k.indexOf("fails:") === 0) map[r.k.slice(6)] = r.v; });
    return map;
  }
};

/* ---------- Session recording ---------- */
async function recordSession(result) {
  const today = U.todayISO();
  const kind = result.kind;

  // mark done
  if (kind === "daily" && result.week != null && result.dayId != null) {
    await DB.set("kv", "done:w" + result.week + ":" + result.dayId, { pct: result.pct, passed: result.pct >= 60, date: today });
  } else if (kind === "grand" && result.week != null) {
    await DB.set("kv", "done:w" + result.week + ":grand", { pct: result.pct, passed: result.pct >= 60, date: today });
  } else if (kind === "mock") {
    if (result.mockDate) {
      await DB.set("kv", "done:mockday:" + result.mockDate, { pct: result.pct, passed: true, date: today });
    } else {
      const kvs = await DB.getAll("kv");
      const n = kvs.filter(r => r.k.indexOf("done:mock:") === 0).length + 1;
      await DB.set("kv", "done:mock:" + n, { pct: result.pct, passed: result.pct >= 60, date: today });
    }
  }

  // per-subject accuracy
  const subj = {};
  const subjN = {};
  result.answers.forEach(a => {
    if (!a.s) return;
    subj[a.s] = (subj[a.s] || 0) + (a.correct ? 1 : 0);
    subjN[a.s] = (subjN[a.s] || 0) + 1;
  });
  const subjectPct = {};
  Object.keys(subj).forEach(s => { subjectPct[s] = Math.round(100 * subj[s] / subjN[s]); });

  // session record
  await DB.put("sessions", {
    id: kind + ":" + today + ":" + Date.now(),
    kind, week: result.week, dayId: result.dayId,
    date: today, pct: result.pct, total: result.total,
    firstTryCorrect: result.firstTryCorrect, subjectPct
  });

  // attempts + mistakes
  for (const a of result.answers) {
    if (!a.ref) continue;
    await DB.put("attempts", {
      id: a.ref + ":" + Date.now() + ":" + Math.floor(Math.random() * 1e6),
      ref: a.ref, correct: !!a.correct, confidence: a.confidence || null, date: today
    });
    if (!a.correct && kind !== "mock") {
      const existing = (await DB.getAll("mistakes")).find(m => m.ref === a.ref && !m.resolved);
      if (!existing) {
        await DB.put("mistakes", {
          id: a.ref, ref: a.ref, tag: a.mistakeTag || "Concept gap", date: today, resolved: false
        });
      }
    }
  }

  // daily log
  const logKey = "log:" + today;
  const log = (await DB.get("kv", logKey)) || { answered: 0, correct: 0, xp: 0, slept: false, braindump: "" };
  log.answered = (log.answered || 0) + result.total;
  log.correct = (log.correct || 0) + result.firstTryCorrect;
  log.xp = (log.xp || 0) + result.firstTryCorrect * 10;
  await DB.set("kv", logKey, log);

  // lifetime counter for the repair-first rule
  const tot = (await DB.get("kv", "answeredTotal")) || 0;
  await DB.set("kv", "answeredTotal", tot + result.total);

  // ambush hit-rate tracking (drives adaptive difficulty)
  if (result.kind === "ambush") {
    const st = (await DB.get("kv", "ambushStats")) || { hits: 0, seen: 0, streak3: 0 };
    st.hits += result.firstTryCorrect;
    st.seen += result.total;
    st.streak3 = result.total && result.firstTryCorrect === result.total ? (st.streak3 || 0) + 1 : 0;
    await DB.set("kv", "ambushStats", st);
  }

  // Don't-Move-On escalation: repeat failures get re-queued sooner
  if (result.kind !== "mock" && result.kind !== "review" && result.pct < 60) {
    const fkey = "fails:" + (result.week != null ? "w" + result.week + ":" + (result.dayId || "grand") : result.kind);
    const f = (await DB.get("kv", fkey)) || { count: 0 };
    f.count++;
    f.last = today;
    await DB.set("kv", fkey, f);
  }

  // milestone badges
  if (typeof evaluateBadges === "function") {
    try { await evaluateBadges(); } catch (e) { /* never block a session on badges */ }
  }

  State.invalidate();
}

/* ---------- Streak (Sundays are free · one freeze per week) ---------- */
function isoWeekKey(iso) {
  const d = U.isoToDate(iso);
  const start = new Date(d.getFullYear(), 0, 1);
  const week = Math.floor(((d - start) / 86400000 + start.getDay()) / 7);
  return d.getFullYear() + "-W" + week;
}

async function streakInfo() {
  let current = 0;
  let date = U.todayISO();
  const todayLog = await DB.get("kv", "log:" + date);
  if (!todayLog || !todayLog.answered) date = U.addDays(date, -1); // today not done yet: streak alive from yesterday
  let freeze = (await DB.get("kv", "freeze")) || { used: [] };
  if (!Array.isArray(freeze.used)) freeze.used = [];
  let usedFreezeThisRun = false;
  for (let i = 0; i < 400; i++) {
    const dow = U.isoToDate(date).getDay();
    if (dow === 0) { date = U.addDays(date, -1); continue; } // Sundays never break the streak
    const l = await DB.get("kv", "log:" + date);
    if (l && l.answered) { current++; date = U.addDays(date, -1); continue; }
    // missed weekday: auto-consume the week's single freeze token
    const wkKey = isoWeekKey(date);
    if (freeze.used.indexOf(wkKey) === -1) {
      freeze.used.push(wkKey);
      if (!usedFreezeThisRun) { await DB.set("kv", "freeze", freeze); usedFreezeThisRun = true; }
      current++;
      date = U.addDays(date, -1);
      continue;
    }
    break;
  }
  return { current, freezesUsed: freeze.used.length };
}

/* ---------- Repair-first rule ----------
   Ten old mistakes reviewed for every ten new questions. */
async function repairDebt() {
  const mistakes = await State.mistakes();
  const openMistakes = mistakes.filter(m => !m.resolved).length;
  const answeredTotal = (await DB.get("kv", "answeredTotal")) || 0;
  const lastRepair = (await DB.get("kv", "lastRepair")) || { count: 0 };
  const newSinceReview = answeredTotal - (lastRepair.count || 0);
  return {
    openMistakes,
    newSinceReview,
    needsRepair: openMistakes > 0 && newSinceReview >= 10
  };
}

/* ---------- Projected score (/400) ---------- */
async function projectedScore() {
  const sessions = (await State.sessions())
    .filter(s => s.kind === "daily" || s.kind === "grand" || s.kind === "mock");
  if (!sessions.length) return null;
  const recent = sessions.slice(-12);
  const acc = {};
  const accN = {};
  recent.forEach(s => {
    if (!s.subjectPct) return;
    Object.keys(s.subjectPct).forEach(sub => {
      acc[sub] = (acc[sub] || 0) + s.subjectPct[sub];
      accN[sub] = (accN[sub] || 0) + 1;
    });
  });
  Object.keys(acc).forEach(sub => { acc[sub] = acc[sub] / accN[sub]; });
  const subs = Object.keys(acc);
  if (!subs.length) return null;
  const score = Math.round(subs.reduce((a, s) => a + acc[s], 0) / subs.length * 4);
  return { score, acc };
}

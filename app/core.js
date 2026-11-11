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
      const req = indexedDB.open("sturdy", 1);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv", { keyPath: "k" });
        if (!db.objectStoreNames.contains("cards")) db.createObjectStore("cards", { keyPath: "ref" });
        if (!db.objectStoreNames.contains("mistakes")) db.createObjectStore("mistakes", { keyPath: "id" });
        if (!db.objectStoreNames.contains("sessions")) db.createObjectStore("sessions", { keyPath: "id" });
        if (!db.objectStoreNames.contains("attempts")) db.createObjectStore("attempts", { keyPath: "id" });
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
    while (date <= end) {
      const dow = U.isoToDate(date).getDay(); // 0 Sun .. 6 Sat
      if (dow === 0) {
        out.push({ type: "rest", date, label: "Rest day" });
      } else if (dow === 6) {
        const wk = Math.floor(dailyIdx / 5);
        if (wk >= 1 && wk <= 12 && weeks[wk] && weeks[wk].grand && !grandPlaced[wk]) {
          grandPlaced[wk] = true;
          out.push({ type: "grand", date, week: wk, grand: weeks[wk].grand, label: "Week " + wk + " · Grand Quiz" });
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
      const key = s.type === "daily" ? "w" + s.week + ":" + s.dayId : "w" + s.week + ":grand";
      if (doneMap[key]) return;
      if (s.type === "grand" && !weekStarted(s.week)) return;
      if (s.date === today) todays.push(s);
      else if (s.date < today) overdue.push(s);
    });
    return { todays, overdue };
  }
};

/* ---------- Spaced repetition (SM-2 based, exam-paced) ---------- */
const SRS = {
  next(card, grade, retention) {
    const c = Object.assign({}, card);
    const factor = (retention || 0.85) / 0.85;
    if (grade === 0) {
      // lapse: back to tomorrow
      c.lapses = (c.lapses || 0) + 1;
      c.ease = Math.max(1.3, (c.ease || 2.5) - 0.2);
      c.interval = 0;
      c.reps = 0;
    } else {
      c.reps = (c.reps || 0) + 1;
      c.ease = U.clamp((c.ease || 2.5) + (grade === 1 ? -0.15 : grade === 3 ? 0.1 : 0), 1.3, 2.9);
      let iv;
      if (c.reps === 1) iv = grade === 1 ? 1 : 3;
      else if (c.reps === 2) iv = grade === 1 ? 3 : 6;
      else iv = Math.round((c.interval || 3) * c.ease * (grade === 1 ? 0.5 : 1) * factor);
      // exam pacing: never schedule further than ~15% of remaining days
      const cap = Math.max(1, Math.floor(U.daysToExam() * 0.15));
      c.interval = U.clamp(iv, 1, cap);
    }
    c.due = grade === 0 ? U.addDays(U.todayISO(), 1) : U.addDays(U.todayISO(), Math.max(1, c.interval));
    return c;
  },
  dueCards(cards) {
    const today = U.todayISO();
    return cards.filter(c => c.due <= today).sort((a, b) => a.due < b.due ? -1 : 1);
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
  async mistakes() { if (!State._mistakes) State._mistakes = await DB.getAll("mistakes"); return State._mistakes; }
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
    const kvs = await DB.getAll("kv");
    const n = kvs.filter(r => r.k.indexOf("done:mock:") === 0).length + 1;
    await DB.set("kv", "done:mock:" + n, { pct: result.pct, passed: result.pct >= 60, date: today });
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

  State.invalidate();
}

/* ---------- Streak ---------- */
async function streakInfo() {
  let current = 0;
  let date = U.todayISO();
  const todayLog = await DB.get("kv", "log:" + date);
  if (!todayLog || !todayLog.answered) date = U.addDays(date, -1); // today not done yet: streak alive from yesterday
  for (let i = 0; i < 400; i++) {
    const l = await DB.get("kv", "log:" + date);
    if (l && l.answered) { current++; date = U.addDays(date, -1); }
    else break;
  }
  return { current };
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
/* ============================================================
   Sturdy - Study tab v3: full-screen learn -> check -> recall
   Sections -> topics -> subtopics (Biology fully curated from the
   3 source playlists; other subjects use the syllabus list).
   Checking a subtopic adds it to your LEARNED POOL. Recall and
   ambushes only ever pull from checked material, cycling the
   least-recently-studied topics first. Notes auto-become FSRS
   flashcards.

   v3 fixes: every screen clears #app before rendering (content
   no longer stacks on navigation), checkbox toggles update in
   place (no full re-render, no scroll jump, videos keep playing),
   the lesson view is full-screen immersive, exiting recall no
   longer restarts the quiz, and flashcards load with one
   IndexedDB read instead of one read per card.

   v3.1 fix: the playlist pagination loop never ran (pageToken
   started as null and the loop condition rejected it), so the
   video list could never be fetched. Now fetches page 1 first
   and follows next page tokens. Also toasts the result so a
   failed or empty load is visible instead of silent.
   ============================================================ */
"use strict";

/* leave immersive mode whenever the route changes away from a lesson */
window.addEventListener("hashchange", () => {
  if (location.hash.indexOf("lesson") === -1) document.body.classList.remove("immersive");
});

const Study = {
  _sel: null,         // selected subject for the tree view
  _lesson: null,      // unitId for the lesson view
  _recallScope: null, // array of units restricting the next recall
  _ytIndex: null,     // resolved playlist items for this session
  _studied: null,     // learned-pool map cache (kv "studied")

  /* ---------- learned pool (checkboxes) ---------- */
  async studied() {
    if (!Study._studied) Study._studied = (await DB.get("kv", "studied")) || {};
    return Study._studied;
  },

  async toggleStudied(id) {
    const m = await Study.studied();
    if (m[id]) delete m[id]; else m[id] = U.todayISO();
    await DB.set("kv", "studied", m);
    return !!m[id];
  },

  /* ---------- curriculum index ---------- */
  subjects() { return ["English", "Physics", "Chemistry", "Biology"]; },

  syllabusTopics(subject) {
    const S = window.SYLLABUS || {};
    let arr = [];
    if (Array.isArray(S)) {
      S.forEach(g => { if (g && (g.subject === subject || g.s === subject) && g.topics) arr = arr.concat(g.topics); });
    } else if (S[subject]) arr = S[subject];
    return arr;
  },

  unitsFor(subject) {
    const out = [];
    if (subject === "Biology" && window.VIDEO_MAP && VIDEO_MAP.Biology) {
      VIDEO_MAP.Biology.sections.forEach(sec => {
        (sec.topics || []).forEach(t => {
          if (t.subs && t.subs.length) {
            t.subs.forEach(s => out.push({
              id: "Biology|" + t.id + "|" + s.id,
              subject: "Biology", section: sec.name,
              topicId: t.id, topicName: t.name, name: s.name,
              keys: (s.keys || []).map(k => k.toLowerCase()),
              videos: s.videos || [], notes: s.notes || [],
              recall: s.recall !== false
            }));
          } else {
            out.push({
              id: "Biology|" + t.id,
              subject: "Biology", section: sec.name,
              topicId: t.id, topicName: t.name, name: t.name,
              keys: (t.keys || []).map(k => k.toLowerCase()),
              videos: t.videos || [], notes: t.notes || [],
              recall: t.recall !== false
            });
          }
        });
      });
      return out;
    }
    Study.syllabusTopics(subject).forEach(t => out.push({
      id: subject + "|" + t.id, subject, section: "",
      topicId: t.id, topicName: t.name, name: t.name,
      keys: (t.keys || []).map(k => k.toLowerCase()),
      videos: [], notes: [], recall: true
    }));
    return out;
  },

  unitById(id) {
    if (!id) return null;
    const subj = id.split("|")[0];
    return Study.unitsFor(subj).find(u => u.id === id) || null;
  },

  topicNotes(subject, topicId) {
    if (subject === "Biology" && window.VIDEO_MAP && VIDEO_MAP.Biology && VIDEO_MAP.Biology.topicNotes) {
      return VIDEO_MAP.Biology.topicNotes[topicId] || [];
    }
    return [];
  },

  /* ---------- question matching ---------- */
  matchQ(q, keys) {
    const hay = ((q.q || "") + " " + (q.o || []).join(" ")).toLowerCase();
    return keys.some(k => k && hay.indexOf(k) !== -1);
  },

  async studiedKeys() {
    const m = await Study.studied();
    const keys = [];
    Object.keys(m).forEach(id => {
      const u = Study.unitById(id);
      if (u && u.recall !== false) keys.push.apply(keys, u.keys);
    });
    return keys;
  },

  /* recall pool: ONLY studied units, least-recently-studied first */
  async recallPoolFrom(units, n) {
    if (!units || !units.length) return [];
    const all = Bank.allDaily();
    const picked = [], used = {};
    for (let round = 0; round < 5 && picked.length < n; round++) {
      for (let ui = 0; ui < units.length && picked.length < n; ui++) {
        const u = units[ui];
        if (!u.keys.length) continue;
        const cands = all.filter(q => q.s === u.subject && !used[q.ref] && Study.matchQ(q, u.keys));
        if (cands.length) {
          const q = cands[Math.floor(Math.random() * cands.length)];
          used[q.ref] = 1; picked.push(q);
        }
      }
      if (!round && !picked.length) break;
    }
    return picked;
  },

  /* ---------- YouTube playlist index (playlist-first, cached) ---------- */
  normTitle(s) { return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); },

  async videoIndex(force) {
    const vm = window.VIDEO_MAP && VIDEO_MAP.Biology;
    if (!vm || !vm.playlists || !vm.playlists.length) return [];
    if (!force) {
      const hit = await DB.get("kv", "study:ytindex");
      if (hit && hit.items && hit.items.length) return hit.items;
    }
    if (!YT.hasKey()) { const e = new Error("NO_KEY"); e.code = "NO_KEY"; throw e; }
    const items = [];
    for (const plId of vm.playlists) {
      let pageToken = null;
      for (let page = 0; page < 8; page++) {
        const params = { part: "snippet", playlistId: plId, maxResults: "50" };
        if (pageToken) params.pageToken = pageToken;
        const res = await YT.api("playlistItems", params);
        (res.items || []).forEach(it => {
          const sn = it.snippet || {};
          const vid = sn.resourceId && sn.resourceId.videoId;
          if (vid) items.push({ videoId: vid, title: sn.title || "", playlist: plId });
        });
        pageToken = res.nextPageToken || null;
        if (!pageToken) break;
      }
    }
    if (items.length) await DB.set("kv", "study:ytindex", { items, date: U.todayISO() });
    return items;
  },

  resolveVideos(unit, items) {
    return (unit.videos || []).map(v => {
      const want = Study.normTitle(v.t);
      let hit = items.find(it => Study.normTitle(it.title) === want);
      if (!hit) {
        const words = want.split(" ").filter(w => w.length > 3);
        let best = null, bs = 0;
        items.forEach(it => {
          const t = Study.normTitle(it.title);
          let sc = 0;
          words.forEach(w => { if (t.indexOf(w) !== -1) sc++; });
          if (sc > bs) { bs = sc; best = it; }
        });
        if (bs >= Math.max(2, Math.floor(words.length * 0.6))) hit = best;
      }
      return hit ? Object.assign({}, v, { videoId: hit.videoId, resolved: true }) : Object.assign({}, v);
    });
  },

  /* ---------- flashcard derivation from notes ---------- */
  deriveCards(unit) {
    const lines = (unit.notes || []).concat(Study.topicNotes(unit.subject, unit.topicId));
    const out = [];
    lines.forEach((line, i) => {
      const ref = "fc:" + unit.id + ":" + i;
      const ci = line.indexOf(": ");
      const front = (ci > 1 && ci < 70) ? line.slice(0, ci) : ("Recall · " + unit.name);
      out.push({ ref, front, back: line, unitName: unit.name });
    });
    return out;
  }
};

/* ================= SCREENS ================= */

function rerenderKeepScroll() {
  const y = window.scrollY;
  App.render().then(() => window.scrollTo(0, y));
}

/* ---------- subject picker (home) ---------- */
async function renderStudy(view) {
  view.innerHTML = ""; // never stack content on re-navigation
  if (!Study._sel) { await Study.renderHome(view); return; }
  await Study.renderTree(view);
}

Study.renderHome = async function (view) {
  const m = await Study.studied();
  const per = Study.subjects().map(s => {
    const units = Study.unitsFor(s);
    const done = units.filter(u => m[u.id]).length;
    return { s, total: units.length, done, pct: units.length ? Math.round(done / units.length * 100) : 0 };
  });
  const totalUnits = per.reduce((a, x) => a + x.total, 0);
  const totalDone = per.reduce((a, x) => a + x.done, 0);
  const totalPct = totalUnits ? Math.round(totalDone / totalUnits * 100) : 0;

  const hero = html`<header class="study-hero">
    <div class="sh-kicker">JAMB 2027 · Learn · Check · Recall</div>
    <h2 class="sh-title">Study</h2>
    <p class="sh-sub">Learn a subtopic, check it off, and Recall will only ever quiz you on what you have checked.</p>
    <div class="sh-meter">
      <div class="sh-meter-top"><span>${totalDone} of ${totalUnits} subtopics learned</span><strong>${totalPct}%</strong></div>
      <div class="prog-bar on-hero"><div style="width:${totalPct}%"></div></div>
    </div>
  </header>`;

  const loop = html`<div class="study-loop">
    <span>📖 Learn</span><i>→</i><span>✅ Check</span><i>→</i><span>⚡ Recall</span><i>→</i><span>🃏 Cards</span>
  </div>`;

  const grid = html`<div class="subj-grid" id="subj-grid"></div>`;

  view.appendChild(hero);
  view.appendChild(loop);
  view.appendChild(grid);

  const emo = { English: "📖", Physics: "⚛️", Chemistry: "⚗️", Biology: "🧬" };
  per.forEach((x, i) => {
    const tile = html`<button class="subj-tile" style="animation-delay:${i * 70}ms">
      <span class="subj-emoji">${emo[x.s] || "📘"}</span>
      <span class="subj-info">
        <span class="subj-name">${x.s}${x.s === "Biology" ? html`<em class="subj-tag">curated</em>` : ""}</span>
        <span class="prog-bar"><div style="width:${x.pct}%"></div></span>
        <span class="prog-txt">${x.done}/${x.total} studied</span>
      </span>
      <span class="subj-go">›</span>
    </button>`;
    tile.addEventListener("click", () => { Study._sel = x.s; App.render(); });
    grid.appendChild(tile);
  });
};

/* ---------- curriculum tree ---------- */
Study.renderTree = async function (view) {
  const m = await Study.studied();
  const subject = Study._sel;
  const units = Study.unitsFor(subject);
  const done = units.filter(u => m[u.id]).length;
  const pct = units.length ? Math.round(done / units.length * 100) : 0;

  const head = html`<div class="tree-head">
    <div class="tree-top">
      <button class="icon-btn" data-act="back">←</button>
      <h2>${subject}</h2>
      <span class="tree-count" id="st-count">${done}/${units.length}</span>
    </div>
    <div class="prog-bar"><div id="st-bar" style="width:${pct}%"></div></div>
    <div class="study-cta">
      <button class="cta-btn" data-act="recall-all">⚡ Recall · 10 questions</button>
      <button class="cta-btn ghost" data-act="cards">🃏 Flashcards</button>
    </div>
  </div>`;
  view.appendChild(head);

  head.querySelector('[data-act="back"]').addEventListener("click", () => { Study._sel = null; App.render(); });
  head.querySelector('[data-act="recall-all"]').addEventListener("click", () => { Study._recallScope = null; App.nav("recall"); });
  head.querySelector('[data-act="cards"]').addEventListener("click", () => App.nav("cards"));

  /* group units: section -> topic -> subs */
  const sections = [];
  units.forEach(u => {
    let sec = sections.find(x => x.name === u.section);
    if (!sec) { sec = { name: u.section || "Topics", topics: [] }; sections.push(sec); }
    let top = sec.topics.find(x => x.id === u.topicId);
    if (!top) { top = { id: u.topicId, name: u.topicName, units: [] }; sec.topics.push(top); }
    top.units.push(u);
  });

  const tree = html`<div id="study-tree"></div>`;
  view.appendChild(tree);

  sections.forEach(sec => {
    const secCard = html`<div class="sec-card">
      <p class="sec-title">${sec.name}</p>
      <div class="topic-list"></div>
    </div>`;
    const list = secCard.querySelector(".topic-list");
    sec.topics.forEach(top => {
      const tDone = top.units.filter(u => m[u.id]).length;
      const open = tDone < top.units.length; // collapse finished topics
      const block = html`<div class="topic-block ${open ? "open" : ""}">
        <button class="topic-row" data-act="fold">
          <span class="topic-name">${top.name}</span>
          <span class="topic-prog" data-topic="${top.id}">${tDone}/${top.units.length}</span>
          <span class="fold-chev">▾</span>
        </button>
        <div class="sub-list"><div class="sub-list-in"></div></div>
      </div>`;
      const subs = block.querySelector(".sub-list-in");
      top.units.forEach(u => {
        const on = !!m[u.id];
        const row = html`<div class="sub-row ${on ? "done" : ""}" data-unit="${u.id}">
          <button class="ckb ${on ? "on" : ""}" data-act="check" aria-label="Mark as studied">✓</button>
          <span class="sub-name">${u.name}</span>
          <span class="sub-badges">
            ${u.videos.length ? html`<span class="mini-badge">▶ ${u.videos.length}</span>` : ""}
            ${u.notes.length || Study.topicNotes(u.subject, u.topicId).length ? html`<span class="mini-badge">📝</span>` : ""}
            ${!u.recall ? html`<span class="mini-badge">no recall</span>` : ""}
          </span>
        </div>`;
        const ckb = row.querySelector('[data-act="check"]');
        ckb.addEventListener("click", async (e) => {
          e.stopPropagation();
          const nowOn = await Study.toggleStudied(u.id);
          /* in-place update: no re-render, no scroll jump, video keeps playing */
          ckb.classList.toggle("on", nowOn);
          row.classList.toggle("done", nowOn);
          const mm = await Study.studied();
          const tDone2 = top.units.filter(x => mm[x.id]).length;
          const tp = block.querySelector(".topic-prog");
          if (tp) tp.textContent = tDone2 + "/" + top.units.length;
          const d2 = units.filter(x => mm[x.id]).length;
          const p2 = units.length ? Math.round(d2 / units.length * 100) : 0;
          const hc = head.querySelector("#st-count");
          if (hc) hc.textContent = d2 + "/" + units.length;
          const hb = head.querySelector("#st-bar");
          if (hb) hb.style.width = p2 + "%";
        });
        row.addEventListener("click", () => { Study._lesson = u.id; App.nav("lesson"); });
        subs.appendChild(row);
      });
      block.querySelector('[data-act="fold"]').addEventListener("click", () => block.classList.toggle("open"));
      list.appendChild(block);
    });
    tree.appendChild(secCard);
  });
};

/* ---------- lesson view (full-screen immersive) ---------- */
async function renderLesson(view) {
  view.innerHTML = "";
  const unit = Study.unitById(Study._lesson);
  if (!unit) { App.nav("study"); return; }
  document.body.classList.add("immersive");
  const m = await Study.studied();
  const isStudied = !!m[unit.id];

  const root = html`<div class="lesson-shell">
    <header class="lesson-hero">
      <div class="lh-top">
        <button class="lh-back" data-act="back" aria-label="Back to Study">←</button>
        <span class="lh-crumb">${unit.section || unit.subject} · ${unit.topicName}</span>
      </div>
      <h2 class="lh-title">${unit.name}</h2>
      <div class="lh-meta" id="lh-meta">${isStudied ? "✓ Studied " + m[unit.id] : (unit.videos.length ? "▶ " + unit.videos.length + " videos · notes · teach-back" : "Notes · teach-back")}</div>
    </header>
    <nav class="lesson-nav" id="lesson-nav"></nav>
    <div class="lesson-body" id="lesson-body"></div>
    <div class="lesson-dock">
      <button class="dock-btn ${isStudied ? "on" : ""}" id="dock-mark" data-act="studied">${isStudied ? "✓ Studied · in your recall pool" : "Mark as studied"}</button>
    </div>
  </div>`;
  view.appendChild(root);

  root.querySelector('[data-act="back"]').addEventListener("click", () => App.nav("study"));
  root.querySelector('[data-act="studied"]').addEventListener("click", async () => {
    const nowOn = await Study.toggleStudied(unit.id);
    /* in-place: the video keeps playing, nothing re-renders */
    const dock = root.querySelector("#dock-mark");
    dock.classList.toggle("on", nowOn);
    dock.textContent = nowOn ? "✓ Studied · in your recall pool" : "Mark as studied";
    const meta = root.querySelector("#lh-meta");
    if (meta) meta.textContent = nowOn ? "✓ Studied " + (await Study.studied())[unit.id] : (unit.videos.length ? "▶ " + unit.videos.length + " videos · notes · teach-back" : "Notes · teach-back");
    U.toast(nowOn ? "Added to your recall pool ⚡" : "Removed from the recall pool", 2600);
  });

  const body = root.querySelector("#lesson-body");

  /* WATCH */
  if (unit.videos.length) {
    const watch = html`<div class="card les-card" id="les-watch">
      <p class="sec-title">▶ Watch</p>
      <div id="watch-body"></div>
    </div>`;
    body.appendChild(watch);
    const wb = watch.querySelector("#watch-body");

    if (!YT.hasKey()) {
      const p = html`<div>
        <p class="prog-txt">Add your YouTube API key in Settings to load lesson videos here (about 4 quota units, once, then cached forever).</p>
        <button class="cta-btn ghost" data-act="tosettings" style="margin-top:10px">Open Settings</button>
      </div>`;
      wb.appendChild(p);
      p.querySelector('[data-act="tosettings"]').addEventListener("click", () => App.nav("settings"));
    } else {
      let items = Study._ytIndex;
      if (!items) {
        try { items = await Study.videoIndex(false); Study._ytIndex = items; }
        catch (e) { items = []; }
      }
      if (!items.length) {
        const b = html`<button class="cta-btn" data-act="load">Load video list from the 3 playlists<small style="display:block;font-weight:400;opacity:.8">~4 quota units · cached after this</small></button>`;
        wb.appendChild(b);
        b.addEventListener("click", async () => {
          b.disabled = true; b.textContent = "Loading playlists…";
          try {
            Study._ytIndex = await Study.videoIndex(true);
            await DB.set("kv", "study:ytindex", { items: Study._ytIndex, date: U.todayISO() });
            const n = Study._ytIndex.length;
            U.toast(n ? "Loaded " + n + " videos from the playlists ✓" : "Loaded 0 videos: double-check the playlist IDs in Settings", 3600);
          } catch (e) {
            U.toast(AI.friendlyError(e), 3800);
          }
          rerenderKeepScroll();
        });
      } else {
        Study.renderWatchList(wb, unit, items);
      }
    }
  }

  /* READ */
  const tNotes = Study.topicNotes(unit.subject, unit.topicId);
  if (unit.notes.length || tNotes.length) {
    const read = html`<div class="card les-card" id="les-read">
      <p class="sec-title">📝 Read: key facts</p>
      <div id="read-body"></div>
    </div>`;
    body.appendChild(read);
    const rb = read.querySelector("#read-body");
    unit.notes.forEach(n => rb.appendChild(html`<div class="note-line">${n}</div>`));
    if (tNotes.length) {
      const hi = html`<div class="note-hi"><h4>High-yield facts</h4><div class="hi-list"></div></div>`;
      const hl = hi.querySelector(".hi-list");
      tNotes.forEach(n => hl.appendChild(html`<div class="note-line">${n}</div>`));
      rb.appendChild(hi);
    }
  }

  /* TEACH */
  const teach = html`<div class="card les-card" id="les-teach">
    <p class="sec-title">🎓 Teach it back (Feynman)</p>
    <p class="prog-txt">Explain "${unit.name}" in your own words, as if teaching a friend. The AI examiner will grade it.</p>
    <textarea class="teach-area" id="teach-text" placeholder="So basically…"></textarea>
    <button class="cta-btn" data-act="grade" style="margin-top:10px">Grade my explanation</button>
    <div id="teach-out"></div>
  </div>`;
  body.appendChild(teach);
  teach.querySelector('[data-act="grade"]').addEventListener("click", async () => {
    const txt = (teach.querySelector("#teach-text").value || "").trim();
    const out = teach.querySelector("#teach-out");
    if (txt.length < 40) { U.toast("Write at least a few sentences: the grader needs substance.", 3200); return; }
    const btn = teach.querySelector('[data-act="grade"]');
    btn.disabled = true; btn.textContent = "Grading…";
    try {
      const v = await AI.feynmanGrade(unit.name, unit.subject, txt);
      const tb = (await DB.get("kv", "teachbacks")) || {};
      tb[unit.id] = { verdict: v.verdict, date: U.todayISO() };
      await DB.set("kv", "teachbacks", tb);
      const box = html`<div class="verdict ${v.verdict === "pass" ? "pass" : "weak"}">
        <strong>${v.verdict === "pass" ? "✅ Pass: you know this" : "🟠 Weak: revisit before moving on"}</strong>
        ${v.tip ? html`<p class="prog-txt" style="margin-top:6px">${v.tip}</p>` : ""}
        ${v.wrong && v.wrong.length ? html`<p class="prog-txt" style="margin-top:6px"><strong>Wrong:</strong></p><ul>${v.wrong.map(w => html`<li>${w}</li>`)}</ul>` : ""}
        ${v.missing && v.missing.length ? html`<p class="prog-txt" style="margin-top:6px"><strong>You left out:</strong></p><ul>${v.missing.map(w => html`<li>${w}</li>`)}</ul>` : ""}
      </div>`;
      out.innerHTML = "";
      out.appendChild(box);
    } catch (e) {
      U.toast(AI.friendlyError(e), 3800);
    }
    btn.disabled = false; btn.textContent = "Grade my explanation";
  });

  /* TEST */
  if (unit.recall !== false && unit.keys.length) {
    const test = html`<div class="card les-card" id="les-test">
      <p class="sec-title">⚡ Test</p>
      <button class="cta-btn" data-act="unit-recall">Recall this subtopic · 5 questions</button>
    </div>`;
    body.appendChild(test);
    test.querySelector('[data-act="unit-recall"]').addEventListener("click", () => {
      Study._recallScope = [unit];
      App.nav("recall");
    });
  }

  /* quick-nav chips: jump straight to each section */
  const nav = root.querySelector("#lesson-nav");
  [["les-watch", "▶ Watch"], ["les-read", "📝 Read"], ["les-teach", "🎓 Teach"], ["les-test", "⚡ Test"]].forEach(pair => {
    const el = root.querySelector("#" + pair[0]);
    if (!el) return;
    const c = html`<button class="ln-chip">${pair[1]}</button>`;
    c.addEventListener("click", () => el.scrollIntoView({ behavior: "smooth", block: "start" }));
    nav.appendChild(c);
  });
  if (!nav.children.length) nav.style.display = "none";
}

/* watch list + embed with chapters */
Study.renderWatchList = function (wb, unit, items) {
  const resolved = Study.resolveVideos(unit, items);
  const wrap = html`<div>
    <div id="les-embed"></div>
    <div id="les-list"></div>
  </div>`;
  wb.appendChild(wrap);
  const embBox = wrap.querySelector("#les-embed");
  const listBox = wrap.querySelector("#les-list");

  function play(v) {
    embBox.innerHTML = "";
    embBox.appendChild(YT.embed(v.videoId, v.t, v._start || 0));
    if (v.ch && v.ch.length) {
      const row = html`<div class="chap-row"></div>`;
      v.ch.forEach(c => {
        const chip = html`<button class="chap-chip">${c[0]}</button>`;
        chip.addEventListener("click", () => {
          row.querySelectorAll(".chap-chip").forEach(x => x.classList.remove("on"));
          chip.classList.add("on");
          const f = embBox.querySelector("iframe");
          if (f) f.src = "https://www.youtube-nocookie.com/embed/" + v.videoId + "?rel=0&autoplay=0&start=" + c[1];
        });
        row.appendChild(chip);
      });
      embBox.appendChild(row);
    }
  }

  const sorted = resolved.slice().sort((a, b) => (a.d === "full" ? 0 : 1) - (b.d === "full" ? 0 : 1));
  sorted.forEach((v, i) => {
    if (v.resolved) {
      const row = html`<div class="v-row">
        <span class="v-depth ${v.d === "recap" ? "recap" : ""}">${v.d === "recap" ? "Recap" : "Full"}</span>
        <span class="v-title">${v.t}</span>
        <button class="v-play" data-act="play">Watch</button>
      </div>`;
      row.querySelector('[data-act="play"]').addEventListener("click", () => play(v));
      listBox.appendChild(row);
      if (i === 0) play(v);
    } else {
      const row = html`<div class="v-row">
        <span class="v-depth recap">?</span>
        <span class="v-title">${v.t}</span>
        <button class="v-play" data-act="find">Find</button>
      </div>`;
      row.querySelector('[data-act="find"]').addEventListener("click", () => {
        window.open("https://www.youtube.com/results?search_query=" + encodeURIComponent(v.t), "_blank");
      });
      listBox.appendChild(row);
    }
  });
};

/* ---------- recall: only studied material ---------- */
async function renderRecall(view) {
  view.innerHTML = "";
  const scope = Study._recallScope;
  Study._recallScope = null;

  let units;
  if (scope && scope.length) {
    units = scope;
  } else {
    const m = await Study.studied();
    units = Object.keys(m)
      .map(id => Study.unitById(id))
      .filter(u => u && u.recall !== false && u.keys.length);
    units.sort((a, b) => ((m[a.id] || "") < (m[b.id] || "") ? -1 : 1));
  }

  const pool = await Study.recallPoolFrom(units, 10);
  if (pool.length < 3) {
    const empty = html`<div class="card empty-card" style="margin-top:20px">
      <div style="font-size:34px">📚</div>
      <h3 style="margin:10px 0 6px">Your recall pool is too small</h3>
      <p class="prog-txt">Recall never quizzes you on material you haven't studied. Open the Study tab, learn a subtopic, and check it off: it joins your pool instantly.</p>
      <button class="cta-btn" data-act="tostudy" style="margin-top:14px">Go to Study</button>
    </div>`;
    view.appendChild(empty);
    empty.querySelector('[data-act="tostudy"]').addEventListener("click", () => App.nav("study"));
    return;
  }

  const result = await runQuiz(view, {
    title: scope && scope.length === 1 ? "Recall · " + scope[0].name : "Active recall",
    questions: pool,
    mode: "practice",
    kind: "recall"
  });
  /* leaving via the quiz's exit must return to Study, not restart the quiz */
  if (!result) { App.nav("study"); return; }

  await recordSession(result);
  if (State && State.invalidate) State.invalidate();
  U.toast("Recall logged: " + result.pct + "%. Misses are in your Vault.", 3600);
  App.nav("study");
}

/* ---------- flashcards derived from studied notes ---------- */
async function renderCards(view) {
  view.innerHTML = "";
  const m = await Study.studied();
  const units = Object.keys(m).map(id => Study.unitById(id)).filter(u => u);
  const all = [];
  units.forEach(u => Study.deriveCards(u).forEach(c => all.push(c)));
  if (!all.length) {
    const empty = html`<div class="card empty-card" style="margin-top:20px">
      <div style="font-size:34px">🃏</div>
      <h3 style="margin:10px 0 6px">No cards yet</h3>
      <p class="prog-txt">Flashcards are generated from the notes of subtopics you have checked off in the Study tab.</p>
      <button class="cta-btn" data-act="tostudy" style="margin-top:14px">Go to Study</button>
    </div>`;
    view.appendChild(empty);
    empty.querySelector('[data-act="tostudy"]').addEventListener("click", () => App.nav("study"));
    return;
  }

  /* ONE IndexedDB read for the whole store (was one read per card) */
  let saved = [];
  try { saved = await DB.getAll("cards"); } catch (e) { saved = []; }
  const smap = {};
  saved.forEach(c => { smap[c.ref] = c; });
  all.forEach(c => { c.srs = smap[c.ref] || null; });

  const today = U.todayISO();
  const due = all.filter(c => c.srs && (c.srs.due || "") <= today)
    .sort((a, b) => (a.srs.due || "") < (b.srs.due || "") ? -1 : 1);
  const fresh = all.filter(c => !c.srs);
  const deck = due.concat(fresh).slice(0, 15);

  let i = 0, flipped = false, graded = 0;
  const stage = html`<div class="flash-stage">
    <span class="topic-prog" id="fc-count"></span>
    <div class="fc-progress"><div id="fc-bar" style="width:0%"></div></div>
    <div id="fc-box" style="width:100%"></div>
  </div>`;
  view.appendChild(stage);
  const box = stage.querySelector("#fc-box");
  const count = stage.querySelector("#fc-count");
  const bar = stage.querySelector("#fc-bar");

  function show() {
    flipped = false;
    if (i >= deck.length) { done(); return; }
    const c = deck[i];
    count.textContent = "Card " + (i + 1) + " / " + deck.length + (c.srs ? " · review" : " · new");
    bar.style.width = (i / deck.length * 100) + "%";
    box.innerHTML = "";
    const cardEl = html`<div class="flash-card">
      <div class="flash-kicker">${c.unitName}</div>
      <div class="flash-term">${c.front}</div>
      <button class="cta-btn ghost" data-act="flip" style="margin-top:18px">Show answer</button>
    </div>`;
    box.appendChild(cardEl);
    cardEl.querySelector('[data-act="flip"]').addEventListener("click", flip);
    function flip() {
      if (flipped) return;
      flipped = true;
      cardEl.innerHTML = "";
      cardEl.appendChild(html`<div>
        <div class="flash-kicker">${c.unitName}</div>
        <div class="flash-full">${c.back}</div>
      </div>`);
      const gr = html`<div class="grade-row">
        <button class="grade-btn g0" data-g="0">Again</button>
        <button class="grade-btn g1" data-g="1">Hard</button>
        <button class="grade-btn g2" data-g="2">Good</button>
        <button class="grade-btn g3" data-g="3">Easy</button>
      </div>`;
      gr.querySelectorAll(".grade-btn").forEach(b => b.addEventListener("click", () => gradeNow(Number(b.getAttribute("data-g")))));
      box.appendChild(gr);
    }
  }

  async function gradeNow(g) {
    const c = deck[i];
    const base = c.srs || { ref: c.ref, ease: 2.5, interval: 0, reps: 0, due: U.todayISO(), lapses: 0 };
    try {
      const next = SRS.next(base, g, Settings.cache.retention);
      await DB.put("cards", next);
    } catch (e) { /* a scheduling hiccup must never block the session */ }
    graded++;
    i++;
    show();
  }

  function done() {
    bar.style.width = "100%";
    box.innerHTML = "";
    box.appendChild(html`<div class="card empty-card">
      <div style="font-size:34px">${graded ? "🔥" : "🎉"}</div>
      <h3 style="margin:10px 0 6px">${graded ? "Deck cleared · " + graded + " graded" : "All caught up"}</h3>
      <p class="prog-txt">${graded ? "Cards come back right before you'd forget them (FSRS). Check more subtopics to grow the deck." : "Every card is scheduled for later: FSRS brings each one back right before you'd forget it."}</p>
      <button class="cta-btn" data-act="back" style="margin-top:14px">Back to Study</button>
    </div>`);
    box.querySelector('[data-act="back"]').addEventListener("click", () => App.nav("study"));
  }

  show();
}

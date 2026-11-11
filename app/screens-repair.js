/* ============================================================
   Sturdy — February revision system:
   per-topic repair kits (mistakes + retest + video) and the
   Final-72-Hours plan before exam day.
   ============================================================ */
"use strict";

/* Group open mistakes into repair kits by syllabus topic. */
async function buildRepairKits() {
  const mistakes = (await State.mistakes()).filter(m => !m.resolved);
  const sy = window.SYLLABUS;
  const kits = {};
  const general = {};

  mistakes.forEach(m => {
    const q = Bank.byRef(m.ref);
    if (!q) return;
    const text = (q.q || "").toLowerCase();
    let matched = null;
    (sy[q.s] || []).forEach(t => {
      if (!matched && t.keys.some(k => text.indexOf(k) !== -1)) matched = t;
    });
    if (matched) {
      const key = q.s + ":" + matched.id;
      kits[key] = kits[key] || { subject: q.s, id: matched.id, name: matched.name, mistakes: [] };
      kits[key].mistakes.push(m);
    } else {
      general[q.s] = general[q.s] || { subject: q.s, id: "_general", name: "General " + q.s, mistakes: [] };
      general[q.s].mistakes.push(m);
    }
  });

  return Object.values(kits).concat(Object.values(general))
    .sort((a, b) => b.mistakes.length - a.mistakes.length);
}

/* 5-question retest drawn from quiz days that match the kit's topic. */
async function kitRetestQuestions(kit) {
  const weeks = Bank.weeks();
  const qs = [];
  Object.keys(weeks).forEach(w => {
    (weeks[w].daily || []).forEach(d => {
      const text = (d.topics || []).join(" · ").toLowerCase();
      const match = kit.id === "_general"
        ? (d.topics || []).some(t => t.toLowerCase().indexOf(kit.subject.toLowerCase()) === 0)
        : text.indexOf(kit.name.toLowerCase().split(" ")[0]) !== -1 ||
          (window.SYLLABUS[kit.subject] || []).find(t => t.id === kit.id && t.keys.some(k => text.indexOf(k) !== -1));
      if (match) d.questions.forEach(q => qs.push(Object.assign({}, q)));
    });
  });
  /* always include the actual mistakes first */
  const missQs = kit.mistakes.map(m => Bank.byRef(m.ref)).filter(Boolean);
  const pool = U.shuffle(qs);
  return missQs.concat(pool).slice(0, Math.max(5, Math.min(10, missQs.length + 2)));
}

/* ---------- Repair kits screen ---------- */
async function renderKits(container) {
  const kits = await buildRepairKits();
  const dte = U.daysToExam();

  const view = html`<div class="fade-in">
    <div class="topbar"><h1>Repair kits</h1><span class="chip info">February mode</span></div>

    <div class="card">
      <h3>From mistakes to mastery</h3>
      <p class="small muted">Each open mistake cluster becomes a kit: see the misses, retest on the topic, watch one short concept video, then teach it back. This is the February engine.</p>
      ${dte <= 21 ? html`<div class="chip gold" style="margin-top:6px">${dte} days to exam — run every kit before 15 March.</div>` : ""}
    </div>

    ${kits.length ? kits.map(k => {
      const card = html`<div class="card">
        <div class="row" style="align-items:flex-start">
          <div class="grow">
            <div class="title">${k.name}</div>
            <div class="sub">${k.subject} · ${k.mistakes.length} open mistake(s)</div>
          </div>
          <span class="chip bad">${k.mistakes.length}</span>
        </div>
        <div class="kit-mistakes">
          ${k.mistakes.slice(0, 4).map(m => {
            const q = Bank.byRef(m.ref);
            return html`<div class="row"><span class="emo">${TAG_EMO[TAGS.indexOf(m.tag)] || "•"}</span>
              <div class="grow"><div class="title">${q ? q.q.slice(0, 80) : m.ref}</div>
              <div class="sub">${m.tag} · ${m.date}</div></div></div>`;
          })}
          ${k.mistakes.length > 4 ? html`<div class="tiny muted" style="margin-top:6px">+ ${k.mistakes.length - 4} more</div>` : ""}
        </div>
        <div class="btn-row" style="margin-top:12px">
          <button class="btn primary small" data-act="retest">Retest</button>
          <button class="btn ghost small" data-act="video">🎬 Repair video</button>
          <button class="btn ghost small" data-act="teach">Teach it back</button>
        </div>
        <div class="kit-video" data-slot></div>
      </div>`;

      card.querySelector('[data-act="retest"]').addEventListener("click", async () => {
        const qs = await kitRetestQuestions(kit);
        if (!qs.length) { U.toast("No matching questions in the bank yet."); return; }
        const result = await runQuiz(App.view, { title: "Retest · " + k.name, questions: qs, mode: "practice", kind: "review" });
        for (const a of result.answers) {
          if (!a.correct) continue;
          const ms = await DB.getAll("mistakes");
          const m = ms.find(x => x.ref === a.ref && !x.resolved);
          if (m) { m.resolved = true; await DB.put("mistakes", m); }
        }
        const prev = (await DB.get("kv", "lastRepair")) || { count: 0 };
        await DB.set("kv", "lastRepair", { date: U.todayISO(), count: prev.count + result.total });
        U.toast("Retest done — clean answers leave the kit. ✨");
        App.nav("kits");
      });

      card.querySelector('[data-act="video"]').addEventListener("click", async () => {
        const slot = card.querySelector("[data-slot]");
        slot.innerHTML = "";
        slot.appendChild(html`<p class="tiny muted">Finding video… (uses ~2 quota units, cached after)</p>`);
        try {
          const v = await YT.repairVideo(k.name, k.subject, { allowSearch: true });
          slot.innerHTML = "";
          slot.appendChild(YT.embed(v.videoId, v.title));
          slot.appendChild(html`<p class="tiny muted" style="margin-top:6px">${v.title} · ${v.from === "playlist" ? "from your playlist" : "via search"}${v.cached ? " · cached" : ""}</p>`);
          slot.appendChild(html`<p class="tiny" style="margin:6px 0;color:var(--gold)">Before you press play: say out loud what you think the video will say. Watch once. Then teach it back.</p>`);
        } catch (e) {
          slot.innerHTML = "";
          slot.appendChild(emptyState("🎬", "Video unavailable", e.code === "NO_KEY" ? "Add your YouTube Data API key in Settings." : e.code === "NO_SOURCE" ? "Add a playlist for " + k.subject + " in Settings, or tap again to allow a search." : YT.friendlyError ? "" : e.message));
          slot.appendChild(html`<p class="tiny muted center">${e.code === "QUOTA_OR_KEY" ? "Key rejected or quota gone — check Settings." : e.message}</p>`);
        }
      });

      card.querySelector('[data-act="teach"]').addEventListener("click", () => {
        if (k.id === "_general") { App.nav("syllabus"); return; }
        renderTeachBack(App.view, k.subject, k.id, k.name);
      });

      return card;
    }) : html`<div class="card center">${emptyState("✨", "No open mistakes", "Nothing to repair. Run a quiz or mock and the kits will build themselves.")}</div>`}
  </div>`;
  mount(container, view);
}

/* ---------- Final 72 hours ---------- */
function renderFinal72(container) {
  const dte = U.daysToExam();
  const plan = [
    {
      day: "72 → 48 hours out", emo: "🧠",
      items: [
        "No new material. Nothing. Only your Mistake Vault and review cards.",
        "One light pass over the weakest 3 topics from Stats.",
        "Skim your brain-dumps from the last two weeks — they are your memory map."
      ]
    },
    {
      day: "48 → 24 hours out", emo: "📝",
      items: [
        "One final mock, untimed pressure-wise: pace yourself, bank easy marks first.",
        "Re-read every 'Formula missing' and 'Vocabulary gap' tag in the Vault.",
        "Print/keep your exam slip, passport photo and ID where you can see them."
      ]
    },
    {
      day: "Last 24 hours", emo: "🌙",
      items: [
        "Morning: 30 minutes of review cards, maximum.",
        "Afternoon: pack everything (slip, ID, pens, water). Confirm centre location and travel time.",
        "Evening: no screens after 9pm. Sleep 7h+. Sleep is revision."
      ]
    },
    {
      day: "Exam morning · 15 March", emo: "🎯",
      items: [
        "Eat something familiar. No new food, no experiments.",
        "Arrive early — at least 90 minutes before your slot.",
        "In the hall: two-pass strategy. English first, bank the easy marks, flag and return.",
        "You have done 1,800 questions for this. Walk in like you own it. 💪"
      ]
    }
  ];

  const view = html`<div class="fade-in">
    <div class="topbar"><h1>Final 72 hours</h1><span class="chip gold">${dte} days left</span></div>
    <div class="card" style="background:linear-gradient(135deg,var(--card),var(--card-2))">
      <h3>15 March 2027 · your day</h3>
      <p class="small muted">The plan for the last three days. Trust the system: the work is already in you.</p>
    </div>
    ${plan.map(p => html`<div class="card">
      <h3>${p.emo} ${p.day}</h3>
      ${p.items.map(i => html`<div class="row"><span class="emo">▸</span><div class="grow"><div class="title" style="font-weight:500">${i}</div></div></div>`)}
    </div>`)}
    <button class="btn primary block big" style="margin-bottom:40px" id="f72-back">Back to Today</button>
  </div>`;
  mount(container, view);
  view.querySelector("#f72-back").addEventListener("click", () => App.nav("today"));
}

/* ============================================================
   Sturdy AI — Groq-powered tutor (Feynman grader, mistake
   autopsies, flashcard generation). Key lives in Settings,
   every response is cached in IndexedDB so the same question
   is never re-explained and quota is never wasted.
   ============================================================ */
"use strict";

const AI = {
  MODEL: "openai/gpt-oss-120b",

  hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return String(h);
  },

  hasKey() { return !!(Settings.cache.groqKey || "").trim(); },

  async cacheGet(id) { return DB.get("ai", id); },
  async cachePut(id, val) { return DB.put("ai", { id, val, date: U.todayISO() }); },

  /* Raw chat call. Throws Error("NO_KEY") when no key is set. */
  async chat(messages, opts) {
    opts = opts || {};
    const key = (Settings.cache.groqKey || "").trim();
    if (!key) { const e = new Error("NO_KEY"); e.code = "NO_KEY"; throw e; }
    const body = {
      model: opts.model || AI.MODEL,
      messages,
      temperature: opts.temperature != null ? opts.temperature : 0.3,
      max_tokens: opts.maxTokens || 700
    };
    if (opts.json) body.response_format = { type: "json_object" };
    let res;
    try {
      res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
        body: JSON.stringify(body)
      });
    } catch (netErr) {
      const e = new Error("NETWORK"); e.code = "NETWORK"; throw e;
    }
    if (!res.ok) {
      const e = new Error("HTTP " + res.status);
      e.code = res.status === 401 ? "BAD_KEY" : "HTTP";
      throw e;
    }
    const j = await res.json();
    return (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content || "").trim();
  },

  /* ---------- Feynman grader: grade a teach-back explanation ---------- */
  async feynmanGrade(topicName, subject, explanation) {
    const id = "fb:" + AI.hash(subject + "|" + topicName + "|" + explanation);
    const hit = await AI.cacheGet(id);
    if (hit) return Object.assign({ cached: true }, hit.val);
    const sys = "You are a strict but encouraging JAMB examiner applying the Feynman technique. " +
      "The student explains a topic in their own words. Compare their explanation with the correct JAMB-level understanding. " +
      "Reply ONLY with JSON: {\"verdict\":\"pass\"|\"weak\",\"missing\":[\"...points the student left out\"],\"wrong\":[\"...claims that are incorrect\"],\"tip\":\"one short sentence of advice\"}. " +
      "Mark verdict 'weak' if any core idea of the topic is missing or wrong; otherwise 'pass'. Keep each list item under 15 words, maximum 4 items per list.";
    const raw = await AI.chat(
      [{ role: "system", content: sys },
       { role: "user", content: "Subject: " + subject + "\nTopic: " + topicName + "\n\nStudent's explanation:\n" + explanation }],
      { json: true, maxTokens: 500 }
    );
    const val = AI.parseJSON(raw, { verdict: "weak", missing: [], wrong: [], tip: "Could not parse the grader's reply — try again." });
    await AI.cachePut(id, val);
    return val;
  },

  /* ---------- Mistake autopsy: why was that option tempting? ---------- */
  async autopsy(question, subject, options, correctIdx, pickedIdx) {
    const id = "au:" + AI.hash(question + "|" + pickedIdx);
    const hit = await AI.cacheGet(id);
    if (hit) return Object.assign({ cached: true }, hit.val);
    const sys = "You explain exam mistakes for a Nigerian JAMB science student. One call, short output. " +
      "Reply ONLY with JSON: {\"why\":\"why the chosen wrong option was designed to be tempting, max 30 words\",\"rule\":\"the concept or rule that settles the question, max 30 words\"}.";
    const raw = await AI.chat(
      [{ role: "system", content: sys },
       { role: "user", content: "Question (" + subject + "): " + question +
         "\nOptions:\n" + options.map((o, i) => (i === correctIdx ? "✓ " : "✗ ") + "ABCD"[i] + ". " + o).join("\n") +
         "\nThe student picked option " + "ABCD"[pickedIdx] + "." }],
      { json: true, maxTokens: 250 }
    );
    const val = AI.parseJSON(raw, { why: "", rule: "" });
    await AI.cachePut(id, val);
    return val;
  },

  /* ---------- Flashcard generator: explanation -> up to 10 cards ---------- */
  async flashcards(topicName, subject, explanation) {
    const id = "fc:" + AI.hash(subject + "|" + topicName + "|" + explanation);
    const hit = await AI.cacheGet(id);
    if (hit) return Object.assign({ cached: true }, hit.val);
    const sys = "Turn the student's notes into active-recall flashcards for JAMB revision. " +
      "Reply ONLY with JSON: {\"cards\":[{\"front\":\"question\",\"back\":\"short answer\"}]} with at most 10 cards, one fact each.";
    const raw = await AI.chat(
      [{ role: "system", content: sys },
       { role: "user", content: "Subject: " + subject + "\nTopic: " + topicName + "\nNotes:\n" + explanation }],
      { json: true, maxTokens: 700 }
    );
    const val = AI.parseJSON(raw, { cards: [] });
    await AI.cachePut(id, val);
    return val;
  },

  parseJSON(raw, fallback) {
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) return fallback;
      return JSON.parse(m[0]);
    } catch (e) { return fallback; }
  },

  friendlyError(e) {
    if (!e) return "Something went wrong.";
    if (e.code === "NO_KEY" || e.message === "NO_KEY") return "Add your free Groq key in Settings first.";
    if (e.code === "BAD_KEY") return "Groq rejected that key — check it in Settings.";
    if (e.code === "NETWORK" || e.message === "NETWORK") return "No network — AI features need to be online (everything else stays offline).";
    if (e.code === "HTTP" && /429/.test(e.message || "")) return "Groq free-tier limit hit for today. Try again tomorrow — cached answers still work.";
    return "AI call failed (" + (e.message || "unknown") + ").";
  }
};

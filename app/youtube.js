/* ============================================================
   Sturdy YouTube — repair-kit concept videos + study lessons.
   Quota rules (free tier = 10,000 units/day):
   - playlistItems.list = 1 unit, videos.list = 1 unit (preferred)
   - search.list = 100 units, only on an explicit user tap
   - every result is cached in IndexedDB and never re-fetched
   Playback is a plain embed with autoplay off and no related
   videos, so watching costs zero quota.
   ============================================================ */
"use strict";

const YT = {
  slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60); },

  async cacheGet(id) { return DB.get("yt", id); },
  async cachePut(id, val) { return DB.put("yt", { id, val, date: U.todayISO() }); },

  hasKey() { return !!(Settings.cache.ytKey || "").trim(); },

  /* Call the YouTube Data API. Throws with friendly codes. */
  async api(path, params) {
    const key = (Settings.cache.ytKey || "").trim();
    if (!key) { const e = new Error("NO_KEY"); e.code = "NO_KEY"; throw e; }
    const qs = new URLSearchParams(Object.assign({}, params, { key }));
    let res;
    try {
      res = await fetch("https://www.googleapis.com/youtube/v3/" + path + "?" + qs.toString());
    } catch (netErr) {
      const e = new Error("NETWORK"); e.code = "NETWORK"; throw e;
    }
    if (!res.ok) {
      const e = new Error("HTTP " + res.status);
      e.code = res.status === 403 ? "QUOTA_OR_KEY" : "HTTP";
      throw e;
    }
    return res.json();
  },

  /* Best video for a topic. Strategy:
     1. cache
     2. user-configured playlist(s) for the subject — comma-separated
        IDs are supported, each fetch is 1 unit per 50 videos
     3. explicit search fallback (search.list = 100 units) — only when opts.allowSearch */
  async repairVideo(topicName, subject, opts) {
    opts = opts || {};
    const id = "rv:" + YT.slug(subject + "|" + topicName);
    if (!opts.force) {
      const hit = await YT.cacheGet(id);
      if (hit && hit.val && hit.val.videoId) return Object.assign({ cached: true }, hit.val);
    }

    const playlists = (Settings.cache.ytPlaylists || {});
    const plIds = String(playlists[subject] || "").split(",").map(s => s.trim()).filter(Boolean);

    if (plIds.length) {
      try {
        let vids = [];
        for (const plId of plIds) {
          const items = await YT.api("playlistItems", {
            part: "snippet", playlistId: plId, maxResults: "50"
          });
          (items.items || []).forEach(it => {
            if (it.snippet && it.snippet.resourceId) {
              vids.push({ videoId: it.snippet.resourceId.videoId, title: it.snippet.title });
            }
          });
        }
        const best = YT.bestMatch(vids, topicName);
        if (best) {
          const val = { videoId: best.videoId, title: best.title, from: "playlist" };
          await YT.cachePut(id, val);
          return val;
        }
      } catch (e) { /* fall through to search */ }
    }

    if (!opts.allowSearch) {
      const e = new Error("NO_SOURCE"); e.code = "NO_SOURCE"; throw e;
    }

    const sr = await YT.api("search", {
      part: "snippet", q: "JAMB " + subject + " " + topicName, type: "video", maxResults: "3"
    });
    const vids = (sr.items || []).map(it => ({ videoId: it.id.videoId, title: it.snippet.title }));
    if (!vids.length) { const e = new Error("NO_RESULT"); e.code = "NO_RESULT"; throw e; }
    const val = { videoId: vids[0].videoId, title: vids[0].title, from: "search", alternatives: vids.slice(1) };
    await YT.cachePut(id, val);
    return val;
  },

  /* score playlist videos by title keyword overlap with the topic */
  bestMatch(vids, topicName) {
    if (!vids.length) return null;
    const words = topicName.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2);
    let best = null, bestScore = -1;
    vids.forEach(v => {
      const t = v.title.toLowerCase();
      let score = 0;
      words.forEach(w => { if (t.indexOf(w) !== -1) score += 2; });
      if (t.indexOf("jamb") !== -1 || t.indexOf("utme") !== -1) score += 1;
      if (score > bestScore) { bestScore = score; best = v; }
    });
    return bestScore > 0 ? best : vids[0];
  },

  /* zero-quota embed: autoplay off, no related videos, optional start second */
  embed(videoId, title, start) {
    const s = start ? "&start=" + Math.max(0, Number(start) | 0) : "";
    return html`<div class="video-wrap">
      <iframe
        src="https://www.youtube-nocookie.com/embed/${videoId}?rel=0&autoplay=0${s}"
        title="${title || "Concept video"}"
        frameborder="0"
        allow="encrypted-media"
        allowfullscreen></iframe>
    </div>`;
  }
};

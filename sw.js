/* Sturdy service worker - offline-first */
const CACHE = "sturdy-v6";
const ASSETS = [
  "./", "./index.html", "./styles.css", "./app/study.css", "./manifest.webmanifest",
  "./app/core.js", "./app/ui.js", "./app/ai.js", "./app/youtube.js", "./app/badges.js", "./app/quiz.js",
  "./app/screens-today.js", "./app/screens-stats.js", "./app/screens-more.js",
  "./app/screens-syllabus.js", "./app/screens-repair.js", "./app/screens-study.js", "./app/main.js",
  "./data/week-01.js", "./data/week-02.js", "./data/week-03.js", "./data/week-04.js",
  "./data/week-05.js", "./data/week-06.js", "./data/week-07.js", "./data/week-08.js",
  "./data/week-09.js", "./data/week-10.js", "./data/week-11.js", "./data/week-12.js",
  "./data/syllabus.js", "./data/videos-bio.js",
  "./icons/icon.svg", "./icons/icon-maskable.svg"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

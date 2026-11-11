/* ============================================================
   Sturdy UI kit — html tagged template, mount, icons, widgets
   ============================================================ */
"use strict";

/* html`` tagged template. Interpolation is raw (no escaping).
   Arrays and DOM Nodes are spliced in via <!--ndN--> placeholder
   comments so event listeners attached to child nodes survive. */
function html(strings, ...vals) {
  let out = "";
  const nodeSets = [];
  strings.forEach((s, i) => {
    out += s;
    if (i >= vals.length) return;
    const v = vals[i];
    if (v == null) return;
    if (Array.isArray(v)) { out += "<!--nd" + nodeSets.length + "-->"; nodeSets.push(v); }
    else if (typeof v === "object" && v.nodeType) { out += "<!--nd" + nodeSets.length + "-->"; nodeSets.push([v]); }
    else out += String(v);
  });
  const t = document.createElement("template");
  t.innerHTML = out.trim();
  const root = t.content;
  const comments = [];
  const walker = document.createTreeWalker(root, 128); // 128 = comment nodes
  while (walker.nextNode()) comments.push(walker.currentNode);
  comments.forEach(c => {
    const m = /^nd(\d+)$/.exec(c.textContent);
    if (!m) return;
    const frag = document.createDocumentFragment();
    nodeSets[Number(m[1])].forEach(n => frag.appendChild(n));
    c.parentNode.replaceChild(frag, c);
  });
  // single root element -> return the element itself so addEventListener works
  if (root.childNodes.length === 1 && root.firstChild.nodeType === 1) return root.firstChild;
  return root;
}

function mount(container, view) {
  container.innerHTML = "";
  container.appendChild(view);
}

function ring(pct, label, sub) {
  const r = 30, c = 2 * Math.PI * r;
  const off = c * (1 - U.clamp(pct, 0, 100) / 100);
  return html`<div class="ring-wrap">
    <svg width="74" height="74" viewBox="0 0 74 74">
      <circle class="ring-bg" cx="37" cy="37" r="${r}"></circle>
      <circle class="ring-fg" cx="37" cy="37" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${off}"></circle>
    </svg>
    <div class="ring-label">${label}${sub ? html`<small>${sub}</small>` : ""}</div>
  </div>`;
}

function bar(pct, cls) {
  return html`<div class="bar ${cls || ""}"><div style="width:${U.clamp(pct, 0, 100)}%"></div></div>`;
}

const ICONS = {
  home: '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>',
  cal: '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  repeat: '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
  chart: '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7"/><path d="M2 20h20"/></svg>',
  grid: '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  shield: '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg>',
  play: '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5z" fill="currentColor" stroke="none"/></svg>',
  gear: '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/></svg>',
  flame: '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M12 2c1 4-4 6-4 11a4 4 0 0 0 8 0c0-1.5-.5-2.5-1-3.5 2 .5 4 2.5 4 5.5a7 7 0 0 1-14 0C5 8 10 6.5 12 2z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>'
};

/* returns an SVG string; html`` interpolates strings as raw HTML */
function icon(name) { return ICONS[name] || ""; }

function subjectTag(s) {
  return html`<span class="subject-tag st-${s}">${s}</span>`;
}

function emptyState(emo, title, sub) {
  return html`<div class="empty"><div class="big">${emo}</div><div style="font-weight:700">${title}</div><div class="small" style="margin-top:4px">${sub}</div></div>`;
}

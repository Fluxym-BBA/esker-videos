/* Roue + vidéos. Vue « roue » → clic sur un module → transition en iris → vue « vidéo ». */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const E = s => String(s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
  const app = $("#app"), W = $("#warp");
  const REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ICO_BACK = '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>';
  const ICO_NEXT = '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>';
  const ICO_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  let cur = "", busy = false, cleanup = null;

  /* ---------- routage : #/  ·  #/<module>  ·  #/<module>/<n° de vidéo> ---------- */
  function parse() {
    const p = location.hash.replace(/^#\/?/, "").split("/");
    return {id: byId(p[0]) ? p[0] : null, n: Math.max(1, parseInt(p[1], 10) || 1)};
  }
  function push(h) { cur = h; try { history.pushState(null, "", h); } catch (e) { location.hash = h; } }
  window.addEventListener("popstate", () => { if (location.hash !== cur) { cur = location.hash; render(); } });

  /* ---------- transition en iris ---------- */
  function warp(color, x, y, swap) {
    if (REDUCED || !W.animate) { swap(); return; }
    busy = true;
    const w = innerWidth, h = innerHeight, R = Math.hypot(Math.max(x, w - x), Math.max(y, h - y)) + 24;
    W.style.setProperty("--wc", color);
    W.style.visibility = "visible"; W.classList.remove("hold");
    const open = W.animate([{clipPath: `circle(0px at ${x}px ${y}px)`}, {clipPath: `circle(${R}px at ${x}px ${y}px)`}],
      {duration: 520, easing: "cubic-bezier(.7,0,.3,1)", fill: "forwards"});
    open.onfinish = () => {
      swap(); window.scrollTo(0, 0); W.classList.add("hold");
      setTimeout(() => {
        const cx = w / 2, cy = h / 2;
        const close = W.animate([{clipPath: `circle(${R}px at ${cx}px ${cy}px)`}, {clipPath: `circle(0px at ${cx}px ${cy}px)`}],
          {duration: 600, easing: "cubic-bezier(.7,0,.3,1)", fill: "forwards"});
        close.onfinish = () => { W.style.visibility = "hidden"; W.classList.remove("hold"); open.cancel(); close.cancel(); busy = false; };
      }, 340);
    };
  }

  /* ---------- vue « roue » ---------- */
  let hovered = null;
  function hubShow(m) {
    const svg = $("#bigWheel"); if (!svg) return;
    hovered = m.id;
    svg.classList.add("hovering", "dimmed");
    const lines = wrapTxt(m.label, 17), n = vids(m).length;
    $("#hhIcon").textContent = m.icon;
    $("#hhRing").setAttribute("fill", m.c + "22");
    const su = $("#hhSuite"); su.textContent = tx(m.suite === "S2P" ? "s2p" : "o2c"); su.setAttribute("fill", m.c);
    $("#hhName").textContent = lines[0] || "";
    $("#hhName2").textContent = lines.slice(1).join(" ") || "";
    $("#hhCtaT").textContent = tx(n ? (n > 1 ? "ctas" : "cta") : "soonCta");
    $("#hhCta rect").setAttribute("fill", m.c);
    ["S2P", "O2C"].forEach(x => { const g = $("#arc-" + x); if (g) { g.classList.toggle("lit", x === m.suite); g.classList.toggle("dim", x !== m.suite); } });
  }
  function hubReset() {
    const svg = $("#bigWheel"); if (!svg) return;
    hovered = null; svg.classList.remove("hovering", "dimmed");
    ["S2P", "O2C"].forEach(x => { const g = $("#arc-" + x); if (g) g.classList.remove("lit", "dim"); });
  }
  function openFrom(id, node) {
    if (busy) return;
    const m = byId(id), r = node.getBoundingClientRect();
    warp(m.c, r.left + r.width / 2, r.top + r.height / 2, () => { push("#/" + id); render(); });
  }
  function mountHome() {
    const list = g => `<ul>${g.map(id => { const m = byId(id), n = vids(m).length; return `<li><button type="button" data-open="${id}" class="${n ? "" : "soon"}" style="--c:${m.c}"><span aria-hidden="true">${m.icon}</span><span>${E(m.label)}<small>${E(vidNote(m))}</small></span></button></li>`; }).join("")}</ul>`;
    app.innerHTML = `<section class="home">
      <div class="home-t"><h1>${E(tx("title"))}</h1><p>${E(tx("sub"))}</p></div>
      <div class="wheel-cell" id="cell"><div class="wheel-box" id="box">${buildWheel()}</div></div>
      <div class="mlist"><h2>${E(tx("list2"))}</h2>${list(ALL_ORDER)}</div></section>`;
    const cell = $("#cell"), box = $("#box");
    const fit = () => {
      const w = cell.clientWidth, h = cell.clientHeight; if (!w) return;
      const narrow = innerWidth <= 760;
      const s = Math.max(260, Math.floor(narrow ? Math.min(w, innerHeight - 140) : Math.min(w - 8, h - 8)));
      box.style.width = box.style.height = s + "px";
    };
    fit(); window.addEventListener("resize", fit);
    let ro = null; if (window.ResizeObserver) { ro = new ResizeObserver(fit); ro.observe(cell); }
    cleanup = () => { window.removeEventListener("resize", fit); if (ro) ro.disconnect(); hovered = null; };
    $$("#bigWheel .seg").forEach(g => {
      const id = g.getAttribute("data-id"), m = byId(id);
      g.addEventListener("mouseenter", () => hubShow(m));
      g.addEventListener("focus", () => hubShow(m));
      g.addEventListener("mouseleave", hubReset);
      g.addEventListener("blur", hubReset);
      g.addEventListener("click", () => openFrom(id, g));
      g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openFrom(id, g); } });
    });
    const hh = $("#hubHover");
    if (hh) hh.addEventListener("click", () => { if (hovered) { const g = $("#seg-" + hovered); openFrom(hovered, g || hh); } });
    $$(".mlist [data-open]").forEach(b => b.addEventListener("click", () => openFrom(b.getAttribute("data-open"), b)));
  }

  /* ---------- vue « vidéo » ---------- */
  function mountModule(id, n) {
    const m = byId(id), L = vids(m), i = ALL_ORDER.indexOf(id), N = ALL_ORDER.length;
    const prev = byId(ALL_ORDER[(i + N - 1) % N]), next = byId(ALL_ORDER[(i + 1) % N]);
    const chips = ALL_ORDER.map(k => { const x = byId(k); return `<button type="button" class="chip${k === id ? " on" : ""}${vids(x).length ? "" : " soon"}" data-go="${k}" style="--c:${x.c}" title="${E(x.label)}"><i>${x.icon}</i>${E(x.code)}</button>`; }).join("");
    const desc = LANG === "en" && m.desce ? m.desce : m.desc;
    const head = `<div class="pv-head rise" style="--i:0"><span class="pv-ico" aria-hidden="true">${m.icon}</span><div><small>${tx(m.suite === "S2P" ? "s2p" : "o2c")}</small><h1>${E(m.label)}</h1></div></div>`;
    const nav = `<div class="pv-nav rise" style="--i:5">
      <button type="button" data-go="${prev.id}">${ICO_BACK.replace("<svg", '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"')}<span><small>${E(tx("prev"))}</small>${E(prev.label)}</span></button>
      <button type="button" data-go="${next.id}"><span><small>${E(tx("next"))}</small>${E(next.label)}</span>${ICO_NEXT.replace("<svg", '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"')}</button></div>`;
    const top = `<div class="pv-top rise" style="--i:0"><button type="button" class="back" id="back">${ICO_BACK}${E(tx("back"))}</button><nav class="chips" aria-label="${E(tx("other"))}">${chips}</nav></div>`;
    let body;
    if (!L.length) {
      body = `<div class="pv-grid solo"><div>${head}<div class="soonbox rise" style="--i:2"><div><h2>${E(tx("soonT"))}</h2><p>${E(tx("soonP"))}</p><p style="margin-top:14px;max-width:60ch;margin-inline:auto">${E(desc)}</p></div></div></div></div>`;
    } else {
      body = `<div class="pv-grid${L.length > 1 ? "" : " solo"}" id="pvg"><div class="pv-main">${head}
        <div class="vbox rise" style="--i:1"><video id="vid" controls controlsList="nodownload noplaybackrate" disablepictureinpicture preload="none" playsinline></video>
          <button type="button" class="cover" id="cover" aria-label="${E(tx("play"))}"><span class="play">${ICO_PLAY}</span><b id="ct"></b></button></div>
        <p class="vd" id="verr" hidden style="color:#b42318;margin-top:10px">${E(tx("err"))}</p>
        <h2 class="vt rise" style="--i:2" id="vt"></h2><p class="vd rise" style="--i:3" id="vd"></p></div>
        <aside class="side rise" style="--i:3">
          ${L.length > 1 ? `<section><h3>${E(tx("list"))}</h3><ul class="vl">${L.map((v, k) => `<li><button type="button" class="vi" data-vi="${k}"><i>${k + 1}</i><span><b>${E(v.t)}</b>${v.dur ? `<small>${E(v.dur)}</small>` : ""}</span></button></li>`).join("")}</ul></section>` : ""}
          <section class="chs" id="chs"></section></aside></div>`;
    }
    app.innerHTML = `<section class="pv" style="--c:${m.c}">${top}${body}${nav}</section>`;
    $("#back").addEventListener("click", () => { if (busy) return; const r = $("#back").getBoundingClientRect(); warp(m.c, r.left + 30, r.top + 16, () => { push("#/"); render(); }); });
    $$("[data-go]").forEach(b => b.addEventListener("click", () => { if (!busy) { push("#/" + b.getAttribute("data-go")); render(); window.scrollTo(0, 0); } }));
    if (!L.length) { cleanup = null; return; }

    const vid = $("#vid"), cover = $("#cover"), fmt = s => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
    let k = 0, pend = null;
    vid.addEventListener("contextmenu", e => e.preventDefault());
    const chapters = () => {
      const ch = L[k].ch;
      $("#chs").innerHTML = ch.length ? `<h3>${E(tx("chap"))}</h3><ol>${ch.map(x => `<li><button type="button" class="chb" data-t="${x[0]}"><time>${fmt(x[0])}</time><span>${E(x[1])}</span></button></li>`).join("")}</ol>` : "";
    };
    const seek = t => {
      const go = () => { try { vid.currentTime = t; } catch (e) { /* métadonnées pas prêtes */ } vid.play().catch(() => {}); };
      if (vid.readyState >= 1) go(); else { pend = go; vid.load(); }
    };
    const load = (j, replace) => {
      k = j; const v = L[j];
      vid.pause(); vid.removeAttribute("src"); vid.setAttribute("src", v.u); $("#verr").hidden = true;
      cover.hidden = false; $("#ct").textContent = v.t;
      $("#vt").textContent = v.t; $("#vd").textContent = v.d || (LANG === "en" && m.desce ? m.desce : m.desc);
      $$(".vi").forEach(b => b.classList.toggle("on", +b.getAttribute("data-vi") === j));
      chapters();
      if (replace) { cur = "#/" + id + (L.length > 1 ? "/" + (j + 1) : ""); try { history.replaceState(null, "", cur); } catch (e) { /* ignore */ } }
    };
    vid.addEventListener("loadedmetadata", () => { if (pend) { const f = pend; pend = null; f(); } });
    vid.addEventListener("error", () => { if (vid.getAttribute("src")) { $("#verr").hidden = false; cover.hidden = true; } });
    vid.addEventListener("timeupdate", () => {
      const ch = L[k].ch; if (!ch.length) return;
      let a = -1; ch.forEach((x, q) => { if (vid.currentTime >= x[0]) a = q; });
      $$(".chb").forEach((b, q) => b.classList.toggle("on", q === a));
    });
    cover.addEventListener("click", () => { cover.hidden = true; vid.play().catch(() => { cover.hidden = false; }); });
    $("#pvg").addEventListener("click", e => {
      const vi = e.target.closest(".vi"); if (vi) { load(+vi.getAttribute("data-vi"), true); return; }
      const ch = e.target.closest(".chb"); if (ch) { cover.hidden = true; seek(+ch.getAttribute("data-t")); }
    });
    load(Math.min(n - 1, L.length - 1), false);
    cleanup = () => { vid.pause(); };
  }

  /* ---------- rendu ---------- */
  function setLangUI() {
    document.documentElement.lang = LANG;
    document.title = tx("page");
    $$(".lang button").forEach(b => b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === LANG)));
  }
  function render() {
    if (cleanup) { try { cleanup(); } catch (e) { /* ignore */ } cleanup = null; }
    setLangUI();
    const r = parse();
    if (r.id) { mountModule(r.id, r.n); const m = byId(r.id); document.title = m.label + " | " + tx("page"); }
    else mountHome();
  }
  $$(".lang button").forEach(b => b.addEventListener("click", () => {
    LANG = b.getAttribute("data-lang");
    try { localStorage.setItem("ev-lang", LANG); } catch (e) { /* ignore */ }
    render();
  }));
  cur = location.hash;
  render();
})();

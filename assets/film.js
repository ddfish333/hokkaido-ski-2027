/* 序幕：每一天打開時的短片。畫面＝照片慢速運鏡＋飄雪＋字幕；聲音＝網頁即時生成的環境音樂（沒有音檔）。 */
(function () {
  "use strict";
  var T = window.TRIP, S = window.SCENES || {};
  var date = window.DAY; if (!T || !date) return;
  var day = T.days.filter(function (d) { return d.date === date; })[0]; if (!day) return;
  (window.Plan ? Plan.ready : Promise.resolve()).catch(function () { }).then(function () { run(); });
  function run() {
  var IMG = (window.BASE || "") + "assets/img/";
  function bg(el, spec) { var m = String(spec).match(/^(.*)@(\d+),(\d+)$/); el.style.backgroundImage = "url(" + IMG + (m ? m[1] : spec) + ")"; if (m) el.style.backgroundPosition = m[2] + "% " + m[3] + "%"; }
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var dayIdx = T.days.indexOf(day);
  var def = S[date] || {};
  var plan = (window.Plan && Plan.plan) ? Plan.schedule(date, Plan.mode()) : { stops: [] };
  function stopOf(id) { return plan.stops.filter(function (x) { return x.id === id; })[0]; }
  var scenes = def.scenes;
  if (scenes) {
    scenes = scenes.filter(function (sc) {
      if (!sc.stop) return true;
      var st = stopOf(sc.stop);
      if (!st) { if (window.console) console.warn("序幕略過：" + date + " 已經沒有站點 " + sc.stop); return false; }
      if (!sc.t) sc.t = st.time + " · " + (sc.label || st.name);
      return true;
    });
  }
  if (!scenes) {
    var p = def.poster || {};
    scenes = [
      { type: "title", eyebrow: "DAY " + (dayIdx < 9 ? "0" : "") + (dayIdx + 1) + " · HOKKAIDO", h: day.title, s: p.line || day.sub, amb: "snow", dur: 6500 },
      { type: "end", t: day.date.slice(5).replace("-", "/") + " · " + day.sub, h: p.line || day.sub, img: p.img, amb: "quiet", kb: "in", dur: 9000 }
    ];
  }

  /* ---------- DOM ---------- */
  var root = document.getElementById("film"); if (!root) return;
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var stage = el("div", "stage");
  var secs = scenes.map(function (sc, i) {
    var s = el("section", "scene" + (sc.warm ? " warm" : "") + (sc.type === "title" || sc.type === "drive" ? " cold" : ""));
    s.dataset.dur = sc.dur || 9000; s.dataset.amb = sc.amb || "snow";
    if (sc.type === "title" && !sc.img && !sc.imgs && !sc.video && def.poster && def.poster.img) { sc.img = def.poster.img; sc.kb = sc.kb || "in"; }
    if (sc.imgs && sc.imgs.length) {
      sc.imgs.forEach(function (im, k) {
        var layer = el("div", "ph multi" + (k === 0 ? " cur" : "")); bg(layer, im);
        layer.style.setProperty("--kb", "kb" + (k % 2 ? "Out" : "In")); layer.style.setProperty("--dur", Math.round((sc.dur || 9000) / sc.imgs.length + 1200) + "ms");
        s.appendChild(layer);
      });
      s.appendChild(el("div", "veil")); s.dataset.n = sc.imgs.length;
    } else if (sc.video || sc.img) {
      var ph;
      if (sc.video && !reduce) {
        ph = document.createElement("video"); ph.className = "ph"; ph.muted = true; ph.loop = true; ph.playsInline = true; ph.setAttribute("playsinline", ""); ph.setAttribute("muted", ""); ph.preload = i < 2 ? "auto" : "metadata";
        if (sc.img) ph.poster = IMG + sc.img;
        var hd = Math.max(innerWidth, innerHeight) * (devicePixelRatio || 1) > 1500 && !(navigator.connection && navigator.connection.saveData);
        var src = document.createElement("source"); src.src = (window.BASE || "") + "assets/video/" + (hd ? sc.video.replace(/\.mp4$/, "-1080.mp4") : sc.video); src.type = "video/mp4"; ph.appendChild(src);
      } else { ph = el("div", "ph"); bg(ph, sc.img); }
      ph.style.setProperty("--kb", "kb" + (sc.kb === "out" ? "Out" : sc.kb === "pan" ? "Pan" : "In")); ph.style.setProperty("--dur", (sc.dur || 9000) + "ms");
      s.appendChild(ph); s.appendChild(el("div", "veil"));
    }
    if (sc.type === "drive" && !(sc.video && !reduce)) { var c = el("canvas", "drive"); c.id = "drive"; s.appendChild(c); }
    if (sc.type === "title") {
      s.appendChild(el("div", "title", '<div><p class="eyebrow">' + esc(sc.eyebrow || "") + '</p><h2 class="big">' + esc(sc.h) + '</h2><p class="sub">' + esc(sc.s || "") + '</p></div>'));
    } else if (sc.type === "end") {
      s.appendChild(el("div", "endcard", '<div><p class="t">' + esc(sc.t || "") + '</p><h2 class="h">' + sc.h + '</h2>' + (sc.s ? '<p class="s">' + esc(sc.s) + '</p>' : "") +
        '<div class="endbtns"><button class="fbtn" id="toplan" type="button">看今天的行程 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 5v14M5 12l7 7 7-7"/></svg></button><button class="fbtn ghost" id="freplay" type="button">再看一次</button></div></div>'));
    } else {
      s.appendChild(el("div", "cap", '<p class="t">' + esc(sc.t || "") + '</p><h2 class="h">' + sc.h + '</h2>' + (sc.s ? '<p class="s">' + esc(sc.s) + '</p>' : "")));
    }
    stage.appendChild(s); return s;
  });
  var snow = el("canvas", "snow"); stage.appendChild(snow);

  /* ---------- 全畫面霧玻璃路線圖：海岸線＋全程路線＋當天路線＋地名，鏡頭跟著均速移動的光點 ---------- */
  var RM = { svg: null, pts: [], pos: 0, target: 0, cam: null, camT: null, lastT: 0, raf: null,
    level: (function () { try { return localStorage.getItem("snow13-rmap") || "mid"; } catch (e) { return "mid"; } })() };
  var sched = plan.stops.length ? plan : null;
  var COSL = Math.cos(43.3 * Math.PI / 180);
  function proj(lon, lat) { return [lon * COSL, -lat]; }
  var TOWNS = [["札幌", 43.062, 141.354, 2], ["小樽", 43.191, 140.994, 2], ["千歲", 42.822, 141.652, 1], ["銭函", 43.145, 141.148, 1], ["余市", 43.195, 140.785, 1], ["旭川", 43.771, 142.365, 2], ["富良野", 43.342, 142.383, 2], ["美瑛", 43.588, 142.467, 1], ["上富良野", 43.455, 142.467, 1], ["白金溫泉", 43.463, 142.633, 1], ["定山溪", 42.967, 141.164, 1], ["手稻", 43.118, 141.247, 1], ["岩見沢", 43.196, 141.776, 1], ["滝川", 43.558, 141.911, 1], ["深川", 43.72, 142.04, 1], ["石狩", 43.17, 141.32, 1], ["江別", 43.10, 141.55, 1], ["恵庭", 42.88, 141.58, 1], ["北広島", 42.985, 141.563, 1], ["朝里", 43.17, 141.05, 1], ["赤井川", 43.08, 140.82, 1], ["石狩灣", 43.30, 141.20, 0], ["日本海", 43.45, 140.75, 0]];
  /* 路線座標太密（全部 1.9 萬點），每一格都要重畫 SVG 會抖；先用 Douglas–Peucker 抽稀 */
  function simplify(pts, tol) {
    if (pts.length < 3) return pts;
    var keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1; var stack = [[0, pts.length - 1]], t2 = tol * tol;
    while (stack.length) {
      var seg = stack.pop(), a = seg[0], b = seg[1], best = -1, bd = 0;
      var ax = pts[a][0], ay = pts[a][1], dx = pts[b][0] - ax, dy = pts[b][1] - ay, len2 = dx * dx + dy * dy;
      for (var i = a + 1; i < b; i++) {
        var px = pts[i][0] - ax, py = pts[i][1] - ay, t = len2 ? Math.max(0, Math.min(1, (px * dx + py * dy) / len2)) : 0;
        var ex = px - t * dx, ey = py - t * dy, d = ex * ex + ey * ey;
        if (d > bd) { bd = d; best = i; }
      }
      if (bd > t2 && best > 0) { keep[best] = 1; stack.push([a, best], [best, b]); }
    }
    var out = []; for (var k = 0; k < pts.length; k++) if (keep[k]) out.push(pts[k]);
    return out;
  }
  function buildRouteMap(outline) {
    if (!sched || !window.Plan) return;
    var stops = sched.stops, legs = sched.legs, pts = [], markers = [];
    stops.forEach(function (st, i) {
      if (i === 0) { pts.push(proj(st.lon, st.lat)); markers.push(0); return; }
      var g = legs[i - 1].geom || [[stops[i - 1].lon, stops[i - 1].lat], [st.lon, st.lat]];
      var seg = simplify(g.map(function (c) { return proj(c[0], c[1]); }), 0.00006);
      seg.forEach(function (q, k) { if (k === 0) return; pts.push(q); });
      markers.push(pts.length - 1);
    });
    var cum = [0]; for (var i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    RM.pts = pts; RM.cum = cum; RM.markers = markers; RM.total = cum[cum.length - 1] || 1;
    /* 均速：一整天的路線在 22 秒內走完，所以長的腿跑得久、短的腿一下就到 */
    var NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg"); svg.setAttribute("class", "rmap"); svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    function mk(tag, cls, attrs) { var e = document.createElementNS(NS, tag); if (cls) e.setAttribute("class", cls); Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); }); return e; }
    var gLand = mk("g", "rm-g-land"), gAll = mk("g", "rm-g-all"), gRoute = mk("g", "rm-g-route"), gPts = mk("g", "rm-g-pts"), gLab = mk("g", "rm-g-lab");
    [gLand, gAll, gRoute, gPts, gLab].forEach(function (g) { svg.appendChild(g); });
    if (outline) {
      var d = "";
      outline.geometry.coordinates.forEach(function (poly) { poly.forEach(function (ring) { ring.forEach(function (c, k) { var q = proj(c[0], c[1]); d += (k ? "L" : "M") + q[0].toFixed(3) + " " + q[1].toFixed(3); }); d += "Z"; }); });
      gLand.appendChild(mk("path", "rm-land", { d: d }));
    }
    /* 其他天的路線當成「道路」底紋 */
    try {
      Object.keys(Plan.plan.days).forEach(function (dt) { if (dt === date) return; var sc = Plan.schedule(dt, "normal"); sc.legs.forEach(function (l) { if (!l.geom) return; var sp = simplify(l.geom.map(function (c) { return proj(c[0], c[1]); }), 0.00025); gAll.appendChild(mk("path", "rm-other", { d: sp.map(function (q, k) { return (k ? "L" : "M") + q[0].toFixed(4) + " " + q[1].toFixed(4); }).join("") })); }); });
    } catch (e) { }
    var rd = pts.map(function (q, k) { return (k ? "L" : "M") + q[0].toFixed(4) + " " + q[1].toFixed(4); }).join("");
    gRoute.appendChild(mk("path", "rm-casing", { d: rd })); gRoute.appendChild(mk("path", "rm-route", { d: rd }));
    RM.trail = mk("path", "rm-trail", { d: rd, pathLength: 1000, "stroke-dasharray": "1000 1000", "stroke-dashoffset": 1000 }); gRoute.appendChild(RM.trail);
    markers.forEach(function (mi) { gPts.appendChild(mk("circle", "rm-stop", { cx: pts[mi][0], cy: pts[mi][1] })); });
    /* 光點和光暈：大小全部由 CSS 的 --u 決定（見 style.css），這裡只搬位置；光暈的呼吸用 CSS transform，不再每格改 SVG 屬性 */
    RM.glow = mk("circle", "rm-glow", {}); gPts.appendChild(RM.glow);
    RM.dot = mk("circle", "rm-dot", {}); gPts.appendChild(RM.dot);
    /* 地名：城鎮、當天站點、其他地點 */
    function label(name, lon, lat, cls, dy) { var q = proj(lon, lat); var t = mk("text", "rm-label " + cls, { x: q[0], y: q[1] }); t.textContent = name; t.dataset.dy = dy || 0; gLab.appendChild(t); }
    TOWNS.forEach(function (t) { label(t[0], t[2], t[1], "town t" + t[3], 0); });
    (T.places || []).forEach(function (p) {
      if (!p.lat || !p.lon || /food|hospital/.test(p.type)) return;
      var near = stops.some(function (st) { return Math.abs(st.lat - p.lat) < 0.004 && Math.abs(st.lon - p.lon) < 0.005; });
      if (!near) label(p.name.replace(/（.*?）/g, ""), p.lon, p.lat, "poi", 0);
    });
    stops.forEach(function (st, i) { if (i && markers[i] === markers[i - 1]) return; label(st.name.replace(/（.*?）/g, ""), st.lon, st.lat, "stop", 0); });
    RM.svg = svg; RM.labels = gLab.querySelectorAll("text"); RM.groups = [gLand, gAll, gRoute, gPts, gLab];
    var box = el("div", "rmap-box " + RM.level); box.appendChild(svg); stage.appendChild(box); RM.box = box; root.classList.add("rm-" + RM.level);
    /* 鏡頭：先看整條路線，之後跟著光點 */
    var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
    RM.fit = { cx: (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2, cy: (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2, w: Math.max(Math.max.apply(null, xs) - Math.min.apply(null, xs), Math.max.apply(null, ys) - Math.min.apply(null, ys)) * 1.9 + 0.08 };
    RM.cam = { cx: RM.fit.cx, cy: RM.fit.cy, w: RM.fit.w }; RM.camT = { cx: RM.fit.cx, cy: RM.fit.cy, w: RM.fit.w };
    RM.pos = 0; RM.target = 0; RM.moveFrom = 0; RM.moveDur = 0; RM.lastT = performance.now();
    renderCam(); RM.raf = requestAnimationFrame(rmTick);
  }
  function pointAt(dist) {
    var pts = RM.pts, cum = RM.cum; if (!pts.length) return null;
    dist = Math.max(0, Math.min(RM.total, dist));
    var i = 1; while (i < cum.length && cum[i] < dist) i++;
    if (i >= cum.length) return pts[pts.length - 1];
    var t = (dist - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1);
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t];
  }
  var lastU = 0;
  function renderCam() {
    var c = RM.cam, ar = innerWidth / innerHeight, w = c.w, h = w / ar;
    /* 手機：光點放在畫面上半，字幕在下面 */
    var oy = innerWidth < 760 ? h * 0.12 : 0;
    var vb = [(c.cx - w / 2).toFixed(5), (c.cy - h / 2 + oy).toFixed(5), w.toFixed(5), h.toFixed(5)].join(" ");
    if (vb !== RM.lastVB) { RM.svg.setAttribute("viewBox", vb); RM.lastVB = vb; }
    /* 1 單位 = 1 CSS 像素：線寬、字級、點的大小都寫在 CSS 裡乘上 --u，所以每格只改一個變數，不碰幾十個元素 */
    var u = w / innerWidth * (innerWidth < 760 ? 1 : 1.15);
    if (Math.abs(u - lastU) < lastU * 0.004) return;
    lastU = u;
    RM.svg.style.setProperty("--u", u.toFixed(7));
    var zoomIn = w < (innerWidth < 760 ? 0.36 : 0.5); /* 拉近時才顯示小地點 */
    if (zoomIn !== RM.zoomIn) { RM.zoomIn = zoomIn; RM.svg.classList.toggle("zoomin", zoomIn); }
  }
  function setDot(dist) {
    RM.pos = dist; var q = pointAt(dist); if (!q) return;
    RM.dot.setAttribute("cx", q[0]); RM.dot.setAttribute("cy", q[1]); RM.glow.setAttribute("cx", q[0]); RM.glow.setAttribute("cy", q[1]);
    RM.trail.setAttribute("stroke-dashoffset", (1000 * (1 - dist / RM.total)).toFixed(2));
    return q;
  }
  function rmTick(now) {
    RM.raf = requestAnimationFrame(rmTick);
    var dt = Math.min(0.1, (now - RM.lastT) / 1000); RM.lastT = now;
    /* 光點：照牆上時鐘走（起點、終點、幾秒到），不是一格一格累加；畫面掉格或分頁被降速，時間到還是剛好抵達 */
    if (RM.pos !== RM.target) {
      var k0 = RM.moveDur > 0 ? Math.min(1, (now - RM.moveT0) / 1000 / RM.moveDur) : 1;
      RM.pos = RM.moveFrom + (RM.target - RM.moveFrom) * k0;
      if (k0 >= 1) RM.pos = RM.target;
    }
    var q;
    if (RM.pos !== RM.drawn) { q = setDot(RM.pos); RM.drawn = RM.pos; } else { q = pointAt(RM.pos); }
    /* 鏡頭：跟著光點，平滑追上 */
    if (RM.follow && q) { RM.camT.cx = q[0]; RM.camT.cy = q[1]; }
    var k = 1 - Math.pow(0.001, dt); /* 每秒追近 99.9%…的指數平滑 */
    RM.cam.cx += (RM.camT.cx - RM.cam.cx) * k * 0.6; RM.cam.cy += (RM.camT.cy - RM.cam.cy) * k * 0.6; RM.cam.w += (RM.camT.w - RM.cam.w) * k * 0.5;
    var eps = RM.cam.w * 1e-4;
    if (Math.abs(RM.camT.cx - RM.cam.cx) < eps) RM.cam.cx = RM.camT.cx; if (Math.abs(RM.camT.cy - RM.cam.cy) < eps) RM.cam.cy = RM.camT.cy; if (Math.abs(RM.camT.w - RM.cam.w) < eps) RM.cam.w = RM.camT.w;
    var key = RM.cam.cx + "," + RM.cam.cy + "," + RM.cam.w;
    if (key !== RM.camKey) { RM.camKey = key; renderCam(); }
  }
  /* 均速：這一趟的距離除以可用秒數，中途不加速不減速；時間到剛好抵達 */
  function goStop(stopIdx, zoomW, secs) {
    if (!RM.svg) return;
    RM.target = RM.cum[RM.markers[Math.max(0, Math.min(stopIdx, RM.markers.length - 1))]];
    RM.moveFrom = RM.pos; RM.moveT0 = performance.now(); RM.moveDur = RM.target === RM.pos ? 0 : Math.max(0.8, secs || 3);
    RM.follow = true; RM.camT.w = zoomW;
  }
  /* 每一幕對應到時間表上的第幾站（同一地點重複時依序往後找） */
  var sceneStop = [], lastIdx = 0;
  scenes.forEach(function (sc) {
    var idx = null;
    if (sc.stop && sched) { for (var k = lastIdx; k < sched.stops.length; k++) if (sched.stops[k].id === sc.stop) { idx = k; break; } if (idx == null) idx = lastIdx; lastIdx = idx; }
    sceneStop.push(idx);
  });
  function nextStopAfter(i) { for (var k = i + 1; k < sceneStop.length; k++) if (sceneStop[k] != null) return sceneStop[k]; return null; }
  var ZOOM_REST = innerWidth < 760 ? 0.22 : 0.4, ZOOM_MOVE = innerWidth < 760 ? 0.34 : 0.6; /* 畫面寬（投影單位，約 1 單位 = 110 km） */
  function syncDot(i) {
    if (!RM.svg) return;
    var sc = scenes[i], idx = sceneStop[i];
    if (sc.type === "title") { RM.follow = false; RM.camT.cx = RM.fit.cx; RM.camT.cy = RM.fit.cy; RM.camT.w = RM.fit.w; RM.target = 0; RM.moveFrom = RM.pos; RM.moveT0 = performance.now(); RM.moveDur = RM.pos ? 1.2 : 0; return; }
    var dur = (sc.dur || 9000) / 1000;
    if (idx != null) { goStop(idx, ZOOM_REST, Math.min(5, Math.max(1.8, dur * 0.55))); return; }
    if (sc.type === "drive") { var nx = nextStopAfter(i); if (nx != null) goStop(nx, ZOOM_MOVE, Math.max(2, dur - 1.2)); return; }
    /* 其他沒有站點的幕：光點停在原地 */
  }
  addEventListener("resize", function () { lastU = 0; if (RM.svg) renderCam(); }, { passive: true });
  fetch((window.BASE || "") + "data/hokkaido.json").then(function (r) { return r.json(); }).then(buildRouteMap).catch(function () { buildRouteMap(null); });
  var chrome = el("div", "chrome");
  chrome.innerHTML = '<div class="prog">' + scenes.map(function () { return "<i></i>"; }).join("") + '</div><p class="fbrand">北海道 · 雪上的大小腳印</p>' +
    '<div class="tools"><button class="ic" id="fmute" aria-label="靜音"><svg class="on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11"/></svg><svg class="off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" hidden><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l4 6M21 9l-4 6"/></svg></button>' +
    '<button class="ic" id="frmap" aria-label="路線圖濃淡"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3z"/><path d="M9 4v13M15 7v13"/></svg></button><button class="ic" id="fskip" aria-label="跳過"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 5l10 7-10 7zM19 5v14"/></svg></button></div>' +
    '<div class="tap"><button id="fprev" aria-label="上一幕"></button><button id="fnext" aria-label="下一幕"></button></div><p class="hint">點右邊下一幕 · 左邊上一幕</p><button class="fdown" id="fdown" type="button" aria-label="往下看行程"><span>往下看行程</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 10l6 6 6-6"/></svg></button>';
  chrome.hidden = true;
  root.appendChild(stage); root.appendChild(chrome);
  var bars = chrome.querySelectorAll(".prog i"), hint = chrome.querySelector(".hint");

  /* ---------- 飄雪 ---------- */
  var sx = snow.getContext("2d"), flakes = [], W = 0, H = 0, snowAmt = 1, wind = 0.15, DPR = Math.min(devicePixelRatio || 1, 2);
  function resize() { W = snow.width = innerWidth * DPR; H = snow.height = innerHeight * DPR; var n = reduce ? 0 : Math.round(Math.min(260, innerWidth * innerHeight / 5200)); flakes = []; for (var i = 0; i < n; i++) flakes.push(mk(true)); }
  function mk(any) { var z = Math.random(); return { x: Math.random() * W, y: any ? Math.random() * H : -10, z: z, r: (0.6 + z * 2.2) * DPR, vy: (0.35 + z * 1.1) * DPR, vx: (Math.random() - .5) * .4 * DPR, o: .35 + z * .55, p: Math.random() * 6.28 }; }
  addEventListener("resize", resize, { passive: true }); resize();
  function snowTick() {
    sx.clearRect(0, 0, W, H); sx.fillStyle = "#fff";
    for (var i = 0; i < flakes.length; i++) { var f = flakes[i]; f.p += .01; f.x += f.vx + Math.sin(f.p) * .3 * DPR + wind * f.z; f.y += f.vy * snowAmt;
      if (f.y > H + 10 || f.x < -20 || f.x > W + 20) { flakes[i] = mk(false); continue; }
      sx.globalAlpha = f.o * Math.min(1, snowAmt + .2); sx.beginPath(); sx.arc(f.x, f.y, f.r, 0, 6.28); sx.fill(); }
    sx.globalAlpha = 1;
  }
  /* ---------- 夜路（純程式） ---------- */
  var dc = document.getElementById("drive"), dx = dc && dc.getContext("2d"), streaks = [], driveOn = false, dW = 0, dH = 0;
  function mkS(any) { return { a: Math.random() * 6.283, d: any ? Math.random() : 0.02 + Math.random() * .08, s: .004 + Math.random() * .012, r: .6 + Math.random() * 1.4 }; }
  function driveResize() { if (!dc) return; dW = dc.width = innerWidth * DPR; dH = dc.height = innerHeight * DPR; streaks = []; for (var i = 0; i < (reduce ? 0 : 220); i++) streaks.push(mkS(true)); }
  addEventListener("resize", driveResize, { passive: true }); driveResize();
  function driveTick() {
    var cx = dW * .5, cy = dH * .58;
    dx.fillStyle = "#03050A"; dx.fillRect(0, 0, dW, dH);
    var g = dx.createRadialGradient(cx, cy, 0, cx, cy, dH * .9); g.addColorStop(0, "rgba(120,140,170,.28)"); g.addColorStop(.35, "rgba(60,75,100,.10)"); g.addColorStop(1, "rgba(0,0,0,0)"); dx.fillStyle = g; dx.fillRect(0, 0, dW, dH);
    dx.fillStyle = "#0E121A"; dx.beginPath(); dx.moveTo(cx - dW * .02, cy); dx.lineTo(cx + dW * .02, cy); dx.lineTo(cx + dW * .9, dH); dx.lineTo(cx - dW * .9, dH); dx.closePath(); dx.fill();
    dx.fillStyle = "rgba(200,210,225,.08)";
    dx.beginPath(); dx.moveTo(cx - dW * .02, cy); dx.lineTo(cx - dW * 1.1, dH); dx.lineTo(cx - dW * 1.4, dH); dx.lineTo(cx - dW * .03, cy); dx.fill();
    dx.beginPath(); dx.moveTo(cx + dW * .02, cy); dx.lineTo(cx + dW * 1.1, dH); dx.lineTo(cx + dW * 1.4, dH); dx.lineTo(cx + dW * .03, cy); dx.fill();
    dx.strokeStyle = "rgba(230,200,120,.35)"; dx.lineWidth = 2 * DPR; dx.setLineDash([18 * DPR, 26 * DPR]); dx.lineDashOffset = -(performance.now() / 6) % 1000;
    dx.beginPath(); dx.moveTo(cx, cy); dx.lineTo(cx, dH); dx.stroke(); dx.setLineDash([]);
    dx.strokeStyle = "#fff";
    for (var i = 0; i < streaks.length; i++) { var s = streaks[i]; s.d += s.s * (1 + s.d * 3); if (s.d > 1.3) { streaks[i] = mkS(false); continue; }
      var x = cx + Math.cos(s.a) * s.d * dW * .9, y = cy + Math.sin(s.a) * s.d * dH * .9, len = Math.min(40, s.d * s.d * 60) * DPR;
      dx.globalAlpha = Math.min(.9, s.d * .9); dx.lineWidth = s.r * DPR * (0.5 + s.d); dx.beginPath(); dx.moveTo(x, y); dx.lineTo(cx + Math.cos(s.a) * (s.d * dW * .9 + len), cy + Math.sin(s.a) * (s.d * dH * .9 + len)); dx.stroke(); }
    dx.globalAlpha = 1;
  }
  var raf; function loop() { snowTick(); if (driveOn && dx) driveTick(); raf = requestAnimationFrame(loop); }

  /* ---------- 環境音樂（Web Audio 即時生成） ---------- */
  var AC = null, master = null, muted = false, music = null, ended = false;
  function impulse(ctx, sec, decay) { var rate = ctx.sampleRate, len = rate * sec, buf = ctx.createBuffer(2, len, rate); for (var c = 0; c < 2; c++) { var d = buf.getChannelData(c); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); } return buf; }
  function noiseBuf(ctx, sec) { var rate = ctx.sampleRate, len = rate * sec, buf = ctx.createBuffer(1, len, rate), d = buf.getChannelData(0), b0 = 0, b1 = 0, b2 = 0; for (var i = 0; i < len; i++) { var w = Math.random() * 2 - 1; b0 = .99765 * b0 + w * .099; b1 = .963 * b1 + w * .2965; b2 = .57 * b2 + w * 1.0526; d[i] = (b0 + b1 + b2 + w * .1848) * .11; } return buf; }
  function F(n) { return 440 * Math.pow(2, (n - 69) / 12); }
  var CHORDS = [[50, 57, 61, 66], [47, 54, 57, 62], [43, 50, 54, 59], [45, 52, 57, 61]], PENTA = [62, 64, 66, 69, 71, 74, 76, 78, 81, 83, 86];
  function startMusic() {
    if (music) return;
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = 0; master.connect(AC.destination); master.gain.linearRampToValueAtTime(muted ? 0 : .9, AC.currentTime + 4);
    var rev = AC.createConvolver(); rev.buffer = impulse(AC, 3.4, 2.6); var revG = AC.createGain(); revG.gain.value = .55; rev.connect(revG); revG.connect(master);
    var dry = AC.createGain(); dry.gain.value = .8; dry.connect(master);
    var padLP = AC.createBiquadFilter(); padLP.type = "lowpass"; padLP.frequency.value = 720; padLP.Q.value = .4; var padG = AC.createGain(); padG.gain.value = .11; padLP.connect(padG); padG.connect(dry); padG.connect(rev);
    var voices = [];
    function chord(i) { var t = AC.currentTime; voices.forEach(function (v) { v.g.gain.cancelScheduledValues(t); v.g.gain.setValueAtTime(v.g.gain.value, t); v.g.gain.linearRampToValueAtTime(0, t + 3.5); v.o1.stop(t + 3.6); v.o2.stop(t + 3.6); }); voices = [];
      CHORDS[i % CHORDS.length].forEach(function (n) { var g = AC.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + 3.2); g.connect(padLP); var o1 = AC.createOscillator(), o2 = AC.createOscillator(); o1.type = "triangle"; o2.type = "sine"; o1.frequency.value = F(n); o2.frequency.value = F(n) * 1.003; o1.detune.value = -4; o1.connect(g); o2.connect(g); o1.start(t); o2.start(t); voices.push({ g: g, o1: o1, o2: o2 }); }); }
    var ci = 0; chord(0); var chordIv = setInterval(function () { ci++; chord(ci); }, 9000);
    var plG = AC.createGain(); plG.gain.value = .5; plG.connect(rev); var plD = AC.createGain(); plD.gain.value = .35; plG.connect(plD); plD.connect(dry); var lastN = -1, pluckT;
    function pluck() { if (!AC || ended) return; var t = AC.currentTime, n; do { n = PENTA[Math.floor(Math.random() * PENTA.length)]; } while (n === lastN); lastN = n;
      var g = AC.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.16, t + .012); g.gain.exponentialRampToValueAtTime(.0008, t + 3.2); g.connect(plG);
      var o = AC.createOscillator(); o.type = "sine"; o.frequency.value = F(n); o.connect(g); var h = AC.createOscillator(); h.type = "triangle"; h.frequency.value = F(n) * 2; var hg = AC.createGain(); hg.gain.setValueAtTime(.08, t); hg.gain.exponentialRampToValueAtTime(.0005, t + .9); h.connect(hg); hg.connect(g);
      o.start(t); h.start(t); o.stop(t + 3.3); h.stop(t + 1); pluckT = setTimeout(pluck, 1400 + Math.random() * 3200); }
    pluckT = setTimeout(pluck, 2500);
    var wsrc = AC.createBufferSource(); wsrc.buffer = noiseBuf(AC, 6); wsrc.loop = true; var wbp = AC.createBiquadFilter(); wbp.type = "bandpass"; wbp.frequency.value = 380; wbp.Q.value = .7; var wG = AC.createGain(); wG.gain.value = 0; wsrc.connect(wbp); wbp.connect(wG); wG.connect(dry); wsrc.start();
    var lfo = AC.createOscillator(); lfo.frequency.value = .045; var lfoG = AC.createGain(); lfoG.gain.value = 160; lfo.connect(lfoG); lfoG.connect(wbp.frequency); lfo.start();
    var fG = AC.createGain(); fG.gain.value = 0; fG.connect(dry); var crackT;
    function crack() { if (!AC) return; var t = AC.currentTime, src = AC.createBufferSource(); src.buffer = noiseBuf(AC, .08); var hp = AC.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1800 + Math.random() * 2500; var g = AC.createGain(); g.gain.setValueAtTime(.5 + Math.random() * .9, t); g.gain.exponentialRampToValueAtTime(.001, t + .03 + Math.random() * .06); src.connect(hp); hp.connect(g); g.connect(fG); src.start(t); crackT = setTimeout(crack, 40 + Math.random() * 420); }
    crack();
    var eng = AC.createOscillator(); eng.type = "sawtooth"; eng.frequency.value = 46; var eLP = AC.createBiquadFilter(); eLP.type = "lowpass"; eLP.frequency.value = 110; var eG = AC.createGain(); eG.gain.value = 0; eng.connect(eLP); eLP.connect(eG); eG.connect(dry); eng.start();
    music = {
      setAmb: function (kind) { var t = AC.currentTime, w = kind === "snow" ? .05 : kind === "drive" ? .09 : .02, f = kind === "fire" ? .06 : 0, e = kind === "drive" ? .07 : 0;
        wG.gain.cancelScheduledValues(t); wG.gain.setTargetAtTime(w, t, 1.5); fG.gain.cancelScheduledValues(t); fG.gain.setTargetAtTime(f, t, 2); eG.gain.cancelScheduledValues(t); eG.gain.setTargetAtTime(e, t, 2); },
      setMuted: function (m) { muted = m; master.gain.cancelScheduledValues(AC.currentTime); master.gain.setTargetAtTime(m ? 0 : .9, AC.currentTime, .4); },
      fadeOut: function () { master.gain.cancelScheduledValues(AC.currentTime); master.gain.setTargetAtTime(0, AC.currentTime, 2.5); setTimeout(function () { clearInterval(chordIv); clearTimeout(pluckT); clearTimeout(crackT); try { AC.close(); } catch (e) { } AC = null; music = null; }, 7000); }
    };
  }

  /* ---------- 播放控制 ---------- */
  var cur = -1, timer = null, started = false, cycleT = null;
  function show(i) {
    if (i < 0) i = 0; if (i >= secs.length) i = secs.length - 1;
    clearTimeout(timer);
    secs.forEach(function (s, k) { s.classList.toggle("on", k === i); });
    bars.forEach(function (b, k) { b.classList.toggle("done", k < i); b.classList.toggle("live", k === i); b.style.setProperty("--dur", secs[i].dataset.dur + "ms"); });
    var s = secs[i];
    s.querySelectorAll(".cap > *, .title > div > *, .endcard .t, .endcard .h, .endcard .s, .fbtn, .ph").forEach(function (e) { e.style.animation = "none"; void e.offsetWidth; e.style.animation = ""; });
    cur = i; chrome.classList.toggle("last", i === secs.length - 1); syncDot(i);
    secs.forEach(function (sec, k) { var v = sec.querySelector("video.ph"); if (!v) return; if (k === i) { try { v.currentTime = 0; var pr = v.play(); if (pr && pr.catch) pr.catch(function () { }); } catch (e) { } } else if (!v.paused) v.pause(); });
    var nx = secs[i + 1] && secs[i + 1].querySelector("video.ph"); if (nx && nx.preload !== "auto") { nx.preload = "auto"; try { nx.load(); } catch (e) { } }
    var amb = s.dataset.amb; driveOn = amb === "drive";
    snowAmt = amb === "fire" ? .35 : amb === "quiet" ? .5 : amb === "drive" ? 0 : 1; wind = amb === "drive" ? 0 : .15 + Math.random() * .4;
    if (music) music.setAmb(amb);
    var dur = reduce ? Math.min(5000, +s.dataset.dur) : +s.dataset.dur;
    clearInterval(cycleT);
    if (+s.dataset.n > 1) {
      var layers = s.querySelectorAll(".ph.multi"), k = 0, step = Math.round(dur / layers.length);
      layers.forEach(function (l, j) { l.classList.toggle("cur", j === 0); l.style.animation = "none"; void l.offsetWidth; l.style.animation = ""; });
      cycleT = setInterval(function () { k = (k + 1) % layers.length; layers.forEach(function (l, j) { l.classList.toggle("cur", j === k); if (j === k) { l.style.animation = "none"; void l.offsetWidth; l.style.animation = ""; } }); if (k === layers.length - 1) clearInterval(cycleT); }, step);
    }
    pausedAt = performance.now();
    if (i < secs.length - 1) timer = setTimeout(function () { show(i + 1); }, dur); else finish();
    if (i > 0) hint.style.opacity = 0;
  }
  function start(withSound) {
    if (started) return; started = true;
    if (withSound) { try { startMusic(); } catch (e) { } }
    chrome.hidden = false;
    raf = requestAnimationFrame(loop);
    setTimeout(function () { show(0); }, 300);
    setTimeout(function () { hint.style.opacity = 0; }, 6000);
  }
  /* 序幕放在頁面最上面，不擋頁面：結束就停在結尾卡，「看今天的行程」只是往下捲 */
  function finish() {
    if (ended) return; ended = true; clearTimeout(timer); clearInterval(cycleT);
    if (music) music.fadeOut();
    document.dispatchEvent(new CustomEvent("film:end"));
  }
  function toPlan() { var t = document.getElementById("dayhead") || root.nextElementSibling; if (t) t.scrollIntoView({ behavior: "smooth", block: "start" }); }
  function replay() { ended = false; if (RM.svg) { RM.pos = 0; RM.target = 0; RM.moveFrom = 0; RM.moveDur = 0; RM.drawn = -1; } show(0); }
  /* 捲離畫面就暫停（影片、計時、雪、地圖），捲回來再從這一幕繼續 */
  var paused = false, pausedAt = 0, pausedLeft = 0;
  function pauseFilm() {
    if (paused || !started || ended) return; paused = true;
    pausedLeft = Math.max(800, (+secs[cur].dataset.dur) - (performance.now() - pausedAt)); clearTimeout(timer); clearInterval(cycleT);
    secs.forEach(function (sec) { var v = sec.querySelector("video.ph"); if (v && !v.paused) try { v.pause(); } catch (e) { } });
    cancelAnimationFrame(raf); cancelAnimationFrame(RM.raf); RM.raf = null; RM.pausedAt = performance.now();
    if (AC) try { AC.suspend(); } catch (e) { }
    root.classList.add("paused");
  }
  function resumeFilm() {
    if (!paused) return; paused = false; root.classList.remove("paused");
    var v = secs[cur] && secs[cur].querySelector("video.ph"); if (v) { try { var pr = v.play(); if (pr && pr.catch) pr.catch(function () { }); } catch (e) { } }
    raf = requestAnimationFrame(loop); if (RM.svg && !RM.raf) { RM.lastT = performance.now(); if (RM.pausedAt) RM.moveT0 += performance.now() - RM.pausedAt; RM.pausedAt = 0; RM.raf = requestAnimationFrame(rmTick); }
    if (AC && !muted) try { AC.resume(); } catch (e) { }
    pausedAt = performance.now() - ((+secs[cur].dataset.dur) - pausedLeft);
    if (cur < secs.length - 1) timer = setTimeout(function () { show(cur + 1); }, pausedLeft);
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) resumeFilm(); else pauseFilm(); }); }, { threshold: 0.15 }).observe(root);
  }
  function updMute() { chrome.querySelector(".on").hidden = muted; chrome.querySelector(".off").hidden = !muted; }
  chrome.querySelector("#fnext").addEventListener("click", function () { if (ended && cur >= secs.length - 1) return; show(cur + 1); });
  chrome.querySelector("#fprev").addEventListener("click", function () { if (ended) ended = false; show(cur - 1); });
  chrome.querySelector("#fskip").addEventListener("click", toPlan);
  chrome.querySelector("#fdown").addEventListener("click", toPlan);
  chrome.querySelector("#frmap").addEventListener("click", function () {
    var order = ["mid", "strong", "off", "light"]; RM.level = order[(order.indexOf(RM.level) + 1) % order.length];
    try { localStorage.setItem("snow13-rmap", RM.level); } catch (e) { }
    if (RM.box) RM.box.setAttribute("class", "rmap-box " + RM.level);
    order.forEach(function (l) { root.classList.remove("rm-" + l); }); root.classList.add("rm-" + RM.level);
    hint.textContent = "路線圖：" + { light: "淡", mid: "中", strong: "濃", off: "關" }[RM.level]; hint.style.opacity = 1; setTimeout(function () { hint.style.opacity = 0; }, 1500);
  });
  stage.addEventListener("click", function (e) { if (e.target.closest("#toplan")) toPlan(); if (e.target.closest("#freplay")) replay(); });
  chrome.querySelector("#fmute").addEventListener("click", function () { muted = !muted; if (!music && !muted) { try { startMusic(); music.setAmb(secs[cur] ? secs[cur].dataset.amb : "snow"); } catch (e) { } } else if (music) music.setMuted(muted); updMute(); });
  addEventListener("keydown", function (e) { if (!started || ended || paused) return; if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; if (e.key === "ArrowRight") { e.preventDefault(); show(cur + 1); } if (e.key === "ArrowLeft") show(cur - 1); });
  document.addEventListener("visibilitychange", function () { if (AC) { document.hidden ? AC.suspend() : AC.resume(); } });
  scenes.forEach(function (sc) { (sc.imgs || (sc.img ? [sc.img] : [])).forEach(function (u) { var im = new Image(); im.src = IMG + String(u).split("@")[0]; }); });
  /* 序幕結束時停掉所有影片 */
  document.addEventListener("film:end", function () { secs.forEach(function (sec) { var v = sec.querySelector("video.ph"); if (v) try { v.pause(); } catch (e) { } }); });
  muted = true; updMute(); start(false);
  }
})();

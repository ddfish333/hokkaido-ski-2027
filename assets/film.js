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
  var gate = el("div", "gate");
  if (def.poster && def.poster.img) { var gph = el("div", "gate-ph"); bg(gph, def.poster.img); gate.appendChild(gph); gate.appendChild(el("div", "gate-veil")); }
  gate.innerHTML += '<div class="gate-in"><p class="k">' + esc(date.replace(/-/g, " · ")) + ' · 星期' + "日一二三四五六"[new Date(date + "T00:00:00").getDay()] + '</p><h1>' + esc(day.title) + '</h1><p>' + esc((def.poster && def.poster.line) || day.sub) + '</p>' +
    '<button class="go" type="button" aria-label="開始"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>' +
    '<div><button class="mute" type="button">不要聲音，直接看</button><span class="sep">·</span><button class="mute skipgate" type="button">跳過序幕</button></div></div>';
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
        var src = document.createElement("source"); src.src = (window.BASE || "") + "assets/video/" + sc.video; src.type = "video/mp4"; ph.appendChild(src);
      } else { ph = el("div", "ph"); bg(ph, sc.img); }
      ph.style.setProperty("--kb", "kb" + (sc.kb === "out" ? "Out" : sc.kb === "pan" ? "Pan" : "In")); ph.style.setProperty("--dur", (sc.dur || 9000) + "ms");
      s.appendChild(ph); s.appendChild(el("div", "veil"));
    }
    if (sc.type === "drive" && !(sc.video && !reduce)) { var c = el("canvas", "drive"); c.id = "drive"; s.appendChild(c); }
    if (sc.type === "title") {
      s.appendChild(el("div", "title", '<div><p class="eyebrow">' + esc(sc.eyebrow || "") + '</p><h2 class="big">' + esc(sc.h) + '</h2><p class="sub">' + esc(sc.s || "") + '</p></div>'));
    } else if (sc.type === "end") {
      s.appendChild(el("div", "endcard", '<div><p class="t">' + esc(sc.t || "") + '</p><h2 class="h">' + sc.h + '</h2>' + (sc.s ? '<p class="s">' + esc(sc.s) + '</p>' : "") +
        '<button class="fbtn" id="toplan" type="button">看今天的行程 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 5v14M5 12l7 7 7-7"/></svg></button></div>'));
    } else {
      s.appendChild(el("div", "cap", '<p class="t">' + esc(sc.t || "") + '</p><h2 class="h">' + sc.h + '</h2>' + (sc.s ? '<p class="s">' + esc(sc.s) + '</p>' : "")));
    }
    stage.appendChild(s); return s;
  });
  var snow = el("canvas", "snow"); stage.appendChild(snow);

  /* ---------- 透明路線圖：北海道輪廓＋當天路線＋跟著場景走的光點 ---------- */
  var RM = { svg: null, pts: [], legs: [], pos: 0, target: 0, anim: null, level: (function () { try { return localStorage.getItem("snow13-rmap") || "mid"; } catch (e) { return "mid"; } })() };
  var sched = plan.stops.length ? plan : null;
  function proj(lon, lat) { return [lon * Math.cos(43.3 * Math.PI / 180), -lat]; }
  function buildRouteMap(outline) {
    if (!sched || !window.Plan) return;
    var stops = sched.stops, legs = sched.legs, pts = [];
    /* 整條路線的折線（含每一站的索引位置） */
    var markers = [];
    stops.forEach(function (st, i) {
      if (i === 0) { pts.push(proj(st.lon, st.lat)); markers.push(0); return; }
      var g = legs[i - 1].geom || [[stops[i - 1].lon, stops[i - 1].lat], [st.lon, st.lat]];
      g.forEach(function (c, k) { if (k === 0) return; pts.push(proj(c[0], c[1])); });
      markers.push(pts.length - 1);
    });
    var cum = [0]; for (var i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    RM.pts = pts; RM.cum = cum; RM.markers = markers; RM.total = cum[cum.length - 1] || 1;
    var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
    var minx = Math.min.apply(null, xs), maxx = Math.max.apply(null, xs), miny = Math.min.apply(null, ys), maxy = Math.max.apply(null, ys);
    var w = Math.max(maxx - minx, 0.05), h = Math.max(maxy - miny, 0.05), pad = Math.max(w, h) * 0.35;
    var vb = [minx - pad, miny - pad, w + pad * 2, h + pad * 2];
    var sw = vb[2] / 300; /* 線寬以 viewBox 單位換算，讓它在任何縮放下都差不多粗 */
    var NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg"); svg.setAttribute("class", "rmap " + RM.level); svg.setAttribute("viewBox", vb.join(" ")); svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    function path(d, cls, w) { var e = document.createElementNS(NS, "path"); e.setAttribute("d", d); e.setAttribute("class", cls); e.setAttribute("stroke-width", w); e.setAttribute("fill", "none"); e.setAttribute("stroke-linejoin", "round"); e.setAttribute("stroke-linecap", "round"); e.setAttribute("vector-effect", "none"); svg.appendChild(e); return e; }
    if (outline) {
      var d = "";
      outline.geometry.coordinates.forEach(function (poly) { poly.forEach(function (ring) { ring.forEach(function (c, k) { var q = proj(c[0], c[1]); d += (k ? "L" : "M") + q[0].toFixed(3) + " " + q[1].toFixed(3); }); d += "Z"; }); });
      var land = path(d, "rm-land", sw * 0.8); land.setAttribute("fill", "rgba(255,255,255,.035)");
    }
    var rd = pts.map(function (q, k) { return (k ? "L" : "M") + q[0].toFixed(4) + " " + q[1].toFixed(4); }).join("");
    path(rd, "rm-casing", sw * 4.2);
    path(rd, "rm-route", sw * 1.8);
    RM.trail = path("M0 0", "rm-trail", sw * 2.4);
    markers.forEach(function (mi, k) { var c = document.createElementNS(NS, "circle"); c.setAttribute("cx", pts[mi][0]); c.setAttribute("cy", pts[mi][1]); c.setAttribute("r", sw * 2.6); c.setAttribute("class", "rm-stop"); svg.appendChild(c); });
    RM.glow = document.createElementNS(NS, "circle"); RM.glow.setAttribute("r", sw * 9); RM.glow.setAttribute("class", "rm-glow"); svg.appendChild(RM.glow);
    RM.dot = document.createElementNS(NS, "circle"); RM.dot.setAttribute("r", sw * 3.6); RM.dot.setAttribute("class", "rm-dot"); svg.appendChild(RM.dot);
    RM.label = document.createElementNS(NS, "text"); RM.label.setAttribute("class", "rm-label"); RM.label.setAttribute("font-size", sw * 9); RM.label.setAttribute("stroke-width", sw * 1.2); svg.appendChild(RM.label);
    RM.svg = svg; RM.sw = sw;
    var box = el("div", "rmap-box"); box.appendChild(svg); stage.appendChild(box);
    setDot(0, true);
  }
  function pointAt(dist) {
    var pts = RM.pts, cum = RM.cum; if (!pts.length) return null;
    dist = Math.max(0, Math.min(RM.total, dist));
    var i = 1; while (i < cum.length && cum[i] < dist) i++;
    if (i >= cum.length) return pts[pts.length - 1];
    var t = (dist - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1);
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t];
  }
  function setDot(dist, jump) {
    if (!RM.svg) return;
    RM.pos = dist; var q = pointAt(dist); if (!q) return;
    RM.dot.setAttribute("cx", q[0]); RM.dot.setAttribute("cy", q[1]); RM.glow.setAttribute("cx", q[0]); RM.glow.setAttribute("cy", q[1]);
    /* 走過的路亮起來 */
    var d = "", pts = RM.pts, cum = RM.cum;
    for (var i = 0; i < pts.length && cum[i] <= dist; i++) d += (i ? "L" : "M") + pts[i][0].toFixed(4) + " " + pts[i][1].toFixed(4);
    d += (d ? "L" : "M") + q[0].toFixed(4) + " " + q[1].toFixed(4);
    RM.trail.setAttribute("d", d);
    /* 站名 */
    var atStop = -1; RM.markers.forEach(function (mi, k) { if (Math.abs(RM.cum[mi] - dist) < RM.total * 0.004) atStop = k; });
    RM.svg.classList.toggle("resting", atStop >= 0);
    if (atStop >= 0) { RM.label.textContent = sched.stops[atStop].name.replace(/（.*?）/g, ""); RM.label.setAttribute("x", q[0] + RM.sw * 6); RM.label.setAttribute("y", q[1] - RM.sw * 5); }
    else RM.label.textContent = "";
  }
  function moveDotTo(stopIdx, ms) {
    if (!RM.svg) return;
    cancelAnimationFrame(RM.anim);
    var to = RM.cum[RM.markers[Math.max(0, Math.min(stopIdx, RM.markers.length - 1))]], from = RM.pos, t0 = performance.now();
    if (Math.abs(to - from) < 1e-9) { setDot(to); return; }
    (function step(now) { var k = Math.min(1, (now - t0) / ms); var e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; setDot(from + (to - from) * e); if (k < 1) RM.anim = requestAnimationFrame(step); })(t0);
  }
  /* 每一幕對應到時間表上的第幾站（同一地點重複時依序往後找） */
  var sceneStop = [], lastIdx = 0;
  scenes.forEach(function (sc, i) {
    var idx = null;
    if (sc.stop && sched) { for (var k = lastIdx; k < sched.stops.length; k++) if (sched.stops[k].id === sc.stop) { idx = k; break; } if (idx == null) idx = lastIdx; lastIdx = idx; }
    sceneStop.push(idx);
  });
  function nextStopAfter(i) { for (var k = i + 1; k < sceneStop.length; k++) if (sceneStop[k] != null) return sceneStop[k]; return null; }
  function syncDot(i) {
    if (!RM.svg) return;
    var sc = scenes[i], idx = sceneStop[i];
    if (sc.type === "title") { moveDotTo(0, 600); return; }
    if (idx != null) { moveDotTo(idx, 1600); return; }
    if (sc.type === "drive") { var nx = nextStopAfter(i); if (nx != null) moveDotTo(nx, Math.max(2000, (sc.dur || 9000) - 1500)); }
    /* 其他沒有站點的幕：光點停在原地 */
  }
  fetch((window.BASE || "") + "data/hokkaido.json").then(function (r) { return r.json(); }).then(buildRouteMap).catch(function () { buildRouteMap(null); });
  var chrome = el("div", "chrome");
  chrome.innerHTML = '<div class="prog">' + scenes.map(function () { return "<i></i>"; }).join("") + '</div><p class="fbrand">北海道 · 雪上的大小腳印</p>' +
    '<div class="tools"><button class="ic" id="fmute" aria-label="靜音"><svg class="on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11"/></svg><svg class="off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" hidden><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l4 6M21 9l-4 6"/></svg></button>' +
    '<button class="ic" id="frmap" aria-label="路線圖濃淡"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3z"/><path d="M9 4v13M15 7v13"/></svg></button><button class="ic" id="fskip" aria-label="跳過"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 5l10 7-10 7zM19 5v14"/></svg></button></div>' +
    '<div class="tap"><button id="fprev" aria-label="上一幕"></button><button id="fnext" aria-label="下一幕"></button></div><p class="hint">點右邊下一幕 · 左邊上一幕</p>';
  chrome.hidden = true;
  root.appendChild(gate); root.appendChild(stage); root.appendChild(chrome);
  var bars = chrome.querySelectorAll(".prog i"), hint = chrome.querySelector(".hint");
  document.body.classList.add("film-open");

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
    if (i < 0) i = 0; if (i >= secs.length) { finish(); return; }
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
    if (i < secs.length - 1) timer = setTimeout(function () { show(i + 1); }, dur);
    if (i > 0) hint.style.opacity = 0;
  }
  function start(withSound) {
    if (started) return; started = true;
    if (withSound) { try { startMusic(); } catch (e) { } }
    gate.classList.add("off"); chrome.hidden = false;
    raf = requestAnimationFrame(loop);
    setTimeout(function () { show(0); }, 300);
    setTimeout(function () { hint.style.opacity = 0; }, 6000);
  }
  function finish() {
    if (ended) return; ended = true; clearTimeout(timer); clearInterval(cycleT);
    if (music) music.fadeOut();
    chrome.hidden = true; root.classList.add("off");
    document.body.classList.remove("film-open"); window.scrollTo(0, 0);
    document.dispatchEvent(new CustomEvent("film:end"));
    setTimeout(function () { cancelAnimationFrame(raf); root.remove(); }, 1600);
  }
  function updMute() { chrome.querySelector(".on").hidden = muted; chrome.querySelector(".off").hidden = !muted; }
  gate.querySelector(".go").addEventListener("click", function () { start(true); });
  gate.querySelector(".mute").addEventListener("click", function () { muted = true; start(false); updMute(); });
  gate.querySelector(".skipgate").addEventListener("click", function () { started = true; finish(); });
  chrome.querySelector("#fnext").addEventListener("click", function () { show(cur + 1); });
  chrome.querySelector("#fprev").addEventListener("click", function () { show(cur - 1); });
  chrome.querySelector("#fskip").addEventListener("click", finish);
  chrome.querySelector("#frmap").addEventListener("click", function () {
    var order = ["mid", "strong", "off", "light"]; RM.level = order[(order.indexOf(RM.level) + 1) % order.length];
    try { localStorage.setItem("snow13-rmap", RM.level); } catch (e) { }
    if (RM.svg) RM.svg.setAttribute("class", "rmap " + RM.level);
    hint.textContent = "路線圖：" + { light: "淡", mid: "中", strong: "濃", off: "關" }[RM.level]; hint.style.opacity = 1; setTimeout(function () { hint.style.opacity = 0; }, 1500);
  });
  stage.addEventListener("click", function (e) { if (e.target.closest("#toplan")) finish(); });
  chrome.querySelector("#fmute").addEventListener("click", function () { muted = !muted; if (!music && !muted) { try { startMusic(); music.setAmb(secs[cur] ? secs[cur].dataset.amb : "snow"); } catch (e) { } } else if (music) music.setMuted(muted); updMute(); });
  addEventListener("keydown", function (e) { if (!started || ended) return; if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); show(cur + 1); } if (e.key === "ArrowLeft") show(cur - 1); if (e.key === "Escape") finish(); });
  document.addEventListener("visibilitychange", function () { if (AC) { document.hidden ? AC.suspend() : AC.resume(); } });
  scenes.forEach(function (sc) { (sc.imgs || (sc.img ? [sc.img] : [])).forEach(function (u) { var im = new Image(); im.src = IMG + String(u).split("@")[0]; }); });
  /* 序幕結束時停掉所有影片 */
  document.addEventListener("film:end", function () { secs.forEach(function (sec) { var v = sec.querySelector("video.ph"); if (v) try { v.pause(); } catch (e) { } }); });
  }
})();

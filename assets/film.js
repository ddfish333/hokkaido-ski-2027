/* 序幕：每一天打開時的短片。畫面＝照片慢速運鏡＋飄雪＋字幕；聲音＝網頁即時生成的環境音樂（沒有音檔）。 */
(function () {
  "use strict";
  var T = window.TRIP, S = window.SCENES || {};
  var date = window.DAY; if (!T || !date) return;
  var day = T.days.filter(function (d) { return d.date === date; })[0]; if (!day) return;
  var IMG = (window.BASE || "") + "assets/img/";
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var dayIdx = T.days.indexOf(day);
  var def = S[date] || {};
  var scenes = def.scenes;
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
  gate.innerHTML = '<div><p class="k">' + esc(date.replace(/-/g, " · ")) + ' · 星期' + "日一二三四五六"[new Date(date + "T00:00:00").getDay()] + '</p><h1>' + esc(day.title) + '</h1><p>' + esc((def.poster && def.poster.line) || day.sub) + '</p>' +
    '<button class="go" type="button" aria-label="開始"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>' +
    '<div><button class="mute" type="button">不要聲音，直接看</button><span class="sep">·</span><button class="mute skipgate" type="button">跳過序幕</button></div></div>';
  var stage = el("div", "stage");
  var secs = scenes.map(function (sc, i) {
    var s = el("section", "scene" + (sc.warm ? " warm" : "") + (sc.type === "title" || sc.type === "drive" ? " cold" : ""));
    s.dataset.dur = sc.dur || 9000; s.dataset.amb = sc.amb || "snow";
    if (sc.img) {
      var ph = el("div", "ph"); ph.style.backgroundImage = "url(" + IMG + sc.img + ")"; ph.style.setProperty("--kb", "kb" + (sc.kb === "out" ? "Out" : sc.kb === "pan" ? "Pan" : "In")); ph.style.setProperty("--dur", (sc.dur || 9000) + "ms");
      s.appendChild(ph); s.appendChild(el("div", "veil"));
    }
    if (sc.type === "drive") { var c = el("canvas", "drive"); c.id = "drive"; s.appendChild(c); }
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
  var chrome = el("div", "chrome");
  chrome.innerHTML = '<div class="prog">' + scenes.map(function () { return "<i></i>"; }).join("") + '</div><p class="fbrand">北海道 · 雪上的大小腳印</p>' +
    '<div class="tools"><button class="ic" id="fmute" aria-label="靜音"><svg class="on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11"/></svg><svg class="off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" hidden><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l4 6M21 9l-4 6"/></svg></button>' +
    '<button class="ic" id="fskip" aria-label="跳過"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 5l10 7-10 7zM19 5v14"/></svg></button></div>' +
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
  var cur = -1, timer = null, started = false;
  function show(i) {
    if (i < 0) i = 0; if (i >= secs.length) { finish(); return; }
    clearTimeout(timer);
    secs.forEach(function (s, k) { s.classList.toggle("on", k === i); });
    bars.forEach(function (b, k) { b.classList.toggle("done", k < i); b.classList.toggle("live", k === i); b.style.setProperty("--dur", secs[i].dataset.dur + "ms"); });
    var s = secs[i];
    s.querySelectorAll(".cap > *, .title > div > *, .endcard .t, .endcard .h, .endcard .s, .fbtn, .ph").forEach(function (e) { e.style.animation = "none"; void e.offsetWidth; e.style.animation = ""; });
    cur = i; chrome.classList.toggle("last", i === secs.length - 1);
    var amb = s.dataset.amb; driveOn = amb === "drive";
    snowAmt = amb === "fire" ? .35 : amb === "quiet" ? .5 : amb === "drive" ? 0 : 1; wind = amb === "drive" ? 0 : .15 + Math.random() * .4;
    if (music) music.setAmb(amb);
    var dur = reduce ? Math.min(5000, +s.dataset.dur) : +s.dataset.dur;
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
    if (ended) return; ended = true; clearTimeout(timer);
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
  stage.addEventListener("click", function (e) { if (e.target.closest("#toplan")) finish(); });
  chrome.querySelector("#fmute").addEventListener("click", function () { muted = !muted; if (!music && !muted) { try { startMusic(); music.setAmb(secs[cur] ? secs[cur].dataset.amb : "snow"); } catch (e) { } } else if (music) music.setMuted(muted); updMute(); });
  addEventListener("keydown", function (e) { if (!started || ended) return; if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); show(cur + 1); } if (e.key === "ArrowLeft") show(cur - 1); if (e.key === "Escape") finish(); });
  document.addEventListener("visibilitychange", function () { if (AC) { document.hidden ? AC.suspend() : AC.resume(); } });
  scenes.forEach(function (sc) { if (sc.img) { var im = new Image(); im.src = IMG + sc.img; } });
})();

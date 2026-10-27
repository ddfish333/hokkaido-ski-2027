(function () {
  "use strict";
  var T = window.TRIP;
  if (!T) return;
  var PAGE = window.DAY ? "day" : "home", BASE = window.BASE || "", SC = window.SCENES || {};
  function has(id) { return !!document.getElementById(id); }

  /* ---------- 小工具 ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var DOW = ["日", "一", "二", "三", "四", "五", "六"];
  function parts(s) { var p = s.split("-").map(Number); return p; }
  function dow(s) { var p = parts(s); return DOW[new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay()]; }
  function md(s) { var p = parts(s); return p[1] + "/" + p[2]; }
  function dayDiff(a, b) { var A = parts(a), B = parts(b); return Math.round((Date.UTC(B[0], B[1] - 1, B[2]) - Date.UTC(A[0], A[1] - 1, A[2])) / 864e5); }
  function todayJST() {
    try { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
    catch (e) { var d = new Date(Date.now() + 9 * 3600e3); return d.toISOString().slice(0, 10); }
  }
  function fmtMin(m) { m = Math.round(m); if (m < 60) return m + " 分"; var h = Math.floor(m / 60), r = m % 60; return h + "h" + (r < 10 ? "0" : "") + r; }
  function r5(x) { return Math.max(5, Math.round(x / 5) * 5); }
  /* 導航一律走 Plan.navTo（plan.js）：行程站點用 plan.json 的停車場＋Google 地點，其他用座標／place id */
  function navTo(t, mode) { return Plan.navTo(t, mode); }
  function haversine(a, b) {
    var R = 6371, toR = Math.PI / 180, dLa = (b.lat - a.lat) * toR, dLo = (b.lon - a.lon) * toR;
    var h = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLo / 2) * Math.sin(dLo / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }

  var TODAY = todayJST();
  var baseById = {}; T.bases.forEach(function (b) { baseById[b.id] = b; });
  var BASE_COLOR = { villa: "var(--glacier)", furano: "var(--ok)", sapporo: "var(--accent)" };
  var state = { day: 0, origin: null, originManual: false, gps: null, wx: {}, wxTab: "villa", foodArea: "全部", mode: (window.Plan ? Plan.mode() : "normal") };

  /* ---------- 日圓／台幣 ---------- */
  var CUR_MODES = ["both", "twd", "jpy"], CUR_LABEL = { both: "¥＋NT$", twd: "NT$", jpy: "¥" };
  state.cur = CUR_MODES.indexOf(store("snow13-cur")) >= 0 ? store("snow13-cur") : "both";
  var FX = window.Plan ? Plan.fx : { rate: T.fx.jpyTwd, date: T.fx.date };
  state.rate = FX.rate; state.rateDate = FX.date;
  function twd(n) { return window.Plan ? Plan.twd(n) : Math.round(n * state.rate / 10) * 10; }
  function nf(n) { return n.toLocaleString("en-US"); }
  function money(s) {
    s = String(s == null ? "" : s);
    if (state.cur === "jpy") return s;
    return s.replace(/¥\s?([\d,.]+)(?:\s*[–-]\s*¥?([\d,.]+))?(\s*[萬千])?/g, function (m, a, b, wan) {
      var k = wan ? (wan.trim() === "萬" ? 1e4 : 1e3) : 1;
      var A = parseFloat(a.replace(/,/g, "")) * k, B = b ? parseFloat(b.replace(/,/g, "")) * k : null;
      if (isNaN(A)) return m;
      var t = "NT$" + nf(twd(A)) + (B != null && !isNaN(B) ? "–" + nf(twd(B)) : "");
      return state.cur === "twd" ? "約 " + t : m + "（約 " + t + "）";
    });
  }
  /* 說明文字一律先換標記（已經換過的不受影響）；日期用正在看的那天 */
  function em(s) { return esc(money(fill(s, window.DAY || T.start))).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"); }
  /* 文字裡的 {t:站點}／{sun:set}／{T:欄位} 標記 → 推算的時間（見 assets/plan.js） */
  /* 日文名：到了當地看招牌、問路、Google Maps 都靠它 */
  function jaTag(ja, name) { return ja && ja !== name ? '<span class="ja">' + esc(ja) + '</span>' : ""; }
  function fill(text, date, ctx) { return window.Plan && Plan.fill ? Plan.fill(text, date, ctx) : text; }

  /* 今天／下一天：出發前指向 1/7，旅程中指向當天，結束後停在最後一天 */
  function focusDayIndex() { var i = T.days.findIndex(function (d) { return d.date === TODAY; }); return i >= 0 ? i : (TODAY > T.end ? T.days.length - 1 : 0); }
  (function initDay() {
    var i = window.DAY ? T.days.findIndex(function (d) { return d.date === window.DAY; }) : -1;
    state.day = i >= 0 ? i : focusDayIndex();
    state.origin = T.days[state.day].base;
  })();
  function dayHref(d) { return BASE + "day/" + d.date.slice(5).replace("-", "") + "/"; }

  /* ---------- 天氣圖示 ---------- */
  var ICON = {
    sun: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="24" cy="24" r="8"/><path d="M24 6v5M24 37v5M6 24h5M37 24h5M11 11l3.5 3.5M33.5 33.5 37 37M37 11l-3.5 3.5M14.5 33.5 11 37"/></svg>',
    part: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="17" r="6"/><path d="M18 5v3M6 17h3M9.5 8.5l2 2M26.5 8.5l-2 2"/><path d="M16 38h20a7 7 0 0 0 0-14 10 10 0 0 0-19 3 5.5 5.5 0 0 0-1 11z"/></svg>',
    cloud: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" aria-hidden="true"><path d="M13 36h23a8 8 0 0 0 0-16 11 11 0 0 0-21 3.5A6.3 6.3 0 0 0 13 36z"/></svg>',
    snow: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 28h23a8 8 0 0 0 0-16 11 11 0 0 0-21 3.5A6.3 6.3 0 0 0 13 28z"/><path d="M16 35v6M13 38h6M26 35v6M23 38h6M36 35v6M33 38h6"/></svg>',
    heavy: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 26h23a8 8 0 0 0 0-16 11 11 0 0 0-21 3.5A6.3 6.3 0 0 0 13 26z"/><path d="M14 32v5M11.5 34.5h5M24 32v5M21.5 34.5h5M34 32v5M31.5 34.5h5M19 40v5M16.5 42.5h5M29 40v5M26.5 42.5h5"/></svg>',
    rain: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 28h23a8 8 0 0 0 0-16 11 11 0 0 0-21 3.5A6.3 6.3 0 0 0 13 28z"/><path d="M17 34l-2 6M25 34l-2 6M33 34l-2 6"/></svg>',
    fog: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M8 18h32M12 25h26M8 32h32M14 39h20"/></svg>'
  };
  function wmo(code) {
    if (code === 0) return ["晴", "sun"];
    if (code === 1 || code === 2) return ["晴時多雲", "part"];
    if (code === 3) return ["陰", "cloud"];
    if (code === 45 || code === 48) return ["霧", "fog"];
    if (code >= 51 && code <= 67) return ["雨或凍雨", "rain"];
    if (code === 71) return ["小雪", "snow"];
    if (code === 73) return ["雪", "snow"];
    if (code === 75) return ["大雪", "heavy"];
    if (code === 77) return ["霰", "snow"];
    if (code >= 80 && code <= 82) return ["陣雨", "rain"];
    if (code === 85) return ["陣雪", "snow"];
    if (code === 86) return ["強陣雪", "heavy"];
    if (code >= 95) return ["雷雨", "rain"];
    return ["—", "cloud"];
  }

  /* ---------- 主視覺 ---------- */
  var HERO_IMGS = ["assets/hero.jpg", "assets/img/scene/otaru-5.jpg@50,55", "assets/img/scene/kiroro-1.jpg@50,45", "assets/img/scene/ningle-1.jpg@50,50", "assets/img/scene/villa-5.jpg@50,50", "assets/img/scene/biei-4.jpg@50,40"];
  function initHeroCarousel() {
    var first = $(".hero-ph"); if (!first) return;
    first.classList.add("cur", "first");
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var layers = [first];
    HERO_IMGS.slice(1).forEach(function (spec) {
      var m = spec.match(/^(.*)@(\d+),(\d+)$/), d = document.createElement("div"); d.className = "hero-ph"; d.setAttribute("aria-hidden", "true");
      d.style.backgroundImage = "url(" + BASE + (m ? m[1] : spec) + ")"; if (m) d.style.backgroundPosition = m[2] + "% " + m[3] + "%";
      first.parentNode.insertBefore(d, first.nextSibling); layers.push(d);
    });
    var k = 0; setInterval(function () { k = (k + 1) % layers.length; layers.forEach(function (l, j) { l.classList.toggle("cur", j === k); if (j === k) { l.style.animation = "none"; void l.offsetWidth; l.style.animation = ""; } }); }, 6500);
  }
  function renderHero() {
    if (has("updated")) $("#updated").textContent = T.updated;
    var c = $("#countdown"); if (!c) return;
    initHeroCarousel();
    if (TODAY < T.start) {
      c.innerHTML = '<span class="big">' + dayDiff(TODAY, T.start) + '</span><span class="lbl">天後出發</span>';
    } else if (TODAY <= T.end) {
      c.innerHTML = '<span class="big">D' + (dayDiff(T.start, TODAY) + 1) + '</span><span class="lbl">旅程第 ' + (dayDiff(T.start, TODAY) + 1) + ' 天，共 13 天</span>';
    } else {
      c.innerHTML = '<span class="lbl">旅程已結束，謝謝一起出發的大家。</span>';
    }
    $("#route").innerHTML = T.bases.map(function (b) {
      var on = TODAY >= b.from && TODAY < b.to;
      return '<li style="--n:' + b.nights + '" class="' + (on ? "on" : "") + '"><b>' + esc(b.short) + ' ' + b.nights + ' 晚</b><span>' + md(b.from) + '–' + md(b.to) + '</span></li>';
    }).join("");
    if (has("heroflight")) $("#heroflight").innerHTML = [T.flight.out, T.flight.back].map(function (f) { var fl = Plan.flightOn(f.date); return '<span><b>' + esc(fl.dir) + '</b> ' + em(fl.line) + '</span>'; }).join("") + '<a href="#flights">' + esc(T.flight.airline) + ' · 準備 →</a>';
    var f = T.days[focusDayIndex()], cta = $("#herocta");
    if (cta) cta.innerHTML = '<a class="cta" href="' + dayHref(f) + '"><span>' + (TODAY < T.start ? "從第一天開始看" : TODAY <= T.end ? "今天 " + md(f.date) : "最後一天") + '</span><b>' + esc(f.title) + '</b></a>';
  }

  /* ---------- 首頁：13 天海報牆與三章 ---------- */
  function renderPosters() {
    var box = $("#posters"); if (!box) return;
    var focus = focusDayIndex();
    box.innerHTML = T.days.map(function (d, i) {
      var sc = SC[d.date] || {}, p = sc.poster || {}, b = baseById[d.base];
      var badge = d.date === TODAY ? "今天" : (TODAY < T.start && i === 0 ? "第一天" : "");
      return '<a class="poster' + (i === focus ? " focus" : "") + '" href="' + dayHref(d) + '" style="--seg:' + BASE_COLOR[d.base] + '">' +
        (p.img ? '<img src="' + BASE + 'assets/img/' + p.img + '" alt="" loading="lazy">' : '<span class="poster-blank"></span>') +
        '<span class="poster-top"><span class="pd">' + md(d.date) + '<small>週' + dow(d.date) + '</small></span>' + (badge ? '<span class="badge">' + badge + '</span>' : "") + '</span>' +
        '<span class="pw" data-pw="' + d.date + '">' + posterWx(d) + '</span>' +
        '<span class="poster-body"><span class="pn">DAY ' + (i < 9 ? "0" : "") + (i + 1) + ' · ' + esc(b.area) + '</span><span class="pt">' + esc(fill(d.title, d.date)) + '</span><span class="pl">' + esc(fill(p.line || d.sub, d.date)) + '</span></span></a>';
    }).join("");
    var f = box.children[focus];
    if (f) box.scrollLeft = Math.max(0, f.offsetLeft - 24);
  }
  /* 海報上的天氣：有 16 天預報就用預報，沒有就先放歷年平均 */
  function posterWx(d) {
    var w = state.wx[d.base];
    if (w && w.daily) {
      var k = w.daily.time.indexOf(d.date);
      if (k >= 0) { var m = wmo(w.daily.weather_code[k]); return '<i class="ico">' + ICON[m[1]] + '</i><b>' + Math.round(w.daily.temperature_2m_max[k]) + '°</b><small>' + Math.round(w.daily.temperature_2m_min[k]) + '°</small><em>' + m[0] + (w.daily.snowfall_sum[k] >= 1 ? ' · 雪 ' + Math.round(w.daily.snowfall_sum[k]) + ' cm' : "") + '</em>'; }
    }
    var c = T.climate[d.base]; if (!c) return "";
    return '<i class="ico">' + ICON.snow + '</i><b>' + c.tmax + '°</b><small>' + c.tmin + '°</small><em>歷年平均</em>';
  }
  function refreshPosterWx() { document.querySelectorAll("[data-pw]").forEach(function (el) { var d = T.days.filter(function (x) { return x.date === el.dataset.pw; })[0]; if (d) el.innerHTML = posterWx(d); }); }
  var CHAPTER_IMG = { villa: "otaru", furano: "furano", sapporo: "sapporo" };
  /* 三章：海之雪、山之雪、街之雪——照片、主題小標、地名大標、日文短句、一段話 */
  /* 三層：主題小標（海之雪）／地名大標（小樽 OTARU）／細明朝日文短句；文案 2026-10-26 由 Sean 定稿 */
  var CHAPTER = {
    villa: { en: "CHAPTER 01 · 4 NIGHTS", theme: "海之雪", place: "小樽", en2: "OTARU", jp: "雪国のはじまり", line: "第一站，住進小樽近郊的山鄉。白天往 Kiroro 滑雪，留一個下午給小樽運河與堺町通。雪山、海岸、溫泉與壽司，構成最初的四晚。" },
    furano: { en: "CHAPTER 02 · 5 NIGHTS", theme: "山之雪", place: "富良野", en2: "FURANO", jp: "雪山で過ごす日々", line: "五晚住在北之峰，這裡是旅程的滑雪重心。從小木屋出發，探索富良野的兩個滑雪區；也安排旭山動物園、美瑛雪原與青池點燈。" },
    sapporo: { en: "CHAPTER 03 · 3 NIGHTS", theme: "街之雪", place: "札幌", en2: "SAPPORO", jp: "街を楽しむ", line: "最後三晚回到札幌。把車停好，走進城市裡的餐廳、商店與冬日街景。想滑雪還能再上山，其餘時間就留給美食與自由探索。" }
  };
  var LINK_ICON = {
    "官網": '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg>',
    "訂房": '<svg viewBox="0 0 24 24"><path d="M3 18V8a2 2 0 012-2h14a2 2 0 012 2v10M3 14h18M7 10h4v4H7z"/></svg>',
    "評論": '<svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
    "導航": '<svg viewBox="0 0 24 24"><path d="M12 2L4.5 20l7.5-4 7.5 4z"/></svg>'
  };
  function linkPill(label, url, sub) { return '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + (LINK_ICON[label] || "") + '<span>' + esc(label) + (sub ? ' <b>' + esc(sub) + '</b>' : "") + '</span></a>'; }
  function arrowLink(label, url) { return '<a class="alink" href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(label) + '<svg viewBox="0 0 56 8" aria-hidden="true"><path d="M0 7h54M48 1l6 6"/></svg></a>'; }
  function renderChapters() {
    var box = $("#chapterlist"); if (!box) return;
    box.innerHTML = T.bases.map(function (b, i) {
      var k = CHAPTER_IMG[b.id], c = CHAPTER[b.id] || { en: "", jp: "", line: "" };
      var site = (b.links || []).filter(function (l) { return l[0] === "官網"; })[0];
      /* 影片不先下載：桌機滑鼠移上去、手機捲到畫面裡才載入，載好才淡入；之前都只顯示照片 */
      var vid = b.video ? '<video class="ch-vid" muted loop playsinline preload="none" data-src="' + BASE + 'assets/video/' + esc(b.video) + '"' + (b.videoSm ? ' data-src-sm="' + BASE + 'assets/video/' + esc(b.videoSm) + '"' : "") + ' aria-hidden="true"></video><span class="ch-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>' : "";
      return '<article class="chapter">' +
        '<div class="ch-img' + (b.video ? " has-video" : "") + '"><img src="' + BASE + 'assets/img/chapter/' + k + '.jpg" alt="" loading="lazy">' + vid + '</div>' +
        '<div class="ch-body">' +
        '<p class="ch-k">' + esc(c.en) + '</p>' +
        '<p class="ch-theme">' + esc(c.theme || "") + '</p>' +
        '<h3 class="ch-place">' + esc(c.place || b.area) + ' <small>' + esc(c.en2 || "") + '</small></h3>' +
        '<p class="ch-jp">' + esc(c.jp) + '</p>' +
        '<p class="ch-area">' + esc(b.short.split("・").pop()) + '｜' + md(b.from) + '–' + md(b.to) + ' · ' + b.nights + ' 晚</p>' +
        '<p class="ch-line">' + em(c.line) + '</p>' +
        '<p class="ch-stay">' + esc(b.name) + (b.checkin ? ' · 入住 ' + esc(fill(b.checkin, b.from)) : "") + (b.checkout ? ' · 退房 ' + b.checkout : "") + '</p>' +
        '<p class="ch-links">' + (site ? arrowLink("官網", site[1]) : "") + arrowLink("導航", navTo(b)) + '</p>' +
        '</div></article>';
    }).join("");
    initChapterVideos();
  }
  function initChapterVideos() {
    var vids = document.querySelectorAll(".ch-vid"); if (!vids.length) return;
    var conn = navigator.connection || {}, slow = !!conn.saveData || /(^|[^a-z])(slow-2g|2g)$/.test(conn.effectiveType || "");
    if (conn.saveData) return; /* 省流量模式：只給照片 */
    var small = innerWidth < 760 || /3g/.test(conn.effectiveType || "") || slow;
    function wrap(v) { return v.parentNode; }
    function play(v) {
      if (!v.getAttribute("src")) { v.src = (small && v.dataset.srcSm) || v.dataset.src; v.load(); }
      var pr = v.play(); if (pr && pr.catch) pr.catch(function () { });
    }
    function stop(v) { if (!v.paused) v.pause(); wrap(v).classList.remove("playing"); }
    vids.forEach(function (v) {
      v.addEventListener("playing", function () { wrap(v).classList.add("playing"); });
      v.addEventListener("waiting", function () { wrap(v).classList.remove("playing"); }); /* 網路跟不上就先回到照片，不會卡格 */
      v.addEventListener("pause", function () { wrap(v).classList.remove("playing"); });
    });
    var hoverable = matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (hoverable) {
      vids.forEach(function (v) {
        var card = v.closest(".chapter");
        card.addEventListener("pointerenter", function () { play(v); });
        card.addEventListener("pointerleave", function () { stop(v); });
      });
    } else if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { var v = e.target.querySelector(".ch-vid"); if (!v) return; if (e.isIntersecting && e.intersectionRatio >= 0.55) play(v); else stop(v); }); }, { threshold: [0, 0.55] });
      vids.forEach(function (v) { io.observe(wrap(v)); });
    }
    /* 切到別的分頁就停 */
    document.addEventListener("visibilitychange", function () { if (document.hidden) vids.forEach(stop); });
  }

  /* ---------- 每日 ---------- */
  function renderDayStrip() {
    var s = $("#daystrip"); if (!s) return;
    s.innerHTML = T.days.map(function (d, i) {
      var b = baseById[d.base];
      return '<button type="button" role="tab" class="dchip' + (d.date === TODAY ? " today" : "") + '" style="--seg:' + BASE_COLOR[d.base] + '" aria-selected="' + (i === state.day) + '" data-i="' + i + '">' +
        '<span class="d">' + md(d.date) + '</span><span class="w">週' + dow(d.date) + '</span><span class="b">' + esc(b.area) + '</span></button>';
    }).join("");
    s.onclick = function (e) {
      var btn = e.target.closest(".dchip"); if (!btn) return;
      selectDay(+btn.dataset.i);
    };
    var cur = s.children[state.day];
    if (cur) s.scrollLeft = Math.max(0, cur.offsetLeft - s.clientWidth / 2 + cur.clientWidth / 2);
  }
  function selectDay(i) {
    state.day = i;
    Array.prototype.forEach.call($("#daystrip").children, function (c, j) { c.setAttribute("aria-selected", j === i); });
    renderDay();
    if (!state.originManual) { state.origin = T.days[i].base; renderOrigin(); renderDrive(); }
    updateRoute(true);
  }
  function dayWeather(d) {
    var w = state.wx[d.base];
    if (w && w.daily) {
      var k = w.daily.time.indexOf(d.date);
      if (k >= 0) {
        var m = wmo(w.daily.weather_code[k]);
        return '<div class="wxday">' + '<span class="ico">' + ICON[m[1]] + '</span><div><div class="tt">' + Math.round(w.daily.temperature_2m_max[k]) + '° / ' + Math.round(w.daily.temperature_2m_min[k]) + '°</div>' +
          '<div class="ss">' + m[0] + '・新雪 ' + (w.daily.snowfall_sum[k] || 0).toFixed(1) + ' cm・陣風 ' + Math.round(w.daily.wind_gusts_10m_max[k]) + ' km/h</div></div></div>';
      }
    }
    var c = T.climate[d.base];
    return '<div class="wxday"><span class="ico">' + ICON.snow + '</span><div><div class="tt">' + c.tmax + '° / ' + c.tmin + '°</div><div class="ss">' + esc(c.label) + ' 歷年平均・每日新雪約 ' + c.snow + ' cm（進入 16 天預報後改顯示即時）</div></div></div>';
  }
  /* 站點的營業時間／價錢／停車：照 id 去 spots.js、food.js 找，找不到就用 trip.js places 裡座標相同的點；只讀不抄，資料改了這裡自動跟著變 */
  /* 這一站也可以換成…：替代地點的車程（從上一站、到下一站）、和現在差幾分鐘、雪場時間與票價、為什麼可以考慮 */
  function altsHTML(s, i, d) {
    var alts = Plan.altsFor(d.date, i, state.mode); if (!alts.length) return "";
    var cur = (s.altNotes || {})[s.id];
    return '<div class="alts"><p class="alts-h">這站也可以換成 <small>給大家參考，決定了在「編輯」裡一鍵換</small></p>' + (cur ? '<p class="alt-cur"><b>現在：' + esc(s.name) + '</b>　' + em(fill(cur, d.date, s)) + '</p>' : "") +
      alts.map(function (a) {
        var rs = a.resort, tk = rs ? Plan.ticketFor(rs, s.stay) : null, mins = function (l) { return l ? fmtMin(l[state.mode === "snow" ? "snow" : "normal"]) : ""; };
        var trip = (a.prev ? "從" + esc(a.prev.name.replace(/（.*?）/g, "")) + " 開車 " + mins(a.toLeg) : "") + (a.next ? "，再開 " + mins(a.fromLeg) + " 到" + esc(a.next.name.replace(/（.*?）/g, "")) : "");
        var dl = a.delta < 0 ? '<span class="alt-save">比現在少開 ' + fmtMin(-a.delta) + '</span>' : a.delta > 0 ? '<span class="alt-more">多開 ' + fmtMin(a.delta) + '</span>' : "";
        var facts = rs ? [rs.tier, rs.hours, tk ? tk[0] + " " + tk[1] : "", rs.kids].filter(Boolean) : [];
        return '<div class="alt"><div class="alt-top"><b>' + esc(a.name) + '</b>' + jaTag(a.ja, a.name) + dl + '</div><p class="alt-trip">' + trip + '</p>' +
          (a.note ? '<p class="alt-note">' + em(fill(a.note, d.date, s)) + '</p>' : "") +
          (facts.length ? '<p class="alt-facts">' + facts.map(function (x) { return em(x); }).join(" · ") + (rs ? ' <a href="' + BASE + 'ski/?day=' + d.date + '#' + rs.id + '">滑雪地圖 →</a>' : "") + '</p>' : "") + '</div>';
      }).join("") + '</div>';
  }
  function stopFacts(s, d) {
    if (s.id === d.base || baseById[s.id] || ["villa", "lodge", "favlux"].indexOf(s.id) >= 0) {
      var hp = s.i > 0 && s.via !== "walk" && s.via !== "taxi" && Plan.plan.places[s.id] && Plan.plan.places[s.id].park; /* 住宿：開車回來的那一趟要停哪裡 */
      return hp ? '<br><span class="tl-facts">' + em("🅿 導航到 " + hp.name + (hp.note ? "：" + hp.note : "")) + '</span>' : "";
    }
    /* 景點／餐廳卡片要「id 相同而且就在同一個地方（300 m 內）」才算同一個，免得 plan.json 和 spots.js 剛好撞名（例如 temiya 溫泉 vs 舊手宮線） */
    function same(x) { return x.id === s.id && haversine(x, s) < 0.3; }
    var sp = (window.SPOTS || []).filter(same)[0], fd = (window.FOOD || []).filter(same)[0];
    var rs = T.resorts.filter(function (r) { return (r.stops || []).indexOf(s.id) >= 0; })[0];
    var parts = [], wd = new Date(d.date + "T00:00:00").getDay(), href = "", fl = Plan.flightOn(d.date);
    if (s.id === "cts" && fl) { parts.push("✈ " + fl.dir + " " + fl.line + "（" + T.flight.airline + "）"); href = BASE + "#flights"; }
    else if (rs) {
      var tk = Plan.ticketFor(rs, s.stay); parts.push(rs.hours); if (tk) parts.push(tk[0] + " " + tk[1]); parts.push(rs.kids);
      href = BASE + "ski/?day=" + d.date + "#" + rs.id;
    } else if (sp) {
      if (sp.hours) parts.push(sp.hours); if (sp.fee) parts.push(sp.fee); if (sp.parking && !(s.i > 0 && Plan.plan.places[s.id] && Plan.plan.places[s.id].park)) parts.push("停車：" + sp.parking);
      if (sp.closed && sp.closed.indexOf(wd) >= 0) parts.push("**今天公休**");
      href = BASE + "spots/?day=" + d.date + "#" + sp.id;
    } else if (fd) {
      if (fd.hours) parts.push(fd.hours); if (fd.price) parts.push(fd.price); if (fd.parking && !(s.i > 0 && Plan.plan.places[s.id] && Plan.plan.places[s.id].park)) parts.push("停車：" + fd.parking);
      if (fd.closed && fd.closed.indexOf(wd) >= 0) parts.push("**今天公休**");
      if (fd.g && fd.g.rating) parts.push("Google " + fd.g.rating.toFixed(1));
      href = BASE + "food/?day=" + d.date + "#" + fd.id;
    } else {
      var pl = T.places.filter(function (p) { return Math.abs(p.lat - s.lat) < 0.0015 && Math.abs(p.lon - s.lon) < 0.002; })[0];
      if (pl && pl.note) parts.push(pl.note);
    }
    /* 開車到、而且導航設的是停車場：先寫停哪裡（導航按鈕就是開到這裡） */
    var pk = s.i > 0 && s.via !== "walk" && s.via !== "shuttle" && s.via !== "taxi" && Plan.plan.places[s.id] && Plan.plan.places[s.id].park;
    if (pk) parts.unshift("🅿 導航到 " + pk.name + (pk.note ? "：" + pk.note : ""));
    if (!parts.length) return "";
    return '<br><span class="tl-facts">' + parts.map(function (x) { return em(x); }).join(" · ") + (href ? ' <a href="' + href + '">' + (rs ? '滑雪地圖 →' : fl && s.id === "cts" ? '航班與準備 →' : '卡片 →') + '</a>' : "") + '</span>';
  }
  /* 保姆：上班時間、幾點回到住宿、加班多久，從 trip.js nanny 和當天時間表算 */
  function nannyCard(d, sch) {
    var N = T.nanny; if (!N || !N.lastDay || d.date > N.lastDay || d.date < T.days[1].date) return "";
    var last = d.date === N.lastDay, baseStops = sch.stops.filter(function (s, i) { return i > 0 && (s.id === d.base || baseById[s.id] || ["villa", "lodge", "favlux"].indexOf(s.id) >= 0); });
    var back = baseStops.length ? baseStops[baseStops.length - 1] : null;
    var lines = [];
    if (last) lines.push("最後一天：上午照常，" + N.bus + " 送她到富良野站搭巴士；之後兩家自己顧小孩，訂位人數改 " + esc((T.party || {}).noNanny || "8 人"));
    else if (d.base !== T.days[T.days.indexOf(d) - 1].base) {
      /* 搬家日：住宿換地方，小孩和保姆跟著車隊走 */
      lines.push("搬家日：小孩和保姆跟車一起走，" + (baseStops.length ? baseStops[0].time + " 到新住宿" : "") + "；保姆下班 " + N.end + "，晚餐一起吃");
    } else {
      lines.push("上班 " + N.start + "–" + N.end + "，小孩留在住宿");
      if (back) {
        var over = Plan.mins(back.time) - Plan.mins(N.end);
        lines.push(over > 0 ? "今天 **" + back.time + "** 才回到住宿，比下班晚 " + fmtMin(over) + "——算加班（" + esc(N.overtime) + "）或請她先下班" : "今天 " + back.time + " 回到住宿，下班前回得來");
      }
    }
    return '<div class="card nannycard"><p class="panel-label">保姆</p><ul class="bullets">' + lines.map(function (x) { return '<li>' + x.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>") + '</li>'; }).join("") + '</ul></div>';
  }
  function renderDay() {
    if (!has("dayview")) return;
    var d = T.days[state.day], b = baseById[d.base], sch = dayPlan();
    var html = '<div class="card">' + (has("dayhead") ? '<p class="panel-label">今天的安排</p><p class="day-sub" style="margin:0 0 4px">' + esc(fill(d.sub, d.date)) + '</p>' : '<p class="day-date">' + md(d.date) + '（' + dow(d.date) + '）· 住 ' + esc(b.short) + '</p>' +
      '<h3 class="day-title">' + esc(fill(d.title, d.date)) + '</h3><p class="day-sub">' + esc(fill(d.sub, d.date)) + '</p>') +
      (d.alert ? '<p class="alert">' + esc(fill(d.alert, d.date)) + '</p>' : "") +
      '<div class="modeseg seg" role="tablist" aria-label="路況"></div>' +
      '<ol class="timeline">' + sch.stops.map(function (s, i) {
        var row = "";
        if (i > 0) { var l = sch.legs[i - 1]; row += '<li class="tl-leg ' + Plan.legMode(l) + ' m-' + Plan.legMode(l) + '"><time></time>' + Plan.legHTML(l) + '</li>'; }
        var last = i === sch.stops.length - 1;
        row += '<li class="' + (s.late ? "is-late" : "") + '"><time>' + s.time + (last || !s.stay ? "" : '<small>– ' + s.timeDep + '</small>') + '</time><span><b>' + esc(s.name) + '</b>' + jaTag(s.ja, s.name) + (s.stay && !last ? ' <span class="stay">停 ' + fmtMin(s.stay) + '</span>' : "") + lateTag(s) + (s.note ? '<br><span class="tl-note">' + em(fill(s.note, d.date, s)) + '</span>' : "") + stopFacts(s, d) + altsHTML(s, i, d) + '</span></li>';
        return row;
      }).join("") + '</ol></div>';
    html += '<div class="side">';
    var alt = Plan.schedule(d.date, state.mode === "snow" ? "normal" : "snow");
    if (d.base === "sapporo" && d.date < b.to && (window.SPOTS || []).some(function (x) { return x.kind === "停車"; })) {
      var plots = (window.SPOTS || []).filter(function (x) { return x.kind === "停車"; });
      html += '<div class="card parkcard"><p class="panel-label">車停哪裡（飯店沒有停車場）</p><ul class="parklist">' + plots.map(function (x) {
        var url = navTo(x);
        return '<li class="' + (x.status === "check" ? "no" : "") + '"><a href="' + url + '" target="_blank" rel="noopener"><b>' + esc(x.name) + '</b><span>' + em(x.fee || "") + (x.caution ? ' · ' + em(x.caution) : "") + '</span></a></li>';
      }).join("") + '</ul><p class="park-note">點店名直接開 Google Maps 導航到停車場入口。1/16 13:00 前先停パラカ，三晚不動。</p></div>';
    }
    html += '<div class="card"><p class="panel-label">今天開車</p><div class="sunrow"><div><span>' + (state.mode === "snow" ? "下雪" : "一般") + '</span><b>' + fmtMin(sch.total.min) + '</b></div><div><span>' + (state.mode === "snow" ? "一般" : "下雪") + '</span><b>' + fmtMin(alt.total.min) + '</b></div><div><span>距離</span><b>' + sch.total.km + ' km</b></div>' + (sch.end != null ? '<div><span>最後到達</span><b>' + Plan.hm(sch.end) + '</b></div>' : "") + '</div></div>';
    html += '<div class="card"><p class="panel-label">天氣</p>' + dayWeather(d) + '</div>';
    html += '<div class="card"><p class="panel-label">日照</p><div class="sunrow"><div><span>日出</span><b>' + d.sun[0] + '</b></div><div><span>日落</span><b>' + d.sun[1] + '</b></div><div><span>天黑</span><b>' + d.sun[2] + '</b></div></div></div>';
    /* 吃什麼：讀 food.js FOOD_PICKS（和下面「這天怎麼吃」、美食地圖同一份），不再手寫 */
    html += '<div class="card"><p class="panel-label">吃什麼</p>' + Plan.mealCardHTML(d.date, function (id, t) { return '<a href="' + BASE + 'food/?day=' + d.date + '#' + id + '">' + esc(t) + '</a>'; }) + '<a class="jump" href="#dayfood">每一餐為什麼這樣選、附近還有哪些店 ↓</a></div>';
    html += nannyCard(d, sch);
    html += '</div>';
    $("#dayview").innerHTML = html;
    if (has("dayfood") && !document.querySelector("#dayfood .fp-embed:not([hidden])")) $("#dayfood").innerHTML = foodBlock(d, b);
    if (has("dayspots") && !document.querySelector("#dayspots .fp-embed:not([hidden])")) $("#dayspots").innerHTML = spotBlock(d, b);
    renderModeSeg();
    var nav = $("#daynav"), prev = T.days[state.day - 1], next = T.days[state.day + 1];
    if (nav) {
      nav.innerHTML = (prev ? '<a class="dn prev" href="' + dayHref(prev) + '"><small>← ' + md(prev.date) + '</small>' + esc(prev.title) + '</a>' : '<span></span>') +
        '<a class="dn home" href="' + BASE + '">回首頁</a>' +
        (next ? '<a class="dn next" href="' + dayHref(next) + '"><small>' + md(next.date) + ' →</small>' + esc(next.title) + '</a>' : '<span></span>');
    }
    /* 頁面最上面（貼在頂欄下方）的換日列：前一天、下一天，中間可以直接選 13 天裡的任何一天 */
    var sw = $("#dayswitch");
    if (sw && !sw.dataset.ready) {
      sw.dataset.ready = "1";
      sw.innerHTML = '<div class="wrap ds-in">' +
        (prev ? '<a class="ds-btn prev" href="' + dayHref(prev) + '" aria-label="前一天 ' + md(prev.date) + '"><span class="ar">‹</span><span>' + md(prev.date) + '</span></a>' : '<span class="ds-btn off"></span>') +
        '<label class="ds-mid"><span class="ds-now">DAY ' + (state.day < 9 ? "0" : "") + (state.day + 1) + ' · ' + md(d.date) + '（' + dow(d.date) + '）<span class="ds-base">· ' + esc(b.area) + '</span></span><select class="ds-sel" aria-label="換一天">' +
        T.days.map(function (x, i) { return '<option value="' + dayHref(x) + '"' + (i === state.day ? " selected" : "") + '>DAY ' + (i < 9 ? "0" : "") + (i + 1) + ' · ' + md(x.date) + '（' + dow(x.date) + '）' + esc(x.title) + '</option>'; }).join("") + '</select></label>' +
        (next ? '<a class="ds-btn next" href="' + dayHref(next) + '" aria-label="下一天 ' + md(next.date) + '"><span>' + md(next.date) + '</span><span class="ar">›</span></a>' : '<span class="ds-btn off"></span>') + '</div>';
      sw.querySelector(".ds-sel").addEventListener("change", function () { if (this.value) location.href = this.value; });
    }
    if (!renderDay.hashDone) { renderDay.hashDone = true; openFoldFor(location.hash); }
    var hd = $("#dayhead");
    if (hd) hd.innerHTML = '<p class="dh-k">DAY ' + (state.day < 9 ? "0" : "") + (state.day + 1) + ' · ' + md(d.date) + '（' + dow(d.date) + '）· 住 ' + esc(b.short) + '</p><h1 class="dh-h">' + esc(d.title) + '</h1><p class="dh-s">' + esc(fill(((SC[d.date] || {}).poster || {}).line || d.sub, d.date)) + '</p>';
  }

  /* ---------- 地圖：預設跟著日期走；地區按鈕切到探索模式 ---------- */
  var CATS = [
    ["stay", "住宿", "--accent"], ["ski", "雪場", "--c-ski"], ["sight", "景點", "--c-sight"], ["food", "餐廳", "--c-food"],
    ["onsen", "溫泉", "--c-onsen"], ["shop", "購物", "--c-shop"], ["grocery", "超市", "--c-grocery"], ["hospital", "醫院", "--c-hospital"], ["transport", "交通", "--c-transport"]
  ];
  var catOn = { stay: true, ski: true, sight: false, food: false, onsen: false, shop: false, grocery: false, hospital: false, transport: false };
  var AREAS = [
    ["day", "當天行程", null],
    ["otaru", "小樽・Kiroro", [[140.93, 43.03], [141.30, 43.26]]],
    ["furano", "富良野・美瑛・旭川", [[142.28, 43.28], [142.70, 43.80]]],
    ["sapporo", "札幌", [[141.15, 42.88], [141.50, 43.13]]],
    ["all", "全區", [[140.90, 42.74], [142.72, 43.84]]]
  ];
  var SKI_LABEL = { onze: "Onze", kiroro: "Kiroro", furano_kita: "富良野（北之峰）", teine: "Teine", asari: "朝里川", kokusai: "札幌国際", bankei: "ばんけい", moiwa: "藻岩山", fus: "Fu's" };
  var CIRCLED = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨"];
  var map = null, gpsMarker = null, mapReady = false, KEYS = [], POIS = [], STOPS = [];
  if (PAGE === "day") AREAS = AREAS.slice(0, 1); else AREAS = AREAS.slice(1);
  state.area = PAGE === "day" ? "day" : "all";
  var isDark = !window.Plan || Plan.theme() !== "light";
  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || "#5A687A"; }
  function dayPlan() { return (window.Plan && Plan.plan) ? Plan.schedule(T.days[state.day].date, state.mode) : { stops: [], legs: [], total: { km: 0, min: 0 } }; }
  /* 固定時間的標籤：plan.json 站點可以給 atLabel（例如「訂位」），有的話顯示「17:30 訂位（早到 15 分）」，沒有就是「等 15 分（17:30 開始）」 */
  function lateTag(s) {
    var what = s.atLabel ? s.at + " " + s.atLabel : "";
    if (s.late) return '<span class="late">晚 ' + s.late + ' 分' + (s.by ? '（最晚 ' + s.by + '）' : what ? '（' + what + '）' : s.at ? '（' + s.at + ' 開始）' : '') + '</span>';
    if (s.wait) return what ? '<span class="wait">' + esc(what) + '（早到 ' + s.wait + ' 分）</span>' : '<span class="wait">等 ' + s.wait + ' 分（' + s.at + ' 開始）</span>';
    return what ? '<span class="fixed">' + esc(what) + '</span>' : '';
  }
  function renderModeSeg() {
    document.querySelectorAll(".modeseg").forEach(function (box) {
      box.innerHTML = [["normal", "一般路況"], ["snow", "下雪路況"]].map(function (m) { return '<button type="button" role="tab" aria-selected="' + (state.mode === m[0]) + '" data-mode="' + m[0] + '">' + m[1] + '</button>'; }).join("");
      box.onclick = function (e) { var b = e.target.closest("[data-mode]"); if (!b) return; state.mode = Plan.mode(b.dataset.mode); Plan.clearCache(); renderModeSeg(); renderDay(); updateRoute(true); };
    });
  }

  function popupHTML(p) {
    var a = '<a href="' + navTo(p) + '" target="_blank" rel="noopener">Google Maps 導航</a>';
    if (p.link) a = '<a href="' + esc(p.link) + '"' + (/^https?:/.test(p.link) ? ' target="_blank" rel="noopener"' : "") + '>' + esc(p.linkText || "看詳細 →") + '</a>' + a;
    if (p.baseId) a += '<button type="button" data-origin="' + p.baseId + '">從這裡算車程</button>';
    return '<p class="pop-t">' + esc(p.name) + jaTag(p.ja, p.name) + '</p>' + (p.sub ? '<p class="pop-s">' + em(p.sub) + '</p>' : '') + (p.note ? '<p class="pop-n">' + em(p.note) + (p.approx ? '（位置為概略）' : '') + '</p>' : '') + '<div class="pop-a">' + a + '</div>';
  }
  /* 探索地圖的點：景點來自 data/spots.js、餐廳來自 data/food.js（和景點地圖、美食地圖同一份資料），其他類別來自 trip.js */
  function explorePois() {
    var list = [];
    var ST = { plan: "正式行程", saved: "收藏", check: "待確認" };
    (window.SPOTS || []).forEach(function (s) {
      list.push({ type: "sight", name: s.name, ja: s.ja, lat: s.lat, lon: s.lon, approx: s.approx, sub: ST[s.status] + (s.day ? " " + md(s.day) : "") + " · " + s.kind + (s.g && s.g.rating ? " · ★ " + s.g.rating.toFixed(1) : ""), note: s.what.length > 90 ? s.what.slice(0, 90) + "…" : s.what, link: BASE + "spots/#" + s.id, linkText: "景點地圖 →" });
    });
    (window.FOOD || []).forEach(function (f) {
      list.push({ type: "food", name: f.name, lat: f.lat, lon: f.lon, approx: f.approx, sub: f.kind + " · " + f.hours + (f.g && f.g.rating ? " · ★ " + f.g.rating.toFixed(1) : ""), note: f.what.length > 90 ? f.what.slice(0, 90) + "…" : f.what, link: BASE + "food/#" + f.id, linkText: "美食地圖 →" });
    });
    T.places.forEach(function (p) { if (p.type !== "sight" && p.type !== "food") list.push(p); });
    return list;
  }
  function keyPoints() {
    var pts = [];
    T.bases.forEach(function (b) { pts.push({ type: "stay", label: b.short.split("・").pop() + " " + b.nights + " 晚", name: b.name, lat: b.lat, lon: b.lon, note: md(b.from) + "–" + md(b.to) + " " + b.nights + " 晚。" + b.notes.map(function (n) { return fill(n, b.from); }).join("；"), baseId: b.id, link: ((b.links || []).filter(function (l) { return l[0] === "官網"; })[0] || [])[1], linkText: "官網 ↗" }); });
    T.resorts.forEach(function (r) { pts.push({ type: "ski", label: SKI_LABEL[r.id] || r.name, name: r.name, ja: r.ja, lat: r.lat, lon: r.lon, note: r.tier + "。" + (r.hours || "") }); });
    pts.push({ type: "ski", label: "富良野（富良野區）", name: "富良野滑雪場 富良野區", lat: 43.3266, lon: 142.3394, note: "富良野纜車（新富良野王子飯店旁）" });
    return pts;
  }
  function fc(list, filterFn) {
    return { type: "FeatureCollection", features: list.map(function (p, i) { return { p: p, i: i }; }).filter(function (x) { return !filterFn || filterFn(x.p); }).map(function (x) {
      return { type: "Feature", geometry: { type: "Point", coordinates: [x.p.lon, x.p.lat] }, properties: { i: x.i, type: x.p.type, label: x.p.label || x.p.name.replace(/（.*?）/g, "") } };
    }) };
  }
  function poiData() { return fc(POIS, function (p) { return catOn[p.type]; }); }
  function keyFilter() { var on = ["stay", "ski"].filter(function (t) { return catOn[t]; }); return ["in", ["get", "type"], ["literal", on]]; }

  /* 當天的站點：同一地點（例如出發與回到住宿）合併成一個點，編號寫成「1・4」 */
  function stopGroups() {
    var groups = [];
    dayPlan().stops.forEach(function (s, i) {
      var g = groups.filter(function (x) { return Math.abs(x.lat - s.lat) < 0.0004 && Math.abs(x.lon - s.lon) < 0.0004; })[0];
      if (g) { g.nums.push(i + 1); g.times.push(s.time); }
      else groups.push({ name: s.name, lat: s.lat, lon: s.lon, nums: [i + 1], times: [s.time], note: fill(s.note, T.days[state.day].date, s) });
    });
    return groups;
  }
  function stopData() {
    STOPS = stopGroups();
    return { type: "FeatureCollection", features: STOPS.map(function (g, i) {
      var role = g.nums[0] === 1 ? "start" : (g.nums[g.nums.length - 1] === dayPlan().stops.length ? "end" : "mid");
      return { type: "Feature", geometry: { type: "Point", coordinates: [g.lon, g.lat] },
        properties: { i: i, num: g.nums.join("·"), label: g.name + "  " + g.times.join("／"), role: role } };
    }) };
  }
  function routeData() {
    return { type: "FeatureCollection", features: dayPlan().legs.filter(function (l) { return l.geom; }).map(function (l, i) {
      return { type: "Feature", properties: { leg: i + 1, mode: l.mode === "walk" ? "walk" : "drive" }, geometry: { type: "LineString", coordinates: l.geom } }; }) };
  }

  function initMap() {
    if (!has("mapcanvas")) return;
    renderLayers(); renderAreas(); renderStops(); applyMode();
    KEYS = keyPoints(); POIS = explorePois(); renderDrive();
    if (!window.maplibregl) { $("#mapfallback").hidden = false; return; }
    whenNear($("#mapcanvas"), makeMap);
  }
  /* 單日頁上面有序幕在播：WebGL 地圖等捲到附近（前一個螢幕高）才建立，兩個重的東西不同時佔手機記憶體。
     其他頁照舊馬上建。所有用到 map 的地方本來就有 if (!map || !mapReady) 保護。 */
  function whenNear(el, fn) {
    if (!document.getElementById("film") || !("IntersectionObserver" in window)) { fn(); return; }
    var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); fn(); } }, { rootMargin: "100% 0px" });
    io.observe(el);
  }
  function makeMap() {
    try {
      map = new maplibregl.Map({
        container: "mapcanvas", style: "https://tiles.openfreemap.org/styles/" + (isDark ? "dark" : "positron"),
        center: [141.75, 43.28], zoom: 7, cooperativeGestures: !Plan.touch, attributionControl: { compact: true }, locale: Plan.mapOpts().locale
      });
    } catch (e) { $("#mapfallback").hidden = false; return; }
    window.SNOW13_MAP = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.getContainer().addEventListener("click", function (e) {
      var b = e.target.closest("[data-origin]"); if (!b) return;
      state.origin = b.dataset.origin; state.originManual = true; renderOrigin(); renderDrive();
    });
    map.on("load", function () {
      var C = {}; CATS.forEach(function (c) { C[c[0]] = cssVar(c[2]); });
      var ink = cssVar("--ink"), paper = cssVar("--paper"), accent = cssVar("--accent"), muted = cssVar("--muted");
      var color = ["match", ["get", "type"]]; CATS.forEach(function (c) { color.push(c[0], C[c[0]]); }); color.push(ink);

      /* 探索模式：住宿、雪場、其他地點 */
      map.addSource("poi", { type: "geojson", data: poiData(), cluster: true, clusterRadius: 44, clusterMaxZoom: 11 });
      map.addLayer({ id: "poi-cluster", type: "circle", source: "poi", filter: ["has", "point_count"],
        paint: { "circle-color": ink, "circle-opacity": 0.82, "circle-radius": ["step", ["get", "point_count"], 14, 5, 17, 10, 21], "circle-stroke-width": 2, "circle-stroke-color": paper } });
      map.addLayer({ id: "poi-count", type: "symbol", source: "poi", filter: ["has", "point_count"],
        layout: { "text-field": ["get", "point_count_abbreviated"], "text-font": ["Noto Sans Bold"], "text-size": 12, "text-allow-overlap": true }, paint: { "text-color": paper } });
      map.addLayer({ id: "poi-dot", type: "circle", source: "poi", filter: ["!", ["has", "point_count"]],
        paint: { "circle-color": color, "circle-radius": 6.5, "circle-stroke-width": 2, "circle-stroke-color": paper } });
      map.addLayer({ id: "poi-label", type: "symbol", source: "poi", filter: ["!", ["has", "point_count"]], minzoom: 10,
        layout: { "text-field": ["get", "label"], "text-font": ["Noto Sans Regular"], "text-size": 12, "text-max-width": 9,
          "text-variable-anchor": ["top", "bottom", "left", "right"], "text-radial-offset": 0.9, "text-justify": "auto" },
        paint: { "text-color": ink, "text-halo-color": paper, "text-halo-width": 1.6 } });
      map.addSource("key", { type: "geojson", data: fc(KEYS) });
      map.addLayer({ id: "key-dot", type: "circle", source: "key", filter: keyFilter(),
        paint: { "circle-color": ["match", ["get", "type"], "stay", accent, C.ski], "circle-radius": ["match", ["get", "type"], "stay", 9, 7.5], "circle-stroke-width": 3, "circle-stroke-color": paper } });
      map.addLayer({ id: "key-label", type: "symbol", source: "key", filter: keyFilter(),
        layout: { "text-field": ["get", "label"], "text-font": ["Noto Sans Bold"], "text-size": ["match", ["get", "type"], "stay", 14, 13],
          "text-variable-anchor": ["top", "bottom", "left", "right"], "text-radial-offset": 1.1, "text-justify": "auto" },
        paint: { "text-color": ["match", ["get", "type"], "stay", accent, ink], "text-halo-color": paper, "text-halo-width": 2.2 } });

      /* 當天模式：路線＋編號站點 */
      map.addSource("dayroute", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "dayroute-casing", type: "line", source: "dayroute", filter: ["==", ["get", "mode"], "drive"], layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": paper, "line-width": 9, "line-opacity": 0.95 } });
      map.addLayer({ id: "dayroute-line", type: "line", source: "dayroute", filter: ["==", ["get", "mode"], "drive"], layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": accent, "line-width": 4.5 } });
      map.addLayer({ id: "dayroute-walk", type: "line", source: "dayroute", filter: ["==", ["get", "mode"], "walk"], layout: { "line-cap": "round" }, paint: { "line-color": accent, "line-width": 3, "line-dasharray": [1, 2] } });
      map.addSource("daystops", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "stop-dot", type: "circle", source: "daystops",
        paint: { "circle-color": ["match", ["get", "role"], "mid", ink, accent], "circle-radius": ["case", [">", ["length", ["get", "num"]], 2], 17, 13], "circle-stroke-width": 3, "circle-stroke-color": paper } });
      map.addLayer({ id: "stop-num", type: "symbol", source: "daystops",
        layout: { "text-field": ["get", "num"], "text-font": ["Noto Sans Bold"], "text-size": 12, "text-allow-overlap": true, "text-ignore-placement": true },
        paint: { "text-color": paper } });
      map.addLayer({ id: "stop-label", type: "symbol", source: "daystops",
        layout: { "text-field": ["get", "label"], "text-font": ["Noto Sans Bold"], "text-size": 13, "text-max-width": 14,
          "text-variable-anchor": ["left", "right", "top", "bottom"], "text-radial-offset": 1.5, "text-justify": "auto" },
        paint: { "text-color": ink, "text-halo-color": paper, "text-halo-width": 2.4 } });

      function open(list, f) {
        var p = list[f.properties.i]; if (!p) return;
        new maplibregl.Popup({ offset: 14, maxWidth: "290px" }).setLngLat([p.lon, p.lat]).setHTML(popupHTML(p)).addTo(map);
      }
      ["key-dot", "key-label"].forEach(function (id) { map.on("click", id, function (e) { open(KEYS, e.features[0]); }); });
      ["poi-dot", "poi-label"].forEach(function (id) { map.on("click", id, function (e) { open(POIS, e.features[0]); }); });
      ["stop-dot", "stop-label"].forEach(function (id) { map.on("click", id, function (e) { var g = STOPS[e.features[0].properties.i]; if (g) open([{ name: g.nums.map(function (n) { return CIRCLED[n - 1] || n; }).join("") + " " + g.name, note: g.times.join("／") + "　" + g.note, lat: g.lat, lon: g.lon }], { properties: { i: 0 } }); }); });
      map.on("click", "poi-cluster", function (e) {
        var f = e.features[0];
        map.getSource("poi").getClusterExpansionZoom(f.properties.cluster_id).then(function (z) {
          map.easeTo({ center: f.geometry.coordinates, zoom: z + 0.5 });
        }).catch(function () { map.easeTo({ center: f.geometry.coordinates, zoom: map.getZoom() + 2 }); });
      });
      ["key-dot", "key-label", "poi-dot", "poi-label", "poi-cluster", "stop-dot", "stop-label"].forEach(function (id) {
        map.on("mouseenter", id, function () { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", id, function () { map.getCanvas().style.cursor = ""; });
      });
      mapReady = true;
      if (PAGE === "day") updateRoute(false); else { applyMode(); fitArea(false); }
    });
  }
  var EXPLORE_LAYERS = ["poi-cluster", "poi-count", "poi-dot", "poi-label", "key-dot", "key-label"];
  var DAY_LAYERS = ["dayroute-casing", "dayroute-line", "dayroute-walk", "stop-dot", "stop-num", "stop-label"];
  function applyMode() {
    var day = state.area === "day";
    if (has("layers")) $("#layers").hidden = day;
    if (has("stoppanel")) $("#stoppanel").hidden = !day;
    if (has("explorepanel")) $("#explorepanel").hidden = day;
    if (!map || !mapReady) return;
    EXPLORE_LAYERS.forEach(function (id) { map.setLayoutProperty(id, "visibility", day ? "none" : "visible"); });
    DAY_LAYERS.forEach(function (id) { map.setLayoutProperty(id, "visibility", day ? "visible" : "none"); });
  }
  function renderLayers() {
    var box = $("#layers"); if (!box) return;
    box.innerHTML = CATS.map(function (c) {
      return '<button type="button" class="chip" aria-pressed="' + catOn[c[0]] + '" data-cat="' + c[0] + '" style="--mc:var(' + c[2] + ')"><i></i>' + c[1] + '</button>';
    }).join("");
    box.onclick = function (e) {
      var b = e.target.closest("[data-cat]"); if (!b) return;
      var k = b.dataset.cat; catOn[k] = !catOn[k]; b.setAttribute("aria-pressed", catOn[k]);
      if (!map || !mapReady) { renderDrive(); return; }
      if (k === "stay" || k === "ski") { map.setFilter("key-dot", keyFilter()); map.setFilter("key-label", keyFilter()); }
      else map.getSource("poi").setData(poiData());
      renderDrive();
    };
  }
  function renderAreas() {
    var box = $("#areas"); if (!box) return;
    box.innerHTML = AREAS.map(function (a) {
      var label = a[0] === "day" ? md(T.days[state.day].date) + " 行程" : a[1];
      return '<button type="button" role="tab" aria-selected="' + (state.area === a[0]) + '" data-area="' + a[0] + '">' + esc(label) + '</button>';
    }).join("");
    box.onclick = function (e) {
      var b = e.target.closest("[data-area]"); if (!b) return;
      state.area = b.dataset.area; renderAreas(); applyMode(); fitArea(true); renderDrive();
    };
  }
  function fitArea(animate) {
    if (!map || !mapReady) return;
    var w = map.getContainer().clientWidth, pad = w < 500 ? 40 : 80;
    var opt = { padding: { top: pad + 10, bottom: pad + 10, left: pad, right: w < 500 ? 120 : 150 }, maxZoom: 13, duration: animate ? 800 : 0 };
    if (state.area !== "day") {
      var a = AREAS.filter(function (x) { return x[0] === state.area; })[0];
      map.fitBounds(a[2], opt); return;
    }
    var pts = dayPlan().stops.map(function (s) { return [s.lon, s.lat]; });
    routeData().features.forEach(function (f) { f.geometry.coordinates.forEach(function (c) { pts.push(c); }); });
    if (!pts.length) { var b = baseById[T.days[state.day].base]; pts.push([b.lon, b.lat]); }
    var bounds = new maplibregl.LngLatBounds(pts[0], pts[0]);
    pts.forEach(function (c) { bounds.extend(c); });
    map.fitBounds(bounds, opt);
  }
  function updateRoute(animate) {
    renderStops();
    if (!map || !mapReady) return;
    map.getSource("dayroute").setData(routeData());
    map.getSource("daystops").setData(stopData());
    state.area = "day"; renderAreas(); applyMode();
    fitArea(animate);
  }
  function renderStops() {
    if (!has("stoppanel")) return;
    var d = T.days[state.day], plan = dayPlan(), o = null;
    var html = '<h3 class="panel-h">' + md(d.date) + '（' + dow(d.date) + '）行程點</h3><ol class="stops">';
    plan.stops.forEach(function (s, i) {
      var role = i === 0 ? " start" : (i === plan.stops.length - 1 ? " end" : "");
      if (i > 0) {
        var l = plan.legs[i - 1], prev = plan.stops[i - 1];
        /* 開車段導到這站的停車場（plan.json park），走路段導到地點本身；都不帶起點＝從現在位置直接開始導航 */
        var pk = l.mode === "drive" && Plan.plan.places[s.id] && Plan.plan.places[s.id].park;
        var nav = l.mode === "walk" ? '<a href="' + Plan.navUrl(s.id, "walk") + '" target="_blank" rel="noopener">步行導航</a>'
          : l.mode === "taxi" ? '<a href="' + Plan.navUrl(s.id, "walk").replace("travelmode=walking", "travelmode=transit") + '" target="_blank" rel="noopener">地鐵導航</a>'
          : l.mode === "shuttle" ? ""
          : '<a href="' + Plan.navUrl(s.id) + '" target="_blank" rel="noopener"' + (pk ? ' title="導到停車場：' + esc(pk.name) + '"' : "") + '>導航' + (pk ? '<small>到 ' + esc(pk.short || pk.name) + '</small>' : "") + '</a>';
        html += '<li class="hop"><span>' + (l.mode === "walk" ? "步行 " : l.mode === "shuttle" ? "接駁 " : l.mode === "taxi" ? "計程車 " : "") + l.km + ' km · ' + fmtMin(l.min) + (l.mode === "drive" ? '<em>' + (state.mode === "snow" ? "一般 " + fmtMin(l.normal) : "雪 " + fmtMin(l.snow)) + '</em>' : "") + '</span>' + nav + '</li>';
      }
      html += '<li class="stop' + role + (s.late ? " late" : "") + '" data-s="' + i + '"><b class="n">' + (i + 1) + '</b><div><div class="st"><time>' + esc(s.time) + '</time> ' + esc(s.name) + jaTag(s.ja, s.name) + '</div><div class="sn">' + (s.stay && i < plan.stops.length - 1 ? '<span class="stay" style="margin:0 8px 4px 0">停 ' + fmtMin(s.stay) + ' → ' + s.timeDep + '</span>' : "") + lateTag(s) + em(fill(s.note, d.date, s)) + '</div></div></li>';
    });
    html += '</ol>';
    $("#stoppanel").innerHTML = html;
  }
  if (has("stoppanel")) $("#stoppanel").addEventListener("click", function (e) {
    var li = e.target.closest("[data-s]"); if (!li || !map) return;
    var s = dayPlan().stops[+li.dataset.s];
    map.flyTo({ center: [s.lon, s.lat], zoom: Math.max(map.getZoom(), 13), duration: 700 });
  });

  /* ---------- 出發地與車程 ---------- */
  function renderOrigin() {
    if (!has("origin")) return;
    var opts = T.bases.map(function (b) { return [b.id, b.short]; });
    if (state.gps) opts.push(["gps", "我的位置"]);
    $("#origin").innerHTML = opts.map(function (o) {
      return '<button type="button" role="radio" aria-checked="' + (state.origin === o[0]) + '" data-o="' + o[0] + '">' + esc(o[1]) + '</button>';
    }).join("");
  }
  /* 換出發地時，地圖跟著回到那一區（住宿 → 該區範圍；我的位置 → 目前位置） */
  var ORIGIN_AREA = { villa: "otaru", furano: "furano", sapporo: "sapporo" }, gpsSeq = 0;
  function showOrigin() {
    if (!map || !mapReady) return;
    if (state.origin === "gps") {
      if (!state.gps) return;
      map.flyTo({ center: [state.gps.lon, state.gps.lat], zoom: Math.max(map.getZoom(), 9), duration: 900 });
      document.querySelectorAll("#areas [aria-selected]").forEach(function (b) { b.setAttribute("aria-selected", "false"); });
      return;
    }
    var a = ORIGIN_AREA[state.origin];
    if (!a || !AREAS.some(function (x) { return x[0] === a; })) return;
    state.area = a; renderAreas(); applyMode(); fitArea(true);
  }
  function inHokkaido(p) { return p.lat > 41.3 && p.lat < 45.7 && p.lon > 139.3 && p.lon < 146; }
  if (has("origin")) $("#origin").addEventListener("click", function (e) {
    var b = e.target.closest("[data-o]"); if (!b) return;
    if (b.dataset.o !== "gps") { gpsSeq++; if (has("gpsmsg")) $("#gpsmsg").textContent = ""; }
    state.origin = b.dataset.o; state.originManual = true; renderOrigin(); showOrigin(); renderDrive();
  });
  function originPoint() {
    if (state.origin === "gps") return state.gps;
    var b = baseById[state.origin]; return { lat: b.lat, lon: b.lon };
  }
  /* ---------- 車程表：出發地 → 目前圖層上、目前地圖範圍內的地點 ----------
     住宿→雪場用 trip.js 的表；其他組合向 OSRM 查（批次、快取在這支裝置），還沒查到前先用直線估算 */
  var DRIVE = store("snow13-drive") || {}, driveBusy = {}, driveShowAll = false;
  T.bases.forEach(function (b) { var tbl = T.drive[b.id] || {}; T.resorts.forEach(function (r) { if (tbl[r.id]) DRIVE[b.id + "|" + r.lon + "," + r.lat] = tbl[r.id]; }); });
  function originKey() { if (state.origin !== "gps") return state.origin; var g = state.gps; return "gps|" + g.lat.toFixed(3) + "," + g.lon.toFixed(3); }
  var CAT_NAME = {}; CATS.forEach(function (c) { CAT_NAME[c[0]] = c[1]; });
  function areaBounds() { var a = AREAS.filter(function (x) { return x[0] === state.area; })[0]; return a && a[2] ? a[2] : null; }
  function inBounds(p, b) { return !b || (p.lon >= b[0][0] && p.lon <= b[1][0] && p.lat >= b[0][1] && p.lat <= b[1][1]); }
  function driveTargets() {
    var list = [], b = areaBounds();
    if (catOn.ski) T.resorts.forEach(function (r) { list.push({ type: "ski", name: r.name, ja: r.ja, sub: r.tier, lat: r.lat, lon: r.lon }); });
    if (catOn.stay) T.bases.forEach(function (x) { if (x.id !== state.origin) list.push({ type: "stay", name: x.name, sub: x.short, lat: x.lat, lon: x.lon }); });
    POIS.forEach(function (p) { if (p.type !== "ski" && p.type !== "stay" && catOn[p.type]) list.push({ type: p.type, name: p.name, ja: p.ja, sub: p.sub, lat: p.lat, lon: p.lon, link: p.link, linkText: p.linkText }); });
    return list.filter(function (p) { return inBounds(p, b); });
  }
  function fetchDrive(ok, o, missing) {
    var key = ok + "#" + missing.length + "#" + missing[0].lon; if (driveBusy[key]) return; driveBusy[key] = true;
    var chunks = []; for (var i = 0; i < missing.length; i += 80) chunks.push(missing.slice(i, i + 80));
    Promise.all(chunks.map(function (ch) {
      var coords = [o.lon + "," + o.lat].concat(ch.map(function (p) { return p.lon + "," + p.lat; })).join(";");
      return fetch("https://router.project-osrm.org/table/v1/driving/" + coords + "?sources=0&annotations=duration,distance").then(function (r) { return r.json(); }).then(function (j) {
        if (j.code !== "Ok") throw new Error("route");
        ch.forEach(function (p, k) { var sec = j.durations[0][k + 1], m = j.distances[0][k + 1]; if (sec != null) DRIVE[ok + "|" + p.lon + "," + p.lat] = [Math.round(m / 100) / 10, r5(sec / 60 * 1.15), r5(sec / 60 * 1.5)]; });
      });
    })).then(function () { store("snow13-drive", DRIVE); if (has("gpsmsg") && state.origin === "gps") $("#gpsmsg").textContent = "已用目前位置計算路線車程。"; renderDrive(); })
      .catch(function () { if (has("gpsmsg") && state.origin === "gps") $("#gpsmsg").textContent = "路線服務暫時連不上，先用直線距離估算。"; })
      .then(function () { delete driveBusy[key]; });
  }
  function renderDrive() {
    if (!has("drivelist")) return;
    var o = originPoint(), ok = originKey(), missing = [];
    var rows = driveTargets().map(function (p) {
      var x = DRIVE[ok + "|" + p.lon + "," + p.lat];
      if (x) return { p: p, km: x[0], n: x[1], s: x[2], est: false };
      missing.push(p);
      var km = haversine(o, p) * 1.35, min = km / 45 * 60;
      return { p: p, km: Math.round(km * 10) / 10, n: r5(min), s: r5(min * 1.3), est: true };
    });
    rows.sort(function (a, b) { return a.n - b.n; });
    if (missing.length) fetchDrive(ok, o, missing);
    var cap = $("#drivecap");
    if (cap) {
      var on = CATS.filter(function (c) { return catOn[c[0]]; }).map(function (c) { return c[1]; });
      cap.textContent = rows.length ? "到" + (state.area === "all" || !areaBounds() ? "全北海道" : "這一區") + "的 " + on.join("、") + " " + rows.length + " 個，近的在前" + (missing.length ? "（部分先用直線估算，路線算好會更新）" : "") : "上面的圖層都關了，開「雪場」「景點」「餐廳」等就會列出車程。";
    }
    var LIM = 25, shown = driveShowAll ? rows : rows.slice(0, LIM);
    $("#drivelist").innerHTML = shown.map(function (x) {
      var p = x.p;
      return '<li><div><div class="nm"><i class="dot" style="--mc:var(--' + (p.type === "stay" ? "accent" : "c-" + p.type) + ')"></i>' + esc(p.name) + jaTag(p.ja, p.name) + '</div><div class="km">' + esc(CAT_NAME[p.type]) + (p.sub ? ' · ' + em(p.sub) : '') + ' · ' + x.km + ' km' + (x.est ? '（直線估算）' : '') + '</div></div>' +
        '<div class="t">' + fmtMin(x.n) + '<small>下雪 ' + fmtMin(x.s) + '</small></div>' +
        '<span class="lk">' + (p.link ? '<a href="' + esc(p.link) + '">' + esc(p.linkText || "看詳細 →") + '</a>' : '') + '<a href="' + navTo(p) + '" target="_blank" rel="noopener">開 Google Maps 導航 →</a></span></li>';
    }).join("") + (rows.length > shown.length ? '<li class="more"><button type="button" id="drivemore">還有 ' + (rows.length - shown.length) + ' 個，全部顯示</button></li>' : "");
    var mb = $("#drivemore"); if (mb) mb.onclick = function () { driveShowAll = true; renderDrive(); };
  }
  if (has("gpsbtn")) $("#gpsbtn").addEventListener("click", function () {
    var msg = $("#gpsmsg");
    if (!navigator.geolocation) { msg.textContent = "這個瀏覽器不支援定位，請改選住宿。"; return; }
    msg.textContent = "定位中…";
    var seq = ++gpsSeq;
    navigator.geolocation.getCurrentPosition(function (pos) {
      if (seq !== gpsSeq) return;   // 定位途中已經改選住宿，就不再搶走出發地
      var here = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      /* 人不在北海道（例如出發前在台灣試按）：地圖不飛走，車程照樣從住宿算 */
      if (!inHokkaido(here)) {
        var near = T.bases.map(function (b) { return [b, haversine(here, b)]; }).sort(function (x, y) { return x[1] - y[1]; })[0];
        msg.textContent = "你現在不在北海道（離" + near[0].short + "約 " + nf(Math.round(near[1] / 10) * 10) + " km），車程先從住宿算；到了北海道再按一次。";
        return;
      }
      state.gps = here;
      state.origin = "gps"; state.originManual = true;
      msg.textContent = "已定位（誤差約 " + Math.round(pos.coords.accuracy) + " m），正在計算路線…";
      renderOrigin(); renderDrive();
      if (map) {
        if (!gpsMarker) {
          var el = document.createElement("div"); el.className = "marker"; el.style.setProperty("--mc", "var(--ink)"); el.textContent = "我";
          gpsMarker = new maplibregl.Marker({ element: el }).setLngLat([state.gps.lon, state.gps.lat]).addTo(map);
        } else gpsMarker.setLngLat([state.gps.lon, state.gps.lat]);
        showOrigin();
      }
      renderDrive();   // 會向 OSRM 查目前位置到各地點的車程，算好後自動更新
    }, function (err) {
      msg.textContent = err.code === 1 ? "沒有定位權限。請在瀏覽器設定允許，或直接選住宿。" : "暫時定位不到，請稍後再試或直接選住宿。";
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  });

  /* ---------- 雪場：卡片搬到 ski/（滑雪地圖），首頁只留一塊縮圖 ---------- */
  var SKI_GROUP_COLOR = Plan.groupColor();  /* 雪場分組顏色跟主題（plan.js） */
  function renderSkiStats() {
    if (!has("skistats")) return;
    var n = {}; T.resorts.forEach(function (r) { n[r.group || "main"] = (n[r.group || "main"] || 0) + 1; });
    var open = T.resorts.filter(function (r) { return r.season && TODAY >= r.season[0] && TODAY <= r.season[1]; }).length;
    var next = T.resorts.filter(function (r) { return r.season && TODAY < r.season[0]; }).sort(function (a, b) { return a.season[0] < b.season[0] ? -1 : 1; })[0];
    $("#skistats").innerHTML = '<span class="fs-total"><b>' + T.resorts.length + '</b> 座雪場' + (T.resortGroups || []).map(function (g) { return n[g.id] ? ' · ' + esc(g.short) + ' ' + n[g.id] : ""; }).join("") + (open ? ' · 營業中 ' + open : next ? ' · 最早 ' + md(next.season[0]) + ' 開季（' + esc(next.name.replace(/（.*?）/g, "")) + '）' : "") + '</span>' +
      '<span class="fs-area" style="--mc:' + SKI_GROUP_COLOR.main + '"><i></i>Kiroro 1/8–1/10</span><span class="fs-area" style="--mc:' + SKI_GROUP_COLOR.main + '"><i></i>富良野 1/12–1/14</span><span class="fs-area" style="--mc:' + SKI_GROUP_COLOR.sapporo + '"><i></i>Teine 想滑再去</span><span class="fs-area" style="--mc:' + SKI_GROUP_COLOR.asahikawa + '"><i></i>旭川 等 Gacha 確認</span>';
  }

  /* ---------- 天氣 ---------- */
  var WX_TABS = [
    { id: "villa", label: "小樽・山鄉" }, { id: "t_kiroro", label: "Kiroro 山頂" }, { id: "furano", label: "富良野" },
    { id: "t_furano_kita", label: "富良野山頂" }, { id: "sapporo", label: "札幌" }, { id: "r_teine", label: "Teine" }
  ];
  function loadWeather() {
    var daily = "weather_code,temperature_2m_max,temperature_2m_min,snowfall_sum,precipitation_probability_max,wind_gusts_10m_max";
    var A = [
      ["villa", 43.1468, 141.1355], ["furano", 43.3325, 142.3632], ["sapporo", 43.0524, 141.3486],
      ["r_onze", 43.1439, 141.1278], ["r_teine", 43.0944, 141.2112], ["r_asari", 43.1385, 141.0293],
      ["r_kokusai", 43.0722, 141.0828], ["r_bankei", 43.0305, 141.2781], ["r_moiwa", 43.0110, 141.3346], ["r_fus", 42.9542, 141.2794]
    ];
    var B = [
      ["r_kiroro", 43.0674, 140.9904, 570], ["t_kiroro", 43.0790, 140.9670, 1180],
      ["r_furano_kita", 43.3404, 142.3433, 250], ["t_furano_kita", 43.3280, 142.3150, 900],
      ["t_teine", 43.0800, 141.1994, 1023], ["t_kokusai", 43.0640, 141.0700, 1100]
    ];
    function url(list, elev) {
      var u = "https://api.open-meteo.com/v1/forecast?latitude=" + list.map(function (x) { return x[1]; }).join(",") +
        "&longitude=" + list.map(function (x) { return x[2]; }).join(",") + "&daily=" + daily + "&timezone=Asia%2FTokyo&forecast_days=16";
      if (elev) u += "&elevation=" + list.map(function (x) { return x[3]; }).join(",");
      return u;
    }
    function take(list, j) { (Array.isArray(j) ? j : [j]).forEach(function (o, k) { if (list[k]) state.wx[list[k][0]] = o; }); }
    function done() { renderWxStrip(); renderDay(); refreshPosterWx(); }
    function get(list, elev, retry) {
      return fetch(url(list, elev)).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (j) { take(list, j); done(); })
        .catch(function () {
          if (!retry) { setTimeout(function () { get(list, elev, true); }, 2500); return; }
          state.wxFail = true; done();
        });
    }
    get(A, false);
    get(B, true);
  }
  function renderWxTabs() {
    if (!has("wxtabs")) return;
    $("#wxtabs").innerHTML = WX_TABS.map(function (t) {
      return '<button type="button" role="tab" aria-selected="' + (state.wxTab === t.id) + '" data-t="' + t.id + '">' + esc(t.label) + '</button>';
    }).join("");
    $("#wxtabs").onclick = function (e) {
      var b = e.target.closest("[data-t]"); if (!b) return;
      state.wxTab = b.dataset.t; renderWxTabs(); renderWxStrip();
    };
  }
  function renderWxStrip() {
    var w = state.wx[state.wxTab], box = $("#wxstrip"); if (!box) return;
    if (!w || !w.daily) { box.innerHTML = '<div class="wxmsg">' + (state.wxFail ? "暫時連不上天氣服務，請稍後重新整理。" : "天氣資料載入中…") + '</div>'; return; }
    var dd = w.daily;
    box.innerHTML = dd.time.map(function (t, k) {
      var m = wmo(dd.weather_code[k]), trip = t >= T.start && t <= T.end;
      return '<div class="wxc' + (trip ? " trip" : "") + '"><span class="d">' + md(t) + '</span><span class="w">週' + dow(t) + (trip ? "・旅程" : "") + '</span>' + ICON[m[1]] +
        '<span class="hi">' + Math.round(dd.temperature_2m_max[k]) + '°</span><span class="lo">' + Math.round(dd.temperature_2m_min[k]) + '°</span>' +
        '<span class="sn">雪 ' + (dd.snowfall_sum[k] || 0).toFixed(1) + ' cm</span><span class="gu">陣風 ' + Math.round(dd.wind_gusts_10m_max[k]) + '</span></div>';
    }).join("");
    var first = dd.time[0], last = dd.time[dd.time.length - 1];
    $("#wxnote").textContent = (last < T.start)
      ? "目前顯示 " + md(first) + "–" + md(last) + " 的即時預報，可以先看雪況累積；旅程日期還沒進入預報範圍，參考下方歷年平均。"
      : "即時預報（Open-Meteo）。紅框是旅程日期。陣風單位 km/h。";
  }
  function renderClimate() {
    if (!has("climate")) return;
    var rows = Object.keys(T.climate).map(function (k) {
      var c = T.climate[k]; return '<tr><td>' + esc(c.label) + '</td><td>' + c.tmax + '°</td><td>' + c.tmin + '°</td><td>' + c.snow + ' cm</td></tr>';
    }).join("");
    $("#climate").innerHTML = '<table><thead><tr><th>1/7–1/19 歷年平均</th><th>高溫</th><th>低溫</th><th>每日新雪</th></tr></thead><tbody>' + rows + '</tbody></table>';
    $("#roadlinks").innerHTML = T.links.map(function (l) { return '<li><a href="' + esc(l[1]) + '" target="_blank" rel="noopener">' + esc(l[0]) + ' ↗</a></li>'; }).join("");
  }

  /* ---------- 吃喝：清單在 data/food.js ---------- */
  var FOOD = window.FOOD || [], FOOD_AREAS = window.FOOD_AREAS || {};
  var FIT = { best: ["很適合我們這團帶小孩", "best"], ok: ["可以", "ok"], warn: ["不太適合帶幼兒", "warn"], unknown: ["待確認", "unknown"] };
  function foodItem(f, d, b) {
    var wd = d ? new Date(d.date + "T00:00:00").getDay() : -1, closedToday = f.closed && f.closed.indexOf(wd) >= 0;
    var planned = !!(d && Plan.plannedIds(d.date).indexOf(f.id) >= 0);
    var km = b ? haversine(b, f) * 1.35 : 0, min = b ? r5(km / 40 * 60) : 0;
    var fit = FIT[f.fit] || FIT.ok;
    var g = f.g, stars = g ? '<span class="stars" aria-label="Google 評價 ' + g.rating + '"><i style="--r:' + (g.rating / 5 * 100) + '%"></i></span><b>' + g.rating.toFixed(1) + '</b><small>' + nf(g.n) + ' 則 · Google</small>' : '<small class="nog">Google 評價待查</small>';
    var mapsUrl = g ? 'https://www.google.com/maps/place/?q=place_id:' + g.pid : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(f.name.replace(/（.*?）/g, "") + " " + (f.area === "Kiroro" ? "キロロ" : f.area));
    return '<li class="fp ' + fit[1] + (closedToday ? " closed" : "") + (planned ? " planned" : "") + '" data-fid="' + f.id + '">' +
      '<div class="fp-top"><b>' + esc(f.name) + '</b><span class="kind">' + esc(f.kind) + '</span>' + (f.rec ? '<span class="badge rec">推薦 ' + f.rec + '</span>' : "") + (f.via ? '<span class="badge via">' + esc(f.via) + '</span>' : "") + (planned ? '<span class="badge gold">今天預計</span>' : "") + (closedToday ? '<span class="badge red">今天公休</span>' : "") + '</div>' +
      '<div class="fp-rating">' + stars + '</div>' +
      '<p class="fp-what">' + em(f.what) + '</p>' +
      '<p class="fp-meta">' + em(f.hours) + (f.closed && f.closed.length ? ' · 週' + f.closed.map(function (x) { return DOW[x]; }).join("、") + '休' : "") + (b ? ' · 從' + esc(b.short.split("・").pop()) + '約 ' + min + ' 分' : "") + ' · <span class="fit">' + fit[0] + '</span></p>' +
      '<div class="fp-act">' + (g ? '<button type="button" class="fp-more" data-q="' + esc(g.q) + '">照片與評論 ▾</button>' : "") + '<a href="' + mapsUrl + '" target="_blank" rel="noopener">在 Google Maps 開啟 →</a></div>' +
      '<div class="fp-embed" hidden></div></li>';
  }
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".fp-more"); if (!btn) return;
    var li = btn.closest(".fp"), box = li.querySelector(".fp-embed");
    if (!box.hidden) { box.hidden = true; box.innerHTML = ""; btn.textContent = "照片與評論 ▾"; return; }
    box.innerHTML = '<iframe loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Google Maps" src="https://maps.google.com/maps?hl=zh-TW&q=' + encodeURIComponent(btn.dataset.q) + '&z=16&output=embed"></iframe><p class="fp-embedhint">Google 的照片、評論與目前營業狀態；點左上角店名可以在 Google Maps 開大圖。</p>';
    box.hidden = false; btn.textContent = "收起 ▴";
  });
  function picksBlock(d, linkBase) {
    var body = Plan.picksHTML(d.date, function (id, t, cls) { return '<a' + (cls ? ' class="' + cls + '"' : "") + ' href="' + linkBase + '#' + id + '">' + t + '</a>'; });
    return body ? '<div class="picks"><p class="picks-h">這天怎麼吃 <small>依 {party} 帶幼兒的條件挑的；藍色是建議、金色是已決定。備案是想吃好一點或現場排太久時換的。</small></p>'.replace("{party}", esc(d.date === (T.nanny || {}).lastDay ? "白天 " + Plan.fill("{party}", d.date) + "、晚餐起 " + Plan.partyOf("2099-01-01") : Plan.fill("{party}", d.date))) + body + '</div>' : "";
  }
  /* 可收合的長清單：標題列永遠看得到，內容預設收起；打開狀態在重新渲染後保留 */
  function fold(id, head, sub, body) {
    var open = FOLD_OPEN[id];
    return '<details class="fold" id="' + id + '"' + (open ? " open" : "") + '><summary><span class="fold-h">' + head + '</span>' + (sub ? '<span class="fold-s">' + sub + '</span>' : "") + '<i class="fold-chev" aria-hidden="true"></i></summary><div class="fold-body">' + body + '</div></details>';
  }
  var FOLD_OPEN = {};
  document.addEventListener("toggle", function (e) { var d = e.target; if (d && d.classList && d.classList.contains("fold")) FOLD_OPEN[d.id] = d.open; }, true);
  function openFoldFor(hash) {
    var id = hash === "#dayfood" ? "foldfood" : hash === "#dayspots" ? "foldspots" : null; if (!id) return;
    var d = document.getElementById(id); if (d && !d.open) { d.open = true; FOLD_OPEN[id] = true; }
  }
  addEventListener("hashchange", function () { openFoldFor(location.hash); });
  document.addEventListener("click", function (e) { var a = e.target.closest('a[href="#dayfood"],a[href="#dayspots"]'); if (a) openFoldFor(a.getAttribute("href")); });
  function foodBlock(d, b) {
    var areas = FOOD_AREAS[d.base] || [], mine = Plan.mealIds(d.date), list = FOOD.filter(function (f) { return areas.indexOf(f.area) >= 0 || mine.indexOf(f.id) >= 0; });
    areas = areas.concat(list.map(function (f) { return f.area; }).filter(function (a, i, arr) { return areas.indexOf(a) < 0 && arr.indexOf(a) === i; }));
    var planned = Plan.plannedIds(d.date), isP = function (f) { return planned.indexOf(f.id) >= 0; };
    var byArea = {}; list.forEach(function (f) { (byArea[f.area] = byArea[f.area] || []).push(f); });
    var wd = new Date(d.date + "T00:00:00").getDay();
    var nClosed = list.filter(function (f) { return f.closed && f.closed.indexOf(wd) >= 0; }).length, nPlanned = list.filter(isP).length;
    var ms = Plan.meals(d.date).filter(function (p) { return p.slot === "lunch" || p.slot === "dinner"; });
    var html = '<div class="sec-head"><h2>今天可以吃什麼</h2><p class="sec-note">' + ms.map(function (p) { return Plan.SLOT_LONG[p.slot] + " " + esc(Plan.mealName(p)); }).join("；") + '。</p></div>' + picksBlock(d, BASE + "food/?day=" + d.date);
    var body = '<a class="btn btn-ghost fm-link" href="' + BASE + 'food/?day=' + d.date + '">在美食地圖上看這些店 →</a>';
    areas.forEach(function (ar) {
      if (!byArea[ar]) return;
      var items = byArea[ar].slice().sort(function (x, y) { var px = isP(x), py = isP(y); if (px !== py) return px ? -1 : 1; var cx = x.closed && x.closed.indexOf(wd) >= 0, cy = y.closed && y.closed.indexOf(wd) >= 0; if (cx !== cy) return cx ? 1 : -1; if ((x.rec || 99) !== (y.rec || 99)) return (x.rec || 99) - (y.rec || 99); var o = { best: 0, ok: 1, unknown: 2, warn: 3 }; return (o[x.fit] || 1) - (o[y.fit] || 1); });
      body += '<h3 class="h3">' + esc(ar) + (ar === "Kiroro" ? "（雪場內，午餐；2025-26 雪季資訊）" : "") + ' · ' + items.length + ' 家</h3><ul class="foodpick">' + items.map(function (f) { return foodItem(f, d, b); }).join("") + '</ul>';
    });
    html += fold("foldfood", '附近所有的店 <b>' + list.length + '</b> 家', '住在' + esc(b.short.split("・").pop()) + '這幾天附近的店，按地區分' + (nPlanned ? ' · 今天預計 ' + nPlanned : "") + (nClosed ? ' · 今天公休 ' + nClosed : "") + ' · 點開看', body);
    return html;
  }
  function renderFood() {
    if (!has("foodstats") || !FOOD.length) return;
    var order = ["Kiroro", "銭函", "小樽", "富良野", "美瑛・旭川", "札幌"], col = Plan.areaColor();
    var n = {}; FOOD.forEach(function (f) { n[f.area] = (n[f.area] || 0) + 1; });
    var rated = FOOD.filter(function (f) { return f.g; }).length;
    $("#foodstats").innerHTML = '<span class="fs-total"><b>' + FOOD.length + '</b> 家 · ' + rated + ' 家有 Google 評價</span>' +
      order.filter(function (a) { return n[a]; }).map(function (a) { return '<span class="fs-area" style="--mc:' + col[a] + '"><i></i>' + esc(a) + ' <b>' + n[a] + '</b></span>'; }).join("");
  }
  /* ---------- 景點收藏：清單在 data/spots.js ---------- */
  var SPOTS = window.SPOTS || [], SPOT_AREAS = window.SPOT_AREAS || {};
  var SPOT_STATUS = { plan: ["正式行程", "st-gold"], saved: ["收藏", "st-blue"], check: ["待確認", "st-grey"] };
  function spotBlock(d, b) {
    if (!SPOTS.length) return "";
    var wd = new Date(d.date + "T00:00:00").getDay();
    var todayIds = (window.Plan && Plan.plan ? Plan.schedule(d.date, state.mode).stops : []).map(function (s) { return s.id; });
    var areas = SPOT_AREAS[d.base] || [];
    /* 停車場有自己的「車停哪裡」卡；雪場在「滑雪地圖」比較，不混進景點清單 */
    var list = SPOTS.filter(function (s) { return s.status !== "plan" && areas.indexOf(s.area) >= 0 && s.kind !== "停車" && s.kind !== "雪場"; }).map(function (s) {
      var near = Math.min.apply(null, [haversine(b, s)].concat(todayIds.map(function (id) { var p = Plan.plan.places[id]; return p ? haversine(p, s) : 99; })));
      return { s: s, near: near };
    }).filter(function (x) { return x.near < 30; }).sort(function (x, y) { return x.near - y.near; }).slice(0, 8);
    if (!list.length) return "";
    /* 沒排滑雪的日子（頭尾兩天除外）：列出當晚住宿開車 90 分內、不在正式行程的雪場，依 trip.js resortGroups 分組 */
    var skiToday = T.resorts.some(function (r) { return (r.stops || []).some(function (s) { return todayIds.indexOf(s) >= 0; }); });
    var dr = T.drive[d.base] || {};
    var skiNear = skiToday || d.date === T.start || d.date === T.end ? [] : T.resorts.filter(function (r) { return (r.group || "main") !== "main" && dr[r.id] && dr[r.id][1] <= 90; });
    var skiGroups = (T.resortGroups || []).filter(function (g) { return skiNear.some(function (r) { return r.group === g.id; }); });
    var html = '<div class="sec-head"><h2>附近還可以去</h2><p class="sec-note">還沒排進今天、但離今天路線 30 公里內的收藏景點：天氣不好、小孩狀況不對、或提早結束時的備案。點「加入行程」會帶進編輯器。</p></div>';
    if (skiNear.length) html += '<p class="ski-hint">大人想滑雪？' + skiGroups.map(function (g) { var rs = skiNear.filter(function (r) { return r.group === g.id; }); return esc(g.short) + ' ' + rs.length + ' 座（' + rs.map(function (r) { return esc(r.name.replace(/（.*?）|滑雪場|雪場/g, "")) + ' ' + fmtMin(dr[r.id][1]); }).join("、") + '）'; }).join("；") + '：票價、入口、天氣和建議在 <a href="' + BASE + 'ski/?day=' + d.date + '#g-' + skiGroups[0].id + '">滑雪地圖 →</a></p>';
    var body = '<a class="btn btn-ghost fm-link" href="' + BASE + 'spots/?day=' + d.date + '">在景點地圖上看 →</a><ul class="foodpick">';
    list.forEach(function (x) {
      var s = x.s, st = SPOT_STATUS[s.status] || SPOT_STATUS.saved, closed = s.closed && s.closed.indexOf(wd) >= 0, g = s.g;
      var km = x.near * 1.35, min = r5(km / 40 * 60);
      body += '<li class="fp ' + (s.kids === "best" ? "best" : s.kids === "warn" ? "warn" : "ok") + (closed ? " closed" : "") + '">' + Plan.spotPhoto(s) +
        '<div class="fp-top"><b>' + esc(s.name) + '</b><span class="kind">' + esc(s.kind) + '</span><span class="badge ' + st[1] + '">' + st[0] + '</span>' + (closed ? '<span class="badge red">今天公休</span>' : "") + '</div>' +
        (g && g.rating ? '<div class="fp-rating"><span class="stars"><i style="--r:' + (g.rating / 5 * 100) + '%"></i></span><b>' + g.rating.toFixed(1) + '</b><small>' + nf(g.n) + ' 則 · Google</small></div>' : "") +
        '<p class="fp-what">' + em(s.what) + '</p>' + (s.caution ? '<p class="fp-caution">⚠ ' + em(s.caution) + '</p>' : "") + (s.photo ? '<p class="fp-photo"><span class="lab">📷 最佳拍攝點</span>' + em(s.photo) + '</p>' : "") +
        '<p class="fp-meta">' + em(s.hours || "") + (s.fee ? ' · ' + em(s.fee) : "") + (s.time ? ' · 約 ' + s.time + ' 分' : "") + ' · 離今天路線最近約 ' + min + ' 分車程</p>' +
        '<div class="fp-act">' + (g && g.q ? '<button type="button" class="fp-more" data-q="' + esc(g.q) + '">照片與評論 ▾</button>' : "") +
        '<a href="' + (g && g.pid ? 'https://www.google.com/maps/place/?q=place_id:' + g.pid : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent((s.ja || s.name) + " " + s.area)) + '" target="_blank" rel="noopener">Google Maps →</a>' +
        '<a class="fp-add" href="' + BASE + 'plan/?add=' + s.id + '#' + d.date + '">加入行程 ＋</a></div><div class="fp-embed" hidden></div></li>';
    });
    var nBest = list.filter(function (x) { return x.s.kids === "best"; }).length, nPhoto = list.filter(function (x) { return x.s.photo; }).length;
    return html + fold("foldspots", '離今天路線最近的 <b>' + list.length + '</b> 個收藏景點', (nBest ? '很適合小孩 ' + nBest + ' · ' : "") + (nPhoto ? '有拍攝點 ' + nPhoto + ' · ' : "") + '點開看', body + '</ul>');
  }
  function renderSpotStats() {
    if (!has("spotstats") || !SPOTS.length) return;
    var n = { plan: 0, saved: 0, check: 0 }; SPOTS.forEach(function (s) { n[s.status]++; });
    var areas = {}; SPOTS.forEach(function (s) { areas[s.area] = (areas[s.area] || 0) + 1; });
    $("#spotstats").innerHTML = '<span class="fs-total"><b>' + SPOTS.length + '</b> 個景點 · 正式行程 ' + n.plan + ' · 收藏 ' + n.saved + ' · 待確認 ' + n.check + '</span>' +
      Object.keys(areas).map(function (a) { return '<span class="fs-area" style="--mc:' + (Plan.areaColor()[a] || "#fff") + '"><i></i>' + esc(a) + ' <b>' + areas[a] + '</b></span>'; }).join("");
  }

  /* 首頁：美食地圖縮圖（不可操作，點整塊進入 food/） */
  function initFoodTile() { initTile("foodtilemap", FOOD); initTile("spottilemap", SPOTS); initTile("skitilemap", T.resorts.map(function (r) { return { lat: r.lat, lon: r.lon, color: SKI_GROUP_COLOR[r.group || "main"] }; })); }
  function initTile(cid, pts) {
    if (!has(cid) || !window.maplibregl || !pts.length) return;
    var col = Plan.areaColor();
    var m;
    try { m = new maplibregl.Map({ container: cid, style: Plan.mapStyle(), center: [141.6, 43.2], zoom: 6.6, interactive: false, attributionControl: false }); } catch (e) { return; }
    m.on("load", function () {
      var feats = pts.map(function (f) { return { type: "Feature", properties: { c: f.color || col[f.area] || "#fff" }, geometry: { type: "Point", coordinates: [f.lon, f.lat] } }; });
      m.addSource("ft", { type: "geojson", data: { type: "FeatureCollection", features: feats } });
      m.addLayer({ id: "ft-glow", type: "circle", source: "ft", paint: { "circle-color": ["get", "c"], "circle-radius": 9, "circle-opacity": 0.25, "circle-blur": 0.8 } });
      m.addLayer({ id: "ft-dot", type: "circle", source: "ft", paint: { "circle-color": ["get", "c"], "circle-radius": 4, "circle-stroke-width": 1.5, "circle-stroke-color": cssVar("--paper") } });
      var bb = new maplibregl.LngLatBounds(); pts.forEach(function (f) { bb.extend([f.lon, f.lat]); }); T.bases.forEach(function (b) { bb.extend([b.lon, b.lat]); });
      m.fitBounds(bb, { padding: 36, duration: 0 });
    });
  }

  /* ---------- 準備 ---------- */
  function renderPrep() {
    if (!has("todo")) return;
    var done = store("snow13-todo") || [];
    $("#todo").innerHTML = T.todo.map(function (t, i) {
      return '<li><label><input type="checkbox" id="todo-' + i + '" data-i="' + i + '"' + (done.indexOf(i) >= 0 ? " checked" : "") + '><span class="when">' + esc(t[0]) + '</span><span class="what">' + esc(Plan.fill(t[1], T.start)) + '</span></label></li>';
    }).join("");
    $("#todo").onchange = function () {
      var arr = []; Array.prototype.forEach.call(document.querySelectorAll("#todo input"), function (c) { if (c.checked) arr.push(+c.dataset.i); });
      store("snow13-todo", arr);
    };
    $("#flights").innerHTML = [T.flight.out, T.flight.back].map(function (f) { var fl = Plan.flightOn(f.date); return '<li><span>' + md(f.date) + '（' + DOW[new Date(f.date + "T00:00:00").getDay()] + '）' + esc(fl.dir) + '</span><span class="v">' + em(fl.line) + '</span></li>'; }).join("") +
      '<li><span>航空公司</span><span class="v">' + esc(T.flight.airline) + '</span></li>';
    var F = function (x) { return Plan.fill(x, T.start); };
    $("#pickup").innerHTML = T.rental.pickup.map(function (s) { return '<li>' + esc(F(s)) + '</li>'; }).join("");
    $("#return").innerHTML = T.rental.ret.map(function (s) { return '<li>' + em(s) + '</li>'; }).join("");
    $("#rentalcontact").innerHTML = '<li><span>' + esc(T.rental.company) + '</span><span class="v">' + esc(T.rental.hours) + '</span></li>' +
      '<li><span>電話</span><span class="v"><a href="tel:+81' + T.rental.phone.replace(/^0|[^0-9]/g, "") + '">' + esc(T.rental.phone) + '</a></span></li>' +
      '<li><span>最後送迎</span><span class="v">' + esc(T.rental.lastPickup) + '（關門前 30 分；航班延誤先打電話）</span></li>' +
      T.rental.contact.map(function (c) { return '<li><span>' + esc(c[0]) + '</span><span class="v">' + esc(c[1]) + '</span></li>'; }).join("");
    $("#emergency").innerHTML = T.emergency.map(function (e) {
      e = [e[0], F(e[1])];
      return '<li><span>' + esc(e[0]) + '</span><span class="v"><a href="tel:' + e[1].replace(/[^0-9+]/g, "") + '">' + esc(e[1]) + '</a></span></li>';
    }).join("");
    var L = T.luggage;
    if (has("luggage") && L) $("#luggage").innerHTML = '<p class="pc-lead">' + esc(L.car) + '・' + esc(L.seats) + '</p>' +
      '<ul class="kv kv-wrap">' + L.dims.map(function (d) { return '<li><span>' + esc(d[0]) + '</span><span class="v">' + esc(d[1]) + '</span></li>'; }).join("") + '</ul>' +
      '<p class="pc-k">座位怎麼分</p><ul class="bullets">' + L.split.map(function (x) { return '<li>' + em(x) + '</li>'; }).join("") + '</ul>' +
      '<p class="pc-k">雪具放哪裡</p><ul class="bullets">' + L.fit.map(function (x) { return '<li>' + em(x) + '</li>'; }).join("") + '</ul>' +
      '<p class="pc-note">' + em(L.airline) + '</p>';
    var I = T.insurance;
    if (has("insurance") && I) {
      function rows(list) { return '<ul class="ins">' + list.map(function (x) { return '<li><b>' + esc(x[0]) + '</b><span>' + em(x[1]) + '</span></li>'; }).join("") + '</ul>'; }
      $("#insurance").innerHTML = '<p class="pc-k">已經有的</p>' + rows(I.have) + '<p class="pc-k">這趟該保的（9 個人都要）</p>' + rows(I.need) +
        '<p class="pc-k">最容易漏的</p><ul class="bullets">' + I.miss.map(function (x) { return '<li>' + em(x) + '</li>'; }).join("") + '</ul>' +
        '<p class="pc-note">只是整理給大家對保單用，不是保險建議；條款以各公司保單為準。把保障明細頁（不用保單號碼）給我，我再逐條比對缺口。</p>';
    }
  }

  /* ---------- 幣別切換與即時匯率 ---------- */
  function renderFx() {
    if (has("curbtn")) { $("#curbtn").textContent = CUR_LABEL[state.cur]; $("#curbtn").title = "目前顯示：" + { both: "日圓＋台幣", twd: "台幣", jpy: "日圓" }[state.cur] + "（點一下切換）"; }
    if (has("fxnote")) $("#fxnote").textContent = "匯率：1 日圓 ≈ NT$" + state.rate.toFixed(4) + "（" + state.rateDate + "）。台幣金額為概算，刷卡或換匯實際約再高 1.5–3%。";
  }
  function rerenderMoney() {
    renderFx(); renderDay(); renderFood(); renderPrep(); renderChapters(); renderStops();
    /* 從別頁連到 #weather 之類的錨點：內容是 JS 畫出來的，畫完再捲一次才會對位 */
    if (PAGE === "home" && location.hash && location.hash.length > 1) { try { var tgt = document.querySelector(location.hash); if (tgt) setTimeout(function () { tgt.scrollIntoView({ block: "start" }); }, 400); } catch (e) { } }
  }
  if (has("curbtn")) $("#curbtn").addEventListener("click", function () {
    state.cur = CUR_MODES[(CUR_MODES.indexOf(state.cur) + 1) % CUR_MODES.length];
    store("snow13-cur", state.cur);
    rerenderMoney();
  });
  function loadFx() {
    if (!window.Plan || !Plan.loadFx) return;
    Plan.loadFx().then(function (fx) { state.rate = fx.rate; state.rateDate = fx.date; if (fx.changed) rerenderMoney(); });
  }


  /* ---------- 首頁飄雪 ---------- */
  function initSnow() {
    var cv = $("#snow"); if (!cv || !cv.getContext) return;
    var ctx = cv.getContext("2d"), flakes = [], W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), running = true;
    var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function size() {
      W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(180, Math.round(W * H / 9000));
      flakes = []; for (var i = 0; i < n; i++) flakes.push(mk(true));
    }
    function mk(any) { var r = Math.random(); return { x: Math.random() * W, y: any ? Math.random() * H : -6, r: 0.6 + r * r * 2.6, v: 0.25 + r * 0.9, a: 0.35 + Math.random() * 0.55, s: Math.random() * 6.28, sw: 0.3 + Math.random() * 0.9 }; }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i];
        if (!still) { f.y += f.v; f.s += 0.012; f.x += Math.sin(f.s) * f.sw * 0.35 + 0.08; if (f.y > H + 6 || f.x > W + 6) { flakes[i] = mk(false); flakes[i].x = Math.random() * W; continue; } }
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.2832); ctx.fillStyle = "rgba(255,255,255," + f.a + ")"; ctx.fill();
      }
    }
    function loop() { if (!running) return; draw(); requestAnimationFrame(loop); }
    size(); window.addEventListener("resize", function () { size(); if (still) draw(); });
    if (still) { draw(); return; }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { var vis = es[0].isIntersecting; if (vis && !running) { running = true; loop(); } else if (!vis) running = false; }).observe(cv);
    }
    loop();
  }

  /* ---------- 啟動（等 plan.json 載入） ---------- */
  function boot() {
  renderFx();
  initSnow();
  renderHero();
  renderPosters();
  renderChapters();
  renderDayStrip();
  renderDay();
  renderOrigin();
  renderDrive();
  renderSkiStats();
  renderWxTabs();
  renderWxStrip();
  renderClimate();
  renderFood(); renderSpotStats(); initFoodTile();
  renderPrep();
  initMap();
  loadWeather();
  loadFx();
  }
  if (window.Plan) Plan.ready.then(boot).catch(function (e) { console.error(e); boot(); }); else boot();
})();

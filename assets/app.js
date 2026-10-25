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
  function navUrl(lat, lon, o) {
    var u = "https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=" + lat + "," + lon;
    if (o) u += "&origin=" + o.lat + "," + o.lon;
    return u;
  }
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
  state.rate = T.fx.jpyTwd; state.rateDate = T.fx.date;
  function twd(n) { var t = n * state.rate; return t >= 100 ? Math.round(t / 10) * 10 : Math.round(t); }
  function nf(n) { return n.toLocaleString("en-US"); }
  function money(s) {
    s = String(s == null ? "" : s);
    if (state.cur === "jpy") return s;
    return s.replace(/¥\s?([\d,.]+)(?:\s*[–-]\s*¥?([\d,.]+))?(\s*萬)?/g, function (m, a, b, wan) {
      var k = wan ? 1e4 : 1;
      var A = parseFloat(a.replace(/,/g, "")) * k, B = b ? parseFloat(b.replace(/,/g, "")) * k : null;
      if (isNaN(A)) return m;
      var t = "NT$" + nf(twd(A)) + (B != null && !isNaN(B) ? "–" + nf(twd(B)) : "");
      return state.cur === "twd" ? "約 " + t : m + "（約 " + t + "）";
    });
  }
  function em(s) { return esc(money(s)); }

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
        '<span class="poster-body"><span class="pn">DAY ' + (i < 9 ? "0" : "") + (i + 1) + ' · ' + esc(b.area) + '</span><span class="pt">' + esc(d.title) + '</span><span class="pl">' + esc(p.line || d.sub) + '</span></span></a>';
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
  var CHAPTER_LINE = {
    villa: "前段先安頓。山裡的房子，走路五分鐘就是 Onze，開車 40 分鐘上 Kiroro。",
    furano: "主戰場。小木屋開車五分鐘到北之峰纜車，平日的壓雪寬坡留給 carving；美瑛和動物園在滑雪的空檔。",
    sapporo: "最後三晚回到城市，節奏放鬆一點。手稻就在 40 分鐘外，最後一次滑雪。"
  };
  function renderChapters() {
    var box = $("#chapterlist"); if (!box) return;
    box.innerHTML = T.bases.map(function (b, i) {
      var k = CHAPTER_IMG[b.id], days = T.days.filter(function (d) { return d.base === b.id; });
      return '<article class="chapter">' +
        '<div class="ch-img"><img src="' + BASE + 'assets/img/chapter/' + k + '.jpg" alt="" loading="lazy"></div>' +
        '<div class="ch-body"><p class="ch-k">第 ' + ["一", "二", "三"][i] + ' 章 · ' + md(b.from) + ' – ' + md(b.to) + ' · ' + b.nights + ' 晚</p>' +
        '<h3 class="ch-h">' + esc(b.short) + '</h3><p class="ch-line">' + esc(CHAPTER_LINE[b.id]) + '</p>' +
        '<p class="ch-stay">住 ' + esc(b.name) + (b.checkin ? ' · 入住 ' + b.checkin : "") + (b.checkout ? ' · 退房 ' + b.checkout : "") + '</p>' +
        '<ul class="ch-notes">' + b.notes.map(function (n) { return '<li>' + em(n) + '</li>'; }).join("") + '</ul>' +
        '<div class="ch-days">' + days.map(function (d) { return '<a href="' + dayHref(d) + '">' + md(d.date) + ' ' + esc(d.title) + '</a>'; }).join("") + '</div>' +
        '<div class="ch-gal">' + [1, 2, 3, 4].map(function (n) { return '<img src="' + BASE + 'assets/img/stay/' + b.id + '-' + n + '.jpg" alt="" loading="lazy">'; }).join("") + '</div>' +
        '</div></article>';
    }).join("");
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
  function renderDay() {
    if (!has("dayview")) return;
    var d = T.days[state.day], b = baseById[d.base], sch = dayPlan();
    var html = '<div class="card">' + (has("dayhead") ? '<p class="panel-label">今天的安排</p><p class="day-sub" style="margin:0 0 4px">' + esc(d.sub) + '</p>' : '<p class="day-date">' + md(d.date) + '（' + dow(d.date) + '）· 住 ' + esc(b.short) + '</p>' +
      '<h3 class="day-title">' + esc(d.title) + '</h3><p class="day-sub">' + esc(d.sub) + '</p>') +
      (d.alert ? '<p class="alert">' + esc(d.alert) + '</p>' : "") +
      '<div class="modeseg seg" role="tablist" aria-label="路況"></div>' +
      '<ol class="timeline">' + sch.stops.map(function (s, i) {
        var row = "";
        if (i > 0) { var l = sch.legs[i - 1]; row += '<li class="tl-leg ' + l.mode + '"><time></time><span>' + (l.mode === "walk" ? "步行" : l.mode === "shuttle" ? "接駁車" : "開車") + ' ' + fmtMin(l.min) + ' <small>· ' + l.km + ' km' + (l.est ? ' · 直線估算' : '') + '</small></span></li>'; }
        var last = i === sch.stops.length - 1;
        row += '<li class="' + (s.late ? "is-late" : "") + '"><time>' + s.time + (last || !s.stay ? "" : '<small>– ' + s.timeDep + '</small>') + '</time><span><b>' + esc(s.name) + '</b>' + (s.stay && !last ? ' <span class="stay">停 ' + fmtMin(s.stay) + '</span>' : "") + lateTag(s) + (s.note ? '<br><span class="tl-note">' + em(s.note) + '</span>' : "") + '</span></li>';
        return row;
      }).join("") + '</ol></div>';
    html += '<div class="side">';
    var alt = Plan.schedule(d.date, state.mode === "snow" ? "normal" : "snow");
    html += '<div class="card"><p class="panel-label">今天開車</p><div class="sunrow"><div><span>' + (state.mode === "snow" ? "下雪" : "一般") + '</span><b>' + fmtMin(sch.total.min) + '</b></div><div><span>' + (state.mode === "snow" ? "一般" : "下雪") + '</span><b>' + fmtMin(alt.total.min) + '</b></div><div><span>距離</span><b>' + sch.total.km + ' km</b></div>' + (sch.end != null ? '<div><span>最後到達</span><b>' + Plan.hm(sch.end) + '</b></div>' : "") + '</div></div>';
    html += '<div class="card"><p class="panel-label">天氣</p>' + dayWeather(d) + '</div>';
    html += '<div class="card"><p class="panel-label">日照</p><div class="sunrow"><div><span>日出</span><b>' + d.sun[0] + '</b></div><div><span>日落</span><b>' + d.sun[1] + '</b></div><div><span>天黑</span><b>' + d.sun[2] + '</b></div></div></div>';
    html += '<div class="card"><p class="panel-label">吃什麼</p><ul class="meals"><li><span>午</span>' + esc(d.meals[0]) + '</li><li><span>晚</span>' + esc(d.meals[1]) + '</li></ul><a class="jump" href="#dayfood">看附近有哪些店 ↓</a></div>';
    html += '</div>';
    $("#dayview").innerHTML = html;
    if (has("dayfood") && !document.querySelector("#dayfood .fp-embed:not([hidden])")) $("#dayfood").innerHTML = foodBlock(d, b);
    renderModeSeg();
    var nav = $("#daynav");
    if (nav) {
      var prev = T.days[state.day - 1], next = T.days[state.day + 1];
      nav.innerHTML = (prev ? '<a class="dn prev" href="' + dayHref(prev) + '"><small>← ' + md(prev.date) + '</small>' + esc(prev.title) + '</a>' : '<span></span>') +
        '<a class="dn home" href="' + BASE + '">全部 13 天</a>' +
        (next ? '<a class="dn next" href="' + dayHref(next) + '"><small>' + md(next.date) + ' →</small>' + esc(next.title) + '</a>' : '<span></span>');
    }
    var hd = $("#dayhead");
    if (hd) hd.innerHTML = '<p class="dh-k">DAY ' + (state.day < 9 ? "0" : "") + (state.day + 1) + ' · ' + md(d.date) + '（' + dow(d.date) + '）· 住 ' + esc(b.short) + '</p><h1 class="dh-h">' + esc(d.title) + '</h1><p class="dh-s">' + esc(((SC[d.date] || {}).poster || {}).line || d.sub) + '</p>';
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
  var SKI_LABEL = { onze: "Onze", kiroro: "Kiroro", furano_kita: "富良野（北之峰）", teine: "Teine", asari: "朝里川" };
  var CIRCLED = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨"];
  var map = null, gpsMarker = null, mapReady = false, KEYS = [], POIS = [], STOPS = [];
  if (PAGE === "day") AREAS = AREAS.slice(0, 1); else AREAS = AREAS.slice(1);
  state.area = PAGE === "day" ? "day" : "all";
  var isDark = true;
  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || "#5A687A"; }
  function dayPlan() { return (window.Plan && Plan.plan) ? Plan.schedule(T.days[state.day].date, state.mode) : { stops: [], legs: [], total: { km: 0, min: 0 } }; }
  function lateTag(s) { return s.late ? '<span class="late">晚 ' + s.late + ' 分' + (s.by ? '（最晚 ' + s.by + '）' : s.at ? '（' + s.at + ' 開始）' : '') + '</span>' : s.wait ? '<span class="wait">等 ' + s.wait + ' 分（' + s.at + ' 開始）</span>' : ''; }
  function renderModeSeg() {
    document.querySelectorAll(".modeseg").forEach(function (box) {
      box.innerHTML = [["normal", "一般路況"], ["snow", "下雪路況"]].map(function (m) { return '<button type="button" role="tab" aria-selected="' + (state.mode === m[0]) + '" data-mode="' + m[0] + '">' + m[1] + '</button>'; }).join("");
      box.onclick = function (e) { var b = e.target.closest("[data-mode]"); if (!b) return; state.mode = Plan.mode(b.dataset.mode); renderModeSeg(); renderDay(); updateRoute(true); };
    });
  }

  function popupHTML(p) {
    var a = '<a href="' + navUrl(p.lat, p.lon) + '" target="_blank" rel="noopener">Google Maps 導航</a>';
    if (p.baseId) a += '<button type="button" data-origin="' + p.baseId + '">從這裡算車程</button>';
    return '<p class="pop-t">' + esc(p.name) + '</p>' + (p.note ? '<p class="pop-n">' + em(p.note) + (p.approx ? '（位置為概略）' : '') + '</p>' : '') + '<div class="pop-a">' + a + '</div>';
  }
  function keyPoints() {
    var pts = [];
    T.bases.forEach(function (b) { pts.push({ type: "stay", label: b.short.split("・").pop() + " " + b.nights + " 晚", name: b.name, lat: b.lat, lon: b.lon, note: md(b.from) + "–" + md(b.to) + " " + b.nights + " 晚。" + b.notes.join("；"), baseId: b.id }); });
    T.resorts.forEach(function (r) { pts.push({ type: "ski", label: SKI_LABEL[r.id] || r.name, name: r.name, lat: r.lat, lon: r.lon, note: r.tier + "。" + (r.hours || "") }); });
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
      else groups.push({ name: s.name, lat: s.lat, lon: s.lon, nums: [i + 1], times: [s.time], note: s.note });
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
    KEYS = keyPoints(); POIS = T.places.slice();
    if (!window.maplibregl) { $("#mapfallback").hidden = false; return; }
    try {
      map = new maplibregl.Map({
        container: "mapcanvas", style: "https://tiles.openfreemap.org/styles/" + (isDark ? "dark" : "positron"),
        center: [141.75, 43.28], zoom: 7, cooperativeGestures: true, attributionControl: { compact: true }
      });
    } catch (e) { $("#mapfallback").hidden = false; return; }
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
      if (!map || !mapReady) return;
      if (k === "stay" || k === "ski") { map.setFilter("key-dot", keyFilter()); map.setFilter("key-label", keyFilter()); }
      else map.getSource("poi").setData(poiData());
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
      state.area = b.dataset.area; renderAreas(); applyMode(); fitArea(true);
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
        var nav = l.mode === "walk"
          ? '<a href="https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=' + prev.lat + ',' + prev.lon + '&destination=' + s.lat + ',' + s.lon + '" target="_blank" rel="noopener">步行導航</a>'
          : '<a href="' + navUrl(s.lat, s.lon, prev) + '" target="_blank" rel="noopener">導航</a>';
        html += '<li class="hop"><span>' + (l.mode === "walk" ? "步行 " : l.mode === "shuttle" ? "接駁 " : "") + l.km + ' km · ' + fmtMin(l.min) + (l.mode === "drive" ? '<em>' + (state.mode === "snow" ? "一般 " + fmtMin(l.normal) : "雪 " + fmtMin(l.snow)) + '</em>' : "") + '</span>' + nav + '</li>';
      }
      html += '<li class="stop' + role + (s.late ? " late" : "") + '" data-s="' + i + '"><b class="n">' + (i + 1) + '</b><div><div class="st"><time>' + esc(s.time) + '</time> ' + esc(s.name) + '</div><div class="sn">' + (s.stay && i < plan.stops.length - 1 ? '<span class="stay" style="margin:0 8px 4px 0">停 ' + fmtMin(s.stay) + ' → ' + s.timeDep + '</span>' : "") + lateTag(s) + em(s.note) + '</div></div></li>';
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
  if (has("origin")) $("#origin").addEventListener("click", function (e) {
    var b = e.target.closest("[data-o]"); if (!b) return;
    state.origin = b.dataset.o; state.originManual = true; renderOrigin(); renderDrive();
  });
  function originPoint() {
    if (state.origin === "gps") return state.gps;
    var b = baseById[state.origin]; return { lat: b.lat, lon: b.lon };
  }
  function renderDrive() {
    if (!has("drivelist")) return;
    var o = originPoint(), rows;
    if (state.origin === "gps") {
      rows = T.resorts.map(function (r) {
        var x = state.gpsDrive && state.gpsDrive[r.id];
        if (x) return { r: r, km: x[0], n: x[1], s: x[2], est: false };
        var km = haversine(o, r) * 1.35; var min = km / 45 * 60;
        return { r: r, km: Math.round(km * 10) / 10, n: r5(min), s: r5(min * 1.3), est: true };
      });
    } else {
      var tbl = T.drive[state.origin];
      rows = T.resorts.map(function (r) { var x = tbl[r.id]; return { r: r, km: x[0], n: x[1], s: x[2] }; });
    }
    rows.sort(function (a, b) { return a.n - b.n; });
    $("#drivelist").innerHTML = rows.map(function (x) {
      return '<li><div><div class="nm">' + esc(x.r.name) + '</div><div class="km">' + x.km + ' km' + (x.est ? '（直線估算）' : '') + '</div></div>' +
        '<div class="t">' + fmtMin(x.n) + '<small>下雪 ' + fmtMin(x.s) + '</small></div>' +
        '<a href="' + navUrl(x.r.lat, x.r.lon, o) + '" target="_blank" rel="noopener">開 Google Maps 導航 →</a></li>';
    }).join("");
  }
  if (has("gpsbtn")) $("#gpsbtn").addEventListener("click", function () {
    var msg = $("#gpsmsg");
    if (!navigator.geolocation) { msg.textContent = "這個瀏覽器不支援定位，請改選住宿。"; return; }
    msg.textContent = "定位中…";
    navigator.geolocation.getCurrentPosition(function (pos) {
      state.gps = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      state.origin = "gps"; state.originManual = true; state.gpsDrive = null;
      msg.textContent = "已定位（誤差約 " + Math.round(pos.coords.accuracy) + " m），正在計算路線…";
      renderOrigin(); renderDrive();
      if (map) {
        if (!gpsMarker) {
          var el = document.createElement("div"); el.className = "marker"; el.style.setProperty("--mc", "var(--ink)"); el.textContent = "我";
          gpsMarker = new maplibregl.Marker({ element: el }).setLngLat([state.gps.lon, state.gps.lat]).addTo(map);
        } else gpsMarker.setLngLat([state.gps.lon, state.gps.lat]);
        map.flyTo({ center: [state.gps.lon, state.gps.lat], zoom: 9 });
      }
      var coords = [state.gps.lon + "," + state.gps.lat].concat(T.resorts.map(function (r) { return r.lon + "," + r.lat; })).join(";");
      fetch("https://router.project-osrm.org/table/v1/driving/" + coords + "?sources=0&annotations=duration,distance")
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j.code !== "Ok") throw new Error("route");
          state.gpsDrive = {};
          T.resorts.forEach(function (r, k) {
            var sec = j.durations[0][k + 1], m = j.distances[0][k + 1];
            if (sec != null) state.gpsDrive[r.id] = [Math.round(m / 100) / 10, r5(sec / 60 * 1.15), r5(sec / 60 * 1.5)];
          });
          msg.textContent = "已用目前位置計算路線車程。";
          renderDrive();
        })
        .catch(function () { msg.textContent = "路線服務暫時連不上，先用直線距離估算。"; });
    }, function (err) {
      msg.textContent = err.code === 1 ? "沒有定位權限。請在瀏覽器設定允許，或直接選住宿。" : "暫時定位不到，請稍後再試或直接選住宿。";
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  });

  /* ---------- 雪場 ---------- */
  function seasonPill(r) {
    if (!r.season) return '<span class="pill">' + esc(r.seasonNote) + '</span>';
    if (TODAY < r.season[0]) return '<span class="pill soon">' + (r.openLabel ? esc(r.openLabel) : '預定 ' + md(r.season[0]) + ' 開季') + '</span>';
    if (TODAY <= r.season[1]) return '<span class="pill open">雪季營業中</span>';
    return '<span class="pill">本季已結束</span>';
  }
  function resortWx(r) {
    var base = state.wx["r_" + r.id], top = state.wx["t_" + r.id];
    function cell(lbl, w) {
      if (!w || !w.daily) return "";
      var k = 0, m = wmo(w.daily.weather_code[k]);
      return '<div><span>' + lbl + '・今天</span><b>' + Math.round(w.daily.temperature_2m_max[k]) + '° / ' + Math.round(w.daily.temperature_2m_min[k]) + '°</b><span>' + m[0] + '・新雪 ' + (w.daily.snowfall_sum[k] || 0).toFixed(1) + ' cm</span></div>';
    }
    var h = cell("山腳" + (r.base ? " " + r.base + " m" : ""), base) + (r.summit ? cell("山頂 " + r.summit + " m", top) : "");
    return h ? '<div class="r-wx">' + h + '</div>' : "";
  }
  function renderResorts() {
    if (!has("resorts")) return;
    $("#resorts").innerHTML = T.resorts.map(function (r) {
      var minor = r.id === "teine" || r.id === "asari";
      var d = T.drive;
      var dist = "山鄉 " + fmtMin(d.villa[r.id][1]) + "｜富良野 " + fmtMin(d.furano[r.id][1]) + "｜札幌 " + fmtMin(d.sapporo[r.id][1]);
      return '<article class="card resort' + (minor ? " minor" : "") + '">' +
        '<div class="r-top"><div><h3 class="r-name">' + esc(r.name) + '</h3><p class="r-ja">' + esc(r.ja) + '・' + esc(r.tier) + '</p></div>' + seasonPill(r) + '</div>' +
        '<p class="r-meta">' + esc(r.scale) + '<br>' + esc(r.hours) + '<br><span class="num">' + dist + '</span></p>' +
        '<div data-rwx="' + r.id + '">' + resortWx(r) + '</div>' +
        '<table class="tix"><tbody>' + r.tickets.map(function (t) { return '<tr><td>' + esc(t[0]) + '</td><td>' + money(esc(t[1])).replace("（", "<br><small>").replace("）", "</small>") + '</td></tr>'; }).join("") + '</tbody></table>' +
        '<dl class="r-dl"><div><dt>小孩</dt><dd>' + em(r.kids) + '</dd></div><div><dt>雪具</dt><dd>' + em(r.gear) + '</dd></div>' + (r.lessons !== "—" ? '<div><dt>課程</dt><dd>' + em(r.lessons) + '</dd></div>' : "") + '</dl>' +
        (r.tips.length ? '<ul class="bullets">' + r.tips.map(function (t) { return '<li>' + em(t) + '</li>'; }).join("") + '</ul>' : "") +
        '<div class="linkrow">' + r.links.map(function (l) { return '<a href="' + esc(l[1]) + '" target="_blank" rel="noopener">' + esc(l[0]) + ' ↗</a>'; }).join("") +
        '<a href="' + navUrl(r.lat, r.lon) + '" target="_blank" rel="noopener">導航 ↗</a></div>' +
        '</article>';
    }).join("");
  }
  function refreshResortWx() {
    T.resorts.forEach(function (r) { var box = document.querySelector('[data-rwx="' + r.id + '"]'); if (box) box.innerHTML = resortWx(r); });
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
      ["r_onze", 43.1439, 141.1278], ["r_teine", 43.0933, 141.2116], ["r_asari", 43.1385, 141.0293]
    ];
    var B = [
      ["r_kiroro", 43.0674, 140.9904, 570], ["t_kiroro", 43.0790, 140.9670, 1180],
      ["r_furano_kita", 43.3404, 142.3433, 250], ["t_furano_kita", 43.3280, 142.3150, 900]
    ];
    function url(list, elev) {
      var u = "https://api.open-meteo.com/v1/forecast?latitude=" + list.map(function (x) { return x[1]; }).join(",") +
        "&longitude=" + list.map(function (x) { return x[2]; }).join(",") + "&daily=" + daily + "&timezone=Asia%2FTokyo&forecast_days=16";
      if (elev) u += "&elevation=" + list.map(function (x) { return x[3]; }).join(",");
      return u;
    }
    function take(list, j) { (Array.isArray(j) ? j : [j]).forEach(function (o, k) { if (list[k]) state.wx[list[k][0]] = o; }); }
    function done() { renderWxStrip(); renderDay(); refreshResortWx(); refreshPosterWx(); }
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
  var FIT = { best: ["很適合 9 人帶小孩", "best"], ok: ["可以", "ok"], warn: ["不太適合帶幼兒", "warn"], unknown: ["待確認", "unknown"] };
  function foodItem(f, d, b) {
    var wd = d ? new Date(d.date + "T00:00:00").getDay() : -1, closedToday = f.closed && f.closed.indexOf(wd) >= 0;
    var planned = !!(d && f.key && d.meals.join("").indexOf(f.key) >= 0);
    var km = b ? haversine(b, f) * 1.35 : 0, min = b ? r5(km / 40 * 60) : 0;
    var fit = FIT[f.fit] || FIT.ok;
    var g = f.g, stars = g ? '<span class="stars" aria-label="Google 評價 ' + g.rating + '"><i style="--r:' + (g.rating / 5 * 100) + '%"></i></span><b>' + g.rating.toFixed(1) + '</b><small>' + nf(g.n) + ' 則 · Google</small>' : '<small class="nog">Google 評價待查</small>';
    var mapsUrl = g ? 'https://www.google.com/maps/place/?q=place_id:' + g.pid : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(f.name.replace(/（.*?）/g, "") + " " + (f.area === "Kiroro" ? "キロロ" : f.area));
    return '<li class="fp ' + fit[1] + (closedToday ? " closed" : "") + (planned ? " planned" : "") + '" data-fid="' + f.id + '">' +
      '<div class="fp-top"><b>' + esc(f.name) + '</b><span class="kind">' + esc(f.kind) + '</span>' + (f.rec ? '<span class="badge rec">推薦 ' + f.rec + '</span>' : "") + (planned ? '<span class="badge gold">今天預計</span>' : "") + (closedToday ? '<span class="badge red">今天公休</span>' : "") + '</div>' +
      '<div class="fp-rating">' + stars + '</div>' +
      '<p class="fp-what">' + em(f.what) + '</p>' +
      '<p class="fp-meta">' + esc(f.hours) + (f.closed && f.closed.length ? ' · 週' + f.closed.map(function (x) { return DOW[x]; }).join("、") + '休' : "") + (b ? ' · 從' + esc(b.short.split("・").pop()) + '約 ' + min + ' 分' : "") + ' · <span class="fit">' + fit[0] + '</span></p>' +
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
  function foodBlock(d, b) {
    var areas = FOOD_AREAS[d.base] || [], list = FOOD.filter(function (f) { return areas.indexOf(f.area) >= 0; });
    var byArea = {}; list.forEach(function (f) { (byArea[f.area] = byArea[f.area] || []).push(f); });
    var html = '<div class="sec-head"><h2>今天可以吃什麼</h2><p class="sec-note">午餐 ' + esc(d.meals[0]) + '；晚餐預計 ' + esc(d.meals[1]) + '。下面是住在' + esc(b.short.split("・").pop()) + '這幾天附近的店，按地區分；公休日已經對到當天。</p></div>' +
      '<a class="btn btn-ghost fm-link" href="' + BASE + 'food/?day=' + d.date + '">在美食地圖上看這些店 →</a>';
    areas.forEach(function (ar) {
      if (!byArea[ar]) return;
      var items = byArea[ar].slice().sort(function (x, y) { var wd = new Date(d.date + "T00:00:00").getDay(); var px = !!(x.key && d.meals.join("").indexOf(x.key) >= 0), py = !!(y.key && d.meals.join("").indexOf(y.key) >= 0); if (px !== py) return px ? -1 : 1; var cx = x.closed && x.closed.indexOf(wd) >= 0, cy = y.closed && y.closed.indexOf(wd) >= 0; if (cx !== cy) return cx ? 1 : -1; if ((x.rec || 99) !== (y.rec || 99)) return (x.rec || 99) - (y.rec || 99); var o = { best: 0, ok: 1, unknown: 2, warn: 3 }; return (o[x.fit] || 1) - (o[y.fit] || 1); });
      html += '<h3 class="h3">' + esc(ar) + (ar === "Kiroro" ? "（雪場內，午餐；2025-26 雪季資訊）" : "") + '</h3><ul class="foodpick">' + items.map(function (f) { return foodItem(f, d, b); }).join("") + '</ul>';
    });
    return html;
  }
  function renderFood() {
    if (!has("foodlist")) return;
    if (FOOD.length) {
      var areas = ["全部"]; FOOD.forEach(function (f) { if (areas.indexOf(f.area) < 0) areas.push(f.area); });
      $("#foodfilter").innerHTML = areas.map(function (a) { return '<button type="button" class="chip solid" aria-pressed="' + (state.foodArea === a) + '" data-a="' + esc(a) + '">' + esc(a) + '</button>'; }).join("");
      $("#foodfilter").onclick = function (e) { var b = e.target.closest("[data-a]"); if (!b) return; state.foodArea = b.dataset.a; renderFood(); };
      $("#foodlist").innerHTML = '<ul class="foodpick">' + FOOD.filter(function (f) { return state.foodArea === "全部" || f.area === state.foodArea; }).slice().sort(function (x, y) { return (x.rec || 99) - (y.rec || 99); }).map(function (f) { return foodItem(f, null, null); }).join("") + '</ul>';
      return;
    }
    renderFoodLegacy();
  }
  function renderFoodLegacy() {
    if (!has("foodlist")) return;
    var foods = T.places.filter(function (p) { return p.type === "food"; });
    var areas = ["全部"]; foods.forEach(function (f) { if (areas.indexOf(f.area) < 0) areas.push(f.area); });
    $("#foodfilter").innerHTML = areas.map(function (a) {
      return '<button type="button" class="chip solid" aria-pressed="' + (state.foodArea === a) + '" data-a="' + esc(a) + '">' + esc(a) + '</button>';
    }).join("");
    $("#foodfilter").onclick = function (e) { var b = e.target.closest("[data-a]"); if (!b) return; state.foodArea = b.dataset.a; renderFood(); };
    $("#foodlist").innerHTML = foods.filter(function (f) { return state.foodArea === "全部" || f.area === state.foodArea; }).map(function (f) {
      return '<li><div class="food-top"><b>' + esc(f.name) + '</b><span>' + esc(f.area) + '</span></div><p class="food-note">' + em(f.note) + '</p>' +
        '<div class="tags">' + (f.tags || []).map(function (t) { return '<span class="tag' + (/現金|休/.test(t) ? " warn" : "") + '">' + esc(t) + '</span>'; }).join("") + '</div>' +
        '<a href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(f.name.replace(/（.*?）/g, "") + " " + f.area) + '" target="_blank" rel="noopener">在 Google Maps 看 →</a></li>';
    }).join("");
  }

  /* ---------- 準備 ---------- */
  function renderPrep() {
    if (!has("todo")) return;
    var done = store("snow13-todo") || [];
    $("#todo").innerHTML = T.todo.map(function (t, i) {
      return '<li><label><input type="checkbox" id="todo-' + i + '" data-i="' + i + '"' + (done.indexOf(i) >= 0 ? " checked" : "") + '><span class="when">' + esc(t[0]) + '</span><span class="what">' + esc(t[1]) + '</span></label></li>';
    }).join("");
    $("#todo").onchange = function () {
      var arr = []; Array.prototype.forEach.call(document.querySelectorAll("#todo input"), function (c) { if (c.checked) arr.push(+c.dataset.i); });
      store("snow13-todo", arr);
    };
    $("#flights").innerHTML = T.flights.map(function (f) { return '<li><span>' + esc(f[0]) + ' ' + esc(f[1]) + '</span><span class="v">' + esc(f[2]) + '</span></li>'; }).join("");
    $("#pickup").innerHTML = T.rental.pickup.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join("");
    $("#return").innerHTML = T.rental.ret.map(function (s) { return '<li>' + em(s) + '</li>'; }).join("");
    $("#rentalcontact").innerHTML = '<li><span>' + esc(T.rental.company) + '</span><span class="v">' + esc(T.rental.hours) + '</span></li>' +
      T.rental.contact.map(function (c) { return '<li><span>' + esc(c[0]) + '</span><span class="v">' + esc(c[1]) + '</span></li>'; }).join("");
    $("#emergency").innerHTML = T.emergency.map(function (e) {
      return '<li><span>' + esc(e[0]) + '</span><span class="v"><a href="tel:' + e[1].replace(/[^0-9+]/g, "") + '">' + esc(e[1]) + '</a></span></li>';
    }).join("");
  }

  /* ---------- 幣別切換與即時匯率 ---------- */
  function renderFx() {
    if (has("curbtn")) { $("#curbtn").textContent = CUR_LABEL[state.cur]; $("#curbtn").title = "目前顯示：" + { both: "日圓＋台幣", twd: "台幣", jpy: "日圓" }[state.cur] + "（點一下切換）"; }
    if (has("fxnote")) $("#fxnote").textContent = "匯率：1 日圓 ≈ NT$" + state.rate.toFixed(4) + "（" + state.rateDate + "）。台幣金額為概算，刷卡或換匯實際約再高 1.5–3%。";
  }
  function rerenderMoney() {
    renderFx(); renderDay(); renderResorts(); renderFood(); renderPrep(); renderChapters(); renderStops();
  }
  if (has("curbtn")) $("#curbtn").addEventListener("click", function () {
    state.cur = CUR_MODES[(CUR_MODES.indexOf(state.cur) + 1) % CUR_MODES.length];
    store("snow13-cur", state.cur);
    rerenderMoney();
  });
  function loadFx() {
    fetch("https://open.er-api.com/v6/latest/JPY").then(function (r) { return r.json(); }).then(function (j) {
      if (j && j.rates && j.rates.TWD) {
        state.rate = j.rates.TWD;
        if (j.time_last_update_unix) state.rateDate = new Date(j.time_last_update_unix * 1000).toISOString().slice(0, 10);
        rerenderMoney();
      }
    }).catch(function () { /* 用內建匯率 */ });
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
  renderResorts();
  renderWxTabs();
  renderWxStrip();
  renderClimate();
  renderFood();
  renderPrep();
  initMap();
  loadWeather();
  loadFx();
  }
  if (window.Plan) Plan.ready.then(boot).catch(function (e) { console.error(e); boot(); }); else boot();
})();

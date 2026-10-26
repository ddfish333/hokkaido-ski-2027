/* 滑雪地圖：獨立頁 ski/。資料來自 data/trip.js（雪場、住宿、車程）、data/plan.json（哪一天去哪個雪場）。
   天氣：Open-Meteo，每座雪場山腳＋山頂（有海拔修正）的 16 天預報；選的那天在預報範圍內時，再抓逐時。 */
(function () {
  "use strict";
  var T = window.TRIP; if (!T) return;
  var BASE = window.BASE || "../";
  var Plan = window.Plan;

  /* ---------- 小工具 ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function nf(n) { return Number(n).toLocaleString("en-US"); }
  var RATE = T.fx.jpyTwd;
  function twd(n) { var t = n * RATE; return t >= 100 ? Math.round(t / 10) * 10 : Math.round(t); }
  /* 和首頁一樣抓即時匯率，抓不到就用 trip.js 的 */
  function loadFx() { return fetch("https://open.er-api.com/v6/latest/JPY").then(function (r) { return r.json(); }).then(function (j) { if (j && j.rates && j.rates.TWD) RATE = j.rates.TWD; }).catch(function () { }); }
  /* ¥ 後面補台幣（小字），讓票價一眼看得懂 */
  function money(s) {
    return esc(s).replace(/¥\s?([\d,]+)/g, function (m, a) { var v = parseFloat(a.replace(/,/g, "")); return isNaN(v) ? m : m + '<small class="twd">NT$' + nf(twd(v)) + '</small>'; });
  }
  function em(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"); }
  function fill(t, date, ctx) { return window.Plan && Plan.fill ? Plan.fill(t, date, ctx) : t; }
  var DOW = ["日", "一", "二", "三", "四", "五", "六"];
  function parts(s) { return s.split("-").map(Number); }
  function dow(s) { var p = parts(s); return DOW[new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay()]; }
  function md(s) { var p = parts(s); return p[1] + "/" + p[2]; }
  function dayDiff(a, b) { var A = parts(a), B = parts(b); return Math.round((Date.UTC(B[0], B[1] - 1, B[2]) - Date.UTC(A[0], A[1] - 1, A[2])) / 864e5); }
  function todayJST() {
    try { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
    catch (e) { return new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); }
  }
  function fmtMin(m) { m = Math.round(m); if (m < 60) return m + " 分"; var h = Math.floor(m / 60), r = m % 60; return h + "h" + (r < 10 ? "0" : "") + r; }
  function hm(x) { x = Math.round(x); return (x < 600 ? "0" : "") + Math.floor(x / 60) + ":" + (x % 60 < 10 ? "0" : "") + (x % 60); }
  function navUrl(lat, lon) { return "https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=" + lat + "," + lon; }
  function gateUrl(g) { return g.pid ? "https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=" + encodeURIComponent(g.ja || g.name) + "&destination_place_id=" + g.pid : g.ja ? "https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=" + encodeURIComponent(g.ja) : navUrl(g.lat, g.lon); }
  function hav(a, b) {
    var R = 6371, k = Math.PI / 180, dLa = (b.lat - a.lat) * k, dLo = (b.lon - a.lon) * k;
    var h = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(a.lat * k) * Math.cos(b.lat * k) * Math.sin(dLo / 2) * Math.sin(dLo / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  /* ---------- 天氣圖示（和首頁同一套） ---------- */
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
  /* 陣風：≥50 km/h 纜車常停、35–49 山頂會很冷很晃 */
  function gustClass(g) { return g >= 50 ? "bad" : g >= 35 ? "warn" : ""; }
  function gustNote(g) { return g >= 50 ? "纜車可能停駛" : g >= 35 ? "山頂風大" : ""; }

  /* ---------- 狀態 ---------- */
  var TODAY = todayJST();
  var baseById = {}; T.bases.forEach(function (b) { baseById[b.id] = b; });
  var resortById = {}; T.resorts.forEach(function (r) { resortById[r.id] = r; });
  var dayById = {}; T.days.forEach(function (d) { dayById[d.date] = d; });
  var STOP2RESORT = {}; T.resorts.forEach(function (r) { (r.stops || []).forEach(function (s) { STOP2RESORT[s] = r.id; }); });
  var GROUPS = [
    ["main", "正式行程的三座", "Onze 走路到、Kiroro 三天、富良野三天。"],
    ["sapporo", "札幌近郊・不在行程裡", "1/16–1/18 想滑的話，看雪況和大人怎麼分組再挑一天。標 2025-26 的是上一季票價，出發前再查。"],
    ["otaru", "小樽近郊備案", "Kiroro 太擠或天氣差時的小雪場，回程順路泡湯。"]
  ];
  var GROUP_COLOR = { main: "#E8B36A", sapporo: "#6AA4FF", otaru: "#8E98A6" };
  var qs = new URLSearchParams(location.search), OPEN = {};
  var state = { day: null, mode: Plan ? Plan.mode() : "normal", focus: null, wxTab: "base", wx: {}, hourly: {}, wxFail: false };

  /* 預設日期：網址有就用網址；旅程中就是今天；出發前是第一個滑雪日；結束後停在最後一個滑雪日 */
  function skiDays() { return T.days.filter(function (d) { return skiStop(d.date); }).map(function (d) { return d.date; }); }
  function initDay() {
    var q = qs.get("day");
    if (q && dayById[q]) { state.day = q; return; }
    if (dayById[TODAY]) { state.day = TODAY; return; }
    var sd = skiDays(); if (!sd.length) sd = [T.days[1].date];
    state.day = TODAY > T.end ? sd[sd.length - 1] : sd[0];
  }

  /* ---------- 當天去哪個雪場 ---------- */
  function sched(date) { return (Plan && Plan.plan) ? Plan.schedule(date, state.mode) : { stops: [], legs: [] }; }
  function skiStop(date) {
    var s = sched(date);
    for (var i = 0; i < s.stops.length; i++) if (STOP2RESORT[s.stops[i].id]) return { stop: s.stops[i], i: i, rid: STOP2RESORT[s.stops[i].id], legIn: i ? s.legs[i - 1] : null, sched: s };
    return null;
  }
  function focusResort() {
    if (state.focus) return resortById[state.focus];
    var k = skiStop(state.day); return k ? resortById[k.rid] : null;
  }
  function gateFor(r, stopId) {
    if (!r.gates || !r.gates.length) return null;
    return r.gates.filter(function (g) { return g.stop === stopId; })[0] || r.gates[0];
  }
  function driveFrom(baseId, r) { var d = T.drive[baseId] && T.drive[baseId][r.id]; return d ? { km: d[0], min: state.mode === "snow" ? d[2] : d[1], normal: d[1], snow: d[2] } : null; }

  /* ---------- 天氣 ---------- */
  var DAILY = "weather_code,temperature_2m_max,temperature_2m_min,snowfall_sum,precipitation_probability_max,wind_gusts_10m_max,sunrise,sunset";
  function omUrl(list, elev, extra) {
    var u = "https://api.open-meteo.com/v1/forecast?latitude=" + list.map(function (x) { return x[1]; }).join(",") + "&longitude=" + list.map(function (x) { return x[2]; }).join(",") + "&timezone=Asia%2FTokyo&forecast_days=16" + extra;
    if (elev) u += "&elevation=" + list.map(function (x) { return x[3]; }).join(",");
    return u;
  }
  function getJSON(u, retry) {
    return fetch(u).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).catch(function (e) {
      if (retry) throw e;
      return new Promise(function (res) { setTimeout(res, 2500); }).then(function () { return getJSON(u, true); });
    });
  }
  function loadDaily() {
    var A = T.resorts.map(function (r) { return ["b_" + r.id, r.lat, r.lon, r.base || 300]; });
    var B = T.resorts.filter(function (r) { return r.top; }).map(function (r) { return ["t_" + r.id, r.top[0], r.top[1], r.summit]; });
    function take(list, j) { (Array.isArray(j) ? j : [j]).forEach(function (o, k) { if (list[k]) state.wx[list[k][0]] = o; }); }
    return Promise.all([
      getJSON(omUrl(A, true, "&daily=" + DAILY)).then(function (j) { take(A, j); }),
      getJSON(omUrl(B, true, "&daily=" + DAILY)).then(function (j) { take(B, j); })
    ]).catch(function () { state.wxFail = true; });
  }
  /* 逐時：只抓焦點雪場（山腳＋山頂），而且只在選的那天進得了預報範圍時 */
  function loadHourly(r) {
    if (!r || state.hourly[r.id] || !dateInForecast(state.day, r)) return Promise.resolve();
    var L = [["b", r.lat, r.lon, r.base || 300]]; if (r.top) L.push(["t", r.top[0], r.top[1], r.summit]);
    state.hourly[r.id] = "loading";
    return getJSON(omUrl(L, true, "&hourly=temperature_2m,snowfall,wind_gusts_10m,weather_code,visibility,cloud_cover")).then(function (j) {
      var arr = Array.isArray(j) ? j : [j]; state.hourly[r.id] = { b: arr[0], t: arr[1] || null };
    }).catch(function () { state.hourly[r.id] = null; });
  }
  function dayIdx(w, date) { return w && w.daily ? w.daily.time.indexOf(date) : -1; }
  function dateInForecast(date, r) { return dayIdx(state.wx["b_" + r.id], date) >= 0; }
  function wxDay(key, date) { var w = state.wx[key], k = dayIdx(w, date); if (k < 0) return null; var d = w.daily; return { code: d.weather_code[k], hi: d.temperature_2m_max[k], lo: d.temperature_2m_min[k], snow: d.snowfall_sum[k] || 0, pop: d.precipitation_probability_max[k], gust: d.wind_gusts_10m_max[k], rise: (d.sunrise[k] || "").slice(11, 16), set: (d.sunset[k] || "").slice(11, 16) }; }
  function wxCell(label, w, big) {
    if (!w) return "";
    var m = wmo(w.code), gc = gustClass(w.gust);
    return '<div class="wxcell' + (big ? " big" : "") + '"><span class="l">' + esc(label) + '</span>' + ICON[m[1]] + '<b>' + Math.round(w.hi) + '° <small>/ ' + Math.round(w.lo) + '°</small></b>' +
      '<span class="c">' + m[0] + '</span><span class="s">新雪 ' + w.snow.toFixed(1) + ' cm' + (w.pop != null ? ' · 降水 ' + Math.round(w.pop) + '%' : "") + '</span>' +
      '<span class="g ' + gc + '">陣風 ' + Math.round(w.gust) + ' km/h' + (gc ? '・' + gustNote(w.gust) : "") + '</span></div>';
  }
  function climateLine(r) {
    var c = T.climate[r.id === "kiroro" ? "kiroro" : (r.group === "main" && r.id === "furano_kita") ? "furano" : r.group === "sapporo" ? "sapporo" : "villa"];
    return c ? '1 月歷年平均（' + esc(c.label) + '）：高 ' + c.tmax + '° / 低 ' + c.tmin + '°、每日新雪約 ' + c.snow + ' cm' : "";
  }
  /* 16 天預報條（山腳／山頂切換），旅程日期紅框 */
  function wxStrip(r, from) {
    var key = (state.wxTab === "top" && r.top ? "t_" : "b_") + r.id, w = state.wx[key];
    if (!w || !w.daily) return '<p class="sk-wxmsg">' + (state.wxFail ? "暫時連不上天氣服務，請稍後重新整理。" : "天氣載入中…") + '</p>';
    var d = w.daily, start = Math.max(0, d.time.indexOf(from)); if (d.time.indexOf(from) < 0) start = 0;
    var html = '<div class="sk-strip">';
    for (var k = start; k < d.time.length && k < start + 10; k++) {
      var m = wmo(d.weather_code[k]), gc = gustClass(d.wind_gusts_10m_max[k]), trip = d.time[k] >= T.start && d.time[k] <= T.end, sel = d.time[k] === state.day;
      html += '<div class="sk-wxc' + (trip ? " trip" : "") + (sel ? " sel" : "") + '"><span class="d">' + md(d.time[k]) + '</span><span class="w">' + dow(d.time[k]) + '</span>' + ICON[m[1]] +
        '<span class="hi">' + Math.round(d.temperature_2m_max[k]) + '°</span><span class="lo">' + Math.round(d.temperature_2m_min[k]) + '°</span>' +
        '<span class="sn">' + (d.snowfall_sum[k] || 0).toFixed(0) + ' cm</span><span class="gu ' + gc + '">' + Math.round(d.wind_gusts_10m_max[k]) + '</span></div>';
    }
    return html + '</div>';
  }
  function wxTabs(r) {
    if (!r.top) return "";
    return '<div class="sk-wxtabs" role="tablist"><button type="button" role="tab" aria-selected="' + (state.wxTab !== "top") + '" data-wt="base">山腳 ' + (r.base || "") + ' m</button><button type="button" role="tab" aria-selected="' + (state.wxTab === "top") + '" data-wt="top">山頂 ' + r.summit + ' m</button></div>';
  }
  /* 逐時：選的那天 08–17 點（有夜滑的雪場到 20 點） */
  function hourlyStrip(r) {
    var H = state.hourly[r.id]; if (!H || H === "loading") return H === "loading" ? '<p class="sk-wxmsg">逐時預報載入中…</p>' : "";
    var src = (state.wxTab === "top" && H.t) ? H.t : H.b, h = src.hourly, night = /夜滑/.test(r.hours || "") && !/沒有夜滑/.test(r.hours || "");
    var html = '<div class="sk-hours">', n = 0;
    for (var k = 0; k < h.time.length; k++) {
      if (h.time[k].slice(0, 10) !== state.day) continue;
      var hr = +h.time[k].slice(11, 13); if (hr < 8 || hr > (night ? 20 : 17)) continue;
      var m = wmo(h.weather_code[k]), gc = gustClass(h.wind_gusts_10m[k]), vis = h.visibility[k];
      html += '<div class="sk-h"><span class="t">' + hr + '時</span>' + ICON[m[1]] + '<span class="tp">' + Math.round(h.temperature_2m[k]) + '°</span>' +
        '<span class="sn">' + ((h.snowfall[k] || 0) >= 0.1 ? (h.snowfall[k]).toFixed(1) + ' cm' : "—") + '</span>' +
        '<span class="gu ' + gc + '">' + Math.round(h.wind_gusts_10m[k]) + '</span>' +
        (vis != null && vis < 1000 ? '<span class="vis">能見度 ' + Math.round(vis) + ' m</span>' : "") + '</div>'; n++;
    }
    return n ? '<p class="sk-k">' + md(state.day) + ' 逐時（' + (state.wxTab === "top" && H.t ? "山頂" : "山腳") + '）：氣溫・每小時新雪・陣風 km/h</p>' + html + '</div>' : "";
  }

  /* ---------- 今天滑哪裡（hero） ---------- */
  function planLine(k) {
    var s = k.sched.stops, out = [];
    for (var i = Math.max(0, k.i - 1); i < s.length; i++) {
      var st = s[i], cls = i === k.i ? "ski" : "";
      out.push('<li class="' + cls + '"><span class="tm">' + (i === k.i ? st.time + '–' + st.timeDep : st.time) + '</span><span class="nm">' + esc(st.name) + (st.by && i === k.i ? '<small>最晚 ' + st.by + ' 到</small>' : "") + (st.late ? '<small class="late">晚 ' + st.late + ' 分</small>' : "") + '</span></li>');
    }
    return '<ol class="sk-planline">' + out.join("") + '</ol>';
  }
  function heroHTML() {
    var d = dayById[state.day], b = baseById[d.base], k = skiStop(state.day), r = focusResort();
    var head = '<p class="eyebrow">' + md(d.date) + '（' + dow(d.date) + '）・住' + esc(b.short.split("・").pop()) + '・' + esc(d.title) + '</p>';
    if (!k && !state.focus) {
      /* 這天沒排滑雪：列最近的雪場 */
      var near = T.resorts.filter(function (r) { return r.id !== "asari" || d.base === "villa"; }).map(function (r) { return { r: r, dr: driveFrom(d.base, r) }; }).filter(function (x) { return x.dr; }).sort(function (x, y) { return x.dr.min - y.dr.min; }).slice(0, 4);
      return '<section class="sk-hero card none">' + head + '<h2>這天沒有排滑雪</h2><p class="sk-sub">' + esc(d.sub) + '</p>' +
        (d.base === "sapporo" ? '<p class="sk-note">想滑的大人：Teine 是帶小孩的首選（魔毯、Snow Land、授乳室都在 Olympia）；盤溪最近、半天剛好。選一張卡看票價和入口。</p>' : d.base === "villa" ? '<p class="sk-note">住山鄉的晚上：走路 5 分到 Onze，夜滑到約 22:45，大人輪流去。</p>' : "") +
        '<ul class="sk-nearlist">' + near.map(function (x) { return '<li><button type="button" class="lnk" data-focus="' + x.r.id + '">' + esc(x.r.name) + '</button><span class="num">' + fmtMin(x.dr.min) + (x.r.est ? '<small>估</small>' : "") + '</span></li>'; }).join("") + '</ul></section>';
    }
    r = r || resortById[k.rid];
    var stopId = k && k.rid === r.id ? k.stop.id : null, g = gateFor(r, stopId);
    var nav = g ? gateUrl(g) : navUrl(r.lat, r.lon);
    var leg = k && k.rid === r.id && k.legIn ? k.legIn : null, dr = driveFrom(d.base, r);
    var driveTxt = leg ? '從' + esc(k.sched.stops[k.i - 1].name) + ' ' + leg.km + ' km・<b>' + fmtMin(state.mode === "snow" ? leg.snow : leg.normal) + '</b>（' + (state.mode === "snow" ? '一般 ' + fmtMin(leg.normal) : '下雪 ' + fmtMin(leg.snow)) + '）' : dr ? '從' + esc(b.short.split("・").pop()) + ' ' + dr.km + ' km・<b>' + fmtMin(dr.min) + '</b>（' + (state.mode === "snow" ? '一般 ' + fmtMin(dr.normal) : '下雪 ' + fmtMin(dr.snow)) + '）' + (r.est ? '<small>估算</small>' : "") : "";
    var wb = wxDay("b_" + r.id, state.day), wt = r.top ? wxDay("t_" + r.id, state.day) : null;
    var sun = d.sun ? '日出 ' + d.sun[0] + '・日落 ' + d.sun[1] + '・天黑 ' + d.sun[2] : wb && wb.rise ? '日出 ' + wb.rise + '・日落 ' + wb.set : "";
    var inRange = dateInForecast(state.day, r), days = dayDiff(TODAY, state.day);
    var wx = inRange ? '<div class="sk-wxgrid">' + wxCell("山腳" + (r.base ? " " + r.base + " m" : ""), wb, true) + (wt ? wxCell("山頂 " + r.summit + " m", wt, true) : "") + '</div>' + hourlyStrip(r)
      : '<p class="sk-wxmsg">' + (state.wxFail ? "暫時連不上天氣服務。" : days > 15 ? md(state.day) + ' 還沒進入 16 天預報（' + days + ' 天後；出發前兩週起會自動顯示）。' + climateLine(r) : "這天的預報已經過期。") + '</p>';
    var links = quickLinks(r, nav, !!g);
    var tix = r.tickets.slice(0, 3).map(function (t) { return '<span>' + esc(t[0]) + ' <b>' + money(t[1]) + '</b>' + (t[2] ? '<small>' + money(t[2]) + '</small>' : "") + '</span>'; }).join("");
    var isPlan = k && k.rid === r.id;
    return '<section class="sk-hero card" id="sk-hero">' + head +
      '<h2>' + (isPlan ? '今天滑 ' : '') + esc(r.name) + ' <small>' + esc(r.ja) + '</small></h2>' +
      '<div class="sk-hero-meta">' + seasonPill(r) + (r.rec ? '<span class="r-rec">' + esc(r.rec) + '</span>' : "") + '</div>' +
      (isPlan ? planLine(k) : '<p class="sk-note">這天行程裡沒有這座雪場；下面是從' + esc(b.short.split("・").pop()) + '出發的車程與天氣。</p>') +
      (k && k.stop.note && isPlan ? '<p class="sk-note">' + em(fill(k.stop.note, state.day, k.stop)) + '</p>' : "") +
      '<p class="sk-drive">' + driveTxt + (g ? '<br><span class="muted">停：' + esc(g.name) + (g.sub ? '｜' + esc(g.sub) : "") + '</span>' : "") + '</p>' +
      '<div class="sk-actions"><a class="btn" href="' + nav + '" target="_blank" rel="noopener">導航' + (g ? '：' + esc(g.name.replace(/（.*?）/g, "")) : "") + ' ↗</a>' + links + '</div>' +
      '<div class="sk-wxhead"><p class="sk-k">天氣 ' + md(state.day) + (sun ? ' <span class="sun">' + sun + '</span>' : "") + '</p>' + (inRange ? wxTabs(r) : "") + '</div>' + wx +
      (inRange ? wxStrip(r, state.day) : "") +
      '<p class="sk-k">營業</p><p class="sk-hours">' + esc(r.hours) + '</p>' +
      '<p class="sk-k">票</p><p class="sk-tixline">' + tix + '</p><p class="sk-kids">' + em(r.kids) + '</p>' +
      '</section>';
  }
  var QL = [["status", "雪況・纜車運行"], ["cams", "即時影像"], ["cams360", "360° 即時影像"], ["trailmap", "雪道圖"], ["webshop", "網路購票"], ["kidsArea", "小孩雪上樂園"], ["access", "開車・停車"]];
  function quickLinks(r, nav, hasGate) {
    var out = QL.filter(function (q) { return r[q[0]]; }).map(function (q) { return '<a href="' + esc(r[q[0]]) + '" target="_blank" rel="noopener">' + q[1] + ' ↗</a>'; });
    var site = (r.links || []).filter(function (l) { return l[0] === "官網"; })[0]; if (site) out.unshift('<a href="' + esc(site[1]) + '" target="_blank" rel="noopener">官網 ↗</a>');
    var price = (r.links || []).filter(function (l) { return /票價/.test(l[0]); })[0]; if (price) out.push('<a href="' + esc(price[1]) + '" target="_blank" rel="noopener">票價 ↗</a>');
    return out.join("");
  }
  function seasonPill(r) {
    if (!r.season) return '<span class="pill">' + esc(r.seasonNote) + '</span>';
    if (TODAY < r.season[0]) return '<span class="pill soon">' + (r.openLabel ? esc(r.openLabel) : '預定 ' + md(r.season[0]) + ' 開季') + '</span>';
    if (TODAY <= r.season[1]) return '<span class="pill open">雪季營業中・到 ' + md(r.season[1]) + '</span>';
    return '<span class="pill">本季已結束</span>';
  }

  /* ---------- 出門前 5 分鐘 ---------- */
  var JMA = { villa: ["石狩・空知・後志地方", "https://www.jma.go.jp/bosai/warning/#area_type=offices&area_code=016000"], sapporo: ["石狩・空知・後志地方", "https://www.jma.go.jp/bosai/warning/#area_type=offices&area_code=016000"], furano: ["上川・留萌地方", "https://www.jma.go.jp/bosai/warning/#area_type=offices&area_code=012000"] };
  function checklistHTML() {
    var d = dayById[state.day], k = skiStop(state.day), r = focusResort(); if (!r) return "";
    var jma = JMA[d.base], after = k && k.rid === r.id ? k.sched.stops.slice(k.i + 1) : [];
    var items = [
      '<li><b>纜車有沒有開</b>' + (r.status ? '<a href="' + esc(r.status) + '" target="_blank" rel="noopener">' + esc(r.name) + ' 雪況・纜車運行 ↗</a>' : "") + (r.cams ? '<a href="' + esc(r.cams) + '" target="_blank" rel="noopener">即時影像 ↗</a>' : "") + '<span>山頂陣風超過 50 km/h 常停上段纜車；上面天氣卡會標紅。</span></li>',
      '<li><b>警報・路況</b><a href="' + jma[1] + '" target="_blank" rel="noopener">氣象廳 ' + jma[0] + ' 警報 ↗</a>' + T.links.slice(0, 3).map(function (l) { return '<a href="' + esc(l[1]) + '" target="_blank" rel="noopener">' + esc(l[0]) + ' ↗</a>'; }).join("") + '<span>暴風雪警報或道央道封路就改室內行程，不要硬開山路。</span></li>',
      '<li><b>票</b>' + (r.webshop ? '<a href="' + esc(r.webshop) + '" target="_blank" rel="noopener">網路購票 ↗</a>' : "") + '<span>' + esc(r.tickets.slice(0, 2).map(function (t) { return t[0] + " " + t[1] + (t[2] ? "（" + t[2] + "）" : ""); }).join("、")) + '；' + esc(r.kids.replace(/\*\*/g, "")) + '</span></li>',
      '<li><b>帶出門</b><span>IC 卡（回程記得退押金）、護目鏡、手套、暖暖包、保溫瓶、小孩的 AirTag 放雪衣內袋、一點現金（租借與寄物有時只收現金）。</span></li>'
    ];
    if (after.length) items.push('<li><b>滑完之後</b><span>' + after.map(function (s) { return s.time + " " + s.name; }).join(" → ") + '</span></li>');
    return '<details class="sk-check card" id="skcheck"><summary>出門前 5 分鐘<small>纜車・警報・票・帶的東西・滑完之後</small></summary><ul>' + items.join("") + '</ul></details>';
  }

  /* ---------- 雪場卡片 ---------- */
  function ourDays(r) {
    var out = [];
    T.days.forEach(function (d) { var k = skiStop(d.date); if (k && k.rid === r.id) out.push(d.date); });
    return out;
  }
  function tixRows(list) { return list.map(function (t) { return '<tr><td>' + esc(t[0]) + '</td><td>' + money(t[1]) + (t[2] ? '<br><small class="alt">' + money(t[2]) + '</small>' : "") + '</td></tr>'; }).join(""); }
  function card(r) {
    var d = dayById[state.day], b = baseById[d.base], dr = driveFrom(d.base, r), ds = ourDays(r), k = skiStop(state.day), today = k && k.rid === r.id;
    var media = r.img ? '<div class="sk-media' + (r.video ? " has-video" : "") + '"><img src="' + BASE + 'assets/img/ski/' + esc(r.img) + '" alt="" loading="lazy">' +
      (r.video ? '<video class="ch-vid" muted loop playsinline preload="none" data-src="' + BASE + 'assets/video/' + esc(r.video) + '"' + (r.videoSm ? ' data-src-sm="' + BASE + 'assets/video/' + esc(r.videoSm) + '"' : "") + ' aria-hidden="true"></video><span class="ch-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>' : "") +
      '<div class="sk-media-top">' + seasonPill(r) + (ds.length ? '<span class="pill days">我們 ' + ds.map(md).join("・") + '</span>' : "") + '</div></div>' : "";
    var wb = wxDay("b_" + r.id, state.day), wt = r.top ? wxDay("t_" + r.id, state.day) : null;
    var wxline = wb ? '<p class="sk-cardwx">' + md(state.day) + ' 山腳 <b>' + Math.round(wb.hi) + '° / ' + Math.round(wb.lo) + '°</b> ' + wmo(wb.code)[0] + '・新雪 ' + wb.snow.toFixed(0) + ' cm' + (wt ? '｜山頂 <b>' + Math.round(wt.hi) + '°</b> <span class="' + gustClass(wt.gust) + '">陣風 ' + Math.round(wt.gust) + (gustClass(wt.gust) === "bad" ? " ⚠" : "") + '</span>' : '｜<span class="' + gustClass(wb.gust) + '">陣風 ' + Math.round(wb.gust) + '</span>') + '</p>' : "";
    var gates = r.gates && r.gates.length ? '<div class="gates"><p class="g-k">入口・停車' + (r.gates.length > 1 ? '（分開的停車場）' : "") + '</p><ul>' + r.gates.map(function (g) {
      return '<li><div><b>' + esc(g.name) + '</b>' + (g.sub ? '<span class="g-sub">' + esc(g.sub) + '</span>' : "") + (g.note ? '<span class="g-note">' + em(g.note) + (g.approx ? "（位置概略）" : "") + '</span>' : "") + '</div><a href="' + gateUrl(g) + '" target="_blank" rel="noopener">導航 ↗</a></li>';
    }).join("") + '</ul></div>' : "";
    var mainTix = r.tickets.slice(0, 4), moreTix = r.tickets.slice(4);
    var more = (moreTix.length ? '<table class="tix"><tbody>' + tixRows(moreTix) + '</tbody></table>' : "") +
      '<dl class="r-dl">' + (r.gear && r.gear !== "—" ? '<div><dt>雪具</dt><dd>' + em(r.gear) + '</dd></div>' : "") + (r.lessons && r.lessons !== "—" ? '<div><dt>課程</dt><dd>' + em(r.lessons) + '</dd></div>' : "") + (r.entry ? '<div><dt>入口</dt><dd>' + em(r.entry) + '</dd></div>' : "") + '</dl>' +
      ((r.tips || []).length ? '<ul class="bullets">' + r.tips.map(function (t) { return '<li>' + em(t) + '</li>'; }).join("") + '</ul>' : "");
    var moreN = moreTix.length + (r.tips || []).length;
    var others = T.bases.filter(function (x) { return x.id !== d.base; }).map(function (x) { var o = driveFrom(x.id, r); return o ? esc(x.short.split("・").pop()) + ' ' + fmtMin(o.min) : ""; }).filter(Boolean).join("｜");
    return '<article class="card resort sk-card' + (today ? " today" : "") + (state.focus === r.id ? " active" : "") + '" id="' + r.id + '" data-rid="' + r.id + '" style="--gc:' + GROUP_COLOR[r.group || "main"] + '">' + media +
      '<div class="r-top"><div><h3 class="r-name"><button type="button" class="lnk" data-focus="' + r.id + '">' + esc(r.name) + '</button></h3><p class="r-ja">' + esc(r.ja) + '・' + esc(r.tier) + '</p></div>' + (r.img ? "" : seasonPill(r)) + '</div>' +
      (r.rec ? '<p class="r-rec">' + esc(r.rec) + '</p>' : "") +
      '<p class="r-meta">' + esc(r.scale) + '<br>' + esc(r.hours) + '</p>' +
      (dr ? '<p class="sk-drive">從' + esc(b.short.split("・").pop()) + ' <b>' + fmtMin(dr.min) + '</b> <small>' + dr.km + ' km・' + (state.mode === "snow" ? '一般 ' + fmtMin(dr.normal) : '下雪 ' + fmtMin(dr.snow)) + (r.est ? '・估算' : "") + '</small><br><span class="muted">' + others + '</span></p>' : "") +
      wxline +
      '<details class="r-more sk-wxmore" id="wx-' + r.id + '"' + (OPEN["wx-" + r.id] === undefined && state.focus === r.id ? " open" : "") + '><summary>天氣預報<small>' + (dateInForecast(state.day, r) ? "山腳／山頂・16 天" : "還沒進入 16 天預報範圍") + '</small></summary><div class="r-more-in" data-wx="' + r.id + '">' + (dateInForecast(state.day, r) ? wxTabs(r) + wxStrip(r, state.day) : '<p class="sk-wxmsg">' + climateLine(r) + '。' + (wb || state.wx["b_" + r.id] ? '目前能看的是最近 16 天：' : "") + '</p>' + (state.wx["b_" + r.id] ? wxTabs(r) + wxStrip(r, TODAY) : "")) + '</div></details>' +
      '<div class="ch-links sk-links">' + quickLinks(r, null, false) + (r.gates && r.gates.length ? "" : '<a href="' + navUrl(r.lat, r.lon) + '" target="_blank" rel="noopener">導航 ↗</a>') + '</div>' +
      (r.tixSeason ? '<p class="tix-season">票價：' + esc(r.tixSeason) + '</p>' : "") +
      '<table class="tix"><tbody>' + tixRows(mainTix) + '</tbody></table>' +
      '<dl class="r-dl"><div><dt>小孩</dt><dd>' + em(r.kids) + '</dd></div></dl>' + gates +
      (moreN ? '<details class="r-more" id="more-' + r.id + '"><summary>更多<small>' + (moreTix.length ? '其他票種 ' + moreTix.length + ' · ' : "") + '雪具・提醒 ' + (r.tips || []).length + '</small></summary><div class="r-more-in">' + more + '</div></details>' : "") +
      '</article>';
  }
  function listHTML() {
    return GROUPS.map(function (g) {
      var list = T.resorts.filter(function (r) { return (r.group || "main") === g[0]; }); if (!list.length) return "";
      return '<div class="r-group" id="g-' + g[0] + '"><div class="r-group-h"><h3 class="h3">' + esc(g[1]) + '</h3><p>' + esc(g[2]) + '</p></div><div class="sk-grid">' + list.map(card).join("") + '</div></div>';
    }).join("");
  }

  /* ---------- 影片：滑鼠移上去／手機捲到才載（和首頁三章同一套） ---------- */
  function initVideos() {
    var vids = document.querySelectorAll(".sk-media .ch-vid"); if (!vids.length) return;
    var conn = navigator.connection || {}; if (conn.saveData) return;
    var small = innerWidth < 760 || /(^|[^a-z])(slow-2g|2g|3g)$/.test(conn.effectiveType || "");
    function play(v) { if (!v.getAttribute("src")) { v.src = (small && v.dataset.srcSm) || v.dataset.src; v.load(); } var p = v.play(); if (p && p.catch) p.catch(function () { }); }
    function stop(v) { if (!v.paused) v.pause(); v.parentNode.classList.remove("playing"); }
    vids.forEach(function (v) {
      v.addEventListener("playing", function () { v.parentNode.classList.add("playing"); });
      v.addEventListener("waiting", function () { v.parentNode.classList.remove("playing"); });
      v.addEventListener("pause", function () { v.parentNode.classList.remove("playing"); });
    });
    if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
      vids.forEach(function (v) { var c = v.closest(".sk-card"); c.addEventListener("pointerenter", function () { play(v); }); c.addEventListener("pointerleave", function () { stop(v); }); });
    } else if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { var v = e.target.querySelector(".ch-vid"); if (!v) return; if (e.isIntersecting && e.intersectionRatio >= 0.6) play(v); else stop(v); }); }, { threshold: [0, 0.6] });
      vids.forEach(function (v) { io.observe(v.parentNode); });
    }
    document.addEventListener("visibilitychange", function () { if (document.hidden) vids.forEach(stop); });
  }

  /* ---------- 工具列 ---------- */
  function renderTools() {
    var sel = $("#skday");
    sel.innerHTML = T.days.map(function (d) {
      var k = skiStop(d.date), r = k ? resortById[k.rid] : null;
      return '<option value="' + d.date + '"' + (state.day === d.date ? " selected" : "") + '>' + md(d.date) + '（' + dow(d.date) + '）' + (r ? '⛷ ' + r.name.replace(/（.*?）/g, "") : d.title) + ' · 住' + esc(baseById[d.base].short.split("・")[0]) + '</option>';
    }).join("");
    sel.onchange = function () { state.day = sel.value; state.focus = null; var u = new URL(location.href); u.searchParams.set("day", state.day); u.hash = ""; history.replaceState(null, "", u); render(true); loadHourly(focusResort()).then(function () { render(false); }); };
    var seg = $("#skmode");
    seg.innerHTML = [["normal", "一般路況"], ["snow", "下雪・結冰"]].map(function (m) { return '<button type="button" role="radio" aria-checked="' + (state.mode === m[0]) + '" data-m="' + m[0] + '">' + m[1] + '</button>'; }).join("");
    seg.onclick = function (e) { var b = e.target.closest("[data-m]"); if (!b) return; state.mode = b.dataset.m; if (Plan) Plan.mode(state.mode); render(false); };
    $("#sklegend").innerHTML = GROUPS.map(function (g) { return '<span><i style="background:' + GROUP_COLOR[g[0]] + '"></i>' + esc(g[1].split("・")[0]) + '</span>'; }).join("") + '<span><i class="home"></i>住宿</span><span><i class="route"></i>當天路線</span>';
  }

  /* ---------- 地圖 ---------- */
  var map, markers = {}, gateMarkers = [], popup, mapReady = false, geo;
  function initMap() {
    if (!window.maplibregl) { $("#skfallback").hidden = false; return; }
    try { map = new maplibregl.Map({ container: "skcanvas", style: "https://tiles.openfreemap.org/styles/dark", center: [141.6, 43.2], zoom: 7.4, cooperativeGestures: true, locale: { "CooperativeGesturesHandler.WindowsHelpText": "按住 Ctrl 再捲動可縮放地圖", "CooperativeGesturesHandler.MacHelpText": "按住 ⌘ 再捲動可縮放地圖", "CooperativeGesturesHandler.MobileHelpText": "用兩指移動地圖", "NavigationControl.ZoomIn": "放大", "NavigationControl.ZoomOut": "縮小", "AttributionControl.ToggleAttribution": "資料來源" }, attributionControl: { compact: true } }); }
    catch (e) { $("#skfallback").hidden = false; return; }
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    geo = new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true, showUserHeading: true });
    map.addControl(geo, "top-right");
    popup = new maplibregl.Popup({ closeButton: true, closeOnClick: true, offset: 16, maxWidth: "300px", className: "fm-pop" });
    T.bases.forEach(function (b) {
      var el = document.createElement("div"); el.className = "fm-home"; el.title = b.name;
      el.innerHTML = '<span class="fm-home-i"></span><span class="fm-home-l">' + esc(b.short.split("・").pop()) + '</span>';
      new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([b.lon, b.lat]).addTo(map);
    });
    T.resorts.forEach(function (r) {
      var el = document.createElement("button"); el.type = "button"; el.className = "sk-pin " + (r.group || "main"); el.style.setProperty("--ac", GROUP_COLOR[r.group || "main"]);
      el.setAttribute("aria-label", r.name);
      el.innerHTML = '<span class="sk-pin-l"><b>' + esc(r.name.replace(/（.*?）|滑雪場|雪場/g, "")) + '</b><span class="sk-pin-wx" data-pinwx="' + r.id + '"></span></span><span class="sk-pin-d"></span>';
      el.addEventListener("click", function (ev) { ev.stopPropagation(); focusOn(r.id, false, true); });
      markers[r.id] = new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([r.lon, r.lat]).addTo(map);
      (r.gates || []).forEach(function (g) {
        if (hav(g, r) < 0.25) return; /* 和雪場的點重疊的入口（例如只有一個入口）不另外標 */
        var ge = document.createElement("div"); ge.className = "sk-gate"; ge.dataset.rid = r.id; ge.innerHTML = '<span class="sk-gate-l">' + esc(g.name.replace(/（.*?）/g, "")) + '</span><span class="sk-gate-i"></span>';
        ge.title = g.name;
        gateMarkers.push(new maplibregl.Marker({ element: ge, anchor: "bottom" }).setLngLat([g.lon, g.lat]).addTo(map));
      });
    });
    map.on("load", function () {
      map.addSource("route", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "route-casing", type: "line", source: "route", paint: { "line-color": "#070B12", "line-width": 6, "line-opacity": .6 }, layout: { "line-cap": "round", "line-join": "round" } });
      map.addLayer({ id: "route-line", type: "line", source: "route", paint: { "line-color": "#E8B36A", "line-width": 3, "line-opacity": ["case", ["get", "ski"], 1, .45] }, layout: { "line-cap": "round", "line-join": "round" } });
      mapReady = true; syncMap(true);
    });
    map.on("zoom", function () { var z = map.getZoom(); document.querySelectorAll(".sk-gate").forEach(function (g) { g.classList.toggle("show", z >= 11.2); }); });
  }
  function routeFeatures() {
    var k = skiStop(state.day), s = sched(state.day);
    return s.legs.filter(function (L) { return L.geom && L.geom.length > 1; }).map(function (L, i) { return { type: "Feature", properties: { ski: !!(k && (L.to === k.stop.id || L.frm === k.stop.id)) }, geometry: { type: "LineString", coordinates: L.geom } }; });
  }
  function syncMap(fit) {
    if (!mapReady) return;
    var r = focusResort(), d = dayById[state.day], b = baseById[d.base];
    map.getSource("route").setData({ type: "FeatureCollection", features: routeFeatures() });
    T.resorts.forEach(function (x) {
      var el = markers[x.id].getElement(); el.classList.toggle("active", !!r && r.id === x.id);
      var wb = wxDay("b_" + x.id, state.day), wt = x.top ? wxDay("t_" + x.id, state.day) : null, w = wt || wb, box = el.querySelector("[data-pinwx]");
      box.innerHTML = w ? Math.round(wt ? wt.lo : wb.lo) + '°・' + (wb ? wb.snow.toFixed(0) : 0) + ' cm' + (gustClass(w.gust) === "bad" ? ' ⚠' : "") : "";
      el.style.zIndex = r && r.id === x.id ? 6 : x.group === "main" ? 4 : 3;
    });
    gateMarkers.forEach(function (m) { var el = m.getElement(); el.classList.toggle("active", !!r && el.dataset.rid === r.id); });
    if (fit) {
      var bb = new maplibregl.LngLatBounds(); bb.extend([b.lon, b.lat]);
      if (r) { bb.extend([r.lon, r.lat]); (r.gates || []).forEach(function (g) { bb.extend([g.lon, g.lat]); }); }
      else T.resorts.filter(function (x) { return x.group === (d.base === "furano" ? "main" : d.base === "sapporo" ? "sapporo" : "main"); }).forEach(function (x) { bb.extend([x.lon, x.lat]); });
      var side = innerWidth > 900 ? 80 : 44;
      map.fitBounds(bb, { padding: { top: side + 30, bottom: side + 40, left: side + 30, right: side + 30 }, maxZoom: 12.5, duration: 800 });
    }
  }
  function focusOn(rid, scroll, pop) {
    state.focus = rid; OPEN["wx-" + rid] = true; history.replaceState(null, "", "#" + rid);
    var r = resortById[rid];
    loadHourly(r).then(function () { render(false); });
    render(false); syncMap(true);
    if (scroll) { var el = document.getElementById(rid); if (el) el.scrollIntoView({ behavior: "smooth", block: innerWidth > 900 ? "start" : "start" }); }
    if (pop && map) {
      var d = dayById[state.day], dr = driveFrom(d.base, r), wb = wxDay("b_" + r.id, state.day);
      popup.setLngLat([r.lon, r.lat]).setHTML('<b>' + esc(r.name) + '</b><span>' + esc(r.tier) + '</span>' + (dr ? '<small>從' + esc(baseById[d.base].short.split("・").pop()) + ' ' + fmtMin(dr.min) + '・' + dr.km + ' km</small>' : "") +
        (wb ? '<small>' + md(state.day) + ' ' + Math.round(wb.hi) + '° / ' + Math.round(wb.lo) + '° ' + wmo(wb.code)[0] + '・新雪 ' + wb.snow.toFixed(0) + ' cm</small>' : "") +
        '<a href="#' + r.id + '" data-go="' + r.id + '">看卡片 ↓</a>').addTo(map);
    }
  }

  /* ---------- 事件 ---------- */
  document.addEventListener("click", function (e) {
    var f = e.target.closest("[data-focus]"); if (f) { focusOn(f.dataset.focus, true, false); return; }
    var go = e.target.closest("[data-go]"); if (go) { e.preventDefault(); focusOn(go.dataset.go, true, false); return; }
    var wt = e.target.closest("[data-wt]"); if (wt) { state.wxTab = wt.dataset.wt; render(false); return; }
  });

  /* ---------- 全部重畫 ---------- */
  function render(fit) {
    document.querySelectorAll("details[id]").forEach(function (d) { OPEN[d.id] = d.open; });
    renderTools();
    $("#sktoday").innerHTML = heroHTML();
    $("#skcheck-box").innerHTML = checklistHTML();
    $("#sklist").innerHTML = listHTML();
    var r = focusResort(), d = dayById[state.day];
    $("#skcount").textContent = T.resorts.length + " 座雪場" + (r ? "・" + md(d.date) + " 看 " + r.name.replace(/（.*?）/g, "") : "");
    Object.keys(OPEN).forEach(function (id) { var el = document.getElementById(id); if (el && OPEN[id]) el.open = true; });
    initVideos();
    syncMap(fit);
  }

  function boot() {
    initDay();
    var hashRid = (location.hash || "").replace("#", ""); if (resortById[hashRid]) state.focus = hashRid;
    render(true); initMap();
    loadFx().then(function () { render(false); });
    loadDaily().then(function () { render(false); return loadHourly(focusResort()); }).then(function () { render(false); });
    if (state.focus) setTimeout(function () { var el = document.getElementById(state.focus); if (el) el.scrollIntoView({ block: "start" }); }, 400);
  }
  if (Plan && Plan.ready) Plan.ready.then(boot).catch(function (e) { console.error(e); boot(); }); else boot();
})();

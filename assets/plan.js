/* 行程推算：plan.json（站點、停留、固定時間）＋ legs.json（路段快取）→ 每一天的時間表。
   單日頁、地圖、序幕、編輯器都用這一份，所以不會互相矛盾。 */
(function () {
  "use strict";
  var BASE = window.BASE || "";
  var P = { plan: null, legs: null, sha: {}, ready: null };
  function hm(x) { x = Math.round(x); return (x < 600 ? "0" : "") + Math.floor(x / 60) + ":" + (x % 60 < 10 ? "0" : "") + (x % 60); }
  function mins(t) { if (!t) return null; var p = t.split(":"); return (+p[0]) * 60 + (+p[1]); }
  function r5(x) { return Math.max(5, Math.round(x / 5) * 5); }
  function hav(a, b) { var R = 6371, k = Math.PI / 180, dLa = (b.lat - a.lat) * k, dLo = (b.lon - a.lon) * k; var h = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(a.lat * k) * Math.cos(b.lat * k) * Math.sin(dLo / 2) * Math.sin(dLo / 2); return 2 * R * Math.asin(Math.sqrt(h)); }
  function legKey(a, b, via) { return a + "|" + b + (via === "walk" ? "|walk" : via === "shuttle" ? "|shuttle" : ""); }
  /* ---------- 導航點（唯一來源：plan.json places） ----------
     每個地點有兩個座標：地點本身（lat/lon，地圖上的點、走路的目的地），和「車要開到哪」（park：停車場／入口）。
     開車、計程車的路段和導航按鈕都開到 park（沒有 park 就開到地點）；走路、接駁車到地點本身。
     pid＝Google 地點 id：有的話導航用 place id，Google 會帶到那個地點的正門／停車場，不會因為座標差幾十公尺導錯。 */
  function placeOf(id) { return (P.plan && P.plan.places[id]) || null; }
  function drivePt(id) { var p = placeOf(id); return p ? (p.park || p) : null; }
  function legEnds(a, b, via) {
    var walk = via === "walk" || via === "shuttle";
    return [walk ? placeOf(a) : drivePt(a), walk ? placeOf(b) : drivePt(b)];
  }
  /* 導航網址：target 可以是 plan.json 的站點 id，或任何有 lat/lon（pid、name、ja 可有可無）的物件。
     不帶起點：手機會用現在的位置，按下去直接開始導航（帶了起點 Google 只會顯示路線預覽）。 */
  P.navUrl = function (target, mode) {
    var t = typeof target === "string" ? (mode === "walk" ? placeOf(target) : drivePt(target)) : target;
    if (!t || t.lat == null) return "";
    var tm = mode === "walk" ? "walking" : mode === "transit" || mode === "taxi" ? "transit" : "driving";
    var pid = t.pid || (t.g && t.g.pid);
    return "https://www.google.com/maps/dir/?api=1&travelmode=" + tm + "&destination=" + t.lat + "," + t.lon + (pid ? "&destination_place_id=" + pid : "");
  };
  P.drivePt = drivePt; P.legEnds = legEnds;
  /* 沒有快取的路段：先用直線估算（編輯器會打 OSRM 補上真的） */
  function estLeg(a, b, via) {
    var e = legEnds(a, b, via), pa = e[0], pb = e[1]; if (!pa || !pb) return null;
    var km = hav(pa, pb) * (via === "walk" ? 1.3 : 1.35);
    var min = via === "walk" ? km / 4 * 60 : via === "shuttle" ? 10 : km / 45 * 60;
    return { km: Math.round(km * 10) / 10, normal: r5(min), snow: r5(via === "walk" ? min * 1.2 : via === "shuttle" ? min : min * 1.3), mode: via || "drive", geom: [[pa.lon, pa.lat], [pb.lon, pb.lat]], est: true };
  }
  /* taxi（計程車／地鐵）：路線用開車那一段，時間加上叫車／等車（×1.5、最少 15 分），標成 taxi，不算進「今天開車」 */
  function taxiMin(m) { return Math.max(15, r5(m * 1.5)); }
  function leg(a, b, via) {
    var L = P.legs[legKey(a, b, via)] || estLeg(a, b, via);
    if (L && via === "taxi") { L = Object.assign({}, L, { mode: "taxi", normal: taxiMin(L.normal), snow: taxiMin(L.snow) }); }
    return L;
  }
  /* 座標 → plan.json 的站點 id（150 m 內），住宿／餐廳／景點和站點對得起來就能用 legs.json 的真實路段 */
  function placeNear(pt, tol) {
    if (!P.plan || !pt || pt.lat == null) return null;
    if (pt.id && P.plan.places[pt.id] && hav(P.plan.places[pt.id], pt) < 0.3) return pt.id;
    var best = null, bd = tol || 0.15; for (var k in P.plan.places) { var d = hav(P.plan.places[k], pt); if (d < bd) { bd = d; best = k; } } return best;
  }
  /* 任何頁面的「導航」都先問：這個點是不是行程裡的站點？是的話一律用站點的導航點（停車場＋Google 地點），各頁才會導到同一個地方 */
  P.placeNear = placeNear;
  P.navTo = function (t, mode) { var id = placeNear(t, 0.05); return P.navUrl(id || t, mode); };
  /* ---------- 共用：從住宿到某個地點要多久。美食頁、景點頁、首頁車程表、單日頁都用這一份，各頁數字才會一樣 ----------
     順序：1) 住宿→雪場用 trip.js 的 drive 表（雪場頁同一張表） 2) 兩端都對得到站點就用 legs.json 的真實路段 3) 直線估算（和 estLeg 同一個算法）
     札幌（車停三晚不動）：2.5 km 內走路，再遠就計程車／地鐵。回傳 { km, min, mode, label } */
  P.travelMin = function (base, to, opts) {
    opts = opts || {}; if (!base || !to) return null;
    var T0 = window.TRIP, snow = (opts.mode || P.mode()) === "snow", km = hav(base, to);
    /* 札幌：車進城就停著不動，所以預設走路／計程車；但那天的時間表如果有從飯店開車出去的路段（1/17 羊之丘、1/19 還車），就照開車算 */
    var carFree = base.id === "sapporo", out = null;
    if (carFree && opts.date && P.plan && P.plan.days[opts.date]) {
      var sd = schedule(opts.date, "normal"), bid = placeNear(base);
      if (sd.legs.some(function (l) { return l.frm === bid && l.mode === "drive"; })) carFree = false;
    }
    var rs = T0 && (T0.resorts || []).filter(function (r) { return hav(r, to) < 0.3; })[0], d = rs && T0.drive && T0.drive[base.id] && T0.drive[base.id][rs.id];
    if (d) out = { km: d[0], min: snow ? d[2] : d[1], mode: "drive" };
    else {
      var via = carFree && km * 1.3 < 2.5 ? "walk" : "drive", a = placeNear(base), b = placeNear(to), L = null;
      if (a && b && a !== b) L = (P.legs && P.legs[legKey(a, b, via)]) || estLeg(a, b, via);
      if (!L) { var k = km * (via === "walk" ? 1.3 : 1.35), m = via === "walk" ? k / 4 * 60 : k / 45 * 60; L = { km: Math.round(k * 10) / 10, normal: r5(m), snow: r5(via === "walk" ? m * 1.2 : m * 1.3), mode: via }; }
      out = { km: L.km, min: snow ? L.snow : L.normal, mode: L.mode };
    }
    if (carFree && out.mode === "drive") out = { km: out.km, min: taxiMin(out.min), mode: "taxi" };
    out.label = (out.mode === "walk" ? "走路約 " : out.mode === "taxi" ? "計程車約 " : "開車約 ") + out.min + " 分";
    return out;
  };
  /* 航班（trip.js flight 唯一來源）：某一天有沒有飛機 → 一行字，首頁、機場站、準備頁共用 */
  P.flightOn = function (date) {
    var F = window.TRIP && TRIP.flight; if (!F) return null;
    var f = F.out.date === date ? F.out : F.back.date === date ? F.back : null; if (!f) return null;
    return { no: f.no, line: f.no + " " + f.from + " " + f.dep + " → " + f.to + " " + f.arr, dir: f === F.out ? "去程" : "回程", f: f };
  };

  /* 核心：date + mode（normal／snow）→ 時間表 */
  function schedule(date, mode, overrideStops) {
    var day = P.plan && P.plan.days[date]; if (!day) return { stops: [], legs: [], total: { km: 0, min: 0 }, end: null };
    var stops = overrideStops || day.stops, out = [], legs = [], t = null, tk = 0, tm = 0;
    for (var i = 0; i < stops.length; i++) {
      var s = stops[i], pl = P.plan.places[s.id] || { name: s.id, lat: 0, lon: 0 }, via = s.via || "drive", L = null, arr;
      if (i === 0) arr = mins(s.at) != null ? mins(s.at) : 8 * 60;
      else {
        L = leg(stops[i - 1].id, s.id, via);
        var lm = L ? (mode === "snow" ? L.snow : L.normal) : 0;
        legs.push({ frm: stops[i - 1].id, to: s.id, km: L ? L.km : 0, min: lm, normal: L ? L.normal : 0, snow: L ? L.snow : 0, mode: L ? L.mode : via, geom: L ? L.geom : null, est: !!(L && L.est) });
        if (L && L.mode !== "walk" && L.mode !== "shuttle" && L.mode !== "taxi") { tk += L.km; tm += lm; }
        arr = t + lm;
      }
      var wait = 0, late = 0, at = mins(s.at), by = mins(s.by);
      if (i > 0 && at != null) { if (arr < at) { wait = at - arr; arr = at; } else if (arr > at) late = arr - at; }
      if (by != null && arr > by) late = Math.max(late, arr - by);
      var stay = i === stops.length - 1 ? 0 : (+s.stay || 0), dep = arr + stay;
      out.push({ i: i, id: s.id, name: pl.name, ja: pl.ja || "", lat: pl.lat, lon: pl.lon, arr: arr, dep: dep, stay: stay, wait: wait, late: late, at: s.at || "", atLabel: s.atLabel || "", by: s.by || "", via: via, note: s.note || "", alts: s.alts || null, altNotes: s.altNotes || null, time: hm(arr), timeDep: hm(dep) });
      t = dep;
    }
    return { stops: out, legs: legs, total: { km: Math.round(tk), min: tm }, end: out.length ? out[out.length - 1].arr : null };
  }
  /* 舊介面相容：給地圖用的 stops（含 time）與 legs（normal／snow） */
  function dayPlan(date, mode) { return schedule(date, mode); }

  /* 文字裡的時間標記 → 由 plan.json 推算帶入，文字裡不再寫死時間（tools/check.py 會擋寫死的 HH:MM）
       {t:villa}  抵達    {dep:kiroro}  離開    {t:villa#2}  當天第 2 次到同一站    {t:favlux@01-19}  別天
       {t}        這一幕／這一站自己的抵達時間（ctx）
       {open:zoo} {close:zoo}  plan.json places 的開門／關門    {at:beer} {by:rental}  站點的固定時間
       {sun:rise|set|dark}  trip.js 當天的日出／日落／天黑    {T:rental.hours}  trip.js 任一欄位 */
  /* {leg:a|b}：先看那天的時間表，a 到 b 中間有沒有別的站（例如 1/11 山鄉→砂川 SA→動物園）；有就把沿途路段加起來，沒有才拿單一路段 */
  function routeMin(date, a, b, via) {
    var snow = P.mode() === "snow";
    if (!via && date && P.plan && P.plan.days[date]) {
      var sch = schedule(date, snow ? "snow" : "normal"), ia = -1, ib = -1;
      sch.stops.forEach(function (s, i) { if (s.id === a && ia < 0) ia = i; if (s.id === b && ia >= 0 && i > ia && ib < 0) ib = i; });
      if (ia >= 0 && ib > ia + 1) { var sum = 0; for (var i = ia; i < ib; i++) sum += sch.legs[i].min; return sum; }
    }
    var L = leg(a, b, via); return L ? (snow ? L.snow : L.normal) : null;
  }
  var TOKEN = /\{(t|dep|at|by|open|close)(?::([\w-]+?))?(?:#(\d))?(?:@(\d\d-\d\d))?\}|\{sun:(rise|set|dark)\}|\{T:([\w.]+)\}|\{leg:([\w-]+)\|([\w-]+)(?:\|(walk|shuttle|taxi))?\}|\{(party)\}/g;
  var schedCache = {};
  function fill(text, date, ctx) {
    if (!text || String(text).indexOf("{") < 0) return text;
    if (!P.plan) return text; /* plan.json 還沒載好：先原樣顯示，載好後各頁會重畫 */
    return String(text).replace(TOKEN, function (m, kind, id, nth, md, sun, tpath, lgA, lgB, lgVia, party) {
      var T = window.TRIP || {};
      if (party) return partyOf(date, ctx); /* {party}＝這天（這一站）的人數：保姆在就 9 人 */
      if (lgA) { var lgm = routeMin(date, lgA, lgB, lgVia); return lgm == null ? m : String(lgm); } /* {leg:a|b}＝這段路現在路況的分鐘數（那天 a、b 之間有中途站就把中途路段加總） */
      if (sun) { var d = (T.days || []).filter(function (x) { return x.date === date; })[0]; return d && d.sun ? d.sun[{ rise: 0, set: 1, dark: 2 }[sun]] : m; }
      if (tpath) { var v = T; tpath.split(".").forEach(function (k) { v = v == null ? v : v[k]; }); return v == null ? m : String(v); }
      var dd = md ? date.slice(0, 5) + md : date;
      if (kind === "open" || kind === "close") { var pl = P.plan && P.plan.places[id]; return pl && pl[kind] ? pl[kind] : m; }
      if (kind === "at" || kind === "by") { var day = P.plan && P.plan.days[dd], sts = day ? day.stops.filter(function (s) { return s.id === id; }) : [], st = nth ? sts[(+nth) - 1] : sts.filter(function (s) { return s[kind]; })[0]; return st && st[kind] ? st[kind] : m; }
      var key = dd + "|" + P.mode(), sch = schedCache[key] || (schedCache[key] = schedule(dd, P.mode()));
      var hits = sch.stops.filter(function (s) { return s.id === (id || (ctx && ctx.id)); });
      var s = (!id && ctx && ctx.i != null && sch.stops[ctx.i] && sch.stops[ctx.i].id === ctx.id) ? sch.stops[ctx.i] : hits[nth ? (+nth) - 1 : 0];
      if (!s) return m;
      return kind === "dep" ? s.timeDep : s.time;
    });
  }
  /* 保姆 1/14 {T:nanny.bus} 的巴士走：那天巴士之前的站點／午餐還是 9 人，之後 8 人 */
  function partyOf(date, ctx) {
    var T = window.TRIP || {}, N = T.nanny || {}, PT = T.party || { withNanny: "9 人", noNanny: "8 人" };
    if (!N.lastDay || date > N.lastDay) return PT.noNanny;
    if (date < N.lastDay) return PT.withNanny;
    var t = ctx && (ctx.time || (ctx.slot && { breakfast: "08:00", lunch: "12:00", snack: "15:00", dinner: "18:00", late: "21:00" }[ctx.slot]));
    return t && N.bus && t >= N.bus ? PT.noNanny : PT.withNanny;
  }
  P.partyOf = partyOf;
  /* 地圖頁（food／spots／ski）選了日期之後，在日期選單旁放「看 M/D 行程 →」；沒選就拿掉 */
  P.dayLink = function (sel, date) {
    var lab = sel && sel.closest(".fm-day"); if (!lab) return;
    var old = lab.parentNode.querySelector(".fm-dayjump"); if (old) old.remove();
    if (!date) return;
    var a = document.createElement("a"); a.className = "fm-dayjump"; a.href = BASE + "day/" + date.slice(5).replace("-", "") + "/";
    var p = date.split("-"); a.textContent = "看 " + (+p[1]) + "/" + (+p[2]) + " 的行程 →"; lab.insertAdjacentElement("afterend", a);
  };
  /* 長頁面的「回到頂端」：捲超過一個畫面才出現 */
  document.addEventListener("DOMContentLoaded", function () {
    if (document.querySelector(".film") && !document.body.classList.contains("daypage")) return;
    var b = document.createElement("button"); b.type = "button"; b.className = "totop"; b.setAttribute("aria-label", "回到頂端"); b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 14l6-6 6 6"/></svg>';
    b.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    document.body.appendChild(b);
    var tick = false; function upd() { b.classList.toggle("show", window.scrollY > window.innerHeight * 0.9); tick = false; }
    window.addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true }); upd();
  });
  P.fill = fill; P.clearCache = function () { schedCache = {}; };

  /* 共用：路段那一行（交通方式＋分鐘＋公里）。單日頁時間表和編輯器都用這一份，顏色依交通方式：
     開車＝藍、接駁車＝青、步行＝綠、計程車／地鐵＝紫（顏色在 style.css 的 .m-drive 等） */
  P.LEGMODE = { drive: "開車", shuttle: "接駁車", walk: "步行", taxi: "計程車／地鐵" };
  var LEGICON = {
    drive: '<path d="M5 16h14M6.5 16l1.4-5.2A2 2 0 0 1 9.8 9.3h4.4a2 2 0 0 1 1.9 1.5L17.5 16M5 16v2.5M19 16v2.5"/><circle cx="8" cy="16" r=".6"/><circle cx="16" cy="16" r=".6"/>',
    shuttle: '<rect x="5" y="4.5" width="14" height="12" rx="2.5"/><path d="M5 11h14M8 16.5V19M16 16.5V19"/><circle cx="8.5" cy="13.8" r=".6"/><circle cx="15.5" cy="13.8" r=".6"/>',
    walk: '<circle cx="13" cy="4.8" r="1.6"/><path d="M10 21l2.2-6.2L10.5 12l1-4 3 2.4 2.5.6M12.2 14.8L15 21M11.5 8L8 10.5 7 14"/>',
    taxi: '<rect x="6" y="3.5" width="12" height="13" rx="3"/><path d="M6 10h12M9 16.5L7.5 20M15 16.5l1.5 3.5"/><circle cx="9" cy="13.3" r=".6"/><circle cx="15" cy="13.3" r=".6"/>'
  };
  function legMin(m) { m = Math.round(m); if (m < 60) return m + " 分"; var h = Math.floor(m / 60), r = m % 60; return h + " 小時" + (r ? " " + r + " 分" : ""); }
  /* ---------- 每一天怎麼吃（唯一來源：food.js 的 FOOD_PICKS） ----------
     單日頁的「吃什麼」卡、「這天怎麼吃」、美食地圖的「預計」都用這一份；trip.js 不再寫餐點。 */
  var SLOTS = ["breakfast", "lunch", "snack", "dinner", "late"];
  P.SLOT = { breakfast: "早", lunch: "午", snack: "點心", dinner: "晚", late: "宵夜" };
  P.SLOT_LONG = { breakfast: "早餐", lunch: "午餐", snack: "點心", dinner: "晚餐", late: "大人宵夜" };
  var PICK_STATUS = { proposed: ["建議", "st-blue"], decided: ["已決定", "st-gold"], booked: ["已訂位", "st-ok"] };
  P.food = function (id) { return id ? (window.FOOD || []).filter(function (f) { return f.id === id; })[0] : null; };
  P.meals = function (date) { return (window.FOOD_PICKS || []).filter(function (p) { return p.date === date; }).sort(function (a, b) { return SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot); }); };
  P.plannedIds = function (date) { return P.meals(date).map(function (p) { return p.pick; }).filter(Boolean); };
  P.mealIds = function (date) { var o = []; P.meals(date).forEach(function (p) { if (p.pick) o.push(p.pick); (p.backup || []).forEach(function (b) { o.push(b); }); }); return o; };
  function shortName(f) { return f.name.replace(/（.*?）/g, ""); }
  P.mealName = function (p) { var f = P.food(p.pick); return f ? shortName(f) : (p.what || ""); };
  /* 這一餐幾點：餐廳本身就是那一站（或在那站 200 m 內、不是待一整天的站）才帶時間 */
  P.mealTime = function (p) {
    if (!p.stop || !P.plan) return "";
    var sch = P.schedule(p.date, P.mode()), st = sch.stops.filter(function (s) { return s.id === p.stop; }), f = P.food(p.pick);
    if (!st.length) return "";
    var s = p.slot === "breakfast" ? st[0] : st[st.length - 1];
    if (p.stop === p.pick || (f && hav(f, s) < 0.2 && (s.stay || 0) <= 180)) return s.time;
    return "";
  };
  /* link(id, 文字)：各頁自己決定連到哪（單日頁連美食地圖、美食地圖捲到卡片） */
  P.mealCardHTML = function (date, link) {
    var ms = P.meals(date); if (!ms.length) return "";
    return '<ul class="meals">' + ms.map(function (p) {
      var f = P.food(p.pick), t = P.mealTime(p), bk = (p.backup || []).map(function (id) { var g = P.food(id); return g ? link(id, shortName(g)) : ""; }).filter(Boolean).join("、");
      return '<li><span>' + P.SLOT[p.slot] + '</span><div class="meal-b"><b>' + (f ? link(f.id, shortName(f)) : P.esc(p.what || "")) + '</b>' + (t ? ' <time>' + t + '</time>' : "") +
        (bk ? '<small class="meal-bk">備案 ' + bk + '</small>' : "") + '</div></li>';
    }).join("") + '</ul>';
  };
  P.picksHTML = function (date, link) {
    var ms = P.meals(date); if (!ms.length) return "";
    return '<ul class="picklist">' + ms.map(function (p) {
      var f = P.food(p.pick), st = PICK_STATUS[p.status] || PICK_STATUS.proposed, t = P.mealTime(p);
      var bk = (p.backup || []).map(function (id) { var g = P.food(id); return g ? link(id, shortName(g)) : ""; }).filter(Boolean).join("、");
      return '<li class="pick ' + st[1] + (f ? "" : " pick-self") + '"><div class="pick-top"><span class="pick-slot">' + P.SLOT_LONG[p.slot] + (t ? " " + t : "") + '</span>' +
        (f ? link(f.id, P.esc(f.name), "pick-name") : '<span class="pick-name">' + P.esc(p.what || "") + '</span>') +
        '<span class="badge ' + st[1] + '">' + st[0] + '</span>' + (f && f.g && f.g.rating ? '<span class="pick-r">★ ' + f.g.rating.toFixed(1) + '</span>' : "") + '</div>' +
        (p.why ? '<p class="pick-why">' + P.text(p.why, p.date, { slot: p.slot }) + '</p>' : "") + (bk ? '<p class="pick-bk">備案：' + bk + '</p>' : "") +
        (p.book ? '<p class="pick-book">📞 ' + P.esc(fill(p.book, p.date, { slot: p.slot })) + '</p>' : "") + '</li>';
    }).join("") + '</ul>';
  };

  /* ---------- 手機底部分頁列 ----------
     「行程」連到：正在看的那天 → 旅程中的今天 → 第一天（不記上次看的那天，免得一直停在最後一天）；標籤帶日期。
     滑雪／美食／景點：正在看某一天、或旅程中，就帶 ?day= 過去（地圖會先顯示那天附近）。 */
  function navInit() {
    var bar = document.querySelector(".tabbar"), T0 = window.TRIP; if (!bar || !T0) return;
    var days = T0.days.map(function (d) { return d.date; }), root = bar.dataset.root || "";
    var q = new URLSearchParams(location.search).get("day"), here = window.DAY || (days.indexOf(q) >= 0 ? q : null);
    var today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10), inTrip = days.indexOf(today) >= 0 ? today : null;
    var d = here || inTrip || days[0], ctx = here || inTrip;
    bar.querySelectorAll("a[data-tab]").forEach(function (a) {
      var t = a.dataset.tab;
      if (t === "day") { if (!window.DAY || window.DAY !== d) a.href = root + "day/" + d.slice(5).replace("-", "") + "/"; a.querySelector("span").textContent = "行程 " + (+d.slice(5, 7)) + "/" + (+d.slice(8)); }
      else if (["ski", "food", "spots"].indexOf(t) >= 0 && ctx) a.href = root + t + "/?day=" + ctx;
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", navInit); else navInit();

  /* ---------- 亮色／深色（10/27 Sylvia：車上戶外太亮，深底看不清楚） ----------
     設定：自動（跟手機的亮／暗）→ 亮 → 暗，存在這支手機。<head> 的 theme-boot 先套上，這裡負責按鈕和之後的切換。
     地圖底圖、地區顏色也跟著主題（P.mapStyle、P.areaColor）；切換時有地圖的頁面重新整理，地圖才會換底圖。 */
  var THEME_KEY = "snow13-theme", mqLight = window.matchMedia ? matchMedia("(prefers-color-scheme: light)") : null;
  function themePref() { try { return localStorage.getItem(THEME_KEY) || "auto"; } catch (e) { return "auto"; } }
  function themeResolve(p) { return p === "auto" ? (mqLight && mqLight.matches ? "light" : "dark") : p; }
  /* ---------- 地圖上的三間住宿（景點、美食、滑雪三張地圖共用一份） ----------
     10/27 Sean：景點地圖要有三間旅館的紅點才好定位。以前是白色小菱形、被景點的點蓋住，看不到。
     現在：紅點＋紅底白字標籤（住哪、幾號到幾號），永遠疊在最上層；activeId＝這天住的那間，放大一點。 */
  P.addBaseMarkers = function (map, activeId) {
    var T0 = window.TRIP; if (!map || !T0 || !window.maplibregl) return [];
    function md(x) { var q = x.split("-"); return (+q[1]) + "/" + (+q[2]); }
    return T0.bases.map(function (b) {
      var el = document.createElement("div"); el.className = "base-pin" + (b.id === activeId ? " on" : ""); el.title = b.name + "（" + md(b.from) + "–" + md(b.to) + "）";
      el.innerHTML = '<span class="base-pin-l">住 ' + P.esc(b.short.split("・").pop()) + '<small>' + md(b.from) + "–" + md(b.to) + '</small></span><span class="base-pin-d"></span>';
      el.style.zIndex = b.id === activeId ? "6" : "5";
      var m = new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([b.lon, b.lat]).addTo(map); m.baseId = b.id; return m;
    });
  };
  /* 景點照片（data/spotphotos.js 一份）：景點地圖卡片、地圖彈窗、單日頁「附近還可以去」共用。
     左上「最佳拍攝點的角度」＝照片就是 spots.js 寫的那個拍攝點；右上「非冬季照片」免得以為 1 月看得到花田；下面是作者、授權（連到 Commons 原檔頁） */
  P.spotPhoto = function (s, small) {
    var p = (window.SPOT_PHOTOS || {})[s && s.id]; if (!p || p.none) return "";
    var w = p.when ? (/^\d+ 月$/.test(p.when) ? p.when + "拍" : /^[春夏秋冬]$/.test(p.when) ? p.when + "天拍" : p.when) : "";
    var img = '<img src="' + BASE + "assets/img/" + P.esc(p.f) + '" alt="' + P.esc(s.name) + '" loading="lazy" decoding="async"' + (p.pos ? ' style="object-position:' + P.esc(p.pos) + '"' : "") + ">";
    if (small) return '<span class="pop-img">' + img + "</span>";
    return '<figure class="sp-img">' + img +
      (p.at && s.photo ? '<span class="sp-img-at">📷 最佳拍攝點的角度</span>' : "") + (p.winter === false ? '<span class="sp-img-off">非冬季照片</span>' : "") +
      '<figcaption>' + (w ? P.esc(w) + " · " : "") + '<a href="' + P.esc(p.src) + '" target="_blank" rel="noopener">' + P.esc(p.by) + " · " + P.esc(p.lic) + "</a></figcaption></figure>";
  };
  /* 換日期時：當晚住的那間放大、疊最上面 */
  P.setActiveBase = function (markers, activeId) {
    (markers || []).forEach(function (m) { var el = m.getElement(), on = m.baseId === activeId; el.classList.toggle("on", on); el.style.zIndex = on ? "6" : "5"; });
  };
  P.theme = function () { return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark"; };
  P.mapStyle = function () { return "https://tiles.openfreemap.org/styles/" + (P.theme() === "light" ? "positron" : "dark"); };
  /* 地區、雪場分組的顏色：深色底用亮色，亮色底用深一點的同色系（原本四支程式各抄一份，亮色底看不見淺藍、淺綠） */
  var AREA_DARK = { "小樽": "#6AA4FF", "銭函": "#9CC6FF", "Kiroro": "#B48CFF", "富良野": "#45C08A", "美瑛・旭川": "#8FDDB8", "札幌": "#F0A43A" };  /* 紅色留給住宿和今天的路線 */
  var AREA_LIGHT = { "小樽": "#1B58C9", "銭函": "#2F7FB8", "Kiroro": "#6B3FC4", "富良野": "#137A4B", "美瑛・旭川": "#2E8C6A", "札幌": "#B86E00" };
  var GROUP_DARK = { main: "#E8B36A", sapporo: "#6AA4FF", asahikawa: "#5CC9A7", otaru: "#8E98A6" }, GROUP_LIGHT = { main: "#8C5A0C", sapporo: "#1B58C9", asahikawa: "#16775A", otaru: "#4E5866" };
  P.areaColor = function () { return P.theme() === "light" ? AREA_LIGHT : AREA_DARK; };
  P.groupColor = function () { return P.theme() === "light" ? GROUP_LIGHT : GROUP_DARK; };
  P.cssVar = function (n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); };
  function themeApply(pref, fromUser) {
    var t = themeResolve(pref), was = P.theme();
    document.documentElement.setAttribute("data-theme", t);
    var meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute("content", t === "light" ? "#F7F6F2" : "#070B12");
    var b = document.getElementById("themebtn");
    if (b) { b.querySelector(".t-lab").textContent = { auto: "自動", light: "亮", dark: "暗" }[pref]; b.setAttribute("aria-label", "畫面：" + { auto: "跟手機設定", light: "亮色", dark: "深色" }[pref] + "（點一下切換）"); b.dataset.pref = pref; }
    if (fromUser && t !== was && document.querySelector(".maplibregl-map")) location.reload();
  }
  function themeInit() {
    themeApply(themePref(), false);
    var b = document.getElementById("themebtn");
    if (b) b.addEventListener("click", function () {
      var order = ["auto", "light", "dark"], next = order[(order.indexOf(themePref()) + 1) % 3];
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { }
      themeApply(next, true);
    });
    if (mqLight) { var on = function () { if (themePref() === "auto") themeApply("auto", true); }; if (mqLight.addEventListener) mqLight.addEventListener("change", on); else if (mqLight.addListener) mqLight.addListener(on); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", themeInit); else themeInit();

  /* ---------- 雪場票：停多久就給對應的票（在雪場不到 4 小時才給 4 小時券；滿 4 小時就 1 日券），單日頁、雪場頁、替代方案共用 ---------- */
  P.ticketFor = function (rs, stay) {
    var t = (rs && rs.tickets) || []; if (!t.length) return null;
    if (stay && stay < 240) { var h = t.filter(function (x) { return /4\s*小時|半日|半天/.test(x[0]); })[0]; if (h) return h; }
    return t[0];
  };
  P.resortOf = function (id) { return ((window.TRIP && TRIP.resorts) || []).filter(function (r) { return (r.stops || []).indexOf(id) >= 0; })[0] || null; };
  /* ---------- 這一站也可以換成…（plan.json 站點的 alts／altNotes） ----------
     每個替代地點算：從上一站過去、再到下一站要開多久，和現在的安排差幾分鐘。 */
  P.altsFor = function (date, i, mode) {
    var sch = P.schedule(date, mode || P.mode()), s = sch.stops[i]; if (!s || !s.alts || !s.alts.length) return [];
    var prev = sch.stops[i - 1], next = sch.stops[i + 1], cur = (i > 0 ? sch.legs[i - 1].min : 0) + (next ? sch.legs[i].min : 0);
    var m = mode || P.mode();
    return s.alts.filter(function (id) { return P.plan.places[id]; }).map(function (id) {
      var pl = P.plan.places[id], a = prev ? leg(prev.id, id, "drive") : null, b = next ? leg(id, next.id, next.via) : null;
      var tot = (a ? a[m] : 0) + (b ? b[m] : 0);
      return { id: id, name: pl.name, ja: pl.ja || "", prev: prev, next: next, toLeg: a, fromLeg: b, delta: tot - cur, resort: P.resortOf(id), note: (s.altNotes || {})[id] || "" };
    });
  };

  /* ---------- 地圖手勢（四張地圖共用） ----------
     手機：一根手指就能拖地圖（以前開了 cooperativeGestures，手機要兩指才動，看起來像卡住）；要捲頁面就從地圖外面捲。
     電腦：維持「按住 Ctrl／⌘ 再捲動才縮放」，不然滑鼠滾輪一碰到地圖頁面就捲不動。 */
  P.touch = window.matchMedia && matchMedia("(pointer: coarse)").matches;
  P.mapOpts = function (o) {
    return Object.assign({ cooperativeGestures: !P.touch, attributionControl: { compact: true },
      locale: { "CooperativeGesturesHandler.WindowsHelpText": "按住 Ctrl 再捲動可縮放地圖", "CooperativeGesturesHandler.MacHelpText": "按住 ⌘ 再捲動可縮放地圖", "CooperativeGesturesHandler.MobileHelpText": "用兩指移動地圖", "NavigationControl.ZoomIn": "放大", "NavigationControl.ZoomOut": "縮小", "AttributionControl.ToggleAttribution": "資料來源" } }, o || {});
  };
  /* 手機的地圖頁：地圖固定在上面、清單在下面。捲清單時，停下來那一刻最上面那張卡片就是「正在看的」，地圖移過去（不改縮放，太遠才拉近到 11 級）。
     listSel＝卡片的選擇器（要有 data-fid）、getPoint(id)→[lon,lat]、onActive(id)＝標亮卡片和圖釘。 */
  P.followList = function (map, listSel, getPoint, onActive, topOffset) {
    if (!P.touch || !map) return;
    var t = null, last = null;
    function tick() {
      var top = (topOffset ? topOffset() : 0) + 8, cards = document.querySelectorAll(listSel), hit = null;
      for (var i = 0; i < cards.length; i++) { var r = cards[i].getBoundingClientRect(); if (r.bottom > top + 40) { hit = cards[i]; break; } }
      if (!hit || hit.dataset.fid === last) return; last = hit.dataset.fid;
      var pt = getPoint(last); if (!pt) return;
      if (onActive) onActive(last);
      var z = map.getZoom(), b = map.getBounds(), inside = b && b.contains(pt);
      if (z >= 10 && inside) return;
      map.easeTo({ center: pt, zoom: Math.max(z, 11), duration: 600, essential: true });
    }
    addEventListener("scroll", function () { clearTimeout(t); t = setTimeout(tick, 220); }, { passive: true });
  };

  /* 地圖頁沒帶 ?day 時預設看哪一天：旅程中的今天 → 上次看的那天（和底部「行程」分頁同一個）；都沒有就不選（看全部） */
  P.defaultDay = function () {
    var T0 = window.TRIP; if (!T0) return null;
    var days = T0.days.map(function (d) { return d.date; }), today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
    if (days.indexOf(today) >= 0) return today;
    return today > days[days.length - 1] ? days[days.length - 1] : days[0]; /* 出發前看第一天、結束後停最後一天；不記「上次看的那天」，每個人打開都一樣 */
  };

  P.legMode = function (l) { return P.LEGMODE[l && l.mode] ? l.mode : "drive"; };
  P.legHTML = function (l) {
    var m = P.legMode(l);
    return '<span class="lg m-' + m + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + LEGICON[m] + '</svg>' +
      '<b>' + P.LEGMODE[m] + ' ' + legMin(l.min) + '</b><small>' + l.km + ' km' + (l.est ? ' · 直線估算' : "") + '</small></span>';
  };

  /* 共用：跳脫、**粗體**、標記 → HTML。所有頁面的說明文字都走這一個，才不會有的頁面漏掉粗體或時間標記 */
  P.esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  P.text = function (s, date, ctx) { return P.esc(date ? fill(s, date, ctx) : s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"); };

  /* 共用：日圓→台幣。trip.js 的匯率先用，上次抓到的即時匯率其次，載入後抓 open.er-api 更新；四捨五入到十元 */
  var T0 = window.TRIP || { fx: { jpyTwd: 0.21, date: "" } };
  P.fx = { rate: T0.fx.jpyTwd, date: T0.fx.date, live: false };
  try { var cfx = JSON.parse(localStorage.getItem("snow13-fx")); if (cfx && cfx.rate > 0.1 && cfx.rate < 0.4) { P.fx.rate = cfx.rate; P.fx.date = cfx.date; } } catch (e) { }
  P.twd = function (n) { var t = n * P.fx.rate; return t >= 100 ? Math.round(t / 10) * 10 : Math.round(t); };
  P.loadFx = function () {
    return fetch("https://open.er-api.com/v6/latest/JPY").then(function (r) { return r.json(); }).then(function (j) {
      if (!(j && j.rates && j.rates.TWD)) return P.fx;
      var changed = Math.abs(j.rates.TWD - P.fx.rate) > 1e-6;
      P.fx.rate = j.rates.TWD; P.fx.live = true;
      if (j.time_last_update_unix) P.fx.date = new Date(j.time_last_update_unix * 1000).toISOString().slice(0, 10);
      try { localStorage.setItem("snow13-fx", JSON.stringify({ rate: P.fx.rate, date: P.fx.date })); } catch (e) { }
      P.fx.changed = changed; return P.fx;
    }).catch(function () { P.fx.changed = false; return P.fx; });
  };

  function fetchJSON(u) { return fetch(u, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(u + " " + r.status); return r.json(); }); }
  /* ---------- 行程資料從哪裡讀 ----------
     有金鑰的手機（會編輯的大人）：直接讀 GitHub 上最新的 plan.json／legs.json，存完馬上看得到，不用等網站重新部署（約 1 分鐘）。
       GitHub 2.5 秒內沒回應、或金鑰失效，就退回讀網站上的檔案。
     沒有金鑰的手機：讀網站上的檔案。
     兩種都一樣：如果這支手機剛存過、讀到的還是舊版（savedAt 比較早），就用這支手機存下來的那一版。 */
  var REPO = "ddfish333/hokkaido-ski-2027", API = "https://api.github.com/repos/" + REPO;
  function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  P.REPO = REPO; P.API = API; P.lsGet = lsGet; P.lsSet = lsSet;
  P.token = function () { return lsGet("snow13-gh-token"); };
  P.ghRaw = function (path, ref) {
    var h = { Accept: "application/vnd.github.raw+json" }, t = P.token(); if (t) h.Authorization = "Bearer " + t;
    return fetch(API + "/contents/" + path + "?ref=" + (ref || "main"), { headers: h, cache: "no-cache" }).then(function (r) {
      if (!r.ok) { var e = new Error("GitHub " + r.status); e.status = r.status; throw e; } return r.json(); });
  };
  function fromPages() { return Promise.all([fetchJSON(BASE + "data/plan.json"), fetchJSON(BASE + "data/legs.json")]); }
  function fromGitHub() { return Promise.all([P.ghRaw("data/plan.json"), P.ghRaw("data/legs.json")]); }
  P.newer = function (a, b) { return String((a && a.savedAt) || "") > String((b && b.savedAt) || ""); };
  P.ready = new Promise(function (res, rej) {
    var pages = fromPages(), done = false;
    pages.catch(function () { });
    function usePages() { pages.then(function (r) { if (!done) { done = true; P.source = "pages"; res(r); } }, function (e) { if (!done) { done = true; rej(e); } }); }
    if (!P.token()) { usePages(); return; }
    fromGitHub().then(function (r) { if (!done) { done = true; P.source = "github"; res(r); } }, function (e) { if (e.status === 401 || e.status === 403) P.tokenBad = e.status; usePages(); });
    setTimeout(usePages, 2500);
  }).then(function (r) {
    var mine = lsGet("snow13-saved");
    if (mine && mine.plan && P.newer(mine.plan, r[0])) { r[0] = mine.plan; Object.keys(mine.legs || {}).forEach(function (k) { if (!r[1][k]) r[1][k] = mine.legs[k]; }); P.source += "+這支手機剛存的版本"; }
    else if (mine) lsSet("snow13-saved", null);
    P.plan = r[0]; P.legs = r[1]; P.readyAt = Math.round(performance.now()); return P;
  });
  P.schedule = schedule; P.dayPlan = dayPlan; P.hm = hm; P.mins = mins; P.legKey = legKey; P.leg = leg; P.estLeg = estLeg; P.r5 = r5; P.hav = hav;
  P.mode = function (m) { try { if (m) { localStorage.setItem("snow13-mode", m); return m; } return localStorage.getItem("snow13-mode") || "normal"; } catch (e) { return m || "normal"; } };
  window.Plan = P;
})();

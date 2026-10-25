/* 美食地圖：獨立頁 food/。資料來自 data/food.js（店）、data/trip.js（日期、住宿、預計餐點）。 */
(function () {
  "use strict";
  var T = window.TRIP, FOOD = window.FOOD || [], FOOD_AREAS = window.FOOD_AREAS || {};
  if (!T || !FOOD.length) return;

  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function em(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"); }
  function nf(n) { return Number(n).toLocaleString("zh-Hant-TW"); }
  function r5(x) { return Math.max(5, Math.round(x / 5) * 5); }
  var DOW = ["日", "一", "二", "三", "四", "五", "六"];
  function dow(s) { var p = s.split("-").map(Number); return DOW[new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay()]; }
  function wday(s) { var p = s.split("-").map(Number); return new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay(); }
  function md(s) { var p = s.split("-").map(Number); return p[1] + "/" + p[2]; }
  function hav(a, b) {
    var R = 6371, toR = Math.PI / 180, dLa = (b.lat - a.lat) * toR, dLo = (b.lon - a.lon) * toR;
    var h = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLo / 2) * Math.sin(dLo / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }

  var AREA_COLOR = { "小樽": "#6AA4FF", "銭函": "#9CC6FF", "Kiroro": "#B48CFF", "富良野": "#45C08A", "美瑛・旭川": "#8FDDB8", "札幌": "#FF5A4C" };
  var AREA_ORDER = ["Kiroro", "銭函", "小樽", "富良野", "美瑛・旭川", "札幌"];
  var KIND_GROUP = [
    ["壽司・海鮮", /壽司|海鮮|炸蝦|螃蟹/],
    ["麵・咖哩・定食", /麵|咖哩|拉麵|定食|餃子|綜合|和食|自助／和食/],
    ["燒肉・鍋", /成吉思汗|燒肉|鍋/],
    ["披薩・漢堡・洋食", /披薩|漢堡|起司|洋食|蛋包/],
    ["雪場裡", /自助午餐|輕食|山屋|付費包廂|北海道料理|鬆餅|未確認/],
    ["甜點・咖啡", /甜點|咖啡|下午茶|美食街/]
  ];
  function groupOf(f) { if (f.area === "Kiroro") return "雪場裡"; for (var i = 0; i < KIND_GROUP.length; i++) if (KIND_GROUP[i][1].test(f.kind)) return KIND_GROUP[i][0]; return "其他"; }
  var FIT = { best: ["很適合 8 人帶小孩", "best"], ok: ["可以", "ok"], warn: ["不太適合帶幼兒", "warn"], unknown: ["待確認", "unknown"] };
  var baseById = {}; T.bases.forEach(function (b) { baseById[b.id] = b; });

  var qs = new URLSearchParams(location.search);
  var state = { day: null, area: "全部", kind: "全部", kids: false, active: (location.hash || "").replace("#", "") || null };
  var dayById = {}; T.days.forEach(function (d) { dayById[d.date] = d; });
  if (qs.get("day") && dayById[qs.get("day")]) { state.day = qs.get("day"); state.area = "附近"; }

  /* ---------- 推算 ---------- */
  function ctx() {
    var d = state.day ? dayById[state.day] : null, b = d ? baseById[d.base] : null;
    return { d: d, b: b, wd: d ? wday(d.date) : -1 };
  }
  function isPlanned(f, c) { return !!(c.d && f.key && c.d.meals.join("").indexOf(f.key) >= 0); }
  function isClosed(f, c) { return !!(f.closed && c.wd >= 0 && f.closed.indexOf(c.wd) >= 0); }
  function driveMin(f, c) { if (!c.b) return 0; return r5(hav(c.b, f) * 1.35 / 40 * 60); }
  function nearby(c) { return c.d ? (FOOD_AREAS[c.d.base] || []) : []; }

  function visible() {
    var c = ctx();
    return FOOD.filter(function (f) {
      if (state.area === "附近" && nearby(c).indexOf(f.area) < 0) return false;
      if (state.area !== "全部" && state.area !== "附近" && f.area !== state.area) return false;
      if (state.kind !== "全部" && groupOf(f) !== state.kind) return false;
      if (state.kids && f.fit !== "best") return false;
      return true;
    }).sort(function (x, y) {
      var px = isPlanned(x, c), py = isPlanned(y, c); if (px !== py) return px ? -1 : 1;
      var cx = isClosed(x, c), cy = isClosed(y, c); if (cx !== cy) return cx ? 1 : -1;
      var ax = AREA_ORDER.indexOf(x.area), ay = AREA_ORDER.indexOf(y.area);
      if (c.d) { var nx = nearby(c).indexOf(x.area) >= 0, ny = nearby(c).indexOf(y.area) >= 0; if (nx !== ny) return nx ? -1 : 1; }
      if (ax !== ay) return ax - ay;
      if (!!x.rec !== !!y.rec) return x.rec ? -1 : 1;
      if (x.rec && y.rec) return x.rec - y.rec;
      var o = { best: 0, ok: 1, unknown: 2, warn: 3 }; if ((o[x.fit] || 1) !== (o[y.fit] || 1)) return (o[x.fit] || 1) - (o[y.fit] || 1);
      return ((y.g && y.g.rating) || 0) - ((x.g && x.g.rating) || 0);
    });
  }

  /* ---------- 卡片 ---------- */
  function card(f, c) {
    var planned = isPlanned(f, c), closed = isClosed(f, c), fit = FIT[f.fit] || FIT.ok, g = f.g;
    var stars = g ? '<span class="stars" aria-label="Google 評價 ' + g.rating + '"><i style="--r:' + (g.rating / 5 * 100) + '%"></i></span><b>' + g.rating.toFixed(1) + '</b><small>' + nf(g.n) + ' 則 · Google</small>' : '<small class="nog">Google 評價待查</small>';
    var mapsUrl = g ? 'https://www.google.com/maps/place/?q=place_id:' + g.pid : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(f.name.replace(/（.*?）/g, "") + " " + (f.area === "Kiroro" ? "キロロ" : f.area));
    var min = driveMin(f, c);
    return '<li class="fp ' + fit[1] + (closed ? " closed" : "") + (planned ? " planned" : "") + (state.active === f.id ? " active" : "") + '" id="' + f.id + '" data-fid="' + f.id + '" style="--ac:' + AREA_COLOR[f.area] + '">' +
      '<div class="fp-top"><button type="button" class="fp-name" data-go="' + f.id + '"><i class="dot"></i>' + esc(f.name) + '</button><span class="kind">' + esc(f.kind) + '</span>' +
      (f.rec ? '<span class="badge rec">推薦 ' + f.rec + '</span>' : "") + (f.via ? '<span class="badge via">' + esc(f.via) + '</span>' : "") + (planned ? '<span class="badge gold">' + md(c.d.date) + ' 預計</span>' : "") + (closed ? '<span class="badge red">' + md(c.d.date) + ' 公休</span>' : "") + '</div>' +
      '<div class="fp-rating">' + stars + '</div>' +
      '<p class="fp-what">' + em(f.what) + '</p>' +
      '<p class="fp-meta"><span class="area">' + esc(f.area) + '</span> · ' + esc(f.hours) + (f.closed && f.closed.length ? ' · 週' + f.closed.map(function (x) { return DOW[x]; }).join("、") + '休' : "") + (c.b ? ' · 從' + esc(c.b.short.split("・").pop()) + '約 ' + min + ' 分' : "") + ' · <span class="fit">' + fit[0] + '</span>' + (f.approx ? ' · 位置約略' : "") + '</p>' +
      '<div class="fp-act">' + (g ? '<button type="button" class="fp-more" data-q="' + esc(g.q) + '">照片與評論 ▾</button>' : "") + '<a href="' + mapsUrl + '" target="_blank" rel="noopener">在 Google Maps 開啟 →</a>' +
      '<a href="https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=' + f.lat + ',' + f.lon + (c.b ? '&origin=' + c.b.lat + ',' + c.b.lon : "") + '" target="_blank" rel="noopener">導航 →</a></div>' +
      '<div class="fp-embed" hidden></div></li>';
  }
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".fp-more");
    if (btn) {
      var li = btn.closest(".fp"), box = li.querySelector(".fp-embed");
      if (!box.hidden) { box.hidden = true; box.innerHTML = ""; btn.textContent = "照片與評論 ▾"; return; }
      box.innerHTML = '<iframe loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Google Maps" src="https://maps.google.com/maps?hl=zh-TW&q=' + encodeURIComponent(btn.dataset.q) + '&z=16&output=embed"></iframe><p class="fp-embedhint">Google 的照片、評論與目前營業狀態；點左上角店名可以在 Google Maps 開大圖。</p>';
      box.hidden = false; btn.textContent = "收起 ▴"; return;
    }
    var go = e.target.closest("[data-go]");
    if (go) { focusFood(go.dataset.go, true); }
  });

  /* ---------- 工具列 ---------- */
  function renderTools() {
    var c = ctx();
    var sel = $("#fmday");
    sel.innerHTML = '<option value="">不選日期（看全部）</option>' + T.days.map(function (d) {
      return '<option value="' + d.date + '"' + (state.day === d.date ? " selected" : "") + '>' + md(d.date) + '（' + dow(d.date) + '）' + esc(d.title) + ' · 住' + esc(baseById[d.base].short.split("・")[0]) + '</option>';
    }).join("");
    sel.onchange = function () {
      state.day = sel.value || null; state.area = state.day ? "附近" : "全部";
      var u = new URL(location.href); if (state.day) u.searchParams.set("day", state.day); else u.searchParams.delete("day"); history.replaceState(null, "", u);
      render(true);
    };
    var areas = ["全部"].concat(c.d ? ["附近"] : []).concat(AREA_ORDER.filter(function (a) { return FOOD.some(function (f) { return f.area === a; }); }));
    $("#fmarea").innerHTML = areas.map(function (a) {
      var col = AREA_COLOR[a];
      return '<button type="button" class="chip' + (col ? "" : " solid") + '" aria-pressed="' + (state.area === a) + '" data-a="' + esc(a) + '"' + (col ? ' style="--mc:' + col + '"' : "") + '>' + (col ? "<i></i>" : "") + esc(a === "附近" && c.b ? "住" + c.b.short.split("・")[0] + "附近" : a) + '</button>';
    }).join("");
    $("#fmarea").onclick = function (e) { var b = e.target.closest("[data-a]"); if (!b) return; state.area = b.dataset.a; render(true); };
    var kinds = ["全部"]; FOOD.forEach(function (f) { var k = groupOf(f); if (kinds.indexOf(k) < 0) kinds.push(k); });
    $("#fmkind").innerHTML = kinds.map(function (k) { return '<button type="button" class="chip solid sm" aria-pressed="' + (state.kind === k) + '" data-k="' + esc(k) + '">' + esc(k) + '</button>'; }).join("");
    $("#fmkind").onclick = function (e) { var b = e.target.closest("[data-k]"); if (!b) return; state.kind = state.kind === b.dataset.k ? "全部" : b.dataset.k; render(true); };
    $("#fmkids").checked = state.kids;
    $("#fmkids").onchange = function () { state.kids = $("#fmkids").checked; render(true); };
    $("#fmlegend").innerHTML = AREA_ORDER.map(function (a) { return '<span><i style="background:' + AREA_COLOR[a] + '"></i>' + esc(a) + '</span>'; }).join("") + '<span><i class="home"></i>住宿</span>';
  }

  /* ---------- 地圖 ---------- */
  var map, markers = {}, popup, mapReady = false;
  function initMap() {
    if (!window.maplibregl) { $("#fmfallback").hidden = false; return; }
    try {
      map = new maplibregl.Map({ container: "fmcanvas", style: "https://tiles.openfreemap.org/styles/dark", center: [141.5, 43.2], zoom: 7.3, cooperativeGestures: true, attributionControl: { compact: true } });
    } catch (e) { $("#fmfallback").hidden = false; return; }
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    popup = new maplibregl.Popup({ closeButton: true, closeOnClick: true, offset: 14, maxWidth: "280px", className: "fm-pop" });
    T.bases.forEach(function (b) {
      var el = document.createElement("div"); el.className = "fm-home"; el.title = b.name;
      el.innerHTML = '<span class="fm-home-i"></span><span class="fm-home-l">' + esc(b.short.split("・").pop()) + '</span>';
      new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([b.lon, b.lat]).addTo(map);
    });
    var seen = {};
    FOOD.forEach(function (f) {
      var k = f.lat.toFixed(4) + "," + f.lon.toFixed(4), n = seen[k] = (seen[k] || 0) + 1;
      var off = n > 1 ? [Math.cos(n * 1.9) * 30, Math.sin(n * 1.9) * 22] : [0, 0];
      var el = document.createElement("button"); el.type = "button"; el.className = "fm-pin"; el.style.setProperty("--ac", AREA_COLOR[f.area] || "#fff");
      el.setAttribute("aria-label", f.name);
      el.innerHTML = '<span class="fm-pin-d"></span><span class="fm-pin-l">' + esc(f.name.replace(/（.*?）/g, "")) + '</span>';
      el.addEventListener("click", function (ev) { ev.stopPropagation(); focusFood(f.id, false); scrollToCard(f.id); });
      markers[f.id] = new maplibregl.Marker({ element: el, anchor: "bottom", offset: off }).setLngLat([f.lon, f.lat]).addTo(map);
    });
    map.on("load", function () { mapReady = true; render(true); });
  }
  function fitTo(list) {
    if (!map || !list.length) return;
    var b = new maplibregl.LngLatBounds();
    list.forEach(function (f) { b.extend([f.lon, f.lat]); });
    var c = ctx(); if (c.b && state.area === "附近") b.extend([c.b.lon, c.b.lat]);
    var side = window.innerWidth > 900 ? 60 : 40;
    map.fitBounds(b, { padding: { top: side + 36, bottom: side + 30, left: side + 20, right: side + 20 }, maxZoom: 14.5, duration: 700 });
  }
  function syncPins(list) {
    var c = ctx(), vis = {}; list.forEach(function (f) { vis[f.id] = true; });
    var g = (c.d && list.length > 25) ? 1 : 0; // 全部顯示時標籤太多，只給推薦／預計的
    FOOD.forEach(function (f) {
      var el = markers[f.id] && markers[f.id].getElement(); if (!el) return;
      var planned = isPlanned(f, c), closed = isClosed(f, c), r = (f.g && f.g.rating) || 3.8;
      el.classList.toggle("hidden", !vis[f.id]);
      el.classList.toggle("planned", planned);
      el.classList.toggle("closed", closed);
      el.classList.toggle("active", state.active === f.id);
      el.classList.toggle("labeled", list.length <= 14 || planned || !!f.rec || state.active === f.id);
      el.style.setProperty("--sz", (10 + Math.max(0, r - 3.5) * 8).toFixed(0) + "px");
      el.style.zIndex = planned || state.active === f.id ? 5 : (closed ? 1 : 2);
    });
  }
  function focusFood(id, fly) {
    state.active = id; history.replaceState(null, "", "#" + id);
    var f = FOOD.filter(function (x) { return x.id === id; })[0]; if (!f) return;
    var c = ctx();
    document.querySelectorAll(".fm-list .fp").forEach(function (li) { li.classList.toggle("active", li.dataset.fid === id); });
    syncPins(visible());
    if (!map) return;
    if (fly) map.flyTo({ center: [f.lon, f.lat], zoom: Math.max(map.getZoom(), 13.5), duration: 800 });
    var g = f.g;
    popup.setLngLat([f.lon, f.lat]).setHTML('<b>' + esc(f.name) + '</b><span>' + esc(f.kind) + ' · ' + esc(f.area) + (g ? ' · ★ ' + g.rating.toFixed(1) : "") + '</span>' +
      (isPlanned(f, c) ? '<em class="gold">' + md(c.d.date) + ' 預計</em>' : "") + (isClosed(f, c) ? '<em class="red">' + md(c.d.date) + ' 公休</em>' : "") +
      '<small>' + esc(f.hours) + (c.b ? ' · 從' + esc(c.b.short.split("・").pop()) + '約 ' + driveMin(f, c) + ' 分' : "") + '</small>').addTo(map);
  }
  function scrollToCard(id) {
    var li = document.getElementById(id); if (!li) return;
    li.scrollIntoView({ behavior: "smooth", block: window.innerWidth > 900 ? "center" : "start" });
  }

  /* ---------- 這天怎麼吃（建議／已決定） ---------- */
  var PICK_SLOT = { breakfast: "早餐", lunch: "午餐", snack: "下午", dinner: "晚餐", late: "大人宵夜" }, PICK_ORDER = ["breakfast", "lunch", "snack", "dinner", "late"];
  var PICK_STATUS = { proposed: ["建議", "st-blue"], decided: ["已決定", "st-gold"], booked: ["已訂位", "st-ok"] };
  function byId(id) { return FOOD.filter(function (f) { return f.id === id; })[0]; }
  function picksHTML(c) {
    if (!c.d) return "";
    var picks = (window.FOOD_PICKS || []).filter(function (p) { return p.date === c.d.date; }).sort(function (a, b) { return PICK_ORDER.indexOf(a.slot) - PICK_ORDER.indexOf(b.slot); });
    if (!picks.length) return "";
    return '<li class="picks"><p class="picks-h">' + md(c.d.date) + ' 這天怎麼吃 <small>藍色是 Claude 的建議、金色是已決定；點店名跳到卡片。</small></p><ul class="picklist">' + picks.map(function (p) {
      var f = byId(p.pick), st = PICK_STATUS[p.status] || PICK_STATUS.proposed;
      var bk = (p.backup || []).map(function (id) { var g = byId(id); return g ? '<button type="button" class="lnk" data-go="' + g.id + '">' + esc(g.name.replace(/（.*?）/g, "")) + '</button>' : ""; }).filter(Boolean).join("、");
      return '<li class="pick ' + st[1] + '"><div class="pick-top"><span class="pick-slot">' + PICK_SLOT[p.slot] + '</span><button type="button" class="pick-name lnk" data-go="' + (f ? f.id : "") + '">' + esc(f ? f.name : p.pick) + '</button><span class="badge ' + st[1] + '">' + st[0] + '</span>' + (f && f.g && f.g.rating ? '<span class="pick-r">★ ' + f.g.rating.toFixed(1) + '</span>' : "") + '</div>' +
        '<p class="pick-why">' + em(p.why) + '</p>' + (bk ? '<p class="pick-bk">備案：' + bk + '</p>' : "") + (p.book ? '<p class="pick-book">📞 ' + esc(p.book) + '</p>' : "") + '</li>';
    }).join("") + '</ul></li>';
  }

  /* ---------- 全部重畫 ---------- */
  function render(refit) {
    var c = ctx(), list = visible();
    renderTools();
    $("#fmlist").innerHTML = picksHTML(c) + (list.map(function (f) { return card(f, c); }).join("") || '<li class="fm-empty">這個組合沒有店。把類型或「只看適合帶小孩」放寬一點。</li>');
    var planned = list.filter(function (f) { return isPlanned(f, c); }).length, closed = list.filter(function (f) { return isClosed(f, c); }).length;
    $("#fmcount").textContent = list.length + " 家" + (c.d ? "（" + md(c.d.date) + " " + dow(c.d.date) + "：預計 " + planned + " 家、公休 " + closed + " 家）" : "") + (state.kind !== "全部" ? " · " + state.kind : "");
    if (mapReady) { syncPins(list); if (refit) fitTo(list); }
  }

  render(false); initMap();
  if (state.active) setTimeout(function () { scrollToCard(state.active); }, 300);
})();

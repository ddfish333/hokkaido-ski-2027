/* 景點地圖：獨立頁 spots/。資料來自 data/spots.js（景點收藏）、data/plan.json（正式行程路線）、data/trip.js（日期、住宿）。
   三種狀態：plan 正式行程（畫在路線上、參與時間計算）／saved 收藏（只有標記）／check 待確認。 */
(function () {
  "use strict";
  var T = window.TRIP, SPOTS = window.SPOTS || [], SPOT_AREAS = window.SPOT_AREAS || {};
  if (!T || !SPOTS.length) return;

  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function em(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"); }
  /* 文字裡的 {sun:set}（日落）等標記：景點有排進行程就用那一天，沒有就用卡片自己的 day；都沒有就不換 */
  function txt(t, s, c) { var d = (c && c.d && c.d.date) || s.day; return window.Plan && Plan.fill && d ? Plan.fill(t, d) : t; }
  function nf(n) { return Number(n).toLocaleString("zh-Hant-TW"); }
  var DOW = ["日", "一", "二", "三", "四", "五", "六"];
  function dow(s) { var p = s.split("-").map(Number); return DOW[new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay()]; }
  function wday(s) { var p = s.split("-").map(Number); return new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay(); }
  function md(s) { var p = s.split("-").map(Number); return p[1] + "/" + p[2]; }

  var AREA_COLOR = Plan.areaColor();  /* 地區顏色跟主題（plan.js 一份） */
  var AREA_ORDER = ["Kiroro", "銭函", "小樽", "札幌", "富良野", "美瑛・旭川"];
  var STATUS = { plan: ["正式行程", "gold"], saved: ["收藏", "blue"], check: ["待確認", "grey"] };
  var KIDS = { best: ["小孩會很喜歡", "best"], ok: ["可以帶小孩", "ok"], warn: ["小孩不太適合", "warn"] };
  var baseById = {}; T.bases.forEach(function (b) { baseById[b.id] = b; });
  var dayById = {}; T.days.forEach(function (d) { dayById[d.date] = d; });

  var qs = new URLSearchParams(location.search);
  var state = { day: null, status: "全部", area: "全部", kind: "全部", active: (location.hash || "").replace("#", "") || null };
  if (qs.get("day") && dayById[qs.get("day")]) { state.day = qs.get("day"); state.area = "附近"; }
  else if (!qs.has("day") && !state.active && window.Plan && Plan.defaultDay()) { state.day = Plan.defaultDay(); state.area = "附近"; }
  if (qs.get("status") && STATUS[qs.get("status")]) state.status = qs.get("status");

  function ctx() { var d = state.day ? dayById[state.day] : null, b = d ? baseById[d.base] : null; return { d: d, b: b, wd: d ? wday(d.date) : -1 }; }
  function isToday(s, c) { return !!(c.d && s.day === c.d.date); }
  function isClosed(s, c) { return !!(s.closed && c.wd >= 0 && s.closed.indexOf(c.wd) >= 0); }
  /* 從住宿過去要多久：和美食頁、雪場頁、單日頁同一個算法（Plan.travelMin），數字才不會各頁不同 */
  function travel(s, c) { return c.b && window.Plan && Plan.travelMin ? Plan.travelMin(c.b, s, { date: c.d && c.d.date }) : null; }
  function nearby(c) { return c.d ? (SPOT_AREAS[c.d.base] || []) : []; }

  function visible() {
    var c = ctx();
    return SPOTS.filter(function (s) {
      if (state.status !== "全部" && s.status !== state.status) return false;
      if (state.area === "附近" && nearby(c).indexOf(s.area) < 0) return false;
      if (state.area !== "全部" && state.area !== "附近" && s.area !== state.area) return false;
      if (state.kind !== "全部" && s.kind !== state.kind) return false;
      return true;
    }).sort(function (x, y) {
      var tx = isToday(x, c), ty = isToday(y, c); if (tx !== ty) return tx ? -1 : 1;
      var o = { plan: 0, saved: 1, check: 2 }; if (o[x.status] !== o[y.status]) return o[x.status] - o[y.status];
      if (c.d) { var nx = nearby(c).indexOf(x.area) >= 0, ny = nearby(c).indexOf(y.area) >= 0; if (nx !== ny) return nx ? -1 : 1; }
      var ax = AREA_ORDER.indexOf(x.area), ay = AREA_ORDER.indexOf(y.area); if (ax !== ay) return ax - ay;
      var k = { best: 0, ok: 1, warn: 2 }; if ((k[x.kids] || 1) !== (k[y.kids] || 1)) return (k[x.kids] || 1) - (k[y.kids] || 1);
      return ((y.g && y.g.rating) || 0) - ((x.g && x.g.rating) || 0);
    });
  }

  /* ---------- 卡片 ---------- */
  function addUrl(s, c) { return (window.BASE || "../") + "plan/?add=" + encodeURIComponent(s.id) + (c.d ? "#" + c.d.date : ""); }
  function card(s, c) {
    var st = STATUS[s.status] || STATUS.saved, kids = KIDS[s.kids] || KIDS.ok, g = s.g, today = isToday(s, c), closed = isClosed(s, c);
    var stars = g && g.rating ? '<span class="stars" aria-label="Google 評價 ' + g.rating + '"><i style="--r:' + (g.rating / 5 * 100) + '%"></i></span><b>' + g.rating.toFixed(1) + '</b><small>' + nf(g.n) + ' 則 · Google</small>' : '<small class="nog">Google 評價待查</small>';
    var mapsUrl = g && g.pid ? 'https://www.google.com/maps/place/?q=place_id:' + g.pid : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent((s.ja || s.name) + " " + s.area);
    var meta = [];
    meta.push('<span class="area">' + esc(s.area) + '</span>');
    if (s.hours) meta.push(em(s.hours));
    if (s.closed && s.closed.length) meta.push('週' + s.closed.map(function (x) { return DOW[x]; }).join("、") + '休');
    if (s.fee) meta.push(em(s.fee));
    if (s.time) meta.push('約 ' + s.time + ' 分');
    var tv = travel(s, c); if (tv) meta.push('從' + esc(c.b.short.split("・").pop()) + tv.label);
    meta.push('<span class="fit">' + kids[0] + '</span>');
    if (s.approx) meta.push('位置約略');
    return '<li class="fp ' + kids[1] + (closed ? " closed" : "") + (today ? " planned" : "") + (state.active === s.id ? " active" : "") + '" id="' + s.id + '" data-fid="' + s.id + '" style="--ac:' + AREA_COLOR[s.area] + '">' +
      '<div class="fp-top"><button type="button" class="fp-name" data-go="' + s.id + '"><i class="dot"></i>' + esc(s.name) + '</button><span class="kind">' + esc(s.kind) + '</span>' +
      '<span class="badge st-' + st[1] + '">' + st[0] + (s.day ? ' ' + md(s.day) : "") + '</span>' + (closed ? '<span class="badge red">' + md(c.d.date) + ' 公休</span>' : "") + '</div>' +
      (s.ja && s.ja !== s.name ? '<p class="fp-ja">' + esc(s.ja) + '</p>' : "") +
      '<div class="fp-rating">' + stars + '</div>' +
      '<p class="fp-what">' + em(txt(s.what, s, c)) + '</p>' +
      (s.caution ? '<p class="fp-caution">⚠ ' + em(txt(s.caution, s, c)) + '</p>' : "") +
      (s.photo ? '<p class="fp-photo"><span class="lab">📷 最佳拍攝點</span>' + em(txt(s.photo, s, c)) + (s.photoAt ? ' <button type="button" class="fp-photoat" data-photo="' + s.id + '">在地圖上看拍攝點</button>' : "") + '</p>' : "") +
      (s.parking ? '<p class="fp-meta">停車：' + em(s.parking) + '</p>' : "") +
      '<p class="fp-meta">' + meta.join(" · ") + '</p>' +
      '<div class="fp-act">' + (g && g.q ? '<button type="button" class="fp-more" data-q="' + esc(g.q) + '">照片與評論 ▾</button>' : "") +
      '<a href="' + mapsUrl + '" target="_blank" rel="noopener">Google Maps →</a>' +
      '<a href="' + Plan.navTo(s) + '" target="_blank" rel="noopener">導航 →</a>' +
      (s.photoAt ? '<a href="https://www.google.com/maps/dir/?api=1&travelmode=walking&destination=' + s.photoAt[0] + ',' + s.photoAt[1] + '" target="_blank" rel="noopener">📷 走到拍攝點 →</a>' : "") +
      (s.status !== "plan" ? '<a class="fp-add" href="' + addUrl(s, c) + '">加入行程 ＋</a>' : (s.day ? '<a href="' + (window.BASE || "../") + 'day/' + s.day.slice(5).replace("-", "") + '/">看 ' + md(s.day) + ' 行程 →</a>' : "")) +
      (s.src ? s.src.map(function (x) { return '<a class="src" href="' + esc(x[1]) + '" target="_blank" rel="noopener">' + esc(x[0]) + ' ↗</a>'; }).join("") : "") + '</div>' +
      '<div class="fp-embed" hidden></div></li>';
  }
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".fp-more");
    if (btn) {
      var li = btn.closest(".fp"), box = li.querySelector(".fp-embed");
      if (!box.hidden) { box.hidden = true; box.innerHTML = ""; btn.textContent = "照片與評論 ▾"; return; }
      box.innerHTML = '<iframe loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Google Maps" src="https://maps.google.com/maps?hl=zh-TW&q=' + encodeURIComponent(btn.dataset.q) + '&z=16&output=embed"></iframe><p class="fp-embedhint">Google 的照片、評論與目前營業狀態；點左上角名稱可以在 Google Maps 開大圖。</p>';
      box.hidden = false; btn.textContent = "收起 ▴"; return;
    }
    var go = e.target.closest("[data-go]");
    if (go) { focusSpot(go.dataset.go, true); return; }
    /* 點卡片本身（不是連結、按鈕）：地圖飛過去 */
    var li = e.target.closest(".fm-list .fp");
    if (li && !e.target.closest("a, button, input, select, iframe")) focusSpot(li.dataset.fid, true);
    var ph = e.target.closest("[data-photo]");
    if (ph) { focusSpot(ph.dataset.photo, true); showPhotoPin(ph.dataset.photo, true); }
  });

  /* ---------- 工具列 ---------- */
  function renderTools() {
    var c = ctx();
    var sel = $("#fmday");
    sel.innerHTML = '<option value="">不選日期（看全部）</option>' + T.days.map(function (d) {
      return '<option value="' + d.date + '"' + (state.day === d.date ? " selected" : "") + '>' + md(d.date) + '（' + dow(d.date) + '）' + esc(d.title) + ' · 住' + esc(baseById[d.base].short.split("・")[0]) + '</option>';
    }).join("");
    if (window.Plan && Plan.dayLink) Plan.dayLink(sel, state.day);
    sel.onchange = function () {
      state.day = sel.value || null; state.area = state.day ? "附近" : "全部";
      var u = new URL(location.href); if (state.day) u.searchParams.set("day", state.day); else u.searchParams.delete("day"); history.replaceState(null, "", u);
      render(true);
    };
    var sts = [["全部", "全部"], ["plan", "正式行程"], ["saved", "收藏"], ["check", "待確認"]];
    $("#fmstatus").innerHTML = sts.map(function (x) { var n = x[0] === "全部" ? SPOTS.length : SPOTS.filter(function (s) { return s.status === x[0]; }).length; return '<button type="button" class="chip solid" aria-pressed="' + (state.status === x[0]) + '" data-s="' + x[0] + '">' + x[1] + ' <small>' + n + '</small></button>'; }).join("");
    $("#fmstatus").onclick = function (e) { var b = e.target.closest("[data-s]"); if (!b) return; state.status = b.dataset.s; render(true); };
    var areas = ["全部"].concat(c.d ? ["附近"] : []).concat(AREA_ORDER.filter(function (a) { return SPOTS.some(function (s) { return s.area === a; }); }));
    $("#fmarea").innerHTML = areas.map(function (a) {
      var col = AREA_COLOR[a];
      return '<button type="button" class="chip' + (col ? "" : " solid") + '" aria-pressed="' + (state.area === a) + '" data-a="' + esc(a) + '"' + (col ? ' style="--mc:' + col + '"' : "") + '>' + (col ? "<i></i>" : "") + esc(a === "附近" && c.b ? "住" + c.b.short.split("・")[0] + "附近" : a) + '</button>';
    }).join("");
    $("#fmarea").onclick = function (e) { var b = e.target.closest("[data-a]"); if (!b) return; state.area = b.dataset.a; render(true); };
    var kinds = ["全部"]; SPOTS.forEach(function (s) { if (kinds.indexOf(s.kind) < 0) kinds.push(s.kind); });
    $("#fmkind").innerHTML = kinds.map(function (k) { return '<button type="button" class="chip solid sm" aria-pressed="' + (state.kind === k) + '" data-k="' + esc(k) + '">' + esc(k) + '</button>'; }).join("");
    $("#fmkind").onclick = function (e) { var b = e.target.closest("[data-k]"); if (!b) return; state.kind = state.kind === b.dataset.k ? "全部" : b.dataset.k; render(true); };
    $("#fmlegend").innerHTML = '<span><i class="pin-plan"></i>正式行程</span><span><i class="pin-saved"></i>收藏</span><span><i class="pin-check"></i>待確認</span><span><i class="route"></i>行程路線</span><span><i class="home"></i>住宿</span>';
  }

  /* ---------- 地圖 ---------- */
  var map, baseMarkers = [], markers = {}, popup, mapReady = false, photoPin = null;
  function showPhotoPin(id, fly) {
    var s = SPOTS.filter(function (x) { return x.id === id; })[0];
    if (photoPin) { photoPin.remove(); photoPin = null; }
    if (!map || !s || !s.photoAt) return;
    var el = document.createElement("div"); el.className = "fm-cam";
    el.innerHTML = '<span class="fm-cam-i">📷</span><span class="fm-cam-l">' + esc(s.photoName || "拍攝點") + '</span>';
    photoPin = new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([s.photoAt[1], s.photoAt[0]]).addTo(map);
    if (fly) { var b = new maplibregl.LngLatBounds([s.lon, s.lat], [s.lon, s.lat]); b.extend([s.photoAt[1], s.photoAt[0]]); map.fitBounds(b, { padding: 120, maxZoom: 16.5, duration: 700 }); }
  }
  function routeGeo() {
    var feats = [];
    if (!window.Plan || !Plan.plan) return { type: "FeatureCollection", features: feats };
    Object.keys(Plan.plan.days).forEach(function (dt) {
      try { Plan.schedule(dt, "normal").legs.forEach(function (l) { if (l.geom) feats.push({ type: "Feature", properties: { date: dt }, geometry: { type: "LineString", coordinates: l.geom } }); }); } catch (e) { }
    });
    return { type: "FeatureCollection", features: feats };
  }
  function initMap() {
    if (!window.maplibregl) { $("#fmfallback").hidden = false; return; }
    try {
      map = new maplibregl.Map({ container: "fmcanvas", style: Plan.mapStyle(), center: [141.6, 43.2], zoom: 7.2, cooperativeGestures: !Plan.touch, locale: Plan.mapOpts().locale, attributionControl: { compact: true } });
    } catch (e) { $("#fmfallback").hidden = false; return; }
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    popup = new maplibregl.Popup({ closeButton: true, closeOnClick: true, offset: 14, maxWidth: "300px", className: "fm-pop" });
    baseMarkers = Plan.addBaseMarkers(map, (ctx().b || {}).id);  /* 三間住宿：紅點，疊在最上層（plan.js 共用） */
    var seen = {};
    SPOTS.forEach(function (s) {
      var k = s.lat.toFixed(4) + "," + s.lon.toFixed(4), n = seen[k] = (seen[k] || 0) + 1;
      var off = n > 1 ? [Math.cos(n * 1.9) * 30, Math.sin(n * 1.9) * 22] : [0, 0];
      var el = document.createElement("button"); el.type = "button"; el.className = "fm-pin st-" + s.status; el.style.setProperty("--ac", AREA_COLOR[s.area] || "#fff");
      el.setAttribute("aria-label", s.name);
      el.innerHTML = '<span class="fm-pin-d"></span><span class="fm-pin-l">' + esc(s.name.replace(/（.*?）/g, "")) + '</span>';
      el.addEventListener("click", function (ev) { ev.stopPropagation(); focusSpot(s.id, false); scrollToCard(s.id); });
      markers[s.id] = new maplibregl.Marker({ element: el, anchor: "bottom", offset: off }).setLngLat([s.lon, s.lat]).addTo(map);
    });
    map.on("load", function () {
      var draw = function () {
        if (map.getSource("routes")) return;
        map.addSource("routes", { type: "geojson", data: routeGeo() });
        map.addLayer({ id: "routes-line", type: "line", source: "routes", paint: { "line-color": Plan.cssVar("--gold"), "line-width": 2, "line-opacity": 0.45 } });
        map.addLayer({ id: "routes-today", type: "line", source: "routes", filter: ["==", ["get", "date"], state.day || ""], paint: { "line-color": Plan.cssVar("--gold"), "line-width": 4, "line-opacity": 0.9 } });
      };
      if (window.Plan && Plan.ready) Plan.ready.then(draw); else draw();
      mapReady = true; render(true);
      /* 手機：捲清單時地圖跟著正在看的那張卡片 */
      Plan.followList(map, ".fm-list .fp", function (id) { var s = SPOTS.filter(function (x) { return x.id === id; })[0]; return s ? [s.lon, s.lat] : null; }, function (id) { state.active = id; syncPins(visible()); document.querySelectorAll(".fm-list .fp").forEach(function (li) { li.classList.toggle("active", li.dataset.fid === id); }); }, function () { var m = document.querySelector(".fm-map"); return m ? m.getBoundingClientRect().bottom : 0; });
    });
  }
  function fitTo(list) {
    if (!map || !list.length) return;
    var b = new maplibregl.LngLatBounds();
    list.forEach(function (s) { b.extend([s.lon, s.lat]); });
    var c = ctx(); if (c.b && state.area === "附近") b.extend([c.b.lon, c.b.lat]);
    var side = window.innerWidth > 900 ? 60 : 40;
    map.fitBounds(b, { padding: { top: side + 36, bottom: side + 30, left: side + 20, right: side + 20 }, maxZoom: 14, duration: 700 });
  }
  function syncPins(list) {
    var c = ctx(), vis = {}; list.forEach(function (s) { vis[s.id] = true; });
    SPOTS.forEach(function (s) {
      var el = markers[s.id] && markers[s.id].getElement(); if (!el) return;
      var today = isToday(s, c);
      el.classList.toggle("hidden", !vis[s.id]);
      el.classList.toggle("planned", today);
      el.classList.toggle("closed", isClosed(s, c));
      el.classList.toggle("active", state.active === s.id);
      el.classList.toggle("labeled", list.length <= 16 || today || s.status === "plan" || state.active === s.id);
      el.style.zIndex = today || state.active === s.id ? 5 : (s.status === "plan" ? 4 : s.status === "check" ? 1 : 2);
    });
    if (map && map.getLayer("routes-today")) map.setFilter("routes-today", ["==", ["get", "date"], state.day || ""]);
  }
  function focusSpot(id, fly) {
    state.active = id; history.replaceState(null, "", location.search + "#" + id);
    var s = SPOTS.filter(function (x) { return x.id === id; })[0]; if (!s) return;
    var c = ctx(), st = STATUS[s.status];
    document.querySelectorAll(".fm-list .fp").forEach(function (li) { li.classList.toggle("active", li.dataset.fid === id); });
    syncPins(visible());
    if (!map) return;
    if (fly) map.flyTo({ center: [s.lon, s.lat], zoom: Math.max(map.getZoom(), 13), duration: 800 });
    showPhotoPin(id, false);
    var g = s.g;
    popup.setLngLat([s.lon, s.lat]).setHTML('<b>' + esc(s.name) + '</b><span>' + esc(s.kind) + ' · ' + esc(s.area) + (g && g.rating ? ' · ★ ' + g.rating.toFixed(1) : "") + '</span>' +
      '<em class="' + (s.status === "plan" ? "gold" : "blue") + '">' + st[0] + (s.day ? " " + md(s.day) : "") + '</em>' +
      '<small>' + em(txt(s.what, s, c).replace(/\*\*/g, "")).slice(0, 70) + (s.what.length > 70 ? "…" : "") + '</small>' +
      (s.photoAt ? '<small class="cam">📷 拍攝點：' + esc(s.photoName) + '（地圖上的相機）</small>' : "") +
      (s.status !== "plan" ? '<a href="' + addUrl(s, c) + '">加入行程 ＋</a>' : "")).addTo(map);
  }
  function scrollToCard(id) { var li = document.getElementById(id); if (!li) return; li.scrollIntoView({ behavior: "smooth", block: window.innerWidth > 900 ? "center" : "start" }); }

  function render(refit) {
    if (baseMarkers.length) Plan.setActiveBase(baseMarkers, (ctx().b || {}).id);
    var c = ctx(), list = visible();
    renderTools();
    $("#fmlist").innerHTML = list.map(function (s) { return card(s, c); }).join("") || '<li class="fm-empty">這個組合沒有景點。把狀態或類型放寬一點。</li>';
    var n = { plan: 0, saved: 0, check: 0 }; list.forEach(function (s) { n[s.status]++; });
    $("#fmcount").textContent = list.length + " 個景點 · 正式行程 " + n.plan + " · 收藏 " + n.saved + " · 待確認 " + n.check + (c.d ? "（" + md(c.d.date) + " " + dow(c.d.date) + "）" : "");
    if (mapReady) { syncPins(list); if (refit) fitTo(list); }
  }

  render(false); initMap();
  if (state.active) setTimeout(function () { scrollToCard(state.active); }, 300);
})();

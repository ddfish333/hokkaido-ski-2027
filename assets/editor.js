/* 行程編輯器：改 plan.json（站點、停留、固定時間、順序），存回 GitHub。 */
(function () {
  "use strict";
  var T = window.TRIP, P = window.Plan; if (!T || !P) return;
  var REPO = "ddfish333/hokkaido-ski-2027", API = "https://api.github.com/repos/" + REPO + "/contents/";
  var $ = function (s) { return document.querySelector(s); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmtMin(m) { m = Math.round(m); if (m < 60) return m + " 分"; var h = Math.floor(m / 60), r = m % 60; return h + "h" + (r < 10 ? "0" : "") + r; }
  function md(s) { var p = s.split("-"); return (+p[1]) + "/" + (+p[2]); }
  var DOW = ["日", "一", "二", "三", "四", "五", "六"];
  function dow(s) { var p = s.split("-").map(Number); return DOW[new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay()]; }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function msg(t, bad) { var m = $("#msg"); m.textContent = t || ""; m.classList.toggle("bad", !!bad); }

  var state = { date: null, mode: P.mode(), base: null, baseLegs: null, sha: {}, legsDirty: false, map: null, mapReady: false, drag: null };
  var dates = T.days.map(function (d) { return d.date; });

  /* ---------- 載入 ---------- */
  function fetchSha(path) {
    return fetch(API + path + "?ref=main", { headers: authHeaders(), cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { return j && j.sha; }).catch(function () { return null; });
  }
  function load() {
    return P.ready.then(function () {
      state.base = clone(P.plan); state.baseLegs = P.legs;
      return Promise.all([fetchSha("data/plan.json"), fetchSha("data/legs.json")]);
    }).then(function (sh) {
      state.sha = { plan: sh[0], legs: sh[1] };
      var draft = store("snow13-draft");
      if (draft && draft.plan && draft.sha === state.sha.plan && JSON.stringify(draft.plan) !== JSON.stringify(state.base)) {
        P.plan = draft.plan; if (draft.legs) Object.keys(draft.legs).forEach(function (k) { P.legs[k] = draft.legs[k]; state.legsDirty = true; });
        msg("已還原這個瀏覽器裡未儲存的草稿。");
      } else if (draft && draft.sha !== state.sha.plan) { store("snow13-draft", null); if (draft.plan) msg("網站上的行程已經被別人更新，你之前的草稿已捨棄。"); }
      state.date = location.hash.replace("#", "") || todayOrFirst();
      if (dates.indexOf(state.date) < 0) state.date = dates[0];
      renderAll();
    });
  }
  function todayOrFirst() { var t = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); return dates.indexOf(t) >= 0 ? t : dates[0]; }

  /* ---------- 草稿與 dirty ---------- */
  function isDirty() { return JSON.stringify(P.plan) !== JSON.stringify(state.base) || state.legsDirty; }
  function touched() {
    var newLegs = {}; Object.keys(P.legs).forEach(function (k) { if (!state.baseLegs[k]) newLegs[k] = P.legs[k]; });
    store("snow13-draft", { sha: state.sha.plan, plan: P.plan, legs: newLegs });
    $("#dirty").hidden = !isDirty();
    renderAll();
  }
  window.addEventListener("beforeunload", function (e) { if (isDirty()) { e.preventDefault(); e.returnValue = ""; } });

  /* ---------- 畫面 ---------- */
  function day() { return P.plan.days[state.date]; }
  function renderAll() { renderTabs(); renderHead(); renderStops(); renderMap(); $("#dirty").hidden = !isDirty(); }
  function renderTabs() {
    var s = $("#daytabs");
    s.innerHTML = T.days.map(function (d) {
      var sch = P.schedule(d.date, state.mode), lates = sch.stops.filter(function (x) { return x.late; }).length;
      var changed = JSON.stringify(P.plan.days[d.date]) !== JSON.stringify(state.base.days[d.date]);
      return '<button type="button" role="tab" class="dchip" aria-selected="' + (d.date === state.date) + '" data-d="' + d.date + '"><span class="d">' + md(d.date) + (changed ? '<i class="dot-dirty"></i>' : "") + '</span><span class="w">週' + dow(d.date) + (lates ? ' · <em>' + lates + ' 晚</em>' : "") + '</span><span class="b">' + esc(d.title) + '</span></button>';
    }).join("");
    s.onclick = function (e) { var b = e.target.closest("[data-d]"); if (!b) return; state.date = b.dataset.d; location.hash = state.date; renderAll(); };
  }
  function renderHead() {
    var d = T.days.filter(function (x) { return x.date === state.date; })[0];
    $("#edk").textContent = "DAY " + (dates.indexOf(state.date) + 1) + " · " + md(d.date) + "（" + dow(d.date) + "）";
    $("#edh").textContent = d.title;
    $("#modeseg").innerHTML = [["normal", "一般路況"], ["snow", "下雪路況"]].map(function (m) { return '<button type="button" role="tab" aria-selected="' + (state.mode === m[0]) + '" data-mode="' + m[0] + '">' + m[1] + '</button>'; }).join("");
    $("#modeseg").onclick = function (e) { var b = e.target.closest("[data-mode]"); if (!b) return; state.mode = P.mode(b.dataset.mode); renderAll(); };
    var sch = P.schedule(state.date, state.mode), alt = P.schedule(state.date, state.mode === "snow" ? "normal" : "snow");
    var lates = sch.stops.filter(function (x) { return x.late; });
    $("#summary").innerHTML = '<div><span>開車</span><b>' + fmtMin(sch.total.min) + '</b><small>' + (state.mode === "snow" ? "一般 " : "下雪 ") + fmtMin(alt.total.min) + '</small></div>' +
      '<div><span>距離</span><b>' + sch.total.km + ' km</b></div>' +
      (sch.end != null ? '<div><span>最後到達</span><b>' + P.hm(sch.end) + '</b></div>' : "") +
      '<div><span>固定時間</span><b class="' + (lates.length ? "bad" : "ok") + '">' + (lates.length ? lates.length + " 個會晚到" : "都趕得上") + '</b></div>';
  }
  function placeOptions() { return Object.keys(P.plan.places).map(function (id) { return '<option value="' + esc(P.plan.places[id].name) + '">'; }).join(""); }
  function renderStops() {
    var sch = P.schedule(state.date, state.mode), stops = day().stops, box = $("#stoplist");
    box.innerHTML = sch.stops.map(function (s, i) {
      var raw = stops[i], last = i === sch.stops.length - 1, html = "";
      if (i > 0) {
        var l = sch.legs[i - 1];
        html += '<li class="leg"><span class="legline"></span><span class="legtxt">' + (l.mode === "walk" ? "步行" : l.mode === "shuttle" ? "接駁" : "開車") + ' ' + fmtMin(l.min) + ' · ' + l.km + ' km' + (l.est ? ' <em>直線估算，儲存前會查路網</em>' : "") + '</span>' +
          '<select class="via" data-i="' + i + '" aria-label="到達方式"><option value="drive"' + (s.via === "drive" ? " selected" : "") + '>開車</option><option value="walk"' + (s.via === "walk" ? " selected" : "") + '>步行</option><option value="shuttle"' + (s.via === "shuttle" ? " selected" : "") + '>接駁</option></select></li>';
      }
      html += '<li class="stopcard' + (s.late ? " is-late" : "") + '" data-i="' + i + '">' +
        '<button type="button" class="handle" aria-label="拖拉改順序" data-i="' + i + '">⋮⋮</button>' +
        '<div class="sc-body">' +
          '<div class="sc-top"><span class="sc-time">' + s.time + (last || !s.stay ? "" : ' <small>– ' + s.timeDep + '</small>') + '</span><span class="sc-name">' + esc(s.name) + '</span>' + (last || !s.stay ? "" : '<span class="stay">停 ' + fmtMin(s.stay) + '</span>') +
            (s.late ? '<span class="late">晚 ' + s.late + ' 分</span>' : s.wait ? '<span class="wait">早到，等 ' + s.wait + ' 分</span>' : "") +
            '<span class="sc-menu"><select data-move="' + i + '" aria-label="搬到別天"><option value="">⋯</option>' + dates.filter(function (x) { return x !== state.date; }).map(function (x) { return '<option value="' + x + '">搬到 ' + md(x) + '</option>'; }).join("") + '<option value="__del">刪除這站</option></select></span></div>' +
          (last ? '<p class="sc-hint">最後一站：到了就結束，不算停留。</p>' :
          '<div class="sc-row"><span class="lbl">停留</span><button type="button" class="step" data-stay="-15" data-i="' + i + '">−15</button><input type="number" class="stayin" data-i="' + i + '" value="' + s.stay + '" min="0" step="5" inputmode="numeric"><button type="button" class="step" data-stay="15" data-i="' + i + '">＋15</button><span class="unit">分</span></div>') +
          '<div class="sc-row sc-fixed"><span class="lbl">' + (i === 0 ? "出發" : "固定") + '</span>' +
            '<label>' + (i === 0 ? "時間" : "開始") + ' <input type="time" data-at="' + i + '" value="' + esc(s.at) + '"></label>' +
            (i === 0 ? "" : '<label>最晚到 <input type="time" data-by="' + i + '" value="' + esc(s.by) + '"></label>') + '</div>' +
          '<div class="sc-row"><span class="lbl">備註</span><input type="text" class="notein" data-i="' + i + '" value="' + esc(raw.note || "") + '" placeholder="要做什麼、提醒"></div>' +
        '</div></li>';
      return html;
    }).join("");
    $("#placelist").innerHTML = placeOptions();
  }

  /* ---------- 互動 ---------- */
  $("#stoplist").addEventListener("click", function (e) {
    var b = e.target.closest(".step"); if (!b) return;
    var st = day().stops[+b.dataset.i]; st.stay = Math.max(0, (+st.stay || 0) + (+b.dataset.stay)); touched();
  });
  $("#stoplist").addEventListener("change", function (e) {
    var t = e.target, stops = day().stops;
    if (t.classList.contains("stayin")) { stops[+t.dataset.i].stay = Math.max(0, Math.round(+t.value || 0)); touched(); }
    else if (t.dataset.at != null) { var s = stops[+t.dataset.at]; if (t.value) s.at = t.value; else delete s.at; touched(); }
    else if (t.dataset.by != null) { var s2 = stops[+t.dataset.by]; if (t.value) s2.by = t.value; else delete s2.by; touched(); }
    else if (t.classList.contains("via")) { var s3 = stops[+t.dataset.i]; if (t.value === "drive") delete s3.via; else s3.via = t.value; ensureLeg(stops[+t.dataset.i - 1].id, s3.id, s3.via).then(touched); touched(); }
    else if (t.classList.contains("notein")) { stops[+t.dataset.i].note = t.value.trim(); touched(); }
    else if (t.dataset.move != null) {
      var i = +t.dataset.move, v = t.value; t.value = "";
      if (v === "__del") { if (confirm("刪除「" + P.plan.places[stops[i].id].name + "」這一站？")) { stops.splice(i, 1); afterReorder(); } }
      else if (v) { var mv = stops.splice(i, 1)[0]; delete mv.at; P.plan.days[v].stops.push(mv); afterReorder(); msg("已搬到 " + md(v) + " 的最後一站。"); }
    }
  });
  function afterReorder() { var stops = day().stops; touched(); fillLegs(stops).then(function (n) { if (n) touched(); }); }
  function fillLegs(stops) {
    var jobs = [];
    for (var i = 1; i < stops.length; i++) jobs.push(ensureLeg(stops[i - 1].id, stops[i].id, stops[i].via));
    return Promise.all(jobs).then(function (r) { return r.filter(Boolean).length; });
  }
  /* 沒有快取的路段：打 OSRM 查真的路網 */
  function ensureLeg(a, b, via) {
    var key = P.legKey(a, b, via); if (P.legs[key] || a === b) return Promise.resolve(false);
    var pa = P.plan.places[a], pb = P.plan.places[b];
    if (via === "shuttle") { P.legs[key] = { km: Math.round(P.hav(pa, pb) * 13) / 10, normal: 10, snow: 10, mode: "shuttle", geom: [[pa.lon, pa.lat], [pb.lon, pb.lat]] }; state.legsDirty = true; return Promise.resolve(true); }
    var prof = via === "walk" ? "foot" : "driving";
    return fetch("https://router.project-osrm.org/route/v1/" + prof + "/" + pa.lon + "," + pa.lat + ";" + pb.lon + "," + pb.lat + "?overview=full&geometries=geojson")
      .then(function (r) { return r.json(); }).then(function (j) {
        if (j.code !== "Ok") throw new Error("route");
        var rt = j.routes[0], m = rt.duration / 60, coords = rt.geometry.coordinates.map(function (c) { return [Math.round(c[0] * 1e5) / 1e5, Math.round(c[1] * 1e5) / 1e5]; });
        P.legs[key] = via === "walk" ? { km: Math.round(rt.distance / 100) / 10, normal: P.r5(m), snow: P.r5(m * 1.2), mode: "walk", geom: coords }
          : { km: Math.round(rt.distance / 100) / 10, normal: P.r5(m * 1.15), snow: P.r5(m * 1.5), mode: "drive", geom: coords };
        state.legsDirty = true; return true;
      }).catch(function () { msg("路網服務暫時連不上，這段先用直線估算，之後再試。", true); return false; });
  }

  /* 拖拉排序（滑鼠與觸控都用 pointer events） */
  $("#stoplist").addEventListener("pointerdown", function (e) {
    var h = e.target.closest(".handle"); if (!h) return;
    e.preventDefault(); h.setPointerCapture(e.pointerId);
    state.drag = { from: +h.dataset.i, to: +h.dataset.i };
    $("#stoplist").classList.add("dragging"); h.closest(".stopcard").classList.add("drag-src");
  });
  $("#stoplist").addEventListener("pointermove", function (e) {
    if (!state.drag) return;
    var cards = Array.prototype.slice.call(document.querySelectorAll(".stopcard")), over = null;
    cards.forEach(function (c) { var r = c.getBoundingClientRect(); if (e.clientY >= r.top && e.clientY <= r.bottom) over = c; c.classList.remove("drag-over"); });
    if (over) { over.classList.add("drag-over"); state.drag.to = +over.dataset.i; }
  });
  function endDrag() {
    if (!state.drag) return;
    var d = state.drag; state.drag = null; $("#stoplist").classList.remove("dragging");
    document.querySelectorAll(".drag-over,.drag-src").forEach(function (c) { c.classList.remove("drag-over", "drag-src"); });
    if (d.from === d.to) return;
    var stops = day().stops, mv = stops.splice(d.from, 1)[0]; stops.splice(d.to, 0, mv);
    /* 第一站的出發時間跟著位置走 */
    stops.forEach(function (s, i) { if (i === 0 && !s.at) s.at = "08:00"; });
    afterReorder();
  }
  $("#stoplist").addEventListener("pointerup", endDrag); $("#stoplist").addEventListener("pointercancel", endDrag);

  /* 新增站點：既有地點名稱，或 Google Maps 連結，或用名稱查座標 */
  $("#addbtn").addEventListener("click", addStop);
  $("#addq").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); addStop(); } });
  function addStop() {
    var q = $("#addq").value.trim(); if (!q) return;
    var id = Object.keys(P.plan.places).filter(function (k) { return P.plan.places[k].name === q; })[0];
    var p = Promise.resolve(id);
    if (!id) {
      var m = q.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || q.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) || q.match(/[?&](?:q|query|destination)=(-?\d+\.\d+),(-?\d+\.\d+)/) || q.match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/);
      if (m) { var nm = prompt("這個地點叫什麼？"); if (!nm) return; p = Promise.resolve(newPlace(nm, +m[1], +m[2])); }
      else if (/^https?:/.test(q)) { msg("這種 Google Maps 短網址看不到座標。請在 Google Maps 打開地點，網址列會出現 @緯度,經度，整段貼過來。", true); return; }
      else p = fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=jp&q=" + encodeURIComponent(q), { headers: { "Accept-Language": "zh-TW,ja" } })
        .then(function (r) { return r.json(); }).then(function (j) { if (!j.length) { msg("找不到「" + q + "」，請貼 Google Maps 連結。", true); return null; } if (!confirm("找到：" + j[0].display_name + "\n是這裡嗎？")) return null; return newPlace(q, +j[0].lat, +j[0].lon); });
    }
    p.then(function (pid) {
      if (!pid) return; var stops = day().stops;
      stops.push({ id: pid, stay: 60, note: "" }); $("#addq").value = ""; afterReorder();
    });
  }
  function newPlace(name, lat, lon) { var id = "p" + Date.now().toString(36); P.plan.places[id] = { name: name, lat: lat, lon: lon }; return id; }

  /* ---------- 地圖 ---------- */
  function renderMap() {
    if (!window.maplibregl) return;
    if (!state.map) {
      state.map = new maplibregl.Map({ container: "mapcanvas", style: "https://tiles.openfreemap.org/styles/dark", center: [141.75, 43.28], zoom: 7, cooperativeGestures: true, attributionControl: { compact: true } });
      state.map.on("load", function () {
        state.map.addSource("route", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        state.map.addLayer({ id: "route-casing", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#0F1520", "line-width": 8 } });
        state.map.addLayer({ id: "route-line", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#FF5A4C", "line-width": 4, "line-dasharray": ["case", ["==", ["get", "mode"], "walk"], ["literal", [1, 2]], ["literal", [1, 0]]] } });
        state.map.addSource("stops", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        state.map.addLayer({ id: "stop-dot", type: "circle", source: "stops", paint: { "circle-color": ["case", ["get", "late"], "#FF5A4C", "#EDEAE2"], "circle-radius": 12, "circle-stroke-width": 2, "circle-stroke-color": "#0F1520" } });
        state.map.addLayer({ id: "stop-num", type: "symbol", source: "stops", layout: { "text-field": ["get", "n"], "text-font": ["Noto Sans Bold"], "text-size": 11, "text-allow-overlap": true }, paint: { "text-color": "#0F1520" } });
        state.map.addLayer({ id: "stop-label", type: "symbol", source: "stops", layout: { "text-field": ["get", "label"], "text-font": ["Noto Sans Regular"], "text-size": 12, "text-variable-anchor": ["left", "right", "top", "bottom"], "text-radial-offset": 1.3, "text-justify": "auto" }, paint: { "text-color": "#EDEAE2", "text-halo-color": "#070B12", "text-halo-width": 1.6 } });
        state.mapReady = true; renderMap();
      });
      return;
    }
    if (!state.mapReady) return;
    var sch = P.schedule(state.date, state.mode);
    state.map.getSource("route").setData({ type: "FeatureCollection", features: sch.legs.filter(function (l) { return l.geom; }).map(function (l) { return { type: "Feature", properties: { mode: l.mode === "walk" ? "walk" : "drive" }, geometry: { type: "LineString", coordinates: l.geom } }; }) });
    state.map.getSource("stops").setData({ type: "FeatureCollection", features: sch.stops.map(function (s) { return { type: "Feature", properties: { n: String(s.i + 1), label: s.name + " " + s.time, late: !!s.late }, geometry: { type: "Point", coordinates: [s.lon, s.lat] } }; }) });
    var pts = []; sch.stops.forEach(function (s) { pts.push([s.lon, s.lat]); }); sch.legs.forEach(function (l) { (l.geom || []).forEach(function (c) { pts.push(c); }); });
    if (pts.length) { var b = new maplibregl.LngLatBounds(pts[0], pts[0]); pts.forEach(function (c) { b.extend(c); }); state.map.fitBounds(b, { padding: 60, maxZoom: 13, duration: 500 }); }
  }

  /* ---------- 設定與儲存 ---------- */
  function authHeaders() { var t = store("snow13-gh-token"); var h = { Accept: "application/vnd.github+json" }; if (t) h.Authorization = "Bearer " + t; return h; }
  $("#settings").addEventListener("click", function () { $("#token").value = store("snow13-gh-token") || ""; $("#who").value = store("snow13-who") || ""; $("#tokmsg").textContent = ""; $("#dlg").showModal(); });
  $("#toksave").addEventListener("click", function () { store("snow13-gh-token", $("#token").value.trim() || null); store("snow13-who", $("#who").value.trim() || null); });
  $("#tokclear").addEventListener("click", function () { $("#token").value = ""; store("snow13-gh-token", null); $("#tokmsg").textContent = "已清除。"; });
  $("#toktest").addEventListener("click", function () {
    var t = $("#token").value.trim(); if (!t) { $("#tokmsg").textContent = "先貼金鑰。"; return; }
    $("#tokmsg").textContent = "測試中…";
    fetch("https://api.github.com/repos/" + REPO, { headers: { Authorization: "Bearer " + t, Accept: "application/vnd.github+json" } }).then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (j) { $("#tokmsg").textContent = j.permissions && j.permissions.push ? "可以：這把金鑰能寫入 " + j.full_name + "。" : "金鑰有效，但沒有寫入權限（Contents 要選 Read and write）。"; })
      .catch(function (st) { $("#tokmsg").textContent = st === 401 ? "金鑰無效或過期。" : st === 404 ? "金鑰看不到這個 repo（Repository access 要選 hokkaido-ski-2027）。" : "測試失敗（" + st + "）。"; });
  });
  function b64(str) { return btoa(unescape(encodeURIComponent(str))); }
  function changedDays() { return dates.filter(function (d) { return JSON.stringify(P.plan.days[d]) !== JSON.stringify(state.base.days[d]); }); }
  function putFile(path, content, sha, message) {
    return fetch(API + path, { method: "PUT", headers: Object.assign({ "Content-Type": "application/json" }, authHeaders()), body: JSON.stringify({ message: message, content: b64(content), sha: sha || undefined, branch: "main" }) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.message || r.status); return j.content.sha; }); });
  }
  $("#save").addEventListener("click", function () {
    if (!isDirty()) { msg("沒有變更。"); return; }
    if (!store("snow13-gh-token")) { msg("還沒有設定金鑰，先按「設定」。", true); $("#dlg").showModal(); return; }
    var btn = $("#save"); btn.disabled = true; msg("檢查中…");
    var stopsAll = []; dates.forEach(function (d) { stopsAll.push(P.plan.days[d].stops); });
    Promise.all(stopsAll.map(fillLegs)).then(function () { return fetchSha("data/plan.json"); }).then(function (remote) {
      if (remote && state.sha.plan && remote !== state.sha.plan && !confirm("網站上的行程在你載入之後被別人改過。要用你的版本覆蓋嗎？\n（按取消可以先重新載入看看別人改了什麼）")) throw new Error("cancel");
      var who = store("snow13-who") || "家人", days = changedDays().map(md).join("、");
      var m = "行程更新（" + who + "）：" + (days || "路段資料");
      P.plan.updated = new Date().toISOString().slice(0, 10);
      msg("儲存中…");
      return putFile("data/plan.json", JSON.stringify(P.plan, null, 1), remote || state.sha.plan, m).then(function (sha) {
        state.sha.plan = sha;
        if (!state.legsDirty) return;
        return fetchSha("data/legs.json").then(function (ls) { return putFile("data/legs.json", JSON.stringify(P.legs), ls, m + "（路段）"); }).then(function (sha2) { state.sha.legs = sha2; state.legsDirty = false; });
      });
    }).then(function () {
      state.base = clone(P.plan); state.baseLegs = clone(P.legs); store("snow13-draft", null);
      msg("已儲存。網站大約一分鐘後更新；GitHub 會自動跑一致性檢查。"); renderAll();
    }).catch(function (e) { if (e.message !== "cancel") msg("儲存失敗：" + e.message, true); else msg(""); }).then(function () { btn.disabled = false; });
  });
  $("#reload").addEventListener("click", function () {
    if (isDirty() && !confirm("會丟掉未儲存的變更，確定重新載入？")) return;
    store("snow13-draft", null); location.reload();
  });

  load().catch(function (e) { msg("載入失敗：" + e.message, true); });
})();

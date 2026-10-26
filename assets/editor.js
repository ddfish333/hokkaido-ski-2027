/* 行程編輯器：改 plan.json（站點、停留、固定時間、順序），存回 GitHub。 */
(function () {
  "use strict";
  var T = window.TRIP, P = window.Plan; if (!T || !P) return;
  var REPO = P.REPO, GH = P.API;
  var $ = function (s) { return document.querySelector(s); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmtMin(m) { m = Math.round(m); if (m < 60) return m + " 分"; var h = Math.floor(m / 60), r = m % 60; return h + "h" + (r < 10 ? "0" : "") + r; }
  function md(s) { var p = s.split("-"); return (+p[1]) + "/" + (+p[2]); }
  var DOW = ["日", "一", "二", "三", "四", "五", "六"];
  function dow(s) { var p = s.split("-").map(Number); return DOW[new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay()]; }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  /* ---------- 狀態提示：固定在畫面底部，捲到哪裡都看得到（以前寫在頁面最上面，捲下去改東西時按儲存就像沒反應） ---------- */
  var toastT = null;
  function toast(text, kind, actions) {
    var t = $("#toast"); clearTimeout(toastT);
    if (!text) { t.hidden = true; return; }
    t.className = "toast " + (kind || "info"); t.hidden = false;
    t.innerHTML = (kind === "busy" ? '<i class="spin" aria-hidden="true"></i>' : kind === "ok" ? '<b class="tk">✓</b>' : "") + '<span class="tt">' + esc(text) + '</span>' +
      (actions || []).map(function (a, i) { return typeof a[1] === "string" ? '<a class="ta" href="' + esc(a[1]) + '">' + esc(a[0]) + '</a>' : '<button type="button" class="ta" data-a="' + i + '">' + esc(a[0]) + '</button>'; }).join("") +
      (kind === "busy" ? "" : '<button type="button" class="tx" aria-label="關閉">×</button>');
    t.onclick = function (e) { var b = e.target.closest("[data-a]"); if (b) { actions[+b.dataset.a][1](); return; } if (e.target.closest(".tx")) t.hidden = true; };
    if (kind === "ok" || kind === "info") toastT = setTimeout(function () { t.hidden = true; }, kind === "ok" ? 9000 : 7000);
  }
  function msg(t, bad) { toast(t, bad ? "bad" : "info"); }
  /* 儲存鍵本身也要看得出狀態：未儲存幾天／儲存中／已儲存 ✓／失敗再試 */
  var btnState = "clean", btnT = null, legFails = 0;
  function setBtn(st) {
    var b = $("#save"), n = changedDays().length + (state.legsDirty && !changedDays().length ? 1 : 0);
    if (st == null) { if (btnState === "saving" || btnState === "saved") return; st = isDirty() ? "dirty" : (btnState === "error" ? "error" : "clean"); }
    btnState = st; clearTimeout(btnT);
    b.className = "btn save-btn is-" + st; b.disabled = st === "saving" || st === "clean" || st === "saved";
    b.innerHTML = st === "saving" ? '<i class="spin" aria-hidden="true"></i>儲存中…' : st === "saved" ? "已儲存 ✓" : st === "error" ? "再試一次" : st === "dirty" ? "儲存" + (n > 1 ? "（" + n + " 天）" : "") : "已儲存";
    if (st === "saved") btnT = setTimeout(function () { btnState = "clean"; setBtn(); }, 3000);
    var d = $("#dirty"); d.hidden = !isDirty(); d.textContent = "未儲存" + (n ? " · " + n + " 天" : "");
  }

  var state = { date: null, mode: P.mode(), base: null, baseLegs: null, planSha: null, legsDirty: false, map: null, mapReady: false, drag: null, seenSha: null };
  var dates = T.days.map(function (d) { return d.date; });

  /* ---------- 載入 ----------
     內容和它的版本號（sha）一次從 GitHub 拿：以前內容讀網站上的檔案、版本號讀 GitHub，
     別人剛存完的一分鐘內打開，會拿到「舊內容＋新版本號」，存下去就把別人的修改蓋掉。 */
  function gh(method, path, body) {
    var h = { Accept: "application/vnd.github+json" }, t = P.token(); if (t) h.Authorization = "Bearer " + t; if (body) h["Content-Type"] = "application/json";
    return fetch(GH + path, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined, cache: method === "GET" ? "no-cache" : "no-store" }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.message || ("GitHub " + r.status)); e.status = r.status; throw e; } return j; });
    });
  }
  function dec(b) { return decodeURIComponent(escape(atob(String(b).replace(/\s/g, "")))); }
  function readPlan(ref) { return gh("GET", "/contents/data/plan.json?ref=" + (ref || "main")).then(function (j) { return { sha: j.sha, plan: JSON.parse(dec(j.content)) }; }); }
  function adopt(rp) { P.plan = rp.plan; P.clearCache(); state.base = clone(rp.plan); state.planSha = rp.sha; state.seenSha = rp.sha; }
  /* 新的站點可能用到這支手機還沒有的路段：補讀 legs.json */
  function syncLegs(plan) {
    var miss = false; Object.keys(plan.days).forEach(function (d) { var st = plan.days[d].stops; for (var i = 1; i < st.length; i++) if (!P.legs[P.legKey(st[i - 1].id, st[i].id, st[i].via)] && st[i - 1].id !== st[i].id) miss = true; });
    if (!miss) return Promise.resolve();
    return P.ghRaw("data/legs.json").then(function (l) { Object.keys(l).forEach(function (k) { if (!P.legs[k]) P.legs[k] = l[k]; }); state.baseLegs = clone(P.legs); P.clearCache(); }).catch(function () { });
  }
  function load() {
    return P.ready.then(function () {
      return readPlan().then(function (rp) { var same = JSON.stringify(rp.plan) === JSON.stringify(P.plan); adopt(rp); return same ? null : syncLegs(rp.plan); }, function () {
        state.base = clone(P.plan);   /* GitHub 讀不到（沒網路或沒金鑰被限流）：先用網站上的版本，儲存時會再對一次 */
      });
    }).then(function () {
      state.baseLegs = clone(P.legs);
      var draft = store("snow13-draft");
      if (draft && draft.plan) {
        if (draft.sha === state.planSha) { P.plan = draft.plan; msg("已還原這支手機上還沒儲存的修改。"); }
        else if (draft.base) {
          /* 草稿之後別人存過：把你改的那幾天套到最新版上；同一天兩人都改了，留別人的版本並告訴你 */
          var m = merge3(draft.base, draft.plan, P.plan); P.plan = m.plan;
          msg(m.conflicts.length ? "你上次沒存的修改已套到最新版；但 " + m.conflicts.map(md).join("、") + " 別人也改了，這幾天先用別人的版本。" : "你上次沒存的修改已套到最新版，記得按儲存。", !!m.conflicts.length);
        } else { store("snow13-draft", null); msg("網站上的行程已經被別人更新，你之前的草稿已捨棄。", true); }
        if (draft.legs) Object.keys(draft.legs).forEach(function (k) { if (!P.legs[k]) { P.legs[k] = draft.legs[k]; state.legsDirty = true; } });
        P.clearCache();
      }
      state.date = location.hash.replace("#", "") || todayOrFirst();
      if (dates.indexOf(state.date) < 0) state.date = dates[0];
      renderAll(); renderStamp();
      if (P.tokenBad) toast("這支手機的金鑰失效了（過期或被刪掉），現在不能儲存。", "bad", [["設定", openSettings]]);
      /* 從景點地圖「加入行程」帶過來：?add=<景點 id>，加到目前這一天的最後 */
      var addId = new URLSearchParams(location.search).get("add"), sp = addId && (window.SPOTS || []).filter(function (x) { return x.id === addId; })[0];
      if (sp) {
        var pid = Object.keys(P.plan.places).filter(function (k) { return P.plan.places[k].name === sp.name || (sp.stop && k === sp.stop); })[0] || newPlace(sp.name, sp.lat, sp.lon);
        day().stops.push({ id: pid, stay: sp.time || 60, note: "從景點收藏加入" + (sp.caution ? "；" + sp.caution.slice(0, 40) : "") });
        history.replaceState(null, "", location.pathname + location.hash);
        afterReorder(); renderAll(); msg("已把「" + sp.name + "」加到 " + state.date.slice(5).replace("-", "/") + " 最後一站（停留 " + (sp.time || 60) + " 分）。拖到想去的順序，確認時間後按「儲存」。");
      }
      setInterval(poll, 60000);
      document.addEventListener("visibilitychange", function () { if (!document.hidden) poll(); });
    });
  }
  /* 三方合併（以「天」為單位）：base＝我開始改之前的版本，mine＝我的，theirs＝網站上最新的。
     只有我改的天 → 用我的；只有別人改的天 → 用別人的；兩邊都改而且不一樣 → 列為衝突，由人決定。地點清單取聯集。 */
  function J(o) { return JSON.stringify(o === undefined ? null : o); }
  function merge3(base, mine, theirs) {
    var out = clone(theirs), conflicts = [];
    Object.keys(mine.places).forEach(function (id) { if (!theirs.places[id] || J(mine.places[id]) !== J(base.places[id])) out.places[id] = mine.places[id]; });
    Object.keys(mine.days).forEach(function (d) {
      var b = J(base.days[d]), m = J(mine.days[d]), t = J(theirs.days[d]);
      if (m === b || m === t) return;
      if (t === b) out.days[d] = clone(mine.days[d]); else conflicts.push(d);
    });
    return { plan: out, conflicts: conflicts };
  }
  /* 編輯中每分鐘（和切回這個分頁時）看一下別人有沒有存：沒在改就直接換成最新版；正在改就提醒，儲存時自動合併 */
  function poll() {
    if (!P.token() || document.hidden || btnState === "saving") return;
    readPlan().then(function (rp) {
      if (rp.sha === state.planSha || rp.sha === state.seenSha) return;
      var by = rp.plan.savedBy || "家人", days = dates.filter(function (d) { return J(rp.plan.days[d]) !== J(state.base.days[d]); }).map(md).join("、") || "地點資料";
      if (!isDirty()) { adopt(rp); syncLegs(rp.plan).then(function () { state.baseLegs = clone(P.legs); renderAll(); renderStamp(); }); toast(by + " 剛更新了 " + days + "，畫面已換成最新版。", "info"); }
      else { state.seenSha = rp.sha; toast(by + " 剛存了 " + days + "。你照常改，按儲存時會自動合併；同一天兩人都改才會問你。", "info"); }
    }).catch(function () { });
  }
  function renderStamp() {
    var e = $("#stamp"); if (!e) return; var p = state.base || P.plan;
    if (!p.savedAt) { e.textContent = ""; return; }
    var t = new Date(p.savedAt), now = new Date(), same = t.toDateString() === now.toDateString();
    e.textContent = "網站上的版本：" + (p.savedBy || "家人") + " " + (same ? "今天 " : (t.getMonth() + 1) + "/" + t.getDate() + " ") + ("0" + t.getHours()).slice(-2) + ":" + ("0" + t.getMinutes()).slice(-2) + " 儲存";
  }
  function todayOrFirst() { var t = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); return dates.indexOf(t) >= 0 ? t : dates[0]; }

  /* ---------- 草稿與 dirty ---------- */
  function isDirty() { return JSON.stringify(P.plan) !== JSON.stringify(state.base) || state.legsDirty; }
  function touched() {
    var newLegs = {}; Object.keys(P.legs).forEach(function (k) { if (!state.baseLegs[k]) newLegs[k] = P.legs[k]; });
    store("snow13-draft", isDirty() ? { sha: state.planSha, base: state.base, plan: P.plan, legs: newLegs } : null);
    renderAll();
  }
  window.addEventListener("beforeunload", function (e) { if (isDirty()) { e.preventDefault(); e.returnValue = ""; } });

  /* ---------- 畫面 ---------- */
  function day() { return P.plan.days[state.date]; }
  function renderAll() { renderTabs(); renderHead(); renderStops(); renderMap(); setBtn(); }
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
    var back = $("#edback"); if (back) { back.href = "../day/" + d.date.slice(5).replace("-", "") + "/"; back.querySelector("span").textContent = "看 " + md(d.date) + " 的頁面"; }
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
        html += '<li class="leg"><span class="legline"></span><span class="legtxt">' + (l.mode === "walk" ? "步行" : l.mode === "shuttle" ? "接駁" : l.mode === "taxi" ? "計程車／地鐵" : "開車") + ' ' + fmtMin(l.min) + ' · ' + l.km + ' km' + (l.est ? ' <em>直線估算，儲存前會查路網</em>' : "") + '</span>' +
          '<select class="via" data-i="' + i + '" aria-label="到達方式"><option value="drive"' + (s.via === "drive" ? " selected" : "") + '>開車</option><option value="walk"' + (s.via === "walk" ? " selected" : "") + '>步行</option><option value="shuttle"' + (s.via === "shuttle" ? " selected" : "") + '>接駁</option><option value="taxi"' + (s.via === "taxi" ? " selected" : "") + '>計程車／地鐵</option></select></li>';
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
    var prof = via === "walk" ? "foot" : "driving", ac = window.AbortController ? new AbortController() : null, to = ac && setTimeout(function () { ac.abort(); }, 6000);
    return fetch("https://router.project-osrm.org/route/v1/" + prof + "/" + pa.lon + "," + pa.lat + ";" + pb.lon + "," + pb.lat + "?overview=full&geometries=geojson", ac ? { signal: ac.signal } : {})
      .then(function (r) { return r.json(); }).then(function (j) {
        if (j.code !== "Ok") throw new Error("route");
        var rt = j.routes[0], m = rt.duration / 60, coords = rt.geometry.coordinates.map(function (c) { return [Math.round(c[0] * 1e5) / 1e5, Math.round(c[1] * 1e5) / 1e5]; });
        /* 公開的 OSRM 只有汽車路網：步行段的距離照路網、時間用 4 km/h 自己算 */
        var wm = rt.distance / 1000 / 4 * 60;
        P.legs[key] = via === "walk" ? { km: Math.round(rt.distance / 100) / 10, normal: P.r5(wm), snow: P.r5(wm * 1.2), mode: "walk", geom: coords }
          : { km: Math.round(rt.distance / 100) / 10, normal: P.r5(m * 1.15), snow: P.r5(m * 1.5), mode: "drive", geom: coords };
        clearTimeout(to); state.legsDirty = true; return true;
      }).catch(function () { clearTimeout(to); legFails++; if (btnState !== "saving") msg("路網服務暫時連不上，這段先用直線估算，之後再試。", true); return false; });
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

  /* ---------- 設定 ---------- */
  var ADULTS = ["Sean", "Lo", "Ethan", "阿茹"];
  function who() { return store("snow13-who") || "家人"; }
  function openSettings() {
    $("#token").value = store("snow13-gh-token") || ""; $("#who").value = store("snow13-who") || ""; $("#tokmsg").textContent = "";
    $("#whochips").innerHTML = ADULTS.map(function (n) { return '<button type="button" class="chip" data-who="' + esc(n) + '" aria-pressed="' + (store("snow13-who") === n) + '">' + esc(n) + '</button>'; }).join("");
    $("#sharewho").innerHTML = ADULTS.map(function (n) { return '<option>' + esc(n) + '</option>'; }).join("");
    $("#dlg").showModal();
  }
  $("#settings").addEventListener("click", openSettings);
  $("#whochips").addEventListener("click", function (e) { var b = e.target.closest("[data-who]"); if (!b) return; $("#who").value = b.dataset.who; document.querySelectorAll("#whochips .chip").forEach(function (c) { c.setAttribute("aria-pressed", c === b); }); });
  $("#toksave").addEventListener("click", function () { store("snow13-gh-token", $("#token").value.trim() || null); store("snow13-who", $("#who").value.trim() || null); P.tokenBad = 0; toast("設定已存在這支手機。", "ok"); });
  $("#tokclear").addEventListener("click", function () { $("#token").value = ""; store("snow13-gh-token", null); $("#tokmsg").textContent = "已清除。"; });
  function testToken(t) {
    return fetch(GH, { headers: { Authorization: "Bearer " + t, Accept: "application/vnd.github+json" } }).then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (j) { return j.permissions && j.permissions.push ? "ok" : "readonly"; }, function (st) { return st === 401 ? "bad" : st === 404 ? "norepo" : "fail"; });
  }
  var TESTMSG = { ok: "可以：這把金鑰能存到網站。", readonly: "金鑰有效，但沒有寫入權限（Contents 要選 Read and write）。", bad: "金鑰無效或過期。", norepo: "金鑰看不到這個網站的資料（Repository access 要選 hokkaido-ski-2027）。", fail: "現在連不上 GitHub，稍後再試。" };
  $("#toktest").addEventListener("click", function () {
    var t = $("#token").value.trim(); if (!t) { $("#tokmsg").textContent = "先貼金鑰。"; return; }
    $("#tokmsg").textContent = "測試中…"; testToken(t).then(function (r) { $("#tokmsg").textContent = TESTMSG[r]; });
  });
  /* 給家人的設定連結：金鑰放在 # 後面（不會送到網站伺服器），對方點開一次，那支手機就能儲存 */
  $("#sharelink").addEventListener("click", function () {
    var t = $("#token").value.trim() || store("snow13-gh-token"); if (!t) { $("#tokmsg").textContent = "這支手機要先設定好金鑰，才能產生給家人的連結。"; return; }
    var n = $("#sharewho").value, url = location.origin + location.pathname + "#key=" + encodeURIComponent(t) + "&who=" + encodeURIComponent(n);
    var text = n + "：點這個連結一次，你的手機就能直接改北海道行程、按儲存。（連結裡有鑰匙，不要轉傳）";
    if (navigator.share) navigator.share({ title: "北海道行程編輯", text: text, url: url }).catch(function () { });
    else if (navigator.clipboard) navigator.clipboard.writeText(text + "\n" + url).then(function () { $("#tokmsg").textContent = "已複製給 " + n + " 的連結，貼到 LINE 傳給他。"; });
    else prompt("複製這個連結傳給 " + n, url);
  });
  function setupFromLink() {
    var h = location.hash.replace(/^#/, ""); if (h.indexOf("key=") !== 0) return false;
    var q = new URLSearchParams(h), t = q.get("key"), n = q.get("who");
    history.replaceState(null, "", location.pathname + location.search);
    if (!t) return false;
    store("snow13-gh-token", t); if (n) store("snow13-who", n); P.tokenBad = 0;
    testToken(t).then(function (r) { if (r === "ok") toast("設定好了" + (n ? "（" + n + "）" : "") + "：這支手機現在可以直接改行程、按儲存。", "ok"); else toast(TESTMSG[r] + " 請跟 Sean 要新的連結。", "bad"); });
    return true;
  }

  /* ---------- 儲存 ----------
     一次儲存＝GitHub 上一個 commit（plan.json 和新路段 legs.json 一起），用「快轉」更新 main：
     存的瞬間如果有人先存了，GitHub 會拒絕，我們就拿最新版重新合併再存（最多 3 次），不會蓋掉別人的修改。
     存完再從 GitHub 讀回來比對，對得上才顯示「已儲存 ✓」。 */
  function b64(str) { return btoa(unescape(encodeURIComponent(str))); }
  function changedDays() { return dates.filter(function (d) { return J(P.plan.days[d]) !== J(state.base.days[d]); }); }
  function newLegsSinceBase() { var o = {}; Object.keys(P.legs).forEach(function (k) { if (!state.baseLegs[k]) o[k] = P.legs[k]; }); return o; }
  function hhmm(d) { return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }
  function commitOnce(tries) {
    var head, tree0, rp, finalPlan, legsOut = null, addLegs = newLegsSinceBase();
    return gh("GET", "/git/ref/heads/main").then(function (r) { head = r.object.sha; return gh("GET", "/git/commits/" + head); })
      .then(function (c) { tree0 = c.tree.sha; return readPlan(head); })
      .then(function (r) {
        rp = r;
        if (rp.sha === state.planSha) return clone(P.plan);
        var m = merge3(state.base, P.plan, rp.plan), by = rp.plan.savedBy || "家人";
        m.conflicts.forEach(function (d) {
          if (!confirm(md(d) + "：你和 " + by + " 都改了這一天，內容不一樣。\n\n按「確定」用你的版本\n按「取消」保留 " + by + " 的版本（你這天的修改不存）")) m.plan.days[d] = clone(rp.plan.days[d]);
          else m.plan.days[d] = clone(P.plan.days[d]);
        });
        return m.plan;
      })
      .then(function (fp) {
        finalPlan = fp; var now = new Date();
        finalPlan.savedAt = now.toISOString(); finalPlan.savedBy = who(); finalPlan.updated = finalPlan.savedAt.slice(0, 10);
        var days = dates.filter(function (d) { return J(finalPlan.days[d]) !== J(rp.plan.days[d]); }).map(md).join("、");
        var files = [{ path: "data/plan.json", mode: "100644", type: "blob", content: JSON.stringify(finalPlan, null, 2) + "\n" }];
        var msgTxt = "行程更新（" + who() + "）：" + (days || "路段資料");
        var legsP = Object.keys(addLegs).length ? P.ghRaw("data/legs.json", head).then(function (l) { Object.keys(addLegs).forEach(function (k) { l[k] = addLegs[k]; }); legsOut = l; files.push({ path: "data/legs.json", mode: "100644", type: "blob", content: JSON.stringify(l) }); }) : Promise.resolve();
        return legsP.then(function () { return gh("POST", "/git/trees", { base_tree: tree0, tree: files }); })
          .then(function (t) { return gh("POST", "/git/commits", { message: msgTxt, tree: t.sha, parents: [head] }); })
          .then(function (c) { return gh("PATCH", "/git/refs/heads/main", { sha: c.sha, force: false }).then(function () { return c.sha; }); });
      })
      .then(function (commitSha) {
        /* 讀回來確認：GitHub 上這個版本的 plan.json 就是剛剛送出的內容 */
        return readPlan(commitSha).then(function (back) {
          if (J(back.plan) !== J(finalPlan)) throw new Error("存完讀回來內容不一致");
          return { sha: back.sha, plan: finalPlan, legs: legsOut, added: addLegs };
        });
      })
      .catch(function (e) {
        /* 422＝存的瞬間有人先存了（不是快轉）：拿最新版重新合併再存 */
        if (e.status === 422 && tries < 3) { toast("剛好有人也在存，重新合併中…", "busy"); return commitOnce(tries + 1); }
        throw e;
      });
  }
  function explain(e) {
    if (e.status === 401) return ["這支手機的金鑰失效了（過期或被刪掉）。", [["重新設定", openSettings]]];
    if (e.status === 403 || e.status === 404) return ["這把金鑰沒有寫入這個網站的權限。", [["設定", openSettings]]];
    if (e.status === 409 || e.status === 422) return ["一直有人同時在存，請過幾秒再按一次。", [["再試一次", save]]];
    if (!navigator.onLine || e instanceof TypeError) return ["沒有網路，沒存到。修改還留在這支手機上，有網路再按一次。", [["再試一次", save]]];
    return ["沒存到：" + e.message + "。修改還留在這支手機上。", [["再試一次", save]]];
  }
  function save() {
    if (btnState === "saving") return;
    if (!isDirty()) { toast("沒有要儲存的修改，網站上已經是這個版本。", "info"); return; }
    if (!P.token()) { toast("這支手機還不能儲存：要先設定（跟 Sean 要設定連結，點一下就好）。", "bad", [["設定", openSettings]]); return; }
    setBtn("saving"); toast("儲存中…", "busy"); legFails = 0;
    var all = dates.map(function (d) { return P.plan.days[d].stops; });
    Promise.all(all.map(fillLegs)).then(function () { return commitOnce(0); }).then(function (r) {
      P.plan = r.plan; P.clearCache(); state.base = clone(r.plan); state.planSha = r.sha; state.seenSha = r.sha;
      if (r.legs) Object.keys(r.legs).forEach(function (k) { if (!P.legs[k]) P.legs[k] = r.legs[k]; });
      state.baseLegs = clone(P.legs); state.legsDirty = false; store("snow13-draft", null);
      P.lsSet("snow13-saved", { plan: r.plan, legs: r.added });   /* 這支手機的其他頁面馬上用新版 */
      setBtn("saved"); renderAll(); renderStamp();
      toast("已存到網站 " + hhmm(new Date()) + "。有設定的家人打開就是新版；沒設定的手機約 1 分鐘後更新。" + (legFails ? "（有 " + legFails + " 段路暫時查不到路網，先用直線估算，下次儲存會再查）" : ""), "ok", [["看 " + md(state.date) + " →", "../day/" + state.date.slice(5).replace("-", "") + "/"]]);
    }).catch(function (e) {
      setBtn("error"); var x = explain(e); toast(x[0], "bad", x[1]);
    });
  }
  $("#save").addEventListener("click", save);
  $("#reload").addEventListener("click", function () {
    if (isDirty() && !confirm("會丟掉未儲存的變更，確定重新載入？")) return;
    store("snow13-draft", null); location.reload();
  });
  setupFromLink();
  addEventListener("hashchange", setupFromLink);   /* 已經開著編輯頁時再點設定連結 */

  load().catch(function (e) { msg("載入失敗：" + e.message, true); });
})();

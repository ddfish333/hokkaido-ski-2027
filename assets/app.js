(function () {
  "use strict";
  var T = window.TRIP;
  if (!T) return;

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
  var state = { day: 0, origin: null, originManual: false, gps: null, wx: {}, wxTab: "villa", foodArea: "全部" };

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

  (function initDay() {
    var i = T.days.findIndex(function (d) { return d.date === TODAY; });
    state.day = i >= 0 ? i : (TODAY > T.end ? T.days.length - 1 : 0);
    state.origin = T.days[state.day].base;
  })();

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
  function renderHero() {
    var c = $("#countdown");
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
    $("#updated").textContent = T.updated;
  }

  /* ---------- 每日 ---------- */
  function renderDayStrip() {
    var s = $("#daystrip");
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
    var d = T.days[state.day], b = baseById[d.base];
    var html = '<div class="card"><p class="day-date">' + md(d.date) + '（' + dow(d.date) + '）· 住 ' + esc(b.short) + '</p>' +
      '<h3 class="day-title">' + esc(d.title) + '</h3><p class="day-sub">' + esc(d.sub) + '</p>' +
      (d.alert ? '<p class="alert">' + esc(d.alert) + '</p>' : "") +
      '<ol class="timeline">' + d.plan.map(function (p) { return '<li><time>' + esc(p[0]) + '</time><span>' + em(p[1]) + '</span></li>'; }).join("") + '</ol></div>';
    html += '<div class="side">';
    html += '<div class="card"><p class="panel-label">車程（一般／下雪）</p><ul class="legs">' + d.legs.map(function (l) {
      return '<li class="leg"><div class="path">' + esc(l[0]) + ' → ' + esc(l[1]) + '<small>' + l[2] + ' km</small></div><div class="t">' + fmtMin(l[3]) + '<small>雪 ' + fmtMin(l[4]) + '</small></div></li>';
    }).join("") + '</ul></div>';
    html += '<div class="card"><p class="panel-label">天氣</p>' + dayWeather(d) + '</div>';
    html += '<div class="card"><p class="panel-label">日照</p><div class="sunrow"><div><span>日出</span><b>' + d.sun[0] + '</b></div><div><span>日落</span><b>' + d.sun[1] + '</b></div><div><span>天黑</span><b>' + d.sun[2] + '</b></div></div></div>';
    html += '<div class="card"><p class="panel-label">吃什麼</p><ul class="meals"><li><span>午</span>' + esc(d.meals[0]) + '</li><li><span>晚</span>' + esc(d.meals[1]) + '</li></ul></div>';
    html += '</div>';
    $("#dayview").innerHTML = html;
  }

  /* ---------- 地圖 ---------- */
  var CATS = [
    ["stay", "住宿", "宿", "--c-stay"], ["ski", "雪場", "雪", "--c-ski"], ["sight", "景點", "景", "--c-sight"], ["food", "餐廳", "食", "--c-food"],
    ["onsen", "溫泉", "湯", "--c-onsen"], ["shop", "購物", "店", "--c-shop"], ["grocery", "超市", "超", "--c-grocery"], ["hospital", "醫院", "醫", "--c-hospital"], ["transport", "交通", "交", "--c-transport"]
  ];
  var catOn = {}; CATS.forEach(function (c) { catOn[c[0]] = c[0] !== "grocery" && c[0] !== "transport" && c[0] !== "hospital"; });
  var map = null, markers = [], gpsMarker = null, mapReady = false;

  function popupHTML(p) {
    var a = '<a href="' + navUrl(p.lat, p.lon) + '" target="_blank" rel="noopener">Google Maps 導航</a>';
    if (p.baseId) a += '<button type="button" data-origin="' + p.baseId + '">從這裡算車程</button>';
    return '<p class="pop-t">' + esc(p.name) + '</p>' + (p.note ? '<p class="pop-n">' + em(p.note) + (p.approx ? '（位置為概略）' : '') + '</p>' : '') + '<div class="pop-a">' + a + '</div>';
  }
  function allPoints() {
    var pts = [];
    T.bases.forEach(function (b) { pts.push({ type: "stay", name: b.name, lat: b.lat, lon: b.lon, note: md(b.from) + "–" + md(b.to) + " " + b.nights + " 晚。" + b.notes.join("；"), baseId: b.id }); });
    T.resorts.forEach(function (r) { pts.push({ type: "ski", name: r.name, lat: r.lat, lon: r.lon, note: r.tier + "。" + (r.hours || "") }); });
    pts.push({ type: "ski", name: "富良野滑雪場 富良野區", lat: 43.3266, lon: 142.3394, note: "富良野纜車（新富良野王子飯店旁）" });
    return pts.concat(T.places);
  }
  function initMap() {
    renderLayers();
    if (!window.maplibregl) { $("#mapfallback").hidden = false; return; }
    try {
      map = new maplibregl.Map({
        container: "mapcanvas", style: "https://tiles.openfreemap.org/styles/liberty",
        center: [141.75, 43.28], zoom: 7, cooperativeGestures: true, attributionControl: { compact: true }
      });
    } catch (e) { $("#mapfallback").hidden = false; return; }
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    var catColor = {}; CATS.forEach(function (c) { catColor[c[0]] = c; });
    allPoints().forEach(function (p) {
      var c = catColor[p.type]; if (!c) return;
      var elx = document.createElement("div");
      elx.className = "marker " + p.type;
      elx.style.setProperty("--mc", "var(" + c[3] + ")");
      elx.textContent = c[2];
      elx.title = p.name;
      var popup = new maplibregl.Popup({ offset: 18, maxWidth: "290px" }).setHTML(popupHTML(p));
      var m = new maplibregl.Marker({ element: elx }).setLngLat([p.lon, p.lat]).setPopup(popup).addTo(map);
      elx.hidden = !catOn[p.type];
      markers.push({ type: p.type, m: m, el: elx, p: p });
    });
    map.getContainer().addEventListener("click", function (e) {
      var b = e.target.closest("[data-origin]"); if (!b) return;
      state.origin = b.dataset.origin; state.originManual = true; renderOrigin(); renderDrive();
    });
    map.on("load", function () {
      mapReady = true;
      fetch("data/routes.geojson").then(function (r) { return r.json(); }).then(function (gj) {
        map.addSource("routes", { type: "geojson", data: gj });
        map.addLayer({ id: "route-casing", type: "line", source: "routes", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#ffffff", "line-width": 8, "line-opacity": 0.9 }, filter: ["==", ["get", "date"], ""] });
        map.addLayer({ id: "route-line", type: "line", source: "routes", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#E33B2E", "line-width": 4.5 }, filter: ["==", ["get", "date"], ""] });
        state.routes = gj;
        updateRoute(false);
      }).catch(function () { /* 沒有路線也能用 */ });
    });
  }
  function renderLayers() {
    var box = $("#layers");
    box.innerHTML = CATS.map(function (c) {
      return '<button type="button" class="chip" aria-pressed="' + catOn[c[0]] + '" data-cat="' + c[0] + '" style="--mc:var(' + c[3] + ')"><i></i>' + c[1] + '</button>';
    }).join("");
    box.onclick = function (e) {
      var b = e.target.closest("[data-cat]"); if (!b) return;
      var k = b.dataset.cat; catOn[k] = !catOn[k]; b.setAttribute("aria-pressed", catOn[k]);
      markers.forEach(function (x) { if (x.type === k) x.el.hidden = !catOn[k]; });
    };
  }
  function updateRoute(fit) {
    if (!map || !mapReady || !state.routes) return;
    var date = T.days[state.day].date;
    var f = ["==", ["get", "date"], date];
    map.setFilter("route-casing", f); map.setFilter("route-line", f);
    var feats = state.routes.features.filter(function (x) { return x.properties.date === date; });
    var b = baseById[T.days[state.day].base];
    var bounds = new maplibregl.LngLatBounds([b.lon, b.lat], [b.lon, b.lat]);
    feats.forEach(function (x) { x.geometry.coordinates.forEach(function (c) { bounds.extend(c); }); });
    if (fit !== false || feats.length) map.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: fit ? 800 : 0 });
  }

  /* ---------- 出發地與車程 ---------- */
  function renderOrigin() {
    var opts = T.bases.map(function (b) { return [b.id, b.short]; });
    if (state.gps) opts.push(["gps", "我的位置"]);
    $("#origin").innerHTML = opts.map(function (o) {
      return '<button type="button" role="radio" aria-checked="' + (state.origin === o[0]) + '" data-o="' + o[0] + '">' + esc(o[1]) + '</button>';
    }).join("");
  }
  $("#origin").addEventListener("click", function (e) {
    var b = e.target.closest("[data-o]"); if (!b) return;
    state.origin = b.dataset.o; state.originManual = true; renderOrigin(); renderDrive();
  });
  function originPoint() {
    if (state.origin === "gps") return state.gps;
    var b = baseById[state.origin]; return { lat: b.lat, lon: b.lon };
  }
  function renderDrive() {
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
  $("#gpsbtn").addEventListener("click", function () {
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
    function done() { renderWxStrip(); renderDay(); refreshResortWx(); }
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
    $("#wxtabs").innerHTML = WX_TABS.map(function (t) {
      return '<button type="button" role="tab" aria-selected="' + (state.wxTab === t.id) + '" data-t="' + t.id + '">' + esc(t.label) + '</button>';
    }).join("");
    $("#wxtabs").onclick = function (e) {
      var b = e.target.closest("[data-t]"); if (!b) return;
      state.wxTab = b.dataset.t; renderWxTabs(); renderWxStrip();
    };
  }
  function renderWxStrip() {
    var w = state.wx[state.wxTab], box = $("#wxstrip");
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
    var rows = Object.keys(T.climate).map(function (k) {
      var c = T.climate[k]; return '<tr><td>' + esc(c.label) + '</td><td>' + c.tmax + '°</td><td>' + c.tmin + '°</td><td>' + c.snow + ' cm</td></tr>';
    }).join("");
    $("#climate").innerHTML = '<table><thead><tr><th>1/7–1/19 歷年平均</th><th>高溫</th><th>低溫</th><th>每日新雪</th></tr></thead><tbody>' + rows + '</tbody></table>';
    $("#roadlinks").innerHTML = T.links.map(function (l) { return '<li><a href="' + esc(l[1]) + '" target="_blank" rel="noopener">' + esc(l[0]) + ' ↗</a></li>'; }).join("");
  }

  /* ---------- 吃喝 ---------- */
  function renderFood() {
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
    $("#curbtn").textContent = CUR_LABEL[state.cur];
    $("#curbtn").title = "目前顯示：" + { both: "日圓＋台幣", twd: "台幣", jpy: "日圓" }[state.cur] + "（點一下切換）";
    $("#fxnote").textContent = "匯率：1 日圓 ≈ NT$" + state.rate.toFixed(4) + "（" + state.rateDate + "）。台幣金額為概算，刷卡或換匯實際約再高 1.5–3%。";
  }
  function rerenderMoney() {
    renderFx(); renderDay(); renderResorts(); renderFood(); renderPrep();
    markers.forEach(function (x) { var pp = x.m.getPopup(); if (pp) pp.setHTML(popupHTML(x.p)); });
  }
  $("#curbtn").addEventListener("click", function () {
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

  /* ---------- 啟動 ---------- */
  renderFx();
  renderHero();
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
})();

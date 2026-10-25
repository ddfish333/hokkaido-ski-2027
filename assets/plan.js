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
  /* 沒有快取的路段：先用直線估算（編輯器會打 OSRM 補上真的） */
  function estLeg(a, b, via) {
    var pa = P.plan.places[a], pb = P.plan.places[b]; if (!pa || !pb) return null;
    var km = hav(pa, pb) * (via === "walk" ? 1.3 : 1.35);
    var min = via === "walk" ? km / 4 * 60 : via === "shuttle" ? 10 : km / 45 * 60;
    return { km: Math.round(km * 10) / 10, normal: r5(min), snow: r5(via === "walk" ? min * 1.2 : via === "shuttle" ? min : min * 1.3), mode: via || "drive", geom: [[pa.lon, pa.lat], [pb.lon, pb.lat]], est: true };
  }
  function leg(a, b, via) { return P.legs[legKey(a, b, via)] || estLeg(a, b, via); }

  /* 核心：date + mode（normal／snow）→ 時間表 */
  function schedule(date, mode, overrideStops) {
    var day = P.plan.days[date]; if (!day) return { stops: [], legs: [], total: { km: 0, min: 0 }, end: null };
    var stops = overrideStops || day.stops, out = [], legs = [], t = null, tk = 0, tm = 0;
    for (var i = 0; i < stops.length; i++) {
      var s = stops[i], pl = P.plan.places[s.id] || { name: s.id, lat: 0, lon: 0 }, via = s.via || "drive", L = null, arr;
      if (i === 0) arr = mins(s.at) != null ? mins(s.at) : 8 * 60;
      else {
        L = leg(stops[i - 1].id, s.id, via);
        var lm = L ? (mode === "snow" ? L.snow : L.normal) : 0;
        legs.push({ frm: stops[i - 1].id, to: s.id, km: L ? L.km : 0, min: lm, normal: L ? L.normal : 0, snow: L ? L.snow : 0, mode: L ? L.mode : via, geom: L ? L.geom : null, est: !!(L && L.est) });
        if (L && L.mode !== "walk" && L.mode !== "shuttle") { tk += L.km; tm += lm; }
        arr = t + lm;
      }
      var wait = 0, late = 0, at = mins(s.at), by = mins(s.by);
      if (i > 0 && at != null) { if (arr < at) { wait = at - arr; arr = at; } else if (arr > at) late = arr - at; }
      if (by != null && arr > by) late = Math.max(late, arr - by);
      var stay = i === stops.length - 1 ? 0 : (+s.stay || 0), dep = arr + stay;
      out.push({ i: i, id: s.id, name: pl.name, lat: pl.lat, lon: pl.lon, arr: arr, dep: dep, stay: stay, wait: wait, late: late, at: s.at || "", by: s.by || "", via: via, note: s.note || "", time: hm(arr), timeDep: hm(dep) });
      t = dep;
    }
    return { stops: out, legs: legs, total: { km: Math.round(tk), min: tm }, end: out.length ? out[out.length - 1].arr : null };
  }
  /* 舊介面相容：給地圖用的 stops（含 time）與 legs（normal／snow） */
  function dayPlan(date, mode) { return schedule(date, mode); }

  function fetchJSON(u) { return fetch(u, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(u + " " + r.status); return r.json(); }); }
  P.ready = Promise.all([fetchJSON(BASE + "data/plan.json"), fetchJSON(BASE + "data/legs.json")]).then(function (r) { P.plan = r[0]; P.legs = r[1]; return P; });
  P.schedule = schedule; P.dayPlan = dayPlan; P.hm = hm; P.mins = mins; P.legKey = legKey; P.leg = leg; P.estLeg = estLeg; P.r5 = r5; P.hav = hav;
  P.mode = function (m) { try { if (m) { localStorage.setItem("snow13-mode", m); return m; } return localStorage.getItem("snow13-mode") || "normal"; } catch (e) { return m || "normal"; } };
  window.Plan = P;
})();

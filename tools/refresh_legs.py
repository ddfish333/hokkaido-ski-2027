#!/usr/bin/env python3
"""重算路段（legs.json）和住宿→雪場車程表（trip.js drive），全部用同一套算法：

  OSRM 路網時間（raw）× 冬季係數。係數看路況分兩種，由路線本身判斷（不用人去記哪段是山路）：
    山路 mountain：路段 ≥ 10 km，而且（最高點 ≥ 300 m、平均每公里轉彎 ≥ 180°＝髮夾彎多的山口；
                   或最高點 ≥ 600 m、每公里轉彎 ≥ 120°、全長 ≤ 60 km＝上到高海拔雪場的山谷路，例如定山溪往札幌國際；
                   美瑛→白金那種又直又平緩的高原路、富良野→札幌那種只短暫經過高處的長路不算）        → 一般 ×1.6、下雪 ×2.0
    一般 town：其他（高速公路、市區、平緩的丘陵路）                                  → 一般 ×1.15、下雪 ×1.5
  2026-10-26 用 SRTM 高程量過全部行程路段：只有 Kiroro 進出的山口（朝里峠、毛無峠）符合，
  一般 ×1.6 會讓 Kiroro → 小樽運河 從 30 分變 45 分左右，接近冬天實際。
  走路：路網距離、4 km/h（雪 ×1.2）。接駁：固定 10 分。

用法：python3 tools/refresh_legs.py          只重算過期／缺少／還沒分類的
     python3 tools/refresh_legs.py --dry    只列出來
     python3 tools/refresh_legs.py --all    全部重算（含 trip.js drive 表）"""
import json, math, os, re, subprocess, sys, time, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from plan_lib import PLAN, LEGS, ROOT, leg_ends, leg_stale, r5, hav_km, drive_pt, load_js

WINTER = {"town": (1.15, 1.5), "mountain": (1.6, 2.0)}
def road_type(km, maxe, turn): return "mountain" if km >= 10 and ((maxe >= 300 and turn >= 180) or (maxe >= 600 and turn >= 120 and km <= 60)) else "town"

def get(u, tries=6):
    for i in range(tries):
        try: return json.load(urllib.request.urlopen(u, timeout=40))
        except Exception as e: err = e; time.sleep(3 + i * 4)
    raise SystemExit(f"連不上：{u[:90]}…（{err}）")

# 走路一定要用行人路網：router.project-osrm.org 只有汽車路網，"foot" 也照汽車走（會被單行道繞遠，
# 10/26 第六輪：六花亭 → 音樂盒堂實際 178 m，汽車路網算成 1.4 km、20 分）
ROUTER = {"driving": "https://router.project-osrm.org/route/v1/driving/", "foot": "https://routing.openstreetmap.de/routed-foot/route/v1/driving/"}
def osrm(a, b, prof="driving"):
    j = get(f"{ROUTER[prof]}{a['lon']},{a['lat']};{b['lon']},{b['lat']}?overview=full&geometries=geojson")
    if j.get("code") != "Ok": raise SystemExit(f"OSRM 找不到路：{a.get('name')} → {b.get('name')}")
    return j["routes"][0]

def profile(geom):
    """路線每 0.5 km 取一點：最高點（SRTM 30 m 高程）、每公里轉彎角度。"""
    pts, acc = [geom[0]], 0
    for a, b in zip(geom, geom[1:]):
        acc += hav_km({"lat": a[1], "lon": a[0]}, {"lat": b[1], "lon": b[0]})
        if acc >= 0.5: pts.append(b); acc = 0
    ele = []
    for i in range(0, len(pts), 100):
        ch = pts[i:i + 100]
        ele += [r["elevation"] or 0 for r in get("https://api.opentopodata.org/v1/srtm30m?locations=" + "|".join(f"{p[1]:.4f},{p[0]:.4f}" for p in ch))["results"]]
        time.sleep(1.1)
    tot = L = 0
    for a, b, c in zip(geom, geom[1:], geom[2:]):
        h1 = math.atan2(b[1] - a[1], (b[0] - a[0]) * math.cos(math.radians(a[1]))); h2 = math.atan2(c[1] - b[1], (c[0] - b[0]) * math.cos(math.radians(b[1])))
        tot += math.degrees(abs((h2 - h1 + math.pi) % (2 * math.pi) - math.pi))
    for a, b in zip(geom, geom[1:]): L += hav_km({"lat": a[1], "lon": a[0]}, {"lat": b[1], "lon": b[0]})
    return round(max(ele)), round(tot / max(L, 0.1))

def drive_leg(ea, eb):
    rt = osrm(ea, eb); raw = rt["duration"] / 60; km = round(rt["distance"] / 100) / 10
    geom = [[round(c[0], 5), round(c[1], 5)] for c in rt["geometry"]["coordinates"]]
    maxe, turn = profile(geom) if km >= 10 else (0, 0)
    road = road_type(km, maxe, turn); fn, fs = WINTER[road]
    return {"km": km, "normal": r5(raw * fn), "snow": r5(raw * fs), "mode": "drive", "geom": geom,
            "ends": [[ea["lon"], ea["lat"]], [eb["lon"], eb["lat"]]], "raw": round(raw, 1), "road": road, "maxe": maxe, "turn": turn}

def compute(key):
    parts = key.split("|"); a, b = parts[0], parts[1]; via = parts[2] if len(parts) > 2 else "drive"
    ea, eb = leg_ends(a, b, via); ends = [[ea["lon"], ea["lat"]], [eb["lon"], eb["lat"]]]
    if via == "shuttle":
        return {"km": round(hav_km(ea, eb) * 1.3, 1), "normal": 10, "snow": 10, "mode": "shuttle", "geom": ends, "ends": ends}
    if via == "walk":
        rt = osrm(ea, eb, "foot"); wm = rt["distance"] / 1000 / 4 * 60
        return {"km": round(rt["distance"] / 100) / 10, "normal": r5(wm), "snow": r5(wm * 1.2), "mode": "walk",
                "geom": [[round(c[0], 5), round(c[1], 5)] for c in rt["geometry"]["coordinates"]], "ends": ends, "router": "osm-foot"}
    return drive_leg(ea, eb)

USED = set()
for d, v in PLAN["days"].items():
    st = v["stops"]
    for i in range(1, len(st)):
        USED.add(f"{st[i-1]['id']}|{st[i]['id']}")
        for alt in st[i].get("alts") or []: USED.update({f"{st[i-1]['id']}|{alt}", f"{alt}|{st[i+1]['id']}" if i + 1 < len(st) else ""})
def needs(k, L):
    """過期；行程用得到、≥ 10 km 卻還沒判斷路況的開車路段（短路段一律 town，不用查高程）；用汽車路網算的走路段"""
    return (leg_stale(k, L) or (L.get("mode") == "drive" and "road" not in L and k in USED and L.get("km", 0) >= 10)
            or (L.get("mode") == "walk" and L.get("router") != "osm-foot"))

ALL, DRY = "--all" in sys.argv, "--dry" in sys.argv
for k, L in LEGS.items():  # 規則改了：有存 raw／maxe／turn 的直接重套係數
    if L.get("raw") is not None and L.get("mode") == "drive":
        road = road_type(L["km"], L.get("maxe", 0), L.get("turn", 0))
        if road != L.get("road"):
            fn, fs = WINTER[road]; print(f"{k}: 重新分類 {L.get('road')} → {road}：{L['normal']}/{L['snow']} → {r5(L['raw']*fn)}/{r5(L['raw']*fs)} 分")
            L.update(road=road, normal=r5(L["raw"] * fn), snow=r5(L["raw"] * fs))
for k, L in LEGS.items():  # 短路段直接標 town，時間不變
    if L.get("mode") == "drive" and "road" not in L and L.get("km", 0) < 10 and not leg_stale(k, L): L["road"] = "town"
need = set(k for k, L in LEGS.items() if ALL or needs(k, L))
for d, v in PLAN["days"].items():
    for i in range(1, len(v["stops"])):
        a, b, via = v["stops"][i - 1]["id"], v["stops"][i]["id"], v["stops"][i].get("via", "drive")
        key = f"{a}|{b}" + ("|walk" if via == "walk" else "|shuttle" if via == "shuttle" else "")
        if a != b and key not in LEGS: need.add(key)
for k in sorted(need):
    old = LEGS.get(k)
    if DRY: print("缺少" if not old else "過期" if leg_stale(k, old) else "未分類", k); continue
    new = compute(k); LEGS[k] = new
    print(f"{k}: {old['normal'] if old else '-'}/{old['snow'] if old else '-'} 分 → {new['normal']}/{new['snow']} 分" + (f"（{new['road']}，最高 {new['maxe']} m，{new['turn']}°/km）" if new.get("road") else ""), flush=True)
    time.sleep(1)
if not DRY and need:
    json.dump(LEGS, open(os.path.join(ROOT, "data/legs.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

# ---------- trip.js drive 表：住宿 → 各雪場，同一套算法；行程裡已經有的路段直接用 legs.json ----------
T = load_js("data/trip.js", "TRIP")
def resort_pt(r):
    s = (r.get("stops") or [None])[0]
    if s in PLAN["places"]: return s, drive_pt(s)
    g = next((g for g in r.get("gates") or [] if g.get("pid")), None)
    return None, (g or r)
cur = T.get("drive", {})
table = {}
for b in T["bases"]:
    bs = b.get("stop"); ea = drive_pt(bs) if bs in PLAN["places"] else b; row = {}
    for r in T["resorts"]:
        sid, eb = resort_pt(r); key = f"{bs}|{sid}" if sid else f"{bs}|@{r['id']}"  # @雪場＝不在行程裡、只給雪場頁用的路段
        if key in LEGS and not ALL and not leg_stale(key, LEGS[key]) and (LEGS[key].get("road") or key.split("|")[1] in PLAN["places"] and not needs(key, LEGS[key])): L = LEGS[key]
        else:
            if DRY: continue
            L = drive_leg(ea, eb); time.sleep(1)
            LEGS[key] = L  # 存起來，下次不用再查；排進行程時也直接用
        row[r["id"]] = [L["km"], L["normal"], L["snow"]]
    table[b["id"]] = row
if not DRY:
    src = open(os.path.join(ROOT, "data/trip.js"), encoding="utf-8").read()
    body = "  drive: {\n" + ",\n".join(f"    {bid}: {{ " + ", ".join(f"{rid}: [{v[0]}, {v[1]}, {v[2]}]" for rid, v in row.items()) + " }" for bid, row in table.items()) + "\n  },"
    src2 = re.sub(r"  drive: \{\n.*?\n  \},", lambda m: body, src, count=1, flags=re.S)
    if src2 != src: open(os.path.join(ROOT, "data/trip.js"), "w", encoding="utf-8").write(src2); print("trip.js drive 表已更新")
    json.dump(LEGS, open(os.path.join(ROOT, "data/legs.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(f"{'需要' if DRY else '已'}處理 {len(need)} 段")

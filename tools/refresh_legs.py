#!/usr/bin/env python3
"""重算過期的路段：地點或停車場（plan.json places[].park）改過之後，legs.json 裡起訖對不上的路段打 OSRM 重查。
用法：python3 tools/refresh_legs.py        （只重算過期的＋行程裡缺的）
     python3 tools/refresh_legs.py --dry  （只列出來）
算法和網站編輯器一樣：開車 OSRM 時間 ×1.15（雪 ×1.5）；走路照路網距離、4 km/h（雪 ×1.2）。"""
import json, os, sys, time, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from plan_lib import PLAN, LEGS, ROOT, leg_ends, leg_stale, r5, hav_km

def osrm(a, b, via):
    prof = "foot" if via == "walk" else "driving"
    u = f"https://router.project-osrm.org/route/v1/{prof}/{a['lon']},{a['lat']};{b['lon']},{b['lat']}?overview=full&geometries=geojson"
    for i in range(3):
        try:
            j = json.load(urllib.request.urlopen(u, timeout=25))
            if j.get("code") == "Ok": return j["routes"][0]
        except Exception as e: err = e
        time.sleep(2 + i * 3)
    raise SystemExit(f"OSRM 失敗：{a.get('name')} → {b.get('name')}（{err if 'err' in dir() else ''}）")

def compute(key):
    parts = key.split("|"); a, b = parts[0], parts[1]; via = parts[2] if len(parts) > 2 else "drive"
    ea, eb = leg_ends(a, b, via)
    ends = [[ea["lon"], ea["lat"]], [eb["lon"], eb["lat"]]]  # 記下這次用的起訖，之後地點改了 check.py 才知道要重算
    if via == "shuttle":
        return {"km": round(hav_km(ea, eb) * 1.3, 1), "normal": 10, "snow": 10, "mode": "shuttle", "geom": ends, "ends": ends}
    rt = osrm(ea, eb, via); m = rt["duration"] / 60; km = round(rt["distance"] / 100) / 10
    geom = [[round(c[0], 5), round(c[1], 5)] for c in rt["geometry"]["coordinates"]]
    if via == "walk":
        wm = rt["distance"] / 1000 / 4 * 60
        return {"km": km, "normal": r5(wm), "snow": r5(wm * 1.2), "mode": "walk", "geom": geom, "ends": ends}
    return {"km": km, "normal": r5(m * 1.15), "snow": r5(m * 1.5), "mode": "drive", "geom": geom, "ends": ends}

need = set(k for k, L in LEGS.items() if leg_stale(k, L))
for d, v in PLAN["days"].items():
    for i in range(1, len(v["stops"])):
        a, b, via = v["stops"][i - 1]["id"], v["stops"][i]["id"], v["stops"][i].get("via", "drive")
        key = f"{a}|{b}" + ("|walk" if via == "walk" else "|shuttle" if via == "shuttle" else "")
        if a != b and key not in LEGS: need.add(key)
dry = "--dry" in sys.argv
for k in sorted(need):
    old = LEGS.get(k)
    if dry: print("過期" if old else "缺少", k); continue
    new = compute(k)
    print(f"{k}: {old['km'] if old else '-'} km/{old['normal'] if old else '-'} 分 → {new['km']} km/{new['normal']} 分")
    LEGS[k] = new; time.sleep(1)
if not dry and need:
    json.dump(LEGS, open(os.path.join(ROOT, "data/legs.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(f"{'需要' if dry else '已'}重算 {len(need)} 段")

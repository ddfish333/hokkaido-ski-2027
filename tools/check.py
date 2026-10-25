#!/usr/bin/env python3
"""行程一致性檢查。行程的唯一事實來源是 data/plan.json（站點、停留、固定時間；編輯器寫入）與 data/trip.js（每天的標題、吃什麼、提醒）。
其他東西（序幕腳本、海報、照片、單日頁）都應該跟著它們走；這支程式找出沒跟上的地方。

用法：python3 tools/check.py [照片資料夾路徑]
  照片資料夾預設找 ../hokkaido-photos-web（在 Mac 上）；找不到就略過照片檢查。
回傳非 0 = 有錯（網站會壞或內容不一致）；警告不影響回傳值。"""
import json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def load_js(file, var):
    code = "global.window={};require(process.argv[1]);console.log(JSON.stringify(window." + var + "||null))"
    return json.loads(subprocess.run(["node", "-e", code, os.path.join(ROOT, file)], capture_output=True, text=True, check=True).stdout)

trip = load_js("data/trip.js", "TRIP")
PLAN = json.load(open(os.path.join(ROOT, "data/plan.json"), encoding="utf-8"))
LEGS = json.load(open(os.path.join(ROOT, "data/legs.json"), encoding="utf-8"))
scenes = load_js("data/scenes.js", "SCENES")

def mins(t): h, m = t.split(":"); return int(h) * 60 + int(m)
def hm(x): return f"{x // 60:02d}:{x % 60:02d}"
def leg_of(a, b, via):
    k = f"{a}|{b}" + ("|walk" if via == "walk" else "|shuttle" if via == "shuttle" else "")
    return LEGS.get(k)
def schedule(date, mode):
    """跟 assets/plan.js 同一套算法：前一站離開＋移動＝抵達；at 早到就等、晚到算遲；by 超過算遲。"""
    out, t = [], None
    stops = PLAN["days"][date]["stops"]
    for i, s in enumerate(stops):
        via = s.get("via", "drive")
        if i == 0: arr = mins(s["at"]) if s.get("at") else 480
        else:
            L = leg_of(stops[i - 1]["id"], s["id"], via)
            arr = t + (L[mode] if L else 0)
        wait = late = 0
        if i > 0 and s.get("at"):
            a = mins(s["at"])
            if arr < a: wait, arr = a - arr, a
            elif arr > a: late = arr - a
        if s.get("by") and arr > mins(s["by"]): late = max(late, arr - mins(s["by"]))
        stay = 0 if i == len(stops) - 1 else int(s.get("stay") or 0)
        out.append(dict(id=s["id"], arr=arr, dep=arr + stay, late=late, wait=wait))
        t = arr + stay
    return out
# 相容舊的變數名：dayplan[date]["stops"] 需要 id/time/name
dayplan = {d: {"stops": [dict(id=s["id"], time=hm(x["arr"]), name=PLAN["places"].get(s["id"], {}).get("name", s["id"])) for s, x in zip(v["stops"], schedule(d, "normal"))]} for d, v in PLAN["days"].items()}
place_of = load_js("data/scenes.js", "PLACE_OF_STOP")
days = [d["date"] for d in trip["days"]]
errors, warns = [], []
E = errors.append; W = warns.append

# 0. plan.json 本身：站點要指向存在的地點；路段快取要齊；固定時間格式
for d, v in PLAN["days"].items():
    for i, s in enumerate(v["stops"]):
        if s["id"] not in PLAN["places"]: E(f"{d}：第 {i+1} 站「{s['id']}」不在 plan.json 的 places 裡")
        for k in ("at", "by"):
            if s.get(k) and not re.fullmatch(r"\d{2}:\d{2}", s[k]): E(f"{d}：第 {i+1} 站 {k}={s[k]} 不是 HH:MM")
        if i and not leg_of(v["stops"][i-1]["id"], s["id"], s.get("via", "drive")):
            W(f"{d}：{v['stops'][i-1]['id']}→{s['id']} 沒有路段快取，網站先用直線估算（在編輯器儲存一次會自動補）")
    for mode in ("normal", "snow"):
        for x in schedule(d, mode):
            if x["late"]: W(f"{d}：{'下雪' if mode=='snow' else '一般'}路況下「{PLAN['places'].get(x['id'],{}).get('name',x['id'])}」會晚 {x['late']} 分（{hm(x['arr'])} 到）")

# 1. 三份資料的日期要一致
for d in days:
    if d not in dayplan: E(f"{d}：trip.js 有這天，plan.json 沒有站點")
    if d not in scenes: W(f"{d}：scenes.js 沒有海報，首頁會顯示空白海報")
for d in dayplan:
    if d not in days: E(f"{d}：plan.json 有站點，但 trip.js 已經沒有這天")
for d in scenes:
    if d not in days: E(f"{d}：scenes.js 有腳本，但 trip.js 已經沒有這天")

# 2. 單日頁要存在，而且日期對
for d in days:
    mmdd = d[5:].replace("-", "")
    f = os.path.join(ROOT, "day", mmdd, "index.html")
    if not os.path.exists(f): E(f"{d}：缺 day/{mmdd}/index.html（執行 tools/build_days.py）"); continue
    html = open(f, encoding="utf-8").read()
    t = next(x for x in trip["days"] if x["date"] == d)
    if f'window.DAY = "{d}"' not in html: E(f"{d}：day/{mmdd}/index.html 的日期不對")
    if t["title"] not in html: W(f"{d}：day/{mmdd}/index.html 的標題跟 trip.js 不同（重跑 build_days.py）")
for mmdd in (os.listdir(os.path.join(ROOT, "day")) if os.path.isdir(os.path.join(ROOT, "day")) else []):
    if f"2027-{mmdd[:2]}-{mmdd[2:]}" not in days: E(f"day/{mmdd}/ 多出來了，行程裡沒有這天")

# 3. 序幕：每一幕指的站點要存在；圖片要存在；海報圖片要存在
img_root = os.path.join(ROOT, "assets", "img")
for d, sc in scenes.items():
    if d not in dayplan: continue
    stop_ids = [s["id"] for s in dayplan[d]["stops"]]
    p = (sc.get("poster") or {}).get("img")
    if not p: W(f"{d}：沒有海報圖片")
    elif not os.path.exists(os.path.join(img_root, p)): E(f"{d}：海報圖片不存在 assets/img/{p}")
    for i, s in enumerate(sc.get("scenes") or [], 1):
        if s.get("stop") and s["stop"] not in stop_ids:
            E(f"{d}：序幕第 {i} 幕指向站點「{s['stop']}」，但當天站點只有 {stop_ids}（行程改了，腳本沒跟上）")
        for im in ([s["img"]] if s.get("img") else []) + list(s.get("imgs") or []):
            if not os.path.exists(os.path.join(img_root, im)): E(f"{d}：序幕第 {i} 幕圖片不存在 assets/img/{im}")
        if s.get("video") and not os.path.exists(os.path.join(ROOT, "assets", "video", s["video"])):
            E(f"{d}：序幕第 {i} 幕影片不存在 assets/video/{s['video']}")
    covered = {s.get("stop") for s in sc.get("scenes") or []}
    if sc.get("scenes"):
        missing = [x for x in stop_ids if x not in covered and place_of.get(x) and not str(place_of.get(x)).startswith("hotels/")]
        if missing: W(f"{d}：序幕沒有提到這些站點：{missing}")
    else:
        W(f"{d}：還沒有完整序幕（目前用標題卡＋海報兩幕）")

# 4. dayplan 的站點 id 都要有照片對應（或明確標 null）
for d in days:
    for s in dayplan.get(d, {}).get("stops", []):
        if s["id"] not in place_of: W(f"{d}：站點「{s['id']}」沒有在 PLACE_OF_STOP 裡，不知道照片放哪個資料夾")

# 5. 照片資料夾：行程會去、但還沒有冬天照片的地方；以及資料夾裡多出來的日期
photo_root = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(ROOT), "hokkaido-photos-web")
if os.path.isdir(photo_root):
    IMG = re.compile(r"\.(jpe?g|png|webp|heic)$", re.I)
    def count(folder):
        p = os.path.join(photo_root, folder)
        return len([f for f in os.listdir(p) if IMG.search(f)]) if os.path.isdir(p) else -1
    needed = {}
    for d in days:
        for s in dayplan.get(d, {}).get("stops", []):
            slug = place_of.get(s["id"])
            if slug: needed.setdefault(slug, []).append(d[5:])
    for slug, ds in sorted(needed.items()):
        n = count(slug if slug.startswith("hotels/") else "places/" + slug) if os.path.isdir(os.path.join(photo_root, "places")) else count(slug)
        if n < 0: n = count(slug)
        if n <= 0: W(f"照片：{slug} 沒有照片（{', '.join(sorted(set(ds)))} 會去）")
    dd = os.path.join(photo_root, "days")
    if os.path.isdir(dd):
        for mmdd in sorted(os.listdir(dd)):
            if not re.fullmatch(r"\d{4}", mmdd): continue
            if f"2027-{mmdd[:2]}-{mmdd[2:]}" not in days: E(f"照片：days/{mmdd}/ 這天已經不在行程裡，裡面的照片要搬走")
            elif count("days/" + mmdd) <= 0: W(f"照片：days/{mmdd}/ 還是空的")
else:
    W(f"找不到照片資料夾 {photo_root}，略過照片檢查")

# 餐廳資料（data/food.js）：有座標、地區對得上住宿、「預計」關鍵字真的對到某一天
food = load_js("data/food.js", "FOOD") or []
food_areas = load_js("data/food.js", "FOOD_AREAS") or {}
all_areas = {a for v in food_areas.values() for a in v}
all_meals = "".join("".join(d.get("meals", [])) for d in trip["days"])
seen = set()
for f in food:
    if f["id"] in seen: E(f"food.js：id {f['id']} 重複")
    seen.add(f["id"])
    if not (41 < f.get("lat", 0) < 46 and 139 < f.get("lon", 0) < 146): E(f"food.js：{f['name']} 座標不在北海道")
    if f.get("area") not in all_areas: E(f"food.js：{f['name']} 地區「{f.get('area')}」不在 FOOD_AREAS 裡，日頁不會顯示")
    if f.get("key") and f["key"] not in all_meals: W(f"food.js：{f['name']} 的 key「{f['key']}」沒有對到任何一天的餐點，「今天預計」不會亮")
for d in trip["days"]:
    for i, m in enumerate(d.get("meals", [])):
        if i == 0 and "山上" in m: continue
        if not any(f.get("key") and f["key"] in m for f in food) and not re.search(r"自理|便利商店|超市|飯店|民宿|機場|機上|飛機|Villa|簡單|自己煮|路上|途中|雪場|附近|市區|^回", m):
            W(f"{d['date']}：餐點「{m}」在 food.js 沒有對應的店（美食地圖不會標「預計」）")

# 景點收藏（data/spots.js）：狀態合法、正式行程的 stop 真的在 plan.json、座標在北海道、id 不重複
spots = load_js("data/spots.js", "SPOTS") or []
sp_seen = set()
for s in spots:
    if s["id"] in sp_seen: E(f"spots.js：id {s['id']} 重複")
    sp_seen.add(s["id"])
    if s.get("status") not in ("plan", "saved", "check"): E(f"spots.js：{s['name']} 的 status「{s.get('status')}」不是 plan/saved/check")
    if not (41 < s.get("lat", 0) < 46 and 139 < s.get("lon", 0) < 146): E(f"spots.js：{s['name']} 座標不在北海道")
    if s.get("status") == "plan":
        if not s.get("stop") or s["stop"] not in PLAN["places"]: E(f"spots.js：{s['name']} 標成正式行程，但 stop「{s.get('stop')}」不在 plan.json")
        elif s.get("day") and not any(st["id"] == s["stop"] for st in PLAN["days"].get(s["day"], {}).get("stops", [])): E(f"spots.js：{s['name']} 寫 {s['day']}，但那天的行程沒有 {s['stop']}")
    elif s.get("stop") and s["stop"] in PLAN["places"] and any(s["stop"] in [st["id"] for st in d["stops"]] for d in PLAN["days"].values()):
        W(f"spots.js：{s['name']} 其實已經在正式行程裡（{s['stop']}），status 應改成 plan")

print("=== 行程一致性檢查 ===")
print(f"trip.js {len(days)} 天 · plan.json {len(dayplan)} 天 · scenes.js {len(scenes)} 天 · 完整序幕 {sum(1 for v in scenes.values() if v.get('scenes'))} 天 · food.js {len(food)} 家 · spots.js {len(spots)} 個景點")
for e in errors: print("✗", e)
for w in warns: print("△", w)
print(f"錯誤 {len(errors)}，警告 {len(warns)}")
sys.exit(1 if errors else 0)

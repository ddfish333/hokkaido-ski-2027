#!/usr/bin/env python3
"""行程一致性檢查。行程的唯一事實來源是 data/trip.js（每天做什麼）與 data/dayplan.js（每天的站點與車程）。
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
dayplan = load_js("data/dayplan.js", "DAYPLAN")
scenes = load_js("data/scenes.js", "SCENES")
place_of = load_js("data/scenes.js", "PLACE_OF_STOP")
days = [d["date"] for d in trip["days"]]
errors, warns = [], []
E = errors.append; W = warns.append

# 1. 三份資料的日期要一致
for d in days:
    if d not in dayplan: E(f"{d}：trip.js 有這天，dayplan.js 沒有站點")
    if d not in scenes: W(f"{d}：scenes.js 沒有海報，首頁會顯示空白海報")
for d in dayplan:
    if d not in days: E(f"{d}：dayplan.js 有站點，但 trip.js 已經沒有這天")
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
        if s.get("img") and not os.path.exists(os.path.join(img_root, s["img"])):
            E(f"{d}：序幕第 {i} 幕圖片不存在 assets/img/{s['img']}")
    covered = {s.get("stop") for s in sc.get("scenes") or []}
    if sc.get("scenes"):
        missing = [x for x in stop_ids if x not in covered and place_of.get(x)]
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

print("=== 行程一致性檢查 ===")
print(f"trip.js {len(days)} 天 · dayplan.js {len(dayplan)} 天 · scenes.js {len(scenes)} 天 · 完整序幕 {sum(1 for v in scenes.values() if v.get('scenes'))} 天")
for e in errors: print("✗", e)
for w in warns: print("△", w)
print(f"錯誤 {len(errors)}，警告 {len(warns)}")
sys.exit(1 if errors else 0)

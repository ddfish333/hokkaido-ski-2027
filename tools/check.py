#!/usr/bin/env python3
"""行程一致性檢查。行程的唯一事實來源是 data/plan.json（站點、停留、固定時間；編輯器寫入）與 data/trip.js（每天的標題、吃什麼、提醒）。
其他東西（序幕腳本、海報、照片、單日頁）都應該跟著它們走；這支程式找出沒跟上的地方。

用法：python3 tools/check.py [照片資料夾路徑]
  照片資料夾預設找 ../hokkaido-photos-web（在 Mac 上）；找不到就略過照片檢查。
回傳非 0 = 有錯（網站會壞或內容不一致）；警告不影響回傳值。"""
import json, os, re, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
from plan_lib import TRIP as trip, PLAN, LEGS, load_js, mins, hm, leg_of, schedule, fill, hardcoded_times, TokenError, TOKEN
scenes = load_js("data/scenes.js", "SCENES")
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


# 0b. 事實只能有一個來源 ——
#   (a) trip.js 每天不能再有 plan／legs 陣列（時間表只在 plan.json）
#   (b) 標題、副標、提醒、餐點、序幕文字、站點備註裡不能寫死 HH:MM，要用 {t:站點}／{dep:站點}／{open:站點}／{sun:set}／{T:欄位} 標記
#   (c) 站點備註、序幕不能寫價格（¥／NT$），價格只住在 spots.js／food.js／trip.js 的 places／resorts
#   (d) 標記一定要換得出來
#   (e) 金額不能寫「¥5–6 千」這種換算不了的格式；內容不能出現內部用語「Claude」
MONEY_BAD = re.compile(r"¥\s?[\d,.]+(?:\s*[–-]\s*¥?[\d,.]+)?\s*千")
# 說明類欄位（可能含 **粗體** 或標記）在 JS 裡只准走 em()
PROSE_ESC = re.compile(r"\besc\(\w+\.(?:what|caution|parking|photo|note|why|tips|kids|gear|notes|alert|book|sub|line|hours|scale|fee|entry|lessons|rec|seasonNote|tier|tixSeason)\b")
def text_fields():
    for d in trip["days"]:
        for k in ("title", "sub", "alert"):
            if d.get(k): yield f"trip.js {d['date']} {k}", d[k], d["date"], None, True
    for d, sc in scenes.items():
        if (sc.get("poster") or {}).get("line"): yield f"scenes.js {d} poster.line", sc["poster"]["line"], d, None, True
        for i, s in enumerate(sc.get("scenes") or [], 1):
            for k in ("h", "s", "t", "eyebrow"):
                if isinstance(s.get(k), str): yield f"scenes.js {d} 第 {i} 幕 {k}", s[k], d, s.get("stop"), True
    for d, v in PLAN["days"].items():
        for i, s in enumerate(v["stops"], 1):
            if s.get("note"): yield f"plan.json {d} 第 {i} 站 {s['id']} note", s["note"], d, s["id"], True
            for k, t in (s.get("altNotes") or {}).items(): yield f"plan.json {d} 第 {i} 站 altNotes.{k}", t, d, s["id"], True
    for b in trip.get("bases", []):
        for k in ("checkin", "checkout"):  # 官方入住時間是事實，可以寫死；但裡面的標記一定要換得出來
            if b.get(k) and "{" in str(b[k]): yield f"trip.js bases {b['id']} {k}", b[k], b["from"], None, False
        for i, n in enumerate(b.get("notes") or []): yield f"trip.js bases {b['id']} notes[{i}]", n, b["from"], None, True
    for i, p in enumerate(load_js("data/food.js", "FOOD_PICKS") or []):
        for k in ("why", "book", "what"):
            if p.get(k): yield f"food.js FOOD_PICKS[{i}] {p.get('pick') or p.get('what')} {k}", p[k], p["date"], None, True
for d in trip["days"]:
    for k in ("plan", "legs"):
        if k in d: E(f"trip.js {d['date']}：還有 {k} 陣列——時間表只能在 plan.json，請刪掉")
for where, text, d, ctx, no_fixed in text_fields():
    hc = hardcoded_times(text) if no_fixed else []
    if hc: E(f"{where}：寫死的時間 {hc}，改用標記（{{t:站點}}／{{open:站點}}／{{sun:set}}／{{T:欄位}}）→「{text[:60]}」")
    dur = re.findall(r"[一二三四五六七八九十兩半\d]+\s*(?:分鐘|分)(?:就到|到家|車程|的車程|就回)|走\s?\d+\s?分", TOKEN.sub("", str(text)))
    hc_party = re.findall(r"\b[89] 人", TOKEN.sub("", str(text)))
    if hc_party: E(f"{where}：人數寫死 {hc_party}，改用 {{party}}（保姆在的日子 9 人、之後 8 人會自己換）→「{text[:60]}」")
    if dur: E(f"{where}：寫死的車程 {dur}，改用 {{leg:起點|終點}} 標記（會跟著路況模式變）→「{text[:60]}」")
    if (where.startswith("plan.json") or where.startswith("scenes.js")) and re.search(r"¥|NT\$", text): E(f"{where}：不要在這裡寫價格，價格只放地點卡（spots／food／places／resorts）→「{text[:60]}」")
    try: fill(text, d, ctx, strict=True)
    except TokenError as ex: E(f"{where}：{ex}")
    if "Claude" in text: E(f"{where}：內容出現「Claude」")
def walk(o, path):
    if isinstance(o, str):
        if MONEY_BAD.search(o): E(f"{path}：金額「{MONEY_BAD.search(o).group(0)}」換算不了，寫成 ¥5,000–6,000")
        clauses = [c.strip() for c in re.split(r"[，。；：！？、（）()—\n]", o) if len(c.strip()) >= 6]
        dup = {c for c in clauses if clauses.count(c) > 1}
        if dup: E(f"{path}：同一段文字裡有重複的句子 {sorted(dup)}（改了一半忘了刪另一半）")
        if "Claude" in o and not path.endswith("note") and "comment" not in path: E(f"{path}：內容出現「Claude」，同行的人會看到")
    elif isinstance(o, dict):
        for k, v in o.items(): walk(v, f"{path}.{k}")
    elif isinstance(o, list):
        for i, v in enumerate(o): walk(v, f"{path}[{i}]")
walk(trip, "trip.js"); walk(scenes, "scenes.js"); walk(PLAN, "plan.json")
walk(load_js("data/food.js", "FOOD") or [], "food.js FOOD"); walk(load_js("data/food.js", "FOOD_PICKS") or [], "food.js FOOD_PICKS"); walk(load_js("data/spots.js", "SPOTS") or [], "spots.js")
for f in ("assets/app.js", "assets/foodmap.js", "assets/spotmap.js", "assets/skimap.js", "assets/film.js", "assets/editor.js", "index.html", "food/index.html", "spots/index.html", "ski/index.html", "plan/index.html", "tools/day.template.html"):
    if not os.path.exists(os.path.join(ROOT, f)): continue
    for ln, line in enumerate(open(os.path.join(ROOT, f), encoding="utf-8"), 1):
        if "Claude" in line and ("'" in line or '"' in line) and "Co-Authored" not in line and not line.strip().startswith(("/*", "*", "//")): E(f"{f}:{ln}：畫面文字出現「Claude」")
        m = PROSE_ESC.search(line) if f != "assets/editor.js" else None  # 編輯器的輸入框要原樣
        if m: E(f"{f}:{ln}：說明文字 {m.group(0)}） 只用 esc()，會把 **粗體** 原樣印出來——改用 em()")
        if f == "assets/film.js" and 'esc(sc.h)' in line: E(f"{f}:{ln}：序幕的 h 可以有 <br>，不要用 esc()")

# 0c. 開門／關門：抵達早於開門會乾等、離開晚於關門是來不及；長時間停留又沒有 at／by／open 的站點提醒一下
resort_pts = [(r["lat"], r["lon"]) for r in trip.get("resorts", [])] + [(b["lat"], b["lon"]) for b in trip.get("bases", [])]
def is_resort_or_base(pid):
    pl = PLAN["places"].get(pid, {})
    return "滑雪場" in pl.get("name", "") or any(abs(pl.get("lat", 0) - la) < 0.01 and abs(pl.get("lon", 0) - lo) < 0.01 for la, lo in resort_pts)
for d, v in PLAN["days"].items():
    for mode in ("normal", "snow"):
        for s, x in zip(v["stops"], schedule(d, mode)):
            pl = PLAN["places"].get(s["id"], {}); nm = pl.get("name", s["id"]); lab = "下雪" if mode == "snow" else "一般"
            if pl.get("open") and not s.get("at") and not is_resort_or_base(s["id"]) and x["arr"] + 5 < mins(pl["open"]):
                W(f"{d}：{lab}路況 {hm(x['arr'])} 到「{nm}」，但 {pl['open']} 才開，要等 {mins(pl['open']) - x['arr']} 分（給這站加 at 或調前面的停留）")
            if pl.get("close") and x["stay"] and x["dep"] > mins(pl["close"]):
                W(f"{d}：{lab}路況在「{nm}」待到 {hm(x['dep'])}，但 {pl['close']} 關門")
    for i, s in enumerate(v["stops"], 1):
        if int(s.get("stay") or 0) >= 180 and not (s.get("at") or s.get("by")) and not is_resort_or_base(s["id"]) and not PLAN["places"].get(s["id"], {}).get("open"):
            W(f"{d}：第 {i} 站「{PLAN['places'].get(s['id'], {}).get('name', s['id'])}」停 {s['stay']} 分又沒有固定時間——是不是把別的事塞在同一站？拆成兩站比較清楚")

# 0d. 防止用舊檔案蓋掉別人的修正：這些修正一定要在（被蓋掉就是有人沒先拉最新版）
GUARDS = {
    "assets/app.js": [("showOrigin(", "換出發地時地圖飛回該區（10/26）"), ("inHokkaido(", "不在北海道時定位不把地圖飛走（10/26）"), ("driveTargets(", "車程表跟著圖層和地圖範圍走（10/26）"), ("Plan.fill", "文字時間標記（10/26）")],
    "assets/film.js": [("Plan.fill", "序幕時間標記（10/26）"), ("cursor", "同一站一天兩次照順序取時間（10/26）")],
    "assets/plan.js": [("P.fill", "時間標記解析（10/26）")],
    "assets/skimap.js": [("Plan.fill", "滑雪地圖時間標記（10/26）")],
}
for f, marks in GUARDS.items():
    fp = os.path.join(ROOT, f)
    if not os.path.exists(fp): continue
    src = open(fp, encoding="utf-8").read()
    for mark, what in marks:
        if mark not in src: E(f"{f}：找不到「{mark}」——「{what}」這個修正被舊檔案蓋掉了，先 git pull 再改")

# 0e. 手機效能底線（10/26 iPhone 序幕閃黑塊、整頁重新載入的根本原因）——這幾種寫法一出現就擋
#   (a) backdrop-filter（毛玻璃）只准用在 .topbar／.dayswitch 兩條固定列；疊在影片、動畫、地圖上會每格重算，iPhone 會閃、會爆記憶體
#   (b) 序幕照片層不准 will-change（會讓每一幕的照片都常駐一張全螢幕點陣圖）
#   (c) 序幕只掛前後一幕的影像（keepAround／detach）、路線圖畫在 canvas、手機不載 1080p、單日頁 WebGL 地圖捲到附近才建
for f in sorted(os.listdir(os.path.join(ROOT, "assets"))):
    if not f.endswith(".css"): continue
    css = open(os.path.join(ROOT, "assets", f), encoding="utf-8").read()
    for m in re.finditer(r"([^{}]+)\{([^{}]*)\}", re.sub(r"/\*.*?\*/", "", css, flags=re.S)):
        sel, body = m.group(1).strip(), m.group(2)
        if re.search(r"(?<![\w-])(-webkit-)?backdrop-filter\s*:", body) and not re.fullmatch(r"\.(topbar|dayswitch)", sel.split("\n")[-1].strip()):
            E(f"assets/{f}：「{sel.splitlines()[-1].strip()}」用了 backdrop-filter——只有 .topbar／.dayswitch 可以用，其他改成不透明一點的底色")
        if sel.endswith(".film .ph") and "will-change" in body:
            E(f"assets/{f}：.film .ph 不能加 will-change（每一幕照片都會常駐一張全螢幕圖層）")
_film = open(os.path.join(ROOT, "assets/film.js"), encoding="utf-8").read()
if "createElementNS" in _film: E("assets/film.js：序幕路線圖又出現 SVG（createElementNS）——要畫在 canvas 上")
if re.search(r"devicePixelRatio[^;\n]*>\s*1500", _film) and "Math.min(innerWidth, innerHeight) >= 700" not in _film:
    E("assets/film.js：1080p 只能看 CSS 短邊（≥ 700）決定，不能只看裝置像素（iPhone 3 倍螢幕會被當成大螢幕）")
for f, marks in {"assets/film.js": [("keepAround(", "序幕只掛前後一幕的照片影片（10/26）"), ("v.removeAttribute(\"src\")", "離開的影片釋放解碼器（10/26）"), ("drawMap(", "路線圖畫在 canvas（10/26）"), ("Math.min(innerWidth, innerHeight) >= 700", "手機不載 1080p（10/26）")],
                 "assets/app.js": [("whenNear($(\"#mapcanvas\"), makeMap)", "單日頁 WebGL 地圖捲到附近才建（10/26）")]}.items():
    src = open(os.path.join(ROOT, f), encoding="utf-8").read()
    for mark, what in marks:
        if mark not in src: E(f"{f}：找不到「{mark}」——「{what}」這個修正被拿掉或被舊檔案蓋掉了")

# 0e2. 「這站也可以換成…」：替代地點要在 plan.json places 裡，說明只寫給 alts 或目前這站
for d, v in PLAN["days"].items():
    for i, s in enumerate(v["stops"], 1):
        for a in s.get("alts") or []:
            if a not in PLAN["places"]: E(f"{d} 第 {i} 站：替代地點「{a}」不在 plan.json places")
            elif not leg_of(v["stops"][i-2]["id"], a, "drive") if i > 1 else False: W(f"{d} 第 {i} 站：替代「{a}」從上一站沒有路段快取，車程用直線估算")
        for k in (s.get("altNotes") or {}):
            if k != s["id"] and k not in (s.get("alts") or []): W(f"{d} 第 {i} 站：altNotes 有「{k}」但它不是這站或替代地點")

# 0f. 編輯器儲存的底線（10/26：存了不知道有沒有存、要等一分鐘、多人同時改會互蓋）
#   (a) 單日頁的靜態 HTML 不能含 plan.json 推算出來的東西，否則編輯器一存，GitHub 檢查就紅叉、頁面標題變舊
#   (b) 儲存＝一個 commit、快轉更新 main、存完讀回比對；載入內容和版本號一次拿；以天為單位三方合併；有金鑰的手機直接讀 GitHub 最新版
PLAN_TOKEN = re.compile(r"\{(t|dep|at|by|open|close|leg)[:}|]")
for d in trip["days"]:
    if PLAN_TOKEN.search(d.get("title", "")): E(f"{d['date']}：標題用了行程推算的標記（{d['title']}）——標題會寫進靜態頁面，編輯器改時間後會對不上；推算的時間放到 sub 或提醒")
if "{{SUB}}" in open(os.path.join(ROOT, "tools/day.template.html"), encoding="utf-8").read():
    E("tools/day.template.html：靜態頁面不能放 {{SUB}}（裡面有推算時間，編輯器一存就和頁面不一致）")
for f, marks in {"assets/editor.js": [("/git/refs/heads/main", "一次儲存一個 commit、快轉更新（10/26）"), ("merge3(", "多人同時改以天為單位合併（10/26）"), ("readPlan(commitSha)", "存完讀回比對才顯示已儲存（10/26）"), ("stopsSig(", "改數字只更新字、不重畫正在輸入的欄位（10/26 時間轉輪會跳掉）"), ("function candidates(", "新增站點用選的，資料讀 trip／spots／food（10/26）")],
                 "assets/plan.js": [("fromGitHub(", "有金鑰的手機直接讀 GitHub 最新版（10/26）"), ("snow13-saved", "剛存的手機先用自己存的版本（10/26）")],
                 "plan/index.html": [("id=\"toast\"", "儲存狀態固定在畫面底部（10/26）")],
                 "assets/app.js": [("Plan.legHTML(", "路段一行（交通方式顏色）單日頁和編輯器共用一份（10/26）"), ("Plan.mealCardHTML(", "吃什麼卡讀 FOOD_PICKS（10/26）")],
                 "assets/foodmap.js": [("Plan.picksHTML(", "美食地圖的這天怎麼吃讀同一份（10/26）")],
                 "tools/build_days.py": [("def sync_tabbar", "手機底部分頁列由 build_days 一份產生（10/26）")],
                 "assets/spotmap.js": [("Plan.followList(", "手機捲清單地圖跟著走（10/26）"), ("cooperativeGestures: !Plan.touch", "手機一指拖地圖（10/26）")]}.items():
    src = open(os.path.join(ROOT, f), encoding="utf-8").read()
    for mark, what in marks:
        if what and mark not in src: E(f"{f}：找不到「{mark}」——「{what}」這個修正被拿掉或被舊檔案蓋掉了")
for f in ("assets/app.js", "assets/foodmap.js", "assets/skimap.js", "assets/spotmap.js"):
    if "cooperativeGestures: true" in open(os.path.join(ROOT, f), encoding="utf-8").read(): E(f"{f}：cooperativeGestures 要用 !Plan.touch（手機一指就能拖地圖，寫死 true 手機會像卡住）")

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
    if fill(t["title"], d) not in html: W(f"{d}：day/{mmdd}/index.html 的標題跟 trip.js 不同（重跑 build_days.py）")
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
        sid = re.sub(r"#\d$", "", s.get("stop") or "")  # stop: "canal#2" ＝ 當天第二次到 canal
        if sid and sid not in stop_ids:
            E(f"{d}：序幕第 {i} 幕指向站點「{s['stop']}」，但當天站點只有 {stop_ids}（行程改了，腳本沒跟上）")
        if sid and "#" in (s.get("stop") or "") and stop_ids.count(sid) < int(s["stop"][-1]):
            E(f"{d}：序幕第 {i} 幕指向「{s['stop']}」，但當天只去 {sid} {stop_ids.count(sid)} 次")
        for im in ([s["img"]] if s.get("img") else []) + list(s.get("imgs") or []):
            if not os.path.exists(os.path.join(img_root, im)): E(f"{d}：序幕第 {i} 幕圖片不存在 assets/img/{im}")
        if s.get("video") and not os.path.exists(os.path.join(ROOT, "assets", "video", s["video"])):
            E(f"{d}：序幕第 {i} 幕影片不存在 assets/video/{s['video']}")
    covered = {re.sub(r"#\d$", "", s.get("stop") or "") for s in sc.get("scenes") or []}
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

# 景點的 day 欄位要和行程一致（同一個 stop id 在 plan.json 哪一天）
stop_day = {}
for d, v in PLAN["days"].items():
    for s in v["stops"]: stop_day.setdefault(s["id"], d)
for sp in load_js("data/spots.js", "SPOTS") or []:
    if sp.get("stop") and sp.get("day") and stop_day.get(sp["stop"]) and stop_day[sp["stop"]] != sp["day"]:
        E(f"spots.js：{sp['name']} 寫 day {sp['day']}，但行程裡 {sp['stop']} 是 {stop_day[sp['stop']]}（改 spots.js 的 day）")
    if sp.get("stop") and not stop_day.get(sp["stop"]) and sp.get("status") == "plan":
        W(f"spots.js：{sp['name']} 標 plan 但行程裡沒有站點 {sp['stop']}")

# 餐廳資料（data/food.js）：有座標、地區對得上住宿、「預計」關鍵字真的對到某一天
food = load_js("data/food.js", "FOOD") or []
food_areas = load_js("data/food.js", "FOOD_AREAS") or {}
all_areas = {a for v in food_areas.values() for a in v}
picks_all = load_js("data/food.js", "FOOD_PICKS") or []
picked_ids = {i for p in picks_all for i in [p.get("pick")] + (p.get("backup") or []) if i}
seen = set()
for f in food:
    if f["id"] in seen: E(f"food.js：id {f['id']} 重複")
    seen.add(f["id"])
    if not (41 < f.get("lat", 0) < 46 and 139 < f.get("lon", 0) < 146): E(f"food.js：{f['name']} 座標不在北海道")
    if f.get("area") not in all_areas and f["id"] not in picked_ids: E(f"food.js：{f['name']} 地區「{f.get('area')}」不在 FOOD_AREAS 裡，也沒有被任何一餐選到，日頁不會顯示")
    if "key" in f: E(f"food.js：{f['name']} 還有 key——「今天預計」改由 FOOD_PICKS 決定，key 刪掉")
# 餐點的唯一來源是 FOOD_PICKS（10/26：trip.js 自由文字和美食地圖對不起來，「早上又機上又 AEON」）
for d in trip["days"]:
    for k in ("breakfast", "meals"):
        if k in d: E(f"trip.js {d['date']}：還有 {k}——餐點只寫在 food.js FOOD_PICKS，這裡刪掉")
    have = {p["slot"] for p in picks_all if p["date"] == d["date"]}
    for slot, name in (("breakfast", "早餐"), ("lunch", "午餐"), ("dinner", "晚餐")):
        if slot not in have: E(f"{d['date']}：FOOD_PICKS 沒有{name}——每天三餐都要寫（不是餐廳就 pick: null＋what）")
    stops_today = [s["id"] for s in PLAN["days"].get(d["date"], {}).get("stops", [])]
    for p in picks_all:
        if p["date"] != d["date"]: continue
        if not p.get("pick") and not p.get("what"): E(f"{d['date']} {p['slot']}：pick 是空的就要寫 what（例如「機上」「小木屋自己煮」）")
        if p.get("stop") and p["stop"] not in stops_today: W(f"{d['date']} {p['slot']}：stop「{p['stop']}」不是這天的站點，時間帶不出來")
        if p["slot"] not in ("breakfast", "lunch", "snack", "dinner", "late"): E(f"{d['date']}：FOOD_PICKS slot「{p['slot']}」不認得")
dup = {}
for p in picks_all: dup.setdefault((p["date"], p["slot"]), 0); dup[(p["date"], p["slot"])] += 1
for (dt, sl), n in dup.items():
    if n > 1: E(f"{dt} {sl}：FOOD_PICKS 同一餐寫了 {n} 次")

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

picks = load_js("data/food.js", "FOOD_PICKS") or []
food_ids = {f["id"] for f in food}

# 0g. 卡片文字裡不能自己寫「從住宿多少分」和「日落幾點」——這兩個都由程式算（Plan.travelMin／{sun:set}），
#     手寫的數字各頁會不一樣（10/26 第五輪：景點頁札幌國際 20 分 vs 雪場頁 50 分、日落 16:20 vs 16:18）
import math
def _hav(a, b):
    k = math.pi / 180; dla = (b["lat"] - a["lat"]) * k; dlo = (b["lon"] - a["lon"]) * k
    h = math.sin(dla / 2) ** 2 + math.cos(a["lat"] * k) * math.cos(b["lat"] * k) * math.sin(dlo / 2) ** 2
    return 2 * 6371 * math.asin(math.sqrt(h))
BASE_MIN = re.compile(r"(?:FAV LUX|山鄉|小木屋|薄野(?!站)|飯店|住宿|市區)[^。；，、]{0,10}?(?:約|只要|要)?\s?\d+\s?分")
SUNSET = re.compile(r"日落[約 ]*\d{1,2}:\d\d")
for lst, name in ((spots, "spots.js"), (food, "food.js")):
    for x in lst:
        if x.get("kind") == "停車": continue  # 停車場卡片的重點就是「離飯店走幾分」，這個允許手寫
        for k in ("what", "caution", "parking", "photo", "hours", "price"):
            t = x.get(k)
            if not isinstance(t, str): continue
            m = BASE_MIN.search(TOKEN.sub("", t))
            if m: E(f"{name}：{x['name']} {k} 自己寫了車程「{m.group(0)}」——卡片上「從住宿開多久」由程式算，文字裡刪掉")
            m = SUNSET.search(t)
            if m: E(f"{name}：{x['name']} {k} 寫死日落「{m.group(0)}」，改成 {{sun:set}}（卡片有 day 才換得出來）")
            if "{sun:" in t and not x.get("day"): E(f"{name}：{x['name']} {k} 用了 {{sun:}} 但卡片沒有 day，換不出來")
# 0i. 導航（10/26 第六輪：北之峰、Fenix、富良野區、砂川 SA 偏了 1–5 km，司機照導航會開錯地方）
#   (a) 同一個地方在不同檔案的座標要一致（150 m 內）：plan.json 是唯一來源，trip.js places／resorts／gates、food.js、spots.js 都要跟它對
#       對法：id 相同、Google 地點 id（pid／g.pid）相同、或名稱相同
#   (b) 開車到的站點要有核對過的 Google 地點（pid 或 park.pid）；沒有的列警告
#   (c) legs.json 的路段起訖要和現在的導航點一致（地點或停車場改了就要重算：python3 tools/refresh_legs.py）
from plan_lib import leg_stale, drive_pt
def _nm(x): return re.sub(r"（.*?）|\(.*?\)|\s", "", x or "")
_pid_of = {}
for k, p in PLAN["places"].items():
    if p.get("pid"): _pid_of[p["pid"]] = (k, p)
    if (p.get("park") or {}).get("pid"): _pid_of[p["park"]["pid"]] = (k + ".park", p["park"])
_by_name = {}
for k, p in PLAN["places"].items():
    for n in (p.get("name"), p.get("ja")):
        if _nm(n): _by_name.setdefault(_nm(n), (k, p))
def _cross(src, x, xid=None):
    if not x or x.get("lat") is None: return
    hits = []
    if xid and xid in PLAN["places"]: hits.append((xid, PLAN["places"][xid]))
    pid = x.get("pid") or (x.get("g") or {}).get("pid")
    if pid and pid in _pid_of: hits.append(_pid_of[pid])
    for n in (x.get("name"), x.get("ja")):
        if _nm(n) in _by_name: hits.append(_by_name[_nm(n)])
    seen = set()
    for k, p in hits:
        if k in seen: continue
        seen.add(k); d = _hav(p, x)
        if d > 0.15: E(f"{src}「{x.get('name')}」和 plan.json「{p.get('name')}」（{k}）是同一個地方，座標卻差 {d*1000:.0f} m——以 plan.json 為準改過來（導航會導錯）")
for x in trip.get("places", []): _cross("trip.js places", x)
for r in trip.get("resorts", []):
    for sid in r.get("stops") or []:
        if sid in PLAN["places"] and _hav(PLAN["places"][sid], r) > 0.15 and sid == (r.get("stops") or [None])[0]:
            E(f"trip.js 雪場 {r['name']} 的座標和 plan.json 站點 {sid} 差 {_hav(PLAN['places'][sid], r)*1000:.0f} m（雪場頁導航會導錯）")
    for g in r.get("gates") or []:
        _cross(f"trip.js 雪場 {r['name']} 入口", g, g.get("stop"))
        if g.get("approx") and any(st["id"] in (r.get("stops") or []) for v in PLAN["days"].values() for st in v["stops"]):
            W(f"trip.js 雪場 {r['name']} 入口「{g['name']}」位置概略，但行程有排這座雪場——去前核對")
for x in food: _cross("food.js", x, x["id"])
for x in spots: _cross("spots.js", x, x["id"])  # stop 只表示排在哪一站，不一定是同一個點（堺町通 → 運河那天）
_unchecked = sorted({st["id"] for v in PLAN["days"].values() for i, st in enumerate(v["stops"]) if i and st.get("via", "drive") == "drive"
                     and not (PLAN["places"][st["id"]].get("pid") or (PLAN["places"][st["id"]].get("park") or {}).get("pid"))})
if _unchecked: W(f"開車到的站點還沒核對 Google 地點（plan.json places 加 pid 或 park.pid）：{_unchecked}")
_stale = [k for k, L in LEGS.items() if leg_stale(k, L)]
if _stale: E(f"這些路段的起訖和現在的導航點對不上（地點或停車場改過）：{_stale}——跑 python3 tools/refresh_legs.py")

# 0h. plan.json 的站點 id 和 spots.js／food.js 的 id 相同時，必須是同一個地方（300 m 內）——
#     撞名會讓單日頁抓到別張卡（10/26：temiya 溫泉抓到舊手宮線「全天・免費」）
for lst, name in ((spots, "spots.js"), (food, "food.js")):
    for x in lst:
        pl = PLAN["places"].get(x["id"])
        if pl and pl.get("lat") and _hav(pl, x) > 0.3:
            E(f"{name}：id「{x['id']}」和 plan.json 的站點「{pl['name']}」撞名但不是同一個地方（差 {_hav(pl, x):.1f} km），其中一邊改 id")
for pk in picks:
    if pk["date"] not in days: E(f"food.js FOOD_PICKS：{pk['date']} 不在行程裡")
    for i in [pk.get("pick")] + pk.get("backup", []):
        if i and i not in food_ids: E(f"food.js FOOD_PICKS：{pk['date']} {pk['slot']} 指到不存在的店 {i}")
    if pk["date"] in days:
        import datetime as _dt
        y, m, dd = map(int, pk["date"].split("-")); wd = (_dt.date(y, m, dd).weekday() + 1) % 7
        for j, i in enumerate([pk.get("pick")] + pk.get("backup", [])):
            f = next((x for x in food if x["id"] == i), None)
            if f and f.get("closed") and wd in f["closed"]:
                (E if j == 0 else W)(f"food.js FOOD_PICKS：{pk['date']} {pk['slot']} {'選的' if j == 0 else '備案'} {f['name']} 那天公休")

print("=== 行程一致性檢查 ===")
print(f"trip.js {len(days)} 天 · plan.json {len(dayplan)} 天 · scenes.js {len(scenes)} 天 · 完整序幕 {sum(1 for v in scenes.values() if v.get('scenes'))} 天 · food.js {len(food)} 家 · spots.js {len(spots)} 個景點")
for e in errors: print("✗", e)
for w in warns: print("△", w)
print(f"錯誤 {len(errors)}，警告 {len(warns)}")
sys.exit(1 if errors else 0)

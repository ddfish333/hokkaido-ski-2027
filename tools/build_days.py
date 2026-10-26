#!/usr/bin/env python3
"""Generate day/MMDD/index.html for every day in data/trip.js. Run from the site root."""
import json, os, re, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
from plan_lib import TRIP, fill
days = TRIP["days"]

# ---- 共用的頁首：每一頁的 <header class="topbar"> 都由這裡產生，改一次全站一起改（手機選單、幣別鈕都在這） ----
TOPBAR = {  # 檔案 → (根目錄相對路徑, 品牌連結, 連結清單, 有沒有幣別鈕)；連結 = (href, 文字, 是否目前頁)
    "index.html": ("", "#top", [("#days", "13 天"), ("#chapters", "三章"), ("#ski", "地圖"), ("#weather", "天氣"), ("ski/", "滑雪地圖"), ("food/", "美食地圖"), ("spots/", "景點"), ("#prep", "準備")], True),
    "ski/index.html": ("../", "../", [("../", "首頁"), ("./", "滑雪地圖", True), ("../food/", "美食地圖"), ("../spots/", "景點地圖"), ("../#weather", "天氣")], False),
    "food/index.html": ("../", "../", [("../", "首頁"), ("../ski/", "滑雪地圖"), ("./", "美食地圖", True), ("../spots/", "景點地圖")], False),
    "spots/index.html": ("../", "../", [("../", "首頁"), ("../ski/", "滑雪地圖"), ("../food/", "美食地圖"), ("./", "景點地圖", True)], False),
    "tools/day.template.html": ("../../", "../../", [("../../", "首頁"), ("#plan", "行程"), ("#map", "地圖"), ("../../#weather", "天氣"), ("../../ski/?day={{DATE}}", "滑雪地圖"), ("../../food/?day={{DATE}}", "美食地圖"), ("../../spots/?day={{DATE}}", "景點")], True),
}
def topbar_html(root, brand, links, curbtn, edit_href):
    nav = "".join(f'      <a href="{h}"{" aria-current=\"page\"" if len(l) > 2 and l[2] else ""}>{t}</a>\n' for l in links for h, t in [(l[0], l[1])])
    return ('<header class="topbar">\n  <div class="wrap topbar-in">\n'
            f'    <a class="brand" href="{brand}" aria-label="{"回到頂端" if brand == "#top" else "回首頁"}"><span class="brand-mark" aria-hidden="true"></span><span class="brand-name">北海道・雪上的大小腳印</span></a>\n'
            '    <input type="checkbox" class="nav-tog" id="navtog" aria-label="打開選單"><label class="nav-lab" for="navtog">選單</label>\n'
            '    <nav class="nav" aria-label="主要區塊">\n' + nav + f'      <a href="{edit_href}" class="nav-edit">編輯</a>\n    </nav>\n' +
            f'    <a class="m-edit" href="{edit_href}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/></svg>編輯</a>\n' +
            ('    <button type="button" class="curbtn" id="curbtn" aria-label="切換金額顯示">¥＋NT$</button>\n' if curbtn else "") + '  </div>\n</header>')
# ---- 手機底部分頁列：首頁／行程／滑雪／美食／景點，五個入口一直看得到（不用先點「選單」）。也由這裡一份產生 ----
TAB_ICON = {
    "home": '<path d="M4 11l8-6.5 8 6.5M6 9.5V19h4.5v-5h3v5H18V9.5"/>',
    "day": '<rect x="4" y="5.5" width="16" height="14" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4M8 13.5h3M8 16.5h6"/>',
    "ski": '<path d="M3 19l6.5-10 3.5 5 2.5-3.5L21 19z"/><path d="M8 12l1.5 1.5 1.5-1.5"/>',
    "food": '<path d="M4 12h16a8 8 0 0 1-16 0zM9 20h6M14.5 4l-3 6M18.5 5l-4 5"/>',
    "spots": '<path d="M12 21s6-5.6 6-11a6 6 0 0 0-12 0c0 5.4 6 11 6 11z"/><circle cx="12" cy="10" r="2.2"/>',
    "prep": '<path d="M9 5h6l1 2h3v13H5V7h3z"/><path d="M9 12l2 2 4-4"/>',
}
TABS = [("home", "首頁", ""), ("day", "行程", "day/0107/"), ("ski", "滑雪", "ski/"), ("food", "美食", "food/"), ("spots", "景點", "spots/"), ("prep", "準備", "#prep")]
TABBAR = {"index.html": ("", "home"), "ski/index.html": ("../", "ski"), "food/index.html": ("../", "food"), "spots/index.html": ("../", "spots"), "tools/day.template.html": ("../../", "day")}
def tabbar_html(root, active, is_day):
    out = []
    for key, label, href in TABS:
        h = "./" if (is_day and key == "day") else root + href + ("?day={{DATE}}" if is_day and key in ("ski", "food", "spots") else "")
        cur = ' aria-current="page"' if key == active else ""
        out.append(f'  <a href="{h}" data-tab="{key}"{cur}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{TAB_ICON[key]}</svg><span>{label}</span></a>\n')
    return f'<nav class="tabbar" data-root="{root}" aria-label="主要頁面">\n' + "".join(out) + '</nav>'
def sync_tabbar():
    for f, (root, active) in TABBAR.items():
        path = os.path.join(ROOT, f); html = open(path, encoding="utf-8").read()
        bar = tabbar_html(root, active, "day.template" in f)
        if '<nav class="tabbar"' in html: new = re.sub(r'<nav class="tabbar".*?</nav>', lambda m: bar, html, count=1, flags=re.S)
        else: new = html.replace("</body>", bar + "\n</body>", 1)
        if new != html: open(path, "w", encoding="utf-8").write(new); print("tabbar:", f)

def sync_topbar():
    for f, (root, brand, links, curbtn) in TOPBAR.items():
        path = os.path.join(ROOT, f); html = open(path, encoding="utf-8").read()
        edit_href = root + "plan/" + ("#{{DATE}}" if "day.template" in f else "")
        new = re.sub(r'<header class="topbar">.*?</header>', lambda m: topbar_html(root, brand, links, curbtn, edit_href), html, count=1, flags=re.S)
        if new != html: open(path, "w", encoding="utf-8").write(new); print("topbar:", f)
sync_topbar()
sync_tabbar()
subprocess.run(["python3", os.path.join(ROOT, "tools/stamp.py")], check=True)
TPL = open(os.path.join(ROOT, "tools/day.template.html"), encoding="utf-8").read()
for i, d in enumerate(days):
    mmdd = d["date"][5:].replace("-", "")
    html = TPL.replace("{{DATE}}", d["date"]).replace("{{TITLE}}", fill(d["title"], d["date"])).replace("{{SUB}}", fill(d["sub"], d["date"])).replace("{{N}}", f"{i+1:02d}").replace("{{MD}}", f"{int(d['date'][5:7])}/{int(d['date'][8:10])}")
    out = os.path.join(ROOT, "day", mmdd)
    os.makedirs(out, exist_ok=True)
    open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(html)
    print("day/" + mmdd)

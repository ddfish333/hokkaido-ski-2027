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
            ('    <button type="button" class="curbtn" id="curbtn" aria-label="切換金額顯示">¥＋NT$</button>\n' if curbtn else "") + '  </div>\n</header>')
def sync_topbar():
    for f, (root, brand, links, curbtn) in TOPBAR.items():
        path = os.path.join(ROOT, f); html = open(path, encoding="utf-8").read()
        edit_href = root + "plan/" + ("#{{DATE}}" if "day.template" in f else "")
        new = re.sub(r'<header class="topbar">.*?</header>', lambda m: topbar_html(root, brand, links, curbtn, edit_href), html, count=1, flags=re.S)
        if new != html: open(path, "w", encoding="utf-8").write(new); print("topbar:", f)
sync_topbar()
subprocess.run(["python3", os.path.join(ROOT, "tools/stamp.py")], check=True)
TPL = open(os.path.join(ROOT, "tools/day.template.html"), encoding="utf-8").read()
for i, d in enumerate(days):
    mmdd = d["date"][5:].replace("-", "")
    html = TPL.replace("{{DATE}}", d["date"]).replace("{{TITLE}}", fill(d["title"], d["date"])).replace("{{SUB}}", fill(d["sub"], d["date"])).replace("{{N}}", f"{i+1:02d}").replace("{{MD}}", f"{int(d['date'][5:7])}/{int(d['date'][8:10])}")
    out = os.path.join(ROOT, "day", mmdd)
    os.makedirs(out, exist_ok=True)
    open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(html)
    print("day/" + mmdd)

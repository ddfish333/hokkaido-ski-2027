#!/usr/bin/env python3
"""給 css/js/json 連結加上版本號（?v=內容雜湊），避免手機快取舊版。build_days.py 會呼叫。"""
import hashlib, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def h(path):
    p = os.path.join(ROOT, path)
    return hashlib.md5(open(p, "rb").read()).hexdigest()[:8] if os.path.exists(p) else "0"
PAT = re.compile(r'((?:href|src)=")((?:\.\./)*(?:assets|data)/[\w./-]+\.(?:css|js))(?:\?v=\w+)?(")')
def stamp(file):
    s = open(file, encoding="utf-8").read()
    def rep(m): return m.group(1) + m.group(2) + "?v=" + h(m.group(2).replace("../", "")) + m.group(3)
    t = PAT.sub(rep, s)
    if t != s: open(file, "w", encoding="utf-8").write(t)
for f in ["index.html", "plan/index.html", "food/index.html", "spots/index.html", "ski/index.html", "tools/day.template.html"]:
    stamp(os.path.join(ROOT, f))
# plan.js 裡 fetch 的 json 也帶版本
pj = os.path.join(ROOT, "assets", "plan.js"); s = open(pj, encoding="utf-8").read()
s2 = re.sub(r'"data/plan\.json(?:\?v=\w+)?"', '"data/plan.json"', s); s2 = re.sub(r'"data/legs\.json(?:\?v=\w+)?"', '"data/legs.json"', s2)
if s2 != s: open(pj, "w", encoding="utf-8").write(s2)
print("stamped")

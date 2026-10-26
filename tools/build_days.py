#!/usr/bin/env python3
"""Generate day/MMDD/index.html for every day in data/trip.js. Run from the site root."""
import json, os, re, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
from plan_lib import TRIP, fill
days = TRIP["days"]
subprocess.run(["python3", os.path.join(ROOT, "tools/stamp.py")], check=True)
TPL = open(os.path.join(ROOT, "tools/day.template.html"), encoding="utf-8").read()
for i, d in enumerate(days):
    mmdd = d["date"][5:].replace("-", "")
    html = TPL.replace("{{DATE}}", d["date"]).replace("{{TITLE}}", fill(d["title"], d["date"])).replace("{{SUB}}", fill(d["sub"], d["date"])).replace("{{N}}", f"{i+1:02d}").replace("{{MD}}", f"{int(d['date'][5:7])}/{int(d['date'][8:10])}")
    out = os.path.join(ROOT, "day", mmdd)
    os.makedirs(out, exist_ok=True)
    open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(html)
    print("day/" + mmdd)

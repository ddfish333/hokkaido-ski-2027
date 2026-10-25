#!/usr/bin/env python3
"""Generate day/MMDD/index.html for every day in data/trip.js. Run from the site root."""
import json, os, re, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
days = json.loads(subprocess.run(["node", "-e", "global.window={};require(process.argv[1]);console.log(JSON.stringify(window.TRIP.days))", os.path.join(ROOT, "data/trip.js")], capture_output=True, text=True, check=True).stdout)
TPL = open(os.path.join(ROOT, "tools/day.template.html"), encoding="utf-8").read()
for i, d in enumerate(days):
    mmdd = d["date"][5:].replace("-", "")
    html = TPL.replace("{{DATE}}", d["date"]).replace("{{TITLE}}", d["title"]).replace("{{SUB}}", d["sub"]).replace("{{N}}", f"{i+1:02d}").replace("{{MD}}", f"{int(d['date'][5:7])}/{int(d['date'][8:10])}")
    out = os.path.join(ROOT, "day", mmdd)
    os.makedirs(out, exist_ok=True)
    open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(html)
    print("day/" + mmdd)

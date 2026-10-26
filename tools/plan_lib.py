#!/usr/bin/env python3
"""跟 assets/plan.js 同一套：讀 plan.json／legs.json／trip.js，推算每天時間表，並把文字裡的時間標記換成推算值。
build_days.py 和 check.py 共用，所以單日頁標題、檢查報告和網頁上看到的時間都是同一個來源。"""
import json, os, re, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_js(file, var):
    code = "global.window={};require(process.argv[1]);console.log(JSON.stringify(window." + var + "||null))"
    return json.loads(subprocess.run(["node", "-e", code, os.path.join(ROOT, file)], capture_output=True, text=True, check=True).stdout)

TRIP = load_js("data/trip.js", "TRIP")
PLAN = json.load(open(os.path.join(ROOT, "data/plan.json"), encoding="utf-8"))
LEGS = json.load(open(os.path.join(ROOT, "data/legs.json"), encoding="utf-8"))
DAY_BY_DATE = {d["date"]: d for d in TRIP["days"]}

def mins(t): h, m = t.split(":"); return int(h) * 60 + int(m)
def hm(x): return f"{x // 60:02d}:{x % 60:02d}"
def r5(x): return max(5, int(round(x / 5)) * 5)
def taxi_min(m): return max(15, r5(m * 1.5))  # 和 plan.js taxiMin 同：叫車／等車，×1.5、最少 15 分
def leg_of(a, b, via):
    k = f"{a}|{b}" + ("|walk" if via == "walk" else "|shuttle" if via == "shuttle" else "")  # taxi 用開車那一段
    L = LEGS.get(k)
    if L and via == "taxi": L = dict(L, mode="taxi", normal=taxi_min(L["normal"]), snow=taxi_min(L["snow"]))
    return L

def schedule(date, mode="normal"):
    """前一站離開＋移動＝抵達；at 早到就等、晚到算遲；by 超過算遲。沒有路段快取的當 0 分（check.py 會另外警告）。"""
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
        out.append(dict(id=s["id"], arr=arr, dep=arr + stay, stay=stay, late=late, wait=wait, time=hm(arr), timeDep=hm(arr + stay)))
        t = arr + stay
    return out

TOKEN = re.compile(r"\{(t|dep|at|by|open|close)(?::([\w-]+?))?(?:#(\d))?(?:@(\d\d-\d\d))?\}|\{sun:(rise|set|dark)\}|\{T:([\w.]+)\}|\{leg:([\w-]+)\|([\w-]+)(?:\|(walk|shuttle|taxi))?\}|\{(party)\}")
HHMM = re.compile(r"(?<![\d:])\d{1,2}:\d{2}(?![\d:])")

class TokenError(Exception): pass

def fill(text, date, ctx_id=None, mode="normal", strict=False):
    """把 {t:villa}、{dep:kiroro}、{t:favlux@01-19}、{open:zoo}、{sun:set}、{T:rental.hours} 換成實際值。strict=True 時換不出來就丟 TokenError。"""
    if not text or "{" not in str(text): return text
    def rep(m):
        kind, id_, nth, md, sun, tpath, lg_a, lg_b, lg_via, party = m.groups()
        if party:
            N, PT = TRIP.get("nanny", {}), TRIP.get("party", {"withNanny": "9 人", "noNanny": "8 人"})
            if not N.get("lastDay") or date > N["lastDay"]: return PT["noNanny"]
            if date < N["lastDay"]: return PT["withNanny"]
            t = None
            if ctx_id:
                hits = [x for x in schedule(date, mode) if x["id"] == ctx_id]
                if hits: t = hits[0]["time"]
            return PT["noNanny"] if (t and N.get("bus") and t >= N["bus"]) else PT["withNanny"]
        if lg_a:
            if not lg_via and date in PLAN["days"]:  # 和 plan.js routeMin 同：那天 a→b 中間有別的站就把沿途路段加總
                sch = schedule(date, mode); ia = ib = -1
                for i, x in enumerate(sch):
                    if x["id"] == lg_a and ia < 0: ia = i
                    elif x["id"] == lg_b and ia >= 0 and ib < 0: ib = i
                if ia >= 0 and ib > ia + 1: return str(sum(sch[i]["arr"] - sch[i]["wait"] - sch[i - 1]["dep"] for i in range(ia + 1, ib + 1)))  # 只算開車，不含中途停留
            L = leg_of(lg_a, lg_b, lg_via or "drive")
            if L: return str(L[mode])
            if strict: raise TokenError(f"{m.group(0)}：legs.json 沒有 {lg_a}→{lg_b} 這段路（在編輯器儲存一次會補）")
            return m.group(0)
        if sun:
            d = DAY_BY_DATE.get(date)
            if d and d.get("sun"): return d["sun"][{"rise": 0, "set": 1, "dark": 2}[sun]]
            if strict: raise TokenError(f"{m.group(0)}：{date} 在 trip.js 沒有 sun")
            return m.group(0)
        if tpath:
            v = TRIP
            for k in tpath.split("."):
                v = v.get(k) if isinstance(v, dict) else (v[int(k)] if isinstance(v, list) and k.isdigit() and int(k) < len(v) else None)
                if v is None: break
            if v is None:
                if strict: raise TokenError(f"{m.group(0)}：trip.js 沒有 {tpath}")
                return m.group(0)
            return str(v)
        dd = date[:5] + md if md else date
        if kind in ("open", "close"):
            pl = PLAN["places"].get(id_ or "")
            if pl and pl.get(kind): return pl[kind]
            if strict: raise TokenError(f"{m.group(0)}：plan.json places 的 {id_} 沒有 {kind}")
            return m.group(0)
        if kind in ("at", "by"):
            sts = [s for s in PLAN["days"].get(dd, {}).get("stops", []) if s["id"] == id_]
            st = (sts[int(nth) - 1] if int(nth) <= len(sts) else None) if nth else next((s for s in sts if s.get(kind)), None)
            if st and st.get(kind): return st[kind]
            if strict: raise TokenError(f"{m.group(0)}：{dd} 的 {id_} 沒有 {kind}")
            return m.group(0)
        if dd not in PLAN["days"]:
            if strict: raise TokenError(f"{m.group(0)}：plan.json 沒有 {dd}")
            return m.group(0)
        sid = id_ or ctx_id
        if not id_ and sid and "#" in sid: sid, nth = sid.split("#")  # 序幕的 stop: "canal#2"
        hits = [s for s in schedule(dd, mode) if s["id"] == sid]
        k = int(nth) - 1 if nth else 0
        if k >= len(hits):
            if strict: raise TokenError(f"{m.group(0)}：{dd} 的行程裡沒有「{sid}」" + (f"第 {nth} 次" if nth else ""))
            return m.group(0)
        return hits[k]["timeDep"] if kind == "dep" else hits[k]["time"]
    return TOKEN.sub(rep, str(text))

def hardcoded_times(text):
    """文字裡寫死的 HH:MM（標記以外的）。"""
    if not text: return []
    return HHMM.findall(TOKEN.sub("", str(text)))

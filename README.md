# 北海道・雪上的大小腳印

2027 年 1 月兩家人的北海道親子滑雪行程網站。GitHub Pages：https://ddfish333.github.io/hokkaido-ski-2027/

- `index.html` 首頁：主視覺、13 天海報牆、三章（住宿）、雪場與車程地圖、天氣、吃喝、準備。
- `day/MMDD/` 每一天一頁：序幕（照片運鏡＋飄雪＋即時生成音樂）→ 當天行程、地圖、車程、天氣。由 `tools/build_days.py` 從 `data/trip.js` 產生。
- `plan/` 行程編輯器：改停留分鐘、固定時間、順序、新增站點，存回 GitHub（需要金鑰）。
- `data/plan.json` 行程的唯一事實來源（站點、停留、固定時間）；`data/legs.json` 路段快取（車程與幾何）；`data/trip.js` 每天的標題、吃什麼、提醒、雪場與準備資料；`data/scenes.js` 海報與序幕腳本。
- `assets/plan.js` 由 plan.json 推算每天的時間表，單日頁、地圖、序幕、編輯器共用；文字裡的 `{t:站點}`／`{open:站點}`／`{sun:set}` 標記也由它換成實際時間（規則見 `更新流程.md`）。`tools/plan_lib.py` 是同一套算法的 Python 版，給 build_days.py／check.py 用。
- `assets/film.js` 序幕引擎、`assets/app.js` 其餘互動、`assets/img/` 已裁切的照片（poster／chapter／stay／scene）。
- 照片出處見 `CREDITS.md`。不含任何個人證件、電話或地址。

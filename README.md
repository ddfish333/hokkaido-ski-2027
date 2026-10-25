# 北海道・雪上的大小腳印

2027 年 1 月兩家人的北海道親子滑雪行程網站。GitHub Pages：https://ddfish333.github.io/hokkaido-ski-2027/

- `index.html` 首頁：主視覺、13 天海報牆、三章（住宿）、雪場與車程地圖、天氣、吃喝、準備。
- `day/MMDD/` 每一天一頁：序幕（照片運鏡＋飄雪＋即時生成音樂）→ 當天行程、地圖、車程、天氣。由 `tools/build_days.py` 從 `data/trip.js` 產生。
- `data/trip.js` 行程資料、`data/dayplan.js` 每日站點與車程、`data/dayroutes.geojson` 路線、`data/scenes.js` 海報與序幕腳本。
- `assets/film.js` 序幕引擎、`assets/app.js` 其餘互動、`assets/img/` 已裁切的照片（poster／chapter／stay／scene）。
- 照片出處見 `CREDITS.md`。不含任何個人證件、電話或地址。

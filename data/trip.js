/* 北海道・雪上的大小腳印 — 行程資料（由 hokkaido-knowledge-base 整理，2026-10-25）
   車程：normal = 一般路況、snow = 下雪結冰（OSRM 路網；冬季山路另計，算法在 tools/refresh_legs.py）
   不放任何個資（訂位號碼、身分證、電話號碼以外的個人資料）。 */
window.TRIP = {
  title: "北海道・雪上的大小腳印",
  start: "2027-01-07",
  end: "2027-01-19",
  updated: "2026-10-25",
  /* 日圓→台幣：網站開啟時會抓即時匯率；抓不到就用這個 */
  fx: { jpyTwd: 0.2073, date: "2026-10-25", source: "open.er-api.com" },

  bases: [
    { id: "villa", stop: "villa", name: "山郷 春 Villa -SHUN-", short: "小樽・山鄉", area: "小樽", lat: 43.1467841, lon: 141.1354924,
      from: "2027-01-07", to: "2027-01-11", nights: 4, checkin: "15:00 起（官網沒寫最晚時間；1/7 預計 {t:villa@01-07} 到，先跟房東說）", checkout: "11:00",
      notes: ["**走路 {leg:villa|onze|walk} 分到 Onze 雪場**（夜滑到 {close:onze}），面海滑雪；冬天開車 {T:drive.villa.kiroro.1} 分上 Kiroro（山路）", "145 m² 一棟包：挑高大窗對著森林、檜木浴缸、森林景觀的廚房；洗烘衣機、洗碗機", "三五工務店蓋的「像住在北海道一樣」的房子，用的是北海道的木頭；停車每棟 2 格、免費"],
      facts: ["走路 {leg:villa|onze|walk} 分到 Onze", "145 m² 一棟包", "檜木浴缸・洗烘衣機", "停車 2 格"],
      video: "villa-hover.mp4", videoSm: "villa-hover-sm.mp4",
      links: [["官網", "https://mt-sango.com/stay/shun/"], ["訂房", "https://www.ikyu.com/00051685/"]], g: { rating: 5.0, n: 2, pid: "ChIJv-YvGwDfCl8Rybz1BtgpE2w" } },
    { id: "furano", stop: "lodge", name: "BEST DAY EVER FURANO LODGES", short: "富良野・北之峰", area: "富良野", lat: 43.3325009, lon: 142.3631996,
      from: "2027-01-11", to: "2027-01-16", nights: 5, checkin: "15:00", checkout: "10:00",
      notes: ["開車 {leg:lodge|kita} 分到北之峰纜車、{leg:lodge|fstn} 分到富良野站；主戰場的 5 晚", "126 m² 小木屋、4 間臥室；全套廚房＋微波爐、洗衣機、陽台", "Google 5.0（48 則）：一進門是木頭香、乾淨得像新的、老闆自己是滑雪人，屋裡到處是雪板的小細節；停車免費"],
      facts: ["開車 {leg:lodge|kita} 分到北之峰纜車", "126 m²・4 間臥室", "全套廚房・洗衣機", "停車免費"],
      video: "furano-hover.mp4", videoSm: "furano-hover-sm.mp4",
      links: [["官網", "https://bestdayeverfurano.com/"], ["訂房", "https://tour.l-tike.com/hotels/domestic/hotel/75033723/"]], g: { rating: 5.0, n: 48, pid: "ChIJPY_8pplTc18Rq5OgungIGww" } },
    { id: "sapporo", stop: "favlux", name: "FAV LUX 札幌薄野", short: "札幌・薄野", area: "札幌", lat: 43.0523778, lon: 141.3485722,
      from: "2027-01-16", to: "2027-01-19", nights: 3, checkin: "15:00", checkout: "10:00",
      notes: ["2025 年 7 月新開幕、84 間：**上下舖的 4–6 人家庭房**、房內洗衣機、兩個洗手台、小客廳、冰箱微波爐，小孩有自己的小桌子；住客專用大浴場＋三溫暖（Google 4.3，306 則）", "**在札幌盡量走路**：街很美、什麼都在 10 分鐘內，札幌站–大通–薄野一路地下街不用踩雪；市電「東本願寺前」站就在幾分鐘路程內", "車子 1/16 停好就三晚不動——停哪裡、怎麼導航，看單日頁的「車停哪裡」", "退房 {T:bases.2.checkout}，1/19 同時要還車：**{t:favlux@01-19} 前離開**"],
      facts: ["上下舖家庭房", "房內洗衣機", "大浴場・三溫暖", "走路逛札幌，車停好三晚不動"],
      video: "sapporo-hover.mp4", videoSm: "sapporo-hover-sm.mp4",
      links: [["官網", "https://fav-hotels.com/hotels/lux/sapporosusukino/"], ["訂房", "https://www.jalan.net/yad333573/"]], g: { rating: 4.3, n: 306, pid: "ChIJDeSbhZMpC18RgWu851Dm37E" } }
  ],

  resorts: [
    { id: "onze", group: "main", name: "Snow Cruise Onze", ja: "スノークルーズオーンズ", tier: "家庭小雪場", lat: 43.1439, lon: 141.1278,
      season: ["2026-12-15", "2027-03-28"], seasonNote: "12 月中旬開季（預定）", openLabel: "12 月中旬開季",
      hours: "日間＋夜滑至約 22:45", scale: "四人吊椅 1、雙人吊椅 1；有初學區",
      tickets: [["1 日券", "¥5,600"], ["4 小時券", "¥4,500"], ["家庭套票（大人＋小孩 4h＋餐券 2）", "¥7,500"], ["國高中生・長者 1 日", "¥4,700"], ["小孩 1 日", "¥3,700"]],
      kids: "官網寫未就學兒童免費（出發前再確認一次）", lessons: "—",
      gear: "現場租借、不可預約：大人一組 ¥7,500、小孩 ¥5,200",
      tips: ["山鄉步行 {leg:villa|onze|walk} 分，小樽 4 晚大人輪流夜滑", "規模小、雪不如 Kiroro 粉，滑 1–2 小時剛好"],
      links: [["官網", "https://onze.jp/"], ["雪況（Weathernews）", "https://weathernews.jp/ski/spot/31616/"]],
      status: "https://weathernews.jp/ski/spot/31616/", stops: ["onze"], video: "onze-hover.mp4", videoSm: "onze-hover-sm.mp4", img: "onze.jpg",
      entry: "停車場就在山腳（免費）；從山鄉走路 {leg:villa|onze|walk} 分，不用開車",
      summit: null, base: 200 },
    { id: "kiroro", group: "main", name: "Kiroro", ja: "キロロ", tier: "粉雪大雪場", lat: 43.0679153, lon: 140.9893336,
      season: ["2026-11-28", "2027-05-05"], seasonNote: "旺季 12/12–4/11",
      hours: "吊椅大多 09:00–15:30（2/14 起到 16:00）；山腳的 Gateway Express 纜車 08:30–16:00、Family 吊椅到 16:30、Center Express 到 19:00；結束時間依日落調整——25-26 官網時刻表，26-27 待公告", scale: "23 條雪道、9 條纜車（含 2 條纜車廂）；山頂 1,180 m",
      tickets: [["1 日券", "¥9,200"], ["4 小時券", "¥7,800"], ["2 日券（可不連續）", "¥18,400"], ["3 日券（可不連續）", "¥27,600"], ["夜滑", "¥3,000"], ["6–12 歲 1 日", "¥5,500"]],
      kids: "5 歲以下免費（需大人陪同，KIROCA 卡押金 ¥500）",
      lessons: "大人：{T:coach.name} 教練（{T:coach.org}）1/8、1/9 全天、1/10 上午，4 人一組、課後免費給影片；Kids Academy Pink 班 3–4 歲：半天 ¥8,000（本次小孩不上課）",
      gear: "Mountain Shop Vainqueur：賣雪板、雪靴、固定器，打蠟 ¥3,500；雪具寄放櫃 2 天 ¥1,500，之後每天 +¥500",
      tips: ["官方 Webstore 預購最多 95 折", "停車免費約 2,000 台", "山上陣風常超過 50 km/h，纜車可能停駛"],
      links: [["官網", "https://www.kiroro.co.jp/"], ["營業時間", "https://www.kiroro.co.jp/ja/operating_hours/"], ["票價", "https://www.kiroro.co.jp/lift_price/"], ["雪況（Weathernews）", "https://weathernews.jp/ski/spot/31609/"], ["Gacha 教練預約", "https://snowsurfing-japan.stores.jp/reserve/snowsurfing_japan/1865332"]],
      status: "https://www.kiroro.co.jp/dashboard/", cams: "https://www.kiroro.co.jp/livecamera", trailmap: "https://www.kiroro.co.jp/guide_map/", webshop: "https://webstore.kiroro.co.jp/en/", access: "https://www.kiroro.co.jp/access-winter/",
      stops: ["kiroro"], video: "kiroro-hover.mp4", videoSm: "kiroro-hover-sm.mp4", img: "kiroro.jpg", top: [43.0790, 140.9670],
      gates: [
        { name: "Mountain Center", sub: "日歸的人都停這裡：售票、租借、Kids Academy、餐廳都在館內", ja: "キロロリゾート マウンテンセンター", lat: 43.0679153, lon: 140.9893336, pid: "ChIJ0ZtUZSvbCl8Rp8sA7XPQCoE", stop: "kiroro", note: "免費停車約 2,000 台；旺季 08:00–20:00。從山鄉走朝里 → 道道 1 號上山，最後一段是山路，下雪慢慢開。" }
      ],
      summit: 1180, base: 570 },
    { id: "furano_kita", group: "main", name: "富良野滑雪場", ja: "富良野スキー場", tier: "大雪場・兩區", lat: 43.3438912, lon: 142.3602434,
      season: ["2026-11-28", "2027-05-05"], seasonNote: "一般期 12/5–3/22",
      hours: "08:30–日落；夜滑平日 16:00–18:00、週末假日至 19:30", scale: "北之峰區＋富良野區（新富良野王子）",
      tickets: [["1 日券", "¥9,000"], ["1 日券（SEIBU PRINCE CLUB 會員）", "¥7,500"], ["4 小時券", "¥8,200"], ["夜滑 平日", "¥3,100"], ["夜滑 週末假日", "¥3,900"], ["60 歲以上 1 日", "¥8,500"]],
      kids: "小學生以下免費（窗口領票，學齡前需大人陪同）",
      lessons: "Pandaruman 兒童班 3–6 歲有中文；富良野スキー学校",
      gear: "Rhythm Furano（北之峰主街）：零售＋租借",
      tips: ["網路票 Webket 不能改不能退", "平日早上的壓雪坡道最適合練 carving"],
      links: [["官網", "https://www.princehotels.co.jp/ski/furano/winter/"], ["票價", "https://www.princehotels.co.jp/ski/furano/winter/lift/#lift-fee"], ["雪況（Weathernews）", "https://weathernews.jp/ski/spot/31602/"]],
      status: "https://www.princehotels.co.jp/ski/furano/informations/snowreport", cams: "https://www.princehotels.co.jp/ski/furano/livecamera/", cams360: "https://furano.panomax.com/?cu=ja-JP", trailmap: "https://www.princehotels.co.jp/ski/furano/winter/coursemap/", access: "https://www.princehotels.co.jp/ski/furano/winter/access/",
      stops: ["kita", "fzone"], video: "furano-hover.mp4", videoSm: "furano-hover-sm.mp4", img: "furano.jpg", top: [43.3280, 142.3150],
      gates: [
        { name: "北之峰區（北の峰ゴンドラ）", sub: "小木屋開車 {leg:lodge|kita} 分；1/12、1/14 從這邊上", ja: "富良野スキー場 北の峰ゴンドラ", lat: 43.3438912, lon: 142.3602434, pid: "ChIJB2XB8aNSc18RbgxtFUZ8FPk", stop: "kita", note: "北之峰主街有租借店（Rhythm）、餐廳；導航直接到纜車站旁的北之峰區停車場（免費）。" },
        { name: "富良野區（富良野ロープウェー）", sub: "1/13 從這邊上；山上兩區相通，但纜車站的停車場不相通", ja: "富良野ロープウェー", lat: 43.3254401, lon: 142.3536473, pid: "ChIJHaVVJfJSc18RNW9hDu1q5qM", stop: "fzone", note: "新富良野王子飯店旁；101 人大纜車 5 分上山。停哪邊就從哪邊下山，別滑錯區。" }
      ],
      summit: 900, base: 250 },
    { id: "teine", group: "sapporo", rec: "帶幼兒的家庭：首選", name: "札幌 Teine（手稻）", ja: "サッポロテイネ", tier: "札幌近郊・1972 奧運場地", lat: 43.0944, lon: 141.2112, pid: "ChIJ6zkmLHPYCl8RYqZuc-S35qw",
      season: ["2026-11-21", "2027-05-05"], seasonNote: "預定 11/21 開季", openLabel: "預定 11/21 開季",
      hours: "Highland 吊椅 09:00–15:30（1/18 前；1/19 起到 15:45）｜Eight Gondola 09:00–15:30｜夜滑 Olympia 白樺第 1 吊椅 16:00–20:00（最後 19:40）",
      scale: "Olympia（下方：初學、家庭、夜滑）＋ Highland（上方：City View Cruise 1,200 m，看得到海）；15 條雪道",
      tixSeason: "2026-27 官網公告・大人（現場／WEB 預購）",
      tickets: [["1 日券（含夜滑）", "¥9,800", "WEB 預購 ¥8,800"], ["5 小時券（連續 5 小時）", "¥7,600", "WEB 預購 ¥6,600"], ["夜滑券 16:00–20:00", "¥3,900", "WEB 預購 ¥2,900"], ["3 點券（纜車廂上山 1 趟）", "¥2,300"], ["Snow Land 入場（雪橇・雪圈）", "¥2,300"], ["Debut Escalator（魔毯初學區）", "¥2,300"], ["Snow Play（Snow Land＋魔毯）", "¥3,900"]],
      kids: "3 歲以下免費、**滿 4 歲要票**（4–12 歲票價在 Webshop）；Snow Land、魔毯區另外買票，都在 Olympia；Olympia 3 樓有**授乳室**",
      lessons: "Teine Olympia 滑雪學校有 Junior 班；本次不上課",
      gear: "Olympia 3 樓「HEAD Sports Station」（HEAD／BURTON）08:30–20:00，建議網路預約；IG 說租借偏貴",
      gates: [
        { name: "Olympia Ski Center", stop: "teine", sub: "家庭・魔毯・Snow Land・夜滑；帶小孩停這邊", ja: "オリンピアスキーセンター", lat: 43.0944, lon: 141.2112, pid: "ChIJ6zkmLHPYCl8RYqZuc-S35qw", note: "手稲本町 593-17。從這裡搭 Eight Gondola 上 Highland。" },
        { name: "Highland Ski Center", sub: "直接上高地；只滑 Highland 的人停這邊", ja: "ハイランドスキーセンター", lat: 43.0843, lon: 141.2053, pid: "ChIJLRLJ7xfYCl8R_MltyFlEiys", note: "手稲金山 172。另一條山路上去，約多 10 分；兩邊停車場不相通。" }
      ],
      tips: ["11/21 開季（官網 10/17 公告）；正式雪季 12/19–3/7，3/29 起只開 Highland", "**錯過 Eight Gondola 最後一班（15:30）就回不到 Olympia**——車停 Olympia 的人 15:00 前要下山", "如果真的去滑（1/16–1/18 都不是正式行程）：1/18 前 Highland 吊椅只到 15:30，上午一位滑 Highland，下午那位用夜滑券（WEB ¥2,900）滑 Olympia 到 20:00，兩個人都滑得到", "官網：札幌市中心約 15 km、車約 40 分（FAV LUX 出發 {T:drive.sapporo.teine.1} 分、下雪 {T:drive.sapporo.teine.2} 分）；停車免費", "票、租借、點餐都掃 QR（IG）"],
      links: [["官網", "https://sapporo-teine.com/snow/"], ["票價・吊椅時間", "https://sapporo-teine.com/snow/lift-time"], ["雪道", "https://sapporo-teine.com/snow/course"], ["開車", "https://sapporo-teine.com/snow/access/by-car"], ["Olympia Ski Center", "https://sapporo-teine.com/snow/facilities/olympia-ski-center"], ["Webshop", "https://teine.axess.shop/ja/Products/Tickets"]],
      status: "https://sapporo-teine.com/snow/gelande-report", cams: "https://sapporo-teine.com/snow/gelande-report", trailmap: "https://sapporo-teine.com/snow/course?id=Map", webshop: "https://teine.axess.shop/ja/Products/Tickets", access: "https://sapporo-teine.com/snow/access/by-car", kidsArea: "https://sapporo-teine.com/snow/park/snow-land",
      stops: ["teine"], video: "teine-hover.mp4", videoSm: "teine-hover-sm.mp4", img: "teine.jpg", top: [43.0800, 141.1994],
      summit: 1023, base: 300 },
    { id: "kokusai", group: "sapporo", rec: "有人顧小孩時：寬坡首選", name: "札幌國際滑雪場", ja: "札幌国際スキー場", tier: "札幌近郊・定山溪・雪最多", lat: 43.0722, lon: 141.0828, pid: "ChIJOSclPs7bCl8REMJOyvKws-o",
      season: null, seasonNote: "開季日待公告",
      hours: "09:00–17:00（沒有夜滑）",
      scale: "7 條雪道、山頂 1,100 m；Family Trail 1,600 m、寬 100 m 以上（官方列中級）；林間～メルヘン 3.6 km 初級長雪道；上山只有纜車廂",
      tixSeason: "2026-27 官網公告・大人（現場／WEB）",
      tickets: [["1 日券", "¥7,000", "WEB 預購 ¥6,700"], ["4 小時券", "¥6,500", "WEB 預購 ¥6,200"], ["小學生 1 日", "¥2,800", "WEB 預購 ¥2,500"], ["雪上手扶梯 1 日", "¥2,800"], ["雪上手扶梯 未就學＋家長合計", "¥2,800"]],
      kids: "未就學免費（IC 卡 ¥500）；山腳有雪上手扶梯初學區，未就學小孩＋家長合計 ¥2,800（12 月下旬起）",
      lessons: "—", gear: "山腳租借；IG 說比 Teine 便宜",
      tips: ["往年 11 月下旬開季到 5 月初，2026-27 日期待官網公告", "FAV LUX 出發約 {T:drive.sapporo.kokusai.1} 分、從山鄉約 {T:drive.villa.kokusai.1} 分（都是冬天山路）：來回吃掉 2 小時以上，**不適合中午交換**", "海拔高、雪量多，粉雪和寬壓雪坡是札幌近郊最好的；纜車廂要排隊（IG 抱怨週末排很久）", "沒有夜滑；回程可順路定山溪泡湯"],
      links: [["官網", "https://www.sapporo-kokusai.jp/"], ["票價", "https://www.sapporo-kokusai.jp/price/"], ["雪道（中文）", "https://www.sapporo-kokusai.jp/tw/slopes/"]],
      status: "https://www.sapporo-kokusai.jp/slopes/", trailmap: "https://www.sapporo-kokusai.jp/tw/slopes/", webshop: "https://www.sapporo-kokusai.jp/webshop/", access: "https://www.sapporo-kokusai.jp/access/", kidsArea: "https://www.sapporo-kokusai.jp/slopes/snow-playground.php",
      video: "kokusai-hover.mp4", videoSm: "kokusai-hover-sm.mp4", img: "kokusai.jpg", top: [43.0640, 141.0700],
      summit: 1100, base: 630, est: true },
    { id: "bankei", group: "sapporo", rec: "近・短・壞天氣備案", name: "札幌盤溪滑雪場", ja: "さっぽろばんけいスキー場", tier: "札幌市區・最近", lat: 43.0305, lon: 141.2781, pid: "ChIJmSi-P27WCl8R2txwNVq41TA",
      season: null, seasonNote: "開季日待公告",
      hours: "各設施不同（看官網）；夜滑 16:00 起，觀光局寫到 22:00；わくわくスノーランド 10:00–16:00",
      scale: "17 條雪道、4 吊椅；離市區最近的雪場，在地人下班下課來滑；坡短，半天剛好",
      tixSeason: "2026-27 官網公告・大人",
      tickets: [["1 日券", "¥7,500"], ["4 小時券", "¥6,600"], ["夜滑券（16:00 起）", "¥2,500"], ["中學生以下 1 日", "¥6,000"], ["中學生以下 4 小時", "¥4,800"], ["わくわくスノーランド 1 日（3 歲起）", "¥1,000", "持吊椅票 ¥800"], ["スノーランド 親子（大人 1＋小孩 1）", "¥1,500"]],
      kids: "わくわくスノーランド：和雪道分開的小孩雪上樂園（雪橇、雪圈、雪地滑步車），3 歲起 ¥1,000、親子 ¥1,500，10:00–16:00；3 歲以下是否免費🔎",
      lessons: "—", gear: "現場租借",
      tips: ["往年 12 月上旬開季，2026-27 日期待官網公告", "FAV LUX 出發約 {T:drive.sapporo.bankei.1} 分：大人輪流滑、或天氣差只想滑 2 小時時最實用", "Snow Land 票價是 Teine 的一半，4 歲小孩在這裡玩雪最划算", "Google 3.9（1,800 則）：雪道短、人多；不是專程來練 carving 的地方"],
      links: [["官網", "https://www.bankei.co.jp/ski/"], ["票價", "https://www.bankei.co.jp/liftprice/"], ["札幌觀光局介紹", "https://visit.sapporo.travel/discover/snow/sapporo-bankei-ski-area/"]],
      status: "https://www.bankei.co.jp/ski/", img: "bankei.jpg",
      summit: null, base: 200, est: true },
    { id: "moiwa", group: "sapporo", rec: "市區最近・夜滑看夜景", name: "札幌藻岩山滑雪場", ja: "札幌藻岩山スキー場", tier: "札幌市區・夜滑", lat: 43.0110, lon: 141.3346, pid: "ChIJm5zDOwDVCl8RamLQR1ZQsBw",
      season: null, seasonNote: "2026-27 待公告",
      hours: "過往 09:00–21:00（夜滑 16:00–21:00）；2026-27 待公告",
      scale: "10 條雪道；Panorama 800 m 平均 12°、Crystal 470 m 平均 16°；滑下來正對札幌市區燈海",
      tixSeason: "2025-26 參考價（2026-27 待公告，1 月前再查）",
      tickets: [["1 日券", "¥7,000"], ["5 小時券", "¥6,000"], ["3 小時券", "¥5,000"], ["夜滑 16:00–21:00", "¥3,000"], ["夜滑 18:00–21:00", "¥2,500"]],
      kids: "3 歲以下免費；小孩雪地玩樂區的細節🔎",
      lessons: "—", gear: "北斜面入口租借（南斜面沒有租借）",
      gates: [
        { name: "北斜面入口（主入口）", sub: "售票・租借・接駁都在這邊", ja: "札幌藻岩山スキー場 北斜面", lat: 43.0110, lon: 141.3346, note: "藻岩下 1991；國道 230 南 36 條路口往山側。免費停車 450 台。" },
        { name: "南斜面入口", sub: "沒有租借", ja: "札幌藻岩山スキー場 南斜面", lat: 43.0030, lon: 141.3270, approx: true, note: "國道 230 往觀光道路方向。免費停車 250 台；兩邊是否能走過去官網沒寫。" }
      ],
      tips: ["往年 12 月上旬開季，2026-27 日期與票價待官網公告", "2025-26 起**全雪道開放單板**（舊文章寫禁單板已過時）", "官網預告 2026 年起更新吊椅，2026-27 營業內容可能變動", "雪道短，適合晚餐後大人去滑 2 小時順便看夜景"],
      links: [["官網", "https://sapporo-moiwa.jp/"], ["雪道", "https://sapporo-moiwa.jp/skiareainformation/"], ["票價", "https://sapporo-moiwa.jp/ticket/"], ["交通", "https://sapporo-moiwa.jp/access/"]],
      status: "https://sapporo-moiwa.jp/skiareainformation/#lift-status", cams: "https://sapporo-moiwa.jp/live", trailmap: "https://sapporo-moiwa.jp/skiareainformation/", access: "https://sapporo-moiwa.jp/access/",
      video: "moiwa-hover.mp4", videoSm: "moiwa-hover-sm.mp4", img: "moiwa.jpg",
      summit: null, base: 150, est: true },
    { id: "fus", group: "sapporo", rec: "便宜・小・純練習", name: "Fu's 藤野雪場", ja: "フッズスノーエリア", tier: "札幌南區・小型", lat: 42.9542, lon: 141.2794, pid: "ChIJuySTJF3TCl8RWP1iROEmYMU",
      season: null, seasonNote: "2026-27 待公告",
      hours: "過往日間至 16:00、夜滑 16:00 起（最後吊椅 20:45）；2026-27 待公告",
      scale: "6 條雪道、最長 1.8 km；IG 說是以小孩玩雪為主的小雪場，適合第一次滑",
      tixSeason: "2025-26 參考價（2026-27 待公告，1 月前再查）",
      tickets: [["1 日券", "¥3,300", "WEB 預購 ¥3,200"], ["4 小時券", "¥2,400", "WEB 預購 ¥2,300"], ["夜滑券（16:00 起）", "¥1,700"]],
      kids: "學齡前免費（IC 卡 ¥500）",
      lessons: "—", gear: "現場租借",
      tips: ["往年 12 月中開季，2026-27 待官網公告", "FAV LUX 出發約 {T:drive.sapporo.fus.1} 分，票價只有 Teine 的三分之一；評論說初學區不用買吊椅票、Google 寫營業到 16:30＋夜滑", "部分雪道偏陡，便宜不等於每條都好練；我們已經有 Kiroro 和富良野，這裡只是候補"],
      links: [["官網", "https://www.fujino-yagai-sports.jp/winter"], ["票價（中文）", "https://www.fujino-yagai-sports.jp/zh-hant/winter/fee"]],
      status: "https://www.fujino-yagai-sports.jp/winter", cams: "https://www.fujino-yagai-sports.jp/winter/live", access: "https://www.fujino-yagai-sports.jp/winter/access",
      summit: null, base: 200, est: true },
    { id: "asari", group: "otaru", stops: ["asari_ski"], name: "朝里川溫泉滑雪場", ja: "朝里川温泉スキー場", tier: "小樽近郊・中小型", lat: 43.1385, lon: 141.0293,
      season: null, seasonNote: "2026-27 待公告", hours: "09:00–16:00（12/20–3/1 到 17:00）；沒有夜滑（2025-26）", scale: "9 條雪道、5 吊椅；山頂 660 m、山腳 140 m；停車 800 台免費",
      tixSeason: "2025-26 參考價（2026-27 待公告，11 月再查）",
      tickets: [["1 日券", "¥5,500"], ["4 小時券", "¥4,900"], ["アフター14（14:00 起）", "¥3,500"], ["小孩 1 日", "¥3,300"], ["小孩 4 小時", "¥3,000"]],
      kids: "小孩票 ¥3,300；學齡前是否免費🔎", lessons: "—", gear: "現場租借",
      tips: ["往年 12 月中開季到 4 月初，2026-27 日期待官網公告（11 月）", "山鄉開車約 {T:drive.villa.asari.1} 分（最後一段是山路）；1/9 Kiroro 太擠或天氣差時的備案", "回程接湯の花 朝里殿泡湯"],
      links: [["官網", "https://asari-ski.com/"], ["雪況（Weathernews）", "https://weathernews.jp/ski/spot/31502/"]],
      status: "https://weathernews.jp/ski/spot/31502/",
      summit: 660, base: 140, est: true },
    { id: "kamui", group: "asahikawa", rec: "旭川最大・雪道長・票價便宜", name: "Kamui Ski Links（神居）", ja: "カムイスキーリンクス", tier: "旭川近郊・大雪場", lat: 43.704967, lon: 142.187102, pid: "ChIJXRr60nvrDF8RSuMZmPzKooE",
      season: null, seasonNote: "2026-27 開季日待公告（上一季 12/13–3/31）",
      hours: "09:00–17:00（官網）",
      scale: "26 條雪道（最長 4,000 m）、5 座雙人吊椅＋1 條纜車廂；山頂 751 m、山腳 150 m；免費停車約 2,000 台",
      tixSeason: "2026-27 官網公告",
      tickets: [["大人 1 日", "¥5,300"], ["大人 4 小時", "¥4,600"], ["小學生 1 日", "¥1,800"], ["65 歲以上 1 日", "¥4,500"]],
      kids: "學齡前免費（IC 卡押金 ¥500，還卡退回）；官網有 Kids Garden 小孩雪上區——開放時間、幾歲可以玩🔎",
      lessons: "官網有 KAMUI INTERNATIONAL SCHOOL（內容、價格出發前再查🔎）；Gacha 說旭川的雪場有申請到教學，是不是這座待問 Gacha",
      gear: "現場租借",
      tips: ["大人 1 日券比 Kiroro、富良野便宜約四成", "富良野小木屋開車約 {T:drive.furano.kamui.1} 分：住富良野那幾晚（1/11–1/16）才順路", "旭川市區、旭川機場、富良野都有雪場接駁巴士（要預約，看北海道觀光機構頁）"],
      links: [["官網", "https://www.kamui-skilinks.com/"], ["營業時間・票價", "https://www.kamui-skilinks.com/guide/"], ["交通", "https://www.kamui-skilinks.com/accsess/"], ["國際滑雪學校", "https://www.kamui-skilinks.com/international-school/"], ["雪況（Weathernews）", "https://weathernews.jp/ski/spot/31203/"], ["北海道觀光機構", "https://www.visit-hokkaido.jp/spot/detail_13195.html"]],
      status: "https://www.kamui-skilinks.com/today/", trailmap: "https://www.kamui-skilinks.com/today/#coursemap", access: "https://www.kamui-skilinks.com/accsess/",
      summit: 751, base: 150 },
    { id: "santa", group: "asahikawa", rec: "旭川市區旁・小雪場・夜滑到 21:00", name: "旭川 Santa Present Park", ja: "旭川サンタプレゼントパーク", tier: "旭川市區旁・小雪場", lat: 43.7609373, lon: 142.3025948, pid: "ChIJx56pD0rvDF8RM-s8QZXYZv4",
      season: null, seasonNote: "2026-27 待公告（往年 12 月–3 月）",
      hours: "中央吊椅 09:00–21:00、其他吊椅到 20:45；16:00 起是夜滑",
      scale: "6 條雪道、4 座吊椅；山頂 330 m、山腳 170 m；免費停車約 1,500 台；辦過兩次單板世界盃",
      tixSeason: "2025-26 參考價（2026-27 待公告，出發前再查）",
      tickets: [["大人 白天（到 16:00）", "¥4,200"], ["大人 5 小時", "¥3,600"], ["大人 夜滑（16:00–21:00）", "¥1,800"], ["小孩 白天", "¥3,300"], ["小孩 5 小時", "¥3,000"], ["小孩 夜滑", "¥1,100"], ["親子 白天套票", "¥6,000"], ["雪地手扶梯（10:00–15:00）", "¥1,500"]],
      kids: "小孩白天 ¥3,300、親子套票 ¥6,000；有雪地手扶梯（10:00–15:00）的初學坡；學齡前要不要票🔎",
      lessons: "Gacha 說旭川的雪場有申請到教學，是不是這座待問 Gacha",
      gear: "現場租借",
      tips: ["富良野小木屋開車約 {T:drive.furano.santa.1} 分；白天券 16:00 截止，之後是夜滑", "坡短、雪場小：大人練基本動作、小孩玩雪，半天剛好", "2026-27 票價待公告，出發前再查"],
      links: [["官網", "https://www.asahikawasantapresentpark.com/"], ["雪況（Weathernews）", "https://weathernews.jp/ski/spot/31204/"], ["北海道觀光機構", "https://www.visit-hokkaido.jp/en/spot/detail_13199.html"]],
      status: "https://weathernews.jp/ski/spot/31204/",
      summit: 330, base: 170 }
  ],
  /* 雪場分組：雪場頁的分組標題、圖例、首頁統計都讀這裡（顏色在 plan.js groupColor） */
  resortGroups: [
    { id: "main", short: "正式行程", title: "正式行程的三座", desc: "Onze 走路到、Kiroro 三天、富良野三天。" },
    { id: "sapporo", short: "札幌近郊", title: "札幌近郊・不在行程裡", desc: "1/16–1/18 想滑的話，看雪況和大人怎麼分組再挑一天。標 2025-26 的是上一季票價，出發前再查。", clim: "sapporo" },
    { id: "asahikawa", short: "旭川", title: "旭川・不在行程裡", desc: "Gacha 教練說旭川的雪場有申請到教學。住富良野那幾晚可以考慮：Kamui 大、票價便宜；Santa 小、離市區近、能夜滑。哪一座有許可待問 Gacha。", clim: "asahikawa" },
    { id: "otaru", short: "小樽備案", title: "小樽近郊備案", desc: "Kiroro 太擠或天氣差時的小雪場，回程順路泡湯。", clim: "villa" }
  ],

  /* 住宿 → 雪場車程 [公里, 一般分鐘, 下雪分鐘]：tools/refresh_legs.py 產生（和 legs.json 同一套算法：冬季山路另計），不要手改 */
  drive: {
    villa: { onze: [1.3, 5, 5], kiroro: [34.5, 50, 65], furano_kita: [135.7, 130, 170], teine: [17.0, 30, 35], kokusai: [27.0, 40, 50], bankei: [24.5, 30, 35], moiwa: [29.4, 35, 45], fus: [38.5, 40, 55], asari: [22.8, 40, 45], kamui: [130.8, 120, 155], santa: [141.8, 135, 175] },
    furano: { onze: [136.5, 135, 180], kiroro: [169.7, 170, 220], furano_kita: [1.9, 5, 5], teine: [131.3, 135, 175], kokusai: [158.4, 160, 210], bankei: [123.0, 130, 170], moiwa: [120.2, 125, 160], fus: [129.3, 130, 170], asari: [158.0, 160, 210], kamui: [56.8, 65, 90], santa: [62.6, 80, 100] },
    sapporo: { onze: [23.4, 30, 40], kiroro: [56.5, 85, 105], furano_kita: [113.4, 110, 145], teine: [18.3, 25, 35], kokusai: [44.6, 65, 80], bankei: [8.6, 15, 20], moiwa: [6.4, 10, 10], fus: [15.5, 15, 20], asari: [44.9, 70, 90], kamui: [116.9, 110, 145], santa: [128.0, 125, 160] }
  },

  /* 地圖上的地點：type = stay | ski | sight | food | onsen | shop | grocery | hospital | transport */
  places: [
    { type: "transport", name: "新千歲機場", stop: "cts", ja: "新千歳空港", lat: 42.7868, lon: 141.683, note: "去程：國際線入境、領完行李後到一樓出口右手邊【98 許可車專用】站牌，打電話或 LINE 叫租車接駁（官網取車流程頁）；回程：租車店接駁車送到航廈" },
    { type: "transport", name: "北海道租車 新千歲機場店", stop: "rental", ja: "カーレンタル北海道 新千歳空港店（千歳市青葉8-9-8）", lat: 42.823071, lon: 141.6630606, note: "官網：09:00–18:00；機場免費接駁約 10 分" },
    { type: "transport", name: "富良野站（保姆巴士）", stop: "fstn", ja: "富良野駅", lat: 43.3468945, lon: 142.3912825, note: "1/14 下午送保姆" },
    { type: "sight", name: "小樽運河", stop: "canal", lat: 43.197846, lon: 141.0032753, note: "天黑後煤氣燈亮起" },
    { type: "sight", name: "小樽水族館", ja: "おたる水族館", lat: 43.2370, lon: 141.0114, note: "冬季企鵝雪地散步（上一季 11:30／12:40／13:30／14:40）" },
    { type: "sight", name: "旭山動物園", stop: "zoo", lat: 43.7689713, lon: 142.4791319, note: "冬季 10:30–15:30（最後入園 15:00）；企鵝散步往年 11:00、14:30，26–27 季未公告；國中以下免費" },
    { type: "sight", name: "千代田牧場 Farm's Chiyoda", stop: "chiyoda", ja: "ファームズ千代田", lat: 43.5427, lon: 142.4918, note: "營業 10:00–15:00（待確認冬季）" },
    { type: "sight", name: "白鬚瀑布", stop: "shirahige", ja: "白ひげの滝", lat: 43.4746, lon: 142.6392, note: "日落–21:00 點燈，免費" },
    { type: "sight", name: "青池", stop: "aoiike", ja: "青い池", lat: 43.4935, lon: 142.6141, note: "1 月 17:00–21:00 點燈；停車 ¥1,000" },
    { type: "sight", name: "森林精靈露台", stop: "ningle", ja: "ニングルテラス", lat: 43.3233257, lon: 142.3558861, note: "森林小木屋商店街，晚上點燈" },
    { type: "sight", name: "瀧野鈴蘭丘陵公園（雪世界）", stop: "takino", ja: "滝野すずらん丘陵公園 滝野スノーワールド", lat: 42.9125, lon: 141.3814, note: "200 m 雪地滑圈、兒童雪地遊戲" },
    { type: "sight", name: "圓山動物園", ja: "円山動物園", lat: 43.0488, lon: 141.3061, note: "冬季時間待確認" },
    { type: "sight", name: "AOAO SAPPORO 水族館", stop: "aoao", lat: 43.0578, lon: 141.3536, note: "從 FAV LUX 走路可到" },
    { type: "sight", name: "白色戀人公園", stop: "shiroi", ja: "白い恋人パーク", lat: 43.0889, lon: 141.2717, note: "室內、甜點" },
    { type: "food", name: "若鶏時代なると 本店", stop: "naruto", area: "小樽", lat: 43.2003732, lon: 140.9950942, note: "炸半雞 ¥980；約 250 席、有座敷；11:00–21:00", tags: ["8 人 OK", "座敷"] },
    { type: "food", name: "回轉壽司 和楽 小樽店", stop: "waraku", ja: "回転寿司 和楽 小樽店", area: "小樽", lat: 43.196278, lon: 141.0047969, note: "11:00–22:00；小孩自己挑", tags: ["回轉壽司"] },
    { type: "food", name: "小樽寿司屋通り 日本橋", area: "小樽", lat: 43.1949, lon: 140.9984, approx: true, note: "掘りごたつ和室、50 人大廣間；週四休", tags: ["座敷", "週四休"] },
    { type: "food", name: "三角市場（海鮮丼）", ja: "三角市場", area: "小樽", lat: 43.1985, lon: 140.9939, note: "早上到下午；店小人擠", tags: ["早餐"] },
    { type: "food", name: "LeTAO 本店", stop: "letao", area: "小樽", lat: 43.191311, lon: 141.007433, note: "09:00–18:00；2F 咖啡 LO 17:30", tags: ["甜點"] },
    { type: "food", name: "Kiroro 山上餐廳群", ja: "キロロ マウンテンセンター", area: "Kiroro", lat: 43.0680, lon: 140.9895, approx: true, note: "Pizzeria、Lumière 自助餐、Cafe Le Lift；8 人包廂 The Lounge ¥18,000", tags: ["午餐"] },
    { type: "food", name: "餃子茶屋 あおぞら", area: "小樽", lat: 43.1384, lon: 141.1821, approx: true, note: "11:00–19:00；週一、二休；石狩灣海景", tags: ["週一二休"] },
    { type: "food", name: "くまげら", stop: "kumagera", area: "富良野", lat: 43.3450343, lon: 142.3911696, note: "山賊鍋、和牛壽喜燒；11:30–21:30；週三休；停車 50 台", tags: ["週三休"] },
    { type: "food", name: "唯我独尊（蛋包咖哩）", stop: "yuiga", ja: "唯我独尊", area: "富良野", lat: 43.344792, lon: 142.3894602, note: "30 席、不能訂位、只收現金；週一休", tags: ["只收現金", "週一休"] },
    { type: "food", name: "Fenix Restaurant & Bar", stop: "fenix", area: "富良野", lat: 43.3438793, lon: 142.3606818, note: "北之峰纜車站對面；天婦羅、涮涮鍋", tags: ["滑完最近"] },
    { type: "food", name: "富良野チーズ工房", area: "富良野", lat: 43.3207, lon: 142.3772, note: "起司、披薩、冰淇淋（冬季時間待確認）", tags: ["親子"] },
    { type: "food", name: "じゅんぺい（炸蝦丼）", stop: "junpei", ja: "じゅんぺい", area: "美瑛", lat: 43.5892501, lon: 142.4680775, note: "11:00–15:00；週一休；現金或 PayPay", tags: ["只收現金", "週一休"] },
    { type: "food", name: "旭川拉麵村", ja: "あさひかわラーメン村", area: "旭川", lat: 43.7817, lon: 142.4141, note: "8 家拉麵；11:00–20:00；免費停車", tags: ["動物園順路"] },
    { type: "food", name: "サッポロビール園（成吉思汗）", stop: "beer", ja: "サッポロビール園", area: "札幌", lat: 43.0709, lon: 141.3688, note: "兒童椅、兒童餐具；10–120 人包廂；訂位 0570-098-346", tags: ["8 人 OK", "要訂位"] },
    { type: "food", name: "札幌かに本家 札幌駅前本店", stop: "kani", area: "札幌", lat: 43.0653, lon: 141.3533, approx: true, note: "螃蟹；掘りごたつ包廂 2–16 人；午餐兒童會席", tags: ["包廂", "要訂位"] },
    { type: "food", name: "湯咖哩 SOUL STORE", stop: "soul", ja: "スープカレー SOUL STORE", area: "札幌", lat: 43.0557, lon: 141.3477, approx: true, note: "FAV LUX 走路可到；¥1,300–1,850", tags: ["步行可到"] },
    { type: "food", name: "湯咖哩 MATALE 円山店", ja: "スープカレー MATALE 円山店", area: "札幌", lat: 43.0557, lon: 141.3225, approx: true, note: "有兒童餐；可配圓山動物園", tags: ["兒童餐"] },
    { type: "food", name: "二条市場", area: "札幌", lat: 43.0582, lon: 141.3585, note: "海鮮丼早餐（ながもり 07:00 起）", tags: ["早餐"] },
    { type: "onsen", name: "湯の花 朝里殿", stop: "asari", lat: 43.1573, lon: 141.0442, note: "09:00–23:00；大人 ¥980、小學生 ¥400、1–5 歲 ¥200；Kiroro 回程順路（1/9）" },
    { type: "onsen", name: "湯の花 手宮殿", lat: 43.2122, lon: 141.0086, note: "09:00–23:00；大人 ¥980、1–5 歲 ¥200；小樽市區、壽司屋通り附近，有停車場（1/8 大人泡）" },
    { type: "onsen", name: "小樽温泉 オスパ", lat: 43.1878, lon: 141.0163, note: "24 小時；小樽築港，回銭函順路的備案" },
    { type: "shop", name: "Mountain Shop Vainqueur（Kiroro）", lat: 43.0670, lon: 140.9910, approx: true, note: "雪板、雪靴、固定器；打蠟 ¥3,500" },
    { type: "shop", name: "ICI 石井スポーツ 札幌店", lat: 43.0711, lon: 141.3321, approx: true, note: "雪具專門店；10:00–20:00" },
    { type: "shop", name: "Alpen Outdoors 札幌月寒", lat: 43.0367, lon: 141.3925, approx: true, note: "旗艦店；10:00–21:00" },
    { type: "shop", name: "狸小路商店街", stop: "tanuki", lat: 43.0572, lon: 141.3527, note: "藥妝、唐吉訶德；有屋頂" },
    { type: "shop", name: "三井アウトレット 札幌北広島", lat: 42.9714, lon: 141.4713, note: "10:00–20:00；免費停車約 2,600 台" },
    { type: "shop", name: "ポケモンセンターサッポロ", lat: 43.0675, lon: 141.3495, note: "大丸札幌店內" },
    { type: "shop", name: "TNOC THE STORE SAPPORO（狸小路）", stop: "tnoc", lat: 43.0573421, lon: 141.3521718, note: "10:00–21:00（週六只到 17:00），週三休；2F 是咖啡店（霜淇淋、司康），逛不動的人可以先上去坐" },
    { type: "grocery", name: "イオンモール札幌発寒", stop: "aeon", lat: 43.0960621, lon: 141.2775757, note: "1/7 從機場過來順路採買＋美食街；專門店 10:00–21:00（超市更早開、更晚關），大型免費停車場" },
    { type: "grocery", name: "ラルズマート 銭函", lat: 43.1432, lon: 141.1460, note: "離山鄉最近的超市" },
    { type: "grocery", name: "コープさっぽろ 富良野", stop: "coop_furano", lat: 43.3382395, lon: 142.3928396, note: "富良野市區超市" },
    { type: "hospital", name: "手稻溪仁會醫院（急診）", ja: "手稲渓仁会病院", lat: 43.1221, lon: 141.2431, note: "離山鄉最近的大醫院急診" },
    { type: "hospital", name: "富良野協會醫院", ja: "富良野協会病院", lat: 43.3481, lon: 142.3923, note: "離小木屋最近的醫院" }
  ],

  days: [
    { date: "2027-01-07", base: "villa", title: "抵達北海道", sub: "取車、逛 TNOC、採買、入住山鄉", sun: ["07:07", "16:15", "16:48"], alert: "第一天就在天黑的雪路開車，不熟車的人先別開" },
    { date: "2027-01-08", base: "villa", title: "Kiroro 滑雪", sub: "Gacha 教練全天課；滑完大人泡湯、小樽吃壽司", sun: ["07:07", "16:16", "16:49"], alert: "Kiroro 森林の湯 現在只給房客用，不開放日歸——改去小樽的湯の花 手宮殿（離壽司店 4 分）。不泡湯的話晚餐可以提早約一小時" },
    { date: "2027-01-09", base: "villa", title: "Kiroro 滑雪", sub: "連假第一天；Gacha 教練全天課，回程泡湯", sun: ["07:07", "16:17", "16:50"], alert: "成人之日三連休，雪場與餐廳較擠" },
    { date: "2027-01-10", base: "villa", title: "半天 Kiroro＋小樽", sub: "上午 Gacha 教練半天課；下午四個大人走堺町通，等運河的煤氣燈亮起來", sun: ["07:06", "16:18", "16:51"], },
    { date: "2027-01-11", base: "furano", title: "旭山動物園 → 富良野", sub: "成人之日：假日拿來移動和看動物", sun: ["07:03", "16:12", "16:45"], alert: "全天車程是 13 天最長的一天（上面「今天開車」有一般／下雪兩個數字）。這天是成人之日三連休的最後一天：從小樽往旭川跟札幌出遊的車流同方向，動物園開門（{open:zoo}）前後停車場就會滿，{t:villa} 準時出發、別在路上多停；下午從旭川往富良野是反方向，不會卡到回札幌的車流。上面的車程已經是保守算法（平均 60 km/h），連假再多抓 20–30 分當緩衝。" },
    { date: "2027-01-12", base: "furano", title: "富良野滑雪", sub: "上午教練課，平日練 carving", sun: ["07:01", "16:15", "16:48"], },
    { date: "2027-01-13", base: "furano", title: "富良野滑雪", sub: "可再請一次教練", sun: ["07:01", "16:16", "16:49"], },
    { date: "2027-01-14", base: "furano", title: "上午滑雪，送保姆", sub: "下午送保姆到巴士站，之後兩家自己顧小孩", sun: ["07:01", "16:17", "16:50"], },
    { date: "2027-01-15", base: "furano", title: "美瑛親子日", sub: "沒有保姆，全家一起：炸蝦丼、雪上樂園餵羊駝、瀑布、青池點燈", sun: ["07:00", "16:19", "16:51"], alert: "回程是天黑的山路，{dep:aoiike} 前出發；下雪的話青池會晚到，看完瀑布點燈就直接回程也可以" },
    { date: "2027-01-16", base: "sapporo", title: "富良野 → 札幌", sub: "退房後直開札幌，停好車就用走的：拉麵、狸小路、電視塔看日落，晚上啤酒園", sun: ["07:03", "16:25", "16:57"], alert: "{by:favlux} 前把兩台車停好，之後三晚不動；晚上去啤酒園搭計程車（一台 4 人，兩台）或地鐵東豐線。下雪路況會晚到：那就跳過狸小路、電視塔，直接入住休息，{at:beer} 準時到啤酒園就好" },
    { date: "2027-01-17", base: "sapporo", title: "羊之丘・白色戀人", sub: "週日：早上玩雪、中午壽司、下午巧克力工廠，晚餐義大利菜，早點睡", sun: ["07:02", "16:26", "16:58"], alert: "天氣太差就改室內：AOAO 水族館（走路到）＋ 青少年科學館；羊之丘雪上樂園 {close:hitsujigaoka} 關" },
    { date: "2027-01-18", base: "sapporo", title: "札幌散步・螃蟹", sub: "平日：車不開，走路逛札幌、吃豚丼、下午茶、最後採購；晚上螃蟹會席，早點睡", sun: ["07:02", "16:27", "16:59"], alert: "隔天一早搭機，雪具今晚要弄乾打包。想滑雪的大人可以自己開一台車去 Teine 滑半天（選項，不是行程），其他人照走路的安排" },
    { date: "2027-01-19", base: "sapporo", title: "回台灣", sub: "{t:favlux} 出發，{T:rental.returnBy} 前還車", sun: ["07:01", "16:28", "17:00"], alert: "退稅商品不要拆、不要吃，收據集中" }
  ],

  /* 1/7–1/19 歷年平均（氣象廳 1991–2020；Kiroro 山頂為模型值） */
  climate: {
    villa: { label: "小樽", tmax: -0.7, tmin: -5.9, snow: 5.0 },
    kiroro: { label: "Kiroro 山腳", tmax: -5.5, tmin: -10.8, snow: 8.0 },
    furano: { label: "富良野", tmax: -4.1, tmin: -14.7, snow: 4.9 },
    sapporo: { label: "札幌", tmax: -0.5, tmin: -6.5, snow: 4.4 },
    asahikawa: { label: "旭川", tmax: -3.5, tmin: -11.9, snow: 4.1 },
    biei: { label: "美瑛", tmax: -4.1, tmin: -15.1, snow: 5.2 }
  },

  nanny: { start: "08:00", end: "18:00", overtime: "NT$550／時", lastDay: "2027-01-14", bus: "14:00", busStop: "fstn" },
  /* 團體人數：保姆在的日子 9 人，1/14 送走保姆後 8 人；文字裡用 {party} 標記，會自己照日期換 */
  party: { adults: 4, kids: 4, withNanny: "9 人（4 大 4 小＋保姆）", noNanny: "8 人（4 大 4 小）" },
  /* 航班：唯一來源。首頁開場、1/7・1/19 時間表機場站、出發前準備的航班卡都從這裡產生 */
  flight: {
    airline: "長榮航空",
    out: { date: "2027-01-07", no: "BR116", from: "桃園 T2", dep: "09:30", to: "新千歲", arr: "14:05" },
    back: { date: "2027-01-19", no: "BR165", from: "新千歲", dep: "12:10", to: "桃園 T2", arr: "16:05" }
  },
  /* Kiroro 教練（10/27 Sean 定）：Gacha（Snow Surfing Japan）1/8、1/9 全天、1/10 上午半天（先排半天，到時候看狀況）
     時間表的到達／離開、說明文字、待辦都讀這裡；check.py 確認開課前 15 分到雪場、下課後才離開 */
  coach: { name: "Gacha", org: "Snow Surfing Japan", resort: "kiroro", start: "09:00", end: "16:00", halfEnd: "12:00",
           full: ["2027-01-08", "2027-01-09"], half: ["2027-01-10"], lang: "簡單英文＋翻譯 App（不會中文）", url: "https://snowsurfing-japan.stores.jp/reserve/snowsurfing_japan/1865332",
           /* 核准後把 status 改成 "已確定"；行程備註會跟著顯示 */
           status: "等 Kiroro 核准外部教練教學（Gacha 10/28 提交申請，可能要等一陣子）" },
  zooLastEntry: "15:00",

  rental: {
    company: "カーレンタル北海道 新千歳空港店（北海道租車）",
    hours: "09:00–18:00（官網營業所頁）", open: "09:00", returnBy: "10:00",
    /* 電話、最後送迎只寫這裡：1/7 機場站備註、租車卡、緊急電話都從這裡帶（{T:rental.phone}、{T:rental.lastPickup}） */
    phone: "0123-22-4040", lastPickup: "17:30",
    pickup: ["入境、領完行李後，出境大廳出來右手邊（經過便利商店）到一樓", "出口右手邊【98 許可車專用】站牌", "人到站牌後再打電話或 LINE 聯絡，接駁車約 15 分鐘到（只能停 10 分鐘）；最後送迎 {T:rental.lastPickup}，航班延誤先打電話", "到店出示：台灣駕照正本＋日文譯本＋護照（每位駕駛）"],
    ret: ["契約時間內歸還；暴風雪延誤要先通知", "加滿油並附加油收據（未加滿收 ¥5,000–12,000）", "冬季沒有安心險：事故要報警，NOC 自付 ¥3–10 萬"],
    contact: [["LINE ID", "@jhs4331b"], ["WhatsApp", "+81 80-8299-4040（日文官網）／+81 90-1521-4040（中文、英文官網）——兩個頁面寫的不一樣，打電話或 LINE 最穩"]]
  },

  emergency: [
    ["警察", "110"], ["消防・救護車", "119"],
    ["日本觀光局訪客熱線（24 小時，有中文）", "050-3816-2787"],
    ["台北駐日經濟文化代表處 札幌分處", "011-222-2930"],
    ["札幌分處 急難救助（重大緊急）", "080-1460-2568"],
    ["租車公司（事故・延誤）", "{T:rental.phone}"]
  ],

  links: [
    ["北海道道路資訊（開發局）", "https://info-road.hdb.hkd.mlit.go.jp/"],
    ["北の道ナビ（路況攝影機）", "https://northern-road.jp/navi/"],
    ["NEXCO 高速公路交通資訊", "https://www.driveplaza.com/traffic/"],
    ["氣象廳 警報・注意報", "https://www.jma.go.jp/bosai/warning/"]
  ],

  /* 行李與雪具空間：兩台 Delica D:5 載 9 人＋雪具。尺寸是 D:5 公開規格與媒體實測，租到的年式請以現場為準 */
  luggage: {
    car: "三菱 Delica D:5（兩台）",
    seats: "一般為 8 人座（2＋3＋3）；租車公司確認是 7 還是 8 人座",
    split: ["車 1：3 大 2 小（第三排放一個小孩＋保姆，或第三排收起只載 4 人）", "車 2：1 大 2 小＋保姆（1/14 之後 8 人：車 1 4 人、車 2 4 人）"],
    dims: [["室內長 × 寬 × 高", "2,980 × 1,505 × 1,310 mm"], ["第三排收起（跳ね上げ）後的行李區長度", "約 1,200 mm（5 人坐）"], ["第三排坐人時的行李區", "很淺，只放得下幾個背包"]],
    fit: [
      "**板袋塞不進 1,200 mm 的行李區**：單板袋 150–165 cm、雙板袋到 203 cm。放法是把第二排一側座椅往前推到底，板袋從後門斜放到第二排腳邊（室內長 2,980 mm 夠），或第二排折一張椅子平放——那一台只能載 4 人",
      "4 人滑雪＝4 個板袋＋4 個靴袋，加上 9 人的行李箱：兩台車都要用到第二排空間，**行李箱一人一件 24 吋以內**，雪衣穿在身上或裝軟袋",
      "最省事的解法是**車頂雪具箱／雪板架**：問租車公司有沒有、每天多少錢；有的話板袋全上車頂，車內只剩行李。**代價：裝了之後車高超過 2.1 m，1/7 狸小路和札幌三天的室內停車場都進不去**，只能找露天平面停車場",
      "小孩的雪具在雪場租，不帶；保姆行李盡量一件"
    ],
    airline: "長榮雪具托運：每件 ≤ 203 cm、≤ 23 kg，板袋裡不放衣物；1/5 09:30 前通知托運"
  },

  /* 保險：已經有的、這趟該保的、容易漏的。只是整理給大家對保單用，不是保險建議；條款以各公司保單為準（2026-10-26 整理，來源在知識庫 14） */
  insurance: {
    have: [
      ["健保海外急診核退", "有，但很少：門診每次上限約 NT$1,133、急診 NT$3,825、住院每日 NT$6,887（2026 年 1–3 月額度，每季調整），回台 6 個月內申請。日本醫療對外國人全額自費，這個只是零頭"],
      ["租車 CDW 免責補償", "已含（自負額 ¥30,000）；**冬季不受理安心險**，出事要付 NOC 營業損失 ¥7–10 萬＋超額拖吊"],
      ["信用卡附帶保險", "通常只保搭機期間，且要用那張卡付機票；租車自負額保障要看卡別——**把要刷機票和租車的卡別告訴我**"],
      ["保姆", "合約規定出發前由兩家幫她買旅平險＋海外突發疾病醫療險（1/7–1/15）"]
    ],
    need: [
      ["旅平險（意外身故／失能＋海外醫療）", "9 個人都要有。**先問保險公司：休閒滑雪、單板在不在保障內**——有的條款只排除「表演、比賽」（那就有保），有的把滑雪列為除外活動（要加特定活動險）。只保雪道內、不保 backcountry 就夠"],
      ["海外突發疾病醫療", "一定要附加：小孩發燒、腸胃炎、中耳炎比滑雪受傷更常見，日本看診動輒上萬日圓"],
      ["緊急救援／醫療轉送", "雪場救護、直升機、轉送回台都靠這條；保額要足"],
      ["旅遊不便險", "班機延誤（通常 ≥ 4 小時，**大雪、暴風雪也賠**）、班機取消改訂、旅程更改（被困住的住宿交通）、行李延誤（≥ 6 小時）／遺失；**雪具當行李賠，單件有上限**"],
      ["個人責任險", "滑雪撞到別人、弄壞別人的東西；旅平險常有附加，確認額度"]
    ],
    miss: [
      "**要在大雪／暴風雪警報發布前投保**：警報出來後投保，同一事件不賠；保險公司也可能臨時暫停受理日本行程——出發前兩週就買好",
      "滑雪在不在保障內：看「除外責任」有沒有「滑雪」四個字，不要只看 DM",
      "15 歲以下小孩的身故保額有法定上限，但醫療險照保；給每個小孩都保醫療",
      "行李延誤險只賠去程（到日本機場 6 小時後沒拿到），回台不賠；雪具遺失的單件上限可能低於一塊板",
      "租車 NOC 和自負額：旅平險通常不賠，看信用卡或另買租車險；開門撞到隔壁車、爆胎、加錯油租車公司本來就不賠",
      "到了日本才發現沒保：東京海上有給訪日旅客的旅行保險，入境後幾天內可線上買（含滑雪），出發前先查好網址當備案"
    ]
  },

  todo: [
    ["現在", "等 Kiroro 核准 {T:coach.name} 在雪場教學：他 10/28 提交申請，可能要等一陣子；核准前先不刷訂金，沒過要另找 Kiroro 自己的雪校或其他教練"],
    ["現在", "問 {T:coach.name}：旭川是哪一座雪場有申請到教學（Kamui Ski Links 或 Santa Present Park）、住富良野那幾天要不要排一天給他教——兩座的票價、車程在滑雪地圖「旭川」那組"],
    ["現在", "4 位駕駛（Sean、Lo、Ethan、阿茹）到監理所辦駕照日文譯本"],
    ["現在", "問租車公司：13 天 HEP 怎麼算、雪胎與 4WD、Delica 油種、幾人座（7 或 8）、有沒有車頂雪具箱／雪板架可租（裝了車高會超過 2.1 m，札幌市區室內停車場進不去；見下方「行李與雪具」）"],
    ["現在", "問山鄉：入住要先到哪裡報到、Villa 正確地址（訂房網站寫 2-3／2-6／2-13 不一樣，導航現在指到春 Villa 本身）；1/7 預計 {t:villa@01-07} 到（入住 15:00–20:00）、兩台 Delica 車位（一休寫每棟 2 格）、雪具放哪裡乾"],
    ["現在", "問富良野小木屋：兩台車位、雪具乾燥空間"],
    ["11 月", "每個小孩戴一顆 AirTag（4 顆，先綁好 Find My，放雪衣內袋）"],
    ["出發前", "札幌停車想保險就用 akippa／特P 預約 1/16–1/19 兩個平面車位；不然 1/16 13:00 前到パラカ（見單日頁）"],
    ["11 月", "Kiroro 核准後預約 {T:coach.name}（{T:coach.org} 官網，代表人一人預約）：1/8、1/9 全天 {T:coach.start}–{T:coach.end}、1/10 上午半天——半天也是選 {T:coach.start}–{T:coach.end} 的方案，預約後 email 說明；北海道要 3 天起、開課前至少 1 個月（12/8 前），刷訂金 ¥10,000"],
    ["11 月", "{T:coach.name} 規定：不能改期；開課 24 天前起不能取消、訂金不退（天候或教練因素取消會退訂金）。1/10 要不要改全天，預約時就跟他講好"],
    ["11 月", "富良野教練（1/12、1/13）：照原計畫 1 對 4 團體課，預計每人 NT$5,000–6,000／天"],
    ["出發前", "準備日幣現金付 {T:coach.name}：4 人 2 全天＋1 上午，課程費＋北海道地區服務費 ¥50,000 約 ¥274,000，當天付現（教練不會中文，用簡單英文＋翻譯 App）"],
    ["現在", "訂位：1/18 氷雪の門 螃蟹會席（評論說要提前 1–2 個月）；11 月再訂 1/16 ビール園 GARDEN GRILL 包廂、1/17 KUJIRA"],
    ["11 月", "保險：把兩家現有保單的保障明細給我比對（見下方「保險」）；旅平險＋不便險出發前兩週就要買好，等大雪警報出來就買不到"],
    ["11 月", "保姆：幫她買旅平險＋海外醫療險；確認每段住宿有獨立房間與回程航班"],
    ["11 月", "長榮雪具托運確認（≤ 203 cm、≤ 23 kg，板袋不放衣物）"],
    ["12 月", "旭山動物園企鵝散步開始日；1/17 札幌親子景點"],
    ["12 月", "eSIM 或 Wi-Fi 分享器（每台車至少一支能導航）"],
    ["出發前", "Visit Japan Web 入境登錄＋退稅退款方式"],
    ["出發前", "1/5 09:30 前通知長榮雪具托運"],
    ["出發前", "查暴風雪警報與道央道封路"]
  ]
};

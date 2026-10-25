/* 餐廳清單（整理自 12_餐廳.md；時間多為 2025–26 資料，出發前一週再確認）。
   area：小樽／Kiroro／銭函／富良野／美瑛・旭川／札幌。closed：公休星期（0=日…6=六）。fit：9 人帶 4 個幼兒 ok？ */
window.FOOD = [
  /* Kiroro 山上（午餐） */
  { id: "lumiere", name: "Cafeteria Lumière", area: "Kiroro", kind: "自助午餐", what: "焗烤、中華、赤井川豬，Mountain Center 1F", hours: "11:00–15:00 LO", fit: "ok", lat: 43.0674, lon: 140.9904, meal: "lunch" },
  { id: "pizzeria", name: "Pizzeria Akaigawa", area: "Kiroro", kind: "披薩", what: "可外帶，Mountain Center 1F", hours: "11:00–16:30 LO", fit: "ok", lat: 43.0674, lon: 140.9904, meal: "lunch" },
  { id: "lelift", name: "Cafe Le Lift", area: "Kiroro", kind: "輕食", what: "熱湯、甜點，Mountain Center 1F", hours: "11:00–15:00 LO", fit: "ok", lat: 43.0674, lon: 140.9904, meal: "lunch" },
  { id: "brasserie", name: "Brasserie Akaigawa", area: "Kiroro", kind: "麵食", what: "在地蔬菜與肉，纜車站 1F", hours: "11:00–15:00 LO", fit: "ok", lat: 43.0674, lon: 140.9904, meal: "lunch" },
  { id: "lounge", name: "The Lounge Premium", area: "Kiroro", kind: "付費包廂", what: "沙拉吧、湯、飲料；8 人包廂 ¥18,000，只有 4 間要預約 0135-34-7176。帶 4 個小孩有固定座位最省力", hours: "午餐時段", fit: "best", lat: 43.0674, lon: 140.9904, meal: "lunch" },
  { id: "yukashi", name: "Yukashi Alpine Bistro", area: "Kiroro", kind: "北海道料理", what: "Yu Kiroro 飯店內，滑完直接吃晚餐不用下山；預約 0135-48-6785", hours: "晚餐 17:30–21:30 LO", fit: "ok", lat: 43.0699, lon: 140.9889, meal: "dinner" },
  /* 山鄉附近 */
  { id: "aozora", key: "あおぞら", name: "餃子茶屋 あおぞら 銭函3丁め", area: "銭函", kind: "餃子定食", what: "看得到石狩灣海景，份量大；山鄉 10 分", hours: "11:00–19:00", closed: [1, 2], fit: "ok", lat: 43.139, lon: 141.149, approx: true },
  { id: "aeonfood", key: "AEON", name: "イオンモール札幌発寒 美食街", area: "銭函", kind: "美食街", what: "快、不用等位、順便採買；山鄉 15／25 分。下大雪的備案", hours: "依各店", fit: "ok", lat: 43.0962, lon: 141.2768 },
  /* 小樽 */
  { id: "naruto", key: "なると", name: "若鶏時代なると 本店", area: "小樽", kind: "炸雞定食", what: "炸半雞 ¥980、ザンギ、壽司；兩層樓約 250 席、有座敷，在地家庭聚餐首選", hours: "11:00–21:00（LO 20:30）", closed: [], fit: "best", lat: 43.1994, lon: 140.9956, approx: true },
  { id: "waraku", key: "和楽", name: "回轉壽司 和楽 小樽店", area: "小樽", kind: "回轉壽司", what: "一盤 ¥194–443；小孩自己挑、上菜快。觀光客多可能要等", hours: "11:00–22:00（LO 21:30）", closed: [], fit: "best", lat: 43.1962, lon: 141.005, approx: true },
  { id: "nihonbashi", key: "日本橋", name: "小樽寿司屋通り 日本橋", area: "小樽", kind: "壽司", what: "掘りごたつ和室、50 人大廣間", hours: "11:00–15:00、17:00–21:00", closed: [4], fit: "best", lat: 43.1949, lon: 140.9984, approx: true },
  { id: "takeno", name: "小樽 たけの寿司（堺町）", area: "小樽", kind: "壽司", what: "壽司、丼；2 樓大桌", hours: "11:00–16:00、17:00–21:00", closed: [4], fit: "ok", lat: 43.192, lon: 141.002, approx: true },
  { id: "fukuzushi", name: "小樽 福鮨（堺町）", area: "小樽", kind: "壽司", what: "大桌與座敷；中午人多", hours: "10:30–20:00", fit: "ok", lat: 43.1915, lon: 141.003, approx: true },
  { id: "masazushi", name: "政寿司 本店", area: "小樽", kind: "壽司", what: "老字號；時間、訂位待確認", hours: "🔎", fit: "unknown", lat: 43.195, lon: 140.996, approx: true },
  { id: "sankaku", name: "三角市場（小樽站旁）", area: "小樽", kind: "海鮮丼", what: "自選海鮮丼；店小人擠，適合大人輪流去", hours: "早上到下午（さんかく亭 8:30–16:00 週四休）", fit: "warn", lat: 43.1975, lon: 140.9935, approx: true, meal: "lunch" },
  { id: "daruo", name: "ダルオ", area: "小樽", kind: "湯咖哩", what: "辣度可調", hours: "11:30–15:00、17:00–21:00", closed: [3], fit: "ok", lat: 43.195, lon: 141.0, approx: true },
  { id: "letao", name: "LeTAO 本店（堺町）", area: "小樽", kind: "甜點", what: "2F 咖啡 LO 17:30；7 歲以上每人限點一份；週末不接受訂位", hours: "09:00–18:00", closed: [], fit: "ok", lat: 43.1908, lon: 141.004, approx: true, meal: "snack" },
  /* 富良野 */
  { id: "kumagera", key: "くまげら", name: "くまげら", area: "富良野", kind: "鄉土料理", what: "山賊鍋（鹿、鴨、雞）、富良野和牛壽喜燒、起司豆腐；停車 50 台；0167-39-2345", hours: "11:30–21:30（LO 21:00）", closed: [3], fit: "best", lat: 43.3452, lon: 142.3912 },
  { id: "yuiga", key: "唯我独尊", name: "唯我独尊", area: "富良野", kind: "蛋包咖哩", what: "蛋包咖哩＋香腸是招牌；30 席、不能訂位、只收現金，11:00 開門就去", hours: "11:00–21:00（LO 20:30）", closed: [1], fit: "warn", lat: 43.3449, lon: 142.3895 },
  { id: "fenix", key: "Fenix", name: "Fenix Restaurant & Bar", area: "富良野", kind: "綜合（天婦羅、涮涮鍋、拉麵）", what: "北之峰纜車站對面，滑完雪最近的晚餐", hours: "早午晚，每天營業", fit: "ok", lat: 43.3404, lon: 142.3433 },
  { id: "prince", name: "新富良野王子飯店餐廳", area: "富良野", kind: "自助／和食", what: "下雪天的保底選擇；森林精靈露台旁", hours: "🔎", fit: "ok", lat: 43.3234, lon: 142.3563 },
  { id: "cheese", name: "富良野チーズ工房", area: "富良野", kind: "起司・披薩", what: "起司、披薩、冰淇淋；適合帶小孩的午後", hours: "🔎 冬季", fit: "ok", lat: 43.318, lon: 142.372, approx: true, meal: "snack" },
  { id: "delice", name: "フラノデリス", area: "富良野", kind: "甜點", what: "富良野牛奶布丁 ¥350；看得到十勝岳連峰", hours: "10:00–16:30", fit: "ok", lat: 43.3237, lon: 142.3647, approx: true, meal: "snack" },
  { id: "burger", name: "FURANO BURGER", area: "富良野", kind: "漢堡", what: "富良野和牛漢堡 ¥1,300 起，賣完為止；冬季是否營業待確認", hours: "11:00–18:00", fit: "ok", lat: 43.372, lon: 142.42, approx: true, meal: "lunch" },
  { id: "rojo", name: "Rojo & Ronin Coffee", area: "富良野", kind: "咖啡", what: "上山前買咖啡，北之峰", hours: "08:00–11:00", fit: "ok", lat: 43.3404, lon: 142.3433, meal: "snack" },
  /* 美瑛・旭川 */
  { id: "junpei", key: "じゅんぺい", name: "じゅんぺい（美瑛）", area: "美瑛・旭川", kind: "炸蝦丼", what: "3 尾 ¥1,600；現金或 PayPay，不收信用卡；12:00–13:00 旅行團尖峰", hours: "11:00–15:00", closed: [1], fit: "ok", lat: 43.5886, lon: 142.4673, meal: "lunch" },
  { id: "ramen", key: "拉麵村", name: "あさひかわラーメン村", area: "美瑛・旭川", kind: "拉麵", what: "8 家旭川拉麵；停車約 2,000 台；離動物園 15–20 分", hours: "11:00–20:00", fit: "ok", lat: 43.7577, lon: 142.4178, meal: "lunch" },
  /* 札幌 */
  { id: "beer", key: "ビール園", name: "サッポロビール園", area: "札幌", kind: "成吉思汗", what: "吃到飽；兒童椅、兒童餐具、可推嬰兒車；包廂 10–120 人；停車約 150 台；訂位 0570-098-346；約 ¥3,500–4,000／人", hours: "11:30–21:00（LO 20:40）", closed: [], fit: "best", lat: 43.0709, lon: 141.3688 },
  { id: "kani", key: "かに本家", name: "札幌かに本家 札幌駅前本店", area: "札幌", kind: "螃蟹會席", what: "掘りごたつ包廂 2–16 人；午餐有兒童會席；晚餐約 ¥7,000；訂位 050-5486-9363", hours: "11:30–22:00（LO 21:30）", fit: "best", lat: 43.0653, lon: 141.3533 },
  { id: "soul", key: "SOUL STORE", name: "スープカレー SOUL STORE", area: "札幌", kind: "湯咖哩", what: "¥1,300–1,850；FAV LUX 步行約 7 分；兒童餐待確認", hours: "🔎", fit: "ok", lat: 43.0557, lon: 141.3477 },
  { id: "matale", key: "MATALE", name: "スープカレー MATALE 円山店", area: "札幌", kind: "湯咖哩", what: "有兒童餐；圓山公園站步行 5 分，可配圓山動物園", hours: "11:30–15:00、17:00–23:00", fit: "best", lat: 43.055, lon: 141.318, approx: true },
  { id: "nijo", name: "二条市場（食事処 ながもり）", area: "札幌", kind: "海鮮丼早餐", what: "18 席；無停車場；步行約 20 分", hours: "07:00–15:00", fit: "warn", lat: 43.059, lon: 141.36, approx: true, meal: "lunch" },
  { id: "daruma", name: "成吉思汗 だるま 本店", area: "札幌", kind: "成吉思汗", what: "只有吧台、要排隊，不適合帶幼兒；大人宵夜再去", hours: "🔎", fit: "warn", lat: 43.054, lon: 141.353, approx: true }
];
/* 每個住宿地，當天會看到哪些區域的店 */
window.FOOD_AREAS = { villa: ["小樽", "銭函", "Kiroro"], furano: ["富良野", "美瑛・旭川"], sapporo: ["札幌"] };

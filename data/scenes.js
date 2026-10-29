/* 每一天的海報與序幕腳本。
   原則：事實（時間、地名）不在這裡重打。scene 用 stop 指向 plan.json 裡那天的站點，時間和名稱自動帶入；
   這裡只寫「感覺」的句子。行程改了，站點不存在的那一幕會被自動略過，tools/check.py 會列出來。
   poster: 首頁海報牆用（img 相對 assets/img/，line 一句話）
   scenes: 序幕。沒有寫 scenes 的日子會自動用「標題卡＋海報」兩幕。
   scene 欄位：type（title／drive／end）、stop 站點 id（自動帶時間與地名）、label 覆寫地名、t 完全自訂標籤、
   h 主句、s 副句、img 單張或 imgs 多張輪播（assets/img/）、video（assets/video/，會循環播放，img 當封面）、
   amb（snow／drive／fire／quiet）、kb（in／out／pan）、warm 暖色、dur 毫秒 */
window.SCENES = {
  "2027-01-07": {
    poster: { img: "poster/0107.jpg", line: "兩家人、兩台車、四個小孩。從今天開始。" },
    scenes: [
      { type: "title", eyebrow: "DAY 01 · HOKKAIDO", h: "抵達北海道", s: "兩家人、兩台車、四個小孩。從今天開始。", imgs: ["scene/chitose-1.jpg", "scene/coast-1.jpg", "scene/villa-5.jpg"], amb: "snow", dur: 6000 },
      { stop: "cts", video: "airplane.mp4", img: "video/airplane.jpg", h: "落地的時候，窗外應該已經是白色的。", s: "天光只剩兩個小時。今天不趕，先把人和行李接好。", amb: "quiet", dur: 7000 },
      { stop: "cts", label: "下雪的新千歲", imgs: ["scene/chitose-1.jpg", "scene/chitose-2.jpg", "scene/chitose-3.jpg"], h: "入境、領行李、雪板袋。", s: "國際線 98 號站牌等接駁。", amb: "snow", dur: 7500 },
      { stop: "rental", dep: true, label: "兩台 DELICA 上路", video: "city-snow.mp4", img: "video/city-snow.jpg", h: "上高速，先進札幌市區。", s: "天已經黑了。雪路第一天，慢慢開，跟緊前車。", amb: "snow", dur: 7000 },
      { stop: "tnoc", label: "狸小路 4 丁目", imgs: ["spots/tanuki.jpg", "scene/sapporo-5.jpg"], h: "TNOC，北海道自己的戶外品牌。", s: "招牌是襪子。挑幾樣這趟用得到的保暖小物，別逛太久。", amb: "snow", dur: 6500 },
      { stop: "aeon", imgs: ["scene/aeon-1.jpg", "scene/aeon-2.jpg"], h: "天黑了。先吃晚餐，再把明早的東西買齊。", s: "只買必需品。小孩的耐心是今天最稀缺的資源。", amb: "snow", dur: 6500 },
      { type: "drive", video: "drive-night.mp4", img: "video/drive-night.jpg", t: "最後 {leg:aeon|villa} 分鐘", h: "往山裡開。", s: "後座大概已經睡著了。", amb: "drive", dur: 7000 },
      { stop: "villa", imgs: ["scene/villa-1.jpg", "scene/villa-2.jpg", "scene/villa-3.jpg", "scene/villa-4.jpg"], h: "到家了。", s: "落地窗外是白樺林和雪。兩家人的四個晚上，就是這裡。", amb: "fire", warm: true, dur: 9000 },
      { type: "end", t: "今晚", video: "fire.mp4", img: "video/fire.jpg", h: "壁爐點起來，小孩早點睡。<br>明天，Gacha 的課開始。", amb: "fire", warm: true, dur: 9000 }
    ]
  },
  "2027-01-08": {
    poster: { img: "poster/0108-onze.jpg", line: "Gacha 教練課第一天。下課走回山鄉，晚上全家去小樽。" },
    scenes: [
      { type: "title", eyebrow: "DAY 02 · ONZE", h: "Onze 教練課・第一天", s: "白天在雪上，晚上全家去小樽。", imgs: ["scene/onze-1.jpg", "scene/villa-6.jpg"], amb: "snow", dur: 5500 },
      { stop: "villa", label: "早上", imgs: ["scene/villa-6.jpg", "scene/villa-7.jpg", "scene/villa-2.jpg"], h: "{t} 走路出門。", s: "Onze 就在山鄉旁邊，雪板自己背。保姆今天第一天，小孩交給她。", amb: "quiet", dur: 6000 },
      { stop: "onze", imgs: ["scene/onze-1.jpg"], h: "第一天，先把節奏抓起來。", s: "Gacha 教練帶一整天，四個大人一組，課後有影片。", amb: "quiet", dur: 7000 },
      { t: "下午", video: "snowboard.mp4", img: "video/snowboard.jpg", h: "午休在山腳吃，下午繼續。", s: "滑到下課，收板走回家。", amb: "quiet", dur: 6500 },
      { stop: "villa#2", label: "接小孩", imgs: ["scene/villa-5.jpg", "scene/villa-3.jpg"], h: "換掉雪衣，接保姆和小孩。", s: "三個上課的晚上，只有今天全家一起出門。", amb: "quiet", warm: true, dur: 5500 },
      { stop: "orgel", imgs: ["spots/orgel.jpg"], h: "音樂盒堂。", s: "一整屋子的音樂盒。門口的蒸氣時鐘每十五分鐘噴一次氣，小孩會想等。", amb: "snow", warm: true, dur: 6500 },
      { stop: "canal", imgs: ["scene/otaru-6.jpg", "scene/otaru-5.jpg"], h: "運河的煤氣燈。", s: "走到浅草橋看一眼就好，雪地裡小孩走慢一點。", amb: "snow", dur: 6000 },
      { stop: "masazushi", imgs: ["scene/otaru-4.jpg", "scene/otaru-1.jpg"], h: "小樽，壽司。", s: "政寿司的個室，小孩有兒童餐。吃完 {leg:masazushi|villa} 分鐘就到家。", amb: "snow", warm: true, dur: 7000 },
      { type: "end", t: "今晚", video: "fire.mp4", img: "video/fire.jpg", h: "小孩洗澡睡覺。<br>明天連假，Onze 會比較擠。", amb: "fire", warm: true, dur: 8000 }
    ]
  },
  "2027-01-09": {
    poster: { img: "poster/0109-canal.jpg", line: "連假第一天上課。下課後四個大人去堺町通，等運河的煤氣燈亮起來。" },
    scenes: [
      { type: "title", eyebrow: "DAY 03 · ONZE · OTARU", h: "Onze 第二天・傍晚的堺町通", s: "連假第一天。下課後，四個大人去小樽走一圈。", imgs: ["scene/onze-1.jpg", "scene/otaru-5.jpg"], amb: "snow", dur: 5500 },
      { stop: "onze", imgs: ["scene/onze-1.jpg"], h: "連假第一天，一開吊椅就上山。", s: "Onze 只有一條四人吊椅，早一班差很多。昨天教的，今天練熟。", amb: "snow", dur: 7000 },
      { t: "整天", video: "snowboard.mp4", img: "video/snowboard.jpg", h: "Gacha 第二天。", s: "午休錯開正中午，山腳的食堂才有位子。", amb: "quiet", dur: 6000 },
      { stop: "canal", imgs: ["scene/otaru-5.jpg"], h: "天剛黑，煤氣燈剛亮。", s: "小孩在山鄉跟保姆。先在浅草橋拍一張藍色的運河。", amb: "snow", dur: 6500 },
      { stop: "kitaichi", imgs: ["spots/kitaichi.jpg"], h: "北一ホール。", s: "一百六十七盞煤油燈。堺町通最早關門的一家，先來這裡。", amb: "quiet", warm: true, dur: 6500 },
      { stop: "letao", imgs: ["spots/letao.jpg", "spots/sakaimachi.jpg"], h: "堺町通。", s: "LeTAO 的起司蛋糕、北菓楼的泡芙，買回去給保姆和小孩。", amb: "snow", dur: 6500 },
      { stop: "canal#2", label: "運河的煤氣燈", imgs: ["scene/otaru-6.jpg", "spots/canal.jpg"], h: "走回來，天全黑了。", s: "かま栄的炸魚板邊走邊吃。然後去吃炸雞。", amb: "snow", dur: 7000 },
      { type: "end", t: "今晚", video: "fire.mp4", img: "video/fire.jpg", h: "外帶的炸雞給保姆。<br>明天最後一天課。", amb: "fire", warm: true, dur: 8000 }
    ]
  },
  "2027-01-10": {
    poster: { img: "poster/0110-villa.jpg", line: "最後一天課。下課泡湯，回山鄉收行李。" },
    scenes: [
      { type: "title", eyebrow: "DAY 04 · ONZE", h: "Onze 教練課・最後一天", s: "三天的課上完，泡湯、收行李。", imgs: ["scene/onze-1.jpg", "scene/asari-1.jpg"], amb: "snow", dur: 5500 },
      { stop: "onze", imgs: ["scene/onze-1.jpg"], h: "最後一天。", s: "把三天學的串起來。記得跟 Gacha 要影片。", amb: "quiet", dur: 6500 },
      { t: "下午", video: "snowboard.mp4", img: "video/snowboard.jpg", h: "最後幾趟。", s: "下課收板，雪板今晚就裝上車。", amb: "quiet", dur: 6000 },
      { stop: "asari", imgs: ["scene/asari-1.jpg", "scene/coast-3.jpg"], h: "朝里殿。", s: "三天的腿痠在露天風呂裡放掉，館內吃完晚餐再回家。", amb: "quiet", warm: true, dur: 7000 },
      { type: "end", t: "今晚", img: "scene/villa-5.jpg", h: "山鄉的最後一晚。<br>明天搬家，往東。", amb: "fire", warm: true, dur: 7000 }
    ]
  },
  "2027-01-11": {
    poster: { img: "poster/0111.jpg", line: "退房往東。旭山動物園的企鵝散步，傍晚到富良野的小木屋。" },
    scenes: [
      { type: "title", eyebrow: "DAY 05 · ASAHIKAWA → FURANO", h: "旭山動物園・富良野", s: "假日拿來移動和看動物。全天開車最久的一天。", imgs: ["scene/zoo-1.jpg", "scene/road-1.jpg", "scene/lodge-1.jpg"], amb: "snow", dur: 5500 },
      { stop: "villa", label: "往旭川的路上", imgs: ["scene/road-1.jpg", "scene/road-2.jpg", "scene/coast-3.jpg"], h: "{t} 退房出發，一路往東。", s: "雪原、防風林、很直的路。兩台車跟好。", amb: "drive", dur: 7000 },
      { stop: "zoo", imgs: ["scene/zoo-1.jpg", "scene/zoo-2.jpg", "scene/zoo-3.jpg"], h: "企鵝散步。", s: "往年上午、下午各一場，今年的時間還沒公告。四個小孩大概會看到不想走。", amb: "quiet", dur: 8000 },
      { stop: "lodge", imgs: ["scene/lodge-1.jpg", "scene/lodge-2.jpg", "scene/lodge-3.jpg", "scene/lodge-4.jpg"], h: "傍晚到富良野，小木屋。", s: "接下來五個晚上的家。", amb: "fire", warm: true, dur: 9000 },
      { type: "end", t: "今晚", video: "fire.mp4", img: "video/fire.jpg", h: "明天開始，富良野。", amb: "fire", warm: true, dur: 7000 }
    ]
  },
  "2027-01-12": {
    poster: { img: "poster/0112.jpg", line: "富良野開滑。平日沒人，壓雪寬坡，練 carving 的日子。" },
    scenes: [
      { type: "title", eyebrow: "DAY 06 · FURANO", h: "富良野滑雪", s: "平日沒人的壓雪寬坡。", imgs: ["scene/furano-1.jpg", "scene/furano-2.jpg", "scene/ningle-1.jpg"], amb: "snow", dur: 5500 },
      { stop: "kita", imgs: ["scene/furano-1.jpg", "scene/furano-2.jpg", "scene/furano-3.jpg"], h: "富良野開滑。", s: "小木屋開車五分鐘到北之峰纜車站。平日，雪道是空的。", amb: "quiet", dur: 7500 },
      { t: "上午 · 教練課", video: "snowboard.mp4", img: "video/snowboard.jpg", h: "carving 的第一天。", s: "壓雪寬坡就是為了這個。", amb: "quiet", dur: 7000 },
      { stop: "ningle", imgs: ["scene/ningle-1.jpg", "scene/ningle-2.jpg", "scene/ningle-3.jpg"], h: "收板後，森林精靈露台。", s: "小木屋亮著燈，雪在落。小孩會喜歡。", amb: "snow", warm: true, dur: 8000 },
      { type: "end", t: "今晚", imgs: ["scene/lodge-5.jpg", "scene/lodge-6.jpg"], h: "明天再來一次。", amb: "fire", warm: true, dur: 6500 }
    ]
  },
  "2027-01-13": {
    poster: { img: "poster/0113.jpg", line: "十勝岳連峰就在對面。整天都在雪上。" },
    scenes: [
      { type: "title", eyebrow: "DAY 07 · FURANO", h: "富良野滑雪", s: "整天都在雪上。", imgs: ["scene/furano-4.jpg", "scene/furano-3.jpg", "scene/furano-2.jpg"], amb: "snow", dur: 5500 },
      { stop: "fzone", imgs: ["scene/furano-2.jpg", "scene/furano-3.jpg", "scene/furano-1.jpg"], h: "今天換富良野區。", s: "另一邊的纜車、另一邊的雪道。", amb: "quiet", dur: 7500 },
      { t: "整天", video: "snowboard.mp4", img: "video/snowboard.jpg", h: "滑到腿沒力。", amb: "quiet", dur: 6000 },
      { type: "end", t: "今晚", imgs: ["scene/lodge-4.jpg", "scene/lodge-1.jpg"], h: "最後一個有保姆的滑雪日，<br>就是明天。", amb: "fire", warm: true, dur: 7000 }
    ]
  },
  "2027-01-14": {
    poster: { img: "poster/0114.jpg", line: "最後一個有保姆的上午。下午送她到車站，然後兩家自己來。" },
    scenes: [
      { type: "title", eyebrow: "DAY 08 · FURANO", h: "上午滑雪・送保姆", s: "上午滑雪，{dep:kita} 收板。", imgs: ["scene/furano-1.jpg", "scene/lodge-1.jpg", "scene/furano-4.jpg"], amb: "snow", dur: 5500 },
      { stop: "kita", imgs: ["scene/furano-1.jpg", "scene/furano-3.jpg"], h: "上午滑雪，{dep:kita} 收板。", s: "最後一個四個大人都在雪上的上午。", amb: "quiet", dur: 7000 },
      { t: "上午", video: "snowboard.mp4", img: "video/snowboard.jpg", h: "把握最後一個完整的上午。", amb: "quiet", dur: 6000 },
      { stop: "fstn", imgs: ["scene/furano-2.jpg", "scene/road-2.jpg"], h: "送保姆到車站。", s: "謝謝她這七天。巴士 {T:nanny.bus}。", amb: "snow", dur: 6500 },
      { stop: "marche", imgs: ["scene/furano-4.jpg", "scene/furano-2.jpg"], h: "Furano Marché，逛逛就好。", s: "沒有保姆的第一個下午。小孩想走就走，想停就停。", amb: "quiet", dur: 6000 },
      { type: "end", t: "今晚", imgs: ["scene/lodge-3.jpg", "scene/lodge-5.jpg", "scene/lodge-2.jpg"], h: "從今天起，四個小孩，<br>兩家自己來。", amb: "fire", warm: true, dur: 7500 }
    ]
  },
  "2027-01-15": {
    poster: { img: "poster/0115.jpg", line: "不滑雪的一天。美瑛的炸蝦丼、雪上樂園的羊駝、瀑布，和點了燈的青池。" },
    scenes: [
      { type: "title", eyebrow: "DAY 09 · BIEI", h: "美瑛親子日", s: "不滑雪的一天。", imgs: ["scene/biei-1.jpg", "scene/aoiike-1.jpg", "scene/shirahige-1.jpg"], amb: "snow", dur: 5500 },
      { stop: "junpei", label: "美瑛", imgs: ["scene/biei-1.jpg", "scene/biei-2.jpg", "scene/biei-3.jpg"], h: "不滑雪的一天。", s: "美瑛的丘，一棵樹。先去吃炸蝦丼，早到避開旅行團。", amb: "quiet", dur: 8000 },
      { stop: "shikisai", imgs: ["scene/biei-2.jpg", "scene/road-1.jpg", "scene/biei-3.jpg"], h: "雪上樂園。", s: "滑胎、雪上泛舟、餵羊駝，讓小孩把電放完。", amb: "quiet", dur: 7000 },
      { stop: "shirahige", img: "scene/shirahige-1.jpg", h: "白鬚瀑布，結冰的。", s: "橋上很冷，看一下就好。", amb: "snow", kb: "in", dur: 6000 },
      { stop: "aoiike", img: "scene/aoiike-1.jpg", h: "青池，{open:aoiike} 點燈。", s: "早到就等，燈亮了再走。", amb: "quiet", kb: "in", dur: 7000 },
      { type: "end", t: "{dep:aoiike} 前", img: "scene/biei-4.jpg", h: "出發回小木屋。<br>天黑的山路，慢慢開。最後一晚。", amb: "drive", kb: "out", dur: 7000 }
    ]
  },
  "2027-01-16": {
    poster: { img: "poster/0116.jpg", line: "離開山，回到城市。停好車就用走的；晚上在啤酒園吃成吉思汗。" },
    scenes: [
      { type: "title", eyebrow: "DAY 10 · FURANO → SAPPORO", h: "富良野・札幌", s: "離開山，回到城市。", imgs: ["scene/lodge-1.jpg", "scene/sapporo-1.jpg", "scene/sapporo-4.jpg"], amb: "snow", dur: 5500 },
      { stop: "lodge", imgs: ["scene/lodge-1.jpg", "scene/lodge-3.jpg", "scene/furano-4.jpg"], h: "退房。再見，富良野。", s: "五個晚上。雪板綁好，中途在砂川吃個泡芙。", amb: "quiet", dur: 7500 },
      { stop: "favlux", label: "回到城市", imgs: ["scene/sapporo-1.jpg", "scene/sapporo-2.jpg", "scene/sapporo-3.jpg"], h: "回到城市。", s: "車停好就三晚不動。拉麵、狸小路，{at:favlux#2} 入住。", amb: "quiet", dur: 7500 },
      { stop: "tvtower", imgs: ["scene/sapporo-5.jpg", "scene/sapporo-6.jpg", "scene/sapporo-4.jpg"], h: "電視塔，看城市變藍。", s: "{sun:set} 日落。大通公園的雪地走一段。", amb: "snow", dur: 7000 },
      { type: "end", stop: "beer", imgs: ["scene/beer-1.jpg", "scene/susukino-1.jpg", "scene/sapporo-4.jpg"], h: "晚上，啤酒園的成吉思汗。<br>早點休息。", amb: "snow", warm: true, dur: 8000 }
    ]
  },
  "2027-01-17": {
    poster: { img: "poster/0117.jpg", line: "週日，小孩的札幌：羊之丘滑胎、回轉壽司、白色戀人的巧克力工廠。" },
    scenes: [
      { type: "title", eyebrow: "DAY 11 · SAPPORO", h: "羊之丘・白色戀人", s: "週日，玩雪和巧克力，不滑雪。", imgs: ["scene/sapporo-2.jpg", "scene/sapporo-4.jpg", "scene/susukino-1.jpg"], amb: "snow", dur: 5500 },
      { stop: "hitsujigaoka", label: "羊之丘", imgs: ["scene/road-1.jpg", "scene/sapporo-3.jpg", "scene/sapporo-2.jpg"], h: "羊之丘的雪上樂園。", s: "滑胎、雪屋、2–5 歲的滑步車道，玩到中午。克拉克像前拍一張。", amb: "quiet", dur: 7500 },
      { stop: "shiroi", video: "city-snow.mp4", img: "video/city-snow.jpg", h: "下午，白色戀人公園。", s: "英式紅磚樓、巧克力工廠、伴手禮一次買齊。", amb: "snow", dur: 7000 },
      { type: "end", stop: "kujira", imgs: ["scene/sapporo-5.jpg", "scene/susukino-1.jpg", "scene/susukino-2.jpg"], h: "晚上，義大利菜。<br>回飯店泡大浴場，早點睡。", amb: "snow", warm: true, dur: 8000 }
    ]
  },
  "2027-01-18": {
    poster: { img: "poster/0118.jpg", line: "最後一個整天。車不開，走路逛札幌：紅磚廳舍、豚丼、六花亭、狸小路；晚上吃螃蟹。" },
    scenes: [
      { type: "title", eyebrow: "DAY 12 · SAPPORO", h: "札幌散步", s: "最後一個整天。車不開，用走的。", imgs: ["scene/sapporo-3.jpg", "scene/susukino-2.jpg", "scene/sapporo-1.jpg"], amb: "snow", dur: 5500 },
      { stop: "akarenga", imgs: ["scene/sapporo-3.jpg", "scene/sapporo-2.jpg", "scene/susukino-2.jpg"], h: "走路逛札幌。", s: "紅磚廳舍、時計台、JR 塔上看一圈。中午吃豚丼，下午六花亭。", amb: "quiet", dur: 7500 },
      { stop: "tanuki", imgs: ["scene/susukino-1.jpg", "scene/susukino-3.jpg", "scene/sapporo-6.jpg"], h: "狸小路，最後採購。", s: "走路的一天：紅磚廳舍、時計台、豚丼、六花亭，最後把該買的買齊。", amb: "snow", dur: 7000 },
      { type: "end", stop: "hyosetsu", imgs: ["scene/susukino-3.jpg", "scene/susukino-1.jpg", "scene/sapporo-5.jpg"], h: "晚上吃螃蟹。<br>雪具今晚要弄乾、打包，早點睡。", amb: "snow", warm: true, dur: 8000 }
    ]
  },
  "2027-01-19": {
    poster: { img: "poster/0119.jpg", line: "加油、還車、退稅。十三天，回家。" },
    scenes: [
      { type: "title", eyebrow: "DAY 13 · HOME", h: "回台灣", s: "加油、還車、退稅。", imgs: ["scene/chitose-1.jpg", "scene/sapporo-6.jpg", "scene/villa-5.jpg"], amb: "snow", dur: 5500 },
      { stop: "favlux", label: "最後一個早上", imgs: ["scene/sapporo-6.jpg", "scene/favlux-1.jpg"], h: "{t} 退房。", s: "行李前一晚打包好，雪板裝袋。", amb: "quiet", dur: 6000 },
      { stop: "cts", imgs: ["scene/chitose-1.jpg", "scene/chitose-2.jpg", "scene/chitose-3.jpg"], h: "十三天。", s: "退稅商品不要拆。登機前把雪具的事情交給航空公司。", amb: "quiet", dur: 7500 },
      { type: "end", t: "{T:flight.back.dep} · {T:flight.back.no}", video: "airplane.mp4", img: "video/airplane.jpg", h: "回家。", amb: "quiet", dur: 8000 }
    ]
  }
};

/* 站點 id → 照片資料夾（hokkaido-photos-web/places/…）。check.py 用它算出「行程會去、但還沒有照片」的地方。 */
window.PLACE_OF_STOP = {
  cts: "new-chitose", rental: null, kiroro_onsen: "kiroro", temiya: null, masazushi: null, waraku: null, aeon: "aeon-hassamu", villa: "hotels/shun-villa", kiroro: "kiroro", onze: "onze", asari: "asari",
  canal: "otaru-canal", naruto: null, zoo: "asahiyama-zoo", lodge: "hotels/furano-lodge", kumagera: null, kita: "furano-ski", fzone: "furano-ski",
  ningle: "ningle-terrace", fstn: "furano-station", marche: "furano-marche", yuiga: null, junpei: null, chiyoda: "chiyoda-farm", shirahige: "shirahige-falls", aoiike: "blue-pond",
  favlux: "hotels/fav-lux", beer: "sapporo-beer-garden", takino: "takino", aoao: "aoao", soul: null, teine: "teine", kani: null,
  shikisai: null, senka: null, kitakaro: null, ichigen: null, tanuki: "susukino", odori: null, tvtower: "sapporo", hitsujigaoka: null, toriton: null, shiroi: null, kujira: null, rokkatei_otaru: null, kamaei: null, kitaichi: null, letao: null, orgel: null, sunagawa_sa: null, coop_furano: null, fenix: null, furanoya: null,
  akarenga: null, clocktower: null, t38: null, ippin: null, rokkatei: null, hyosetsu: null, tnoc: "susukino"
};

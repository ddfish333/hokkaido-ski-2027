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
      { stop: "rental", label: "兩台 DELICA 上路", imgs: ["scene/coast-1.jpg", "scene/coast-2.jpg", "scene/coast-3.jpg"], h: "沿著石狩灣往西，海在右手邊。", s: "銭函、春香，這一帶就是接下來四個晚上要住的地方。雪路第一天，慢慢開。", amb: "snow", dur: 8000 },
      { stop: "aeon", imgs: ["scene/aeon-1.jpg", "scene/aeon-2.jpg"], h: "天黑了。先吃晚餐，再把明早的東西買齊。", s: "只買必需品。小孩的耐心是今天最稀缺的資源。", amb: "snow", dur: 6500 },
      { type: "drive", video: "drive-night.mp4", img: "video/drive-night.jpg", t: "最後 40 分鐘", h: "往山裡開。", s: "後座大概已經睡著了。", amb: "drive", dur: 7000 },
      { stop: "villa", imgs: ["scene/villa-1.jpg", "scene/villa-2.jpg", "scene/villa-3.jpg", "scene/villa-4.jpg"], h: "到家了。", s: "落地窗外是白樺林和雪。兩家人的四個晚上，就是這裡。", amb: "fire", warm: true, dur: 9000 },
      { type: "end", t: "今晚", video: "fire.mp4", img: "video/fire.jpg", h: "壁爐點起來，小孩早點睡。<br>明天，Kiroro。", amb: "fire", warm: true, dur: 9000 }
    ]
  },
  "2027-01-08": {
    poster: { img: "poster/0108.jpg", line: "第一次上 Kiroro。上午跟教練，下午自己滑，晚上 Onze 夜滑。" },
    scenes: [
      { type: "title", eyebrow: "DAY 02 · KIRORO", h: "Kiroro 初滑", s: "第一次上山。先把節奏抓起來。", imgs: ["scene/kiroro-1.jpg", "scene/kiroro-2.jpg"], amb: "snow", dur: 5500 },
      { stop: "villa", label: "早上", imgs: ["scene/villa-6.jpg", "scene/villa-7.jpg", "scene/villa-2.jpg"], h: "07:50 出發。", s: "早餐在家吃，雪板前一晚就上車。", amb: "quiet", dur: 6000 },
      { stop: "kiroro", imgs: ["scene/kiroro-1.jpg", "scene/kiroro-2.jpg"], h: "第一次上 Kiroro。", s: "上午跟教練認識雪場。粉雪在這裡，不用找。", amb: "quiet", dur: 7000 },
      { t: "下午", video: "snowboard.mp4", img: "video/snowboard.jpg", h: "自己的雪道。", s: "教練走了之後，才是真正開始滑的時候。", amb: "quiet", dur: 7000 },
      { stop: "onze", imgs: ["scene/onze-1.jpg", "scene/villa-5.jpg"], h: "晚上，大人輪流去 Onze 夜滑。", s: "走路五分鐘，燈開到 22:45。另一個人留在家裡陪小孩睡。", amb: "snow", dur: 6500 },
      { type: "end", t: "今晚", video: "fire.mp4", img: "video/fire.jpg", h: "明天還是 Kiroro。<br>連假第一天，早一點出門。", amb: "fire", warm: true, dur: 8000 }
    ]
  },
  "2027-01-09": {
    poster: { img: "poster/0109.jpg", line: "連假第一天開門就上山，收板後去朝里殿泡湯。" },
    scenes: [
      { type: "title", eyebrow: "DAY 03 · KIRORO", h: "Kiroro・朝里川溫泉", s: "開門就上山，收板就泡湯。", imgs: ["scene/kiroro-2.jpg", "scene/kiroro-1.jpg", "scene/asari-1.jpg"], amb: "snow", dur: 5500 },
      { stop: "kiroro", imgs: ["scene/kiroro-2.jpg", "scene/kiroro-1.jpg"], h: "連假第一天，開門就上山。", s: "人會多，但纜車早一班、晚一班，差很多。", amb: "snow", dur: 7000 },
      { t: "整天", video: "snowboard.mp4", img: "video/snowboard.jpg", h: "昨天教練教的，今天拿來用。", amb: "quiet", dur: 6000 },
      { stop: "asari", imgs: ["scene/asari-1.jpg", "scene/coast-3.jpg"], h: "收板後，朝里殿。", s: "泡湯、館內吃完晚餐再回家。小孩泡完會很好睡。", amb: "quiet", warm: true, dur: 7000 },
      { type: "end", t: "今晚", video: "fire.mp4", img: "video/fire.jpg", h: "明天滑半天就好。<br>下午去小樽。", amb: "fire", warm: true, dur: 8000 }
    ]
  },
  "2027-01-10": {
    poster: { img: "poster/0110.jpg", line: "滑半天就下山。堺町通、LeTAO，等運河的煤氣燈亮起來。" },
    scenes: [
      { type: "title", eyebrow: "DAY 04 · OTARU", h: "半天 Kiroro・小樽", s: "滑半天，下午把小樽走一遍。", imgs: ["scene/otaru-1.jpg", "scene/otaru-5.jpg", "scene/otaru-6.jpg"], amb: "snow", dur: 5500 },
      { stop: "kiroro", imgs: ["scene/kiroro-1.jpg", "scene/kiroro-2.jpg"], h: "滑半天就好。", s: "這是在山鄉的最後一次 Kiroro。", amb: "quiet", dur: 6000 },
      { stop: "canal", imgs: ["scene/otaru-1.jpg", "scene/otaru-2.jpg", "scene/otaru-3.jpg", "scene/otaru-4.jpg"], h: "下午，堺町通和運河。", s: "LeTAO 18:00 關門，先去。小孩走不動就推車。", amb: "snow", dur: 9000 },
      { stop: "naruto", label: "運河的煤氣燈", imgs: ["scene/otaru-5.jpg", "scene/otaru-6.jpg", "scene/otaru-7.jpg"], h: "16:30，煤氣燈亮起來。", s: "然後去吃若鶏時代なると。", amb: "snow", dur: 8000 },
      { type: "end", t: "今晚", img: "scene/villa-5.jpg", h: "山鄉的最後一晚。<br>明天搬家，往東。", amb: "fire", warm: true, dur: 7000 }
    ]
  },
  "2027-01-11": {
    poster: { img: "poster/0111.jpg", line: "退房往東。旭山動物園的企鵝散步，傍晚到富良野的小木屋。" },
    scenes: [
      { type: "title", eyebrow: "DAY 05 · ASAHIKAWA → FURANO", h: "旭山動物園・富良野", s: "假日拿來移動和看動物。全天開車最久的一天。", imgs: ["scene/zoo-1.jpg", "scene/road-1.jpg", "scene/lodge-1.jpg"], amb: "snow", dur: 5500 },
      { stop: "zoo", label: "往旭川的路上", imgs: ["scene/road-1.jpg", "scene/road-2.jpg", "scene/coast-3.jpg"], h: "一路往東。", s: "雪原、防風林、很直的路。兩台車跟好。", amb: "drive", dur: 7000 },
      { stop: "zoo", imgs: ["scene/zoo-1.jpg", "scene/zoo-2.jpg", "scene/zoo-3.jpg"], h: "企鵝散步。", s: "11:00 那場趕得上就看，14:30 那場是保底。四個小孩大概會看到不想走。", amb: "quiet", dur: 8000 },
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
      { stop: "fzone", label: "十勝岳連峰", imgs: ["scene/furano-4.jpg", "scene/biei-2.jpg", "scene/biei-3.jpg"], h: "十勝岳連峰就在對面。", s: "滑累了就停下來看。", amb: "quiet", dur: 7500 },
      { type: "end", t: "今晚", imgs: ["scene/lodge-4.jpg", "scene/lodge-1.jpg"], h: "最後一個有保姆的滑雪日，<br>就是明天。", amb: "fire", warm: true, dur: 7000 }
    ]
  },
  "2027-01-14": {
    poster: { img: "poster/0114.jpg", line: "最後一個有保姆的上午。下午送她到車站，然後兩家自己來。" },
    scenes: [
      { type: "title", eyebrow: "DAY 08 · FURANO", h: "上午滑雪・送保姆", s: "上午滑雪，13:30 收板。", imgs: ["scene/furano-1.jpg", "scene/lodge-1.jpg", "scene/furano-4.jpg"], amb: "snow", dur: 5500 },
      { stop: "kita", imgs: ["scene/furano-1.jpg", "scene/furano-3.jpg"], h: "上午滑雪，13:30 收板。", s: "最後一個四個大人都在雪上的上午。", amb: "quiet", dur: 7000 },
      { t: "上午", video: "snowboard.mp4", img: "video/snowboard.jpg", h: "把握最後一個完整的上午。", amb: "quiet", dur: 6000 },
      { stop: "fstn", imgs: ["scene/furano-2.jpg", "scene/road-2.jpg"], h: "送保姆到車站。", s: "謝謝她這七天。巴士 14:00。", amb: "snow", dur: 6500 },
      { type: "end", t: "今晚", imgs: ["scene/lodge-3.jpg", "scene/lodge-5.jpg", "scene/lodge-2.jpg"], h: "從今天起，四個小孩，<br>兩家自己來。", amb: "fire", warm: true, dur: 7500 }
    ]
  },
  "2027-01-15": {
    poster: { img: "poster/0115.jpg", line: "不滑雪的一天。美瑛的牧場、炸蝦丼、瀑布，和點了燈的青池。" },
    scenes: [
      { type: "title", eyebrow: "DAY 09 · BIEI", h: "美瑛親子日", s: "不滑雪的一天。", imgs: ["scene/biei-1.jpg", "scene/aoiike-1.jpg", "scene/shirahige-1.jpg"], amb: "snow", dur: 5500 },
      { stop: "junpei", label: "美瑛", imgs: ["scene/biei-1.jpg", "scene/biei-2.jpg", "scene/biei-3.jpg"], h: "不滑雪的一天。", s: "美瑛的丘，一棵樹。先去吃炸蝦丼，早到避開旅行團。", amb: "quiet", dur: 8000 },
      { stop: "chiyoda", imgs: ["scene/road-1.jpg", "scene/biei-2.jpg"], h: "牧場。", s: "餵動物、玩雪，讓小孩把電放完。", amb: "quiet", dur: 6000 },
      { stop: "shirahige", img: "scene/shirahige-1.jpg", h: "白鬚瀑布，結冰的。", s: "橋上很冷，看一下就好。", amb: "snow", kb: "in", dur: 6000 },
      { stop: "aoiike", img: "scene/aoiike-1.jpg", h: "青池，17:00 點燈。", s: "早到就等，燈亮了再走。", amb: "quiet", kb: "in", dur: 7000 },
      { type: "end", t: "17:30 前", img: "scene/biei-4.jpg", h: "出發回小木屋。<br>天黑的山路，慢慢開。", amb: "drive", kb: "out", dur: 7000 }
    ]
  },
  "2027-01-16": {
    poster: { img: "poster/0116.jpg", line: "離開山，回到城市。晚上在啤酒園吃成吉思汗。" },
    scenes: [
      { type: "title", eyebrow: "DAY 10 · FURANO → SAPPORO", h: "富良野・札幌", s: "離開山，回到城市。", imgs: ["scene/lodge-1.jpg", "scene/sapporo-1.jpg", "scene/sapporo-4.jpg"], amb: "snow", dur: 5500 },
      { stop: "lodge", imgs: ["scene/lodge-1.jpg", "scene/lodge-3.jpg", "scene/furano-4.jpg"], h: "退房。再見，富良野。", s: "五個晚上。雪板綁好，直接開札幌。", amb: "quiet", dur: 7500 },
      { stop: "favlux", imgs: ["scene/sapporo-1.jpg", "scene/sapporo-2.jpg", "scene/sapporo-3.jpg"], h: "回到城市。", s: "先找平面停車場，市區吃午餐，15:00 入住。", amb: "quiet", dur: 7500 },
      { stop: "favlux", label: "FAV LUX", imgs: ["scene/favlux-1.jpg", "scene/favlux-2.jpg", "scene/favlux-3.jpg", "scene/favlux-4.jpg"], h: "最後三晚的房間。", s: "有廚房、有洗衣機，雪具可以慢慢晾。", amb: "quiet", dur: 8000 },
      { type: "end", stop: "beer", imgs: ["scene/beer-1.jpg", "scene/sapporo-4.jpg", "scene/sapporo-5.jpg"], h: "晚上，啤酒園的成吉思汗。", amb: "snow", warm: true, dur: 8000 }
    ]
  },
  "2027-01-17": {
    poster: { img: "poster/0117.jpg", line: "週日，小孩的札幌：雪世界、水族館、湯咖哩。" },
    scenes: [
      { type: "title", eyebrow: "DAY 11 · SAPPORO", h: "札幌親子日", s: "週日，觀光，不滑雪。", imgs: ["scene/sapporo-2.jpg", "scene/sapporo-4.jpg", "scene/susukino-1.jpg"], amb: "snow", dur: 5500 },
      { stop: "takino", label: "札幌", imgs: ["scene/sapporo-2.jpg", "scene/sapporo-3.jpg", "scene/road-1.jpg"], h: "週日，小孩的札幌。", s: "瀧野雪世界滑圈、玩雪，玩到中午。", amb: "quiet", dur: 7500 },
      { stop: "aoao", video: "city-snow.mp4", img: "video/city-snow.jpg", h: "下午，水族館走路就到。", s: "雪在城市裡落下來的樣子，跟山裡不一樣。", amb: "snow", dur: 7000 },
      { type: "end", stop: "soul", imgs: ["scene/sapporo-5.jpg", "scene/susukino-1.jpg", "scene/susukino-2.jpg"], h: "晚上，湯咖哩。", amb: "snow", warm: true, dur: 8000 }
    ]
  },
  "2027-01-18": {
    poster: { img: "poster/0118.jpg", line: "最後一次滑雪。一家上山、一家顧小孩，中午交換。晚上吃螃蟹。" },
    scenes: [
      { type: "title", eyebrow: "DAY 12 · TEINE", h: "手稻 Teine", s: "最後一次滑雪。", imgs: ["scene/teine-1.jpg", "scene/teine-2.jpg", "scene/susukino-1.jpg"], amb: "snow", dur: 5500 },
      { stop: "teine", imgs: ["scene/teine-1.jpg", "scene/teine-2.jpg", "scene/teine-3.jpg"], h: "最後一次滑雪。", s: "手稻就在城市旁邊，山上看得到海。", amb: "quiet", dur: 7500 },
      { t: "輪流", video: "snowboard.mp4", img: "video/snowboard.jpg", h: "一家上山、一家顧小孩，中午交換。", s: "把這趟學到的 carving 全部用掉。", amb: "quiet", dur: 7000 },
      { type: "end", stop: "kani", imgs: ["scene/susukino-1.jpg", "scene/susukino-2.jpg", "scene/susukino-3.jpg"], h: "晚上吃螃蟹。<br>雪具今晚要弄乾、打包。", amb: "snow", warm: true, dur: 8000 }
    ]
  },
  "2027-01-19": {
    poster: { img: "poster/0119.jpg", line: "加油、還車、退稅。十三天，回家。" },
    scenes: [
      { type: "title", eyebrow: "DAY 13 · HOME", h: "回台灣", s: "加油、還車、退稅。", imgs: ["scene/chitose-1.jpg", "scene/sapporo-6.jpg", "scene/villa-5.jpg"], amb: "snow", dur: 5500 },
      { stop: "favlux", label: "最後一個早上", imgs: ["scene/sapporo-6.jpg", "scene/favlux-1.jpg"], h: "08:00 退房。", s: "行李前一晚打包好，雪板裝袋。", amb: "quiet", dur: 6000 },
      { stop: "cts", imgs: ["scene/chitose-1.jpg", "scene/chitose-2.jpg", "scene/chitose-3.jpg"], h: "十三天。", s: "退稅商品不要拆。登機前把雪具的事情交給航空公司。", amb: "quiet", dur: 7500 },
      { type: "end", t: "12:10 · BR165", video: "airplane.mp4", img: "video/airplane.jpg", h: "回家。", amb: "quiet", dur: 8000 }
    ]
  }
};

/* 站點 id → 照片資料夾（hokkaido-photos-web/places/…）。check.py 用它算出「行程會去、但還沒有照片」的地方。 */
window.PLACE_OF_STOP = {
  cts: "new-chitose", rental: null, aeon: "aeon-hassamu", villa: "hotels/shun-villa", kiroro: "kiroro", onze: "onze", asari: "asari",
  canal: "otaru-canal", naruto: null, zoo: "asahiyama-zoo", lodge: "hotels/furano-lodge", kumagera: null, kita: "furano-ski", fzone: "furano-ski",
  ningle: "ningle-terrace", fstn: "furano-station", yuiga: null, junpei: null, chiyoda: "chiyoda-farm", shirahige: "shirahige-falls", aoiike: "blue-pond",
  favlux: "hotels/fav-lux", beer: "sapporo-beer-garden", takino: "takino", aoao: "aoao", soul: null, teine: "teine", kani: null
};

/* 每一天的海報與序幕腳本。
   poster: 首頁海報牆用（img 相對 assets/img/，line 一句話）
   scenes: 序幕。沒有寫 scenes 的日子會自動用「標題卡＋海報」兩幕。
   scene 欄位：t 時間標籤、h 主句、s 副句、img、amb（snow／drive／fire／quiet）、kb（in／out／pan）、dur 毫秒 */
window.SCENES = {
  "2027-01-07": {
    poster: { img: "poster/0107.jpg", line: "兩家人、兩台車、四個小孩。從今天開始。" },
    scenes: [
      { type: "title", eyebrow: "DAY 01 · HOKKAIDO", h: "抵達北海道", s: "兩家人、兩台車、四個小孩。從今天開始。", amb: "snow", dur: 7000 },
      { t: "14:05 · 新千歲機場", h: "落地的時候，窗外應該已經是白色的。", s: "日落 16:15。天光只剩兩個小時，所以今天不趕，先把人和行李接好。", img: "scene/0107-2.jpg", amb: "snow", kb: "out", dur: 10000 },
      { t: "15:30 · 兩台 DELICA 上路", h: "沿著石狩灣往西，海在右手邊。", s: "銭函、春香，這一帶就是接下來四個晚上要住的地方。雪路第一天，慢慢開。", img: "scene/0107-3.jpg", amb: "snow", kb: "pan", dur: 10000 },
      { type: "drive", t: "17:00 · AEON 発寒", h: "天黑了。車上裝滿這幾天的早餐和小孩的零食。", s: "最後 40 分鐘雪路，往山裡開。", amb: "drive", dur: 11000 },
      { t: "18:30 · 山郷 春 VILLA -SHUN-", h: "到家了。", s: "落地窗外是白樺林和雪。兩家人的四個晚上，就是這裡。", img: "scene/0107-5.jpg", amb: "fire", kb: "in", warm: true, dur: 10000 },
      { type: "end", t: "今晚", h: "壁爐點起來，小孩早點睡。<br>明天，Kiroro。", img: "scene/0107-6.jpg", amb: "fire", kb: "out", warm: true, dur: 12000 }
    ]
  },
  "2027-01-08": { poster: { img: "poster/0108.jpg", line: "第一次上 Kiroro。上午跟教練，下午自己滑，晚上 Onze 夜滑。" } },
  "2027-01-09": { poster: { img: "poster/0109.jpg", line: "連假第一天開門就上山，收板後去朝里殿泡湯。" } },
  "2027-01-10": { poster: { img: "poster/0110.jpg", line: "滑半天就下山。堺町通、LeTAO，等運河的煤氣燈亮起來。" } },
  "2027-01-11": { poster: { img: "poster/0111.jpg", line: "退房往東。旭山動物園的企鵝散步，傍晚到富良野的小木屋。" } },
  "2027-01-12": { poster: { img: "poster/0112.jpg", line: "富良野開滑。平日沒人，壓雪寬坡，練 carving 的日子。" } },
  "2027-01-13": { poster: { img: "poster/0113.jpg", line: "十勝岳連峰就在對面。整天都在雪上。" } },
  "2027-01-14": { poster: { img: "poster/0114.jpg", line: "最後一個有保姆的上午。下午送她到車站，然後兩家自己來。" } },
  "2027-01-15": { poster: { img: "poster/0115.jpg", line: "不滑雪的一天。美瑛的牧場、炸蝦丼、瀑布，和點了燈的青池。" } },
  "2027-01-16": { poster: { img: "poster/0116.jpg", line: "離開山，回到城市。晚上在啤酒園吃成吉思汗。" } },
  "2027-01-17": { poster: { img: "poster/0117.jpg", line: "週日，小孩的札幌：雪世界、水族館、湯咖哩。" } },
  "2027-01-18": { poster: { img: "poster/0118.jpg", line: "最後一次滑雪。一家上山、一家顧小孩，中午交換。晚上吃螃蟹。" } },
  "2027-01-19": { poster: { img: "poster/0119.jpg", line: "加油、還車、退稅。十三天，回家。" } }
};

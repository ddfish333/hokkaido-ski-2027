/* 每日行程點與路段（自動產生：OSRM 路網 ×1.15 一般、×1.5 下雪；步行 4 km/h） */
window.DAYPLAN = {
 "2027-01-07": {
  "stops": [
   {
    "id": "cts",
    "name": "新千歲機場",
    "lat": 42.7868,
    "lon": 141.683,
    "time": "14:05",
    "note": "抵達、入境、領行李"
   },
   {
    "id": "rental",
    "name": "北海道租車 新千歲機場店",
    "lat": 42.8195,
    "lon": 141.6575,
    "time": "15:15",
    "note": "取車手續（4 位駕駛帶證件）"
   },
   {
    "id": "aeon",
    "name": "AEON 札幌発寒",
    "lat": 43.0962,
    "lon": 141.2768,
    "time": "16:50",
    "note": "採買早餐、晚餐美食街"
   },
   {
    "id": "villa",
    "name": "山鄉 春 Villa",
    "lat": 43.1467841,
    "lon": 141.1354924,
    "time": "18:30",
    "note": "入住"
   }
  ],
  "legs": [
   {
    "frm": "新千歲機場",
    "to": "北海道租車 新千歲機場店",
    "km": 5.1,
    "normal": 10,
    "snow": 10,
    "mode": "drive"
   },
   {
    "frm": "北海道租車 新千歲機場店",
    "to": "AEON 札幌発寒",
    "km": 52.2,
    "normal": 50,
    "snow": 65,
    "mode": "drive"
   },
   {
    "frm": "AEON 札幌発寒",
    "to": "山鄉 春 Villa",
    "km": 14.7,
    "normal": 15,
    "snow": 20,
    "mode": "drive"
   }
  ]
 },
 "2027-01-08": {
  "stops": [
   {
    "id": "villa",
    "name": "山鄉 春 Villa",
    "lat": 43.1467841,
    "lon": 141.1354924,
    "time": "08:00",
    "note": "出發"
   },
   {
    "id": "kiroro",
    "name": "Kiroro 滑雪場",
    "lat": 43.0674,
    "lon": 140.9904,
    "time": "08:45",
    "note": "上午教練課、下午自由滑"
   },
   {
    "id": "villa",
    "name": "山鄉 春 Villa",
    "lat": 43.1467841,
    "lon": 141.1354924,
    "time": "17:15",
    "note": "回山鄉"
   },
   {
    "id": "onze",
    "name": "Onze 雪場",
    "lat": 43.1439,
    "lon": 141.1278,
    "time": "19:30",
    "note": "大人輪流夜滑（步行）"
   }
  ],
  "legs": [
   {
    "frm": "山鄉 春 Villa",
    "to": "Kiroro 滑雪場",
    "km": 34.5,
    "normal": 35,
    "snow": 45,
    "mode": "drive"
   },
   {
    "frm": "Kiroro 滑雪場",
    "to": "山鄉 春 Villa",
    "km": 36.9,
    "normal": 40,
    "snow": 50,
    "mode": "drive"
   },
   {
    "frm": "山鄉 春 Villa",
    "to": "Onze 雪場",
    "km": 0.9,
    "normal": 15,
    "snow": 15,
    "mode": "walk"
   }
  ]
 },
 "2027-01-09": {
  "stops": [
   {
    "id": "villa",
    "name": "山鄉 春 Villa",
    "lat": 43.1467841,
    "lon": 141.1354924,
    "time": "08:00",
    "note": "出發"
   },
   {
    "id": "kiroro",
    "name": "Kiroro 滑雪場",
    "lat": 43.0674,
    "lon": 140.9904,
    "time": "08:45",
    "note": "滑雪（連假）"
   },
   {
    "id": "asari",
    "name": "湯の花 朝里殿",
    "lat": 43.1573,
    "lon": 141.0442,
    "time": "16:30",
    "note": "泡湯、館內晚餐"
   },
   {
    "id": "villa",
    "name": "山鄉 春 Villa",
    "lat": 43.1467841,
    "lon": 141.1354924,
    "time": "19:00",
    "note": "回山鄉"
   }
  ],
  "legs": [
   {
    "frm": "山鄉 春 Villa",
    "to": "Kiroro 滑雪場",
    "km": 34.5,
    "normal": 35,
    "snow": 45,
    "mode": "drive"
   },
   {
    "frm": "Kiroro 滑雪場",
    "to": "湯の花 朝里殿",
    "km": 26.0,
    "normal": 30,
    "snow": 35,
    "mode": "drive"
   },
   {
    "frm": "湯の花 朝里殿",
    "to": "山鄉 春 Villa",
    "km": 13.2,
    "normal": 15,
    "snow": 15,
    "mode": "drive"
   }
  ]
 },
 "2027-01-10": {
  "stops": [
   {
    "id": "villa",
    "name": "山鄉 春 Villa",
    "lat": 43.1467841,
    "lon": 141.1354924,
    "time": "08:00",
    "note": "出發"
   },
   {
    "id": "kiroro",
    "name": "Kiroro 滑雪場",
    "lat": 43.0674,
    "lon": 140.9904,
    "time": "08:45",
    "note": "滑半天"
   },
   {
    "id": "canal",
    "name": "小樽運河・堺町通",
    "lat": 43.1962,
    "lon": 141.005,
    "time": "13:45",
    "note": "停車，逛堺町通、運河"
   },
   {
    "id": "naruto",
    "name": "若鶏時代なると",
    "lat": 43.1994,
    "lon": 140.9956,
    "time": "17:00",
    "note": "晚餐"
   },
   {
    "id": "villa",
    "name": "山鄉 春 Villa",
    "lat": 43.1467841,
    "lon": 141.1354924,
    "time": "19:00",
    "note": "回山鄉"
   }
  ],
  "legs": [
   {
    "frm": "山鄉 春 Villa",
    "to": "Kiroro 滑雪場",
    "km": 34.5,
    "normal": 35,
    "snow": 45,
    "mode": "drive"
   },
   {
    "frm": "Kiroro 滑雪場",
    "to": "小樽運河・堺町通",
    "km": 28.4,
    "normal": 30,
    "snow": 40,
    "mode": "drive"
   },
   {
    "frm": "小樽運河・堺町通",
    "to": "若鶏時代なると",
    "km": 1.1,
    "normal": 5,
    "snow": 5,
    "mode": "drive"
   },
   {
    "frm": "若鶏時代なると",
    "to": "山鄉 春 Villa",
    "km": 17.6,
    "normal": 15,
    "snow": 20,
    "mode": "drive"
   }
  ]
 },
 "2027-01-11": {
  "stops": [
   {
    "id": "villa",
    "name": "山鄉 春 Villa",
    "lat": 43.1467841,
    "lon": 141.1354924,
    "time": "07:30",
    "note": "退房出發"
   },
   {
    "id": "zoo",
    "name": "旭山動物園",
    "lat": 43.7686,
    "lon": 142.4793,
    "time": "10:15",
    "note": "企鵝散步 11:00、14:30"
   },
   {
    "id": "lodge",
    "name": "富良野小木屋",
    "lat": 43.3325009,
    "lon": 142.3631996,
    "time": "16:15",
    "note": "入住"
   },
   {
    "id": "kumagera",
    "name": "くまげら",
    "lat": 43.3452,
    "lon": 142.3912,
    "time": "18:00",
    "note": "晚餐"
   },
   {
    "id": "lodge",
    "name": "富良野小木屋",
    "lat": 43.3325009,
    "lon": 142.3631996,
    "time": "19:45",
    "note": "回小木屋"
   }
  ],
  "legs": [
   {
    "frm": "山鄉 春 Villa",
    "to": "旭山動物園",
    "km": 161.3,
    "normal": 160,
    "snow": 210,
    "mode": "drive"
   },
   {
    "frm": "旭山動物園",
    "to": "富良野小木屋",
    "km": 60.8,
    "normal": 70,
    "snow": 90,
    "mode": "drive"
   },
   {
    "frm": "富良野小木屋",
    "to": "くまげら",
    "km": 3.8,
    "normal": 10,
    "snow": 10,
    "mode": "drive"
   },
   {
    "frm": "くまげら",
    "to": "富良野小木屋",
    "km": 3.8,
    "normal": 10,
    "snow": 10,
    "mode": "drive"
   }
  ]
 },
 "2027-01-12": {
  "stops": [
   {
    "id": "lodge",
    "name": "富良野小木屋",
    "lat": 43.3325009,
    "lon": 142.3631996,
    "time": "08:15",
    "note": "出發"
   },
   {
    "id": "kita",
    "name": "富良野滑雪場 北之峰",
    "lat": 43.3404,
    "lon": 142.3433,
    "time": "08:30",
    "note": "上午教練課、下午自由滑"
   },
   {
    "id": "ningle",
    "name": "森林精靈露台",
    "lat": 43.3234,
    "lon": 142.3563,
    "time": "16:30",
    "note": "森林精靈露台散步"
   },
   {
    "id": "lodge",
    "name": "富良野小木屋",
    "lat": 43.3325009,
    "lon": 142.3631996,
    "time": "18:00",
    "note": "回小木屋"
   }
  ],
  "legs": [
   {
    "frm": "富良野小木屋",
    "to": "富良野滑雪場 北之峰",
    "km": 1.8,
    "normal": 5,
    "snow": 10,
    "mode": "drive"
   },
   {
    "frm": "富良野滑雪場 北之峰",
    "to": "森林精靈露台",
    "km": 3.9,
    "normal": 10,
    "snow": 10,
    "mode": "drive"
   },
   {
    "frm": "森林精靈露台",
    "to": "富良野小木屋",
    "km": 2.7,
    "normal": 5,
    "snow": 10,
    "mode": "drive"
   }
  ]
 },
 "2027-01-13": {
  "stops": [
   {
    "id": "lodge",
    "name": "富良野小木屋",
    "lat": 43.3325009,
    "lon": 142.3631996,
    "time": "08:15",
    "note": "出發"
   },
   {
    "id": "fzone",
    "name": "富良野滑雪場 富良野區",
    "lat": 43.3266,
    "lon": 142.3394,
    "time": "08:30",
    "note": "滑雪（富良野區）"
   },
   {
    "id": "lodge",
    "name": "富良野小木屋",
    "lat": 43.3325009,
    "lon": 142.3631996,
    "time": "16:30",
    "note": "回小木屋"
   }
  ],
  "legs": [
   {
    "frm": "富良野小木屋",
    "to": "富良野滑雪場 富良野區",
    "km": 3.1,
    "normal": 10,
    "snow": 10,
    "mode": "drive"
   },
   {
    "frm": "富良野滑雪場 富良野區",
    "to": "富良野小木屋",
    "km": 3.1,
    "normal": 10,
    "snow": 10,
    "mode": "drive"
   }
  ]
 },
 "2027-01-14": {
  "stops": [
   {
    "id": "lodge",
    "name": "富良野小木屋",
    "lat": 43.3325009,
    "lon": 142.3631996,
    "time": "08:15",
    "note": "出發"
   },
   {
    "id": "kita",
    "name": "富良野滑雪場 北之峰",
    "lat": 43.3404,
    "lon": 142.3433,
    "time": "08:30",
    "note": "上午滑雪"
   },
   {
    "id": "fstn",
    "name": "富良野站（保姆巴士）",
    "lat": 43.3469,
    "lon": 142.3917,
    "time": "14:00",
    "note": "送保姆搭巴士"
   },
   {
    "id": "yuiga",
    "name": "唯我独尊",
    "lat": 43.3449,
    "lon": 142.3895,
    "time": "17:30",
    "note": "晚餐（只收現金）"
   },
   {
    "id": "lodge",
    "name": "富良野小木屋",
    "lat": 43.3325009,
    "lon": 142.3631996,
    "time": "19:00",
    "note": "回小木屋"
   }
  ],
  "legs": [
   {
    "frm": "富良野小木屋",
    "to": "富良野滑雪場 北之峰",
    "km": 1.8,
    "normal": 5,
    "snow": 10,
    "mode": "drive"
   },
   {
    "frm": "富良野滑雪場 北之峰",
    "to": "富良野站（保姆巴士）",
    "km": 3.7,
    "normal": 5,
    "snow": 10,
    "mode": "drive"
   },
   {
    "frm": "富良野站（保姆巴士）",
    "to": "唯我独尊",
    "km": 0.2,
    "normal": 5,
    "snow": 5,
    "mode": "drive"
   },
   {
    "frm": "唯我独尊",
    "to": "富良野小木屋",
    "km": 3.6,
    "normal": 5,
    "snow": 10,
    "mode": "drive"
   }
  ]
 },
 "2027-01-15": {
  "stops": [
   {
    "id": "lodge",
    "name": "富良野小木屋",
    "lat": 43.3325009,
    "lon": 142.3631996,
    "time": "10:30",
    "note": "出發"
   },
   {
    "id": "junpei",
    "name": "じゅんぺい",
    "lat": 43.5886,
    "lon": 142.4673,
    "time": "11:15",
    "note": "炸蝦丼（現金或 PayPay）"
   },
   {
    "id": "chiyoda",
    "name": "千代田牧場",
    "lat": 43.5427,
    "lon": 142.4918,
    "time": "12:45",
    "note": "牧場"
   },
   {
    "id": "shirahige",
    "name": "白鬚瀑布",
    "lat": 43.4746,
    "lon": 142.6392,
    "time": "16:15",
    "note": "瀑布點燈"
   },
   {
    "id": "aoiike",
    "name": "青池",
    "lat": 43.4935,
    "lon": 142.6141,
    "time": "16:45",
    "note": "17:00 點燈"
   },
   {
    "id": "lodge",
    "name": "富良野小木屋",
    "lat": 43.3325009,
    "lon": 142.3631996,
    "time": "18:20",
    "note": "回小木屋"
   }
  ],
  "legs": [
   {
    "frm": "富良野小木屋",
    "to": "じゅんぺい",
    "km": 36.0,
    "normal": 35,
    "snow": 45,
    "mode": "drive"
   },
   {
    "frm": "じゅんぺい",
    "to": "千代田牧場",
    "km": 6.5,
    "normal": 10,
    "snow": 15,
    "mode": "drive"
   },
   {
    "frm": "千代田牧場",
    "to": "白鬚瀑布",
    "km": 16.8,
    "normal": 25,
    "snow": 35,
    "mode": "drive"
   },
   {
    "frm": "白鬚瀑布",
    "to": "青池",
    "km": 3.3,
    "normal": 5,
    "snow": 5,
    "mode": "drive"
   },
   {
    "frm": "青池",
    "to": "富良野小木屋",
    "km": 37.2,
    "normal": 45,
    "snow": 55,
    "mode": "drive"
   }
  ]
 },
 "2027-01-16": {
  "stops": [
   {
    "id": "lodge",
    "name": "富良野小木屋",
    "lat": 43.3325009,
    "lon": 142.3631996,
    "time": "10:00",
    "note": "退房出發"
   },
   {
    "id": "favlux",
    "name": "FAV LUX 札幌薄野",
    "lat": 43.0523778,
    "lon": 141.3485722,
    "time": "14:30",
    "note": "入住（先停好車）"
   },
   {
    "id": "beer",
    "name": "サッポロビール園",
    "lat": 43.0709,
    "lon": 141.3688,
    "time": "18:00",
    "note": "成吉思汗晚餐"
   },
   {
    "id": "favlux",
    "name": "FAV LUX 札幌薄野",
    "lat": 43.0523778,
    "lon": 141.3485722,
    "time": "20:00",
    "note": "回飯店"
   }
  ],
  "legs": [
   {
    "frm": "富良野小木屋",
    "to": "FAV LUX 札幌薄野",
    "km": 114.9,
    "normal": 115,
    "snow": 150,
    "mode": "drive"
   },
   {
    "frm": "FAV LUX 札幌薄野",
    "to": "サッポロビール園",
    "km": 4.1,
    "normal": 5,
    "snow": 10,
    "mode": "drive"
   },
   {
    "frm": "サッポロビール園",
    "to": "FAV LUX 札幌薄野",
    "km": 4.1,
    "normal": 5,
    "snow": 10,
    "mode": "drive"
   }
  ]
 },
 "2027-01-17": {
  "stops": [
   {
    "id": "favlux",
    "name": "FAV LUX 札幌薄野",
    "lat": 43.0523778,
    "lon": 141.3485722,
    "time": "09:00",
    "note": "出發"
   },
   {
    "id": "takino",
    "name": "瀧野鈴蘭丘陵公園",
    "lat": 42.9125,
    "lon": 141.3814,
    "time": "09:30",
    "note": "雪地滑圈、玩雪"
   },
   {
    "id": "favlux",
    "name": "FAV LUX 札幌薄野",
    "lat": 43.0523778,
    "lon": 141.3485722,
    "time": "13:30",
    "note": "回飯店"
   },
   {
    "id": "aoao",
    "name": "AOAO SAPPORO",
    "lat": 43.0578,
    "lon": 141.3536,
    "time": "14:30",
    "note": "水族館（步行）"
   },
   {
    "id": "soul",
    "name": "湯咖哩 SOUL STORE",
    "lat": 43.0557,
    "lon": 141.3477,
    "time": "18:00",
    "note": "湯咖哩晚餐（步行）"
   },
   {
    "id": "favlux",
    "name": "FAV LUX 札幌薄野",
    "lat": 43.0523778,
    "lon": 141.3485722,
    "time": "19:30",
    "note": "回飯店（步行）"
   }
  ],
  "legs": [
   {
    "frm": "FAV LUX 札幌薄野",
    "to": "瀧野鈴蘭丘陵公園",
    "km": 21.2,
    "normal": 30,
    "snow": 40,
    "mode": "drive"
   },
   {
    "frm": "瀧野鈴蘭丘陵公園",
    "to": "FAV LUX 札幌薄野",
    "km": 21.2,
    "normal": 30,
    "snow": 40,
    "mode": "drive"
   },
   {
    "frm": "FAV LUX 札幌薄野",
    "to": "AOAO SAPPORO",
    "km": 0.9,
    "normal": 15,
    "snow": 15,
    "mode": "walk"
   },
   {
    "frm": "AOAO SAPPORO",
    "to": "湯咖哩 SOUL STORE",
    "km": 0.7,
    "normal": 10,
    "snow": 10,
    "mode": "walk"
   },
   {
    "frm": "湯咖哩 SOUL STORE",
    "to": "FAV LUX 札幌薄野",
    "km": 0.5,
    "normal": 5,
    "snow": 10,
    "mode": "walk"
   }
  ]
 },
 "2027-01-18": {
  "stops": [
   {
    "id": "favlux",
    "name": "FAV LUX 札幌薄野",
    "lat": 43.0523778,
    "lon": 141.3485722,
    "time": "08:30",
    "note": "出發"
   },
   {
    "id": "teine",
    "name": "Teine 滑雪場",
    "lat": 43.0933,
    "lon": 141.2116,
    "time": "09:00",
    "note": "一家滑、一家顧小孩，中午交換"
   },
   {
    "id": "favlux",
    "name": "FAV LUX 札幌薄野",
    "lat": 43.0523778,
    "lon": 141.3485722,
    "time": "16:30",
    "note": "回飯店"
   },
   {
    "id": "kani",
    "name": "札幌かに本家",
    "lat": 43.0653,
    "lon": 141.3533,
    "time": "18:00",
    "note": "螃蟹晚餐"
   },
   {
    "id": "favlux",
    "name": "FAV LUX 札幌薄野",
    "lat": 43.0523778,
    "lon": 141.3485722,
    "time": "20:30",
    "note": "回飯店、打包雪具"
   }
  ],
  "legs": [
   {
    "frm": "FAV LUX 札幌薄野",
    "to": "Teine 滑雪場",
    "km": 18.3,
    "normal": 25,
    "snow": 35,
    "mode": "drive"
   },
   {
    "frm": "Teine 滑雪場",
    "to": "FAV LUX 札幌薄野",
    "km": 18.2,
    "normal": 25,
    "snow": 35,
    "mode": "drive"
   },
   {
    "frm": "FAV LUX 札幌薄野",
    "to": "札幌かに本家",
    "km": 2.0,
    "normal": 5,
    "snow": 5,
    "mode": "drive"
   },
   {
    "frm": "札幌かに本家",
    "to": "FAV LUX 札幌薄野",
    "km": 2.1,
    "normal": 5,
    "snow": 5,
    "mode": "drive"
   }
  ]
 },
 "2027-01-19": {
  "stops": [
   {
    "id": "favlux",
    "name": "FAV LUX 札幌薄野",
    "lat": 43.0523778,
    "lon": 141.3485722,
    "time": "08:30",
    "note": "退房出發"
   },
   {
    "id": "rental",
    "name": "北海道租車 新千歲機場店",
    "lat": 42.8195,
    "lon": 141.6575,
    "time": "09:30",
    "note": "附近加滿油、10:00 還車"
   },
   {
    "id": "cts",
    "name": "新千歲機場",
    "lat": 42.7868,
    "lon": 141.683,
    "time": "10:30",
    "note": "報到、退稅、BR165 12:10"
   }
  ],
  "legs": [
   {
    "frm": "FAV LUX 札幌薄野",
    "to": "北海道租車 新千歲機場店",
    "km": 40.4,
    "normal": 40,
    "snow": 55,
    "mode": "drive"
   },
   {
    "frm": "北海道租車 新千歲機場店",
    "to": "新千歲機場",
    "km": 4.8,
    "normal": 5,
    "snow": 10,
    "mode": "drive"
   }
  ]
 }
};

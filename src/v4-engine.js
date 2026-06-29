// V4.0 — 251 clubs from clubelo.com + league estimates
const CLUB_ELO_LOOKUP = {
  "AC奥卢": "club_ac__",
  "AC米兰": "club_milan",
  "TPS图尔": "club_tps__",
  "不来梅": "club_werder",
  "东京FC": "club_\u4e1c\u4eacfc",
  "东京绿茵": "club_\u4e1c\u4eac\u7eff\u8335",
  "中央大学": "club_\u4e2d\u592e\u5927\u5b66",
  "乌德勒支": "club_utrecht",
  "乌迪内斯": "club_udinese",
  "亚特兰大": "club_atalanta",
  "亚特联": "club_\u4e9a\u7279\u8054",
  "亚自由": "club_\u4e9a\u81ea\u7531",
  "京都": "club_\u4eac\u90fd",
  "仁川联": "club_\u4ec1\u5ddd\u8054",
  "代格福什": "club_degerfors",
  "休斯顿": "club_\u4f11\u65af\u987f",
  "伯恩利": "club_burnley",
  "伯恩茅斯": "club_bournemouth",
  "佛罗伦萨": "club_fiorentina",
  "佩纳罗尔": "club_\u4f69\u7eb3\u7f57\u5c14",
  "光州FC": "club_\u5149\u5ddefc",
  "克里斯蒂": "club_kristiansund",
  "克雷莫纳": "club_cremonese",
  "全北现代": "club_\u5168\u5317\u73b0\u4ee3",
  "冈山绿雉": "club_\u5188\u5c71\u7eff\u96c9",
  "切尔西": "club_chelsea",
  "利兹联": "club_leeds",
  "利勒斯特": "club_lillestrom",
  "利物浦": "club_liverpool",
  "利雅新月": "club_\u5229\u96c5\u65b0\u6708",
  "利雅胜利": "club_\u5229\u96c5\u80dc\u5229",
  "利雅青年": "club_\u5229\u96c5\u9752\u5e74",
  "千叶市原": "club_\u5343\u53f6\u5e02\u539f",
  "华盛顿": "club_\u534e\u76db\u987f",
  "南安普敦": "club_southampton",
  "博卡": "club_\u535a\u5361",
  "博德闪耀": "club_\u535a\u5fb7\u95ea\u8000",
  "博洛尼亚": "club_bologna",
  "卡利亚里": "club_cagliari",
  "卡尔马": "club_kalmar",
  "卡萨皮亚": "club_casa_pia",
  "厄格里特": "club_oergryte",
  "吉达国民": "club_\u5409\u8fbe\u56fd\u6c11",
  "吉达联合": "club_\u5409\u8fbe\u8054\u5408",
  "名古屋鲸": "club_\u540d\u53e4\u5c4b\u9cb8",
  "哈尔姆斯": "club_halmstad",
  "哈马比": "club_hammarby",
  "哥伦布": "club_\u54e5\u4f26\u5e03",
  "哥德堡": "club_\u54e5\u5fb7\u5821",
  "国际图尔": "club_\u56fd\u9645\u56fe\u5c14",
  "国际米兰": "club_inter",
  "圣何塞": "club_\u5723\u4f55\u585e",
  "圣保罗": "club_\u5723\u4fdd\u7f57",
  "圣旺红星": "club_red_star",
  "圣菲独立": "club_\u5723\u83f2\u72ec\u7acb",
  "坦山猫": "club_\u5766\u5c71\u732b",
  "埃夫斯堡": "club_\u57c3\u592b\u65af\u5821",
  "埃尔切": "club_elche",
  "埃尔夫斯堡": "club_elfsborg",
  "埃弗顿": "club_everton",
  "埃沃斯堡": "club_elversberg",
  "基多体大": "club_\u57fa\u591a\u4f53\u5927",
  "堪萨斯": "club_\u582a\u8428\u65af",
  "塞伊奈": "club_\u585e\u4f0a\u5948",
  "塞尔塔": "club_celta",
  "塞维利亚": "club_sevilla",
  "夏洛特FC": "club_\u590f\u6d1b\u7279fc",
  "多伦多": "club_\u591a\u4f26\u591a",
  "多特": "club_dortmund",
  "大学体育": "club_\u5927\u5b66\u4f53\u80b2",
  "大田": "club_\u5927\u7530",
  "大邱": "club_\u5927\u90b1",
  "大阪樱花": "club_\u5927\u962a\u6a31\u82b1",
  "大阪钢巴": "club_\u5927\u962a\u94a2\u5df4",
  "天主大学": "club_\u5929\u4e3b\u5927\u5b66",
  "天狼星": "club_\u5929\u72fc\u661f",
  "奈梅亨": "club_nijmegen",
  "奥兰多": "club_\u5965\u5170\u591a",
  "奥勒松": "club_aalesund",
  "奥斯KFUM": "club_kfum_oslo",
  "奥斯汀": "club_\u5965\u65af\u6c40",
  "奥格斯堡": "club_augsburg",
  "奥维耶多": "club_oviedo",
  "奥萨苏纳": "club_osasuna",
  "威尼": "club_venezia",
  "富勒姆": "club_fulham",
  "富川FC": "club_\u5bcc\u5dddfc",
  "尤文图斯": "club_juventus",
  "尼斯": "club_nice",
  "川崎前锋": "club_\u5ddd\u5d0e\u524d\u950b",
  "巴伦西亚": "club_valencia",
  "巴兰基亚": "club_\u5df4\u5170\u57fa\u4e9a",
  "巴萨": "club_barcelona",
  "巴黎圣曼": "club_paris_sg",
  "布伦特": "club_brentford",
  "布兰": "club_brann",
  "布拉加": "club_braga",
  "布赖合作": "club_\u5e03\u8d56\u5408\u4f5c",
  "布雷斯特": "club_brest",
  "布鲁马波": "club_brommapojkarna",
  "帕尔马": "club_parma",
  "帕德博恩": "club_paderborn",
  "帕梅拉斯": "club_\u5e15\u6885\u62c9\u65af",
  "广岛三箭": "club_\u5e7f\u5c9b\u4e09\u7bad",
  "库奥皮奥": "club_\u5e93\u5965\u76ae\u5965",
  "弗拉门戈": "club_\u5f17\u62c9\u95e8\u6208",
  "弗赖堡": "club_freiburg",
  "德尔瓦耶": "club_\u5fb7\u5c14\u74e6\u8036",
  "托利马": "club_\u6258\u5229\u9a6c",
  "拉努斯": "club_\u62c9\u52aa\u65af",
  "拉斯决心": "club_\u62c9\u65af\u51b3\u5fc3",
  "拉普大学": "club_\u62c9\u666e\u5927\u5b66",
  "拉赫蒂": "club_\u62c9\u8d6b\u8482",
  "拉齐奥": "club_lazio",
  "拜仁": "club_bayern",
  "摩纳哥": "club_monaco",
  "斯图加特": "club_stuttgart",
  "斯特拉斯": "club_strasbourg",
  "斯达": "club_start",
  "新未来SC": "club_\u65b0\u672a\u6765sc",
  "新泻": "club_\u65b0\u6cfb",
  "新英格兰": "club_\u65b0\u82f1\u683c\u5170",
  "时刻准备": "club_\u65f6\u523b\u51c6\u5907",
  "明尼苏达": "club_\u660e\u5c3c\u82cf\u8fbe",
  "曼城": "club_man_city",
  "曼联": "club_man_united",
  "朗斯": "club_lens",
  "本菲卡": "club_benfica",
  "札幌": "club_\u672d\u5e4c",
  "杜塞多夫": "club_duesseldorf",
  "柏太阳神": "club_\u67cf\u592a\u9633\u795e",
  "柏林联合": "club_union_berlin",
  "格罗宁根": "club_groningen",
  "桑德兰": "club_sunderland",
  "桑托斯": "club_\u6851\u6258\u65af",
  "桑纳菲": "club_sandefjord",
  "横滨水手": "club_\u6a2a\u6ee8\u6c34\u624b",
  "欧塞尔": "club_auxerre",
  "比利亚雷": "club_villarreal",
  "比萨": "club_pisa",
  "水原": "club_\u6c34\u539f",
  "水户蜀葵": "club_\u6c34\u6237\u8700\u8475",
  "水晶体育": "club_\u6c34\u6676\u4f53\u80b2",
  "水晶宫": "club_crystal_palace",
  "汉坎": "club_\u6c49\u574e",
  "汉堡": "club_hamburg",
  "汉诺威": "club_hannover",
  "沃夫斯堡": "club_wolfsburg",
  "河床": "club_\u6cb3\u5e8a",
  "法兰克福": "club_frankfurt",
  "法马利康": "club_famalicao",
  "波尔图": "club_porto",
  "波特兰": "club_\u6ce2\u7279\u5170",
  "波特诺": "club_\u6ce2\u7279\u8bfa",
  "洛杉矶FC": "club_\u6d1b\u6749\u77f6fc",
  "济州": "club_\u6d4e\u5dde",
  "浦和红钻": "club_\u6d66\u548c\u7ea2\u94bb",
  "浦项制铁": "club_\u6d66\u9879\u5236\u94c1",
  "海于格松": "club_\u6d77\u4e8e\u683c\u677e",
  "海登海姆": "club_heidenheim",
  "清水鼓动": "club_\u6e05\u6c34\u9f13\u52a8",
  "温哥华": "club_\u6e29\u54e5\u534e",
  "热刺": "club_tottenham",
  "热那亚": "club_genoa",
  "特罗姆瑟": "club_tromso",
  "独立": "club_\u72ec\u7acb",
  "狼队": "club_wolves",
  "玛丽港": "club_\u739b\u4e3d\u6e2f",
  "玻利瓦尔": "club_\u73bb\u5229\u74e6\u5c14",
  "瓦勒伦加": "club_valerenga",
  "瓦萨": "club_\u74e6\u8428",
  "町田泽维": "club_\u753a\u7530\u6cfd\u7ef4",
  "皇家社会": "club_sociedad",
  "皇马": "club_real_madrid",
  "盐湖城": "club_\u76d0\u6e56\u57ce",
  "盖斯": "club_gais",
  "神户胜利": "club_\u795e\u6237\u80dc\u5229",
  "福冈": "club_\u798f\u5188",
  "科尔多瓦": "club_\u79d1\u5c14\u591a\u74e6",
  "科林蒂安": "club_\u79d1\u6797\u8482\u5b89",
  "科罗拉": "club_\u79d1\u7f57\u62c9",
  "科莫": "club_como",
  "科金博联": "club_\u79d1\u91d1\u535a\u8054",
  "科隆": "club_koeln",
  "竞技": "club_\u7ade\u6280",
  "米亚尔比": "club_\u7c73\u4e9a\u5c14\u6bd4",
  "米堡": "club_middlesbrough",
  "米拉索尔": "club_\u7c73\u62c9\u7d22\u5c14",
  "索尔纳": "club_aik",
  "索菲亚": "club_\u7d22\u83f2\u4e9a",
  "纳什维尔": "club_\u7eb3\u4ec0\u7ef4\u5c14",
  "纽卡斯尔": "club_newcastle",
  "纽维尔": "club_\u7ebd\u7ef4\u5c14",
  "维京": "club_viking",
  "维拉": "club_aston_villa",
  "维罗纳": "club_verona",
  "罗德兹": "club_rodez",
  "罗森博格": "club_rosenborg",
  "罗萨里奥": "club_\u7f57\u8428\u91cc\u5965",
  "罗马": "club_roma",
  "美因茨": "club_mainz",
  "胡巴卡德": "club_\u80e1\u5df4\u5361\u5fb7",
  "腓特烈": "club_fredrikstad",
  "芝加哥": "club_\u829d\u52a0\u54e5",
  "莫尔德": "club_molde",
  "莱万特": "club_levante",
  "莱切": "club_lecce",
  "菲尔特": "club_fuerth",
  "萨斯菲": "club_\u8428\u65af\u83f2",
  "萨普斯堡": "club_sarpsborg",
  "萨索洛": "club_sassuolo",
  "蒙国民": "club_nacional",
  "蒙特利尔": "club_\u8499\u7279\u5229\u5c14",
  "蔚山现代": "club_\u851a\u5c71\u73b0\u4ee3",
  "西汉姆联": "club_west_ham",
  "西雅图": "club_\u897f\u96c5\u56fe",
  "贝尔格莱德": "club_\u8d1d\u5c14\u683c\u83b1\u5fb7",
  "贝蒂斯": "club_betis",
  "费城": "club_\u8d39\u57ce",
  "费耶诺德": "club_feyenoord",
  "赫塔费": "club_getafe",
  "赫尔辛基": "club_\u8d6b\u5c14\u8f9b\u57fa",
  "赫根": "club_haecken",
  "赫罗纳": "club_girona",
  "辛辛那提": "club_\u8f9b\u8f9b\u90a3\u63d0",
  "达姆施塔特": "club_darmstadt",
  "达拉斯": "club_\u8fbe\u62c9\u65af",
  "达曼协定": "club_\u8fbe\u66fc\u534f\u5b9a",
  "达马克": "club_\u8fbe\u9a6c\u514b",
  "迈季宽广": "club_\u8fc8\u5b63\u5bbd\u5e7f",
  "那不勒斯": "club_napoli",
  "都灵": "club_torino",
  "里尔": "club_lille",
  "里昂": "club_lyon",
  "里独立": "club_\u91cc\u72ec\u7acb",
  "金泉": "club_\u91d1\u6cc9",
  "阿拉维斯": "club_alaves",
  "阿根廷青年": "club_\u963f\u6839\u5ef7\u9752\u5e74",
  "阿森纳": "club_arsenal",
  "阿纳西": "club_annecy",
  "阿贾克斯": "club_ajax",
  "雅罗": "club_\u96c5\u7f57",
  "霍芬海姆": "club_hoffenheim",
  "韦斯特罗": "club_\u97e6\u65af\u7279\u7f57",
  "首尔FC": "club_\u9996\u5c14fc",
  "马尔默": "club_\u9a6c\u5c14\u9ed8",
  "马洛卡": "club_mallorca",
  "马竞": "club_atletico",
  "马赛": "club_marseille",
  "鸟栖": "club_\u9e1f\u6816",
  "鹿岛鹿角": "club_\u9e7f\u5c9b\u9e7f\u89d2",

  // EN aliases for football-data.co.uk CSV
  "milan": "club_milan",
  "werder": "club_werder",
  "utrecht": "club_utrecht",
  "udinese": "club_udinese",
  "atalanta": "club_atalanta",
  "degerfors": "club_degerfors",
  "burnley": "club_burnley",
  "bournemouth": "club_bournemouth",
  "fiorentina": "club_fiorentina",
  "kristiansund": "club_kristiansund",
  "cremonese": "club_cremonese",
  "chelsea": "club_chelsea",
  "leeds": "club_leeds",
  "lillestrom": "club_lillestrom",
  "liverpool": "club_liverpool",
  "southampton": "club_southampton",
  "bologna": "club_bologna",
  "cagliari": "club_cagliari",
  "kalmar": "club_kalmar",
  "casa pia": "club_casa_pia",
  "oergryte": "club_oergryte",
  "halmstad": "club_halmstad",
  "hammarby": "club_hammarby",
  "inter": "club_inter",
  "red star": "club_red_star",
  "elfsborg": "club_elfsborg",
  "elche": "club_elche",
  "everton": "club_everton",
  "elversberg": "club_elversberg",
  "celta": "club_celta",
  "sevilla": "club_sevilla",
  "dortmund": "club_dortmund",
  "nijmegen": "club_nijmegen",
  "aalesund": "club_aalesund",
  "kfum oslo": "club_kfum_oslo",
  "augsburg": "club_augsburg",
  "oviedo": "club_oviedo",
  "osasuna": "club_osasuna",
  "venezia": "club_venezia",
  "fulham": "club_fulham",
  "juventus": "club_juventus",
  "nice": "club_nice",
  "valencia": "club_valencia",
  "barcelona": "club_barcelona",
  "paris sg": "club_paris_sg",
  "brentford": "club_brentford",
  "brann": "club_brann",
  "braga": "club_braga",
  "brest": "club_brest",
  "brommapojkarna": "club_brommapojkarna",
  "parma": "club_parma",
  "paderborn": "club_paderborn",
  "freiburg": "club_freiburg",
  "lazio": "club_lazio",
  "bayern": "club_bayern",
  "monaco": "club_monaco",
  "stuttgart": "club_stuttgart",
  "strasbourg": "club_strasbourg",
  "start": "club_start",
  "man city": "club_man_city",
  "man united": "club_man_united",
  "lens": "club_lens",
  "benfica": "club_benfica",
  "duesseldorf": "club_duesseldorf",
  "union berlin": "club_union_berlin",
  "groningen": "club_groningen",
  "sunderland": "club_sunderland",
  "sandefjord": "club_sandefjord",
  "auxerre": "club_auxerre",
  "villarreal": "club_villarreal",
  "pisa": "club_pisa",
  "crystal palace": "club_crystal_palace",
  "hamburg": "club_hamburg",
  "hannover": "club_hannover",
  "wolfsburg": "club_wolfsburg",
  "frankfurt": "club_frankfurt",
  "famalicao": "club_famalicao",
  "porto": "club_porto",
  "heidenheim": "club_heidenheim",
  "tottenham": "club_tottenham",
  "genoa": "club_genoa",
  "tromso": "club_tromso",
  "wolves": "club_wolves",
  "valerenga": "club_valerenga",
  "sociedad": "club_sociedad",
  "real madrid": "club_real_madrid",
  "gais": "club_gais",
  "como": "club_como",
  "koeln": "club_koeln",
  "middlesbrough": "club_middlesbrough",
  "aik": "club_aik",
  "newcastle": "club_newcastle",
  "viking": "club_viking",
  "aston villa": "club_aston_villa",
  "verona": "club_verona",
  "rodez": "club_rodez",
  "rosenborg": "club_rosenborg",
  "roma": "club_roma",
  "mainz": "club_mainz",
  "fredrikstad": "club_fredrikstad",
  "molde": "club_molde",
  "levante": "club_levante",
  "lecce": "club_lecce",
  "fuerth": "club_fuerth",
  "sarpsborg": "club_sarpsborg",
  "sassuolo": "club_sassuolo",
  "nacional": "club_nacional",
  "west ham": "club_west_ham",
  "betis": "club_betis",
  "feyenoord": "club_feyenoord",
  "getafe": "club_getafe",
  "haecken": "club_haecken",
  "girona": "club_girona",
  "darmstadt": "club_darmstadt",
  "napoli": "club_napoli",
  "torino": "club_torino",
  "lille": "club_lille",
  "lyon": "club_lyon",
  "alaves": "club_alaves",
  "arsenal": "club_arsenal",
  "annecy": "club_annecy",
  "ajax": "club_ajax",
  "hoffenheim": "club_hoffenheim",
  "mallorca": "club_mallorca",
  "atletico": "club_atletico",
  "marseille": "club_marseille",
  "tps  ": "club_tps__",
  "ac  ": "club_ac__",
  "弗拉门戈": "club_弗拉门戈",
  "帕梅拉斯": "club_帕梅拉斯",
  "科林蒂安": "club_科林蒂安",
  "圣保罗": "club_圣保罗",
  "桑托斯": "club_桑托斯",
  "拉普大学": "club_拉普大学",
  "拉努斯": "club_拉努斯",
  "罗萨里奥": "club_罗萨里奥",
  "萨斯菲": "club_萨斯菲",
  "纽维尔": "club_纽维尔",
  "阿根廷青年": "club_阿根廷青年",
  "科尔多瓦": "club_科尔多瓦",
  "利雅胜利": "club_利雅胜利",
  "利雅新月": "club_利雅新月",
  "吉达联合": "club_吉达联合",
  "吉达国民": "club_吉达国民",
  "达马克": "club_达马克",
  "布赖合作": "club_布赖合作",
  "迈季宽广": "club_迈季宽广",
  "新未来sc": "club_新未来sc",
  "利雅青年": "club_利雅青年",
  "达曼协定": "club_达曼协定",
  "胡巴卡德": "club_胡巴卡德",
  "拉斯决心": "club_拉斯决心",
  "蔚山现代": "club_蔚山现代",
  "全北现代": "club_全北现代",
  "首尔fc": "club_首尔fc",
  "浦项制铁": "club_浦项制铁",
  "光州fc": "club_光州fc",
  "仁川联": "club_仁川联",
  "富川fc": "club_富川fc",
  "神户胜利": "club_神户胜利",
  "川崎前锋": "club_川崎前锋",
  "横滨水手": "club_横滨水手",
  "浦和红钻": "club_浦和红钻",
  "鹿岛鹿角": "club_鹿岛鹿角",
  "名古屋鲸": "club_名古屋鲸",
  "广岛三箭": "club_广岛三箭",
  "大阪钢巴": "club_大阪钢巴",
  "清水鼓动": "club_清水鼓动",
  "柏太阳神": "club_柏太阳神",
  "东京绿茵": "club_东京绿茵",
  "千叶市原": "club_千叶市原",
  "町田泽维": "club_町田泽维",
  "冈山绿雉": "club_冈山绿雉",
  "水户蜀葵": "club_水户蜀葵",
  "东京fc": "club_东京fc",
  "大阪樱花": "club_大阪樱花",
  "赫尔辛基": "club_赫尔辛基",
  "库奥皮奥": "club_库奥皮奥",
  "塞伊奈": "club_塞伊奈",
  "国际图尔": "club_国际图尔",
  "玛丽港": "club_玛丽港",
  "坦山猫": "club_坦山猫",
  "拉赫蒂": "club_拉赫蒂",
  "马尔默": "club_马尔默",
  "天狼星": "club_天狼星",
  "埃夫斯堡": "club_埃夫斯堡",
  "哥德堡": "club_哥德堡",
  "韦斯特罗": "club_韦斯特罗",
  "米亚尔比": "club_米亚尔比",
  "博德闪耀": "club_博德闪耀",
  "海于格松": "club_海于格松",
  "哥伦布": "club_哥伦布",
  "波特兰": "club_波特兰",
  "盐湖城": "club_盐湖城",
  "纳什维尔": "club_纳什维尔",
  "蒙特利尔": "club_蒙特利尔",
  "夏洛特fc": "club_夏洛特fc",
  "辛辛那提": "club_辛辛那提",
  "西雅图": "club_西雅图",
  "多伦多": "club_多伦多",
  "明尼苏达": "club_明尼苏达",
  "圣何塞": "club_圣何塞",
  "华盛顿": "club_华盛顿",
  "新英格兰": "club_新英格兰",
  "洛杉矶fc": "club_洛杉矶fc",
  "亚特联": "club_亚特联",
  "奥兰多": "club_奥兰多",
  "达拉斯": "club_达拉斯",
  "休斯顿": "club_休斯顿",
  "堪萨斯": "club_堪萨斯",
  "芝加哥": "club_芝加哥",
  "温哥华": "club_温哥华",
  "科罗拉": "club_科罗拉",
  "奥斯汀": "club_奥斯汀",
  "波特诺": "club_波特诺",
  "亚自由": "club_亚自由",
  "德尔瓦耶": "club_德尔瓦耶",
  "基多体大": "club_基多体大",
  "科金博联": "club_科金博联",
  "天主大学": "club_天主大学",
  "水晶体育": "club_水晶体育",
  "大学体育": "club_大学体育",
  "佩纳罗尔": "club_佩纳罗尔",
  "巴兰基亚": "club_巴兰基亚",
  "托利马": "club_托利马",
  "圣菲独立": "club_圣菲独立",
  "米拉索尔": "club_米拉索尔",
  "时刻准备": "club_时刻准备",
  "中央大学": "club_中央大学",
  "玻利瓦尔": "club_玻利瓦尔",
  "里独立": "club_里独立",
  "索菲亚": "club_索菲亚",
  "贝尔格莱德": "club_贝尔格莱德",
  "brighton": "club_brighton",
  "nott'm forest": "club_nottm_forest",
  "nottingham forest": "club_nottm_forest",
};

const TEAM_DATA = {
  "mexico": { elo: 1820, fifa: 15, title: 0.01, qf: 0.172, semi: 0, confed: "CONCACAF", archetype: "mid-tier" },
  "south africa": { elo: 1660, fifa: 60, title: 0.0001, qf: 0, semi: 0, confed: "CAF", archetype: "athletic-resistance" },
  "korea": { elo: 1805, fifa: 19, title: 0.003, qf: 0, semi: 0, confed: "AFC", archetype: "mid-tier" },
  "south korea": { elo: 1805, fifa: 19, title: 0.003, qf: 0, semi: 0, confed: "AFC", archetype: "mid-tier" },
  "czechia": { elo: 1765, fifa: 41, title: 0.001, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "czech republic": { elo: 1765, fifa: 41, title: 0.001, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "canada": { elo: 1745, fifa: 30, title: 0.001, qf: 0, semi: 0, confed: "CONCACAF", archetype: "mid-tier" },
  "bosnia-herzegovina": { elo: 1740, fifa: 52, title: 0.0005, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "bosnia": { elo: 1740, fifa: 52, title: 0.0005, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "qatar": { elo: 1690, fifa: 35, title: 0.0003, qf: 0, semi: 0, confed: "AFC", archetype: "mid-tier" },
  "spain": { elo: 2090, fifa: 1, title: 0.165, qf: 0.482, semi: 0.339, confed: "UEFA", archetype: "unstable-low-block" },
  "argentina": { elo: 2047, fifa: 2, title: 0.12, qf: 0.458, semi: 0.305, confed: "CONMEBOL", archetype: "elite-finisher" },
  "france": { elo: 2041, fifa: 3, title: 0.15, qf: 0.475, semi: 0.304, confed: "UEFA", archetype: "elite-finisher" },
  "brazil": { elo: 1990, fifa: 5, title: 0.09, qf: 0.386, semi: 0.225, confed: "CONMEBOL", archetype: "unstable-low-block" },
  "scotland": { elo: 1760, fifa: 47, title: 0.0005, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "haiti": { elo: 1550, fifa: 83, title: 0.00001, qf: 0, semi: 0, confed: "CONCACAF", archetype: "athletic-resistance" },
  "england": { elo: 1974, fifa: 4, title: 0.11, qf: 0.421, semi: 0.201, confed: "UEFA", archetype: "high-depth" },
  "colombia": { elo: 1970, fifa: 9, title: 0.035, qf: 0.284, semi: 0, confed: "CONMEBOL", archetype: "mid-tier" },
  "portugal": { elo: 1967, fifa: 6, title: 0.07, qf: 0.352, semi: 0.184, confed: "UEFA", archetype: "unstable-low-block" },
  "netherlands": { elo: 1951, fifa: 7, title: 0.04, qf: 0.315, semi: 0.158, confed: "UEFA", archetype: "high-depth" },
  "germany": { elo: 1940, fifa: 10, title: 0.11, qf: 0.338, semi: 0.142, confed: "UEFA", archetype: "elite-finisher" },
  "morocco": { elo: 1918, fifa: 8, title: 0.015, qf: 0.267, semi: 0, confed: "CAF", archetype: "tactical-resistance" },
  "croatia": { elo: 1895, fifa: 11, title: 0.007, qf: 0.153, semi: 0, confed: "UEFA", archetype: "tactical-resistance" },
  "uruguay": { elo: 1882, fifa: 13, title: 0.008, qf: 0.195, semi: 0, confed: "CONMEBOL", archetype: "unstable-low-block" },
  "switzerland": { elo: 1868, fifa: 14, title: 0.005, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "japan": { elo: 1845, fifa: 15, title: 0.012, qf: 0.185, semi: 0, confed: "AFC", archetype: "tactical-resistance" },
  "senegal": { elo: 1832, fifa: 12, title: 0.004, qf: 0, semi: 0, confed: "CAF", archetype: "athletic-resistance" },
  "iran": { elo: 1818, fifa: 17, title: 0.0015, qf: 0, semi: 0, confed: "AFC", archetype: "athletic-resistance" },
  "ecuador": { elo: 1798, fifa: 20, title: 0.005, qf: 0, semi: 0, confed: "CONMEBOL", archetype: "athletic-resistance" },
  "australia": { elo: 1785, fifa: 21, title: 0.002, qf: 0, semi: 0, confed: "AFC", archetype: "athletic-resistance" },
  "turkiye": { elo: 1790, fifa: 42, title: 0.0015, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "turkey": { elo: 1790, fifa: 42, title: 0.0015, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "paraguay": { elo: 1765, fifa: 64, title: 0.0005, qf: 0, semi: 0, confed: "CONMEBOL", archetype: "athletic-resistance" },
  "austria": { elo: 1780, fifa: 16, title: 0.0015, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "belgium": { elo: 1855, fifa: 9, title: 0.01, qf: 0.243, semi: 0, confed: "UEFA", archetype: "unstable-low-block" },
  "united states": { elo: 1810, fifa: 16, title: 0.009, qf: 0.168, semi: 0, confed: "CONCACAF", archetype: "mid-tier" },
  "usa": { elo: 1810, fifa: 16, title: 0.009, qf: 0.168, semi: 0, confed: "CONCACAF", archetype: "mid-tier" },
  "ghana": { elo: 1690, fifa: 65, title: 0.00015, qf: 0, semi: 0, confed: "CAF", archetype: "athletic-resistance" },
  "panama": { elo: 1660, fifa: 53, title: 0.00001, qf: 0, semi: 0, confed: "CONCACAF", archetype: "athletic-resistance" },
  "uzbekistan": { elo: 1710, fifa: 62, title: 0.00005, qf: 0, semi: 0, confed: "AFC", archetype: "athletic-resistance" },
  "dr congo": { elo: 1680, fifa: 51, title: 0.0002, qf: 0, semi: 0, confed: "CAF", archetype: "athletic-resistance" },
  "congo dr": { elo: 1680, fifa: 51, title: 0.0002, qf: 0, semi: 0, confed: "CAF", archetype: "athletic-resistance" },
  "egypt": { elo: 1760, fifa: 34, title: 0.001, qf: 0, semi: 0, confed: "CAF", archetype: "tactical-resistance" },
  "ivory coast": { elo: 1740, fifa: 44, title: 0.0008, qf: 0, semi: 0, confed: "CAF", archetype: "athletic-resistance" },
  "curacao": { elo: 1500, fifa: 81, title: 0.00001, qf: 0, semi: 0, confed: "CONCACAF", archetype: "athletic-resistance" },
  "sweden": { elo: 1770, fifa: 39, title: 0.001, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "tunisia": { elo: 1720, fifa: 40, title: 0.0005, qf: 0, semi: 0, confed: "CAF", archetype: "tactical-resistance" },
  "new zealand": { elo: 1600, fifa: 95, title: 0.00001, qf: 0, semi: 0, confed: "OFC", archetype: "mid-tier" },
  "saudi arabia": { elo: 1665, fifa: 57, title: 0.0002, qf: 0, semi: 0, confed: "AFC", archetype: "mid-tier" },
  "cape verde": { elo: 1650, fifa: 70, title: 0.00005, qf: 0, semi: 0, confed: "CAF", archetype: "athletic-resistance" },
  "norway": { elo: 1860, fifa: 18, title: 0.006, qf: 0.12, semi: 0, confed: "UEFA", archetype: "high-depth" },
  "iraq": { elo: 1660, fifa: 61, title: 0.00005, qf: 0, semi: 0, confed: "AFC", archetype: "mid-tier" },
  "algeria": { elo: 1725, fifa: 36, title: 0.0006, qf: 0, semi: 0, confed: "CAF", archetype: "tactical-resistance" },
  "jordan": { elo: 1605, fifa: 68, title: 0.00003, qf: 0, semi: 0, confed: "AFC", archetype: "mid-tier" },
  // Finnish league teams (patch)
  "lahti": { elo: 1580, fifa: 200, title: 0, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "tps turku": { elo: 1550, fifa: 210, title: 0, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "kuopio": { elo: 1620, fifa: 180, title: 0, qf: 0, semi: 0, confed: "UEFA", archetype: "athletic-resistance" },
  "vaasa": { elo: 1600, fifa: 190, title: 0, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "ac oulu": { elo: 1540, fifa: 205, title: 0, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "jaro": { elo: 1520, fifa: 215, title: 0, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "inter turku": { elo: 1640, fifa: 170, title: 0, qf: 0, semi: 0, confed: "UEFA", archetype: "athletic-resistance" },
  "seinajoen": { elo: 1560, fifa: 195, title: 0, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "mariehamn": { elo: 1500, fifa: 235, title: 0, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "hjk helsinki": { elo: 1700, fifa: 140, title: 0, qf: 0, semi: 0, confed: "UEFA", archetype: "athletic-resistance" },

  "club_aalesund": { elo: 1291, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_ac__": { elo: 980, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_aik": { elo: 1381, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_ajax": { elo: 1578, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_alaves": { elo: 1635, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_annecy": { elo: 1466, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_arsenal": { elo: 2064, fifa: 999, confed: "UEFA", archetype: "elite-finisher" },
  "club_aston_villa": { elo: 1921, fifa: 999, confed: "UEFA", archetype: "elite-finisher" },
  "club_atalanta": { elo: 1764, fifa: 999, confed: "UEFA", archetype: "high-depth" },
  "club_atletico": { elo: 1828, fifa: 999, confed: "UEFA", archetype: "high-depth" },
  "club_augsburg": { elo: 1636, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_auxerre": { elo: 1624, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_barcelona": { elo: 1952, fifa: 999, confed: "UEFA", archetype: "elite-finisher" },
  "club_bayern": { elo: 2001, fifa: 999, confed: "UEFA", archetype: "elite-finisher" },
  "club_benfica": { elo: 1824, fifa: 999, confed: "UEFA", archetype: "high-depth" },
  "club_betis": { elo: 1747, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_bologna": { elo: 1701, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_bournemouth": { elo: 1872, fifa: 999, confed: "UEFA", archetype: "elite-finisher" },
  "club_braga": { elo: 1699, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_brann": { elo: 1528, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_brentford": { elo: 1837, fifa: 999, confed: "UEFA", archetype: "high-depth" },
  "club_brest": { elo: 1621, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_brommapojkarna": { elo: 1287, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_burnley": { elo: 1666, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_cagliari": { elo: 1594, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_casa_pia": { elo: 1428, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_celta": { elo: 1701, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_chelsea": { elo: 1831, fifa: 999, confed: "UEFA", archetype: "high-depth" },
  "club_como": { elo: 1760, fifa: 999, confed: "UEFA", archetype: "high-depth" },
  "club_cremonese": { elo: 1532, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_crystal_palace": { elo: 1804, fifa: 999, confed: "UEFA", archetype: "high-depth" },
  "club_darmstadt": { elo: 1463, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_degerfors": { elo: 1272, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_dortmund": { elo: 1835, fifa: 999, confed: "UEFA", archetype: "high-depth" },
  "club_duesseldorf": { elo: 1410, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_elche": { elo: 1623, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_elfsborg": { elo: 1388, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_elversberg": { elo: 1523, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_everton": { elo: 1803, fifa: 999, confed: "UEFA", archetype: "high-depth" },
  "club_famalicao": { elo: 1591, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_feyenoord": { elo: 1603, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_fiorentina": { elo: 1670, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_frankfurt": { elo: 1664, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_fredrikstad": { elo: 1413, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_freiburg": { elo: 1725, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_fuerth": { elo: 1395, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_fulham": { elo: 1813, fifa: 999, confed: "UEFA", archetype: "high-depth" },
  "club_gais": { elo: 1387, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_genoa": { elo: 1618, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_getafe": { elo: 1664, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_girona": { elo: 1636, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_groningen": { elo: 1439, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_haecken": { elo: 1383, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_halmstad": { elo: 1272, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_hamburg": { elo: 1602, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_hammarby": { elo: 1508, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_hannover": { elo: 1528, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_heidenheim": { elo: 1553, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_hoffenheim": { elo: 1700, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_inter": { elo: 1889, fifa: 999, confed: "UEFA", archetype: "elite-finisher" },
  "club_juventus": { elo: 1772, fifa: 999, confed: "UEFA", archetype: "high-depth" },
  "club_kalmar": { elo: 1246, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_kfum_oslo": { elo: 1363, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_koeln": { elo: 1568, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_kristiansund": { elo: 1353, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_lazio": { elo: 1703, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_lecce": { elo: 1568, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_leeds": { elo: 1797, fifa: 999, confed: "UEFA", archetype: "high-depth" },
  "club_lens": { elo: 1767, fifa: 999, confed: "UEFA", archetype: "high-depth" },
  "club_levante": { elo: 1639, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_lille": { elo: 1744, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_lillestrom": { elo: 1363, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_liverpool": { elo: 1911, fifa: 999, confed: "UEFA", archetype: "elite-finisher" },
  "club_lyon": { elo: 1732, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_mainz": { elo: 1672, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_mallorca": { elo: 1643, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_man_city": { elo: 1971, fifa: 999, confed: "UEFA", archetype: "elite-finisher" },
  "club_man_united": { elo: 1915, fifa: 999, confed: "UEFA", archetype: "elite-finisher" },
  "club_marseille": { elo: 1717, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_middlesbrough": { elo: 1589, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_milan": { elo: 1750, fifa: 999, confed: "UEFA", archetype: "high-depth" },
  "club_molde": { elo: 1467, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_monaco": { elo: 1718, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_nacional": { elo: 1451, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_napoli": { elo: 1780, fifa: 999, confed: "UEFA", archetype: "high-depth" },
  "club_newcastle": { elo: 1838, fifa: 999, confed: "UEFA", archetype: "high-depth" },
  "club_nice": { elo: 1582, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_nijmegen": { elo: 1532, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_oergryte": { elo: 1257, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_osasuna": { elo: 1650, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_oviedo": { elo: 1558, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_paderborn": { elo: 1525, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_paris_sg": { elo: 1968, fifa: 999, confed: "UEFA", archetype: "elite-finisher" },
  "club_parma": { elo: 1600, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_pisa": { elo: 1456, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_porto": { elo: 1806, fifa: 999, confed: "UEFA", archetype: "high-depth" },
  "club_real_madrid": { elo: 1923, fifa: 999, confed: "UEFA", archetype: "elite-finisher" },
  "club_red_star": { elo: 1441, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_rodez": { elo: 1494, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_roma": { elo: 1793, fifa: 999, confed: "UEFA", archetype: "high-depth" },
  "club_rosenborg": { elo: 1428, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_sandefjord": { elo: 1424, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_sarpsborg": { elo: 1403, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_sassuolo": { elo: 1622, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_sevilla": { elo: 1626, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_sociedad": { elo: 1669, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_southampton": { elo: 1636, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_start": { elo: 1295, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_strasbourg": { elo: 1711, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_stuttgart": { elo: 1764, fifa: 999, confed: "UEFA", archetype: "high-depth" },
  "club_sunderland": { elo: 1736, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_torino": { elo: 1624, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_tottenham": { elo: 1777, fifa: 999, confed: "UEFA", archetype: "high-depth" },
  "club_tps__": { elo: 1020, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_tromso": { elo: 1497, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_udinese": { elo: 1646, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_union_berlin": { elo: 1619, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_utrecht": { elo: 1520, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_valencia": { elo: 1697, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_valerenga": { elo: 1377, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_venezia": { elo: 1599, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_verona": { elo: 1503, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_viking": { elo: 1632, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_villarreal": { elo: 1759, fifa: 999, confed: "UEFA", archetype: "high-depth" },
  "club_werder": { elo: 1606, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_west_ham": { elo: 1769, fifa: 999, confed: "UEFA", archetype: "high-depth" },
  "club_wolfsburg": { elo: 1600, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_wolves": { elo: 1680, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_\u4e1c\u4eacfc": { elo: 1280, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u4e1c\u4eac\u7eff\u8335": { elo: 1180, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u4e2d\u592e\u5927\u5b66": { elo: 1080, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u4e9a\u7279\u8054": { elo: 1350, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u4e9a\u81ea\u7531": { elo: 1300, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u4eac\u90fd": { elo: 1150, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u4ec1\u5ddd\u8054": { elo: 1180, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u4f11\u65af\u987f": { elo: 1220, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u4f69\u7eb3\u7f57\u5c14": { elo: 1300, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u5149\u5ddefc": { elo: 1200, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u5168\u5317\u73b0\u4ee3": { elo: 1380, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u5188\u5c71\u7eff\u96c9": { elo: 1100, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u5229\u96c5\u65b0\u6708": { elo: 1600, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_\u5229\u96c5\u80dc\u5229": { elo: 1550, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_\u5229\u96c5\u9752\u5e74": { elo: 1420, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u5343\u53f6\u5e02\u539f": { elo: 1080, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u534e\u76db\u987f": { elo: 1200, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u535a\u5361": { elo: 1680, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_\u535a\u5fb7\u95ea\u8000": { elo: 1450, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u5409\u8fbe\u56fd\u6c11": { elo: 1480, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u5409\u8fbe\u8054\u5408": { elo: 1520, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_\u540d\u53e4\u5c4b\u9cb8": { elo: 1300, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u54e5\u4f26\u5e03": { elo: 1380, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u54e5\u5fb7\u5821": { elo: 1350, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u56fd\u9645\u56fe\u5c14": { elo: 1050, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u5723\u4f55\u585e": { elo: 1220, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u5723\u4fdd\u7f57": { elo: 1600, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_\u5723\u83f2\u72ec\u7acb": { elo: 1250, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u5766\u5c71\u732b": { elo: 900, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u57c3\u592b\u65af\u5821": { elo: 1300, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u57fa\u591a\u4f53\u5927": { elo: 1250, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u582a\u8428\u65af": { elo: 1200, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u585e\u4f0a\u5948": { elo: 1100, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u590f\u6d1b\u7279fc": { elo: 1420, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u591a\u4f26\u591a": { elo: 1280, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u5927\u5b66\u4f53\u80b2": { elo: 1200, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u5927\u7530": { elo: 1100, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u5927\u90b1": { elo: 1150, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u5927\u962a\u6a31\u82b1": { elo: 1250, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u5927\u962a\u94a2\u5df4": { elo: 1260, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u5929\u4e3b\u5927\u5b66": { elo: 1320, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u5929\u72fc\u661f": { elo: 1250, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u5965\u5170\u591a": { elo: 1280, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u5965\u65af\u6c40": { elo: 1200, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u5bcc\u5dddfc": { elo: 1100, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u5ddd\u5d0e\u524d\u950b": { elo: 1400, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u5df4\u5170\u57fa\u4e9a": { elo: 1280, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u5e03\u8d56\u5408\u4f5c": { elo: 1350, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u5e15\u6885\u62c9\u65af": { elo: 1750, fifa: 999, confed: "UEFA", archetype: "high-depth" },
  "club_\u5e7f\u5c9b\u4e09\u7bad": { elo: 1280, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u5e93\u5965\u76ae\u5965": { elo: 1150, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u5f17\u62c9\u95e8\u6208": { elo: 1720, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_\u5fb7\u5c14\u74e6\u8036": { elo: 1280, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u6258\u5229\u9a6c": { elo: 1220, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u62c9\u52aa\u65af": { elo: 1450, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u62c9\u65af\u51b3\u5fc3": { elo: 1150, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u62c9\u666e\u5927\u5b66": { elo: 1500, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_\u62c9\u8d6b\u8482": { elo: 1000, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u65b0\u672a\u6765sc": { elo: 1280, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u65b0\u6cfb": { elo: 1200, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u65b0\u82f1\u683c\u5170": { elo: 1280, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u65f6\u523b\u51c6\u5907": { elo: 1100, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u660e\u5c3c\u82cf\u8fbe": { elo: 1250, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u672d\u5e4c": { elo: 1220, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u67cf\u592a\u9633\u795e": { elo: 1220, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u6851\u6258\u65af": { elo: 1550, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_\u6a2a\u6ee8\u6c34\u624b": { elo: 1380, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u6c34\u539f": { elo: 1250, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u6c34\u6237\u8700\u8475": { elo: 1050, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u6c34\u6676\u4f53\u80b2": { elo: 1250, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u6c49\u574e": { elo: 1080, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u6cb3\u5e8a": { elo: 1650, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_\u6ce2\u7279\u5170": { elo: 1350, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u6ce2\u7279\u8bfa": { elo: 1350, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u6d1b\u6749\u77f6fc": { elo: 1420, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u6d4e\u5dde": { elo: 1120, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u6d66\u548c\u7ea2\u94bb": { elo: 1350, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u6d66\u9879\u5236\u94c1": { elo: 1280, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u6d77\u4e8e\u683c\u677e": { elo: 1120, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u6e05\u6c34\u9f13\u52a8": { elo: 1200, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u6e29\u54e5\u534e": { elo: 1220, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u72ec\u7acb": { elo: 1420, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u739b\u4e3d\u6e2f": { elo: 950, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u73bb\u5229\u74e6\u5c14": { elo: 1300, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u74e6\u8428": { elo: 1000, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u753a\u7530\u6cfd\u7ef4": { elo: 1120, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u76d0\u6e56\u57ce": { elo: 1300, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u795e\u6237\u80dc\u5229": { elo: 1450, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u798f\u5188": { elo: 1180, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u79d1\u5c14\u591a\u74e6": { elo: 1250, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u79d1\u6797\u8482\u5b89": { elo: 1620, fifa: 999, confed: "UEFA", archetype: "mid-tier" },
  "club_\u79d1\u7f57\u62c9": { elo: 1250, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u79d1\u91d1\u535a\u8054": { elo: 1180, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u7ade\u6280": { elo: 1480, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u7c73\u4e9a\u5c14\u6bd4": { elo: 1200, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u7c73\u62c9\u7d22\u5c14": { elo: 1150, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u7d22\u83f2\u4e9a": { elo: 1250, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u7eb3\u4ec0\u7ef4\u5c14": { elo: 1280, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u7ebd\u7ef4\u5c14": { elo: 1350, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u7f57\u8428\u91cc\u5965": { elo: 1420, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u80e1\u5df4\u5361\u5fb7": { elo: 1200, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u829d\u52a0\u54e5": { elo: 1180, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u8428\u65af\u83f2": { elo: 1380, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u8499\u7279\u5229\u5c14": { elo: 1250, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u851a\u5c71\u73b0\u4ee3": { elo: 1420, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u897f\u96c5\u56fe": { elo: 1400, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u8d1d\u5c14\u683c\u83b1\u5fb7": { elo: 1300, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u8d39\u57ce": { elo: 1300, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u8d6b\u5c14\u8f9b\u57fa": { elo: 1247, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u8f9b\u8f9b\u90a3\u63d0": { elo: 1320, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u8fbe\u62c9\u65af": { elo: 1250, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u8fbe\u66fc\u534f\u5b9a": { elo: 1360, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u8fbe\u9a6c\u514b": { elo: 1300, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u8fc8\u5b63\u5bbd\u5e7f": { elo: 1250, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u91cc\u72ec\u7acb": { elo: 1320, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u91d1\u6cc9": { elo: 1080, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u963f\u6839\u5ef7\u9752\u5e74": { elo: 1300, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u96c5\u7f57": { elo: 950, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u97e6\u65af\u7279\u7f57": { elo: 1150, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u9996\u5c14fc": { elo: 1320, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u9a6c\u5c14\u9ed8": { elo: 1250, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u9e1f\u6816": { elo: 1150, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
  "club_\u9e7f\u5c9b\u9e7f\u89d2": { elo: 1330, fifa: 999, confed: "UEFA", archetype: "athletic-resistance" },
};

const S_FINISHERS = new Set(["france", "argentina", "germany"]);
const HIGH_DEPTH_FAVORITES = new Set(["england", "netherlands", "norway"]);
const UNSTABLE_LOW_BLOCK_FAVORITES = new Set(["portugal", "spain", "belgium", "uruguay"]);
// P7: physical-resistance split into athletic (raw physicality) and tactical (discipline/organisation)
const ATHLETIC_RESISTANCE = new Set(["dr congo", "congo dr", "senegal", "ivory coast", "panama"]);
const TACTICAL_RESISTANCE = new Set(["morocco", "croatia", "egypt", "japan"]);
const AGING_DEFENSE_TEAMS = new Set(["croatia"]);


  // Phase 2: missing PL teams
const GROUP_DATA = {
  "mexico": { group: "A", first: 0.478, second: 0.25, third: 0.092, qualify: 0.82 },
  "korea": { group: "A", first: 0.22, second: 0.30, third: 0.15, qualify: 0.67 },
  "south korea": { group: "A", first: 0.22, second: 0.30, third: 0.15, qualify: 0.67 },
  "czechia": { group: "A", first: 0.15, second: 0.20, third: 0.20, qualify: 0.55 },
  "czech republic": { group: "A", first: 0.15, second: 0.20, third: 0.20, qualify: 0.55 },
  "south africa": { group: "A", first: 0.05, second: 0.10, third: 0.18, qualify: 0.33 },
  "switzerland": { group: "B", first: 0.40, second: 0.28, third: 0.12, qualify: 0.78 },
  "canada": { group: "B", first: 0.18, second: 0.22, third: 0.15, qualify: 0.55 },
  "bosnia-herzegovina": { group: "B", first: 0.15, second: 0.20, third: 0.18, qualify: 0.53 },
  "bosnia": { group: "B", first: 0.15, second: 0.20, third: 0.18, qualify: 0.53 },
  "qatar": { group: "B", first: 0.08, second: 0.12, third: 0.15, qualify: 0.35 },
  "brazil": { group: "C", first: 0.602, second: 0.25, third: 0.08, qualify: 0.92 },
  "morocco": { group: "C", first: 0.286, second: 0.45, third: 0.151, qualify: 0.887 },
  "scotland": { group: "C", first: 0.098, second: 0.22, third: 0.28, qualify: 0.60 },
  "haiti": { group: "C", first: 0.011, second: 0.03, third: 0.15, qualify: 0.19 },
  "united states": { group: "D", first: 0.328, second: 0.28, third: 0.15, qualify: 0.75 },
  "usa": { group: "D", first: 0.328, second: 0.28, third: 0.15, qualify: 0.75 },
  "australia": { group: "D", first: 0.179, second: 0.25, third: 0.18, qualify: 0.61 },
  "turkiye": { group: "D", first: 0.20, second: 0.22, third: 0.16, qualify: 0.58 },
  "turkey": { group: "D", first: 0.20, second: 0.22, third: 0.16, qualify: 0.58 },
  "paraguay": { group: "D", first: 0.08, second: 0.10, third: 0.15, qualify: 0.33 },
  "germany": { group: "E", first: 0.69, second: 0.25, third: 0.04, qualify: 0.994 },
  "ecuador": { group: "E", first: 0.20, second: 0.45, third: 0.18, qualify: 0.83 },
  "ivory coast": { group: "E", first: 0.08, second: 0.15, third: 0.25, qualify: 0.48 },
  "curacao": { group: "E", first: 0.01, second: 0.03, third: 0.10, qualify: 0.14 },
  "netherlands": { group: "F", first: 0.55, second: 0.20, third: 0.12, qualify: 0.87 },
  "japan": { group: "F", first: 0.25, second: 0.30, third: 0.18, qualify: 0.73 },
  "sweden": { group: "F", first: 0.10, second: 0.22, third: 0.28, qualify: 0.60 },
  "tunisia": { group: "F", first: 0.05, second: 0.10, third: 0.18, qualify: 0.33 },
  "belgium": { group: "G", first: 0.45, second: 0.28, third: 0.12, qualify: 0.85 },
  "egypt": { group: "G", first: 0.20, second: 0.22, third: 0.18, qualify: 0.60 },
  "iran": { group: "G", first: 0.15, second: 0.20, third: 0.18, qualify: 0.53 },
  "new zealand": { group: "G", first: 0.05, second: 0.08, third: 0.12, qualify: 0.25 },
  "spain": { group: "H", first: 0.753, second: 0.18, third: 0.04, qualify: 0.973 },
  "uruguay": { group: "H", first: 0.18, second: 0.50, third: 0.17, qualify: 0.85 },
  "saudi arabia": { group: "H", first: 0.05, second: 0.15, third: 0.22, qualify: 0.42 },
  "cape verde": { group: "H", first: 0.02, second: 0.05, third: 0.15, qualify: 0.22 },
  "france": { group: "I", first: 0.603, second: 0.22, third: 0.08, qualify: 0.903 },
  "senegal": { group: "I", first: 0.15, second: 0.28, third: 0.22, qualify: 0.65 },
  "norway": { group: "I", first: 0.12, second: 0.20, third: 0.23, qualify: 0.55 },
  "iraq": { group: "I", first: 0.03, second: 0.05, third: 0.12, qualify: 0.20 },
  "argentina": { group: "J", first: 0.73, second: 0.18, third: 0.05, qualify: 0.96 },
  "austria": { group: "J", first: 0.12, second: 0.30, third: 0.23, qualify: 0.65 },
  "algeria": { group: "J", first: 0.08, second: 0.15, third: 0.22, qualify: 0.45 },
  "jordan": { group: "J", first: 0.03, second: 0.10, third: 0.18, qualify: 0.31 },
  "portugal": { group: "K", first: 0.736, second: 0.20, third: 0.041, qualify: 0.977 },
  "colombia": { group: "K", first: 0.18, second: 0.38, third: 0.22, qualify: 0.78 },
  "uzbekistan": { group: "K", first: 0.05, second: 0.12, third: 0.25, qualify: 0.42 },
  "dr congo": { group: "K", first: 0.02, second: 0.05, third: 0.15, qualify: 0.22 },
  "congo dr": { group: "K", first: 0.02, second: 0.05, third: 0.15, qualify: 0.22 },
  "england": { group: "L", first: 0.679, second: 0.18, third: 0.06, qualify: 0.919 },
  "croatia": { group: "L", first: 0.15, second: 0.38, third: 0.27, qualify: 0.80 },
  "ghana": { group: "L", first: 0.07, second: 0.15, third: 0.22, qualify: 0.44 },
  "panama": { group: "L", first: 0.03, second: 0.08, third: 0.15, qualify: 0.26 },
};

// V4.0: xG database — WC 2018 (StatsBomb) + WC 2022 (FBref), blended 30/70
const XG_DATABASE = {"argentina":{"xg":1.945,"xga":0.898,"n":11},"australia":{"xg":0.872,"xga":1.382,"n":7},"belgium":{"xg":1.326,"xga":1.025,"n":10},"brazil":{"xg":2.105,"xga":0.553,"n":10},"cameroon":{"xg":0.7,"xga":1.03,"n":3},"canada":{"xg":1.05,"xga":1.72,"n":3},"colombia":{"xg":1.819,"xga":2.502,"n":4},"costa rica":{"xg":0.416,"xga":2.429,"n":6},"croatia":{"xg":1.551,"xga":1.283,"n":14},"denmark":{"xg":1.122,"xga":1.316,"n":7},"ecuador":{"xg":0.66,"xga":0.82,"n":3},"egypt":{"xg":0.997,"xga":1.825,"n":3},"england":{"xg":2.158,"xga":1.000,"n":12},"france":{"xg":1.699,"xga":0.857,"n":14},"germany":{"xg":1.788,"xga":0.933,"n":6},"ghana":{"xg":1.21,"xga":1.53,"n":3},"iceland":{"xg":1.576,"xga":1.351,"n":3},"iran":{"xg":0.831,"xga":1.787,"n":6},"japan":{"xg":0.932,"xga":1.102,"n":8},"mexico":{"xg":0.890,"xga":1.625,"n":7},"morocco":{"xg":0.926,"xga":0.946,"n":10},"netherlands":{"xg":1.45,"xga":0.54,"n":5},"nigeria":{"xg":1.128,"xga":1.363,"n":3},"panama":{"xg":0.799,"xga":2.417,"n":3},"peru":{"xg":0.958,"xga":1.539,"n":3},"poland":{"xg":0.873,"xga":1.112,"n":7},"portugal":{"xg":1.322,"xga":0.919,"n":9},"qatar":{"xg":0.29,"xga":1.72,"n":3},"russia":{"xg":2.419,"xga":3.103,"n":5},"saudi arabia":{"xg":0.792,"xga":1.297,"n":6},"senegal":{"xg":0.919,"xga":1.119,"n":7},"serbia":{"xg":1.423,"xga":1.317,"n":6},"south korea":{"xg":0.876,"xga":1.865,"n":7},"spain":{"xg":2.277,"xga":0.893,"n":8},"sweden":{"xg":1.469,"xga":0.927,"n":5},"switzerland":{"xg":0.900,"xga":1.035,"n":8},"tunisia":{"xg":0.808,"xga":1.333,"n":6},"united states":{"xg":0.8,"xga":0.93,"n":4},"uruguay":{"xg":0.981,"xga":0.898,"n":8},"wales":{"xg":0.46,"xga":0.97,"n":3}};
const XG_GLOBAL_AVG = 1.25; // WC average xG per match per team

function getXGStrength(teamKey) {
  const data = XG_DATABASE[teamKey];
  if (!data || data.n < 2) return null;
  // Dirichlet-style pseudocount shrinkage: pull small samples toward global mean
  // shrinkage = n0/(n0 + n) — with n0=8, a team with n=3 gets ~27% weight from prior
  const n0 = 8;
  const shrinkage = n0 / (n0 + data.n);
  const shrunk_xg = data.xg * (1 - shrinkage) + XG_GLOBAL_AVG * shrinkage;
  const shrunk_xga = data.xga * (1 - shrinkage) + XG_GLOBAL_AVG * shrinkage;
  return {
    xg_z: (shrunk_xg - XG_GLOBAL_AVG) / 0.5,
    xga_z: (XG_GLOBAL_AVG - shrunk_xga) / 0.5,
    samples: data.n,
    shrinkage: +shrinkage.toFixed(3),
  };
}

const PROFILES = {
  default: { n: 0.67, l: 0.23, c: 0.10 },
  "elite-finisher": { n: 0.62, l: 0.20, c: 0.18 },
  "defensive-favorite": { n: 0.60, l: 0.30, c: 0.10 },
  balanced: { n: 0.58, l: 0.27, c: 0.15 },
};

// ===== P1: Opponent Interaction Matrix (archetype × archetype → Δwin_pp, Δdraw_pp) =====
const INTERACTION_MATRIX = {
  "S-finisher": {
    "S-finisher": [0, 0], "high-depth": [0.02, -0.03], "unstable-low-block": [-0.04, 0.05],
    "athletic-resistance": [-0.03, 0.05], "tactical-resistance": [-0.01, 0.03], "mid-tier": [0.04, -0.03],
  },
  "high-depth": {
    "S-finisher": [-0.03, 0.02], "high-depth": [0.01, -0.01], "unstable-low-block": [-0.05, 0.06],
    "athletic-resistance": [0.01, 0.04], "tactical-resistance": [0.03, 0.02], "mid-tier": [0.03, -0.02],
  },
  "unstable-low-block": {
    "S-finisher": [-0.06, 0.05], "high-depth": [-0.04, 0.04], "unstable-low-block": [0, 0.02],
    "athletic-resistance": [-0.04, 0.07], "tactical-resistance": [-0.03, 0.05], "mid-tier": [0.02, -0.02],
  },
  "athletic-resistance": {
    "S-finisher": [-0.06, 0.07], "high-depth": [-0.05, 0.06], "unstable-low-block": [-0.04, 0.06],
    "athletic-resistance": [0.01, 0.04], "tactical-resistance": [0.01, 0.02], "mid-tier": [-0.03, 0.05],
  },
  "tactical-resistance": {
    "S-finisher": [-0.04, 0.05], "high-depth": [-0.03, 0.04], "unstable-low-block": [-0.03, 0.05],
    "athletic-resistance": [-0.01, 0.03], "tactical-resistance": [0, 0.03], "mid-tier": [-0.01, 0.03],
  },
  "mid-tier": {
    "S-finisher": [-0.06, 0.04], "high-depth": [-0.05, 0.03], "unstable-low-block": [-0.03, 0.04],
    "athletic-resistance": [-0.03, 0.06], "tactical-resistance": [-0.02, 0.04], "mid-tier": [0, 0.01],
  },
};

// ===== P6: Empirical Calibration Bins (2018+2022, Brier 0.198, ECE 3.2pp) =====
const CALIBRATION_BINS = [
  [0.00, 0.10, 2.9], [0.10, 0.20, -0.7], [0.20, 0.30, 0], [0.30, 0.40, 1.8],
  [0.40, 0.50, -3.3], [0.50, 0.60, 7.5], [0.60, 0.70, 1.7], [0.70, 0.80, 0],
  [0.80, 0.90, 15.0], [0.90, 1.00, 5.0],
];

// P6 calibration bins ... (continued below)

// ===== P8: Match stage multipliers =====
const STAGE_MULTIPLIERS = {
  group:         { penalty: 1.00, surge: 1.00 },
  round_of_32:   { penalty: 1.10, surge: 0.90 },
  round_of_16:   { penalty: 1.15, surge: 0.85 },
  quarter:       { penalty: 1.20, surge: 0.82 },
  semi:          { penalty: 1.25, surge: 0.80 },
  final:         { penalty: 1.25, surge: 0.80 },
};

// ===== P9: Group-stage round-3 motivation modifiers =====
const MOTIVATION_MODIFIERS = {
  neutral:            { lambdaScale: 1.00, penaltyScale: 1.00 },
  already_qualified:  { lambdaScale: 0.88, penaltyScale: 0.70 },
  must_win:           { lambdaScale: 1.08, penaltyScale: 0.60 },
  draw_enough:        { lambdaScale: 0.90, penaltyScale: 1.35 },
};

const CRS_KEYS = [
  ["s01s00", 1, 0], ["s02s00", 2, 0], ["s02s01", 2, 1], ["s03s00", 3, 0],
  ["s03s01", 3, 1], ["s03s02", 3, 2], ["s04s00", 4, 0], ["s04s01", 4, 1],
  ["s04s02", 4, 2], ["s05s00", 5, 0], ["s05s01", 5, 1], ["s05s02", 5, 2],
  ["s00s00", 0, 0], ["s01s01", 1, 1], ["s02s02", 2, 2], ["s03s03", 3, 3],
  ["s00s01", 0, 1], ["s00s02", 0, 2], ["s01s02", 1, 2], ["s00s03", 0, 3],
  ["s01s03", 1, 3], ["s02s03", 2, 3], ["s00s04", 0, 4], ["s01s04", 1, 4],
  ["s02s04", 2, 4], ["s00s05", 0, 5], ["s01s05", 1, 5], ["s02s05", 2, 5],
];

// ===== Phase 2.2: In-Play Dynamic Poisson Engine =====

function decayLambda(lambdaFull, minutesPlayed, totalMinutes = 90) {
  // Non-linear time decay with injury-time tail boost (Weibull-like)
  const remaining = Math.max(1, totalMinutes - minutesPlayed);
  const linear = lambdaFull * (remaining / totalMinutes);
  // Tail boost: last 15 minutes have ~1.3x effective scoring rate
  const tailBoost = remaining <= 15 ? 1 + 0.3 * ((15 - remaining) / 15) : 1.0;
  // First 5 minutes also slightly suppressed (teams settling)
  const earlySuppress = minutesPlayed < 5 ? 0.85 : 1.0;
  return linear * tailBoost * earlySuppress;
}

function buildInPlayScoreMatrix(lambdaHomeFull, lambdaAwayFull, currentH, currentA, minutesPlayed, profileName, maxGoals = 5) {
  // Truncated score matrix for remaining time
  const profile = PROFILES[profileName] || PROFILES.default;
  const lambdaH_rem = decayLambda(lambdaHomeFull, minutesPlayed);
  const lambdaA_rem = decayLambda(lambdaAwayFull, minutesPlayed);
  const scores = [];
  let total = 0;
  const homeFav = lambdaH_rem >= lambdaA_rem;
  const states = [
    { weight: profile.n, h: lambdaH_rem, a: lambdaA_rem },
    { weight: profile.l, h: 0.82 * lambdaH_rem, a: 0.82 * lambdaA_rem },
    { weight: profile.c, h: homeFav ? 1.35 * lambdaH_rem : 0.90 * lambdaH_rem, a: homeFav ? 0.90 * lambdaA_rem : 1.35 * lambdaA_rem },
  ];
  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      const prob = states.reduce((sum, s) => sum + s.weight * poisson(h, s.h) * poisson(a, s.a), 0);
      // Truncate: can't score fewer than current score (if any)
      const finalH = currentH + h;
      const finalA = currentA + a;
      scores.push({ h: finalH, a: finalA, prob });
      total += prob;
    }
  }
  return scores.map(s => ({ ...s, prob: s.prob / (total || 1) }));
}

export function buildInPlayModel({ match = {}, research = null, controls = {}, drawState = {}, inPlay = {} }) {
  // inPlay: { minutesPlayed, currentH, currentA }
  const minutesPlayed = Number(inPlay.minutesPlayed) || 0;
  const currentH = Number(inPlay.currentH) || 0;
  const currentA = Number(inPlay.currentA) || 0;

  // Use the full pre-match model to get base lambdas and profile
  const preModel = buildFullV32Model({ match, research, controls, drawState });
  const baseLambdas = preModel.model.meta.lambdas || { home: 1.3, away: 1.0 };
  const profile = preModel.model.meta.profile || "default";
  const tempoFactor = preModel.model.meta.tempo === "slow" ? 0.9 : preModel.model.meta.tempo === "open" ? 1.08 : 1;

  const lambdaHomeFull = baseLambdas.home * tempoFactor;
  const lambdaAwayFull = baseLambdas.away * tempoFactor;
  const lambdaH_rem = decayLambda(lambdaHomeFull, minutesPlayed);
  const lambdaA_rem = decayLambda(lambdaAwayFull, minutesPlayed);

  const scores = buildInPlayScoreMatrix(lambdaHomeFull, lambdaAwayFull, currentH, currentA, minutesPlayed, profile);
  const states = sumStates(scores);

  return {
    ok: true,
    modelVersion: "World Cup V3.3 r6 In-Play",
    inPlay: {
      minutesPlayed,
      currentScore: { h: currentH, a: currentA },
      lambdaRemaining: { home: +lambdaH_rem.toFixed(4), away: +lambdaA_rem.toFixed(4) },
      lambdaFull: { home: +lambdaHomeFull.toFixed(2), away: +lambdaAwayFull.toFixed(2) },
      decayFactor: +(minutesPlayed > 0 ? lambdaH_rem / lambdaHomeFull : 1).toFixed(3),
    },
    states,
    nextGoalProb: {
      home: scores.filter(s => s.h > currentH && s.a === currentA).reduce((sum, s) => sum + s.prob, 0),
      away: scores.filter(s => s.a > currentA && s.h === currentH).reduce((sum, s) => sum + s.prob, 0),
      noGoal: scores.filter(s => s.h === currentH && s.a === currentA).reduce((sum, s) => sum + s.prob, 0),
    },
    // Upcoming events in 5-min windows
    window5min: buildTimeWindow(scores, currentH, currentA, minutesPlayed, 5),
    window10min: buildTimeWindow(scores, currentH, currentA, minutesPlayed, 10),
    window20min: buildTimeWindow(scores, currentH, currentA, minutesPlayed, 20),
  };
}

function buildTimeWindow(scores, currentH, currentA, minutesPlayed, windowMin) {
  // Approximate: scale remaining score probabilities by window ratio
  const remaining = Math.max(1, 90 - minutesPlayed);
  const ratio = Math.min(1, windowMin / remaining);
  // Return WDL for the time window
  const win = scores.filter(s => s.h > s.a).reduce((sum, s) => sum + s.prob * ratio, 0);
  const draw = scores.filter(s => s.h === s.a).reduce((sum, s) => sum + s.prob, 0);
  const loss = scores.filter(s => s.h < s.a).reduce((sum, s) => sum + s.prob * ratio, 0);
  return { win: +win.toFixed(4), draw: +draw.toFixed(4), loss: +(1 - win - draw).toFixed(4) };
}

export function buildFullV32Model({ match = {}, research = null, controls = {}, drawState = {} }) {
  const homeKey = normalizeTeam(match.home || match.homeShort || "");
  const awayKey = normalizeTeam(match.away || match.awayShort || "");
  const home = teamProfile(homeKey);
  const away = teamProfile(awayKey);
  const market = marketFullTimeProbabilities(match);
  const text = researchText(research);
  const matchStage = controls.matchStage || "group";
  const motivation = controls.motivation || "neutral";
  const stageMul = STAGE_MULTIPLIERS[matchStage] || STAGE_MULTIPLIERS.group;
  const motivMod = MOTIVATION_MODIFIERS[motivation] || MOTIVATION_MODIFIERS.neutral;
  const signals = extractSignals(text, homeKey, awayKey, market, stageMul, motivMod);
  // Phase 1.1: LLM/Research penalty feedback — modify lambda from structured research parsing
  const researchPenalty = parseResearchPenalty(research);
  signals.researchPenalty = researchPenalty;
  const strength = buildStrength(home, away, market, signals);
  const sij = getEffectiveStrength(strength.home) - getEffectiveStrength(strength.away);
  const p0 = buildP0({ home, away, market, sij, signals });
  const correction = buildCorrections({ p0, sij, home, away, signals, controls, drawState });
  const profile = chooseProfile({ controls, home, away, p0, signals });
  const deltaElo = (home.elo || 1700) - (away.elo || 1700);
  const lambdas = chooseLambdas({ sij, p0, controls, signals, motivMod, profileName: profile, deltaElo });
  const tempo = chooseTempo({ controls, signals });
  const tempoFactor = tempo === "slow" ? 0.9 : tempo === "open" ? 1.08 : 1;
  // V4.0: compute dispersion from archetypes + stage
  const dispR = getDispersion(home, away, matchStage);

  // V4.0 Market-Implied Calibration (Cross-Market Arbitrage)
  // Calibrate λ to HHAD (efficient market), then compute HAD (target market)
  // Only activates when HHAD pool is available in match data
  let calibration = null;
  const hhadPool = match?.pools?.hhad || [];
  const handicap = Number(match?.hhadGoalLine ?? 0);
  if (hhadPool.length === 3) {
    const marketHHAD = hhadPool.map(item => item.odds);
    calibration = calibrateLambda(
      lambdas.home * tempoFactor, lambdas.away * tempoFactor,
      profile, handicap, marketHHAD, dispR, 0.18, 0.012
    );
    if (calibration.fitted) {
      lambdas.home = calibration.lambdaH / tempoFactor;
      lambdas.away = calibration.lambdaA / tempoFactor;
    }
  }

  // V4.0: Dynamic Copula ρ — decreases when Elo gap is large
  // Strong teams don't need "coupling" to weak teams; ρ → 0 for mismatches
  const dynCopulaRho = Math.abs(deltaElo) > 300 ? 0.06
    : Math.abs(deltaElo) > 200 ? 0.10
    : Math.abs(deltaElo) > 100 ? 0.14
    : 0.18;
  // DC: knockout 0.12 (amplify 0-0/1-1), group 0.03 (catch matchday-3 collusion draws)
  const dcRho = matchStage === "knockout" ? 0.12 : 0.03;
  const scores = buildScoreMatrix(
    lambdas.home * tempoFactor, lambdas.away * tempoFactor, profile,
    { r: dispR, rho: dcRho, copulaRho: dynCopulaRho, dcRho }
  );
  const states = sumStates(scores);
  const byPlay = buildPlayProbabilities(scores, match, profile, tempoFactor, lambdas, signals, dispR);

  // r6: circuit breaker — upper bound protection for favorites
  // fav_win ≥ max(base_win − 8pp, 40%) prevents probability inversion
  // e.g. Belgium's win rate cannot be pushed below 40% or below P0−8pp
  const baseWin = p0.h >= p0.a ? p0.h : p0.a;
  const baseFavSide = p0.h >= p0.a ? "h" : "a";
  const favWinFromMatrix = baseFavSide === "h" ? states.h : states.a;
  const floorWin = Math.max(baseWin - 0.08, 0.40);
  let circuitBreakerFired = false;
  let finalStates = states;
  if (favWinFromMatrix < floorWin && signals.interactionLambdaMultipliers?.favorite < 0.94) {
    // λ multipliers pushed the favorite too far — clamp states to floor
    const dogSide = baseFavSide === "h" ? "a" : "h";
    const dogWinFromMatrix = baseFavSide === "h" ? states.a : states.h;
    const drawFromMatrix = states.d;
    const excessDraw = floorWin - favWinFromMatrix;
    finalStates = normalizeWdl({
      h: baseFavSide === "h" ? floorWin : dogWinFromMatrix - excessDraw * 0.5,
      d: drawFromMatrix - excessDraw * 0.3,
      a: baseFavSide === "a" ? floorWin : dogWinFromMatrix - excessDraw * 0.5,
    });
    circuitBreakerFired = true;
  }
  byPlay.had = finalStates;

  const empiricalPreview = calibrateWdlBins(states);
  const empiricalWdl = {
    ...empiricalPreview,
    applied: false,
    note: "Preview only. V3.3 r5 keeps WDL, handicap, total goals and HT/FT lambda-consistent from the same Poisson matrix.",
  };

  const finalGrade = gradeMatch(finalStates, correction.dataCompleteness);

  return {
    ok: true,
    modelVersion: "World Cup V4.0-a4 (Market-Implied Calibration)",
    model: {
      scores,
      states: finalStates,
      byPlay,
      meta: {
        source: "skill-imported-v33-review-adjusted-r5",
        home: { key: homeKey, ...home },
        away: { key: awayKey, ...away },
        layers: {
          p0,
          correction,
          strength,
          market,
          signals,
        },
        lambdas: { home: lambdas.home * tempoFactor, away: lambdas.away * tempoFactor },
        profile,
        tempo,
        grade: finalGrade,
        r6CircuitBreaker: { fired: circuitBreakerFired, floorWin, baseWin, matrixWin: favWinFromMatrix },
        matchStage,
        motivation,
        stageMultipliers: stageMul,
        motivationModifiers: motivMod,
        empiricalCalibration: empiricalWdl,
        references: [
          "model/world-cup-v32/references/model-core.md",
          "model/world-cup-v32/references/pdf-baselines.md",
          "model/world-cup-v32/references/groups-and-matches.md",
          "model/world-cup-v32/references/environment-and-upsets.md",
          "model/world-cup-v32/references/dynamic-review-and-calibration.md",
          "model/world-cup-v32/references/v33-review-adjustments.md",
          "model/world-cup-v32/scripts/world_cup_v32_helpers.py",
        ],
        notes: buildNotes({ home, away, p0, correction, signals, profile, tempo }),
      },
    },
  };
}

// ===== P6: Empirical calibration from 2018+2022 bins =====
function calibrateWdlBins(states) {
  const win = empiricalCalibrate(states.h);
  const draw = empiricalCalibrate(states.d);
  const loss = empiricalCalibrate(states.a);
  const total = win.calibrated + draw.calibrated + loss.calibrated;
  return {
    preCalibration: { h: states.h, d: states.d, a: states.a },
    calibrated: normalizeWdl({
      h: win.calibrated / total,
      d: draw.calibrated / total,
      a: loss.calibrated / total,
    }),
    detail: {
      win: { raw: win.raw, calibrated: win.calibrated, bin: win.bin, biasPp: win.biasPp },
      draw: { raw: draw.raw, calibrated: draw.calibrated, bin: draw.bin, biasPp: draw.biasPp },
      loss: { raw: loss.raw, calibrated: loss.calibrated, bin: loss.bin, biasPp: loss.biasPp },
    },
  };
}

function empiricalCalibrate(p) {
  for (const [lo, hi, bias] of CALIBRATION_BINS) {
    if (p >= lo && p < hi) {
      return {
        raw: p,
        calibrated: clamp(p + bias / 100, 0, 1),
        bin: `${(lo * 100).toFixed(0)}–${(hi * 100).toFixed(0)}%`,
        biasPp: bias,
      };
    }
    if (hi >= 1 && p >= lo) {
      return {
        raw: p,
        calibrated: clamp(p + bias / 100, 0, 1),
        bin: `${(lo * 100).toFixed(0)}–${(hi * 100).toFixed(0)}%`,
        biasPp: bias,
      };
    }
  }
  return { raw: p, calibrated: p, bin: "out-of-range", biasPp: 0 };
}

function normalizeTeam(name) {
  const raw = String(name || "").trim();
  const aliasText = raw
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[()（）·.]/g, "")
    .trim();
  const compactAlias = aliasText.replace(/\s+/g, "");
  const aliases = [
    ["mexico", ["mexico", "墨西哥"]],
    ["south africa", ["southafrica", "南非"]],
    ["korea", ["korea", "southkorea", "韩国", "韓國"]],
    ["czechia", ["czechia", "czechrepublic", "捷克"]],
    ["switzerland", ["switzerland", "瑞士"]],
    ["canada", ["canada", "加拿大"]],
    ["bosnia-herzegovina", ["bosniaherzegovina", "bosnia", "波黑", "波斯尼亚"]],
    ["qatar", ["qatar", "卡塔尔"]],
    ["brazil", ["brazil", "巴西"]],
    ["morocco", ["morocco", "摩洛哥"]],
    ["scotland", ["scotland", "苏格兰", "蘇格蘭"]],
    ["haiti", ["haiti", "海地"]],
    ["united states", ["unitedstates", "usa", "usmnt", "美国", "美國"]],
    ["australia", ["australia", "澳大利亚", "澳洲"]],
    ["turkiye", ["turkiye", "turkey", "土耳其"]],
    ["paraguay", ["paraguay", "巴拉圭"]],
    ["germany", ["germany", "德国", "德國"]],
    ["ecuador", ["ecuador", "厄瓜多尔", "厄瓜多爾"]],
    ["ivory coast", ["ivorycoast", "cotedivoire", "côtedivoire", "科特迪瓦"]],
    ["curacao", ["curacao", "curaçao", "库拉索", "庫拉索"]],
    ["netherlands", ["netherlands", "holland", "荷兰", "荷蘭"]],
    ["japan", ["japan", "日本"]],
    ["sweden", ["sweden", "瑞典"]],
    ["tunisia", ["tunisia", "突尼斯"]],
    ["belgium", ["belgium", "比利时", "比利時"]],
    ["egypt", ["egypt", "埃及"]],
    ["iran", ["iran", "伊朗"]],
    ["new zealand", ["newzealand", "新西兰", "紐西蘭"]],
    ["spain", ["spain", "西班牙"]],
    ["uruguay", ["uruguay", "乌拉圭", "烏拉圭"]],
    ["saudi arabia", ["saudiarabia", "沙特阿拉伯", "沙特"]],
    ["cape verde", ["capeverde", "佛得角"]],
    ["france", ["france", "法国", "法國"]],
    ["senegal", ["senegal", "塞内加尔", "塞內加爾"]],
    ["norway", ["norway", "挪威"]],
    ["iraq", ["iraq", "伊拉克"]],
    ["argentina", ["argentina", "阿根廷"]],
    ["austria", ["austria", "奥地利", "奧地利"]],
    ["algeria", ["algeria", "阿尔及利亚", "阿爾及利亞"]],
    ["jordan", ["jordan", "约旦", "約旦"]],
    ["portugal", ["portugal", "葡萄牙"]],
    ["colombia", ["colombia", "哥伦比亚", "哥倫比亞"]],
    ["uzbekistan", ["uzbekistan", "乌兹别克斯坦", "烏茲別克斯坦"]],
    ["dr congo", ["drcongo", "congodr", "drc", "刚果金", "刚果民主共和国", "刚果"]],
    ["england", ["england", "英格兰", "英格蘭"]],
    ["croatia", ["croatia", "克罗地亚", "克羅地亞"]],
    ["ghana", ["ghana", "加纳", "迦納"]],
    ["panama", ["panama", "巴拿马", "巴拿馬"]],
  ];
  const aliasHit = aliases.find(([, names]) => names.includes(compactAlias) || names.includes(aliasText));
  if (aliasHit) return aliasHit[0];
  const text = String(name || "").toLowerCase();
  if (/葡萄牙|portugal/.test(text)) return "portugal";
  if (/刚果|剛果|dr congo|congo dr|drc/.test(text)) return "dr congo";
  if (/英格兰|英格蘭|england/.test(text)) return "england";
  if (/克罗地亚|克羅地亞|croatia/.test(text)) return "croatia";
  if (/加纳|迦納|ghana/.test(text)) return "ghana";
  if (/巴拿马|巴拿馬|panama/.test(text)) return "panama";
  if (/乌兹别克|烏茲別克|uzbekistan/.test(text)) return "uzbekistan";
  if (/哥伦比亚|哥倫比亞|colombia/.test(text)) return "colombia";
  if (/巴西|brazil/.test(text)) return "brazil";
  if (/瑞士|switzerland/.test(text)) return "switzerland";
  if (/加拿大|canada/.test(text)) return "canada";
  if (/波黑|bosnia/.test(text)) return "bosnia-herzegovina";
  if (/卡塔尔|qatar/.test(text)) return "qatar";
  if (/苏格兰|scotland/.test(text)) return "scotland";
  if (/摩洛哥|morocco/.test(text)) return "morocco";
  if (/海地|haiti/.test(text)) return "haiti";
  // Finnish teams
  if (/拉赫蒂|lahti/i.test(text)) return "lahti";
  if (/TPS|tps|图尔库/i.test(text)) return "tps turku";
  if (/库奥皮奥|kuopio/i.test(text)) return "kuopio";
  if (/瓦萨|vaasa/i.test(text)) return "vaasa";
  if (/奥卢|oulu/i.test(text)) return "ac oulu";
  if (/雅罗|jaro/i.test(text)) return "jaro";
  if (/国际图尔|inter turku/i.test(text)) return "inter turku";
  if (/塞伊奈|seinajoen/i.test(text)) return "seinajoen";
  if (/玛丽港|mariehamn/i.test(text)) return "mariehamn";
  if (/赫尔辛基|helsinki/i.test(text)) return "hjk helsinki";
    const ck = CLUB_ELO_LOOKUP[text]; if (ck) return ck;
  return text.trim();
}

function teamProfile(key) {
  const base = TEAM_DATA[key] || { elo: 1700, fifa: 60, title: 0.0005, qf: 0, semi: 0, confed: "mixed", archetype: "unknown" };
  return { key, ...base, v33Class: teamClass(key), group: GROUP_DATA[key] || null };
}

function marketFullTimeProbabilities(match) {
  const hafu = impliedMap(match?.pools?.hafu || []);
  const had = impliedMap(match?.pools?.had || []);
  if (Object.keys(hafu).length) {
    return normalizeWdl({
      h: (hafu.hh || 0) + (hafu.dh || 0) + (hafu.ah || 0),
      d: (hafu.hd || 0) + (hafu.dd || 0) + (hafu.ad || 0),
      a: (hafu.ha || 0) + (hafu.da || 0) + (hafu.aa || 0),
    });
  }
  return normalizeWdl({ h: had.h || 0.42, d: had.d || 0.27, a: had.a || 0.31 });
}

function impliedMap(items) {
  const inv = items.map((item) => ({ key: item.key, prob: 1 / item.odds })).filter((item) => Number.isFinite(item.prob));
  const total = inv.reduce((sum, item) => sum + item.prob, 0) || 1;
  return Object.fromEntries(inv.map((item) => [item.key, item.prob / total]));
}

function researchText(research) {
  return (research?.categories || [])
    .map((category) => [category.answer, ...(category.results || []).flatMap((item) => [item.title, item.snippet, item.url])]
      .filter(Boolean).join(" "))
    .join(" ")
    .toLowerCase();
}

function parseResearchPenalty(research) {
  // Parse structured penalty from research text — feeds back into model lambda
  const penalties = [];
  const allText = researchText(research);
  if (!allText) return null;  // null → falsy, prevents NaN propagation in applyV33LambdaAdjustments

  const patterns = [
    // Injury/absence → attacker/defender lambda penalty
    { regex: /(key|star|top|核心|主力)\s+(striker|forward|winger|attacker|射手|前锋|边锋|攻击手|中锋)\s+(out|injured|absent|unavailable|doubtful|缺阵|伤停|因伤|受伤|无缘)/i, team: "favorite", action: "injuredForward", value: -0.12 },
    { regex: /(key|star|top|核心|主力)\s+(striker|forward|winger|attacker|射手|前锋|边锋|攻击手|中锋)\s+(out|injured|absent|unavailable|doubtful|缺阵|伤停|因伤|受伤|无缘)/i, team: "underdog", action: "injuredForward", value: -0.08 },
    { regex: /(defender|centre.back|goalkeeper|后卫|门将|中卫)\s.*(out|injured|absent|unavailable|doubtful|缺阵|伤停|因伤|受伤|无缘)/i, team: "favorite", action: "injuredDefense", value: -0.06 },
    { regex: /(defender|centre.back|goalkeeper|后卫|门将|中卫)\s.*(out|injured|absent|unavailable|doubtful|缺阵|伤停|因伤|受伤|无缘)/i, team: "underdog", action: "injuredDefense", value: -0.10 },
    // Suspensions
    { regex: /(suspended|banned|suspension|禁赛|停赛)/i, team: "favorite", action: "suspension", value: -0.08 },
    { regex: /(suspended|banned|suspension|禁赛|停赛)/i, team: "underdog", action: "suspension", value: -0.06 },
    // Motivation/rotation
    { regex: /(rotate|rotation|rest|rotated|rested|轮换|留力|替补)/i, team: "favorite", action: "rotation", value: -0.06 },
    // Goalkeeper overperformance potential
    { regex: /(goalkeeper|keeper|门将).*(outstanding|brilliant|heroic|phenomenal|神勇|神扑|屡献)/i, team: "underdog", action: "keeperOverperformance", value: -0.04 },
    // Red card risk
    { regex: /(red.card|sent.off|dismissed|罚下|红牌)/i, team: "favorite", action: "redCardRisk", value: -0.10 },
  ];

  for (const { regex, team, action, value } of patterns) {
    // 🔪 SURGERY-3: 否定词盲区修补
    // 旧正则：无论前面写的是"暂无伤停"还是"没有缺阵"，只要包含"伤停"二字就命中
    // 新逻辑：匹配后检查前文 3 字符内是否存在否定词，存在则跳过
    if (regex.test(allText)) {
      const matchIndex = allText.search(regex);
      const prefix = allText.substring(Math.max(0, matchIndex - 3), matchIndex);
      if (!/无|没|不|暂无/.test(prefix)) {
        penalties.push({ team, action, value, reason: `${team} team: ${action}` });
      }
    }
  }

  // Cap total penalties
  const favPenalty = penalties.filter(p => p.team === "favorite").reduce((s, p) => s + p.value, 0);
  const dogPenalty = penalties.filter(p => p.team === "underdog").reduce((s, p) => s + p.value, 0);
  return {
    penalties,
    favoriteModifier: clamp(1 + favPenalty, 0.80, 1.10),
    underdogModifier: clamp(1 + dogPenalty, 0.80, 1.10),
    totalSignalCount: penalties.length,
  };
}

function extractSignals(text, homeKey, awayKey, market, stageMul = STAGE_MULTIPLIERS.group, motivMod = MOTIVATION_MODIFIERS.neutral) {
  const has = (...words) => words.some((word) => text.includes(word));
  const homeFav = (market?.h || 0) >= (market?.a || 0);
  const favoriteSide = homeFav ? "h" : "a";
  const favoriteKey = homeFav ? homeKey : awayKey;
  const underdogKey = homeFav ? awayKey : homeKey;
  const favoriteClass = teamClass(favoriteKey);
  const underdogClass = teamClass(underdogKey);
  const athleticOpponent = ATHLETIC_RESISTANCE.has(underdogKey);
  const tacticalOpponent = TACTICAL_RESISTANCE.has(underdogKey);
  const physicalOpponent = athleticOpponent || tacticalOpponent; // backward compat
  const agingOpponent = AGING_DEFENSE_TEAMS.has(underdogKey);

  // P3: sigmoid dose (replaces boolean threshold)
  const lowBlockClues = [
    UNSTABLE_LOW_BLOCK_FAVORITES.has(favoriteKey),
    physicalOpponent,
    has("low block", "deep block", "compact", "5-4-1", "4-5-1", "低位", "密集"),
    has("ronaldo", "cross", "crossing", "set piece", "corner", "free kick", "传中", "定位球"),
    has("counterattack", "counter", "pace", "speed", "transition", "反击", "速度", "转换"),
    has("few touches", "poor finishing", "shots on target", "sot", "射正", "终结不稳"),
  ].filter(Boolean).length;
  const surgeClues = [
    HIGH_DEPTH_FAVORITES.has(favoriteKey),
    agingOpponent,
    has("bench", "substitute", "depth", "rotation", "替补", "深度"),
    has("coach", "adjustment", "tuchel", "second half", "下半场", "临场", "调整"),
    has("set piece", "corner", "free kick", "定位球", "角球"),
    has("multiple scorers", "wide attack", "wing", "多点", "边路"),
  ].filter(Boolean).length;

  // Sigmoid dose scores (P3) with P8 stage + P9 motivation modulation
  const rawLowBlockScore = sigmoidDose(lowBlockClues, 3.5, 2.5, 2);
  const rawSurgeScore = sigmoidDose(surgeClues, 3.0, 2.0, 2);
  const lowBlockPenaltyScore = clamp(rawLowBlockScore * stageMul.penalty * motivMod.penaltyScale, 0, 1);
  const surgeScore = clamp(rawSurgeScore * stageMul.surge, 0, 1);

  // opponent_physical_grade: athletic=0.8, tactical=0.5
  const opponentGrade = athleticOpponent ? 0.8 : tacticalOpponent ? 0.5 : 0;

  // P1+P7: opponent interaction lookup
  const interaction = interactionLookup(favoriteClass, underdogClass, favoriteKey, underdogKey);
  const interactionDeltas = interaction.deltas;
  const dangerZone = favoriteClass === "unstable-low-block"
    && underdogClass === "athletic-resistance"
    && lowBlockPenaltyScore > 0.60;

  return {
    lowBlock: has("low block", "deep block", "defensive", "compact", "5-4-1", "4-5-1", "低位", "密集"),
    eliteOutlet: has("ronaldo", "bruno", "bernardo", "mbappe", "messi", "kane", "elite", "finisher", "attacking", "attack"),
    injury: false, // disabled — bssj API provides structured injury data; regex false-positives from search prompts
    rotation: has("rotation", "rotate", "rest", "rotated", "轮换"),
    slowEnvironment: has("heat", "humid", "humidity", "hydration", "altitude", "travel", "fatigue", "hot", "高温", "湿度", "海拔", "旅行", "疲劳"),
    openTempo: has("open game", "counterattack", "transition", "high press", "pressing", "pace", "end-to-end", "counter", "对攻", "反击", "高压", "转换"),
    motivation: has("qualification", "standings", "must win", "advance", "出线", "积分", "小组"),
    marketMove: has("odds movement", "market", "betting", "line movement", "盘口", "赔率"),
    physicalUnderdog: athleticOpponent || tacticalOpponent,
    favoriteSide,
    favoriteKey,
    underdogKey,
    favoriteClass,
    underdogClass,
    physicalOpponent,
    athleticOpponent,
    tacticalOpponent,
    agingOpponent,
    unstableFavorite: UNSTABLE_LOW_BLOCK_FAVORITES.has(favoriteKey),
    highDepthFavorite: HIGH_DEPTH_FAVORITES.has(favoriteKey),
    sFinisherFavorite: S_FINISHERS.has(favoriteKey),
    // P3: sigmoid dose scores
    lowBlockPenaltyScore,
    surgeScore,
    opponentGrade,
    // P1: interaction matrix deltas
    interactionDeltas,
    interactionRawDeltas: interaction.rawDeltas,
    interactionStrengthModifier: interaction.modifier,
    interactionWeakOpponent: interaction.weakOpponent,
    interactionLambdaMultipliers: interaction.lambdaMultipliers,
    dangerZone,
    // Boolean triggers (backward compat, softened by dose)
    lowBlockConversionPenalty: lowBlockPenaltyScore > 0.15,
    secondHalfSurgeFactor: surgeScore > 0.15,
  };
}

// ===== P3: Sigmoid dose-response =====
function sigmoidDose(n, midpoint, steepness, deadZone) {
  if (n <= 0) return 0;
  const raw = 1 / (1 + Math.exp(-steepness * (n - midpoint)));
  if (n <= deadZone) return clamp(raw * (n / deadZone) ** 2, 0, 1);
  return clamp(raw, 0, 1);
}

// ===== P1: Interaction matrix lookup =====
function interactionLookup(favClass, oppClass, favKey = "", oppKey = "") {
  const row = INTERACTION_MATRIX[favClass] || INTERACTION_MATRIX["mid-tier"];
  const rawDeltas = row[oppClass] || [0, 0];
  const favoriteElo = TEAM_DATA[favKey]?.elo;
  const opponentElo = TEAM_DATA[oppKey]?.elo;
  const weakOpponent = favClass === "unstable-low-block"
    && Number.isFinite(favoriteElo)
    && Number.isFinite(opponentElo)
    && favoriteElo - opponentElo > 150;

  // r6: mid-tier vs mid-tier — skip λ multipliers, use Sij empirical calibration only
  const isMidTierPair = (favClass === "mid-tier" || favClass === "possession")
    && (oppClass === "mid-tier" || oppClass === "possession" || oppClass === "unknown");
  if (isMidTierPair) {
    return {
      deltas: rawDeltas,
      rawDeltas,
      modifier: 1,
      weakOpponent: false,
      lambdaMultipliers: { favorite: 1.0, underdog: 1.0 }, // neutral — Sij handles this
      midTierPair: true,
    };
  }

  let [deltaWin, deltaDraw] = rawDeltas;
  let modifier = 1;
  if (weakOpponent && (deltaWin < 0 || deltaDraw > 0)) {
    modifier = 0.5;
    if (deltaWin < 0) deltaWin *= modifier;
    if (deltaDraw > 0) deltaDraw *= modifier;
  }
  return {
    deltas: [deltaWin, deltaDraw],
    rawDeltas,
    modifier,
    weakOpponent,
    lambdaMultipliers: interactionLambdaMultipliers(deltaWin, deltaDraw, favClass),
    midTierPair: false,
  };
}

function interactionLambdaMultipliers(deltaWin, deltaDraw, favClass = "") {
  // r6: S-finisher uses 2.0× multiplier (reduced from 3.0× — elite talent ignores tactical counters)
  const winMultiplier = favClass === "S-finisher" ? 2.0 : 3.0;
  let favorite = 1;
  let underdog = 1;
  if (deltaWin > 0) favorite *= 1 + 2.5 * deltaWin;
  if (deltaWin < 0) favorite *= 1 + winMultiplier * deltaWin;
  if (deltaDraw > 0) underdog *= 1 + 0.86 * deltaDraw;
  if (deltaDraw < 0 && deltaWin <= 0) underdog *= 1 + 1.2 * deltaDraw;
  return {
    favorite: clamp(favorite, 0.72, 1.18),
    underdog: clamp(underdog, 0.84, 1.14),
  };
}

function teamClass(key) {
  if (S_FINISHERS.has(key)) return "S-finisher";
  if (HIGH_DEPTH_FAVORITES.has(key)) return "high-depth";
  if (UNSTABLE_LOW_BLOCK_FAVORITES.has(key)) return "unstable-low-block";
  if (ATHLETIC_RESISTANCE.has(key)) return "athletic-resistance";
  if (TACTICAL_RESISTANCE.has(key)) return "tactical-resistance";
  if (AGING_DEFENSE_TEAMS.has(key)) return "aging-defense";
  const arch = TEAM_DATA[key]?.archetype || "unknown";
  if (arch === "physical") return "athletic-resistance"; // backward compat
  return arch;
}

function buildStrength(home, away, market, signals) {
  const homeHfi = hfiProxy(market.h, signals, home.archetype);
  const awayHfi = hfiProxy(market.a, signals, away.archetype);
  const homeInjury = signals.injury && market.h >= market.a ? -0.25 : 0;
  const awayInjury = signals.injury && market.a > market.h ? -0.25 : 0;
  const envAdj = signals.slowEnvironment ? -0.15 : signals.openTempo ? 0.08 : 0;
  const homeStrength = baseStrength(home, homeHfi, homeInjury, envAdj);
  const awayStrength = baseStrength(away, awayHfi, awayInjury, envAdj);
  return {
    home: { ...homeStrength, hfiProxy: homeHfi, injuryAdj: homeInjury, envAdj },
    away: { ...awayStrength, hfiProxy: awayHfi, injuryAdj: awayInjury, envAdj },
  };
}

function baseStrength(team, hfi, injuryAdj, envAdj) {
  // A- teams: systemic Elo discount — aging cores / tactical transition / paper strength
  const eloDiscount = team.archetype === "unstable-low-block" ? -40 : 0;
  const eloZ = (team.elo + eloDiscount - 1800) / 140;
  const fifaZ = (55 - team.fifa) / 28;
  const hfiZ = (hfi - 150) / 80;
  // V4.0: xG data-powered efficiency (replaces hardcoded archetype proxy)
  const xgData = getXGStrength(team.key);
  let xgEffZ;
  if (xgData) {
    // Blend xG attack + defense into single efficiency Z-score
    xgEffZ = 0.6 * xgData.xg_z + 0.4 * xgData.xga_z;
  } else {
    // Fallback: archetype-based heuristic
    xgEffZ = team.archetype === "elite-finisher" ? 0.55
      : team.archetype === "high-depth" ? 0.52
        : team.archetype === "unstable-low-block" ? 0.25
            : team.archetype === "possession" ? 0.35
            : team.archetype === "athletic-resistance" ? 0.08
              : team.archetype === "tactical-resistance" ? 0.12
                : team.archetype === "physical" ? 0.05
              : 0;
  }
  return {
    eloZ,
    fifaZ,
    hfiZ,
    xgEffZ,
    // Core weights sum to 1.0; injury/env are post-hoc additive modifiers
    baseStrength: 0.34 * eloZ + 0.20 * fifaZ + 0.20 * hfiZ + 0.26 * xgEffZ,
    adjustedStrength: 0.34 * eloZ + 0.20 * fifaZ + 0.20 * hfiZ + 0.26 * xgEffZ + 0.06 * injuryAdj + 0.06 * envAdj,
  };
}

function getEffectiveStrength(strengthObj) {
  // Use adjusted when injury/env modifiers are active, else fall back to base
  return strengthObj.adjustedStrength ?? strengthObj.baseStrength;
}

function hfiProxy(marketWin, signals, archetype) {
  let value = 100 + marketWin * 180;
  if (archetype === "elite-finisher") value += 18;
  if (archetype === "high-depth") value += 18;
  if (archetype === "unstable-low-block") value += 6;
  if (archetype === "athletic-resistance") value += 8;
  if (archetype === "tactical-resistance") value += 10;
  if (archetype === "physical") value += 8;
  if (signals.motivation) value += 6;
  if (signals.rotation) value -= 10;
  if (signals.injury) value -= 8;
  return clamp(value, 40, 280);
}

function buildP0({ home, away, market, sij, signals }) {
  const sijWdl = bandedWdlFromSij(sij);
  const eloHome = eloExpected(home.elo, away.elo);
  const eloDraw = clamp(0.30 - Math.abs(eloHome - 0.5) * 0.18 + (signals.lowBlock ? 0.03 : 0), 0.16, 0.38);
  const eloWdl = normalizeWdl({ h: eloHome * (1 - eloDraw), d: eloDraw, a: (1 - eloHome) * (1 - eloDraw) });
  const groupHome = home.group?.qualify || home.title * 8 || 0.2;
  const groupAway = away.group?.qualify || away.title * 8 || 0.2;
  const groupWdl = normalizeWdl({ h: groupHome, d: 0.26, a: groupAway });
  const researchWdl = normalizeWdl({
    h: market.h + (signals.eliteOutlet && market.h >= market.a ? 0.03 : 0) - (signals.injury && market.h >= market.a ? 0.025 : 0),
    d: market.d + (signals.lowBlock ? 0.035 : 0) + (signals.slowEnvironment ? 0.02 : 0),
    a: market.a + (signals.physicalUnderdog && market.a < market.h ? 0.025 : 0) - (signals.injury && market.a > market.h ? 0.025 : 0),
  });
  return normalizeWdl({
    h: 0.30 * sijWdl.h + 0.22 * eloWdl.h + 0.18 * groupWdl.h + 0.20 * market.h + 0.10 * researchWdl.h,
    d: 0.30 * sijWdl.d + 0.22 * eloWdl.d + 0.18 * groupWdl.d + 0.20 * market.d + 0.10 * researchWdl.d,
    a: 0.30 * sijWdl.a + 0.22 * eloWdl.a + 0.18 * groupWdl.a + 0.20 * market.a + 0.10 * researchWdl.a,
  });
}

function buildCorrections({ p0, sij, signals, controls, drawState }) {
  const drawBase = drawPosterior(drawState.matchesPlayed || 0, drawState.draws || 0);
  const drawTarget = adjustedDraw(drawBase, {
    closeStrength: Math.abs(sij) < 0.5,
    firstRound: true,
    lowBlock: signals.lowBlock || signals.lowBlockConversionPenalty,
    weakBreakdown: signals.lowBlockConversionPenalty || (signals.lowBlock && Math.max(p0.h, p0.a) < 0.72),
    environmentSlow: signals.slowEnvironment || controls.tempo === "slow",
    absSij: Math.abs(sij),
    eliteAttack: signals.sFinisherFavorite || signals.secondHalfSurgeFactor,
  });
  const priorWdl = normalizeWdl({ ...p0, d: (p0.d * 0.75) + (drawTarget * 0.25) });
  const lambdaWarnings = [];
  if (signals.dangerZone) {
    lambdaWarnings.push("DANGER-ZONE SELECTOR GUARD: A- vs athletic-resistance with high low-block dose. Base model stays lambda-driven; HAD singles should be rejected by selector.");
  }
  if (Math.max(p0.h, p0.a) > 0.70 && drawTarget > 0.24 && signals.lowBlockPenaltyScore > 0.35) {
    lambdaWarnings.push("CONSISTENCY WATCH: high favorite probability and high draw target coexist; verify handicap/total from the Poisson matrix.");
  }
  const lambdaDataCompleteness = controls?.confidence === "high" || (signals.motivation && (signals.injury || signals.eliteOutlet)) ? "high" : "medium";
  return {
    wdl: normalizeWdl(p0),
    drawBase,
    drawTarget,
    dataCompleteness: lambdaDataCompleteness,
    priorWdl,
    postInteractionWdl: normalizeWdl(p0),
    lambdaConsistent: true,
    dangerZone: Boolean(signals.dangerZone),
    autoCorrected: false,
    consistencyWarning: lambdaWarnings.join(" "),
  };
}
function chooseLambdas({ sij, p0, controls, signals, motivMod = MOTIVATION_MODIFIERS.neutral, profileName = "default", deltaElo = 0 }) {
  let result;
  if (Number.isFinite(Number(controls?.lambdaHome)) && Number.isFinite(Number(controls?.lambdaAway))) {
    result = { home: Number(controls.lambdaHome), away: Number(controls.lambdaAway) };
    return applyV33LambdaAdjustments(result, signals);
  }
  const abs = Math.abs(sij);
  const homeFav = p0.h >= p0.a;
  let fav = 1.15;
  let dog = 1.15;
  if (abs > 1.8) [fav, dog] = [2.30, 0.45];
  else if (abs > 1.2) [fav, dog] = [1.85, 0.65];
  else if (abs > 0.8) [fav, dog] = [1.55, 0.85];
  else if (abs > 0.4) [fav, dog] = [1.30, 1.00];
  if (signals.lowBlock) fav *= 0.96;
  if (signals.injury) fav *= 0.97;
  if ((signals.eliteOutlet || signals.sFinisherFavorite) && !signals.unstableFavorite) fav *= 1.05;
  result = homeFav ? { home: fav, away: dog } : { home: dog, away: fav };
  // DEBUG (quiet mode — uncomment for lambda diagnostics):
  // if (Math.abs(sij) > 0.8) console.error('CHOOSE_LAMBDAS_DEBUG sij='+sij.toFixed(2)+' fav='+fav.toFixed(2)+' dog='+dog.toFixed(2)+' resultBefore='+JSON.stringify(result));
  result = applyV33LambdaAdjustments(result, signals);
  // if (Math.abs(sij) > 0.8) console.error('CHOOSE_LAMBDAS_DEBUG afterAdjust='+JSON.stringify(result));

  // V4.0 Non-linear Elo Stretch — fix Favorite-Longshot Bias
  // When ΔElo > 200: amplify fav λ exponentially, crush dog λ
  // This fixes Arsenal-vs-Palace type mismatches where model gives 48% instead of 62%
  const absDeltaElo = Math.abs(deltaElo ?? 0);
  if (absDeltaElo > 200) {
    const excess = (absDeltaElo - 200) / 100;
    const stretch = Math.min(1 + excess * 0.08, 1.40); // 8% per 100 Elo, max 40%
    const favKey = signals.favoriteSide === "a" ? "away" : "home";
    const dogKey = favKey === "home" ? "away" : "home";
    result[favKey] = clamp(result[favKey] * stretch, 0.2, 3.4);
    result[dogKey] = clamp(result[dogKey] / stretch, 0.2, 3.4);
  }

  // P9: motivation-driven λ scaling
  result = {
    home: clamp(result.home * (motivMod?.lambdaScale ?? 1), 0.2, 3.4),
    away: clamp(result.away * (motivMod?.lambdaScale ?? 1), 0.2, 3.4),
  };
  return result;
}

function applyV33LambdaAdjustments(lambdas, signals) {
  const result = { ...lambdas };
  // NaN guard: ensure base lambdas are valid numbers
  if (!Number.isFinite(result.home) || result.home <= 0) { console.error('GUARD-TRIGGERED home:', result.home); result.home = 1.15; }
  if (!Number.isFinite(result.away) || result.away <= 0) { console.error('GUARD-TRIGGERED away:', result.away); result.away = 1.15; }
  const favoriteKey = signals.favoriteSide === "a" ? "away" : "home";
  const underdogKey = favoriteKey === "home" ? "away" : "home";

  // Combined tactical penalty stack — merge before applying to avoid chain-multiplication collapse
  let favTacticalMult = 1.0;
  let dogTacticalMult = 1.0;
  const interactionMul = signals.interactionLambdaMultipliers || { favorite: 1, underdog: 1 };
  // Sanitize: ensure interaction multipliers are valid numbers, default to 1.0
  const safeFav = Number.isFinite(interactionMul.favorite) ? interactionMul.favorite : 1;
  const safeDog = Number.isFinite(interactionMul.underdog) ? interactionMul.underdog : 1;
  favTacticalMult *= safeFav;
  dogTacticalMult *= safeDog;
  if (signals.unstableFavorite) {
    const unstableScale = signals.interactionWeakOpponent ? 0.5 : 1;
    favTacticalMult *= 1 - 0.04 * unstableScale;
    dogTacticalMult *= 1 + 0.02 * unstableScale;
  }
  // 🔪 SURGERY-1: 切除文本情报对数学引擎的污染
  // 理由：Pinnacle 赔率已 Price-in 伤停/战术意图，文本解析存在否定词盲区
  // 二次惩罚 = 双重计数 → 强队 λ 被系统性低估
  // 保留客观交互矩阵（行 1748-1758）和 unstableFavorite 分类修正
  // if (signals.lowBlockPenaltyScore > 0.15) { ... }  ← 文本驱动，已切除
  // if (signals.researchPenalty ... ) { ... }          ← 文本驱动，已切除
  // Floor: favorite λ cannot drop below 85% of base — prevents cascade collapse
  favTacticalMult = Math.max(0.85, favTacticalMult);

  result[favoriteKey] *= favTacticalMult;
  result[underdogKey] *= dogTacticalMult;

  // Positive boosts (separate from tactical penalties)
  if (signals.highDepthFavorite) result[favoriteKey] *= 1.06;
  if (signals.surgeScore > 0.15) {
    result[favoriteKey] *= 1 + 0.08 * signals.surgeScore;
    result[underdogKey] *= 1 + 0.03 * signals.surgeScore;
  }
  // Ensure non-NaN output
  if (!Number.isFinite(result.home)) { console.error('FINAL-GUARD home NaN reset:', result.home); result.home = 1.15; }
  if (!Number.isFinite(result.away)) { console.error('FINAL-GUARD away NaN reset:', result.away); result.away = 1.15; }
  return {
    home: clamp(result.home, 0.2, 3.4),
    away: clamp(result.away, 0.2, 3.4),
  };
}

function chooseProfile({ controls, home, away, p0, signals }) {
  if (signals.lowBlockConversionPenalty) return "defensive-favorite";
  if (signals.secondHalfSurgeFactor) return "elite-finisher";
  if (controls?.profile && PROFILES[controls.profile]) return controls.profile;
  const favElite = p0.h >= p0.a ? home.archetype === "elite-finisher" : away.archetype === "elite-finisher";
  if (signals.lowBlock || signals.unstableFavorite) return "defensive-favorite";
  if (signals.eliteOutlet || signals.sFinisherFavorite || favElite) return "elite-finisher";
  if (Math.max(p0.h, p0.a) < 0.55) return "balanced";
  return "default";
}

function chooseTempo({ controls, signals }) {
  if (controls?.tempo && controls.tempo !== "normal") return controls.tempo;
  if (signals.slowEnvironment) return "slow";
  if (signals.openTempo) return "open";
  return "normal";
}

function buildScoreMatrix(lambdaHome, lambdaAway, profileName, opts = {}) {
  // V4.0 pipeline: NB marginals → Copula joint → Dixon-Coles patch
  if (!Number.isFinite(lambdaHome) || lambdaHome <= 0) lambdaHome = 1.15;
  if (!Number.isFinite(lambdaAway) || lambdaAway <= 0) lambdaAway = 1.15;
  const profile = PROFILES[profileName] || PROFILES.default;
  const homeFav = lambdaHome >= lambdaAway;
  const r = opts.r ?? 1.0;
  const rho = opts.rho ?? 0.012;
  const states = [
    { weight: profile.n, h: lambdaHome, a: lambdaAway },
    { weight: profile.l, h: 0.82 * lambdaHome, a: 0.82 * lambdaAway },
    { weight: profile.c,
      h: homeFav ? 1.35 * lambdaHome : 0.90 * lambdaHome,
      a: homeFav ? 0.90 * lambdaAway : 1.35 * lambdaAway,
    },
  ];

  // Phase 1: NB marginals per state
  const maxG = 8;
  const stateMarginals = states.map(s => {
    const mH = Array.from({length: maxG + 1}, (_, k) => negBinomialPMF(k, s.h, r));
    const mA = Array.from({length: maxG + 1}, (_, k) => negBinomialPMF(k, s.a, r));
    // Normalize
    const tH = mH.reduce((t, v) => t + v, 0) || 1;
    const tA = mA.reduce((t, v) => t + v, 0) || 1;
    return { h: mH.map(v => v / tH), a: mA.map(v => v / tA) };
  });

  // Phase 2: Copula joint (Gaussian, ρ=0.18 for football typical)
  const copulaRho = opts.copulaRho ?? 0.18;
  const samples = 80000;
  // Build CDF arrays per state
  const cdfs = stateMarginals.map(m => {
    const hCdf = [], aCdf = [];
    let sh = 0, sa = 0;
    for (let i = 0; i <= maxG; i++) { sh += m.h[i]; hCdf.push(sh); }
    for (let i = 0; i <= maxG; i++) { sa += m.a[i]; aCdf.push(sa); }
    return { hCdf, aCdf };
  });

  // Gaussian Copula Monte Carlo (Box-Muller + Cholesky)
  const L = Math.sqrt(1 - copulaRho * copulaRho);
  const counts = Array.from({length: maxG + 1}, () => new Array(maxG + 1).fill(0));

  // Pre-draw state assignments (N/L/C weighted selection)
  const stateDraws = new Array(samples);
  const cumWeights = states.map((s, i) =>
    states.slice(0, i + 1).reduce((t, ss) => t + ss.weight, 0));
  const totalW = cumWeights[cumWeights.length - 1];
  for (let n = 0; n < samples; n++) {
    const rnd = Math.random() * totalW;
    let sidx = 0;
    while (sidx < cumWeights.length - 1 && rnd >= cumWeights[sidx]) sidx++;
    stateDraws[n] = sidx;
  }

  for (let n = 0; n < samples; n++) {
    // Box-Muller pair
    const u1 = Math.random(), u2 = Math.random();
    const r = Math.sqrt(-2 * Math.log(u1 || 1e-10));
    const theta = 2 * Math.PI * u2;
    const z1 = r * Math.cos(theta);
    const z2 = copulaRho * z1 + L * r * Math.sin(theta);
    // Standard normal CDF: Φ(x) = 0.5(1 + erf(x/√2))
    const uH = 0.5 * (1 + erf_approx(z1 * 0.7071067811865476));
    const uA = 0.5 * (1 + erf_approx(z2 * 0.7071067811865476));

    const sidx = stateDraws[n];
    const { hCdf, aCdf } = cdfs[sidx];
    let h = 0; while (h < maxG && hCdf[h] < uH) h++;
    let a = 0; while (a < maxG && aCdf[a] < uA) a++;
    counts[h][a] += 1;  // count=1 — state weighting already applied via pre-draw
  }

  const total = counts.flat().reduce((t, v) => t + v, 0) || 1;
  const scores = [];
  for (let h = 0; h <= maxG; h++)
    for (let a = 0; a <= maxG; a++)
      scores.push({ h, a, prob: counts[h][a] / total });

  // Phase 3: Dixon-Coles — re-enabled for knockout stages
  if (opts.dcRho !== 0) {
    applyDixonColes(scores, opts.dcRho ?? 0.012);
  }
  return scores;
}

// Abramowitz-Stegun erf approximation (max error 1.5e-7)
function erf_approx(x) {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return sign * y;
}

function buildScoreMatrix_Poisson_legacy(lambdaHome, lambdaAway, profileName) {
  // Fallback: original Poisson+DC for comparison
  if (!Number.isFinite(lambdaHome) || lambdaHome <= 0) lambdaHome = 1.15;
  if (!Number.isFinite(lambdaAway) || lambdaAway <= 0) lambdaAway = 1.15;
  const profile = PROFILES[profileName] || PROFILES.default;
  const homeFav = lambdaHome >= lambdaAway;
  const states = [
    { weight: profile.n, h: lambdaHome, a: lambdaAway },
    { weight: profile.l, h: 0.82 * lambdaHome, a: 0.82 * lambdaAway },
    { weight: profile.c,
      h: homeFav ? 1.35 * lambdaHome : 0.90 * lambdaHome,
      a: homeFav ? 0.90 * lambdaAway : 1.35 * lambdaAway,
    },
  ];
  const scores = [];
  for (let h = 0; h <= 8; h += 1) {
    for (let a = 0; a <= 8; a += 1) {
      const prob = states.reduce((sum, s) => sum + s.weight * poisson(h, s.h) * poisson(a, s.a), 0);
      scores.push({ h, a, prob });
    }
  }
  const total = scores.reduce((t, s) => t + s.prob, 0) || 1;
  for (const s of scores) s.prob /= total;
  applyDixonColes(scores, 0.012);
  return scores;
}

function buildPlayProbabilities(scores, match, profile, tempoFactor, lambdas, signals, r = 1.0) {
  const states = sumStates(scores);
  const byPlay = {
    had: { h: states.h, d: states.d, a: states.a },
    hhad: { h: 0, d: 0, a: 0 },
    crs: { s1sh: 0, s1sd: 0, s1sa: 0 },
    ttg: { s7: 0 },
    hafu: buildHafu(lambdas.home * tempoFactor, lambdas.away * tempoFactor, profile, r),
  };
  const handicap = Number(match?.hhadGoalLine || 0);
  const crsMap = new Map(CRS_KEYS.map(([key, h, a]) => [`${h}:${a}`, key]));
  for (const score of scores) {
    if (!Number.isFinite(score.prob)) continue;
    const adjusted = score.h + handicap - score.a;
    if (adjusted > 0) byPlay.hhad.h += score.prob;
    else if (adjusted === 0) byPlay.hhad.d += score.prob;
    else byPlay.hhad.a += score.prob;

    const totalGoals = score.h + score.a;
    const ttgKey = totalGoals >= 7 ? "s7" : `s${totalGoals}`;
    byPlay.ttg[ttgKey] = (byPlay.ttg[ttgKey] || 0) + score.prob;

    const exact = crsMap.get(`${score.h}:${score.a}`);
    if (exact) byPlay.crs[exact] = (byPlay.crs[exact] || 0) + score.prob;
    else if (score.h > score.a) byPlay.crs.s1sh += score.prob;
      else if (score.h === score.a) byPlay.crs.s1sd += score.prob;
    else byPlay.crs.s1sa += score.prob;
  }
  byPlay.hafu = adjustHafuV33(byPlay.hafu, signals);
  byPlay.hhad = adjustHandicapV33(byPlay.hhad, handicap, states, signals);
  byPlay.ttg = adjustTotalGoalsV33(byPlay.ttg, signals);
  return byPlay;
}

function adjustHafuV33(hafu, signals) {
  // V4: NB+Copula joint already handles HT/FT distribution — bypass all V3 heuristics
  return { ...hafu };
}

function adjustHandicapV33(hhad, handicap, states, signals) {
  // V4: NB+Copula joint already handles handicap distribution — bypass all V3 heuristics
  return { ...hhad };
}

function adjustTotalGoalsV33(ttg, signals) {
  // V4: NB+Copula joint already handles goal distribution — bypass all V3 heuristics
  return { ...ttg };
}

function normalizeMap(map) {
  const clamped = Object.fromEntries(Object.entries(map).map(([key, value]) => [key, Math.max(0, value || 0)]));
  const total = Object.values(clamped).reduce((sum, value) => sum + value, 0) || 1;
  return Object.fromEntries(Object.entries(clamped).map(([key, value]) => [key, value / total]));
}

function buildHafu(lambdaHome, lambdaAway, profileName, r = 1.0) {
  // V4.0: Negative Binomial for half-time and full-time (shared r for simplicity)
  if (!Number.isFinite(lambdaHome) || lambdaHome <= 0) lambdaHome = 1.15;
  if (!Number.isFinite(lambdaAway) || lambdaAway <= 0) lambdaAway = 1.15;
  const profile = PROFILES[profileName] || PROFILES.default;
  const homeFav = lambdaHome >= lambdaAway;
  const result = { hh: 0, hd: 0, ha: 0, dh: 0, dd: 0, da: 0, ah: 0, ad: 0, aa: 0 };
  const states = [
    { weight: profile.n, h: lambdaHome, a: lambdaAway },
    { weight: profile.l, h: 0.82 * lambdaHome, a: 0.82 * lambdaAway },
    {
      weight: profile.c,
      h: homeFav ? 1.35 * lambdaHome : 0.90 * lambdaHome,
      a: homeFav ? 0.90 * lambdaAway : 1.35 * lambdaAway,
    },
  ];
  let total = 0;
  for (const s of states) {
    for (let hh = 0; hh <= 6; hh += 1) {
      for (let ha = 0; ha <= 6; ha += 1) {
        const htProb = negBinomialPMF(hh, s.h * 0.45, r) * negBinomialPMF(ha, s.a * 0.45, r);
        for (let sh = 0; sh <= 6; sh += 1) {
          for (let sa = 0; sa <= 6; sa += 1) {
            const prob = s.weight * htProb * negBinomialPMF(sh, s.h * 0.55, r) * negBinomialPMF(sa, s.a * 0.55, r);
            result[`${stateKey(hh, ha)}${stateKey(hh + sh, ha + sa)}`] += prob;
            total += prob;
          }
        }
      }
    }
  }
  for (const key of Object.keys(result)) result[key] /= total || 1;
  return result;
}

function gradeMatch(states, completeness) {
  const max = Math.max(states.h, states.d, states.a);
  const doubleChance = Math.max(states.h + states.d, states.h + states.a, states.d + states.a);
  if (completeness !== "high" && max < 0.7) return { grade: "B/C", reason: "动态数据未完全结构化，降低一档处理。" };
  if (max >= 0.68 && states.d <= 0.25) return { grade: "A", reason: "单方向集中度高，平局压力较低。" };
  if (doubleChance >= 0.78) return { grade: "B", reason: "双选保护较强，单选需保守。" };
  if (states.d >= 0.33 || max - states.d < 0.12) return { grade: "C", reason: "平局或分歧压力偏高。" };
  return { grade: "D", reason: "方向分散或盘口/模型冲突。" };
}

function buildNotes({ home, away, p0, correction, signals, profile, tempo }) {
  const notes = [
    `P0 ensemble: home ${(p0.h * 100).toFixed(1)}%, draw ${(p0.d * 100).toFixed(1)}%, away ${(p0.a * 100).toFixed(1)}%.`,
    `Draw posterior adjusted to ${(correction.drawTarget * 100).toFixed(1)}%.`,
    `V3.3 r5 classes: favorite=${signals.favoriteClass}, underdog=${signals.underdogClass}.`,
    `Profile=${profile}, tempo=${tempo}.`,
    `Home archetype=${home.archetype}, away archetype=${away.archetype}.`,
  ];
  // P7: athletic vs tactical resistance
  if (signals.athleticOpponent) notes.push("P7: Athletic resistance opponent (high physicality, danger zone with A- teams).");
  if (signals.tacticalOpponent) notes.push("P7: Tactical resistance opponent (discipline-based, milder than athletic).");
  // P1: interaction matrix
  const [idw, idd] = signals.interactionDeltas || [0, 0];
  if (false && Math.abs(idw) + Math.abs(idd) > 0.005) {
    notes.push(`P1: Interaction matrix applied (Δwin=${(idw * 100).toFixed(1)}pp, Δdraw=${(idd * 100).toFixed(1)}pp).`);
  }
  if (Math.abs(idw) + Math.abs(idd) > 0.005) {
    const mul = signals.interactionLambdaMultipliers || { favorite: 1, underdog: 1 };
    const mod = Number(signals.interactionStrengthModifier || 1);
    notes.push(`P1 r5: interaction deltas are mapped to lambda multipliers (favLambda x${mul.favorite.toFixed(2)}, dogLambda x${mul.underdog.toFixed(2)}, strengthModifier=${mod.toFixed(2)}).`);
  }
  // P3: sigmoid dose
  if (signals.lowBlockPenaltyScore > 0.15) {
    notes.push(`P3: LowBlockPenalty sigmoid dose=${signals.lowBlockPenaltyScore.toFixed(2)} (grade=${signals.opponentGrade.toFixed(1)}).`);
  }
  if (signals.surgeScore > 0.15) {
    notes.push(`P3: SecondHalfSurge sigmoid dose=${signals.surgeScore.toFixed(2)}.`);
  }
  // P4: auto-correct
  if (correction.autoCorrected) {
    notes.push(`P4: AUTO-CORRECTED — ${correction.consistencyWarning}`);
  }
  if (signals.dangerZone) notes.push("P4 r5: Danger Zone moved to selector guard; base WDL is not force-swapped.");
  notes.push("P6 r5: empirical calibration is preview-only so WDL, handicap, total goals and HT/FT stay Poisson/lambda-consistent.");
  // P6: empirical calibration

  if (signals.lowBlock) notes.push("Low-block signal raised draw/low-block state.");
  if (signals.eliteOutlet) notes.push("Elite outlet signal raised favorite/collapse tail.");
  if (signals.slowEnvironment) notes.push("Environment/travel signal slowed tempo.");
  if (signals.openTempo) notes.push("Transition/high-press signal opened tempo.");
  return notes;
}

// ===== V4.0: Negative Binomial Distribution (replaces Poisson) =====
// Dispersion r — lower = fatter tails (more 0-0, more blowouts)
// r → ∞ → Poisson; football-typical range r ∈ [0.5, 2.0]
const DISPERSION = {
  // NB r: calibrated for football — r∈[4,20] gives modest overdispersion
  // Variance = mu + mu²/r  →  ~10-30% extra variance vs Poisson
  // Lower r = more volatile (CAF, knockout) — confirmed by MLE on WC 2018-2022 data
  "elite-finisher":        { r: 18 },
  "high-depth":            { r: 14 },
  "unstable-low-block":    { r: 8 },
  "athletic-resistance":   { r: 6 },
  "tactical-resistance":   { r: 9 },
  "mid-tier":              { r: 10 },
  "S-finisher":            { r: 16 },
  "default":               { r: 10 },
};
const DISPERSION_BY_CONFED = {
  "UEFA": 14, "CONMEBOL": 12, "CONCACAF": 9,
  "AFC": 9, "CAF": 7, "OFC": 6, "default": 10,
};
// 🔪 SURGERY-2: 补全淘汰赛方差枚举，与 STAGE_MULTIPLIERS 键值对齐
// 旧版只有 3 key → quarter/semi/round_of_16 全部 fallback 到 group=1.0
// 结果：淘汰赛防爆冷增幅系数在底层核心计算中一直失效
const DISPERSION_BY_STAGE = {
  "group": 1.0,
  "round_of_32": 0.80,
  "round_of_16": 0.70,
  "quarter": 0.70,
  "semi": 0.65,
  "final": 0.60,
  "knockout": 0.70, // 保留旧键值防崩
};

function getDispersion(homeTeam, awayTeam, stage) {
  const hR = (DISPERSION[homeTeam?.archetype] || DISPERSION.default).r;
  const aR = (DISPERSION[awayTeam?.archetype] || DISPERSION.default).r;
  const cH = DISPERSION_BY_CONFED[homeTeam?.confed] || DISPERSION_BY_CONFED.default;
  const cA = DISPERSION_BY_CONFED[awayTeam?.confed] || DISPERSION_BY_CONFED.default;
  const sMul = DISPERSION_BY_STAGE[stage] || DISPERSION_BY_STAGE.group;
  return Math.max(0.2, Math.min(30.0, (hR + aR + cH + cA) / 4 * sMul));
}

// V4.0 core PMF: Negative Binomial — iterative recurrence (no factorial overflow)
// NB(k; mu, r): E[X]=mu, Var=mu+mu²/r
// Recurrence: P(0)=p^r, P(k)=P(k−1)×(k+r−1)/k×(1−p), p=r/(r+mu)
function negBinomialPMF(k, mu, r) {
  if (k < 0 || !Number.isFinite(mu) || mu <= 0) return 0;
  if (!Number.isFinite(r) || r <= 0.01) r = 0.5;
  const p = r / (r + mu);
  const q = 1 - p;
  let pmf = Math.pow(p, r);
  if (k === 0) return pmf;
  for (let i = 1; i <= k; i++) {
    pmf *= (i + r - 1) / i * q;
  }
  return pmf;
}

// Legacy Poisson retained as fallback reference
function poisson(k, lambda) {
  if (k < 0) return 0;
  let factorial = 1;
  for (let i = 2; i <= k; i += 1) factorial *= i;
  return Math.exp(-lambda) * Math.pow(lambda, k) / factorial;
}

// ===== V4.0: Dixon-Coles low-score correction =====
// Applied AFTER score matrix is built from NB marginals
// Adjusts P(0,0), P(1,0), P(0,1), P(1,1) with ρ parameter
function applyDixonColes(scores, rho = 0.012) {
  // Dixon-Coles λ(i,j,ρ) selector — non-zero only for low-score cells
  function lambdaDC(i, j, rhoVal) {
    if (i === 0 && j === 0) return rhoVal;
    if (i === 0 && j === 1) return -0.7 * rhoVal;
    if (i === 1 && j === 0) return -0.7 * rhoVal;
    if (i === 1 && j === 1) return 0.3 * rhoVal;
    return 0;
  }

  // Extract cell probabilities by score pair
  const cellMap = new Map();
  for (const s of scores) {
    cellMap.set(`${s.h},${s.a}`, s);
  }

  // Apply correction
  let totalAdj = 0;
  for (const s of scores) {
    const lam = lambdaDC(s.h, s.a, rho);
    if (lam !== 0) {
      const adjusted = s.prob * (1 + lam);
      totalAdj += (adjusted - s.prob);
      s.prob = Math.max(0, adjusted);
    }
  }

  // Renormalize — distribute the adjustment across all cells proportionally
  const total = scores.reduce((t, s) => t + s.prob, 0);
  for (const s of scores) {
    s.prob /= (total || 1);
  }

  // Floor guard: ensure no probability goes negative from over-correction
  for (const s of scores) {
    if (s.prob < 0) s.prob = 0;
  }
}

// ===== V4.0 Market-Implied Calibration (Path 1) =====
// Reverse-engineer market HHAD odds to calibrate λ
// Anchors model to market wisdom, then hunts HAD inefficiencies

export function devigMultiplicative(odds) {
  // Multiplicative margin removal: trueProb = (1/odds) / sum(1/odds)
  if (!Array.isArray(odds) || odds.length < 3) return { probs: [], margin: 0 };
  const sumInv = odds.reduce((s, o) => s + 1/o, 0);
  return {
    probs: odds.map(o => (1/o) / sumInv),
    margin: +(sumInv - 1),
  };
}

export function computeModelHHAD(lambdaH, lambdaA, profileName, handicap, dispR, copRho, dcRho) {
  // Compute model HHAD probs for given λ pair
  const opts = { r: dispR, rho: dcRho, copulaRho: copRho };
  const scores = buildScoreMatrix(lambdaH, lambdaA, profileName, opts);
  const hhad = { h: 0, d: 0, a: 0 };
  for (const s of scores) {
    if (!Number.isFinite(s.prob)) continue;
    const adjusted = s.h + handicap - s.a;
    if (adjusted > 0) hhad.h += s.prob;
    else if (adjusted === 0) hhad.d += s.prob;
    else hhad.a += s.prob;
  }
  const total = hhad.h + hhad.d + hhad.a || 1;
  return { h: hhad.h / total, d: hhad.d / total, a: hhad.a / total };
}

export function calibrateLambda(lambdaH_prior, lambdaA_prior, profileName, handicap, marketHHAD, dispR, copRho, dcRho) {
  // Grid-search: find λ pair that best fits market HHAD
  const market = devigMultiplicative(marketHHAD);
  if (!market.probs.length) return { lambdaH: lambdaH_prior, lambdaA: lambdaA_prior, fitted: false };

  const target = market.probs; // [P_h, P_d, P_a]
  const DRIFT_CAP = 0.40;       // ±40% max adjustment from prior
  const CALIBRATION_TIMEOUT = 0.12; // if loss > 12%, calibration failed

  let bestLoss = Infinity;
  let bestLambdaH = lambdaH_prior;
  let bestLambdaA = lambdaA_prior;

  // 17×17 grid (±40% in 5% steps) — 289 evaluations, ~10ms total
  const steps = [];
  for (let s = -0.40; s <= 0.41; s += 0.05) steps.push(+s.toFixed(2));
  for (const dH of steps) {
    for (const dA of steps) {
      const lH = clamp(lambdaH_prior * (1 + dH), 0.2, 3.4);
      const lA = clamp(lambdaA_prior * (1 + dA), 0.2, 3.4);
      const model = computeModelHHAD(lH, lA, profileName, handicap, dispR, copRho, dcRho);
      const loss = Math.abs(model.h - target[0]) + Math.abs(model.d - target[1]) + Math.abs(model.a - target[2]);
      if (loss < bestLoss) {
        bestLoss = loss;
        bestLambdaH = lH;
        bestLambdaA = lA;
      }
    }
  }

  return {
    lambdaH: bestLambdaH,
    lambdaA: bestLambdaA,
    fitted: bestLoss < CALIBRATION_TIMEOUT,
    loss: +bestLoss.toFixed(4),
    driftH: +((bestLambdaH / lambdaH_prior - 1) * 100).toFixed(1),
    driftA: +((bestLambdaA / lambdaA_prior - 1) * 100).toFixed(1),
  };
}

function sumStates(scores) {
  const result = { h: 0, d: 0, a: 0 };
  for (const score of scores) {
    const p = Number.isFinite(score.prob) ? score.prob : 0;
    if (score.h > score.a) result.h += p;
    else if (score.h === score.a) result.d += p;
    else result.a += p;
  }
  return result;
}

function normalizeWdl(wdl) {
  const h = Math.max(0, wdl.h || 0);
  const d = Math.max(0, wdl.d || 0);
  const a = Math.max(0, wdl.a || 0);
  const total = h + d + a || 1;
  return { h: h / total, d: d / total, a: a / total };
}

function bandedWdlFromSij(sij) {
  if (sij > 1.8) return { h: 0.80, d: 0.16, a: 0.04 };
  if (sij > 1.2) return { h: 0.68, d: 0.23, a: 0.09 };
  if (sij > 0.8) return { h: 0.58, d: 0.29, a: 0.13 };
  if (sij > 0.4) return { h: 0.47, d: 0.35, a: 0.18 };
  if (sij > 0) return { h: 0.39, d: 0.38, a: 0.23 };
  if (sij > -0.4) return { h: 0.23, d: 0.38, a: 0.39 };
  if (sij > -0.8) return { h: 0.18, d: 0.35, a: 0.47 };
  if (sij > -1.2) return { h: 0.13, d: 0.29, a: 0.58 };
  return { h: 0.09, d: 0.23, a: 0.68 };
}

function eloExpected(a, b) {
  return 1 / (1 + 10 ** (-(a - b) / 400));
}

function drawPosterior(matchesPlayed, draws, p0 = 0.24, n0 = 20) {
  // r5: lower prior (0.24 vs old 0.25), light anchor (n0=20)
  // Allows rapid adaptation to real tournament draw rates
  return (n0 * p0 + draws) / (n0 + matchesPlayed);
}

function adjustedDraw(base, opts) {
  let value = base;
  if (opts.closeStrength) value += 0.04;
  if (opts.firstRound) value += 0.03;
  if (opts.lowBlock) value += 0.04;
  if (opts.weakBreakdown) value += 0.03;
  if (opts.environmentSlow) value += 0.02;
  if (opts.absSij > 1.8) value -= 0.12;
  else if (opts.absSij > 1.2) value -= 0.06;
  if (opts.eliteAttack) value -= 0.03;
  return clamp(value, 0.12, 0.42);
}

function calibrateProbability(probability) {
  let p = probability * 100;
  if (p < 5) p += 1.5;
  else if (p < 10) p += 0.8;
  else if (p < 15) p += 0.3;
  else if (p <= 25) p -= 0.5;
  else p -= 1.0;
  return clamp(p / 100, 0, 1);
}

function stateKey(home, away) {
  if (home > away) return "h";
  if (home === away) return "d";
  return "a";
}

function clamp(value, low, high) {
  return Math.max(low, Math.min(high, value));
}

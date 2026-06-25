"""
Fetch clubelo.com ratings and generate TEAM_DATA supplement for v4-engine.js
Output: club_elo_data.json — ready to merge into v4-engine.js
"""
import urllib.request, json, csv, io, re, sys
from collections import defaultdict

CLUBELO_URL = "http://api.clubelo.com/2026-06-24"
OUTPUT = "club_elo_data.json"

# ── Chinese → English name mapping (built from sporttery results + manual curation) ──
CN_EN_MAP = {
    # Premier League
    "阿森纳": "Arsenal", "曼城": "Man City", "利物浦": "Liverpool", "切尔西": "Chelsea",
    "曼联": "Man United", "热刺": "Tottenham", "纽卡斯尔": "Newcastle", "维拉": "Aston Villa",
    "布伦特": "Brentford", "伯恩茅斯": "Bournemouth", "富勒姆": "Fulham",
    "水晶宫": "Crystal Palace", "埃弗顿": "Everton", "狼队": "Wolves",
    "西汉姆联": "West Ham", "诺丁汉": "Nott'm Forest", "利兹联": "Leeds",
    "伯恩利": "Burnley", "南安普敦": "Southampton", "米堡": "Middlesbrough",
    "桑德兰": "Sunderland", "斯托克港": "Stockport",
    # La Liga
    "巴萨": "Barcelona", "皇马": "Real Madrid", "马竞": "Atletico",
    "皇家社会": "Sociedad", "毕尔巴鄂": "Athletic", "赫罗纳": "Girona",
    "贝蒂斯": "Betis", "比利亚雷": "Villarreal", "塞维利亚": "Sevilla",
    "巴伦西亚": "Valencia", "马洛卡": "Mallorca", "奥萨苏纳": "Osasuna",
    "塞尔塔": "Celta", "西班牙人": "Espanol", "巴列卡诺": "Vallecano",
    "莱万特": "Levante", "赫塔费": "Getafe", "阿拉维斯": "Alaves",
    "埃尔切": "Elche", "奥维耶多": "Oviedo",
    # Bundesliga
    "拜仁": "Bayern", "多特": "Dortmund", "莱比锡": "Leipzig", "莱红牛": "Leipzig",
    "沃夫斯堡": "Wolfsburg", "弗赖堡": "Freiburg", "科隆": "Koeln",
    "杜塞多夫": "Duesseldorf", "美因茨": "Mainz", "霍芬海姆": "Hoffenheim",
    "不来梅": "Werder", "法兰克福": "Frankfurt", "柏林联合": "Union Berlin",
    "斯图加特": "Stuttgart", "奥格斯堡": "Augsburg", "海登海姆": "Heidenheim",
    "达姆施塔特": "Darmstadt", "门兴": "M'gladbach", "汉诺威": "Hannover",
    "埃森": "Essen", "菲尔特": "Fuerth", "埃沃斯堡": "Elversberg",
    "汉堡": "Hamburg", "帕德博恩": "Paderborn",
    # Serie A
    "国际米兰": "Inter", "尤文图斯": "Juventus", "AC米兰": "Milan",
    "那不勒斯": "Napoli", "拉齐奥": "Lazio", "罗马": "Roma",
    "亚特兰大": "Atalanta", "博洛尼亚": "Bologna", "佛罗伦萨": "Fiorentina",
    "都灵": "Torino", "乌迪内斯": "Udinese", "帕尔马": "Parma",
    "热那亚": "Genoa", "莱切": "Lecce", "维罗纳": "Verona",
    "科莫": "Como", "卡利亚里": "Cagliari", "萨索洛": "Sassuolo",
    "克雷莫纳": "Cremonese", "比萨": "Pisa", "威尼": "Venezia",
    # Ligue 1
    "巴黎圣曼": "Paris SG", "摩纳哥": "Monaco", "里尔": "Lille",
    "朗斯": "Lens", "马赛": "Marseille", "里昂": "Lyon",
    "尼斯": "Nice", "欧塞尔": "Auxerre", "布雷斯特": "Brest",
    "斯特拉斯": "Strasbourg", "罗德兹": "Rodez", "阿纳西": "Annecy",
    "圣埃蒂安": "St Etienne", "圣旺红星": "Red Star",
    # Eredivisie
    "阿贾克斯": "Ajax", "费耶诺德": "Feyenoord", "埃因霍温": "Eindhoven",
    "阿尔克马": "AZ Alkmaar", "乌德勒支": "Utrecht", "格罗宁根": "Groningen",
    "奈梅亨": "Nijmegen", "瓦尔韦克": "Waalwijk", "威廉二世": "Willem II",
    "维迪斯": "Vitesse",
    # Liga Portugal
    "本菲卡": "Benfica", "波尔图": "Porto", "布拉加": "Braga",
    "阿马多拉": "Amadora", "法马利康": "Famalicao", "卡萨皮亚": "Casa Pia",
    # Saudi Pro League
    "利雅胜利": "Al Nassr", "利雅新月": "Al Hilal",
    "吉达联合": "Al Ittihad", "吉达国民": "Al Ahli",
    "布赖合作": "Al Taawon", "达马克": "Damac",
    "迈季宽广": "Al Majd", "新未来SC": "Al Fateh",
    "利雅青年": "Al Shabab", "达曼协定": "Al Ettifaq",
    "胡巴卡德": "Al Khaleej", "拉斯决心": "Al Hazm",
    # J-League
    "神户胜利": "Vissel Kobe", "川崎前锋": "Kawasaki",
    "鹿岛鹿角": "Kashima", "横滨水手": "Yokohama FM",
    "浦和红钻": "Urawa", "大阪钢巴": "Gamba Osaka",
    "广岛三箭": "Sanfrecce", "名古屋鲸": "Nagoya",
    "东京FC": "FC Tokyo", "柏太阳神": "Kashiwa",
    "清水鼓动": "Shimizu", "京都": "Kyoto", "东京绿茵": "Verdy",
    "千叶市原": "JEF Utd Chiba", "水户蜀葵": "Mito",
    "町田泽维": "Machida", "冈山绿雉": "Okayama",
    # K-League
    "蔚山现代": "Ulsan", "全北现代": "Jeonbuk",
    "首尔FC": "FC Seoul", "浦项制铁": "Pohang",
    "光州FC": "Gwangju", "仁川联": "Incheon",
    "富川FC": "Bucheon", "代格福什": "Degerfors",
    # Scandinavian
    "马尔默": "Malmo", "赫根": "Haecken", "哈马比": "Hammarby",
    "索尔纳": "AIK", "天狼星": "Sirius", "盖斯": "GAIS",
    "哈尔姆斯": "Halmstad", "埃尔夫斯堡": "Elfsborg", "埃夫斯堡": "Elfsborg",
    "卡尔马": "Kalmar", "哥德堡": "IFK Goteborg", "韦斯特罗": "Vaesteraas",
    "米亚尔比": "Mjallby",
    "罗森博格": "Rosenborg", "莫尔德": "Molde", "博德闪耀": "Bodo/Glimt",
    "布兰": "Brann", "萨普斯堡": "Sarpsborg", "瓦勒伦加": "Valerenga",
    "克里斯蒂": "Kristiansund", "桑纳菲": "Sandefjord", "斯特罗姆": "Stromsgodset",
    "维京": "Viking", "特罗姆瑟": "Tromso", "汉坎": "HamKam",
    "奥勒松": "Aalesund", "利勒斯特": "Lillestrom", "腓特烈": "Fredrikstad",
    "奥斯KFUM": "KFUM Oslo", "斯达": "Start", "海于格松": "Haugesund", "厄格里特": "Oergryte",
    # MLS
    "迈国际": "Inter Miami", "哥伦布": "Columbus", "新英格兰": "N England",
    "波特兰": "Portland", "盐湖城": "Salt Lake", "纳什维尔": "Nashville",
    "洛杉矶FC": "Los Angeles", "纽约城": "New York City",
    "蒙特利尔": "Montreal", "夏洛特FC": "Charlotte",
    "辛辛那提": "Cincinnati", "西雅图": "Seattle",
    "多伦多": "Toronto", "费城": "Philadelphia",
    "明尼苏达": "Minnesota", "圣何塞": "San Jose",
    "华盛顿": "DC United",
    # South America
    "博卡": "Boca Juniors", "河床": "River Plate",
    "弗拉门戈": "Flamengo", "帕梅拉斯": "Palmeiras",
    "科林蒂安": "Corinthians", "桑托斯": "Santos",
    "圣保罗": "Sao Paulo", "瓜拉尼": "Guarani",
    "波特诺": "Cerro Porteno", "亚自由": "Libertad",
    "德尔瓦耶": "Ind del Valle", "基多体大": "LDU Quito",
    "拉努斯": "Lanus", "拉普大学": "Estudiantes",
    "科金博联": "Coquimbo", "天主大学": "Univ Catolica",
    "水晶体育": "Sp Cristal", "大学体育": "Universitario",
    "蒙国民": "Nacional", "佩纳罗尔": "Penarol",
    "巴兰基亚": "Junior", "托利马": "Tolima",
    "圣菲独立": "Santa Fe", "米拉索尔": "Mirassol",
    "时刻准备": "Always Ready", "罗萨里奥": "Rosario",
    "中央大学": "Central Univ", "玻利瓦尔": "Bolivar",
    "里独立": "Ind del Valle",
    # Finnish (Veikkausliiga) — manual Elo estimates if not in clubelo
    "赫尔辛基": "HJK", "库奥皮奥": "KuPS", "赫尔火花": "HJK",
    "国际图尔": "Inter Turku", "塞伊奈": "SJK", "瓦萨": "VPS",
    "玛丽港": "IFK Mariehamn", "AC奥卢": "AC Oulu",
    "雅罗": "Jaro", "坦山猫": "Tampere Utd",
    "拉赫蒂": "FC Lahti", "TPS图尔": "TPS",
    # Others
    "布鲁马波": "Brommapojkarna", "索菲亚": "Sofia",
}

# ── Fetch & Parse ─────────────────────────────────────────────
print("Fetching clubelo.com ratings...")
req = urllib.request.Request(CLUBELO_URL, headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req, timeout=30) as resp:
    raw = resp.read().decode("utf-8")

reader = csv.DictReader(io.StringIO(raw))
club_elo = {}
for row in reader:
    name = row.get("Club", "").strip()
    elo = float(row.get("Elo", 0))
    country = row.get("Country", "").strip()
    level = row.get("Level", "1")
    if name and elo > 0:
        club_elo[name] = {"elo": round(elo, 0), "country": country, "level": level}

print(f"Fetched {len(club_elo)} clubs from clubelo.com")

# ── Build TEAM_DATA supplement ────────────────────────────────
database = {}
unmatched = []
for cn_name, en_name in sorted(CN_EN_MAP.items()):
    if en_name in club_elo:
        elo = club_elo[en_name]["elo"]
        country = club_elo[en_name]["country"]
        # Map to confederation
        confed_map = {"ENG": "UEFA", "ESP": "UEFA", "GER": "UEFA", "ITA": "UEFA",
                      "FRA": "UEFA", "POR": "UEFA", "NED": "UEFA", "SCO": "UEFA",
                      "BEL": "UEFA", "SWE": "UEFA", "NOR": "UEFA", "DEN": "UEFA",
                      "BRA": "CONMEBOL", "ARG": "CONMEBOL", "URU": "CONMEBOL",
                      "USA": "CONCACAF", "MEX": "CONCACAF", "JPN": "AFC",
                      "KOR": "AFC", "KSA": "AFC", "CHN": "AFC", "AUS": "AFC",
                      "RSA": "CAF", "EGY": "CAF", "NZL": "OFC"}
        confed = confed_map.get(country, "UEFA")
        archetype = "mid-tier"
        if elo >= 1850: archetype = "elite-finisher"
        elif elo >= 1750: archetype = "high-depth"
        database[f"club_{en_name.lower().replace(' ','_')}"] = {
            "elo": int(elo), "fifa": 999, "confed": confed, "archetype": archetype,
            "chinese_name": cn_name, "origin": "clubelo.com"
        }
    else:
        unmatched.append(f"{cn_name} → {en_name}")

print(f"Matched: {len(database)}, Unmatched: {len(unmatched)}")
if unmatched:
    print("Unmatched clubs (need manual mapping):")
    for u in unmatched[:20]:
        print(f"  {u}")

# ── Output ────────────────────────────────────────────────────
# Generate compact JSON for embedding in v4-engine.js
output = {
    "source": "clubelo.com 2026-06-24",
    "club_count": len(database),
    "aliases": {},  # CN → en key mapping
    "teams": database,
}

# Build aliases
for key, data in database.items():
    output["aliases"][data["chinese_name"]] = key

with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"\nWritten {len(database)} clubs to {OUTPUT}")

# ── Generate JS snippet ───────────────────────────────────────
js_lines = ["// Auto-generated from clubelo.com", "const CLUB_ELO_DATA = {"]
for key, data in sorted(database.items()):
    js_lines.append(f'  "{data["chinese_name"]}": {{ elo: {data["elo"]}, fifa: 999, confed: "{data["confed"]}", archetype: "{data["archetype"]}" }},')
js_lines.append("};")
js_snippet = "\n".join(js_lines)

with open("club_elo_data.js", "w", encoding="utf-8") as f:
    f.write(js_snippet)
print(f"JS snippet: club_elo_data.js ({len(database)} entries)")

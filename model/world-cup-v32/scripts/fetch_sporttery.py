#!/usr/bin/env python3
"""竞彩网官方 API 数据抓取模块

数据源: https://m.sporttery.cn/mjc/jsq/zqspf/
API: webapi.sporttery.cn/gateway/uniform/football/getMatchCalculatorV1.qry

用法:
  python scripts/fetch_sporttery.py              # 抓取当前可售赛事
  python scripts/fetch_sporttery.py --json       # 输出原始JSON
  python scripts/fetch_sporttery.py --summary    # 输出摘要表格
  python scripts/fetch_sporttery.py --save       # 保存到 references/live-matches.json
"""

import json
import sys
import os
import argparse
import urllib.request
import urllib.error
from datetime import datetime

API_URL = "https://webapi.sporttery.cn/gateway/uniform/football/getMatchCalculatorV1.qry"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://m.sporttery.cn/",
    "Accept": "application/json, text/plain, */*",
}

# 球队名称映射 (竞彩缩写 → 标准名称)
TEAM_NAME_MAP = {
    "阿根廷": "Argentina", "法国": "France", "德国": "Germany",
    "英格兰": "England", "荷兰": "Netherlands", "挪威": "Norway",
    "葡萄牙": "Portugal", "西班牙": "Spain", "比利时": "Belgium",
    "乌拉圭": "Uruguay", "巴西": "Brazil", "哥伦比亚": "Colombia",
    "摩洛哥": "Morocco", "克罗地亚": "Croatia", "埃及": "Egypt",
    "日本": "Japan", "韩国": "Korea", "伊朗": "Iran",
    "塞内加尔": "Senegal", "科特迪瓦": "Ivory Coast", "刚果": "DR Congo",
    "巴拿马": "Panama", "佛得角": "Cape Verde", "加纳": "Ghana",
    "奥地利": "Austria", "瑞士": "Switzerland", "瑞典": "Sweden",
    "美国": "USA", "墨西哥": "Mexico", "加拿大": "Canada",
    "澳大利亚": "Australia", "新西兰": "New Zealand", "沙特": "Saudi Arabia",
    "卡塔尔": "Qatar", "伊拉克": "Iraq", "约旦": "Jordan",
    "乌兹别克": "Uzbekistan", "阿尔及利亚": "Algeria", "突尼斯": "Tunisia",
    "土耳其": "Turkey", "波黑": "Bosnia", "苏格兰": "Scotland",
    "捷克": "Czechia", "巴拉圭": "Paraguay", "厄瓜多尔": "Ecuador",
    "南非": "South Africa", "海地": "Haiti", "库拉索": "Curacao",
    "阿联酋": "UAE", "中国": "China", "喀麦隆": "Cameroon",
    "尼日利亚": "Nigeria", "智利": "Chile", "秘鲁": "Peru",
    "丹麦": "Denmark", "意大利": "Italy", "希腊": "Greece",
    "波兰": "Poland", "俄罗斯": "Russia", "威尔士": "Wales",
    "乌克兰": "Ukraine", "塞尔维亚": "Serbia", "罗马尼亚": "Romania",
    "斯洛伐克": "Slovakia", "匈牙利": "Hungary", "保加利亚": "Bulgaria",
    "爱尔兰": "Ireland", "北爱尔兰": "Northern Ireland", "挪威": "Norway",
    "芬兰": "Finland", "冰岛": "Iceland",
}

# 反向映射: 英文名 → 中文名
EN_TO_CN = {v: k for k, v in TEAM_NAME_MAP.items()}


def fetch_matches(page: int = 1) -> dict:
    """从竞彩网API获取赛事数据"""
    url = f"{API_URL}?matchPage={page}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.URLError as e:
        print(f"API请求失败: {e}", file=sys.stderr)
        return {"success": False, "errorMessage": str(e)}
    except json.JSONDecodeError as e:
        print(f"JSON解析失败: {e}", file=sys.stderr)
        return {"success": False, "errorMessage": f"JSON decode error: {e}"}


def resolve_team_name(chinese_name: str, english_abbr: str = "") -> str:
    """将中文队名解析为标准英文名"""
    if chinese_name in TEAM_NAME_MAP:
        return TEAM_NAME_MAP[chinese_name]
    # 尝试模糊匹配
    for cn, en in TEAM_NAME_MAP.items():
        if cn in chinese_name or chinese_name in cn:
            return en
    # 回退: 使用英文缩写
    if english_abbr and len(english_abbr) == 3:
        return english_abbr
    return chinese_name


def parse_matches(raw_data: dict) -> list[dict]:
    """解析API返回的比赛数据为标准格式"""
    if not raw_data.get("success", True):
        return []

    value = raw_data.get("value", {})
    matches = []

    for match_group in value.get("matchInfoList", []):
        match_date = match_group.get("matchNumDate", "")
        for sub in match_group.get("subMatchList", []):
            home_cn = sub.get("homeTeamAbbName", "")
            away_cn = sub.get("awayTeamAbbName", "")
            home_en = sub.get("homeTeamAbbEnName", "")
            away_en = sub.get("awayTeamAbbEnName", "")

            had = sub.get("had", {})
            hhad = sub.get("hhad", {})

            # 解析各玩法单关/过关状态
            betting_single = False
            pool_single = {}  # 每个玩法的单关状态
            for pool in sub.get("poolList", []):
                code = pool.get("poolCode", "")
                is_single = pool.get("bettingSingle", 0) == 1
                is_allup = pool.get("bettingAllup", 0) == 1
                pool_single[code] = {
                    "single": is_single,  # 是否开售单关
                    "allUp": is_allup,    # 是否开售过关
                    "status": pool.get("poolStatus", ""),
                }
                if code == "HAD" and is_single:
                    betting_single = True

            # 解析盘口
            goal_line = hhad.get("goalLine", "")
            goal_line_value = hhad.get("goalLineValue", "")

            # 半全场 (HAFU: 9种组合)
            hafu_raw = sub.get("hafu", {})
            hafu = {}
            hafu_keys = ["hh","hd","ha","dh","dd","da","ah","ad","aa"]
            for k in hafu_keys:
                hafu[k] = float(hafu_raw.get(k, 0)) if hafu_raw.get(k) else 0

            # 比分 (CRS: 31种比分)
            crs_raw = sub.get("crs", {})
            crs = {}
            for k, v in crs_raw.items():
                if k.startswith("s") and not k.endswith("f") and k != "goalLine" and k != "goalLineValue":
                    try:
                        crs[k] = float(v)
                    except (ValueError, TypeError):
                        pass

            # 总进球 (TTG: 0-7+)
            ttg_raw = sub.get("ttg", {})
            ttg = {}
            for k in ["s0","s1","s2","s3","s4","s5","s6","s7"]:
                ttg[k] = float(ttg_raw.get(k, 0)) if ttg_raw.get(k) else 0

            match = {
                "matchId": sub.get("matchId", 0),
                "matchNumStr": sub.get("matchNumStr", ""),
                "matchDate": sub.get("matchDate", ""),
                "matchTime": sub.get("matchTime", ""),
                "leagueName": sub.get("leagueAbbName", ""),
                "homeTeam": resolve_team_name(home_cn, home_en),
                "awayTeam": resolve_team_name(away_cn, away_en),
                "homeTeamCn": home_cn,
                "awayTeamCn": away_cn,
                "homeTeamCode": home_en,
                "awayTeamCode": away_en,
                "matchStatus": sub.get("matchStatus", ""),
                # HAD 赔率 (胜/平/负)
                "had": {
                    "home": float(had.get("h", 0)),
                    "draw": float(had.get("d", 0)),
                    "away": float(had.get("a", 0)),
                },
                # 让球盘
                "handicap": {
                    "goalLine": goal_line,
                    "goalLineValue": goal_line_value,
                    "home": float(hhad.get("h", 0)) if hhad.get("h") else 0,
                    "draw": float(hhad.get("d", 0)) if hhad.get("d") else 0,
                    "away": float(hhad.get("a", 0)) if hhad.get("a") else 0,
                },
                # 半全场 (9种)
                "hafu": hafu,
                # 比分 (31种)
                "crs": crs,
                # 总进球 (0-7+)
                "ttg": ttg,
                "bettingSingle": betting_single,
                "poolSingle": pool_single,  # 各玩法独立单关状态
                "remark": sub.get("remark", ""),
            }
            matches.append(match)

    return matches


def implied_probability(odds: float) -> float:
    """从赔率反推隐含概率 (去水简化版)"""
    if odds <= 0:
        return 0.0
    return 1.0 / odds


def de_vig(home_odds: float, draw_odds: float, away_odds: float) -> dict:
    """去水: 将赔率转为真实概率"""
    if home_odds <= 0 or draw_odds <= 0 or away_odds <= 0:
        return {"home": 0.33, "draw": 0.34, "away": 0.33}

    raw = {
        "home": implied_probability(home_odds),
        "draw": implied_probability(draw_odds),
        "away": implied_probability(away_odds),
    }
    overround = raw["home"] + raw["draw"] + raw["away"]

    return {
        "home": round(raw["home"] / overround, 4),
        "draw": round(raw["draw"] / overround, 4),
        "away": round(raw["away"] / overround, 4),
    }


def format_summary(matches: list[dict]) -> str:
    """格式化比赛摘要表格"""
    lines = []
    lines.append(f"\n{'='*100}")
    lines.append(f"  竞彩足球胜平负 — 实时数据 (更新于 {datetime.now().strftime('%Y-%m-%d %H:%M')})")
    lines.append(f"{'='*100}")
    lines.append(f"{'编号':<10} {'开赛':<16} {'主队':<14} {'客队':<14} {'胜赔':>6} {'平赔':>6} {'负赔':>6} {'让球':>5} {'单关(HAD/让球/半全/比分/进球)':>30}")
    lines.append(f"{'-'*100}")

    for m in matches:
        had = m["had"]
        hcap = m["handicap"]
        gl = hcap.get("goalLine", "")
        ps = m.get("poolSingle", {})
        single_parts = []
        for code in ["HAD", "HHAD", "HAFU", "CRS", "TTG"]:
            info = ps.get(code, {})
            single_parts.append("Y" if info.get("single") else "N")
        single_str = "/".join(single_parts)
        lines.append(
            f"{m['matchNumStr']:<10} {m['matchDate']} {m['matchTime']:<5} "
            f"{m['homeTeam']:<14} {m['awayTeam']:<14} "
            f"{had['home']:>6.2f} {had['draw']:>6.2f} {had['away']:>6.2f} "
            f"{gl:>5} {single_str:>30}"
        )

    lines.append(f"{'-'*100}")
    lines.append(f"  共 {len(matches)} 场比赛 | 单关列: HAD/让球/半全场/比分/总进球")
    lines.append(f"{'='*100}\n")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="竞彩网官方数据抓取")
    parser.add_argument("--json", action="store_true", help="输出原始JSON")
    parser.add_argument("--summary", action="store_true", help="输出摘要表格")
    parser.add_argument("--save", action="store_true", help="保存到references目录")
    parser.add_argument("--page", type=int, default=1, help="分页页码")
    parser.add_argument("--de-vig", action="store_true", help="输出去水概率")
    parser.add_argument("--hafu", action="store_true", help="展示半全场赔率")
    parser.add_argument("--crs", action="store_true", help="展示比分赔率Top5")
    args = parser.parse_args()

    raw = fetch_matches(args.page)

    if args.json:
        print(json.dumps(raw, ensure_ascii=False, indent=2))
        return

    matches = parse_matches(raw)

    if args.de_vig:
        for m in matches:
            prob = de_vig(m["had"]["home"], m["had"]["draw"], m["had"]["away"])
            m["impliedProbability"] = prob

    if args.summary:
        print(format_summary(matches))
        # Also show de-vigged probabilities
        if args.de_vig:
            for m in matches:
                p = m["impliedProbability"]
                print(f"  {m['homeTeam']} vs {m['awayTeam']}: 胜{p['home']:.1%} 平{p['draw']:.1%} 负{p['away']:.1%}")

        # 如果指定了 --hafu，展示半全场赔率
        if getattr(args, 'hafu', False):
            print("\n=== 半全场赔率 (HAFU) ===")
            hafu_labels = {
                "hh": "胜胜", "hd": "胜平", "ha": "胜负",
                "dh": "平胜", "dd": "平平", "da": "平负",
                "ah": "负胜", "ad": "负平", "aa": "负负",
            }
            for m in matches:
                hafu = m.get("hafu", {})
                if hafu and hafu.get("hh", 0) > 0:
                    parts = []
                    for k in ["hh","hd","ha","dh","dd","da","ah","ad","aa"]:
                        if hafu.get(k, 0) > 0:
                            parts.append(f"{hafu_labels[k]}={hafu[k]:.2f}")
                    if parts:
                        print(f"  {m['homeTeam']} vs {m['awayTeam']}: {', '.join(parts)}")
    if args.save:
        # 保存到 references 目录
        script_dir = os.path.dirname(os.path.abspath(__file__))
        ref_dir = os.path.join(os.path.dirname(script_dir), "references")
        os.makedirs(ref_dir, exist_ok=True)

        # 保存原始数据
        raw_path = os.path.join(ref_dir, "live-matches-raw.json")
        with open(raw_path, "w", encoding="utf-8") as f:
            json.dump(raw, f, ensure_ascii=False, indent=2)

        # 保存解析后数据
        parsed_path = os.path.join(ref_dir, "live-matches.json")
        output = {
            "fetchedAt": datetime.now().isoformat(),
            "source": "https://webapi.sporttery.cn/gateway/uniform/football/getMatchCalculatorV1.qry",
            "webPage": "https://m.sporttery.cn/mjc/jsq/zqspf/",
            "matchCount": len(matches),
            "matches": matches,
        }
        with open(parsed_path, "w", encoding="utf-8") as f:
            json.dump(output, f, ensure_ascii=False, indent=2)

        print(f"[OK] 数据已保存:")
        print(f"   原始: {raw_path}")
        print(f"   解析: {parsed_path}")
        print(f"   共 {len(matches)} 场比赛")

    # 默认: 如果没有指定 summary/save/json, 输出解析后的JSON
    if not args.summary and not args.save and not args.json:
        print(json.dumps({"matchCount": len(matches), "matches": matches}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

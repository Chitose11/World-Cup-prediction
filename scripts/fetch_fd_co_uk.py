"""
Phase 1: Fetch football-data.co.uk CSV data for V4 Proxy Backtest
MVP: 2022-23 Premier League (380 matches)
Full: 5 leagues × 5 years (~10,000 matches)
"""
import urllib.request, csv, io, os, sys, zipfile
from pathlib import Path

# ── Config ──────────────────────────────────────────────────
OUT_DIR = Path(__file__).parent.parent.parent / "omega-copula-engine" / "fd_data"
BASE_URL = "https://www.football-data.co.uk/mmz4281"

# MVP: Premier League 22-23 only
# Full would include all leagues 21-26
LEAGUES = {
    "E0": "Premier League",
    "SP1": "La Liga",
    "D1": "Bundesliga",
    "I1": "Serie A",
    "F1": "Ligue 1",
}

# First pass: MVP only
SEASONS_MVP = ["2223"]
SEASONS_FULL = ["2122", "2223", "2324", "2425", "2526"]

# ── Column mapping ──────────────────────────────────────────
# Target columns (unify across different CSV formats)
COL_MAP = {
    "Div": "league",
    "Date": "date",
    "HomeTeam": "home",
    "AwayTeam": "away",
    "FTHG": "fthg",
    "FTAG": "ftag",
    "HTHG": "hthg",
    "HTAG": "htag",
    "B365H": "b365h", "B365D": "b365d", "B365A": "b365a",
    # Asian handicap (football-data.co.uk format since ~2019)
    "AHh": "bbah",
    "B365AHH": "bbahh",
    "B365AHA": "bbaha",
    # Fallback: market average
    "AvgAHH": "avg_ahh",
    "AvgAHA": "avg_aha",
}

def fetch_csv(league, season):
    """Download a single league-season CSV"""
    url = f"{BASE_URL}/{season}/{league}.csv"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read()
            return raw.decode("latin-1", errors="replace")  # football-data uses latin-1
    except Exception as e:
        print(f"  [ERR] {league}/{season}: {e}", file=sys.stderr)
        return None

def parse_row(row, season):
    """Extract unified columns from a CSV row"""
    out = {"season": season}
    for src, dst in COL_MAP.items():
        if src in row:
            try:
                val = row[src].strip()
                if dst in ("fthg", "ftag", "hthg", "htag"):
                    out[dst] = int(val) if val else None
                elif dst in ("b365h", "b365d", "b365a", "bbah", "bbahh", "bbaha"):
                    out[dst] = float(val) if val else None
                else:
                    out[dst] = val
            except (ValueError, TypeError):
                out[dst] = None

    # Validate AH data
    if "bbahh" in out and "bbaha" in out and out["bbahh"] and out["bbaha"]:
        out["valid_ah"] = True
    else:
        out["valid_ah"] = False

    return out

def clean_and_validate(rows):
    """Remove rows with missing critical data, validate format"""
    clean = []
    stats = {"total": len(rows), "no_score": 0, "no_b365": 0, "no_ah": 0, "valid": 0}

    for r in rows:
        # Must have score
        if r.get("fthg") is None or r.get("ftag") is None:
            stats["no_score"] += 1
            continue
        # Must have B365 odds
        if r.get("b365h") is None or r.get("b365d") is None or r.get("b365a") is None:
            stats["no_b365"] += 1
            continue
        # Must have AH data
        if not r.get("valid_ah"):
            stats["no_ah"] += 1
            continue

        stats["valid"] += 1
        clean.append(r)

    return clean, stats

def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    all_rows = []

    print("Phase 1 MVP: 2022-23 Premier League (380 matches)")
    print("=" * 55)

    mvp_leagues = {"E0": "Premier League"}  # MVP: only PL for now
    for league_code, league_name in mvp_leagues.items():
        for season in SEASONS_MVP:
            label = f"{league_name} {season}"
            print(f"  Fetching {label}...", end=" ")
            csv_text = fetch_csv(league_code, season)
            if not csv_text:
                print("FAILED")
                continue

            reader = csv.DictReader(io.StringIO(csv_text))
            rows = []
            for row in reader:
                parsed = parse_row(row, season)
                parsed["league"] = league_name
                parsed["league_code"] = league_code
                rows.append(parsed)

            clean, stats = clean_and_validate(rows)
            print(f"{len(rows)} raw → {stats['valid']} valid "
                  f"(no_score:{stats['no_score']} no_b365:{stats['no_b365']} no_ah:{stats['no_ah']})")

            all_rows.extend(clean)

            # Save per-league clean CSV
            out_file = OUT_DIR / f"{league_code}_{season}_clean.csv"
            if clean:
                fieldnames = ["season", "league", "date", "home", "away",
                              "fthg", "ftag", "hthg", "htag",
                              "b365h", "b365d", "b365a",
                              "bbah", "bbahh", "bbaha"]
                with open(out_file, "w", newline="", encoding="utf-8") as f:
                    writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
                    writer.writeheader()
                    writer.writerows(clean)
                print(f"    → {out_file}")

    # ── Summary ──────────────────────────────────────────────
    print(f"\n{'='*55}")
    print(f"Total valid matches: {len(all_rows)}")

    if all_rows:
        # Merge all into single CSV
        merged = OUT_DIR / "mvp_premier_league_2223.csv"
        fieldnames = ["season", "league", "date", "home", "away",
                      "fthg", "ftag", "hthg", "htag",
                      "b365h", "b365d", "b365a",
                      "bbah", "bbahh", "bbaha"]
        with open(merged, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
            writer.writeheader()
            writer.writerows(all_rows)
        print(f"Merged CSV: {merged}")

        # Quick stats
        goals = [r["fthg"] + r["ftag"] for r in all_rows]
        print(f"Avg goals per match: {sum(goals)/len(goals):.2f}")
        home_wins = sum(1 for r in all_rows if r["fthg"] > r["ftag"])
        draws = sum(1 for r in all_rows if r["fthg"] == r["ftag"])
        away_wins = sum(1 for r in all_rows if r["fthg"] < r["ftag"])
        print(f"WDL: {home_wins}/{draws}/{away_wins} "
              f"({home_wins/len(all_rows)*100:.1f}%/{draws/len(all_rows)*100:.1f}%/{away_wins/len(all_rows)*100:.1f}%)")

    # Check AH diversity
    ah_lines = set()
    for r in all_rows:
        if r.get("bbah") is not None:
            ah_lines.add(r["bbah"])
    print(f"Unique AH lines: {len(ah_lines)} — {sorted(ah_lines)[:10]} ...")

if __name__ == "__main__":
    main()

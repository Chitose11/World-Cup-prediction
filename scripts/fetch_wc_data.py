"""
Phase 1: Fetch World Cup / Euro historical data
MVP: 2022 World Cup (64 matches)
Source: football-data.co.uk mmz4281 archive (has B365 odds + AH)
"""
import urllib.request, csv, io, os, sys
from pathlib import Path

OUT_DIR = Path(__file__).parent.parent.parent / "omega-copula-engine" / "wc_data"
BASE = "https://www.football-data.co.uk"

TOURNAMENTS = [
    ("mmz4281/2223/WC.csv", "World Cup 2022"),
    ("mmz4281/1819/WC.csv", "World Cup 2018"),
    ("mmz4281/1415/WC.csv", "World Cup 2014"),
    ("mmz4281/2021/Euro.csv", "Euro 2020"),
    ("mmz4281/1617/Euro.csv", "Euro 2016"),
]

COL_MAP = {
    "Date": "date", "HomeTeam": "home", "AwayTeam": "away",
    "FTHG": "fthg", "FTAG": "ftag", "HTHG": "hthg", "HTAG": "htag",
    "B365H": "b365h", "B365D": "b365d", "B365A": "b365a",
    "PSH": "ps_h", "PSD": "ps_d", "PSA": "ps_a",
    "AHh": "ah_line", "B365AHH": "b365_ahh", "B365AHA": "b365_aha",
}

def fetch_csv(path):
    req = urllib.request.Request(f"{BASE}/{path}", headers={"User-Agent":"Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("latin-1", errors="replace")

def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    all_rows = []

    # MVP: 2022 World Cup only
    for path, label in TOURNAMENTS[:1]:
        print(f"Fetching {label}...", end=" ")
        raw = fetch_csv(path)
        reader = csv.DictReader(io.StringIO(raw))
        rows = []
        for row in reader:
            r = {"tournament": label}
            for src, dst in COL_MAP.items():
                if src in row:
                    try:
                        val = row[src].strip()
                        if dst in ("fthg","ftag","hthg","htag","ah_line"):
                            r[dst] = float(val) if val else None
                        elif dst.startswith("b365") or dst.startswith("ps_"):
                            r[dst] = float(val) if val else None
                        else:
                            r[dst] = val
                    except ValueError:
                        r[dst] = None
            if r.get("fthg") is None or r.get("ftag") is None: continue
            if not r.get("b365h") or not r.get("b365d") or not r.get("b365a"): continue
            rows.append(r)
        print(f"{len(rows)} valid")
        all_rows.extend(rows)

    if all_rows:
        out = OUT_DIR / "wc2022_mvp.csv"
        with open(out, "w", newline="", encoding="utf-8") as f:
            fields = ["tournament","date","home","away","fthg","ftag","hthg","htag",
                      "b365h","b365d","b365a","ps_h","ps_d","ps_a","ah_line","b365_ahh","b365_aha"]
            w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
            w.writeheader()
            w.writerows(all_rows)
        print(f"Output: {out}")

        goals = sum(r["fthg"]+r["ftag"] for r in all_rows)
        home = sum(1 for r in all_rows if r["fthg"]>r["ftag"])
        draw = sum(1 for r in all_rows if r["fthg"]==r["ftag"])
        away = sum(1 for r in all_rows if r["fthg"]<r["ftag"])
        print(f"Avg goals: {goals/len(all_rows):.2f}  WDL: {home}/{draw}/{away}")

if __name__ == "__main__":
    main()

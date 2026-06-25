"""
Fetch historical HHAD odds from 500.com
URL pattern: trade.500.com/jczq/index.php?date=YYYY-MM-DD&playid=269
"""
import urllib.request, re, json, sys, time
from datetime import datetime, timedelta

def fetch_page(date_str):
    url = f"https://trade.500.com/jczq/index.php?date={date_str}&g=2&playid=269"
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode("gb2312", errors="replace")
            return html
    except Exception as e:
        print(f"  [ERR] {date_str}: {e}", file=sys.stderr)
        return None

def parse_matches(html):
    """Extract HHAD data from 500.com HTML"""
    if not html:
        return []

    # Pattern: team names, handicap line, odds
    # Match blocks look like: [rank]home VS away [rank] ... handicap ... odds
    matches = []

    # Find match table rows
    # Each match block starts with a team pattern like "瑞士 VS加拿大"
    team_pattern = re.compile(r'(\S+)\s*VS\s*(\S+)')
    # Find handicap lines: numbers after team block, before odds
    handicap_pattern = re.compile(r'([+-]\d+)')

    # Split by match blocks
    blocks = re.split(r'\[(\d+)\]', html)

    i = 0
    while i < len(blocks):
        # Look for team pattern
        m = team_pattern.search(blocks[i] if i < len(blocks) else "")
        if m:
            home = m.group(1).strip()
            away = m.group(2).strip()

            # Search forward for handicap and odds
            combined = " ".join(blocks[i:i+10])

            # Extract handicap
            hc = handicap_pattern.search(combined)
            handicap = int(hc.group(1)) if hc else 0

            # Extract odds: 6 decimal numbers after handicap
            # The HHAD odds appear as 6 numbers
            odds_pattern = re.compile(r'(\d+\.\d{2})')
            all_odds = odds_pattern.findall(combined)

            if len(all_odds) >= 6:
                # First 3 = main HHAD odds
                hhad_odds = [float(x) for x in all_odds[:3]]
                matches.append({
                    "home": home,
                    "away": away,
                    "handicap": handicap,
                    "hhad": hhad_odds,
                })

        i += 1

    return matches

def main():
    today = datetime(2026, 6, 25)
    all_data = {}

    # Fetch last 30 days
    for days_ago in range(0, 30):
        date = today - timedelta(days=days_ago)
        date_str = date.strftime("%Y-%m-%d")
        print(f"Fetching {date_str}...", end=" ")

        html = fetch_page(date_str)
        matches = parse_matches(html)

        print(f"{len(matches)} matches")
        if matches:
            all_data[date_str] = matches

        time.sleep(0.5)  # be polite

    # Save
    output_file = "hhad_history_500.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump({
            "source": "500.com historical HHAD",
            "fetched_at": today.isoformat(),
            "data": all_data,
        }, f, ensure_ascii=False, indent=2)

    total = sum(len(v) for v in all_data.values())
    print(f"\nDone. {len(all_data)} days, {total} matches → {output_file}")

if __name__ == "__main__":
    main()

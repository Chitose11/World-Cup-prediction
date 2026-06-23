// AnySport live data service — backend proxy (never expose API key to frontend)
// API docs: https://docs.anysport.io/zh-Hans/

const API_KEY = process.env.ANYSPORT_API_KEY || "";
const BASE_URL = "https://api.anysport.io/v1";

async function fetchAnySport(path, params = {}) {
  if (!API_KEY) throw new Error("ANYSPORT_API_KEY not configured");
  const url = new URL(BASE_URL + path);
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null) url.searchParams.set(k, String(v)); });
  const response = await fetch(url, {
    headers: { "Authorization": `Bearer ${API_KEY}`, "Accept": "application/json" },
  });
  if (!response.ok) throw new Error(`AnySport HTTP ${response.status}: ${await response.text().catch(() => "")}`);
  return response.json();
}

// Polling state machine
const pollState = new Map(); // matchId → { active, lastPoll, interval }

function getSmartInterval(status) {
  // status codes from AnySport: 1=not started, 2=live, 3=finished, 12=half-time
  if (status === 12) return 5 * 60 * 1000;   // half-time: 5 min
  if (status === 3 || status === 1) return 0;  // finished/not-started: don't poll
  return 20 * 1000;  // live: 20 seconds
}

export async function getLiveMatch(matchId) {
  try {
    const data = await fetchAnySport("/football/match/live", { match_id: matchId });
    return { ok: true, match: data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function getLiveMatches(leagueId = "") {
  try {
    const params = {};
    if (leagueId) params.league_id = leagueId;
    const data = await fetchAnySport("/football/match/live", params);
    return {
      ok: true,
      matches: Array.isArray(data) ? data : (data?.matches || data?.data || []),
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return { ok: false, error: error.message, matches: [] };
  }
}

export function getAPIConfigured() {
  return !!API_KEY;
}

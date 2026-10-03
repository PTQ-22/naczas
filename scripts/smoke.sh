#!/usr/bin/env bash
# Smoke test of a deployed (or local) NaCzas API and web build.
#   ./scripts/smoke.sh <API_URL> [WEB_URL]
#   ./scripts/smoke.sh https://naczas-api.onrender.com https://naczas.vercel.app
# Requires only bash, curl and jq. Exit code = number of failed checks (0 = all green).
set -uo pipefail

if [ $# -lt 1 ]; then
  echo "usage: $0 <API_URL> [WEB_URL]" >&2
  exit 2
fi
command -v jq >/dev/null || { echo "jq is required (brew install jq / apt install jq)" >&2; exit 2; }

API="${1%/}"
WEB="${2:-}"
WEB="${WEB%/}"
# Generous timeout: a sleeping free Render instance needs ~1 min to wake up.
CURL=(curl -sS --max-time 90 -o /dev/stdout -w '\n%{http_code}')
FAILED=0

pass() { echo "✅ $1"; }
fail() { echo "❌ $1"; FAILED=$((FAILED + 1)); }

# Sets BODY and STATUS for a GET request.
get() {
  local out
  out="$("${CURL[@]}" "$1" 2>/dev/null)" || { BODY=""; STATUS="000"; return; }
  STATUS="${out##*$'\n'}"
  BODY="${out%$'\n'*}"
}

# check <name> <jq filter that must be true>
check() {
  if [ "$STATUS" = "200" ] && echo "$BODY" | jq -e "$2" >/dev/null 2>&1; then
    pass "$1"
  else
    fail "$1 (HTTP $STATUS: $(echo "$BODY" | head -c 200))"
  fi
}

echo "API: $API"

get "$API/v1/health"
check "GET /v1/health → ok" '.ok == true and (.nfz == "up" or .nfz == "down") and (.snapshotAsOf | type == "string")'

get "$API/v1/wait-times?examId=colonoscopy_screening&province=07"
# Snapshot of 2026-10-03 gives exactly p75 = 213 days (same as the pitch slide); live NFZ
# data changes monthly, so then only a positive value is required.
check "GET /v1/wait-times colonoscopy/07 (no location) → p75 213 from snapshot, > 0 live" \
  '.examId == "colonoscopy_screening" and .province == "07" and .radiusKm == 0 and
   (if .source == "nfz_snapshot" then .p75Days == 213 else .p75Days > 0 end)'
[ "$STATUS" = "200" ] && echo "   source=$(echo "$BODY" | jq -r .source) p50=$(echo "$BODY" | jq -r .p50Days) p75=$(echo "$BODY" | jq -r .p75Days)"

get "$API/v1/facilities?examId=colonoscopy_screening&province=07&lat=52.23&lng=21.01&sort=soonest"
check "GET /v1/facilities colonoscopy/Warsaw sort=soonest → ≥ 1 facility, waits ascending" \
  '(.items | length) >= 1 and
   ([.items[].waitDays | select(. != null)] as $w | $w == ($w | sort))'

get "$API/v1/wait-times?examId=mammography&province=07"
if [ "$STATUS" = "400" ] && echo "$BODY" | jq -e '.error.code == "unknown_exam"' >/dev/null 2>&1; then
  pass "GET /v1/wait-times mammography → 400 unknown_exam"
else
  fail "GET /v1/wait-times mammography → 400 unknown_exam (HTTP $STATUS)"
fi

if [ -n "$WEB" ]; then
  echo "WEB: $WEB"
  for path in / /plan; do
    get "$WEB$path"
    if [ "$STATUS" = "200" ] && echo "$BODY" | grep -qi '<html'; then
      pass "GET $path → 200 HTML (SPA fallback)"
    else
      fail "GET $path → 200 HTML (HTTP $STATUS)"
    fi
  done
fi

echo
if [ "$FAILED" -eq 0 ]; then echo "All checks passed."; else echo "$FAILED check(s) failed."; fi
exit "$FAILED"

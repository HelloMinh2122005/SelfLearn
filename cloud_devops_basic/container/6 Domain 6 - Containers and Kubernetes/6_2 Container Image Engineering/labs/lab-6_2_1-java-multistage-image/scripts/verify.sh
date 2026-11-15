#!/usr/bin/env bash
# Verify lab 6_2_1: optimized multi-stage Java image.
set -uo pipefail

FAILED=0
pass() { echo "[PASS] $1"; }
fail() { echo "[FAIL] $1"; FAILED=1; }

if [[ -z "${ENGINE:-}" ]]; then
  if command -v podman >/dev/null 2>&1; then ENGINE=podman; else ENGINE=docker; fi
fi
OPT="hello-svc-lab:optimized"
NAIVE="hello-svc-lab:naive"
NAME="v-opt"
PORT=18094

if ! "${ENGINE}" image inspect "${OPT}" >/dev/null 2>&1; then
  fail "Image ${OPT} not found (build it in step 4)"
  exit 1
fi
pass "Image ${OPT} exists"

size_of() { "${ENGINE}" image inspect "$1" --format '{{.Size}}'; }
if "${ENGINE}" image inspect "${NAIVE}" >/dev/null 2>&1; then
  S_OPT="$(size_of "${OPT}")"; S_NAIVE="$(size_of "${NAIVE}")"
  if (( S_OPT < S_NAIVE )); then
    pass "Optimized image is smaller than the naive image ($((S_OPT / 1000000)) MB < $((S_NAIVE / 1000000)) MB)"
  else
    fail "Optimized image ($((S_OPT / 1000000)) MB) is not smaller than naive ($((S_NAIVE / 1000000)) MB)"
  fi
else
  fail "Image ${NAIVE} not found (build it in step 2 to compare)"
fi

"${ENGINE}" rm -f "${NAME}" >/dev/null 2>&1
trap '"${ENGINE}" rm -f "${NAME}" >/dev/null 2>&1' EXIT
"${ENGINE}" run -d --name "${NAME}" -p "${PORT}:8080" "${OPT}" >/dev/null

CODE=000
for _ in $(seq 1 20); do
  CODE="$(curl -s -o /dev/null -w '%{http_code}' "localhost:${PORT}/" || true)"
  [[ "${CODE}" == "200" ]] && break
  sleep 1
done

UID_IN="$("${ENGINE}" exec "${NAME}" id -u 2>/dev/null)"
[[ -n "${UID_IN}" && "${UID_IN}" != "0" ]] && pass "Container runs as a non-root UID (${UID_IN})" \
  || fail "Container runs as root (uid=${UID_IN})"

PID1="$("${ENGINE}" exec "${NAME}" sh -c 'tr "\0" " " < /proc/1/cmdline' 2>/dev/null)"
[[ "${PID1}" == java* ]] && pass "PID 1 is the java process" || fail "PID 1 is '${PID1}', expected java"

[[ "${CODE}" == "200" ]] && pass "HTTP 200 on /" || fail "HTTP status ${CODE} on /"

START=$(date +%s)
"${ENGINE}" stop -t 10 "${NAME}" >/dev/null 2>&1
ELAPSED=$(( $(date +%s) - START ))
if (( ELAPSED < 5 )) && "${ENGINE}" logs "${NAME}" 2>&1 | grep -q 'shutdown signal received'; then
  pass "Graceful stop in under 5 seconds with shutdown log"
else
  fail "Stop took ${ELAPSED}s or no shutdown log (is java PID 1 and using exec form?)"
fi

exit "${FAILED}"

#!/usr/bin/env bash
# Create ./work with the hello-svc source and the naive Dockerfile for lab 6_2_1.
set -euo pipefail
LAB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SHARED="${LAB_DIR}/../../../../shared/hello-svc"
WORK="${LAB_DIR}/work"

rm -rf "${WORK}"
mkdir -p "${WORK}"
cp -r "${SHARED}/pom.xml" "${SHARED}/src" "${WORK}/"
cp "${LAB_DIR}/setup/Dockerfile.naive" "${LAB_DIR}/setup/start.sh" "${WORK}/"
echo "Work directory ready: ${WORK}"
ls -la "${WORK}"

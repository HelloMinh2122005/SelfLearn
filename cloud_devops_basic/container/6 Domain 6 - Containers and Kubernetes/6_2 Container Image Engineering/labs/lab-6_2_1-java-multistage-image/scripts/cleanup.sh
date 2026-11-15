#!/usr/bin/env bash
# Cleanup lab 6_2_1: containers, lab images and the work directory.
set -uo pipefail
LAB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ -z "${ENGINE:-}" ]]; then
  if command -v podman >/dev/null 2>&1; then ENGINE=podman; else ENGINE=docker; fi
fi
"${ENGINE}" rm -f t-naive t-opt v-opt >/dev/null 2>&1 || true
"${ENGINE}" rmi -f hello-svc-lab:naive hello-svc-lab:optimized >/dev/null 2>&1 || true
rm -rf "${LAB_DIR}/work"
echo "Removed lab 6_2_1 containers, images and work/."
echo "Base images (maven, eclipse-temurin) are kept for the next labs."
echo "To free disk space later: ${ENGINE} rmi docker.io/library/maven:3.9-eclipse-temurin-21 docker.io/library/eclipse-temurin:21-jre"

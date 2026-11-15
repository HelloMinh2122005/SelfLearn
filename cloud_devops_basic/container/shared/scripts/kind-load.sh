#!/usr/bin/env bash
# Load the locally built hello-svc images into a kind cluster.
# `kind load image-archive` works the same way with the Docker and the Podman provider.
# Usage: ./kind-load.sh [cluster-name] [version ...]
#        ./kind-load.sh lab                 -> loads 1.0.0 and 2.0.0 into cluster "lab"
#        ./kind-load.sh dev 1.0.0           -> loads only 1.0.0 into cluster "dev"
set -euo pipefail

CLUSTER="${1:-lab}"
shift || true
VERSIONS=("$@")
[[ ${#VERSIONS[@]} -eq 0 ]] && VERSIONS=(1.0.0 2.0.0)
IMAGE="selflearn.invalid/hello-svc"

if [[ -z "${ENGINE:-}" ]]; then
  if command -v podman >/dev/null 2>&1; then ENGINE=podman; else ENGINE=docker; fi
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

for version in "${VERSIONS[@]}"; do
  archive="${TMP_DIR}/hello-svc-${version}.tar"
  echo ">>> saving ${IMAGE}:${version}"
  "${ENGINE}" save -o "${archive}" "${IMAGE}:${version}"
  echo ">>> loading into kind cluster '${CLUSTER}'"
  kind load image-archive "${archive}" --name "${CLUSTER}"
done

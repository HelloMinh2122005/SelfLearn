#!/usr/bin/env bash
# Build hello-svc images 1.0.0 and 2.0.0 used by the Kubernetes labs.
# Usage: ./build-images.sh            (uses podman if installed, otherwise docker)
#        ENGINE=docker ./build-images.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${SCRIPT_DIR}/../hello-svc"
IMAGE="selflearn.invalid/hello-svc"

if [[ -z "${ENGINE:-}" ]]; then
  if command -v podman >/dev/null 2>&1; then ENGINE=podman; else ENGINE=docker; fi
fi

for version in 1.0.0 2.0.0; do
  echo ">>> ${ENGINE} build ${IMAGE}:${version}"
  "${ENGINE}" build --build-arg "APP_VERSION=${version}" -t "${IMAGE}:${version}" "${APP_DIR}"
done

"${ENGINE}" images | grep -E "hello-svc" || true

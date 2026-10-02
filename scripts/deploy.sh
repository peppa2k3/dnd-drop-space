#!/usr/bin/env bash
set -euo pipefail

# Dedicated trusted Linux runner. Secrets live outside checkout/releases.
root="${PKH_DEPLOY_ROOT:-/srv/pkh}"
[[ "$root" = /* && "$root" != / ]] || { echo 'Use an absolute deployment directory'; exit 1; }
export PKH_ENV_FILE="$root/shared/backend.env"
[[ -f "$PKH_ENV_FILE" ]] || { echo "Missing $PKH_ENV_FILE"; exit 1; }
export IMAGE_TAG="$(git rev-parse HEAD)"
export COMPOSE_PROJECT_NAME=pkh-production
release="$root/releases/$IMAGE_TAG"
previous="$(readlink -f "$root/current" 2>/dev/null || true)"
mkdir -p "$release"
git archive HEAD | tar -x -C "$release"

compose() {
  docker compose --project-directory "$1" --env-file "$PKH_ENV_FILE" -f "$1/docker-compose.yml" "${@:2}"
}
compose "$release" config --quiet
# Enforce production settings without printing secrets or evaluating the env file.
grep -qx 'NODE_ENV=production' "$PKH_ENV_FILE"
grep -Eq '^CLIENT_ORIGIN=https://[^[:space:]]+$' "$PKH_ENV_FILE"
compose "$release" build --pull
if compose "$release" up -d --no-build --wait --wait-timeout 180; then
  ln -sfn "$release" "$root/current"
  echo "Deployed $IMAGE_TAG; validate HTTPS login/refresh on the public URL."
else
  echo 'Deployment failed; restoring previous application images when available.'
  if [[ -n "$previous" && -f "$previous/docker-compose.yml" ]]; then
    export IMAGE_TAG="$(basename "$previous")"
    compose "$previous" up -d --no-build --wait --wait-timeout 180
  fi
  exit 1
fi

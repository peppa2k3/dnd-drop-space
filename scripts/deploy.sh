#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

# Runs on the VPS as the dedicated deploy user. This script never restores or
# removes data volumes; rollback only switches application images.
project=pkh-production
backup_helper=alpine:3.22
action="${1:?Usage: deploy.sh apply|verify|rollback|manual-rollback ROOT SHA [BACKEND_IMAGE WEB_IMAGE]}"
root="${2:?Set the absolute VPS deploy root}"
sha="${3:?Set a full commit SHA}"

[[ "$root" =~ ^/[A-Za-z0-9/_-]+$ && "$root" != / ]] || { echo 'Invalid deploy root'; exit 1; }
[[ "$sha" =~ ^[a-f0-9]{40}$ ]] || { echo 'Expected a full 40-character commit SHA'; exit 1; }

shared="$root/shared"
env_file="$shared/backend.env"
state="$shared/current-images.env"
pending="$shared/pending-release.env"
release="$root/releases/$sha"

setting() {
  local file="$1" name="$2"
  awk -v key="$name" 'index($0, key "=") == 1 { print substr($0, length(key) + 2); exit }' "$file"
}

valid_image() {
  [[ "$1" =~ ^(ghcr\.io|docker\.io)/[a-z0-9._/-]+:[a-f0-9]{40}$ ]]
}

compose() {
  local target_sha="$1" backend_image="$2" web_image="$3"
  shift 3
  PKH_ENV_FILE="$env_file" BACKEND_IMAGE="$backend_image" WEB_IMAGE="$web_image" \
    docker compose -p "$project" --project-directory "$root/releases/$target_sha" \
      --env-file "$env_file" -f "$root/releases/$target_sha/docker-compose.prod.yml" "$@"
}

check_private_env() {
  [[ -f "$env_file" ]] || { echo 'Private backend.env is missing'; exit 1; }
  local mode
  mode="$(stat -c %a "$env_file")"
  (( (8#$mode & 0077) == 0 )) || { echo 'backend.env must not be readable by group/others'; exit 1; }
  [[ "$(setting "$env_file" NODE_ENV)" == production ]] || { echo 'NODE_ENV must be production'; exit 1; }
  local origin
  origin="$(setting "$env_file" CLIENT_ORIGIN)"
  [[ "$origin" =~ ^https://[A-Za-z0-9.-]+(:[0-9]+)?$ ]] || { echo 'CLIENT_ORIGIN must be an HTTPS origin'; exit 1; }
}

read_current() {
  previous_sha=''
  previous_backend=''
  previous_web=''
  if [[ -f "$state" ]]; then
    previous_sha="$(setting "$state" RELEASE_SHA)"
    previous_backend="$(setting "$state" BACKEND_IMAGE)"
    previous_web="$(setting "$state" WEB_IMAGE)"
    [[ "$previous_sha" =~ ^[a-f0-9]{40}$ ]] && valid_image "$previous_backend" && valid_image "$previous_web" || {
      echo 'Invalid current-images.env; stop and inspect the deployment state'; exit 1;
    }
    [[ -f "$root/releases/$previous_sha/docker-compose.prod.yml" ]] || {
      echo 'Previous Compose release is missing; refusing to replace it'; exit 1;
    }
  fi
}

write_state() {
  local file="$1" release_sha="$2" backend_image="$3" web_image="$4"
  local temp="$file.tmp.$$"
  printf 'RELEASE_SHA=%s\nBACKEND_IMAGE=%s\nWEB_IMAGE=%s\n' \
    "$release_sha" "$backend_image" "$web_image" > "$temp"
  mv -f "$temp" "$file"
}

check_release() {
  local target_sha="$1" backend_image="$2" web_image="$3" service cid health port origin status response body
  for service in mongo minio backend nginx; do
    cid="$(compose "$target_sha" "$backend_image" "$web_image" ps -a -q "$service")"
    [[ -n "$cid" ]] || { echo "Missing container: $service"; return 1; }
    health="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$cid")"
    [[ "$health" == healthy ]] || { echo "Unhealthy container: $service ($health)"; return 1; }
  done
  port="$(setting "$env_file" WEB_PORT)"
  port="${port:-8080}"
  [[ "$port" =~ ^[0-9]+$ ]] || { echo 'Invalid WEB_PORT'; return 1; }
  origin="$(setting "$env_file" CLIENT_ORIGIN)"
  for url in "http://127.0.0.1:$port/" "http://127.0.0.1:$port/api/health" \
             "$origin/" "$origin/api/health"; do
    response="$(curl --fail --silent --show-error --max-time 20 --retry 3 --retry-delay 2 \
      --write-out '\n%{http_code}' "$url")" || return 1
    status="${response##*$'\n'}"
    body="${response%$'\n'*}"
    [[ "$status" == 200 ]] || { echo "Unexpected HTTP status $status at $url"; return 1; }
    if [[ "$url" == */api/health ]]; then
      [[ "$body" == *'"success":true'* ]] || { echo "Unexpected API health response at $url"; return 1; }
    else
      [[ "$body" == *'<title>DND Drop Space</title>'* ]] || { echo "Unexpected frontend response at $url"; return 1; }
    fi
  done
}

rollback_pending() {
  [[ -f "$pending" ]] || { echo 'No pending release; no rollback needed'; return 0; }
  local pending_sha old_sha old_backend old_web candidate_backend candidate_web
  pending_sha="$(setting "$pending" PENDING_SHA)"
  [[ "$pending_sha" == "$sha" ]] || { echo 'Another release is pending; refusing rollback'; return 1; }
  old_sha="$(setting "$pending" PREVIOUS_SHA)"
  old_backend="$(setting "$pending" PREVIOUS_BACKEND_IMAGE)"
  old_web="$(setting "$pending" PREVIOUS_WEB_IMAGE)"
  candidate_backend="$(setting "$pending" CANDIDATE_BACKEND_IMAGE)"
  candidate_web="$(setting "$pending" CANDIDATE_WEB_IMAGE)"
  valid_image "$candidate_backend" && valid_image "$candidate_web" || return 1
  compose "$sha" "$candidate_backend" "$candidate_web" stop nginx backend || true
  if [[ -z "$old_sha" ]]; then
    echo 'First release failed; application stopped, data volumes retained.'
    rm -f "$pending"
    return 0
  fi
  [[ "$old_sha" =~ ^[a-f0-9]{40}$ ]] && valid_image "$old_backend" && valid_image "$old_web" || return 1
  compose "$old_sha" "$old_backend" "$old_web" up -d --no-build --pull never --wait --wait-timeout 180
  check_release "$old_sha" "$old_backend" "$old_web"
  write_state "$state" "$old_sha" "$old_backend" "$old_web"
  ln -sfn "$root/releases/$old_sha" "$root/.current-$sha"
  mv -Tf "$root/.current-$sha" "$root/current"
  rm -f "$pending"
  echo "Restored previous release $old_sha; data volumes were not changed."
}

rollback_on_error() {
  local result=$?
  trap - EXIT
  if (( result != 0 )) && [[ -f "$pending" ]]; then
    rollback_pending || echo 'Automatic rollback failed; inspect pending-release.env and VPS health.' >&2
  fi
  exit "$result"
}

apply_release() {
  local backend_image="$1" web_image="$2" backup minio_cid minio_volume volume
  [[ -f "$release/docker-compose.prod.yml" ]] || { echo 'Release Compose file missing'; return 1; }
  [[ ! -e "$pending" ]] || { echo 'Resolve the pending release before starting another'; return 1; }
  read_current
  backend_image="${backend_image:--}"
  web_image="${web_image:--}"
  [[ "$backend_image" == - ]] && backend_image="$previous_backend"
  [[ "$web_image" == - ]] && web_image="$previous_web"
  valid_image "$backend_image" && valid_image "$web_image" || {
    echo 'Both immutable image references are required for the first release'; return 1;
  }
  if [[ -z "$previous_sha" ]]; then
    for volume in "${project}_mongo40-data" "${project}_minio-data"; do
      if docker volume inspect "$volume" >/dev/null 2>&1; then
        echo 'Existing production volume without current-images.env; manual migration required'
        return 1
      fi
    done
  fi
  compose "$sha" "$backend_image" "$web_image" config --quiet
  docker pull "$backend_image"
  docker pull "$web_image"
  [[ -z "$previous_sha" ]] || docker pull "$backup_helper"
  mkdir -p "$shared" "$root/backups"
  {
    printf 'PENDING_SHA=%s\nPREVIOUS_SHA=%s\n' "$sha" "$previous_sha"
    printf 'PREVIOUS_BACKEND_IMAGE=%s\nPREVIOUS_WEB_IMAGE=%s\n' "$previous_backend" "$previous_web"
    printf 'CANDIDATE_BACKEND_IMAGE=%s\nCANDIDATE_WEB_IMAGE=%s\n' "$backend_image" "$web_image"
  } > "$pending.tmp.$$"
  mv -f "$pending.tmp.$$" "$pending"
  trap rollback_on_error EXIT

  if [[ -n "$previous_sha" ]]; then
    backup="$root/backups/$(date -u +%Y%m%dT%H%M%SZ)-$sha"
    mkdir -m 700 "$backup"
    install -m 600 "$env_file" "$backup/backend.env"
    install -m 600 "$state" "$backup/current-images.env"
    printf 'Previous release: %s\nCandidate release: %s\n' "$previous_sha" "$sha" > "$backup/release.txt"
    # Quiesce application writes, then snapshot both stores as one backup pair.
    compose "$previous_sha" "$previous_backend" "$previous_web" stop nginx
    compose "$previous_sha" "$previous_backend" "$previous_web" stop backend
    compose "$previous_sha" "$previous_backend" "$previous_web" stop minio
    compose "$previous_sha" "$previous_backend" "$previous_web" exec -T mongo mongodump --archive > "$backup/mongo.archive.part"
    [[ -s "$backup/mongo.archive.part" ]] || { echo 'MongoDB backup is empty'; return 1; }
    mv "$backup/mongo.archive.part" "$backup/mongo.archive"
    minio_cid="$(compose "$previous_sha" "$previous_backend" "$previous_web" ps -a -q minio)"
    minio_volume="$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/data"}}{{.Name}}{{end}}{{end}}' "$minio_cid")"
    [[ "$minio_volume" =~ ^[A-Za-z0-9_.-]+$ ]] || { echo 'Could not identify MinIO data volume'; return 1; }
    docker run --rm --network none --read-only \
      -v "$minio_volume:/data:ro" -v "$backup:/backup" "$backup_helper" \
      tar -C /data -cf /backup/minio.tar.part .
    [[ -s "$backup/minio.tar.part" ]] || { echo 'MinIO backup is empty'; return 1; }
    mv "$backup/minio.tar.part" "$backup/minio.tar"
    touch "$backup/COMPLETE"
    echo "Backup created at $backup (copy this pair off-VPS)."
  fi
  compose "$sha" "$backend_image" "$web_image" up -d --no-build --pull never --wait --wait-timeout 180
  trap - EXIT
  echo "Candidate $sha is running; public verification is required before promotion."
}

verify_release() {
  [[ -f "$pending" && "$(setting "$pending" PENDING_SHA)" == "$sha" ]] || {
    echo 'No matching pending release'; return 1;
  }
  local backend_image web_image
  backend_image="$(setting "$pending" CANDIDATE_BACKEND_IMAGE)"
  web_image="$(setting "$pending" CANDIDATE_WEB_IMAGE)"
  valid_image "$backend_image" && valid_image "$web_image" || return 1
  check_release "$sha" "$backend_image" "$web_image"
  write_state "$release/images.env" "$sha" "$backend_image" "$web_image"
  write_state "$state" "$sha" "$backend_image" "$web_image"
  ln -sfn "$release" "$root/.current-$sha"
  mv -Tf "$root/.current-$sha" "$root/current"
  rm -f "$pending"
  echo "Release $sha verified and promoted."
}

check_private_env
case "$action" in
  apply)
    [[ $# == 5 ]] || { echo 'Apply expects two image references (or - for unchanged)'; exit 1; }
    apply_release "$4" "$5"
    ;;
  verify)
    [[ $# == 3 ]] || exit 1
    verify_release
    ;;
  rollback)
    [[ $# == 3 ]] || exit 1
    rollback_pending
    ;;
  manual-rollback)
    [[ $# == 3 && -f "$release/images.env" ]] || { echo 'Target release images.env missing'; exit 1; }
    target_backend="$(setting "$release/images.env" BACKEND_IMAGE)"
    target_web="$(setting "$release/images.env" WEB_IMAGE)"
    apply_release "$target_backend" "$target_web"
    trap rollback_on_error EXIT
    verify_release
    trap - EXIT
    ;;
  *) echo 'Unknown deployment action'; exit 1 ;;
esac

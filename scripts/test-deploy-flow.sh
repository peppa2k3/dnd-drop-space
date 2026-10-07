#!/usr/bin/env bash
set -Eeuo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
scratch="$(mktemp -d "$repo/test-deploy-XXXXXXXX")"
scratch="$(cd "$scratch" && pwd -P)"
[[ "$scratch" == "$repo"/test-deploy-* ]] || { echo 'Unsafe scratch path'; exit 1; }
trap 'rm -rf -- "$scratch"' EXIT
mkdir -p "$scratch/bin"
export MOCK_LOG="$scratch/docker.log"
export PATH="$scratch/bin:$PATH"

cat > "$scratch/bin/docker" <<'MOCK'
#!/usr/bin/env bash
set -Eeuo pipefail
case "$1" in
  network) [[ "$2" == inspect ]] ;;
  ps) : ;;
  pull) printf 'pull %s\n' "$2" >> "$MOCK_LOG" ;;
  inspect)
    if [[ "$*" == *'.State.Health'* ]]; then printf 'healthy\n'; else printf 'null\n'; fi
    ;;
  compose)
    printf 'compose %s\n' "$*" >> "$MOCK_LOG"
    file=''
    previous=''
    for arg in "$@"; do
      if [[ "$previous" == -f ]]; then file="$arg"; fi
      previous="$arg"
    done
    case " $* " in
      *' config --services '*)
        printf 'backend\nnginx\n'
        if grep -q '^  mongo:' "$file"; then printf 'mongo\n'; fi
        ;;
      *' ps -a -q backend '*) printf 'backend-cid\n' ;;
      *' ps -a -q nginx '*) printf 'nginx-cid\n' ;;
    esac
    ;;
  *) echo "Unexpected docker command: $*" >&2; exit 1 ;;
esac
MOCK

cat > "$scratch/bin/curl" <<'MOCK'
#!/usr/bin/env bash
set -Eeuo pipefail
url="${*: -1}"
if [[ "$url" == */api/health ]]; then
  printf '{"success":true}\n200'
else
  printf '<title>DND Drop Space</title>\n200'
fi
MOCK
cat > "$scratch/bin/ln" <<'MOCK'
#!/usr/bin/env bash
set -Eeuo pipefail
# Model the target symlink as a file so this test runs in Git Bash on Windows.
printf '%s\n' "${@: -2:1}" > "${@: -1}"
MOCK
chmod +x "$scratch/bin/docker" "$scratch/bin/curl" "$scratch/bin/ln"

sha_a="$(printf 'a%.0s' {1..40})"
sha_b="$(printf 'b%.0s' {1..40})"
image_a="ghcr.io/example/repo/backend:$sha_a"
web_a="ghcr.io/example/repo/web:$sha_a"
image_b="ghcr.io/example/repo/backend:$sha_b"
web_b="ghcr.io/example/repo/web:$sha_b"

make_root() {
  local root="$1"
  mkdir -p "$root/shared" "$root/releases/$sha_a" "$root/releases/$sha_b"
  cp "$repo/docker-compose.prod.yml" "$root/releases/$sha_a/docker-compose.prod.yml"
  cp "$repo/docker-compose.prod.yml" "$root/releases/$sha_b/docker-compose.prod.yml"
  cat > "$root/shared/backend.env" <<'ENV'
NODE_ENV=production
CLIENT_ORIGIN=https://dangngochai.io.vn
MONGO_URI=mongodb://db:27017/test
MINIO_ENDPOINT=storage
MINIO_PUBLIC_ENDPOINT=storage.example.com
MINIO_PUBLIC_USE_SSL=true
PKH_STORAGE_NETWORK=shared_storage
TRAEFIK_HTTPS_ENTRYPOINT=websecure
TRAEFIK_CERT_RESOLVER=resolver
ENV
  chmod 600 "$root/shared/backend.env"
}

root="$scratch/root"
make_root "$root"
bash "$repo/scripts/deploy.sh" apply "$root" "$sha_a" "$image_a" "$web_a"
bash "$repo/scripts/deploy.sh" verify "$root" "$sha_a"
bash "$repo/scripts/deploy.sh" apply "$root" "$sha_b" "$image_b" "$web_b"
bash "$repo/scripts/deploy.sh" rollback "$root" "$sha_b"
[[ "$(sed -n 's/^RELEASE_SHA=//p' "$root/shared/current-images.env")" == "$sha_a" ]]
[[ ! -e "$root/shared/pending-release.env" ]]

first="$scratch/first"
make_root "$first"
bash "$repo/scripts/deploy.sh" apply "$first" "$sha_b" "$image_b" "$web_b"
bash "$repo/scripts/deploy.sh" rollback "$first" "$sha_b"
[[ ! -e "$first/shared/pending-release.env" && ! -e "$first/shared/current-images.env" ]]
grep -q ' rm -f -s nginx backend' "$MOCK_LOG"

legacy="$scratch/legacy"
make_root "$legacy"
printf '  mongo:\n    image: mongo:4.0\n' >> "$legacy/releases/$sha_a/docker-compose.prod.yml"
printf 'RELEASE_SHA=%s\nBACKEND_IMAGE=%s\nWEB_IMAGE=%s\n' "$sha_a" "$image_a" "$web_a" > "$legacy/shared/current-images.env"
if bash "$repo/scripts/deploy.sh" apply "$legacy" "$sha_b" "$image_b" "$web_b" > /dev/null 2>&1; then
  echo 'Legacy four-service release was accepted' >&2
  exit 1
fi

if grep -E ' (stop|rm|up|down) .*\b(mongo|minio)\b|(^| )down --volumes' "$MOCK_LOG"; then
  echo 'Deployment attempted to manage shared services' >&2
  exit 1
fi
echo 'Deploy flow: verified release, rollback, first-failure cleanup and legacy guard passed'

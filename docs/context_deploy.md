# Context CI/CD production — 2026-10-07

Chưa có bằng chứng workflow mới chạy trên GitHub/VPS. Đọc [hướng dẫn vận hành](../DEPLOY_GUIDES.md) trước khi cấu hình. Refactor 011 thay thiết kế của prompt 009: production dùng Traefik và MongoDB 4.0/MinIO có sẵn trên VPS; bản cũ tự quản lý bốn container **không được tự động migration**.

## Luồng

`.github/workflows/ci.yml` dùng Compose local riêng với `mongo:4.0` và MinIO test. `.github/workflows/deploy.yml` trên push `main`/manual: changes → validate CI → build/push tối đa hai image app SHA → SSH bằng `deploy` → apply → verify → promote alias `production`; rollback job khi apply/verify lỗi. GitHub có SSH/registry credentials, không có secrets ứng dụng.

CI chạy thêm `scripts/test-deploy-flow.sh` với Docker/curl giả lập để kiểm tra state verify/rollback, cleanup lần đầu và guard manifest bốn service; test này không thay thế kiểm tra VPS thật.

`docker-compose.prod.yml` chỉ có `backend` và `nginx`, project `pkh-dnd-app`, không bind host port hay sở hữu volume. Network `web` external tới Traefik; backend tham gia thêm external `PKH_STORAGE_NETWORK`. `MONGO_URI`, `MINIO_ENDPOINT`/port/credential/bucket do `/srv/pkh/shared/backend.env` cấp, tuyệt đối không trỏ localhost. Traefik router: `pkh-dnd-web` (site), `pkh-dnd-web-api` (site `/api`), `pkh-dnd-api` (API domain). Tên HTTPS entrypoint/resolver của VPS là biến bắt buộc; chưa xác nhận giá trị. Backend `TRUST_PROXY_HOPS=1`. Nginx `/api` proxy vẫn giữ cho local/CI.

## State và rollback

```text
/srv/pkh/shared/backend.env              # private, mode 600
/srv/pkh/shared/current-images.env       # verified SHA and both image refs
/srv/pkh/shared/pending-release.env      # candidate and previous refs
/srv/pkh/releases/<sha>/                 # Compose, deploy.sh, verified images.env
/srv/pkh/current -> releases/<sha>       # đổi sau verify
```

`scripts/deploy.sh apply` kiểm tra env/mạng/manifest chỉ hai service, pull cả hai image SHA rồi ghi pending và `up` **chỉ backend/nginx**. `verify` đợi container healthy, kiểm tra HTTPS site, site `/api/health`, API domain `/api/health`; endpoint health ping MongoDB và kiểm tra bucket MinIO. Thành công mới ghi state/symlink; thất bại trở lại bản app trước đã verify. Lần đầu lỗi xóa riêng container app candidate để thử lại; không can thiệp MongoDB/MinIO. `manual-rollback` dùng images.env của release cũ, vẫn verify lại. Manifest bốn service của prompt 009 bị từ chối để tránh thao tác shared services. Backup/restore MongoDB và MinIO cần do người vận hành dịch vụ dùng chung thiết lập; rollback image không đảo migration dữ liệu.

## Còn cần người vận hành xác nhận

VPS SSH host/host fingerprint; Traefik HTTPS entrypoint/cert resolver và router hiện có; tên private network, hostname/port MongoDB 4.0 và MinIO, bucket và public MinIO HTTPS route; registry quyền pull của user `deploy`; trạng thái project cũ `pkh-production` nếu đã deploy. Ngày 2026-10-07, DNS công khai của cả hai domain về `160.187.229.39`, HTTPS site `/` và API `/api/health` đều trả HTTP 404 (TLS verify 0); chưa biết container/proxy trả 404. Chưa kiểm tra trực tiếp registry pull, network/health hoặc rollback trên VPS. Không coi `docker compose config` local là bằng chứng production chạy.

# Bối cảnh triển khai production — 2026-10-05

Đọc file này khi sửa CI/CD hoặc xử lý lỗi sau lần chạy GitHub/VPS. Hướng dẫn thao tác cho người vận hành: [`DEPLOY_GUIDES.md`](../DEPLOY_GUIDES.md). **Chưa có kết quả chạy thực tế trên GitHub/VPS cho workflow mới**; người dùng sẽ kiểm chứng và phản hồi. Không suy diễn rằng production đã hoạt động từ việc file cấu hình tồn tại.

## Luồng và file chính

- `.github/workflows/ci.yml`: CI dùng lại; lint/syntax, frontend build, kiểm tra theme, Compose với `mongo:4.0`, smoke/RBAC/collaboration/auth. Repo JavaScript chưa có TypeScript typecheck riêng.
- `.github/workflows/deploy.yml`: push `main` hoặc manual trên `main` → `changes` chọn backend/web → `validate` gọi CI → `build-images` lưu artifact Docker → `push-images` publish image SHA → `deploy` SSH → `verify` xác nhận/promote → `promote-tags` cập nhật tag `production`. `rollback` chạy khi `deploy`/`verify` thất bại. Docs-only push không deploy; manual build cả hai.
- `docker-compose.prod.yml`: không có `build`, dùng `BACKEND_IMAGE`/`WEB_IMAGE` SHA; giữ tên `mongo`, `minio`, `backend`, `nginx` và volume `mongo40-data`, `minio-data` của Compose cũ với project cố định `pkh-production`. Mongo là image chính thức `mongo:4.0`. Web/MinIO chỉ bind loopback; DB/API không publish port.
- `scripts/deploy.sh`: script duy nhất trên VPS với lệnh `apply`, `verify`, `rollback`, `manual-rollback`. Image đầu vào được kiểm tra định dạng SHA. Script không `source` env chứa secret, không chạy `down -v`/prune. `nginx/nginx.conf` giữ HTTPS scheme từ host proxy và thêm X-Forwarded-For; production đặt `TRUST_PROXY_HOPS=2`.
- `backend/.env.example`: mẫu runtime canonical. Production thực tế ở `/srv/pkh/shared/backend.env` quyền 600, ngoài Git/release/image. GitHub chỉ có credential SSH/registry; không có JWT/SMTP/MinIO secret.

## State trên VPS

Mặc định root `/srv/pkh` (GitHub variable `VPS_DEPLOY_ROOT` có thể đổi):

```text
shared/backend.env              # secret ứng dụng, không commit
shared/current-images.env       # RELEASE_SHA, BACKEND_IMAGE, WEB_IMAGE đã verify
shared/pending-release.env      # ứng viên đang apply/verify; chứa cả refs bản trước
releases/<sha>/docker-compose.prod.yml
releases/<sha>/scripts/deploy.sh
releases/<sha>/images.env       # refs đúng lúc release này được verify
current -> releases/<sha>       # chỉ đổi sau verify
backups/<UTC>-<sha>/            # backend.env, current-images.env, mongo.archive, minio.tar, COMPLETE
```

`current-images.env` chứa ref độc lập từng service. Nếu push chỉ đổi backend, web ref vẫn lấy từ bản hiện hành; không dùng tag `production` di động để chạy container. GHCR luôn publish; Docker Hub tùy `PUBLISH_DOCKERHUB`. `DEPLOY_REGISTRY` quyết định VPS pull từ đâu. VPS phải có quyền pull nếu registry private.

`promote-tags` chạy sau `verify`. Nếu job alias này lỗi, ứng dụng đã verify vẫn chạy bằng tag SHA và workflow báo đỏ; sửa quyền registry rồi cập nhật alias, không tự restore dữ liệu. Manual rollback cũng không tự di chuyển tag `production`; state trên VPS mới là nguồn xác định release đang chạy.

## Trình tự và bất biến dữ liệu

`apply` kiểm tra env/release, đọc state cũ, yêu cầu cả hai ref khi bootstrap, từ chối volume production có sẵn mà không có state. Sau đó Compose config, pull image và image helper **trước** downtime, ghi pending. Với release cũ, dừng Nginx/backend/MinIO, `mongodump` từ Mongo còn chạy, tar volume MinIO khi đã dừng, giữ `backend.env`/state cũ trong cùng backup. Chỉ khi backup xong mới `up -d --no-build --wait` ứng viên. Dữ liệu không bị restore/xóa trong rollback ứng dụng.

`verify` kiểm tra health Mongo/MinIO/backend/nginx, frontend và `/api/health` trên loopback lẫn `CLIENT_ORIGIN` HTTPS. Đạt mới ghi state, `images.env`, đổi symlink `current`, xóa pending. Lỗi ở `apply` kích hoạt rollback nội bộ; lỗi `deploy` hoặc `verify` cũng có job rollback idempotent. Rollback dừng app ứng viên, `up` image/Compose của release trước rồi verify lại. Nếu chưa có bản trước, dừng app ứng viên và giữ volume; retry bootstrap sau khi volume đã tạo cần đánh giá dữ liệu thủ công, script cố ý từ chối ghi đè.

Backup hiện nằm **trên cùng VPS**, chưa phải disaster recovery. Cần sao chép mã hóa ngoài máy, kiểm tra cặp Mongo/MinIO bằng restore trên volume riêng, và có đủ dung lượng trước deploy. Mọi thay đổi schema/data không tương thích ngược phải có kế hoạch migration/restore riêng; rollback image không tự đảo dữ liệu. Không hạ phiên bản Mongo trên volume đã mở bằng phiên bản mới hơn.

## Điểm cần kiểm chứng khi người dùng phản hồi

1. GitHub job `changes` (đặc biệt push chỉ backend/web), CI, build artifact, quyền push GHCR/Docker Hub, environment `production` và SSH host key.
2. VPS private registry pull, `backend.env`, Docker Compose/backup helper/mongodump, dung lượng backup, ownership của thư mục.
3. Proxy HTTPS public và `storage` domain: cookie Secure, client IP/rate-limit qua hai proxy, Google Authorized JavaScript origin, SMTP/OTP, avatar presigned URL giữ Host/path.
4. Verify/rollback thật trên staging: image cũ được phục hồi, `current-images.env`/symlink/pending nhất quán, MongoDB và MinIO còn dữ liệu. Đặc biệt thử lỗi sau khi `up` nhưng trước khi promote.

Prompt 009 còn ở `prompts/progress/` cho đến khi có bằng chứng thực chạy hoặc người dùng xác nhận các tiêu chí có thể nghiệm thu mà không chạy môi trường. Prompt `010` là việc đưa website public và diễn tập vận hành; không gộp trạng thái “code đã chuẩn bị” với “production đã xác nhận”.

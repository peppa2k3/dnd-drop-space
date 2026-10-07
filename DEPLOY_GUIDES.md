# Triển khai DND Drop Space qua Traefik hiện có

Trạng thái: cấu hình trong repo đã chuẩn bị; chưa xác nhận một lần chạy GitHub/VPS. Production chỉ deploy hai image ứng dụng. MongoDB phải là **4.0**; MongoDB, MinIO và Traefik là dịch vụ dùng chung do VPS vận hành, cần kế hoạch backup riêng. Không dùng Compose của ứng dụng để tạo, dừng, xóa hoặc nâng cấp chúng.

## 1. Xác nhận hạ tầng trước deploy

- DNS `dangngochai.io.vn` và `api.dangngochai.io.vn` trỏ VPS. Traefik hiện có phải nối external Docker network `web`, có HTTPS entrypoint và cert resolver hoạt động. Lấy **tên thực** của entrypoint/resolver từ cấu hình Traefik; kiểm tra không có router nào khác chiếm hai hostname hoặc các tên `pkh-dnd-web`, `pkh-dnd-api`, `pkh-dnd-web-api`.
- Xác nhận external network riêng chứa MongoDB 4.0 và MinIO, tên DNS nội bộ/port thực của từng dịch vụ. Backend sẽ tham gia mạng này; không dùng `localhost` hoặc bind host để truy cập dịch vụ khác. Nếu dịch vụ hiện không ở cùng một network, phối hợp người vận hành kết nối network theo kế hoạch riêng; không đổi container/volume bằng workflow này.
- Tài khoản SSH `deploy` truy cập Docker Engine/Compose; Docker access cho phép thao tác cấp root nên chỉ cấp cho tài khoản tin cậy. Tạo `/srv/pkh/shared` và `/srv/pkh/releases` do `deploy` sở hữu, quyền `700` (hoặc đặt `VPS_DEPLOY_ROOT` khác). Docker Compose plugin và `curl` phải có trên VPS.
- Kiểm tra project `pkh-dnd-app` chưa được web khác dùng. Cấu hình này không publish host port. Các project/volume cũ tên `pkh-production` **không bị script đụng tới**; nếu đang chạy bản cũ, phải lập kế hoạch chuyển traffic/state riêng trước lần deploy mới. Không gắn volume MongoDB đã dùng phiên bản cao hơn vào 4.0.

Lệnh kiểm tra chỉ đọc trên VPS:

```sh
docker compose version
docker network inspect web --format '{{json .Containers}}'
docker network inspect <storage-network> --format '{{json .Containers}}'
docker ps --filter label=com.docker.compose.project=pkh-dnd-app
docker ps --format '{{.Names}} {{.Labels}}' | grep -E 'pkh-dnd-|dangngochai.io.vn' || true
```

## 2. Private env và registry

Sao chép [mẫu key](backend/.env.example) tới `/srv/pkh/shared/backend.env` trực tiếp trên VPS, chỉ cho `deploy` đọc (`chmod 600`). Không gửi file đã điền qua GitHub hoặc commit. Điền các giá trị production sau:

| Key | Giá trị cần xác nhận |
| --- | --- |
| `NODE_ENV`, `CLIENT_ORIGIN` | `production`, `https://dangngochai.io.vn` |
| `PKH_STORAGE_NETWORK` | Tên external private network thực, khác `web` |
| `TRAEFIK_HTTPS_ENTRYPOINT`, `TRAEFIK_CERT_RESOLVER` | Tên đã có trong Traefik |
| `MONGO_URI` | URI MongoDB **4.0** thực, có database/credential nếu cần, hostname trong network private |
| `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL` | Đích MinIO nội bộ thực trong network private |
| `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET` | Credential và bucket ứng dụng trên MinIO hiện có |
| `MINIO_PUBLIC_ENDPOINT`, `MINIO_PUBLIC_PORT`, `MINIO_PUBLIC_USE_SSL` | Host/port HTTPS hiện có để browser mở signed avatar URL; SSL = `true` |
| `JWT_*`, `GOOGLE_CLIENT_ID`, `EMAIL_*`, `OTP_*` | Theo mẫu và hướng dẫn chạy trong [README](README.md) |

Backend cần quyền truy cập MongoDB và bucket MinIO; `/api/health` kiểm tra ping MongoDB và `bucketExists` MinIO. Traefik định tuyến `dangngochai.io.vn/` vào Nginx, `dangngochai.io.vn/api` và `api.dangngochai.io.vn` vào backend. Frontend dùng `/api` cùng origin. Traefik là một proxy hop tới API (`TRUST_PROXY_HOPS=1`); Nginx vẫn proxy `/api` trong môi trường local/CI. Nếu thêm Socket.io sau này, cấu hình route Traefik tương ứng trước khi dùng production.

GHCR mặc định publish `ghcr.io/<owner>/<repo>/backend:<sha>` và `.../web:<sha>` bằng `GITHUB_TOKEN` có `packages: write`. Với package private, đăng nhập **trên VPS dưới user `deploy`** bằng token chỉ có quyền pull và quyền đọc package: `docker login ghcr.io`. Nếu dùng Docker Hub, đặt `PUBLISH_DOCKERHUB=true`, `DOCKERHUB_NAMESPACE`, secrets `DOCKERHUB_USERNAME`/`DOCKERHUB_TOKEN`; đăng nhập Docker Hub trên VPS rồi chọn `DEPLOY_REGISTRY=dockerhub`. Không lưu password trong repo. `docker pull` từng image SHA trên VPS là phép thử quyền pull tốt nhất trước rollout.

## 3. GitHub Actions

Tạo repo secrets `VPS_SSH_PRIVATE_KEY`, `VPS_SSH_KNOWN_HOSTS` (dòng host key đã đối chiếu fingerprint qua console VPS), và Docker Hub secrets nếu dùng. Repo variables: `VPS_HOST`, `VPS_PORT` (mặc định 22), `VPS_DEPLOY_ROOT` (mặc định `/srv/pkh`), `DEPLOY_REGISTRY` (`ghcr` mặc định hoặc `dockerhub`), các biến Docker Hub tùy chọn. Workflow luôn SSH bằng user **`deploy`**. Host key cho port khác 22 phải có dạng `[host]:port`; không lấy `ssh-keyscan` rồi tin ngay nếu chưa đối chiếu.

Tạo environment `production` và chỉ cho branch `main` deploy. Push `main` chọn image bị ảnh hưởng, gọi CI local riêng (MongoDB `mongo:4.0`, MinIO test), build/push image SHA, SSH apply, verify HTTPS rồi mới promote tag `production`. `workflow_dispatch` trên `main` build cả hai image cho lần đầu. Thay đổi chỉ tài liệu không deploy. Tag `production` là alias; VPS chạy ref SHA trong `shared/current-images.env`. Không push code chỉ để thử cho đến khi các đầu vào phía trên đã xác nhận.

## 4. Kiểm tra và rollback

Sau khi có release, kiểm tra:

```sh
docker ps --filter label=com.docker.compose.project=pkh-dnd-app
curl -fsS https://dangngochai.io.vn/api/health
curl -fsS https://api.dangngochai.io.vn/api/health
curl -fsS -o /dev/null -w '%{http_code}\n' https://dangngochai.io.vn/
```

`apply` chỉ pull/khởi chạy backend và Nginx, `verify` kiểm tra hai container cùng ba URL HTTPS; API health kiểm tra kết nối MongoDB/MinIO. Chỉ sau verify mới đổi symlink `current` và state. Nếu lỗi, tự quay về **image ứng dụng** của release đã verify trước; lần đầu lỗi sẽ dừng/xóa container ứng dụng của candidate và báo rõ không có bản để phục hồi. Shared services/data vẫn nguyên. Không tự rollback schema/data; giữ lịch backup MongoDB và MinIO của dịch vụ dùng chung, diễn tập restore riêng và lưu offsite. Không chạy `down --volumes`, `volume rm`, hoặc prune dịch vụ dùng chung.

Rollback thủ công về SHA đã verify:

```sh
bash /srv/pkh/current/scripts/deploy.sh manual-rollback /srv/pkh <40-character-old-sha>
```

Script từ chối Compose release cũ có `mongo`/`minio`; chuyển từ kiến trúc 009 bốn service cần kế hoạch migration riêng. Xem [context triển khai](docs/context_deploy.md) để nắm state và phần chưa nghiệm thu.

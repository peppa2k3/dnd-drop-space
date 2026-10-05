# Triển khai DND Drop Space lên VPS

Workflow: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Chạy khi push `main`; `workflow_dispatch` trên `main` luôn build đủ hai image, phù hợp lần triển khai đầu. GitHub chỉ giữ credential để SSH/publish image; cấu hình ứng dụng nằm riêng trên VPS. Hướng dẫn này chưa phải bằng chứng hệ thống đã chạy trên GitHub/VPS.

## 1. Chuẩn bị VPS và tên miền

1. Trỏ DNS `app.example.com` tới VPS; nếu dùng avatar, trỏ thêm `storage.example.com` tới VPS.
2. Cài Docker Engine + Compose plugin theo [hướng dẫn Docker cho Ubuntu](https://docs.docker.com/engine/install/ubuntu/). Cài `curl`, `tar`, `openssh-server` và reverse proxy HTTPS trên host. Kiểm tra `docker compose version` và `docker info`.
3. Tạo user riêng `pkhdeploy`, chỉ cho SSH key, không cấp `sudo`. User phải gọi được Docker daemon. **Quyền vào Docker daemon gần tương đương root**; chỉ cấp cho tài khoản tin cậy, dùng VPS riêng cho ứng dụng. Có thể triển khai Docker rootless nếu tự cấu hình lại socket/volume.
4. Tạo `/srv/pkh/shared`, `/srv/pkh/releases`, `/srv/pkh/backups` do `pkhdeploy` sở hữu, quyền thư mục `700`. Đảm bảo đủ dung lượng trống để lưu cả `mongodump` và bản tar MinIO trước mỗi lần nâng cấp. Đặt lịch sao chép cặp backup ra ngoài VPS, mã hóa và thử restore định kỳ.
5. Chỉ mở SSH từ IP quản trị/GitHub runner phù hợp, 80/443 cho web. Compose production bind web và MinIO vào `127.0.0.1`; MongoDB và backend không có cổng host.

Ví dụ tạo tài khoản/thư mục (chạy từ tài khoản quản trị VPS, điều chỉnh đường dẫn nếu đổi `VPS_DEPLOY_ROOT`):

```sh
sudo useradd -m -s /bin/bash pkhdeploy
sudo usermod -aG docker pkhdeploy
sudo install -d -m 700 -o pkhdeploy -g pkhdeploy /srv/pkh /srv/pkh/shared /srv/pkh/releases /srv/pkh/backups
sudo install -d -m 700 -o pkhdeploy -g pkhdeploy /home/pkhdeploy/.ssh
sudo install -m 600 -o pkhdeploy -g pkhdeploy /dev/null /home/pkhdeploy/.ssh/authorized_keys
```

Trên máy quản trị, tạo cặp key Ed25519 riêng cho workflow, không đặt passphrase vì job chạy tự động:

```sh
ssh-keygen -t ed25519 -f ./pkhdeploy_ed25519 -C pkh-github-deploy -N ''
```

Đưa **nội dung file `.pub`** vào `/home/pkhdeploy/.ssh/authorized_keys` trên VPS; đưa **nội dung private key** vào GitHub Secret `VPS_SSH_PRIVATE_KEY`, rồi xóa bản key tạm trên máy chia sẻ nếu có. Xác minh fingerprint host key trực tiếp qua console VPS trước khi lưu dòng `known_hosts` vào `VPS_SSH_KNOWN_HOSTS`; không tin kết quả `ssh-keyscan` nếu chưa đối chiếu. Với SSH port khác 22, dòng host phải có dạng `[host]:port`.

## 2. Registry

GHCR luôn được publish vào `ghcr.io/<owner>/<repo>/backend:<sha>` và `.../web:<sha>`. Workflow dùng `GITHUB_TOKEN` với `packages: write`; không cần tạo PAT để **push** GHCR. Nếu package private, trên VPS đăng nhập GHCR bằng PAT classic chỉ có `read:packages` và được quyền đọc package: `docker login ghcr.io`. Liên kết package với repo nếu `GITHUB_TOKEN` chưa được cấp quyền push. Xem [tài liệu GHCR](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry).

Muốn publish thêm Docker Hub, tạo hai repo image `<namespace>/<repo>-backend` và `<namespace>/<repo>-web` (tên `<repo>` lấy từ GitHub repository), tạo access token có quyền push, rồi đặt `PUBLISH_DOCKERHUB=true`, `DOCKERHUB_NAMESPACE`, `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` trên GitHub. Image: `docker.io/<namespace>/<repo>-backend:<sha>` và `...-web:<sha>`. Trên VPS, đăng nhập Docker Hub bằng tài khoản/token chỉ cần quyền pull. Đặt `DEPLOY_REGISTRY=dockerhub` nếu muốn VPS lấy image từ Docker Hub; mặc định `ghcr`. Nếu chọn Docker Hub nhưng chưa bật publish/thiếu credential, workflow dừng trước deploy.

Mỗi image có tag SHA dùng làm tham chiếu release (GHCR không ghi đè tag SHA đã có). Tag `production` được cập nhật **sau** verify; Compose chỉ dùng tag SHA nên rollback không phụ thuộc tag di động. Nếu job cập nhật alias lỗi, release đã verify vẫn chạy và workflow báo đỏ để sửa registry; alias có thể tạm cũ. Chỉ service thay đổi được build/push; service còn lại dùng tham chiếu image của release đang chạy. Lần đầu phải chạy `workflow_dispatch` để có đủ hai image.

## 3. GitHub Secrets, Variables và environment

Vào **Settings → Secrets and variables → Actions** của repo. Đặt ở **repository scope** vì các job `deploy`, `verify`, `rollback` dùng cùng cấu hình; environment secret chỉ có ở job khai báo environment.

| Loại | Tên | Giá trị |
| --- | --- | --- |
| Secret | `VPS_SSH_PRIVATE_KEY` | Private key của deploy account |
| Secret | `VPS_SSH_KNOWN_HOSTS` | Dòng known_hosts đã xác minh fingerprint |
| Secret, khi dùng Hub | `DOCKERHUB_USERNAME` | Tài khoản publish |
| Secret, khi dùng Hub | `DOCKERHUB_TOKEN` | Access token publish |
| Variable | `VPS_HOST` | DNS/IP SSH của VPS |
| Variable | `VPS_USER` | `pkhdeploy` |
| Variable | `VPS_PORT` | Port SSH, mặc định 22 |
| Variable | `VPS_DEPLOY_ROOT` | `/srv/pkh`, mặc định này nếu bỏ trống |
| Variable | `DEPLOY_REGISTRY` | `ghcr` (mặc định) hoặc `dockerhub` |
| Variable | `PUBLISH_DOCKERHUB` | `true` hoặc bỏ trống |
| Variable, khi dùng Hub | `DOCKERHUB_NAMESPACE` | Docker Hub username/organization chữ thường |

Tạo environment `production`, giới hạn deployment branch là `main` theo [GitHub Environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments). Có thể bật reviewer để duyệt trước job `deploy`; khi đó push `main` chạy pipeline nhưng chờ duyệt tại bước deploy. Các job build/push dùng GitHub-hosted runner; không chạy code PR trên VPS.

## 4. Cấu hình ứng dụng và HTTPS trên VPS

Từ máy quản trị, sao chép **mẫu** [`backend/.env.example`](backend/.env.example) sang VPS rồi sửa giá trị trực tiếp trên VPS; không chuyển file đã chứa secret qua GitHub:

```sh
scp backend/.env.example pkhdeploy@app.example.com:/srv/pkh/shared/backend.env
ssh pkhdeploy@app.example.com 'chmod 600 /srv/pkh/shared/backend.env'
```

Điền toàn bộ giá trị production trong file, giữ chủ file `pkhdeploy` và quyền `600`. Các nhóm key:

- Server/domain: `NODE_ENV=production`, `CLIENT_ORIGIN=https://app.example.com`, `WEB_PORT`, `MINIO_API_PORT`, `MINIO_CONSOLE_PORT`. `PORT=5000`, `TRUST_PROXY_HOPS=2` được Compose production đặt cho backend.
- MongoDB: `MONGO_URI` được Compose production khóa tới service `mongo:27017`; giữ `mongo:4.0`, không gắn volume từ bản MongoDB mới hơn. Không cần database password ở cấu hình hiện tại vì Mongo chỉ nằm trong Docker network; bảo vệ Docker daemon và host.
- MinIO: `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`; `MINIO_PUBLIC_ENDPOINT=storage.example.com`, `MINIO_PUBLIC_PORT=443`, `MINIO_PUBLIC_USE_SSL=true` cho URL avatar ký. Endpoint nội bộ được Compose đặt là `minio:9000`.
- JWT/auth: hai secret khác nhau dài từ 32 ký tự, thời hạn và tên cookie; `GOOGLE_CLIENT_ID` của OAuth **Web application**. Thêm `https://app.example.com` vào Authorized JavaScript origins. Luồng ID token hiện tại không dùng Google client secret/callback URL.
- SMTP/OTP: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM`, các `OTP_*`. Gmail dùng App Password nếu tài khoản/nhà cung cấp yêu cầu; kiểm tra gửi email thật sau deploy.
- Upload/trash/preview: `MAX_FILE_SIZE_MB`, `MAX_FILES_PER_UPLOAD`, `TRASH_AUTO_PURGE_DAYS`, `URL_FETCH_TIMEOUT_MS`.

Host HTTPS proxy phải chuyển `app.example.com` → `127.0.0.1:WEB_PORT` và `storage.example.com` → `127.0.0.1:MINIO_API_PORT`. Với Nginx host, **ghi đè** `X-Forwarded-For` bằng IP client tại hop ngoài và đặt `X-Forwarded-Proto=https`; Nginx trong image thêm hop thứ hai. Với MinIO, giữ nguyên `Host`/đường dẫn để chữ ký S3 hợp lệ. Ví dụ phần `location` trong hai HTTPS server đã có chứng chỉ:

```nginx
# app.example.com
client_max_body_size 1100m;
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto https;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;
}

# storage.example.com
location / {
    proxy_pass http://127.0.0.1:9000;
    proxy_set_header Host $http_host;
    proxy_set_header X-Forwarded-Proto https;
}
```

Thay `8080/9000` theo env; không mở MinIO Console ra Internet. Kiểm tra chứng chỉ HTTPS, cookie Secure, Google consent, email OTP và avatar URL trên domain thật.

## 5. Triển khai và kiểm tra

1. Đảm bảo `backend.env`, registry login trên VPS, DNS/HTTPS và SSH đã sẵn sàng **trước** khi push workflow lên `main`. Nếu production cũ đã có volume `pkh-production_*` nhưng không có `current-images.env`, script từ chối bootstrap; cần kế hoạch migration riêng.
2. Push code lên `main` khi sẵn sàng; lần đầu có thể chọn **Actions → Production CI/CD → Run workflow** trên `main` để build cả backend/web. PR không deploy. Push chỉ thay tài liệu không tạo release.
3. `changes → validate` gọi CI hiện có (lint/syntax, frontend build, smoke/RBAC/collaboration/auth trên Compose MongoDB 4.0). Dự án JavaScript chưa có TypeScript typecheck riêng. `build-images` tạo image artifact; `push-images` publish SHA; `deploy` gửi Compose/script qua SSH. Không có secret ứng dụng trong image.
4. VPS pull image **trước** downtime. Nếu có release cũ, dừng web/backend/MinIO để ngừng ghi, `mongodump` và tar MinIO vào cùng thư mục `/srv/pkh/backups/<UTC>-<sha>`; kèm `backend.env` và manifest cũ quyền riêng. Chỉ dùng bản có file `COMPLETE`; bản `.part` là backup lỗi. Sau đó Compose `up --wait`. Backup chưa tự đưa ra khỏi VPS: sao chép/mã hóa ngoài VPS theo lịch vận hành.
5. `verify` kiểm tra health cả bốn container, frontend/API trên loopback và HTTPS public, rồi ghi `shared/current-images.env`, cập nhật `current` symlink. Nếu deploy/verify lỗi, rollback phục hồi image cũ và kiểm tra lại; MongoDB/MinIO volume giữ nguyên. Lần đầu lỗi thì dừng app lỗi, giữ volume để điều tra; nếu volume đã được tạo, lần thử tiếp theo bị chặn cho đến khi đánh giá dữ liệu và lập kế hoạch tiếp tục bootstrap an toàn.

Xem trạng thái mà không đọc env bí mật:

```sh
cat /srv/pkh/shared/current-images.env
docker ps --filter label=com.docker.compose.project=pkh-production
curl -fsS https://app.example.com/api/health
curl -fsS -o /dev/null -w '%{http_code}\n' https://app.example.com/
```

## 6. Rollback và dữ liệu

Rollback thủ công về release SHA đã từng verify (dùng script của release hiện hành):

```sh
bash /srv/pkh/current/scripts/deploy.sh manual-rollback /srv/pkh <40-character-old-sha>
```

Lệnh này cũng backup cặp dữ liệu hiện tại trước khi đổi image, verify lại, rồi cập nhật `current`. Không xóa/restore database hay MinIO khi rollback ứng dụng. Nếu có migration dữ liệu **không tương thích ngược**, dừng triển khai và lập kế hoạch restore riêng: phải khôi phục MongoDB **và** MinIO từ cùng một thư mục backup vào môi trường riêng để thử trước. Không chạy `docker compose down --volumes`, `docker volume rm`, hay prune release/image đang dùng. Xem trạng thái chi tiết và điểm cần tiếp tục trong [`docs/context_deploy.md`](docs/context_deploy.md).

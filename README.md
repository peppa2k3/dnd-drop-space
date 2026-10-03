# Personal Knowledge Hub

Kho cá nhân cho ghi chú Markdown, bookmark, ảnh/video và tệp. React/Vite PWA + Express + MongoDB **4.0** + MinIO; Nginx phục vụ web và proxy `/api`.

## Chạy nhanh

Yêu cầu: Docker với Linux containers, Docker Compose v2+; Node.js 22+ để tạo `.env` và phát triển local.

```bash
node scripts/init-env.cjs
docker compose --env-file backend/.env up -d --build --wait --wait-timeout 180
```

Script tạo secrets ngẫu nhiên nếu `.env` chưa tồn tại; giữ nguyên file đã có. Với file cũ, kiểm tra `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, JWT secrets và đặt `CLIENT_ORIGIN=http://localhost:8080`, `NODE_ENV=development` cho local HTTP. **Cần cấu hình SMTP hợp lệ** (`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASSWORD`; `EMAIL_FROM` tùy chọn) trước khi đăng ký tài khoản mới: email xác thực là bắt buộc. Cổng 587 dùng STARTTLS (`EMAIL_SECURE=false`); cổng 465 dùng TLS ngay (`EMAIL_SECURE=true`). Nếu dùng Gmail và nhận `EAUTH`, kiểm tra `EMAIL_USER` và [App Password](https://support.google.com/accounts/answer/185833) của tài khoản có xác minh hai bước. Không ghi credential thật vào Git.

- Website: http://localhost:8080 — chọn **Tạo tài khoản mới** để bắt đầu.
- MinIO Console: http://localhost:9001 — dùng credentials trong `backend/.env`.
- MongoDB: nội bộ Docker tại `mongo:27017`, không mở cổng ra máy host.
- Đổi cổng host bằng `WEB_PORT`, `MINIO_API_PORT`, `MINIO_CONSOLE_PORT` trong `.env`; đổi `CLIENT_ORIGIN` tương ứng.

```bash
# Trạng thái / kiểm tra tích hợp / dừng giữ dữ liệu
docker compose --env-file backend/.env ps
docker compose --env-file backend/.env exec -T backend npm run test:smoke
docker compose --env-file backend/.env exec -T backend npm run test:rbac
docker compose --env-file backend/.env exec -T backend npm run test:collaboration
docker compose --env-file backend/.env exec -T backend npm run test:auth
docker compose --env-file backend/.env down
```

Dữ liệu nằm trong volumes `mongo40-data` và `minio-data` (Docker thêm tiền tố project). Không dùng `down -v` trên dữ liệu thật. Không gắn volume MongoDB 4.4 vào 4.0; bản này dùng volume mới, không tự chuyển dữ liệu cũ.

## Phát triển

```bash
npm ci --prefix backend
npm ci --prefix frontend
npm run lint --prefix backend
npm run build --prefix frontend
```

Có thể giữ backend/DB/MinIO trong Docker và chạy Vite riêng:

```powershell
$env:VITE_API_PROXY_TARGET='http://localhost:8080'
npm run dev --prefix frontend
```

Mở http://localhost:5173. Nếu chạy backend ngoài Docker, tự cung cấp MongoDB 4.0 và MinIO, đặt `MONGO_URI`, `MINIO_ENDPOINT`, `MINIO_PORT`, `CLIENT_ORIGIN=http://localhost:5173` rồi chạy `npm run dev` **trong `backend/`**. Docker không publish MongoDB theo mặc định.

## Chức năng và code

Đã có code: đăng ký email/password với OTP xác thực, đăng nhập bằng mật khẩu hoặc OTP, đặt lại mật khẩu bằng OTP, đăng nhập Google, refresh JWT; ghi chú Markdown/autosave; bookmark preview; upload/download/thumbnail/stream; thư mục, tags, yêu thích, tìm kiếm; trash/restore/purge; dashboard, grid/list, PWA. Tài khoản cũ được giữ trạng thái đã xác thực để không bị khóa hàng loạt. Đổi mật khẩu hoặc đổi email qua admin thu hồi các phiên cũ.

Đăng nhập Google dùng Google Identity Services và ID token xác minh tại backend. Đặt `GOOGLE_CLIENT_ID` của OAuth **Web application** trong `backend/.env`, đồng thời thêm origin web đang dùng (ví dụ `http://localhost:18080`) vào **Authorized JavaScript origins** trong Google Cloud. Luồng này không dùng `GOOGLE_CLIENT_SECRET` hay `GOOGLE_CALLBACK_URL`. Nếu một email ngoài Gmail/Workspace đã có tài khoản, hệ thống gửi OTP đến email đó trước khi liên kết Google. Xem [hướng dẫn Google](https://developers.google.com/identity/gsi/web/guides/display-button) và [xác minh ID token](https://developers.google.com/identity/sign-in/web/backend-auth).

Tài khoản mới có vai trò `user`, hạn mức **0 MB**. Admin cấp/thu hồi hạn mức tại `/app/admin/users`; người chưa được cấp vẫn đăng nhập và sửa hồ sơ tại `/app/settings`, nhưng chưa tạo dữ liệu/upload. Tài khoản cũ chưa có trường hạn mức cũng nhận 0 MB; dữ liệu giữ nguyên. Dung lượng tính cả Thùng rác; giảm hạn mức không tự xóa tệp. `MAX_STORAGE_PER_USER_MB` không còn được sử dụng.

Quản trị viên đầu tiên: đăng ký và xác thực email, sau đó người vận hành chạy lệnh với email chính xác (không tự nâng quyền người đăng ký đầu tiên):

```sh
docker compose --env-file backend/.env exec -T backend node scripts/set-admin.js admin@example.com
```

Đăng nhập lại để hiện menu quản trị. Admin có thể cấp dung lượng cho chính mình, quản lý hồ sơ/vai trò/trạng thái người dùng, tải xuống và đưa tệp vào Thùng rác/khôi phục/xóa vĩnh viễn; các thao tác được ghi lịch sử.

Avatar: tối đa 2 MB, chuẩn hóa WebP 256×256, lưu riêng tại `avatars/<userId>/` trên MinIO; không lưu file vào backend và không trừ hạn mức tệp. Browser tải trực tiếp bằng URL ký 5 phút. `MINIO_PUBLIC_ENDPOINT/PORT/USE_SSL` phải trỏ tới MinIO/CDN mà browser truy cập được (local: `localhost:9000`; production: HTTPS và proxy giữ nguyên Host/path ký).

Các trang **Bạn bè**, **Nhóm**, **Đã chia sẻ** hỗ trợ tìm người theo username/ID, lời mời, chặn; nhóm có OWNER/ADMIN/MEMBER; chia sẻ tệp cho người dùng hoặc nhóm với quyền xem/tải/chia sẻ tiếp, mật khẩu và hạn dùng. Chỉ metadata chia sẻ nằm trong MongoDB; tệp gốc vẫn nằm một lần trên MinIO. Chủ nhóm có thể chuyển quyền sở hữu rồi rời nhóm. Admin quản lý các quan hệ tại `/app/admin/collaboration`. Tài khoản cần được cấp dung lượng để tạo nhóm hoặc chia sẻ; người nhận không cần quota để xem tệp được chia sẻ.

Chưa có: bulk actions, render nội dung Office. Kết quả đã kiểm tra và giới hạn hiện tại: [AI_CONTEXT](docs/AI_CONTEXT.md).

| Thư mục | Vai trò |
| --- | --- |
| `backend/src/` | API: routes, validators, controllers, services, models, workers |
| `frontend/src/` | UI: pages, components, hooks, api, context |
| `nginx/` | Build frontend, reverse proxy |
| `scripts/`, `.github/workflows/` | Khởi tạo env, CI và triển khai |
| `docs/` | Bối cảnh, kiến trúc, quy tắc, vận hành |
| `prompts/` | Backlog → progress → completed |

API chính: `/api/auth`, `/api/items`, `/api/folders`, `/api/tags`, `/api/search`, `/api/trash`, `/api/dashboard/stats`, `/api/social`, `/api/groups`, `/api/shares`. `/api/health` kiểm tra kết nối MongoDB/MinIO; nghiệp vụ yêu cầu access JWT. Xem route chi tiết trong `backend/src/routes/`.

## Quy trình làm việc và CI/CD

Đọc [AGENTS.md](AGENTS.md) trước khi sửa. Dùng [mẫu prompt](prompts/TEMPLATE.md); theo dõi việc đang làm/đã xong tại [bảng tiến độ](prompts/README.md). Hoàn tất thì move prompt sang `completed/`, cập nhật context, kiểm tra và commit.

CI chạy khi push `main/master` hoặc mở PR: syntax backend → build frontend → Compose với `mongo:4.0` → smoke test. CD được kích hoạt thủ công sau CI, dành cho runner Linux trên server. Thiết lập, backup, rollback và phần còn thiếu: [DEPLOYMENT](docs/DEPLOYMENT.md).

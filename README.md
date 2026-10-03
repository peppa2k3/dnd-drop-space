# Personal Knowledge Hub

Kho cá nhân cho ghi chú Markdown, bookmark, ảnh/video và tệp. React/Vite PWA + Express + MongoDB **4.0** + MinIO; Nginx phục vụ web và proxy `/api`.

## Chạy nhanh

Yêu cầu: Docker với Linux containers, Docker Compose v2+; Node.js 22+ để tạo `.env` và phát triển local.

```bash
node scripts/init-env.cjs
docker compose --env-file backend/.env up -d --build --wait --wait-timeout 180
```

Script tạo secrets ngẫu nhiên nếu `.env` chưa tồn tại; giữ nguyên file đã có. Với file cũ, kiểm tra `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, JWT secrets và đặt `CLIENT_ORIGIN=http://localhost:8080`, `NODE_ENV=development` cho local HTTP.

- Website: http://localhost:8080 — chọn **Tạo tài khoản mới** để bắt đầu.
- MinIO Console: http://localhost:9001 — dùng credentials trong `backend/.env`.
- MongoDB: nội bộ Docker tại `mongo:27017`, không mở cổng ra máy host.
- Đổi cổng host bằng `WEB_PORT`, `MINIO_API_PORT`, `MINIO_CONSOLE_PORT` trong `.env`; đổi `CLIENT_ORIGIN` tương ứng.

```bash
# Trạng thái / kiểm tra tích hợp / dừng giữ dữ liệu
docker compose --env-file backend/.env ps
docker compose --env-file backend/.env exec -T backend npm run test:smoke
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

Đã có code: đăng ký/login/refresh JWT; ghi chú Markdown/autosave; bookmark preview; upload/download/thumbnail/stream; thư mục, tags, yêu thích, tìm kiếm; trash/restore/purge; dashboard, grid/list, PWA.

Tài khoản mới có vai trò `user`, hạn mức **0 MB**. Admin cấp/thu hồi hạn mức tại `/app/admin/users`; người chưa được cấp vẫn đăng nhập và sửa hồ sơ tại `/app/settings`, nhưng chưa tạo dữ liệu/upload. Tài khoản cũ chưa có trường hạn mức cũng nhận 0 MB; dữ liệu giữ nguyên. Dung lượng tính cả Thùng rác; giảm hạn mức không tự xóa tệp. `MAX_STORAGE_PER_USER_MB` không còn được sử dụng.

Quản trị viên đầu tiên: đăng ký tài khoản, sau đó người vận hành chạy lệnh với email chính xác (không tự nâng quyền người đăng ký đầu tiên):

```sh
docker compose --env-file backend/.env exec -T backend node scripts/set-admin.js admin@example.com
```

Đăng nhập lại để hiện menu quản trị. Admin có thể cấp dung lượng cho chính mình, quản lý hồ sơ/vai trò/trạng thái người dùng, tải xuống và đưa tệp vào Thùng rác/khôi phục/xóa vĩnh viễn; các thao tác được ghi lịch sử.

Avatar: tối đa 2 MB, chuẩn hóa WebP 256×256, lưu riêng tại `avatars/<userId>/` trên MinIO; không lưu file vào backend và không trừ hạn mức tệp. Browser tải trực tiếp bằng URL ký 5 phút. `MINIO_PUBLIC_ENDPOINT/PORT/USE_SSL` phải trỏ tới MinIO/CDN mà browser truy cập được (local: `localhost:9000`; production: HTTPS và proxy giữ nguyên Host/path ký).

Chưa có: bulk actions, chia sẻ giữa tài khoản, render nội dung Office. Kết quả đã kiểm tra và giới hạn hiện tại: [AI_CONTEXT](docs/AI_CONTEXT.md).

| Thư mục | Vai trò |
| --- | --- |
| `backend/src/` | API: routes, validators, controllers, services, models, workers |
| `frontend/src/` | UI: pages, components, hooks, api, context |
| `nginx/` | Build frontend, reverse proxy |
| `scripts/`, `.github/workflows/` | Khởi tạo env, CI và triển khai |
| `docs/` | Bối cảnh, kiến trúc, quy tắc, vận hành |
| `prompts/` | Backlog → progress → completed |

API chính: `/api/auth`, `/api/items`, `/api/folders`, `/api/tags`, `/api/search`, `/api/trash`, `/api/dashboard/stats`. `/api/health` kiểm tra kết nối MongoDB/MinIO; nghiệp vụ yêu cầu access JWT. Xem route chi tiết trong `backend/src/routes/`.

## Quy trình làm việc và CI/CD

Đọc [AGENTS.md](AGENTS.md) trước khi sửa. Dùng [mẫu prompt](prompts/TEMPLATE.md); theo dõi việc đang làm/đã xong tại [bảng tiến độ](prompts/README.md). Hoàn tất thì move prompt sang `completed/`, cập nhật context, kiểm tra và commit.

CI chạy khi push `main/master` hoặc mở PR: syntax backend → build frontend → Compose với `mongo:4.0` → smoke test. CD được kích hoạt thủ công sau CI, dành cho runner Linux trên server. Thiết lập, backup, rollback và phần còn thiếu: [DEPLOYMENT](docs/DEPLOYMENT.md).

# Context 005 — RBAC (2026-10-03)

## Hành vi và giới hạn

- Role `user/admin`; trạng thái `active/disabled`. Register chỉ nhận name/email/password, không nhận quyền. User cũ thiếu trường dùng default của schema; không chạy migration ghi đè hàng loạt.
- Quota riêng `User.storageLimitBytes`, mặc định 0. Chặn upload trước Multer và kiểm tra tổng batch dưới khóa theo user trước lưu MinIO. Admin cập nhật quota dùng cùng khóa. Chỉ chạy một replica API.
- 0 MB: vẫn sửa hồ sơ/avatar, đọc và dọn dữ liệu cũ; không tạo note/bookmark/folder/tag hoặc sửa nội dung note. Giảm quota dưới mức đã dùng không tự xóa tệp. Trash vẫn chiếm dung lượng.
- Quota tính file gốc theo Item; avatar/thumbnail là phần phụ trợ riêng. Avatar tối đa 2 MB/16 megapixel, chuẩn hóa WebP 256×256, thay ảnh thì dọn ảnh cũ; không lưu disk backend.
- Avatar được lưu `avatars/<userId>/<uuid>.webp`; endpoint có auth trả redirect tới URL MinIO ký 300 giây. Endpoint công khai phải cấu hình đúng Host/port/HTTPS, bucket không public. URL đã ký còn hiệu lực tới khi hết hạn.
- Admin tìm/phân trang user, sửa hồ sơ/email/role/status/quota; tải xuống, trash/restore và xóa vĩnh viễn tệp đã ở Trash. Không tự demote/khóa chính mình; bảo vệ admin active cuối cùng.
- Middleware đọc User mỗi request. Khóa user tăng sessionVersion và revoke refresh; mở khóa không làm token cũ hợp lệ trở lại. Role đổi có hiệu lực với request kế tiếp; đăng nhập lại để UI cập nhật menu.
- AdminAudit ghi thao tác quản trị/CLI. MongoDB 4.0 standalone: thay đổi và audit chưa có transaction chung. Không bao gồm chia sẻ dữ liệu hoặc role tùy biến.

## API và vận hành

- `PATCH /api/users/me`: name, username (3–32 ký tự thường/số/_; unique), bio.
- `POST /api/users/me/avatar`, `GET /api/users/:id/avatar`: chủ hồ sơ hoặc admin đọc ảnh.
- `GET /api/admin/users?page=&q=`, `PATCH /api/admin/users/:id`.
- `GET /api/admin/users/:id/files`, `GET .../files/:itemId/download`, `PATCH .../files/:itemId` với isTrashed, `DELETE .../files/:itemId` chỉ sau trash.
- `GET /api/admin/users/:id/audit?page=`. Trang quản trị `/app/admin/users`; hồ sơ `/app/settings`.
- Bootstrap: `docker compose --env-file backend/.env exec -T backend node scripts/set-admin.js <email-da-dang-ky>`. Chưa chọn email thật nên chưa tự nâng quyền tài khoản nào. CLI không cấp quota; admin cấp bằng UI.
- `MINIO_PUBLIC_ENDPOINT/PORT/USE_SSL`: endpoint avatar cho browser, local localhost:9000. `MAX_STORAGE_PER_USER_MB` không còn tác dụng.

## File đã thay đổi

| Vùng | File và mục đích |
| --- | --- |
| Model/token | `backend/src/models/User.js`, `AdminAudit.js`; `services/token.service.js`: quyền, quota, profile, phiên, audit |
| Auth/quota | `middlewares/auth.middleware.js`, `services/storage.service.js`, `controllers/auth.controller.js`, `dashboard.controller.js`, `upload.controller.js`: chặn quyền, quota/batch |
| API mới | `controllers/user.controller.js`, `admin.controller.js`, `validators/user.validator.js`, `routes/user.routes.js`, `admin.routes.js` |
| API hiện có | `routes/index.js`, `item.routes.js`, `middlewares/ownedFolder.middleware.js`: mount API, kiểm tra cấp dung lượng và chủ thư mục |
| MinIO | `config/env.js`, `config/minio.js`, `backend/.env.example`: ký URL avatar theo endpoint browser |
| Kiểm tra/CLI | `backend/scripts/rbac-smoke.js`, `smoke.js`, `set-admin.js`, `backend/package.json`, `.github/workflows/ci.yml` |
| Frontend API/cache | `frontend/src/api/user.api.js`, `hooks/useUsers.js`, `useDashboard.js`, `context/AuthContext.jsx`: query/mutation, refresh quota, xóa cache khi đổi phiên |
| Frontend UI | `pages/AdminUsers.jsx`, `Settings.jsx`, `Dashboard.jsx`, `App.jsx`, `components/layout/Sidebar.jsx`, `Topbar.jsx`, `components/common/Menu.jsx`, `utils/uploadCapacity.js` |
| Tài liệu | `README.md`, `docs/AI_CONTEXT.md`, `ARCHITECTURE.md`, `CODING_RULES.md`, `DEPLOYMENT.md`, `prompts/README.md`, prompt 005 và context này; backlog production đổi 005 → 006 để tránh trùng ID |

## Bằng chứng và rollback

- Frontend build/backend lint qua; Compose 4 service healthy, MongoDB 4.0.28. Smoke cũ và RBAC 54 kiểm tra HTTP qua; dữ liệu kiểm thử đã dọn.
- RBAC smoke có trường hợp tự nâng quyền, profile giả quota, username trùng, avatar sai/quá lớn, URL MinIO ký hợp lệ, truy cập chéo, thu hồi quota, batch quá hạn mức không lưu một phần, khóa/mở khóa và token cũ, quản trị tệp/audit/CLI.
- Browser không kết nối; chưa kiểm thử tương tác UI. Chưa chạy CI GitHub hoặc triển khai production/CDN thật.
- Trước rollback có dữ liệu thực: ngừng ghi, backup đồng bộ MongoDB/MinIO theo DEPLOYMENT. Có thể quay lại image trước, giữ nguyên trường/collection mới và object avatar; không drop/xóa dữ liệu. Bản cũ bỏ qua RBAC/quota riêng và dùng quota toàn cục, nên không đưa public bản cũ nếu còn cần chính sách quyền mới. Lần triển khai này không bulk update hoặc xóa dữ liệu cũ.

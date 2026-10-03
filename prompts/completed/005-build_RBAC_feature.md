# 005 — RBAC và quản trị dung lượng

- Mục tiêu: tài khoản mới có 0 MB, admin cấp/thu hồi hạn mức, quản lý người dùng/tệp; người dùng sửa hồ sơ và avatar trên MinIO.
- Phạm vi: backend, frontend, CI và tài liệu. Giữ MongoDB 4.0.
- Dữ liệu: thêm trường User và AdminAudit; tài khoản cũ thiếu hạn mức nhận 0 MB, không xóa tệp. Không tự cấp admin cho tài khoản thật. Rollback/xử lý dữ liệu: xem logscontext.

## Tiêu chí hoàn tất

- [x] Role user/admin được kiểm tra ở server; profile không nhận trường quyền/quota.
- [x] Chưa cấp dung lượng: khóa upload/tạo dữ liệu, vẫn đăng nhập và sửa hồ sơ.
- [x] Admin tìm/sửa người dùng, cấp/thu hồi quota, đổi vai trò, khóa/mở khóa, quản lý tệp và xem lịch sử.
- [x] Dashboard hiển thị hồ sơ; Settings sửa tên, username, giới thiệu, avatar MinIO.
- [x] Cập nhật logscontext, tiến độ, chuyển completed và commit đúng phạm vi.

## Kết quả kiểm tra (2026-10-03)

- Frontend `npm run build`, backend `npm run lint`: qua.
- Compose build/up: 4 service healthy, MongoDB 4.0.28.
- Backend container `npm run test:rbac`: 54 kiểm tra HTTP qua; gồm leo thang quyền, quota/batch upload, hồ sơ, avatar ký MinIO, chủ sở hữu, admin tệp/audit, khóa và thu hồi phiên, bootstrap CLI. Fixtures đã dọn.
- Backend container `npm run test:smoke`: qua các chức năng cũ, quota/upload đồng thời và Trash; fixtures đã dọn.
- Browser không có kết nối; chưa xác nhận thao tác giao diện trực tiếp. CI mới thêm bước RBAC, chưa chạy trên GitHub.
- Context/file mapping/cách vận hành: [005-rbac](../logscontext/005-rbac.md).
- Commit: xem `git log --all -- prompts/completed/005-build_RBAC_feature.md`.

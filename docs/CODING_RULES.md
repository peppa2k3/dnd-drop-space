# Quy tắc code

- Backend CommonJS, frontend ES modules/JSX; giữ style 2 spaces. Không refactor ngoài phạm vi prompt.
- Route → middleware/validator → controller → service/model. Dùng `asyncHandler`, `ApiError`, `ApiResponse` hiện có.
- Validate bằng Zod; đọc/ghi dữ liệu cá nhân phải kiểm tra chủ sở hữu, kể cả folder/tag được tham chiếu.
- Thay đổi dữ liệu cần nêu tác động, backup và cách quay lại. Xóa thường vào trash; không tự purge/xóa volume để sửa lỗi.
- Biến môi trường qua `backend/src/config/env.js`; chỉ commit mẫu. Không log token, cookie hoặc URL có token.
- Giữ `package-lock.json`, dùng `npm ci`; đổi driver phải kiểm tra trên `mongo:4.0` thật.
- API frontend qua `src/api`, cache qua hooks; không lưu access token vào localStorage.
- RBAC/quota: đọc quyền hiện tại từ User, không tin role/quota client gửi. API hồ sơ chỉ nhận trường cho phép; API quản trị phải có `requireAdmin`. Thay đổi phân quyền phải chạy `npm run test:rbac` trong backend container; không tự nâng quyền tài khoản thật khi chưa xác định email.

## Trước khi hoàn tất
1. Chạy kiểm tra liên quan: syntax backend, build frontend; đổi Docker/driver phải chạy Compose và smoke test.
2. Ghi lệnh, kết quả, giới hạn chưa kiểm tra vào prompt.
3. `git diff --check`, xem staged diff/secrets, cập nhật tiến độ và commit đúng phạm vi. Không commit file sinh ra hoặc dữ liệu test.

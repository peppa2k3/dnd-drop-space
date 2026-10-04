# Bối cảnh dự án

Cập nhật: 2026-10-04. Nguồn: README và code; chi tiết ở [tiến độ prompt](../prompts/README.md).

## Sản phẩm hiện có
DND Drop Space (trước đây là Personal Knowledge Hub): kho cá nhân cho ghi chú Markdown, bookmark và tệp. Code có auth JWT, thư mục, tags, yêu thích, tìm kiếm, thùng rác, dashboard, upload/thumbnail/streaming, React PWA, bạn bè, nhóm và chia sẻ tệp. Chưa có bulk actions và preview nội dung Office.

## Trạng thái đã xác nhận
- `001/002` hoàn tất: tài liệu/prompt, Docker local, cấu hình CI/CD.
- Website trên máy hiện tại: **http://localhost:18080** (`WEB_PORT` trong `.env`; mặc định ở repo là 8080). Bốn service healthy, MongoDB **4.0.28**, Mongoose **7.8.12**.
- Đã qua: build frontend, syntax backend, smoke qua Nginx (auth/refresh, note, folder/tag, search, upload/download, trash/restore), thumbnail ảnh/video và ffprobe.
- Prompt `003` hoàn tất: hiển thị dung lượng và tên tệp Unicode đúng; hạn mức 2 GiB lúc đó đã được thay bằng cấp phát riêng ở prompt `005`.
- Prompt `004` hoàn tất: modal upload và nút chèn tệp trong ghi chú kiểm tra quota trước khi gửi; modal khóa nút upload khi tổng tệp vượt dung lượng còn lại hoặc giới hạn server. Backend vẫn xác nhận quota khi nhận upload.
- Prompt `005` hoàn tất: RBAC user/admin, mặc định 0 MB, quản trị hồ sơ/quota/trạng thái/tệp và audit; hồ sơ cá nhân, username, avatar MinIO. Kiểm tra RBAC 55 request trên MongoDB 4.0.28. Context chi tiết: [005 RBAC](../prompts/logscontext/005-rbac.md).
- Prompt `006` hoàn tất: bạn bè/block, nhóm với vai trò riêng, chia sẻ tệp theo người/nhóm, quyền xem/tải/chia sẻ tiếp, mật khẩu/hạn dùng và quản trị. Quyền được xét lại ở backend theo block, membership và chuỗi chia sẻ; không sao chép tệp MinIO. Kiểm tra tích hợp 101 request trên MongoDB 4.0.28; xem [log kiểm tra](../prompts/logscontext/006-collaboration.md).
- Prompt `007` đang làm: code email OTP (xác thực, đăng nhập, đặt lại mật khẩu) và Google Login đã có, test tích hợp **lượt trước** với SMTP/Google mô phỏng đạt 50 request trên MongoDB 4.0.28. Lượt 2026-10-04 bổ sung kiểm tra cấu hình production, validator OTP và tải Google UI; người dùng yêu cầu bỏ qua test local nên chưa có kết quả thực thi cho diff mới. SMTP thật từ container từng trả `EAUTH`; chưa kiểm tra Google consent/account thật hoặc UI tương tác. Xem [log](../prompts/logscontext/007-auth.md).
- Prompt `008` đang làm: tên DND Drop Space, năm theme với dark/light, semantic tokens trên frontend và preference lưu theo user; đã qua build, frontend lint (1 cảnh báo cũ) và 110 cặp contrast. Browser chưa khả dụng để xác nhận UI tương tác. Xem [prompt](../prompts/progress/008-themes-mode-feature.md).
- Workflow qua actionlint, deploy script qua `bash -n`; **chưa chạy trên GitHub/server thật**. Browser không có kết nối nên chưa kiểm thử giao diện tương tác.
- Chưa có Git remote/domain/server production. Chưa audit bảo mật đầy đủ hoặc diễn tập backup/restore; dự án hiện ở mức MVP chạy local + nền tảng triển khai.

## Ràng buộc
- MongoDB **4.0**; driver tương thích; không gắn volume từ bản cao hơn vào 4.0.
- Metadata ở MongoDB, tệp ở MinIO; giữ mô hình `Item` thống nhất.
- Tính năng có code không đồng nghĩa đã kiểm thử đầy đủ. Ghi kết quả chạy thật vào prompt.

## Tiếp theo
Prompt `007` đang chờ SMTP credential hợp lệ và kiểm thử email/Google/UI thực tế khi deploy; chưa chuyển sang `completed`. Prompt `008` chờ kiểm tra UI thực tế. Cấp admin đầu tiên bằng `backend/scripts/set-admin.js <email>` sau khi tài khoản đã xác thực; chưa tự cấp quyền cho tài khoản thật. Prompt `009` đưa public khi có hạ tầng và Git remote; xem `docs/DEPLOYMENT.md`. Giữ nguyên các volumes `pkh_mongo40-data` và `pkh_minio-data`.

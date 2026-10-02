# Bối cảnh dự án

Cập nhật: 2026-10-02. Nguồn: README và code; chi tiết ở [tiến độ prompt](../prompts/README.md).

## Sản phẩm hiện có
Personal Knowledge Hub: kho cá nhân cho ghi chú Markdown, bookmark và tệp. Code có auth JWT, thư mục, tags, yêu thích, tìm kiếm, thùng rác, dashboard, upload/thumbnail/streaming và React PWA. Chưa có bulk actions, chia sẻ tài khoản, preview nội dung Office.

## Trạng thái đã xác nhận
- `001/002` hoàn tất: tài liệu/prompt, Docker local, cấu hình CI/CD.
- Website trên máy hiện tại: **http://localhost:18080** (`WEB_PORT` trong `.env`; mặc định ở repo là 8080). Bốn service healthy, MongoDB **4.0.28**, Mongoose **7.8.12**.
- Đã qua: build frontend, syntax backend, smoke qua Nginx (auth/refresh, note, folder/tag, search, upload/download, trash/restore), thumbnail ảnh/video và ffprobe.
- Prompt `003` hoàn tất: mặc định 2 GiB/tài khoản, Sidebar/Dashboard/Settings hiện dung lượng đúng; upload Unicode và download đúng tên. Ba tên cũ bị lỗi đã sửa riêng trong MongoDB. Smoke kiểm tra quota, upload đồng thời và vòng đời Trash trên MongoDB 4.0.28.
- Prompt `004` hoàn tất: modal upload và nút chèn tệp trong ghi chú kiểm tra quota trước khi gửi; modal khóa nút upload khi tổng tệp vượt dung lượng còn lại hoặc giới hạn server. Backend vẫn xác nhận quota khi nhận upload.
- Workflow qua actionlint, deploy script qua `bash -n`; **chưa chạy trên GitHub/server thật**. Browser không có kết nối nên chưa kiểm thử giao diện tương tác.
- Chưa có Git remote/domain/server production. Chưa audit bảo mật đầy đủ hoặc diễn tập backup/restore; dự án hiện ở mức MVP chạy local + nền tảng triển khai.

## Ràng buộc
- MongoDB **4.0**; driver tương thích; không gắn volume từ bản cao hơn vào 4.0.
- Metadata ở MongoDB, tệp ở MinIO; giữ mô hình `Item` thống nhất.
- Tính năng có code không đồng nghĩa đã kiểm thử đầy đủ. Ghi kết quả chạy thật vào prompt.

## Tiếp theo
Không có prompt đang làm. `005` đưa public khi có hạ tầng và Git remote. Điều kiện đưa public trong `docs/DEPLOYMENT.md`. Giữ nguyên các volumes cũ; bản local này dùng `pkh_mongo40-data` và `pkh_minio-data` mới.

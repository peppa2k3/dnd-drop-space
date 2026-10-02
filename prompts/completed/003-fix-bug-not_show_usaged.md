# 003 — Sửa dung lượng và tên tệp tiếng Việt (hoàn tất)

- Mục tiêu: mỗi tài khoản có hạn mức mặc định 2 GiB; Sidebar hiện dung lượng đã dùng/tổng dung lượng; tên tệp tiếng Việt đúng khi upload và tải về.
- Tái hiện: upload trả 201 nhưng `title` và `fileMeta.originalName` thành `tiáº¿ng trung chÆ°Æ¡ng 1.pdf`; Sidebar báo sai/thiếu dung lượng.
- Phạm vi: cấu hình/quota/dashboard/upload backend, Sidebar/Dashboard/Settings, smoke test, tài liệu tiến độ.
- Ngoài phạm vi: triển khai production, đổi schema, di chuyển đối tượng MinIO.
- Rủi ro dữ liệu: hạn mức mới chặn upload khi đã đầy; tệp trong Thùng rác vẫn chiếm quota. Ba bản ghi tên sai đã được sửa metadata bằng điều kiện khớp giá trị cũ. Nếu cần quay lại và tên chưa bị sửa thêm, chuyển chuỗi Unicode hiện tại thành byte UTF-8 rồi đọc theo latin1; backup trước khi áp dụng rollback.

## Tiêu chí hoàn tất
- [x] Upload mới lưu/đọc tên Unicode đúng, download gửi `filename*` UTF-8.
- [x] Sidebar hiện đã dùng / hạn mức thật; Dashboard và Settings thống nhất.
- [x] Quota mặc định 2 GiB, vượt mức trả 413; upload đồng thời không vượt mức trên một API replica.
- [x] Prompt chuyển vào `completed/`, trạng thái dự án cập nhật, kiểm tra và commit.

## Kết quả
- MongoDB aggregation dùng ObjectId; dung lượng tính cả tệp trong Thùng rác và trở về 0 sau xóa vĩnh viễn. API trả `usedStorageBytes` và `storageLimitBytes`.
- Cấu hình local đã đổi từ 1024 lên 2048 MiB trong `.env` (file này không commit). Tài khoản được nêu trong log có 4 tệp, tổng 511.512.188 byte / 2.147.483.648 byte; tổng API khớp metadata.
- Sửa 3 tên tệp cũ bị mojibake, gồm ví dụ trong prompt; không đổi dữ liệu MinIO.
- `npm run lint --prefix backend`, `npm run build --prefix frontend`, Docker Compose 4 service healthy, `npm run test:smoke` (Unicode, stats, quota, hai upload đồng thời, Trash) đạt trên MongoDB 4.0.28; HTTP web/assets/API đạt.
- Giới hạn: chưa có kiểm thử giao diện trong Browser; quota khóa theo tài khoản trong một API process như kiến trúc hiện tại. Mở rộng nhiều replica cần cơ chế đặt chỗ dùng chung.
- Commit: xem `git log --all -- prompts/completed/003-fix-bug-not_show_usaged.md`.

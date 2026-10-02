# 004 — Cảnh báo trước khi upload vượt dung lượng

- Mục tiêu: kiểm tra dung lượng còn trống trước khi tải tệp, báo lỗi rõ ràng và khóa nút upload khi không đủ dung lượng hoặc vượt giới hạn.
- Tái hiện: server trả HTTP 413 `Storage quota exceeded` sau khi trình duyệt đã gửi tệp lớn.
- Phạm vi: modal upload, nút chèn tệp trong ghi chú, API dashboard và tài liệu tiến độ. Route upload đã kiểm tra quota nên không cần sửa.
- Rủi ro dữ liệu: không đổi schema hoặc dữ liệu hiện có. Smoke chỉ tạo rồi xóa fixture riêng.

## Tiêu chí hoàn tất

- [x] Cảnh báo và khóa nút upload khi tệp đã chọn vượt dung lượng còn lại, giới hạn mỗi tệp hoặc số tệp/lần.
- [x] Lấy lại dung lượng ngay trước lúc gửi; backend tiếp tục kiểm tra quota để xử lý thay đổi đồng thời.
- [x] Nút chèn ảnh/tệp trong ghi chú cũng kiểm tra trước khi gửi.
- [x] Kiểm tra, cập nhật tiến độ, chuyển prompt vào `completed/` và commit.

## Kết quả

- Dashboard trả thêm `maxFileSizeBytes`, `maxFilesPerUpload`; giao diện hiển thị dung lượng còn lại và cảnh báo ngay khi chọn tệp.
- `npm run build` frontend: qua. Kiểm tra hàm dung lượng: 5 trường hợp qua. `npm run lint` backend: qua.
- `docker compose --env-file backend/.env up -d --build --wait --wait-timeout 180`: 4 service healthy.
- `docker compose --env-file backend/.env exec -T backend npm run test:smoke`: qua trên MongoDB 4.0.28; fixtures đã dọn.
- Chưa kiểm thử thao tác trực tiếp bằng browser trong phiên này.
- Commit: xem `git log --all -- prompts/completed/004-fix-bug-not-alert-when-upload.md`.

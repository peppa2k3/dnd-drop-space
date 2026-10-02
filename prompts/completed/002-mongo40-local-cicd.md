# 002 — MongoDB 4.0, local và nền tảng CI/CD

- Mục tiêu: chạy website local với `mongo:4.0`, kiểm chứng API và chuẩn bị pipeline.
- Phạm vi: Compose, Dockerfile, dependency/lock backend, proxy/env, scripts, workflows, hướng dẫn.
- Ngoài phạm vi: public khi chưa có server/domain/Git remote (prompt 003).
- Rủi ro: hạ MongoDB có thể hỏng volume cũ; dùng volume mới và giữ volume hiện có. Smoke chỉ tạo/xóa dữ liệu test riêng.

## Tiêu chí hoàn tất
- [x] MongoDB 4.0 và các service healthy; website truy cập được.
- [x] Build frontend, syntax backend, smoke auth/note/search/upload/trash qua Nginx đạt.
- [x] CI/CD và runbook review được; ghi rõ phần chưa chạy trên GitHub/server.
- [x] Diff/secrets kiểm tra, tài liệu cập nhật; commit cùng file này.

## Kết quả
- Hoàn tất 2026-10-02. URL local **http://localhost:18080**; cổng 8080 đang dùng, Docker không bind được 8081. `.env` local dùng 18080, repo mặc định 8080.
- Compose `mongo:4.0`/shell `mongo`; MongoDB thực tế **4.0.28**, Mongoose **7.8.12**, driver **5.9.2**. Giữ volume cũ, tạo `pkh_mongo40-data` và `pkh_minio-data` riêng.
- Sửa enum category cho phép `null` rõ ràng trên Mongoose 7: ghi chú/bookmark giữ nguyên dạng dữ liệu, không migration. Smoke đã bắt được lỗi 400 trước sửa.
- Docker dùng `npm ci`, user không phải root, không chứa `.env`. Khóa ffprobe và đặt quyền executable; kiểm tra thumbnail ảnh/video + duration đã qua. Bỏ phụ thuộc apt sau lỗi checksum lúc tải gói Debian.
- Đồng bộ credentials MinIO, health MongoDB/MinIO/API/Nginx; bind host loopback, trust proxy một hop, bỏ query token khỏi access log.
- CI: syntax/build/Compose/smoke; CD thủ công qua CI, release theo SHA và rollback app khi health lỗi. Runbook ghi rõ secrets, HTTPS, backup/restore.

## Bằng chứng kiểm tra
- `npm ci --prefix frontend` và `npm run build --prefix frontend`: đạt; build Docker backend/frontend: đạt.
- `docker compose --env-file backend/.env up -d --build --wait --wait-timeout 180`: đạt; bốn service healthy.
- `docker compose --env-file backend/.env exec -T backend npm run lint`: đạt.
- `docker compose --env-file backend/.env exec -T backend npm run test:smoke`: đạt; fixtures được dọn theo user test riêng.
- Kiểm tra bổ sung trong container: tạo thumbnail ảnh/video và đọc duration bằng ffprobe đạt; `.env` không có trong image.
- HTTP từ host: trang web, assets, manifest và `/api/health` trả 200; `nginx -t` đạt.
- `actionlint`, `bash -n scripts/deploy.sh`, link docs và `git diff --check`: đạt.

## Giới hạn / bước tiếp theo
- Chưa kiểm UI tương tác vì Browser không có phiên kết nối. Smoke API không thay thế kiểm thử cookie Secure trong browser HTTPS.
- Chưa chạy CI trên GitHub, CD/rollback trên VPS, audit bảo mật hoặc backup/restore. Prompt 003 giữ riêng các việc này.
- Commit: `git log --all -- prompts/completed/002-mongo40-local-cicd.md`.

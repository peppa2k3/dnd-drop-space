# 011 — Refactor CI/CD production cho Traefik và storage dùng chung

- Phạm vi file: workflow CI/CD, Compose production, deploy script, env mẫu, tài liệu deploy/context/tiến độ.
- Ngoài phạm vi: thay đổi Traefik, MongoDB 4.0, MinIO và dữ liệu trên VPS khi chưa có thông tin hạ tầng thực.
- Rủi ro dữ liệu / cách quay lại: rollback chỉ đổi hai image app đã verify; MongoDB/MinIO cần kế hoạch backup riêng. Bản 009 bốn service cần migration thủ công, script từ chối tự động chuyển.

## Mục tiêu
Khi push `main`, CI kiểm tra mã nguồn, build và push **chỉ hai image ứng dụng**: backend và frontend/web; VPS pull đúng tag commit rồi triển khai qua Traefik hiện có. MongoDB và MinIO là dịch vụ dùng chung đã chạy trên VPS, chỉ kết nối bằng cấu hình riêng, không tạo container/volume mới.

## Phạm vi
- Rà soát và sửa `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `docker-compose.prod.yml`, `scripts/deploy.sh`, cấu hình nginx và tài liệu env/deploy liên quan; giữ CI test độc lập với production.
- Production dùng Docker network Traefik external `web`; định tuyến HTTPS `dangngochai.io.vn` cho frontend và `api.dangngochai.io.vn` cho backend nếu frontend/nginx không tự proxy `/api` và Socket.io. Dùng đúng entrypoint/certresolver hiện có, không tạo Traefik mới và không chiếm router của web khác.
- Backend kết nối MongoDB/MinIO đang chạy qua network/URI thực tế trên VPS; lấy URI, access key, secret từ private env, không ghi vào image, workflow hay log. Không dùng `localhost` trong container để trỏ sang dịch vụ khác.

## Tiêu chí hoàn tất
- [x] `docker-compose.prod.yml` chỉ quản lý backend và frontend/web; không khai báo MongoDB, MinIO hoặc volume dữ liệu của chúng. Script deploy/rollback không dừng, xóa hay thay đổi dịch vụ dùng chung (kiểm tra tĩnh và mock flow đã chạy).
- [ ] Push `main` chạy lint/test, build/push image theo commit SHA, deploy bằng user `deploy`, kiểm tra health và HTTPS hai domain, promote tag sau verify; lỗi thì rollback **chỉ image ứng dụng** về bản đã xác nhận ổn định. Code đã chuẩn bị, chưa chạy trên GitHub/VPS.
- [ ] Kiểm tra đường kết nối Traefik → ứng dụng → MongoDB/MinIO, quyền pull registry trên VPS, `docker compose config`, healthcheck, rollback và không xung đột project/network/port với web khác. CI tách riêng MongoDB/MinIO; chưa có quyền truy cập VPS.
- [x] Cập nhật hướng dẫn: network/hostname của container dùng chung, biến env cần điền, DNS/TLS, registry auth và lệnh kiểm tra; không in giá trị bí mật. Tên hạ tầng chưa rõ đều là biến bắt buộc.

## Kết quả
- Thay đổi: Compose production, deploy/rollback script, `deploy.yml` user SSH, env mẫu, guide/context/architecture/deployment/AI context/tiến độ prompt.
- Nguyên nhân khắc phục: Compose cũ pull/chạy MongoDB và MinIO, script dừng MinIO để backup và kiểm tra bốn container; không phù hợp storage dùng chung. Bản mới chỉ pull/điều khiển app, API health xác minh kết nối lưu trữ. Quyền registry pull và SSH host key vẫn cần kiểm tra trên VPS/GitHub; không suy diễn đã khắc phục.
- Kiểm tra local: `docker compose ... config --quiet` và assert JSON đúng hai service, external networks, không volume/host port với giá trị giả lập; `bash -n scripts/deploy.sh`; `bash scripts/test-deploy-flow.sh` (verify, rollback bản cũ, cleanup lần đầu, chặn manifest cũ); `git diff --check` đạt. DNS công khai hai domain cùng về `160.187.229.39`; `curl` HTTPS site `/` và API `/api/health` đều trả HTTP 404, TLS verify 0 (2026-10-07). Chưa kiểm tra bên trong VPS/GitHub; 404 chưa chứng minh Traefik/container nào trả lời.
- Cần xác nhận: SSH host/port, fingerprint; Traefik HTTPS entrypoint/resolver/router hiện có, DNS/cert; `PKH_STORAGE_NETWORK`, hostname/port MongoDB 4.0/MinIO, bucket/public MinIO route; registry pull dưới user `deploy`, project cũ nếu có.
- Commit: xem `git log --all -- prompts/progress/011-cicd-refactor-workflow.md`; không tự ghi hash commit đang tạo.
- Chỉ move sang `completed/` sau khi kiểm chứng các mục chưa đánh dấu trên VPS/GitHub.

# Khởi chạy và triển khai

## Trạng thái

Local chạy bằng `docker-compose.yml` theo [README](../README.md). Repo đã có Git remote; workflow production mới được chuẩn bị nhưng **chưa chạy trên GitHub/VPS**. Không xem code CI/CD là bằng chứng site public. Các bước cấu hình từ đầu: [DEPLOY_GUIDES](../DEPLOY_GUIDES.md). State machine và điểm cần sửa sau khi chạy thật: [context_deploy](context_deploy.md).

## Thiết kế production

Push `main` chạy `changes → validate → build-images → push-images → deploy → verify → promote-tags`; job `rollback` chạy khi deploy hoặc verify lỗi. `workflow_dispatch` trên `main` build cả backend/web cho lần đầu. CI dùng Compose local với MongoDB 4.0; production dùng `docker-compose.prod.yml` chỉ pull image SHA từ GHCR hoặc Docker Hub. Trạng thái image từng service nằm trong `/srv/pkh/shared/current-images.env`, secret ứng dụng trong `backend.env` ngoài release. `production` tag chỉ cập nhật sau verify; Compose không dùng tag di động.

VPS chạy một Compose project cố định `pkh-production`, giữ volume `mongo40-data` và `minio-data`. Web/MinIO bind loopback sau HTTPS reverse proxy trên host; MongoDB/backend nội bộ. Docker image MongoDB là **`mongo:4.0`** và không được gắn volume từng chạy phiên bản MongoDB cao hơn. Mongoose 7.8.12 theo [bảng tương thích](https://mongoosejs.com/docs/7.x/docs/compatibility.html). MongoDB 4.0 đã [hết hỗ trợ](https://www.mongodb.com/legal/support-policy/legacy), nên kế hoạch nâng cấp phải là việc riêng có backup/restore.

Trước khi thay image, script pull candidate, dừng luồng ghi và tạo cặp backup MongoDB–MinIO cộng env/state hiện hành. Sau Compose `up --wait`, verify health bốn container và frontend/API qua loopback lẫn HTTPS public; chỉ lúc đó mới đổi `current`. Thất bại sẽ chạy lại image cũ và verify; không tự restore hoặc xóa dữ liệu. Backup vẫn ở VPS, cần offsite và diễn tập restore riêng. Rollback image không đảm bảo an toàn cho migration dữ liệu không tương thích ngược.

## Điều kiện vận hành còn chờ

- Người dùng cấu hình GitHub repository variables/secrets, registry, deploy account, VPS, DNS/TLS và production `backend.env` theo guide.
- Kiểm tra trên GitHub/VPS: CI xanh; quyền push/pull registry; backup hoàn chỉnh; login/refresh, Google/SMTP/OTP, upload/download, avatar; rollback lỗi có chủ đích trên staging và restore cặp backup trên volume riêng.
- Trước public: rà quyền folder/tag, SSRF khi preview URL, upload trong RAM, dependency, giám sát và backup định kỳ. Chỉ một replica API vì cron/quota lock nằm trong process.

Prompt code CI/CD: [009](../prompts/progress/009-build_workflow_github-VPS-deploy.md). Việc đưa public và nghiệm thu vận hành: [010](../prompts/backlog/010-production-release.md).

# Khởi chạy và triển khai

Local chạy bằng `docker-compose.yml` theo [README](../README.md), dùng MongoDB **`mongo:4.0`** và MinIO riêng cho local/CI. Cấu hình production được mô tả tại [DEPLOY_GUIDES](../DEPLOY_GUIDES.md); context trạng thái tại [context_deploy](context_deploy.md). **Chưa xác nhận deploy trên GitHub/VPS.**

Production dùng Traefik hiện có trên network external `web`, project app riêng `pkh-dnd-app` chỉ chứa backend/Nginx. Backend nối thêm private network tới MongoDB 4.0 và MinIO dùng chung; không tạo hay sửa volume/dịch vụ lưu trữ. Push `main`: CI → build/push image SHA → apply trên VPS → verify HTTPS site/API → promote tag. Rollback chỉ đổi image app về release đã verify. Secret ứng dụng ở `shared/backend.env` ngoài Git; HTTPS/TLS, registry pull, backup và restore shared storage do người vận hành xác nhận. Không dùng volume MongoDB từng chạy phiên bản cao hơn với MongoDB 4.0.

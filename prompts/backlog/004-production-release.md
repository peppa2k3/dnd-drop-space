# 004 — Triển khai production

- Mục tiêu: website HTTPS trên domain thật, backup và rollback đã kiểm chứng.
- Thiếu: Git remote, VPS/domain, quyền triển khai, nơi lưu backup.
- Phạm vi: GitHub environment/runner, secrets, HTTPS, vận hành; giữ MongoDB 4.0. Quota 2 GB thuộc prompt 003.
- Rủi ro: dữ liệu thật; backup MongoDB + MinIO và kiểm thử restore trước thay đổi.

## Tiêu chí hoàn tất
- [ ] CI xanh trên GitHub; runner CD chỉ nhận code tin cậy.
- [ ] Rà quyền folder/tag, SSRF preview URL, giới hạn upload và dependency trước public.
- [ ] HTTPS/domain, secrets, firewall, lưu trữ lâu dài sẵn sàng.
- [ ] Kiểm tra login/refresh, upload/download, backup/restore và rollback trên staging.
- [ ] Production hoạt động; ghi URL, commit và bằng chứng.

## Kết quả
Chưa bắt đầu; xem `docs/DEPLOYMENT.md`.

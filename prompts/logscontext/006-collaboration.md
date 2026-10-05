# 006 — Bạn bè, nhóm và chia sẻ tệp

Đã thêm quan hệ bạn bè/block, nhóm có OWNER/ADMIN/MEMBER và chia sẻ file cho user/group. Chia sẻ chỉ lưu tham chiếu `Item` trong MongoDB; quyền xem/tải/chia sẻ tiếp, mật khẩu, hạn dùng, membership và block được kiểm tra lại ở backend. Tệp vẫn chỉ có một object gốc trên MinIO. Chủ nhóm có thể chuyển quyền rồi rời nhóm; admin có API/UI quản trị.

Đã chạy `npm run lint --prefix backend`, `npm run build --prefix frontend`; Compose bốn service healthy với MongoDB 4.0.28. `test:smoke` đạt; `test:rbac` đạt 55 request; `test:collaboration` đạt 101 request, gồm block cao hơn share, chuỗi chia sẻ tiếp, thu hồi quyền, mật khẩu/hạn dùng, nhóm và purge metadata. Fixture test được xóa. CI đã thêm test collaboration; chưa chạy trên GitHub. UI chưa được thao tác thủ công trong browser.

Lưu ý vận hành: MongoDB 4.0 standalone không có transaction đa document; backup MongoDB và MinIO cùng thời điểm trước release có dữ liệu thật. Đưa public thuộc [prompt 010](../backlog/010-production-release.md); code CI/CD thuộc [prompt 009](../progress/009-build_workflow_github-VPS-deploy.md).

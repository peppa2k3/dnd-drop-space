# Khởi chạy và triển khai

## Hiện tại
Local dùng Compose; production chưa triển khai. Repo chưa có Git remote/server/domain. Pipeline được chuẩn bị trong `.github/workflows/`; không coi file cấu hình là bằng chứng CI/CD đã chạy.

## Local
Theo [README](../README.md). Luôn truyền `--env-file backend/.env`: Compose và backend cần cùng credentials MinIO. `.env` không nằm trong image/Git. HTTP local dùng `NODE_ENV=development`; production dùng HTTPS + `NODE_ENV=production`.

Image MongoDB là `mongo:4.0` (không phải `mongodb:4.0`); healthcheck dùng `mongo`. Mongoose được khóa `7.8.12` theo [bảng tương thích](https://mongoosejs.com/docs/7.x/docs/compatibility.html). MongoDB 4.0 đã [hết hỗ trợ từ 04/2022](https://www.mongodb.com/legal/support-policy/legacy); giữ đúng yêu cầu hiện tại và lập kế hoạch nâng cấp riêng cho vận hành dài hạn.

## CI và CD
1. Tạo Git remote và push khi được yêu cầu. Bật CI cho PR/main; đặt check `verify` bắt buộc khi merge.
2. Chuẩn bị VPS Linux x64, Docker/Compose v2+, Git, Node 22; runner riêng có label `pkh-production`. Không cho PR không tin cậy chạy trên runner này.
3. Tạo GitHub environment `production`, chỉ cho `main/master`. Có thể đặt variable `PKH_DEPLOY_ROOT` (mặc định `/srv/pkh`); runner có quyền ghi thư mục này và dùng Docker.
4. Đặt secrets trong `/srv/pkh/shared/backend.env`, quyền `600`, dựa trên `.env.example`: `NODE_ENV=production`, `CLIENT_ORIGIN=https://<domain>`, JWT/MinIO secrets riêng và các cổng host chưa bị chiếm. Không tạo secrets trong workflow logs.
5. Cấu hình reverse proxy HTTPS **trên host** → `127.0.0.1:8080`; chỉ mở 80/443. MongoDB/backend nội bộ; MinIO chỉ bind loopback. Nginx hiện giữ một hop tin cậy, chưa khôi phục IP khách qua lớp HTTPS ngoài; phải kiểm tra rate-limit khi thiết lập lớp proxy đó.
6. Chạy workflow **Deploy production** trên main/master. Workflow chạy lại CI trên đúng commit rồi build/deploy trên server; `current` chỉ chuyển sau health thành công. Image app gắn commit SHA, releases cũ được giữ.

Script `scripts/deploy.sh` tự quay về release trước nếu bước `up --wait` thất bại. Lần đầu chưa có release trước thì báo lỗi để sửa. Rollback này chỉ phục hồi ứng dụng, không phục hồi DB/MinIO; chưa áp dụng cho migration schema. Chưa kiểm chứng script trên server thật.

## Backup / rollback
- Trước release có thay đổi dữ liệu: dừng API để ngừng upload và cron; dump MongoDB bằng công cụ cùng phiên bản và sao lưu toàn bộ MinIO. Giữ cặp backup có cùng mốc thời gian, mã hóa ngoài server.
- Thử restore trên Compose project/volumes riêng, chạy smoke và kiểm tra một tệp thực tế. Không restore đè production để thử.
- Rollback thủ công trên server: lấy SHA release cũ, đặt `IMAGE_TAG=<SHA>`, `PKH_ENV_FILE=/srv/pkh/shared/backend.env`, dùng Compose của release đó với `-p pkh-production --env-file "$PKH_ENV_FILE" up -d --no-build --wait`. Xác nhận health rồi cập nhật symlink `current`.
- Không prune image/release đang dùng hoặc bản rollback; không chạy `down --volumes` ở production.

## Điều kiện đưa public
- Kiểm tra HTTPS login/refresh trong trình duyệt, upload/download, restart giữ dữ liệu, backup/restore, rollback.
- Rà quyền tham chiếu folder/tag, SSRF khi lấy URL preview, upload trong RAM và dependency audit. Chưa có audit bảo mật đầy đủ.
- Đặt quota/upload phù hợp RAM; một replica API vì cron còn nằm trong process API. Thêm giám sát uptime/dung lượng và backup định kỳ.
- Image nền Node/Nginx dùng tag dòng; pin digest cho release production sau khi kiểm chứng. Chưa có registry/image signing.

Checklist thực hiện: [prompt 005](../prompts/backlog/005-production-release.md).

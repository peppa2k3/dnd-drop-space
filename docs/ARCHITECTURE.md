# Kiến trúc

```text
Local: Browser → Nginx (:8080) → React/Vite/PWA; /api → Express
Production: Browser → Traefik (web, HTTPS) → Nginx (web) hoặc Express (/api)
                                        Express → private network → MongoDB 4.0, MinIO có sẵn
```

## Phân vùng
| Vùng | Trách nhiệm |
| --- | --- |
| `frontend/src/pages`, `components` | Trang, giao diện dùng lại |
| `frontend/src/hooks`, `api`, `context` | Query/cache, HTTP, trạng thái auth |
| `backend/src/routes`, `middlewares`, `validators` | Định tuyến, auth, upload, validate |
| `backend/src/controllers`, `services` | Nghiệp vụ; MinIO, JWT, quota, thumbnail, URL metadata |
| `backend/src/models`, `config`, `workers` | Schema, môi trường/kết nối, cron trash |
| `nginx`, Compose, `.github/workflows` | Build, proxy, khởi chạy, CI/CD |

## Quyết định
- `Item` thống nhất `note | url | file`; `Folder`, `Tag`, `User`, `RefreshToken` riêng. Truy vấn giới hạn theo người sở hữu.
- Access JWT trong bộ nhớ frontend; refresh token trong cookie httpOnly, xoay vòng. Production dùng HTTPS với cookie Secure.
- Email/password mới bắt buộc OTP xác thực trước khi nhận phiên; tài khoản cũ không có cờ xác thực được giữ quyền truy cập. `EmailOtp` lưu HMAC của mã, hạn dùng, số lần sai và cooldown; reset mật khẩu thu hồi refresh token, tăng `sessionVersion`. Access JWT có `kind=access` để bằng chứng mở khóa share không dùng được làm access token.
- Google Identity Services trả ID token cho frontend; backend dùng Google Auth Library xác minh chữ ký, issuer, audience và hạn dùng, kiểm tra `email_verified`, liên kết bằng Google `sub` và email đã có. Email ngoài Gmail/Workspace trùng tài khoản hiện có cần OTP trước khi liên kết. SMTP gửi mã qua TLS; secret chỉ ở `.env`.
- Cấu hình production phải có HTTPS origin, hai JWT secret khác nhau, dài ít nhất 32 ký tự và không dùng giá trị mẫu, Google Web client ID và SMTP; backend từ chối khởi động nếu thiếu. OTP và cổng SMTP được kiểm tra khi nạp cấu hình.
- Media hiện nhận token qua query; không ghi query vào access log. Presigned URL là cải tiến sau.
- Tìm kiếm `$lookup` + regex; không dùng operator chỉ có từ MongoDB 4.2 trở lên.
- Thumbnail chạy trong request; cron purge trong API. Chạy một replica API trước khi tách worker/cron.
- MongoDB và MinIO có volume riêng; backup/restore phải nhất quán cả hai.
- RBAC: `User.role=user|admin`, `status=active|disabled`, `storageLimitBytes=0` mặc định. Middleware đọc User mỗi request; `/admin` yêu cầu admin, API thường vẫn giới hạn chủ sở hữu. Khóa tài khoản thu hồi refresh token và tăng `sessionVersion` để token cũ không sống lại khi mở khóa.
- Quota riêng theo User, tính cả Trash; cập nhật hạn mức dùng cùng khóa với upload (một replica API). Thu hồi không xóa dữ liệu. Avatar có giới hạn riêng 2 MB, được chuẩn hóa WebP và lưu prefix `avatars/` trên MinIO; browser dùng URL ký ngắn hạn.
- `AdminAudit` ghi đổi quyền/hạn mức/hồ sơ và thao tác tệp. MongoDB 4.0 standalone chưa có transaction nhiều document; audit và thay đổi dữ liệu không nguyên tử. Bootstrap admin là lệnh CLI rõ ràng, không qua public register.
- Bạn bè: `Friendship` lưu cặp user không thứ tự; `UserBlock` lưu chiều chặn. Group: `UserGroup` lưu owner và thành viên/role `OWNER|ADMIN|MEMBER`; `GroupInvitation` lưu lời mời đang chờ. Group role tách khỏi system RBAC.
- Chia sẻ: `FileShare` tham chiếu `Item` loại file, chủ sở hữu, đích user/group và tùy chọn `parentShare` khi chia sẻ tiếp. Không sao chép object MinIO hay tính thêm quota. Đọc file kiểm tra auth → item còn tồn tại → block → direct/group membership → quyền → mật khẩu/hạn dùng; chuỗi cha phải còn hợp lệ. Rời nhóm, block, thu hồi/quyền cha có hiệu lực ở request tiếp theo. Tệp purge xóa metadata chia sẻ.
- Quyền hệ thống dùng `collaborationPolicy` và User hiện tại; quyền group được kiểm tra theo membership hiện tại. Media của người nhận đi qua API có kiểm tra quyền mỗi request, không cấp presigned URL lâu hạn. Bằng chứng mở khóa mật khẩu có hiệu lực 5 phút và bị vô hiệu khi quyền thay đổi.
- Theme: năm palette nằm trong `frontend/src/config/themes.js`, ánh xạ sang CSS variables/Tailwind semantic tokens dùng chung toàn UI. Theme độc lập với mode Light/Dark/System; System theo `prefers-color-scheme` và cập nhật khi hệ điều hành đổi màu. Mặc định Cyber Space Blue/dark. Guest lưu localStorage; tài khoản lưu `User.appearance` qua PATCH hồ sơ hiện có. ID `ice-data` cũ được chuẩn hóa thành `ice-datacenter` ở frontend; backend chấp nhận cả hai để không cần migration. Không thay đổi quyền/phiên/dữ liệu nội dung.
- i18n: `frontend/src/i18n/languages.js` khai báo chín ngôn ngữ; `config.js` tải JSON theo locale/namespace bằng i18next + react-i18next, dự phòng `vi`. Không truyền `resources: {}` vào `i18n.init`: nó chặn backend tải JSON và làm UI hiện key thô; `test:i18n` kiểm tra runtime này trước dev/build. `LanguageProvider` độc lập ThemeProvider; ưu tiên `User.language` → localStorage → ngôn ngữ browser → `vi`, cập nhật `<html lang>` và lưu tài khoản qua PATCH `/users/me`. `User.language` là trường tùy chọn nên tài khoản cũ không cần migration. `utils/format.js` dùng Intl cho số, dung lượng, ngày giờ và thời gian tương đối; chỉ dịch UI, giữ nguyên nội dung người dùng. API lỗi cũ chưa có mã chuẩn: frontend ánh xạ mã nếu có, tiếp đến HTTP status và thông báo dịch theo ngữ cảnh, tránh hiển thị nguyên văn message từ backend.

## Hướng triển khai
Một VPS Linux + Docker Compose cho giai đoạn đầu. Push `main` chạy CI riêng trước khi build/push image backend/web vào GHCR, tùy chọn Docker Hub. Production Compose project `pkh-dnd-app` chỉ quản lý hai container ứng dụng, kết nối Traefik qua external network `web` và MongoDB 4.0/MinIO dùng chung qua private network đã có. Các router Traefik phục vụ site, site `/api` và API domain; tên entrypoint/cert resolver lấy từ VPS private env. Image dùng SHA bất biến; tag `production` và state/symlink chỉ đổi sau verify HTTPS/health. Lỗi quay lại image ứng dụng trước đã xác nhận, không thao tác dịch vụ hoặc volume dùng chung. Backup/restore hai kho dữ liệu là trách nhiệm vận hành riêng; xem [DEPLOYMENT](DEPLOYMENT.md) và [context_deploy](context_deploy.md).

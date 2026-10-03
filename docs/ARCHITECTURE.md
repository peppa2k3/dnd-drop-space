# Kiến trúc

```text
Browser → Nginx (:8080 local, HTTPS ở production)
             ├─ React/Vite/PWA (static)
             └─ /api → Express (:5000 nội bộ)
                         ├─ MongoDB 4.0: metadata, tài khoản, phiên
                         └─ MinIO: tệp, thumbnail
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

## Hướng triển khai
Một VPS Linux + Docker Compose cho giai đoạn đầu. CI kiểm tra/build và smoke với MongoDB 4.0; CD triển khai commit qua CI, kiểm tra health và giữ bản trước để rollback. HTTPS, secrets, backup/restore là điều kiện đưa public; xem [DEPLOYMENT](DEPLOYMENT.md).

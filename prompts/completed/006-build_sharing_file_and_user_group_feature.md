# 006 — Xây dựng Friend, Group và File Sharing
- Mục tiêu: xây dựng tính năng friend và group cho các user,các user có thể tìm kiếm nhau và  gửi lời mời kết bạn hoặc chặn user khác không được phép tìm thấy hoặc nhìn thấy hoặc truy cập trên các file của người đang chặn dù có chung group, user được cấp quyền lưu trữ có thể tạo group,các user có thể tìm thấy nhau qua user name, user id,.. group id hoặc groupname, xây dựng tính năng shared file cho user trong hệ thống, mọi tài khoản đã đăng kí và cấp cho dung lương lưu trữ có thể share file cho các user khác thông qua user id hoặc group hoặc list friend đã kết bạn, list group, lưu ý chỉ shared cho user-group file của cá nhân mình , ko làm phình bộ nhớ , user có thể tùy chỉnh các quyền đối với file(có cho tải ko shared lại không,đặt mật khẩu cho file,...). tạo thêm quản lí RBAC cho tính năng friend group và shared file này để admin có thể quản lí
- Friend(
    User có thể:
    Tìm user bằng username, userId.
    Gửi lời mời kết bạn.
    Accept / Reject / Cancel friend request.
    Xem danh sách bạn bè.
    Unfriend user.
    Block / Unblock user.)
    Không được tạo duplicate friend relationship hoặc duplicate pending request.

- Block rule(
Nếu User A block User B:
B không tìm thấy profile A.
B không gửi friend request cho A.
Quan hệ friend A-B bị vô hiệu hóa/xóa theo thiết kế phù hợp hiện tại.
B không được truy cập file thuộc sở hữu A.
B không được truy cập file A đã share trước đó.
B không được truy cập file của A kể cả khi A và B đang cùng group.
Block phải được kiểm tra tại Backend; không chỉ ẩn dữ liệu trên Frontend.
)
- Group
Chỉ user có quyền sử dụng storage/group theo RBAC hiện tại mới được tạo group.
User có thể:
Tạo group.
Tìm group bằng groupId, groupName nếu group cho phép tìm kiếm.
Mời user vào group.
Accept / Reject invitation.
Xem member.
Leave group.

Group có role riêng:
OWNER
ADMIN
MEMBER
OWNER:
Quản lý group.
Thêm/xóa member.
Gán ADMIN.
Xóa group.
ADMIN:
Quản lý member theo phạm vi được phép.
MEMBER:
Sử dụng group và truy cập file được share cho group.
Không nhầm Group Role với System RBAC.

- File Sharing
Chỉ owner của file được phép tạo share ban đầu.
File có thể share cho:
Một user.
Nhiều user.
Friend.
Group.
Không copy/duplicate physical file khi share.
Storage vẫn chỉ chứa một file gốc.
Chỉ tạo metadata/permission/reference tới file:
File -> Share -> User/Group
Khi share cho group, quyền truy cập được xác định theo membership hiện tại của group.
User rời/bị kick khỏi group phải mất quyền truy cập file được share thông qua group.

- File Permission
Owner có thể cấu hình:
canView
canDownload
canReshare
password protection (optional)
expiration time (optional)
Owner có thể:
Xem file đã share cho ai/group nào.
Update permission.
Revoke share.
canReshare=false:
Recipient không được share file tiếp.
canDownload=false:
Backend không được cung cấp download endpoint/presigned URL cho recipient.
Không chỉ disable button trên Frontend.

- Access Priority
Khi kiểm tra quyền truy cập file:
Kiểm tra authentication.
Kiểm tra file tồn tại.
Kiểm tra ownership.
Kiểm tra block relationship.
Kiểm tra direct user share.
Kiểm tra group share + membership.
Kiểm tra permission.
Kiểm tra password/expiration nếu có.
BLOCK phải ưu tiên cao hơn SHARE.

Ví dụ:
A share file cho Group X.
A và B cùng Group X.
Sau đó A block B.
=> B phải mất quyền truy cập file của A ngay lập tức.

- RBAC
Mở rộng RBAC hiện tại với các permission phù hợp, ví dụ:
friend.use
group.create
group.manage
file.share
file.reshare
admin.friend.read
admin.group.read
admin.group.manage
admin.share.read
admin.share.revoke
Tên permission có thể điều chỉnh để phù hợp convention hiện tại.




- Tái hiện: user có thể tìm kiếm kết bạn tạo group chung ,có thể shared file cho user/group
- Phạm vi: modal , "/backend", "/frontend"
- Rủi ro dữ liệu: đảm bảo tính đúng đẵn và tối ưu dữ liệu

## Tiêu chí hoàn tất
- [x] Friend workflow hoạt động đầy đủ.
- [x] Block được enforce ở Backend.
- [x] Group và membership hoạt động đúng.
- [x] File sharing không duplicate physical file.
- [x] Direct share và Group share hoạt động.
- [x] Permission được enforce tại Backend.
- [x] Block override mọi share permission.
- [x] RBAC được tích hợp với hệ thống hiện tại.
- [x] Frontend có Friends / Groups / Shared files.
- [x] Các case quan trọng được test.
- [x] Không phá vỡ Auth/RBAC/File hiện tại.
- [x] Kiểm tra, cập nhật tiến độ, chuyển prompt vào `completed/` và commit.

## Kết quả

- Thêm `Friendship`, `UserBlock`, `UserGroup`, `GroupInvitation`, `FileShare` và API `/social`, `/groups`, `/shares`, `/admin/collaboration`.
- Thêm Friends, Groups, SharedFiles, AdminCollaboration; nối sidebar, dashboard và nút chia sẻ từ chi tiết tệp.
- Backend kiểm tra block, thành viên nhóm, quyền và chuỗi chia sẻ ở mỗi lần đọc; tệp gốc không bị nhân bản. Khi purge tệp, xóa cả metadata chia sẻ.
- Kiểm tra: `npm run lint --prefix backend`, `npm run build --prefix frontend`; `docker compose --env-file backend/.env up -d --build --wait --wait-timeout 180` (4 service healthy, MongoDB 4.0.28); trong backend container: `npm run test:smoke` đạt, `npm run test:rbac` đạt 55 request, `npm run test:collaboration` đạt 101 request. Fixture được dọn sau test.
- Giới hạn: chưa thử tương tác UI trong trình duyệt; CI mới được cấu hình, chưa chạy trên GitHub/server thật. MongoDB 4.0 standalone không có transaction đa document cho thao tác chia sẻ/xóa.
- Commit: `feat(collaboration): add friends groups and file sharing`.

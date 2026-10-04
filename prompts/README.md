# Tiến độ prompt

Luồng: `backlog/` → `progress/` → `completed/`. Move cùng file, giữ ID; không sao chép thành nhiều trạng thái. Việc bị chặn vẫn ở `progress/`, ghi lý do/bước tiếp theo. Dùng [mẫu](TEMPLATE.md).

| ID | Công việc | Trạng thái |
| --- | --- | --- |
| [001](completed/001-project-context.md) | Tài liệu và quy trình prompt | Hoàn tất |
| [002](completed/002-mongo40-local-cicd.md) | MongoDB 4.0, local, nền tảng CI/CD | Hoàn tất; chưa deploy public |
| [003](completed/003-fix-bug-not_show_usaged.md) | Sửa dung lượng và tên tệp tiếng Việt | Hoàn tất |
| [004](completed/004-fix-bug-not-alert-when-upload.md) | Cảnh báo dung lượng trước khi upload | Hoàn tất |
| [005](completed/005-build_RBAC_feature.md) | RBAC, quản trị quota/tệp, hồ sơ và avatar | Hoàn tất; xem logscontext/005-rbac.md |
| [006](completed/006-build_sharing_file_and_user_group_feature.md) | Bạn bè, nhóm, chia sẻ tệp và quản trị | Hoàn tất; xem logscontext/006-collaboration.md |
| [007](progress/007-build_GOOGLE_auth_feature.md) | Google Login, xác thực email và OTP | Code đã chuẩn bị; chờ SMTP/Google và UI thực tế |
| [008](progress/008-themes-mode-feature.md) | DND Drop Space, 5 theme và dark/light | Code/test đạt; chờ kiểm tra UI trong browser |
| [009](backlog/009-production-release.md) | Triển khai public, backup/restore | Chờ hạ tầng |

Code ban đầu ở commit `860f085`; không dựng lại lịch sử prompt chưa tồn tại.

# Tiến độ prompt

Luồng: `backlog/` → `progress/` → `completed/`. Move cùng file, giữ ID; không sao chép thành nhiều trạng thái. Việc bị chặn vẫn ở `progress/`, ghi lý do/bước tiếp theo. Dùng [mẫu](TEMPLATE.md).

| ID | Công việc | Trạng thái |
| --- | --- | --- |
| [001](completed/001-project-context.md) | Tài liệu và quy trình prompt | Hoàn tất |
| [002](completed/002-mongo40-local-cicd.md) | MongoDB 4.0, local, nền tảng CI/CD | Hoàn tất; chưa deploy public |
| [003](completed/003-fix-bug-not_show_usaged.md) | Sửa dung lượng và tên tệp tiếng Việt | Hoàn tất |
| [004](backlog/004-production-release.md) | Triển khai public, backup/restore | Chờ hạ tầng |

Code ban đầu ở commit `860f085`; không dựng lại lịch sử prompt chưa tồn tại.

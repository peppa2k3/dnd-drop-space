# Hướng dẫn làm việc

## Trước khi sửa
1. Đọc `docs/AI_CONTEXT.md`, `docs/ARCHITECTURE.md`, `docs/CODING_RULES.md` và prompt hiện tại.
2. Kiểm tra `git status`, đọc code liên quan; giữ lại module đang hoạt động.
3. Nêu ngắn gọn file sẽ sửa, cách kiểm tra và rủi ro dữ liệu.
4. Việc GitHub CI/CD/VPS: đọc thêm `docs/context_deploy.md` và `DEPLOY_GUIDES.md` để giữ đúng state, backup và rollback hiện có.

## Luồng prompt
1. Mỗi việc có một file `NNN-ten-viec.md`, theo `prompts/TEMPLATE.md`.
2. Chưa làm: `prompts/backlog/`. Bắt đầu: **move** file vào `prompts/progress/`.
3. Cập nhật checklist/kết quả trong file; ghi rõ vướng mắc, không đánh dấu xong khi chưa kiểm chứng.
4. Đạt tiêu chí: move sang `prompts/completed/`; cập nhật `prompts/README.md` và `docs/AI_CONTEXT.md`.
5. Kiểm tra diff/secrets; `git add` đúng file nhiệm vụ, commit theo `type(scope): mô tả`. Không gom thay đổi của người khác. Chỉ push khi được yêu cầu.

## Ranh giới
- `README`: cách chạy/sử dụng. `AI_CONTEXT`: dự án đang ở đâu. `ARCHITECTURE`: thành phần/quyết định. `CODING_RULES`: quy tắc sửa/kiểm tra. Prompt: phạm vi/bằng chứng từng việc.
- Giữ **MongoDB 4.0**, image chính thức `mongo:4.0`. Không hạ phiên bản trên volume cũ, xóa volume hay dữ liệu thật nếu chưa có kế hoạch riêng.
- Không commit `.env`, token, mật khẩu, dữ liệu người dùng. Phân biệt chạy local, cấu hình CI/CD và triển khai production đã xác nhận.


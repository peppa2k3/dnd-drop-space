# 007 — Xác thực email, OTP và Google

Code: đăng ký email/password chuyển sang chờ OTP; email OTP cho xác thực, đăng nhập và đặt lại mật khẩu; Google Identity Services ID token xác minh tại backend, liên kết theo `sub`/email. Email ngoài Gmail/Workspace trùng tài khoản cũ cần OTP để liên kết. Tài khoản cũ không có cờ xác thực được giữ quyền truy cập. Reset password/đổi email qua admin thu hồi phiên cũ.

Đã chạy syntax backend, build frontend và `test:auth` 50 request với SMTP/Google mô phỏng trên MongoDB 4.0.28; các test smoke/RBAC/collaboration cũ đạt. API thật từ chối Google ID token giả với HTTP 401. SMTP thật từ backend container trả `EAUTH` với `.env` hiện tại, kể cả khi bỏ khoảng trắng trong app password; không gửi email ra ngoài. Google consent với account thật và UI tương tác chưa kiểm tra vì browser không kết nối. Giữ prompt ở `progress/` cho đến khi có kiểm chứng này.

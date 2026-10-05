# 007 — Xây dựng xác thực Google và Email OTP

## Mục tiêu

Hoàn thiện hệ thống xác thực tài khoản:

- Đăng ký bằng email/password và bắt buộc xác thực email.
- Email OTP cho:
  - Verify email.
  - Login bằng OTP.
  - Forgot/reset password.
- Google Login.
- Nếu đăng nhập bằng Google, lấy thông tin user hợp lệ từ Google và đánh dấu email đã xác thực.
- Sau xác thực, tiếp tục sử dụng Auth/RBAC hiện tại của hệ thống.

## Phạm vi

- `/backend`
- `/frontend`
- Đọc biến môi trường thực tế từ `.env`.
- Cập nhật đầy đủ biến cần thiết vào `.env.example`.
- Không hard-code secret hoặc credential.

File liên quan: auth backend/frontend, `backend/.env.example`, README và tài liệu trạng thái/triển khai. Ngoài phạm vi: thay credential thật, chạy test local theo yêu cầu ngày 2026-10-04, hoặc triển khai production. Rủi ro dữ liệu: không có migration/xóa dữ liệu; bản production sẽ không khởi động nếu thiếu cấu hình auth bắt buộc. Có thể quay lại bằng commit trước, giữ nguyên volumes MongoDB/MinIO.

## Logic chính

### Email/Password

`Register → Send OTP → Verify OTP → Activate account → Login`

Không cho tài khoản chưa verify email sử dụng các chức năng yêu cầu tài khoản đã xác thực.

### Google Login

`Google Login → Verify Google identity/token tại Backend → kiểm tra email_verified → tìm hoặc tạo User → trả Access/Refresh Token`

Nếu email đã tồn tại, phải liên kết đúng với user hiện tại, không tạo duplicate account.

### Forgot Password

`Email → Send OTP → Verify OTP → Reset Password`

OTP phải có:

- Expiration.
- Resend cooldown.
- Giới hạn số lần nhập sai.
- Không lưu OTP plaintext nếu có thể tránh.

## Admin

Không áp dụng luồng đăng ký công khai để tự tạo Admin/Super Admin.

Admin/Super Admin được bootstrap/setup thủ công theo cơ chế hiện tại, nhưng khi đăng nhập vẫn phải xác thực danh tính hợp lệ.

## Security

- Verify Google token ở Backend.
- Không tin email/profile gửi trực tiếp từ Frontend.
- Không duplicate user theo cùng email.
- Không log password, OTP, token hoặc Google secret.
- Password phải hash theo cơ chế hiện tại.
- OTP hết hạn phải bị vô hiệu.
- Reset password phải revoke/invalidate session hoặc refresh token cũ nếu kiến trúc hiện tại hỗ trợ.

## Tiêu chí hoàn tất

- [ ] Register bằng email/password + verify email với SMTP thật (API/mock đã qua).
- [x] Login email/password hoạt động với account đã verify.
- [ ] Login bằng Email OTP với SMTP thật (API/mock đã qua).
- [ ] Forgot/reset password bằng OTP với SMTP thật (API/mock đã qua).
- [ ] Google Login hoạt động với Google account thật (backend/mock đã qua; chờ kiểm thử consent và origin thật).
- [ ] Google account lấy đúng email/profile và kiểm tra `email_verified` với token thật (code dùng Google Auth Library, mock đã qua).
- [x] Không tạo duplicate account khi email đã tồn tại.
- [x] Auth mới tương thích RBAC hiện tại.
- [x] `.env.example` được cập nhật đầy đủ.
- [ ] Frontend hiển thị lỗi/trạng thái xác thực hợp lý trong browser (build đã qua).
- [ ] Chuyển prompt vào `completed/` sau khi xác nhận SMTP/Google thực tế.

## Kết quả

Đã thêm `/auth/email/{verify,resend}`, `/auth/login/otp/{request,verify}`, `/auth/password/{forgot,verify,reset}`, `/auth/google`, `/auth/google/link` và cấu hình Google công khai. Đăng ký không cấp token trước khi xác thực email; tài khoản cũ giữ khả năng đăng nhập. User có trạng thái xác thực và Google `sub`; `EmailOtp` lưu hash/cooldown/attempts/hạn dùng. Access token phân biệt `kind` với token mở khóa share. Giao diện có xác thực email, OTP login, quên mật khẩu, Google button.

Biến cần thiết: `EMAIL_HOST/PORT/SECURE/USER/PASSWORD` (`EMAIL_FROM` tùy chọn), `OTP_EXPIRES_MINUTES/LENGTH/MAX_ATTEMPTS/RESEND_COOLDOWN_SECONDS`, `GOOGLE_CLIENT_ID`. `GOOGLE_CLIENT_SECRET` và `GOOGLE_CALLBACK_URL` trong `.env` cũ không được dùng bởi luồng GIS ID token. Không commit `.env`.

Kiểm tra hiện tại: backend syntax và frontend build đạt; `test:auth` đạt 50 HTTP request với SMTP và Google verifier mô phỏng trên MongoDB 4.0.28; smoke/RBAC/collaboration cũ đạt. API thật từ chối Google ID token giả với HTTP 401. SMTP xác thực trực tiếp từ backend container trả `EAUTH` kể cả khi bỏ khoảng trắng định dạng trong app password, nên chưa thể gửi email thật; Google consent chưa thử với tài khoản thật. Browser không kết nối để kiểm tra UI tương tác. Cần cập nhật SMTP credential trong `.env` (không gửi qua chat), sau đó kiểm thử email/Google thật và đưa prompt vào `completed/`.

Lượt 2026-10-04: kiểm tra tĩnh và hoàn thiện cấu hình production. Backend nay từ chối cấu hình production thiếu JWT secret đủ dài/khác nhau, Google Web client ID, SMTP hoặc HTTPS origin; cổng SMTP/OTP được xác thực lúc khởi động. Validator nhận đúng độ dài OTP đã cấu hình. Mật khẩu mới được hash trước khi tiêu thụ reset token. Nút Google dùng một lần tải script dùng chung và hiện lỗi rõ nếu thiếu client ID. `.env.example` và tài liệu triển khai liệt kê toàn bộ key ứng dụng; `IMAGE_TAG`/`PKH_ENV_FILE` do script deploy cấp ở phiên bản lúc đó. Theo yêu cầu người dùng, **không chạy test local/build/Compose ở lượt này**; tiêu chí SMTP/Google thật và UI browser vẫn chưa được xác nhận. Prompt tiếp tục ở `progress/`. Từ 2026-10-05, workflow 009 dùng `BACKEND_IMAGE`/`WEB_IMAGE` và `PKH_ENV_FILE`; xem `docs/context_deploy.md`.

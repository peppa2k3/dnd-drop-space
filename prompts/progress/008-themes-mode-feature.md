# 008 — Themes & Dark/Light Mode

## Mục tiêu
- Đặt tên ứng dụng: **DND Drop Space**.
- Xây dựng hệ thống chọn **Theme** và **Mode: Dark / Light** cho user.
- Làm mới UI theo phong cách **Modern Cloud Storage / Cyber Tech**, hiện đại, mượt, dễ sử dụng.

## Phạm vi
- `/frontend`
- `/backend` chỉ chỉnh khi cần lưu preference của user.
- Không thay đổi hoặc phá vỡ logic nghiệp vụ, API và dữ liệu hiện có.

File chính: `frontend/src/config/themes.js`, `frontend/src/context/ThemeContext.jsx`, Tailwind/CSS, layout/Settings, PWA branding; backend chỉ thêm `User.appearance` và validator vào PATCH hồ sơ sẵn có. Ngoài phạm vi: đổi API nghiệp vụ hoặc dữ liệu tệp. Rủi ro dữ liệu thấp: trường preference tùy chọn, không migration/xóa; quay lại code cũ vẫn giữ dữ liệu MongoDB/MinIO, chỉ bỏ qua trường mới.

## Theme cần hỗ trợ

### 1. Cyber Space Blue — mặc định
```txt
Primary: #00D9FF
Secondary: #6366F1
Background Dark: #070B14
Surface Dark: #101827
Accent: #22D3EE
```

Phong cách: Cloud Storage + Cyber, glow Cyan nhẹ.

### 2. Neon Storage
```txt
Primary: #00FFB2
Secondary: #00B8FF
Accent: #A855F7
Background: #050505
Surface: #101419
```

Phong cách: Neon RGB / Cyberpunk nhẹ.

### 3. Deep Cloud Purple
```txt
Primary: #8B5CF6
Secondary: #06B6D4
Accent: #EC4899
Background: #09090F
Surface: #151522
```

Phong cách: SaaS / Cloud hiện đại, tím nhẹ.

### 4. Space Terminal
```txt
Primary: #39FF88
Secondary: #00E5FF
Background: #020604
Surface: #09140E
```

Phong cách: Server / Terminal / Data Center.

### 5. Ice Data Center
```txt
Primary: #38BDF8
Secondary: #2DD4BF
Accent: #818CF8
Background: #071018
Surface: #10212D
```

Phong cách: Cloud / AI / Data Center chuyên nghiệp.

## UI Rules

- Có Theme Selector và Dark / Light Mode.
- Theme và mode phải lưu lại sau khi reload/login.
- Nếu user đã đăng nhập, ưu tiên lưu preference theo user.
- Dùng CSS variables hoặc Tailwind theme tokens, không hardcode màu lặp lại trong component.
- Toàn bộ UI phải đồng bộ màu giữa:
  - Dashboard
  - My Files
  - Shared
  - Recent
  - Favorites
  - Trash
  - Upload
  - Storage
  - Settings
  - User/Admin

## Style

- Dark mode là mặc định.
- Card có border mảnh, glass nhẹ.
- Hover:
  - `translateY(-1px ~ -2px)`
  - border sáng hơn
  - glow nhẹ theo màu Primary.
- Button, File Card, Sidebar, Upload Zone phải có:
  - hover
  - active
  - focus
  - disabled.
- LED / Pulse chỉ dùng cho trạng thái:
  - Uploading
  - Syncing
  - Online
  - Processing.
- Animation khoảng `150–250ms`.
- Không lạm dụng glow, gradient hoặc hiệu ứng nhấp nháy.
- Hỗ trợ `prefers-reduced-motion`.
- Đảm bảo contrast tốt ở cả Dark và Light mode.
- Responsive Desktop / Tablet / Mobile.

## Yêu cầu kỹ thuật

- Tách Theme config thành module riêng để dễ thêm theme mới.
- Không viết màu trực tiếp rải rác trong component.
- Không làm thay đổi API hoặc business logic hiện tại.
- Không làm mất dữ liệu hoặc preference hiện có.
- Kiểm tra build/lint/typecheck sau khi hoàn thành.

## Tiêu chí hoàn tất

- [x] Tên ứng dụng trong UI, HTML/PWA và email là `DND Drop Space` (code/build đã kiểm tra).
- [x] Có đúng 5 theme trên trong config.
- [x] Có Dark / Light Mode, mặc định Cyber Space Blue/dark.
- [x] Theme đổi CSS variables ngay, không reload (kiểm tra `test:themes`; thao tác UI browser còn chờ).
- [ ] Preference lưu và restore chính xác qua toàn bộ luồng login/browser (API user + local restore đã qua; UI chưa thử).
- [ ] UI đồng bộ, màu không xung đột khi xem thực tế (110 cặp contrast đạt; browser chưa thử).
- [ ] Hover / transition / LED effect hoạt động mượt trong browser (CSS đã có).
- [ ] Responsive Desktop / Tablet / Mobile trong browser (layout đã chỉnh).
- [x] Không phá logic nghiệp vụ hiện tại: smoke và auth suite đạt trên MongoDB 4.0.
- [ ] Build/lint/typecheck thành công: build và lint đạt; repo JavaScript chưa có typecheck riêng.
- [x] Cập nhật tiến độ prompt, README và tài liệu kiến trúc.
- [ ] Chuyển prompt sang `prompts/completed/` sau kiểm chứng còn thiếu.
- [x] Commit thay đổi đúng phạm vi.

## Kết quả

Theme system: năm palette dark/light ở module riêng; semantic CSS variables/Tailwind dùng chung. Guest lưu localStorage, user lưu `User.appearance` bằng PATCH hồ sơ hiện có; tài khoản cũ mặc định Cyber Space Blue/dark, không migration. PWA và email đã đổi tên. Prompt production cũ đổi ID từ `008` thành `009` để không trùng số.

Kiểm tra 2026-10-04: `npm run build --prefix frontend` đạt; `npm run lint --prefix frontend` đạt, còn một cảnh báo cũ ở `Groups.jsx`; `npm run test:themes --prefix frontend` đạt 110 cặp contrast, đổi token và local restore. `npm run lint --prefix backend` đạt. Compose local build/health đạt với `mongo:4.0`; `test:auth` đạt 53 request gồm lưu/đọc preference và từ chối enum sai, fixture đã dọn; `test:smoke` đạt. Typecheck riêng chưa cấu hình vì dự án dùng JavaScript. Browser không khả dụng trong phiên, chưa đánh giá trực quan hover/responsive hoặc kiểm tra thao tác lưu qua login. Không có deploy production.

Vướng mắc/bước tiếp theo: kiểm tra 5 theme × 2 mode trong browser ở kích thước mobile/tablet/desktop, đổi theme rồi reload/login; xem hover, focus, disabled và upload. Khi đạt mới chuyển `completed/`. Commit: xem `git log --all -- prompts/progress/008-themes-mode-feature.md`.

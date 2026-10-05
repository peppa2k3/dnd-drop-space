# 008-1 — Rebuild UI + Themes & Dark/Light Mode

## Mục tiêu

Refactor toàn bộ UI ứng dụng thành design system thống nhất cho **DND Drop Space** dựa trên mẫu.

Xây dựng:

- 5 color themes.
- Dark / Light Mode độc lập với theme.
- UI phong cách **Modern Cloud Storage + Cyber/Data Center**.
- Hover, glow, LED status, animation mượt.
- Theme thay đổi realtime, không reload.
- Giữ nguyên toàn bộ business logic hiện tại.

---

## Phạm vi

```text
/frontend
/backend chỉ khi cần lưu user UI preferences
```

Không thay đổi:

- API nghiệp vụ hiện tại.
- Auth/RBAC.
- upload/download/share/file logic.
- database schema nghiệp vụ.
- dữ liệu user/file hiện có.

Rủi ro dữ liệu / cách quay lại: chỉ thêm giá trị hợp lệ cho `User.appearance`; không di chuyển hay xóa dữ liệu. Backend vẫn chấp nhận ID `ice-data` cũ. Có thể quay lại commit trước về UI; tài khoản đã lưu `system` hoặc `ice-datacenter` cần chuyển preference về `dark/light` và `ice-data` trước khi chạy backend phiên bản cũ.

---

# 1. Typography

Sử dụng:

```text
UI Font:
Plus Jakarta Sans
weights: 300 400 500 600 700 800

Mono Font:
JetBrains Mono
weights: 400 500
```

`Plus Jakarta Sans` dùng cho toàn bộ UI.

`JetBrains Mono` chỉ dùng cho:

- file size
- storage usage
- hash
- ID
- path
- technical metadata
- logs/status kỹ thuật

Không dùng mono cho toàn bộ giao diện.

---

# 2. Theme Architecture

Theme và Mode phải độc lập:

```ts
theme:
cyber-blue
neon-storage
deep-purple
space-terminal
ice-datacenter

mode:
light
dark
```

Ví dụ:

```text
cyber-blue + dark
cyber-blue + light

deep-purple + dark
deep-purple + light
```

Dùng:

```text
CSS Variables / Tailwind semantic tokens
```

Không hardcode màu trực tiếp rải rác trong component.

Component chỉ được sử dụng semantic tokens:

```text
background
background-secondary
surface
surface-hover

primary
primary-hover
secondary
accent

text-primary
text-secondary
text-muted

border
border-hover

success
warning
danger

glow
```

---

# 3. Theme Palettes

## Theme 01 — Cyber Space Blue

Theme mặc định.

```text
background-dark:   #070814
surface-dark:      #101827

primary:           #00D9FF
secondary:         #6366F1
accent:            #22D3EE

success:           #22C55E
warning:           #F59E0B
danger:            #EF4444
```

Style:

```text
Cloud Storage
Cyber Blue
Cyan LED
Blue → Cyan → Indigo gradient
```

---

## Theme 02 — Neon Storage

```text
background-dark:   #050505
surface-dark:      #101419

primary:           #00FFB2
secondary:         #00B8FF
accent:            #A855F7

success:           #00E676
warning:           #FFD600
danger:            #FF3D71
```

Style:

```text
Neon
Cyberpunk nhẹ
Emerald LED
RGB accent
```

Không biến UI thành gaming/RGB quá mức.

---

## Theme 03 — Deep Cloud Purple

Sử dụng đúng palette reference:

```text
background-dark:   #09090F
surface-dark:      #151522

primary:           #885CF6
secondary:         #06B6D4
accent:            #EC4899

success:           #10B981
warning:           #F59E0B
danger:            #F43F5E
```

Style:

```text
Modern SaaS
Cloud
Purple / Indigo
Soft glow
```

---

## Theme 04 — Space Terminal

```text
background-dark:   #020604
surface-dark:      #09140E

primary:           #39FF88
secondary:         #00E5FF

text-secondary:    #83A58F

warning:           #FFD166
danger:            #FF4D6D
```

Style:

```text
Server
Terminal
Infrastructure
Green LED
```

Có thể dùng `JetBrains Mono` nhiều hơn ở:

```text
server status
storage metadata
technical information
logs
```

Nhưng UI chính vẫn dùng Plus Jakarta Sans.

---

## Theme 05 — Ice Data Center

```text
background-dark:   #071018
surface-dark:      #10212D

primary:           #38BDF8
secondary:         #2DD4BF
accent:            #818CF8

success:           #2DD4BF
warning:           #FBBF24
danger:            #FB7185
```

Style:

```text
Data Center
Cloud
AI
Enterprise
Clean Technology
```

---

# 4. Light Mode

Không tạo 5 giao diện sáng hoàn toàn khác nhau.

Dùng chung neutral Light Mode:

```text
background:        #F8FAFC
background-2:      #F1F5F9
surface:           #FFFFFF
surface-hover:     #F8FAFC

text-primary:      #0F172A
text-secondary:    #475569
text-muted:        #64748B

border:            #E2E8F0
border-strong:     #CBD5E1
```

Sau đó lấy:

```text
primary
secondary
accent
success
warning
danger
```

từ theme đang chọn.

Light Mode phải sạch, sáng, không neon quá mạnh.

Glow trong Light Mode giảm khoảng:

```text
40–60%
```

so với Dark Mode.

---

# 5. Dark Mode

Dark Mode là mặc định.

Không dùng một màu đen duy nhất.

Hierarchy:

```text
App Background
↓
Sidebar / Header
↓
Main Surface
↓
Card
↓
Hover / Selected Surface
```

Phải nhìn rõ depth giữa các lớp.

---

# 6. Glow System

Dựa theo reference HTML:

```text
Cyber Blue:
rgba(0,217,255)

Neon:
rgba(0,255,178)

Purple:
rgba(136,92,246)

Terminal:
rgba(57,255,136)

Ice:
rgba(56,189,248)
```

Glow card dạng:

```css
border: 1px solid rgb(var(--primary) / 0.3);

box-shadow:
  0 0 15px -3px rgb(var(--primary) / 0.25);
```

Hover có thể tăng glow nhẹ.

Không glow liên tục toàn bộ màn hình.

Chỉ ưu tiên:

```text
active navigation
selected file
upload dropzone
primary CTA
focus
active status
processing status
```

---

# 7. UI Style

Thiết kế lại UI theo hướng:

```text
Modern
Minimal
Cloud Storage
Cyber Technology
Glass nhẹ
Thin borders
Soft shadows
Subtle gradients
LED indicators
Smooth micro-interactions
```

Không thiết kế theo:

```text
Gaming UI
Crypto UI
RGB overload
Hacker movie UI
Gradient everywhere
```

---

# 8. Component States

Mọi component tương tác phải có:

```text
default
hover
focus
active
selected
disabled
loading
```

Áp dụng cho:

```text
Button
Input
Search
Sidebar item
File Card
Folder Card
Dropdown
Context Menu
Upload Zone
Modal
Tabs
Pagination
Table Row
Storage Card
```

---

# 9. Hover

Standard transition:

```text
150–250ms
ease / ease-out
```

File/Card hover:

```text
translateY(-1px ~ -2px)
surface sáng hơn nhẹ
border chuyển primary
primary glow nhẹ
```

Không scale component quá lớn.

Sidebar active:

```text
primary/10 background
primary text
2px primary left indicator
subtle glow
```

---

# 10. Cyber LED

LED chỉ dùng cho trạng thái thực:

```text
Online
Connected
Uploading
Syncing
Processing
Success
Error
```

Có thể dùng pulse nhẹ:

```text
1.8–2.5s
```

Không blink nhanh.

Static content không được nhấp nháy.

Hỗ trợ:

```css
prefers-reduced-motion
```

---

# 11. App Branding

Tên chính thức:

```text
DND Drop Space
```

Brand có thể dùng:

```text
Cloud/Upload icon
Primary gradient
Small online LED
```

Gradient branding theo theme hiện tại.

Không hardcode Cyan cho logo khi user đổi theme.

---

# 12. UI cần refactor

Áp dụng design system nhất quán cho toàn bộ:

```text
Dashboard
My Files
Folders
Shared
Recent
Favorites
Trash
Search
Upload
Storage
File Preview
Profile
Settings
Theme Settings
User Management
Admin
Modal
Dropdown
Toast
Loading
Empty State
Error State
```

Không chỉ đổi màu Settings hoặc Dashboard.

---

# 13. Theme Selector

Trong Settings/UI Preferences tạo:

```text
Appearance

Theme
[ Cyber Blue ]
[ Neon Storage ]
[ Deep Purple ]
[ Space Terminal ]
[ Ice Data Center ]

Mode
[ Light ] [ Dark ] [ System ]
```

Theme card phải preview trực quan:

```text
background
primary
secondary
accent
```

Theme thay đổi realtime khi click.

Không reload page.

---

# 14. Persistence

Ưu tiên:

```text
Authenticated user
→ lưu preference server/database nếu architecture hiện tại phù hợp

Fallback
→ localStorage
```

Ví dụ:

```json
{
  "theme": "cyber-blue",
  "mode": "dark"
}
```

Nếu chọn:

```text
mode = system
```

thì theo:

```text
prefers-color-scheme
```

Không tạo breaking database migration nếu không cần thiết.

---

# 15. Technical Architecture

Tách riêng:

```text
theme config
theme tokens
ThemeProvider
useTheme
ThemeSelector
ModeSelector
```

Ví dụ cấu trúc:

```text
frontend/
  src/
    theme/
      themes.ts
      tokens.ts
      types.ts

    providers/
      ThemeProvider.tsx

    hooks/
      useTheme.ts

    components/
      theme/
        ThemeSelector.tsx
        ModeSelector.tsx
```

Điều chỉnh theo cấu trúc project hiện tại, không ép đổi architecture nếu không cần.

---

# 16. Responsive

UI phải chuẩn:

```text
Desktop
Laptop
Tablet
Mobile
```

Sidebar:

```text
Desktop → full sidebar
Tablet → compact
Mobile → drawer
```

File Grid/List không overflow.

---

# 17. Accessibility

Đảm bảo:

```text
contrast tốt
focus-visible rõ
keyboard navigation
aria-label phù hợp
prefers-reduced-motion
```

Không dùng màu là dấu hiệu duy nhất của trạng thái.

---

# 18. Quy tắc quan trọng

Trước khi code:

1. Audit UI/components hiện tại.
2. Xác định component dùng chung.
3. Tạo theme tokens trước.
4. Tạo ThemeProvider.
5. Sau đó refactor component.
6. Không rewrite business logic chỉ để đổi UI.
7. Không duplicate component chỉ vì theme khác nhau.
8. Một component phải hoạt động được với toàn bộ theme/mode.
9. Không thêm dependency lớn nếu CSS/Tailwind hiện tại xử lý được.
10. Không hardcode palette mới ngoài design system.

---

## Tiêu chí hoàn tất

-  Branding hiển thị đúng `DND Drop Space`.
-  Plus Jakarta Sans + JetBrains Mono hoạt động đúng.
-  Có đủ 5 themes.
-  Có Light / Dark / System Mode.
-  Cyber Space Blue + Dark là mặc định.
-  Theme và Mode hoạt động độc lập.
-  Chuyển theme realtime, không reload.
-  Preference được restore sau reload/login.
-  UI toàn hệ thống dùng semantic theme tokens.
-  Không còn hardcode màu trùng lặp đáng kể trong component.
-  Hover/focus/active/disabled/loading đầy đủ.
-  Glow/LED/animation mượt, không lạm dụng.
-  Responsive.
-  Accessibility cơ bản đạt.
-  Không phá API/business logic/data hiện có.
-  Build pass.
-  Lint pass.
-  Typecheck pass.
-  Kiểm tra các màn hình chính sau refactor.
-  Cập nhật tiến độ prompt.
-  Chuyển prompt sang `completed/`.
-  Commit code.

## Kết quả

- Theme architecture: `frontend/src/config/themes.js` sinh semantic CSS variables; `tailwind.config.js` ánh xạ token. Toàn bộ JSX dùng token thay cho tên màu cũ.
- Themes implemented: Cyber Space Blue, Neon Storage, Deep Cloud Purple, Space Terminal, Ice Data Center theo palette trong prompt. `ice-data` cũ được chuẩn hóa ở frontend, backend vẫn chấp nhận.
- Light/Dark/System: theme và mode độc lập; System theo `prefers-color-scheme` và lắng nghe thay đổi của OS.
- Theme persistence: guest dùng localStorage; user dùng `User.appearance` qua PATCH hồ sơ hiện có. Validator/schema chấp nhận `system` và ID mới.
- Components refactored: font, branding, layout, điều hướng, danh sách/card tệp, form, modal, toast, trạng thái rỗng, upload và các trang nghiệp vụ cùng dùng token; không đổi API nghiệp vụ.
- Responsive: sidebar đầy đủ ở desktop, thu gọn ở tablet, drawer ở mobile; grid tệp một cột trên màn hình rất hẹp.
- Build: `cd frontend && npm run build` đạt.
- Lint: `cd frontend && npm run lint` đạt (0 lỗi, 1 cảnh báo hook cũ ở `Groups.jsx:32`).
- Typecheck: dự án là JavaScript/JSX, chưa có `typecheck` script hoặc cấu hình TypeScript; build đã biên dịch toàn bộ JSX, backend `node --check` đạt.
- Regression check: `npm run test:themes` đạt 90 cặp tương phản và kiểm tra System/restore; backend validator chấp nhận `ice-data` và `ice-datacenter` với mode `system`; `git diff --check` đạt.
- Commit: xem `git log --all -- prompts/progress/008-1-rebuild-UI-themes-dark-light-mode.md`.

## Tiến độ kiểm chứng

- [x] Code năm theme, Light/Dark/System, font, semantic tokens, persistence và responsive theo prompt.
- [x] Build, lint, theme/contrast checks và backend syntax/validator đạt.
- [ ] Kiểm tra trực quan dashboard, library/grid/list, chia sẻ, nhóm, trash, admin, settings, modal/toast ở desktop/tablet/mobile và chuyển theme trực tiếp. Browser không khả dụng trong lượt này.
- [ ] Chuyển prompt sang `completed/` sau khi xác nhận UI thực tế.

# 010 — Multi-Language / i18n System

## Mục tiêu

Xây dựng tính năng **đa ngôn ngữ (i18n)** cho toàn bộ UI của **DND Drop Space**.

Ngôn ngữ mặc định:

```text
Tiếng Việt — vi
```

Hỗ trợ:

```text
vi     Tiếng Việt
en     English
zh-CN  简体中文
ja     日本語
ko     한국어
fr     Français
de     Deutsch
it     Italiano
es     Español
```

Yêu cầu kiến trúc thông minh, dễ maintain và có thể thêm ngôn ngữ mới mà **không phải sửa logic component**.

---

## Phạm vi

```text
/frontend
/backend chỉ khi cần lưu language preference của user
```

Không thay đổi:

- business logic
- Auth/RBAC
- upload/download/share
- file/folder logic
- API hiện tại nếu không cần thiết
- dữ liệu user/file

Chỉ phát triển:

```text
i18n architecture
translation resources
Language Selector
language persistence
format locale
UI translation
```

---

# 1. i18n Architecture

Không hardcode text trực tiếp trong component:

```tsx
❌ <Button>Tải lên tệp</Button>
```

Phải sử dụng translation key:

```tsx
✅ t("files.upload")
```

Tách hệ thống:

```text
i18n/
  config
  locales
  namespaces
  types
  helpers
```

Ví dụ:

```text
frontend/src/i18n/

  config.ts
  languages.ts
  types.ts

  locales/
    vi/
    en/
    zh-CN/
    ja/
    ko/
    fr/
    de/
    it/
    es/
```

---

# 2. Translation Namespace

Không gom toàn bộ translation vào một file lớn.

Tách theo module:

```text
common
navigation
auth
dashboard
files
folders
shared
search
upload
storage
profile
settings
admin
errors
notifications
```

Ví dụ:

```text
locales/vi/
  common.json
  navigation.json
  files.json
  settings.json
  errors.json
```

Các ngôn ngữ khác phải giữ cùng cấu trúc key.

---

# 3. Translation Key Rules

Sử dụng semantic key:

```text
common.save
common.cancel
common.confirm

navigation.dashboard
navigation.files
navigation.shared
navigation.trash

files.upload
files.download
files.rename
files.delete
files.move
files.empty

storage.used
storage.available

settings.language
settings.theme
settings.account
```

Không dùng:

```text
❌ button1
❌ label2
❌ text_upload_abc
❌ Tải_lên_tệp
```

Không duplicate key cho cùng một ý nghĩa.

---

# 4. Language Configuration

Tất cả language metadata phải nằm trong một config trung tâm.

Ví dụ:

```ts
export const languages = [
  {
    code: "vi",
    name: "Tiếng Việt",
    shortName: "VI"
  },
  {
    code: "en",
    name: "English",
    shortName: "EN"
  },
  {
    code: "zh-CN",
    name: "简体中文",
    shortName: "中文"
  },
  {
    code: "ja",
    name: "日本語",
    shortName: "日本"
  },
  {
    code: "ko",
    name: "한국어",
    shortName: "한국"
  },
  {
    code: "fr",
    name: "Français",
    shortName: "FR"
  },
  {
    code: "de",
    name: "Deutsch",
    shortName: "DE"
  },
  {
    code: "it",
    name: "Italiano",
    shortName: "IT"
  },
  {
    code: "es",
    name: "Español",
    shortName: "ES"
  }
]
```

Khi thêm ngôn ngữ mới chỉ cần:

```text
1. thêm language config
2. thêm locale resources
```

Không phải sửa từng component.

---

# 5. Default & Fallback

Default:

```text
vi
```

Fallback:

```text
vi
```

Nếu:

```text
translation key thiếu
locale lỗi
language không tồn tại
```

→ fallback về `vi`.

Không hiển thị raw translation key cho user trong production nếu có thể fallback.

---

# 6. Language Selector

Tạo Language Selector trong:

```text
Settings
→ Appearance / Language
```

Có thể thêm quick selector ở user menu.

UI:

```text
Language

● Tiếng Việt
○ English
○ 简体中文
○ 日本語
○ 한국어
○ Français
○ Deutsch
○ Italiano
○ Español
```

Có:

```text
Search language
Current language indicator
Selected state
Hover
Keyboard navigation
```

Thay đổi ngôn ngữ realtime.

Không reload toàn bộ ứng dụng nếu framework/library hiện tại hỗ trợ.

---

# 7. Persistence

Ưu tiên:

```text
Authenticated user
→ lưu language preference theo user
```

Ví dụ:

```json
{
  "language": "vi"
}
```

Fallback:

```text
localStorage / cookie
```

Thứ tự resolve:

```text
1. User preference
2. Local stored preference
3. Browser language nếu được hỗ trợ
4. Vietnamese (vi)
```

Nếu browser là language chưa hỗ trợ:

```text
→ vi
```

---

# 8. Locale Formatting

Không chỉ dịch text.

Phải xử lý đúng locale cho:

```text
date
time
number
file size
percentage
relative time
```

Ưu tiên native:

```ts
Intl.DateTimeFormat
Intl.NumberFormat
Intl.RelativeTimeFormat
```

Ví dụ cùng một ngày có thể hiển thị theo locale:

```text
vi:
05/10/2026

en:
10/05/2026

de:
05.10.2026
```

Không tự hardcode format ngày tháng.

---

# 9. Plural & Dynamic Text

Phải hỗ trợ pluralization.

Ví dụ:

```text
1 file
10 files

1 tệp
10 tệp
```

Không nối string thủ công kiểu:

```ts
count + " files"
```

Dynamic text phải dùng interpolation:

```text
files.selected
files.uploadProgress
storage.used
```

Ví dụ:

```text
{{count}} tệp đã được chọn
Đã sử dụng {{used}} / {{total}}
```

---

# 10. Nội dung KHÔNG dịch

Không tự dịch dữ liệu do user tạo:

```text
file name
folder name
username
email
description của user
tag do user tạo
metadata gốc
```

Ví dụ:

```text
BaoCao2026.pdf
```

phải giữ nguyên ở mọi language.

Chỉ dịch **UI/system text**.

---

# 11. Error & Notification

Toàn bộ system message phải hỗ trợ i18n:

```text
success
warning
error
toast
validation
confirm dialog
empty state
loading
```

Ví dụ:

```text
errors.network
errors.permissionDenied
errors.fileNotFound

notifications.uploadSuccess
notifications.deleteSuccess
```

Không hardcode error message trong UI.

Nếu backend trả error:

```json
{
  "code": "FILE_NOT_FOUND"
}
```

frontend map:

```text
FILE_NOT_FOUND
→ errors.fileNotFound
```

Ưu tiên error code thay vì phụ thuộc trực tiếp message tiếng Việt từ backend.

Không phá API hiện có chỉ để đạt yêu cầu này.

---

# 12. Component Integration

Refactor toàn bộ UI có text:

```text
Header
Sidebar
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
Language Settings
Admin
User Management
Modal
Dropdown
Context Menu
Toast
Pagination
Loading
Empty State
Error State
Confirmation Dialog
```

Không chỉ dịch Settings hoặc Navigation.

---

# 13. Theme Compatibility

Language system phải hoạt động độc lập với:

```text
Theme
Dark / Light / System
```

Architecture:

```text
UI Preferences

├── Theme
├── Mode
└── Language
```

Ví dụ preference:

```json
{
  "theme": "cyber-blue",
  "mode": "dark",
  "language": "vi"
}
```

Không gắn language logic vào ThemeProvider nếu không cần thiết.

Có thể dùng provider riêng:

```text
ThemeProvider
I18nProvider
AuthProvider
```

---

# 14. Performance

Không load toàn bộ translations không cần thiết nếu làm tăng bundle lớn.

Ưu tiên:

```text
namespace
lazy loading nếu phù hợp architecture
cache translation resources
```

Không gọi backend mỗi lần render để lấy translation.

Translation resources nên nằm frontend/static bundle trừ khi project hiện tại có lý do rõ ràng để quản lý từ server.

---

# 15. Maintainability

Tạo một source config chung để khai báo language.

Không viết:

```text
language list
```

lặp lại ở nhiều component.

Phải dễ thêm language thứ 10 bằng quy trình:

```text
1. thêm language vào languages.ts
2. tạo locales/{locale}/
3. thêm translation resources
4. validation
```

Không cần chỉnh:

```text
Dashboard
Sidebar
FileCard
Settings
...
```

---

# 16. Translation Validation

Tạo cơ chế kiểm tra development/build để phát hiện:

```text
missing key
duplicate key
locale thiếu namespace
locale thiếu translation so với vi
```

Lấy:

```text
vi
```

làm canonical/source locale.

Các locale khác phải có cấu trúc key tương ứng.

Có thể fallback khi runtime nhưng build/dev phải cảnh báo missing translations.

---

# 17. Accessibility

Language Selector phải hỗ trợ:

```text
keyboard
focus-visible
aria-label
screen reader
```

Cập nhật đúng:

```html
<html lang="vi">
```

theo language hiện tại:

```text
vi
en
zh-CN
ja
ko
fr
de
it
es
```

---

# 18. Quy tắc quan trọng

Trước khi code:

1. Audit toàn bộ hardcoded UI text hiện tại.
2. Chọn/thích nghi i18n library phù hợp stack hiện tại.
3. Không thêm library lớn nếu project đã có giải pháp i18n.
4. Xây dựng config + namespace trước.
5. Lấy `vi` làm source locale.
6. Sau đó refactor component dùng translation keys.
7. Không duplicate component theo từng language.
8. Không dùng conditional kiểu `language === "vi"` rải rác.
9. Không hardcode language list ở nhiều nơi.
10. Không dịch dữ liệu do user tạo.
11. Không thay đổi business logic ngoài phần cần thiết.
12. Đảm bảo không xảy ra hydration mismatch nếu frontend dùng SSR/Next.js.

---

## Tiêu chí hoàn tất

- Default language là Tiếng Việt.
- Hỗ trợ `vi`, `en`, `zh-CN`, `ja`, `ko`, `fr`, `de`, `it`, `es`.
- Có Language Selector.
- Chuyển language realtime.
- Preference được restore sau reload/login.
- Có fallback về `vi`.
- Translation được chia namespace rõ ràng.
- Không còn hardcoded UI text đáng kể.
- Date/time/number/relative time theo locale.
- Dynamic text/plural hoạt động đúng.
- System errors/toast/validation hỗ trợ i18n.
- Không dịch file/folder/user content.
- `<html lang>` cập nhật chính xác.
- Có cơ chế phát hiện missing translation.
- Có thể thêm language mới mà không sửa component.
- Tương thích 5 themes + Light/Dark/System.
- Responsive không lỗi do text dài hơn.
- Không phá business logic/API/data hiện tại.
- Build pass.
- Lint pass.
- Typecheck pass.
- Kiểm tra các màn hình chính với ít nhất `vi/en/zh-CN`.
- Cập nhật tiến độ prompt.
- Chuyển prompt vào `completed/`.
- Commit code.

## Kết quả

```text
i18n architecture: i18next + react-i18next, JSON tải theo locale/namespace, LanguageProvider riêng ThemeProvider.
Default locale: vi; fallback vi.
Locales implemented: vi, en, zh-CN, ja, ko, fr, de, it, es.
Namespaces: 15; vi là nguồn chuẩn.
Language selector: Settings, tìm theo tên/mã, radio hỗ trợ bàn phím và screen reader; html lang đổi theo lựa chọn.
Preference persistence: User.language tùy chọn qua PATCH /users/me; nếu chưa có thì localStorage → browser → vi.
Locale formatting: Intl cho số, dung lượng, ngày giờ, thời gian tương đối; count/plural/interpolation cho text động.
Missing-key validation: npm run test:i18n; kiểm tra namespace, key trùng/thiếu, placeholder, key tham chiếu, plural và thứ tự preference; chạy trước dev/build.
Components migrated: auth, dashboard, navigation, library, notes, upload, folder, search, trash, shared, groups, friends, profile, theme, admin, modal/toast.
Responsive check: Chưa xác nhận trực quan; browser của môi trường này không khả dụng.
Build: npm run build đạt.
Lint: npm run lint đạt (1 cảnh báo useEffect cũ ở Groups.jsx).
Typecheck: Không áp dụng; frontend là JavaScript, không có lệnh typecheck/tsconfig.
Regression check: npm run test:themes đạt; backend syntax và profile language validator/toSafeJSON đạt. Chưa chạy backend tích hợp MongoDB vì không đổi nghiệp vụ.
Commit: feat(i18n): add nine-language website support.
```

### Việc còn cần xác nhận

- [x] Code, build, lint, kiểm tra resource/plural/preference và theme.
- [ ] Xem trực quan các màn hình chính ở `vi`, `en`, `zh-CN` (desktop/mobile), đổi ngôn ngữ và xác nhận layout với 5 theme, Light/Dark/System. Môi trường browser hiện không có phiên khả dụng.
- [ ] Sau khi xác nhận UI, chuyển file này sang `prompts/completed/` và cập nhật bảng tiến độ.

Không thay đổi hay xóa dữ liệu cũ: `User.language` không bắt buộc; MongoDB 4.0 và volume giữ nguyên. Nếu cần quay lại, bỏ code i18n/UI và trường tùy chọn khỏi schema; dữ liệu ngôn ngữ đã lưu không ảnh hưởng truy vấn hiện có.

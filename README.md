# Personal Knowledge Hub

Kho lưu trữ và quản lý dữ liệu cá nhân tập trung — ghi chú, liên kết, ảnh, video và mọi loại tệp tin, ở một nơi duy nhất, truy cập từ mọi thiết bị.

Ứng dụng full-stack gồm 3 phần:

- **`backend/`** — REST API bằng Node.js/Express + MongoDB (metadata) + MinIO (lưu trữ tệp nhị phân, tương thích S3).
- **`frontend/`** — Ứng dụng React (Vite) — Progressive Web App, cài đặt được trên điện thoại/máy tính.
- **`nginx/`** — Build ra bản tĩnh của frontend và làm reverse proxy `/api` sang backend, phục vụ mọi thứ trên một cổng duy nhất.

---

## 1. Chạy nhanh bằng Docker Compose (khuyến nghị)

Yêu cầu: đã cài **Docker** và **Docker Compose**.

```bash
# 1. Tạo file cấu hình môi trường cho backend từ file mẫu
cp backend/.env.example backend/.env

# 2. (Quan trọng) Mở backend/.env và đổi các giá trị bí mật, ít nhất là:
#    JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, MINIO_SECRET_KEY

# 3. Khởi động toàn bộ hệ thống
docker compose up --build
```

Sau khi các container khởi động xong:

| Thành phần | Địa chỉ |
|---|---|
| Ứng dụng web (frontend + API qua reverse proxy) | http://localhost:8080 |
| MinIO Console (xem trực tiếp các tệp đã lưu) | http://localhost:9001 |
| MongoDB | `mongodb://localhost:27017` (nếu cần kết nối trực tiếp bằng Compass) |

Mở `http://localhost:8080`, bấm **Tạo tài khoản mới** để đăng ký, sau đó đăng nhập và bắt đầu sử dụng.

Dữ liệu (MongoDB + MinIO) được lưu ở Docker volumes (`mongo-data`, `minio-data`) nên sẽ không mất khi bạn tắt/bật lại container. Để dừng: `docker compose down` (thêm `-v` nếu muốn xóa luôn dữ liệu).

---

## 2. Chạy thủ công (không dùng Docker) — dành cho phát triển

### Yêu cầu
- Node.js ≥ 18
- MongoDB đang chạy (local hoặc Atlas)
- MinIO đang chạy (hoặc bất kỳ dịch vụ tương thích S3 nào)

### Backend

```bash
cd backend
cp .env.example .env   # rồi chỉnh MONGO_URI / MINIO_* cho khớp môi trường của bạn
npm install
npm run dev             # chạy bằng nodemon, mặc định cổng 5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev              # Vite dev server, mặc định cổng 5173, tự động proxy /api -> :5000
```

Mở `http://localhost:5173`.

---

## 3. Kiến trúc & quyết định kỹ thuật

### Mô hình dữ liệu hợp nhất (`Item`)
Ghi chú, liên kết (URL) và mọi loại tệp (ảnh, video, PDF, Word, Excel, file nén, khác...) đều được lưu trong **một collection `Item` duy nhất**, dùng chung các trường: `title`, `description`, `folder`, `tags`, `favorite`, `isTrashed`, `createdAt/updatedAt`. Nhờ vậy, tính năng duyệt theo thư mục, gắn thẻ, tìm kiếm toàn cục, yêu thích và thùng rác chỉ cần **một bộ API** áp dụng cho mọi loại dữ liệu, thay vì lặp lại logic cho từng loại.

### Lưu trữ tệp nhị phân tách biệt khỏi metadata
- **MongoDB**: lưu metadata (tiêu đề, mô tả, thẻ, thư mục, đường dẫn tới tệp trong MinIO...).
- **MinIO**: lưu nội dung tệp thật sự (ảnh, video, tài liệu...), tương thích API của Amazon S3 — nếu cần mở rộng lên cloud thật, chỉ cần đổi endpoint sang S3/R2/... mà không phải sửa code.

### Xác thực: Access Token (JWT, 15 phút, lưu trong bộ nhớ React) + Refresh Token (httpOnly cookie, 7 ngày, xoay vòng mỗi lần dùng)
Access token **không** lưu ở `localStorage` để giảm rủi ro nếu có lỗ hổng XSS; nó chỉ tồn tại trong bộ nhớ của ứng dụng React và được cấp lại ngầm (silent refresh) mỗi khi tải lại trang, thông qua cookie httpOnly mà JavaScript không thể đọc được.

Một ngoại lệ có chủ đích: các endpoint media (`/thumbnail`, `/stream`, `/download`) cũng chấp nhận access token qua query param (`?token=...`), vì thẻ `<img>`/`<video>`/`<a>` của trình duyệt không thể gửi kèm header `Authorization`. Đây là đánh đổi hợp lý ở quy mô cá nhân; nếu triển khai ở quy mô lớn hơn, bước nâng cấp tự nhiên là chuyển sang presigned URL có thời hạn của MinIO/S3.

### Danh mục tệp (`fileMeta.category`)
Một tệp tải lên được phân loại tự động theo mime-type/đuôi file thành: `image`, `video`, `pdf`, `word`, `excel`, `archive`, `other`. Trang **Ảnh** và **Video** là các bộ lọc nhanh vào cùng một kho `type: 'file'`; trang **Tệp tin** hiển thị toàn bộ tệp không phân biệt loại (giống Google Drive).

### Sinh thumbnail
- **Ảnh**: dùng `sharp` để tạo bản thu nhỏ WebP ngay khi tải lên.
- **Video**: dùng `fluent-ffmpeg` (kèm binary `ffmpeg` tĩnh qua `@ffmpeg-installer/ffmpeg`, không cần cài ffmpeg hệ thống) để chụp 1 khung hình làm ảnh đại diện + đọc thời lượng video.

Việc này chạy đồng bộ ngay trong request tải lên (không dùng hàng đợi Redis/BullMQ) — hợp lý ở quy mô cá nhân với vài tệp mỗi lần tải; nếu cần xử lý hàng loạt tệp lớn, đây là điểm tự nhiên để tách thành worker riêng dùng hàng đợi.

### Xem trước liên kết (URL bookmark) kiểu Pocket
Khi lưu một URL, backend dùng `open-graph-scraper` để lấy tiêu đề, mô tả, favicon và ảnh đại diện (Open Graph), sau đó **tải và lưu lại ảnh đại diện vào MinIO** (thay vì chỉ giữ link ảnh gốc) để bookmark vẫn hiển thị đúng ngay cả khi trang gốc thay đổi hoặc biến mất. Nếu không tải được ảnh (trang chặn bot, ảnh quá lớn...), hệ thống rơi về dùng thẳng link ảnh gốc.

### Streaming video có hỗ trợ HTTP Range
Endpoint `/api/items/:id/stream` đọc header `Range` của trình duyệt và trả về đúng đoạn byte cần thiết từ MinIO (`getPartialObject`), giúp thẻ `<video>` tua (seek) mượt mà thay vì phải tải toàn bộ file trước khi phát.

### Thùng rác (Trash)
Xóa một mục sẽ chuyển vào Thùng rác (`isTrashed: true`) chứ không xóa ngay. Một cron job chạy mỗi ngày (dùng `node-cron`, không cần Redis) sẽ tự động xóa vĩnh viễn các mục đã nằm trong Thùng rác quá `TRASH_AUTO_PURGE_DAYS` (mặc định 30 ngày). Xóa một thư mục sẽ chuyển toàn bộ dữ liệu bên trong (và các thư mục con) vào Thùng rác, không xóa dữ liệu ngay lập tức.

### Tìm kiếm toàn cục
`/api/search?q=...` tìm theo tiêu đề, mô tả, nội dung ghi chú, tên tệp, URL, **tên thẻ** và **tên thư mục** cùng lúc (dùng MongoDB aggregation + `$lookup` + regex không phân biệt hoa/thường). Regex được chọn thay vì `$text` index để hỗ trợ khớp một phần (partial match) — phù hợp hơn với thói quen tìm kiếm ở quy mô dữ liệu cá nhân.

### Thiết kế giao diện
Giao diện lấy cảm hứng từ **"thẻ mục lục thư viện"** (library card catalog): mỗi mục dữ liệu là một "thẻ" với nhãn góc theo loại (Ghi chú/Ảnh/Video/Liên kết/Tệp), viền mảnh, điểm nhấn màu vàng đồng (gold) cho mục yêu thích. Font `Fraunces` (serif) cho tiêu đề, `Inter` cho giao diện, `IBM Plex Mono` cho metadata/timestamp — tạo cảm giác như một "kho lưu trữ cá nhân" thay vì một SaaS chung chung.

---

## 4. Tính năng đã triển khai

- **Xác thực**: đăng ký, đăng nhập, đăng xuất, refresh token tự động, mật khẩu băm bằng bcrypt.
- **Ghi chú**: soạn thảo Markdown với thanh công cụ (đậm/nghiêng/tiêu đề/danh sách/checklist/code/link/chèn ảnh-tệp), xem trước trực tiếp, tự động lưu (autosave).
- **Liên kết (URL)**: lưu link kèm xem trước tự động (tiêu đề, mô tả, ảnh đại diện, favicon) giống Pocket/Instapaper.
- **Tệp tin**: tải lên nhiều tệp cùng lúc (kéo-thả, dán từ clipboard, hoặc chọn), thanh tiến trình từng tệp, xem trước ảnh/video/PDF ngay trong ứng dụng, tải xuống.
- **Thư mục**: tạo/đổi tên/xóa, lồng nhau nhiều cấp, cây thư mục ở thanh bên.
- **Thẻ (Tags)**: gắn nhiều thẻ cho mọi loại dữ liệu, lọc theo thẻ.
- **Yêu thích**: đánh dấu/bỏ đánh dấu nhanh từ thẻ dữ liệu.
- **Tìm kiếm toàn cục**: theo tiêu đề, thẻ, thư mục, nội dung ghi chú, tên tệp.
- **Thùng rác**: khôi phục hoặc xóa vĩnh viễn, tự động dọn sau 30 ngày, nút "dọn sạch" thủ công.
- **Bảng điều khiển**: thống kê số lượng theo loại, dung lượng đã dùng, hoạt động gần đây.
- **Chế độ xem**: Lưới (Grid) và Danh sách (List), sắp xếp theo ngày tạo/cập nhật/tên/dung lượng.
- **Responsive & PWA**: bố cục thích ứng điện thoại/máy tính bảng/máy tính, có thể "Cài đặt vào màn hình chính" nhờ Web App Manifest + Service Worker.

## 5. Những điều chưa/ có thể cải thiện thêm

- Chưa có xử lý hàng loạt (bulk actions) chọn nhiều mục cùng lúc để di chuyển/xóa.
- Chưa có chia sẻ dữ liệu giữa nhiều người dùng (mỗi tài khoản hoàn toàn độc lập, đúng như yêu cầu "cá nhân").
- Rate-limit và cấu hình CORS hiện ở mức hợp lý cho một ứng dụng cá nhân/nhóm nhỏ; triển khai quy mô lớn nên xem lại các giới hạn này.
- Thumbnail cho các định dạng Office (Word/Excel) chưa được render nội dung — chỉ hiển thị icon loại tệp.

---

## 6. Tổng quan API

Toàn bộ endpoint (trừ `/auth/register`, `/auth/login`, `/auth/refresh`) yêu cầu header `Authorization: Bearer <accessToken>`.

| Method | Endpoint | Chức năng |
|---|---|---|
| POST | `/api/auth/register` | Đăng ký |
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/refresh` | Làm mới access token (dùng cookie) |
| POST | `/api/auth/logout` | Đăng xuất |
| GET | `/api/auth/me` | Thông tin tài khoản hiện tại |
| GET | `/api/items` | Danh sách dữ liệu (lọc/sắp xếp/phân trang) |
| GET | `/api/items/:id` | Chi tiết một mục |
| POST | `/api/items/note` | Tạo ghi chú |
| PATCH | `/api/items/:id/note` | Cập nhật nội dung ghi chú |
| POST | `/api/items/url` | Lưu liên kết |
| POST | `/api/items/upload` | Tải tệp lên (multipart, nhiều tệp) |
| PATCH | `/api/items/:id` | Cập nhật tiêu đề/mô tả/thư mục/thẻ |
| PATCH | `/api/items/:id/favorite` | Bật/tắt yêu thích |
| GET | `/api/items/:id/download` | Tải tệp xuống |
| GET | `/api/items/:id/thumbnail` | Ảnh đại diện |
| GET | `/api/items/:id/stream` | Streaming (hỗ trợ Range) |
| DELETE | `/api/items/:id` | Chuyển vào Thùng rác |
| POST | `/api/items/:id/restore` | Khôi phục từ Thùng rác |
| DELETE | `/api/items/:id/permanent` | Xóa vĩnh viễn |
| GET/POST/PATCH/DELETE | `/api/folders` | CRUD thư mục |
| GET/POST/PATCH/DELETE | `/api/tags` | CRUD thẻ |
| GET | `/api/search?q=` | Tìm kiếm toàn cục |
| GET | `/api/trash` | Danh sách Thùng rác |
| DELETE | `/api/trash` | Dọn sạch Thùng rác |
| GET | `/api/dashboard/stats` | Thống kê tổng quan |

---

## 7. Cấu trúc thư mục

```
personal-knowledge-hub/
├── docker-compose.yml
├── backend/            # Express API
│   └── src/
│       ├── config/       # env, kết nối MongoDB, MinIO
│       ├── models/       # User, Item, Folder, Tag, RefreshToken
│       ├── controllers/  # logic nghiệp vụ
│       ├── routes/       # định tuyến REST
│       ├── middlewares/  # auth, upload (multer), validate (zod), lỗi
│       ├── services/     # MinIO, thumbnail, URL metadata, JWT, storage quota
│       ├── validators/   # schema Zod
│       └── workers/      # cron job tự dọn Thùng rác
├── frontend/            # React (Vite) PWA
│   └── src/
│       ├── pages/        # Dashboard, Library, NoteEditor, Search, Trash, Settings...
│       ├── components/   # layout, items, upload, folder, note, common
│       ├── hooks/        # TanStack Query hooks
│       ├── api/          # axios client + API wrappers theo domain
│       └── context/      # AuthContext, ToastContext
└── nginx/               # build frontend + reverse proxy /api
```

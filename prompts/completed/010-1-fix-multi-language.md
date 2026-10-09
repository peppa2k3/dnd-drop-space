# 010-1 — Sửa UI hiển thị key thay vì bản dịch

- Mục tiêu: sau khi chọn ngôn ngữ, UI hiện câu dịch tương ứng thay vì key như `tryRemovingFiltersOrAddingNewDataUsingTheNewButtonInTheUpperCorner`.
- Phạm vi file: cấu hình và kiểm tra runtime i18n frontend; cập nhật tài liệu tiến độ.
- Ngoài phạm vi: API/backend, nội dung do người dùng tạo, triển khai VPS.
- Rủi ro dữ liệu / cách quay lại: không đổi schema hoặc dữ liệu. Lựa chọn ngôn ngữ đã lưu giữ nguyên; có thể quay lại commit trước nếu build lỗi.

## Tiêu chí hoàn tất
- [x] Tái hiện lỗi trên cấu hình runtime cũ và xác định nguyên nhân.
- [x] Sau sửa, cả 9 ngôn ngữ tải đủ 15 namespace; key ví dụ trả về câu dịch đúng cho `vi`/`en` và không lộ key thô ở các locale khác.
- [x] Kiểm tra bản dịch, Vite production build, lint/theme và Docker build stage Node 22 đạt.
- [x] Cập nhật tiến độ, chuyển prompt sang `completed/` và commit đúng phạm vi.

## Kết quả
- Nguyên nhân: `resources: {}` trong `i18n.init` khiến i18next bỏ qua backend tải JSON; kiểm tra key tĩnh cũ vẫn đạt nên không phát hiện. Trước sửa, `i18nReady` hoàn thành nhưng `hasResourceBundle('en', 'files')` là `false` và `i18n.t(...)` trả key thô.
- Thay đổi: bỏ `resources: {}`; thêm bài kiểm tra chạy chính `src/i18n/config.js` qua Vite, đợi init và đổi qua từng ngôn ngữ để kiểm tra namespace/bản dịch. `npm run test:i18n` chạy cả kiểm tra cấu trúc lẫn runtime trước dev/build.
- Kiểm tra: `npm run test:i18n --prefix frontend` đạt (9 locale × 15 namespace); `npm run build --prefix frontend` đạt; `npm run lint --prefix frontend` đạt với 1 warning cũ ở `Groups.jsx`; `npm run test:themes --prefix frontend` đạt. Preview của bản build trả HTTP 200 cho đủ 135 chunk locale. `docker build --target build -f nginx/Dockerfile ...` đạt bằng Node 22, gồm `npm ci`, test i18n và Vite/PWA build. Browser tích hợp không khả dụng; image Nginx cuối và VPS chưa được chạy/push trong lượt này.
- Commit: xem `git log --all -- prompts/completed/010-1-fix-multi-language.md`; không tự ghi hash commit đang tạo.

# 009 — Xây dựng Production CI/CD Workflow

- Phạm vi file: workflow CI/CD, Compose production, deploy script, env mẫu, guide/context, `AGENTS.md` và tài liệu tiến độ.
- Ngoài phạm vi: cấu hình secret thật, push/deploy lên GitHub/VPS, đổi dữ liệu/MongoDB.
- Rủi ro dữ liệu: deploy thật dừng ghi để backup MongoDB + MinIO, cần đủ dung lượng và bản offsite; rollback chỉ đổi image, không đảo migration. Không chạy trên production trong lượt này.

## Mục tiêu

Xây dựng workflow production cho branch `main`.

Khi push lên `main`:

`Check changes → Validate → Build → Push Image → Backup → Deploy VPS → Verify → Rollback nếu lỗi`

Hỗ trợ publish Docker image lên:

- Docker Hub.
- GitHub Container Registry (GHCR).

Chỉ deploy khi toàn bộ bước kiểm tra trước đó thành công.

## Workflow

Chia job rõ ràng, dễ maintain:

1. **changes**
   - Xác định thay đổi `/frontend`, `/backend`.
   - Chỉ build service có thay đổi khi phù hợp.

2. **validate**
   - Install dependencies.
   - Lint.
   - Typecheck.
   - Test cần thiết.
   - Production build check.

3. **build-images**
   - Build Docker image Frontend/Backend.
   - Tag bằng commit SHA và production tag.
   - Không đưa `.env`, secret hoặc credential vào image.

4. **push-images**
   - Push lên Docker Hub và/hoặc GHCR.
   - Chỉ push nếu validate/build thành công.

5. **deploy**
   - SSH vào VPS bằng deploy account giới hạn quyền.
   - Truy cập đúng production deploy path.
   - Backup cấu hình/trạng thái cần thiết trước deploy.
   - Pull image mới.
   - Deploy bằng Docker Compose.
   - Không ghi đè production `.env`.

6. **verify**
   - Kiểm tra container status.
   - Kiểm tra health/API/frontend endpoint.
   - Chỉ đánh dấu deploy thành công khi hệ thống thực sự hoạt động.

7. **rollback**
   - Nếu deploy/verify thất bại:
     - Dừng release lỗi.
     - Deploy lại image/tag production ổn định trước đó.
     - Verify lại sau rollback.
   - Không làm mất database, volume hoặc file storage.

## Phạm vi

- `/frontend`
- `/backend`
- `.github/workflows/`
- Dockerfile / docker-compose production nếu cần.
- Tổng hợp biến môi trường tại `.env.example`.
- Tạo `DEPLOY_GUIDES.md`.

Tái sử dụng cấu trúc deployment, Docker network, reverse proxy và conventions hiện có trong project.

## Security

- Toàn bộ secret production dùng GitHub Secrets/Variables hoặc `.env` trên VPS.
- Không commit SSH key, token, password, OAuth secret, SMTP password.
- Không truyền production secret vào Docker image.
- SSH deploy sử dụng account riêng với quyền tối thiểu.
- Không expose secret trong log workflow.

## DEPLOY_GUIDES.md

Hướng dẫn step-by-step:

- Docker Hub setup.
- GHCR setup.
- GitHub Secrets/Variables.
- SSH key + VPS deploy account.
- VPS deploy directory.
- Docker/Compose setup.
- Production `.env`.
- Google OAuth variables.
- Email/SMTP/App Password.
- Domain/reverse proxy variables nếu project cần.
- Cách deploy lần đầu.
- Cách kiểm tra deployment.
- Cách rollback thủ công.

Không ghi secret thật trong tài liệu.

## Environment

Rà soát toàn bộ project và cập nhật `.env.example` đầy đủ cho:

- Frontend.
- Backend.
- Database.
- Storage/MinIO.
- JWT/Auth.
- Google OAuth.
- Email/OTP.
- URLs/domain.
- Docker/deployment variables cần thiết.

`.env.example` chỉ chứa placeholder và mô tả, không chứa credential thật.

## Tiêu chí hoàn tất

- [x] Push `main` được cấu hình kích hoạt production workflow; manual trên `main` build đủ hai image (kiểm tra tĩnh).
- [x] `validate` gọi CI Frontend/Backend trước build/push/deploy; dự án JavaScript chưa có TypeScript typecheck riêng.
- [ ] Docker image build/push thành công trên GitHub thực tế (chờ người dùng chạy).
- [x] Workflow hỗ trợ GHCR và Docker Hub tùy chọn, image SHA; alias `production` chỉ cập nhật sau verify (kiểm tra cấu hình).
- [ ] Deploy VPS qua SSH thật, backup và verify trên domain thật (chờ người dùng chạy).
- [ ] Rollback tự động đã kiểm chứng bằng lỗi có chủ đích; MongoDB/MinIO/volumes còn nguyên (chờ staging/VPS).
- [x] Secret ứng dụng chỉ ở VPS env; workflow không đưa env/token vào image/source/log theo cấu hình đã rà.
- [x] `backend/.env.example`, `DEPLOY_GUIDES.md`, `docs/context_deploy.md` và trạng thái tài liệu đã cập nhật.
- [x] Workflow chia job `changes/validate/build-images/push-images/deploy/verify/rollback/promote-tags`.
- [ ] Chuyển prompt vào `completed/` sau bằng chứng GitHub/VPS; không đánh dấu chạy thật khi chưa chạy.
- [x] Commit đúng phạm vi với message `009-production-cicd-workflow`.

## Kết quả

Code 2026-10-05: `changes` chỉ chọn service đổi, `validate` dùng CI hiện có, build-image artifact tách job publish SHA vào GHCR và tùy chọn Docker Hub. VPS nhận Compose image-only qua SSH pinned host key, giữ per-service image ref theo release; pull trước downtime, backup cặp MongoDB 4.0 + MinIO khi đã ngừng ghi, `up --wait`, kiểm tra health và HTTPS rồi mới ghi state/current. Lỗi deploy/verify quay lại image cũ; không xóa/restore volume. Registry `:production` chỉ là alias sau verify. File/biến/luồng chi tiết ở `DEPLOY_GUIDES.md` và `docs/context_deploy.md`. Prompt production cũ đổi thành `010` để giữ ID duy nhất.

Kiểm tra tĩnh: `bash -n scripts/deploy.sh`, `docker compose --env-file backend/.env.example -f docker-compose.prod.yml config --quiet` với image/env placeholder, `actionlint` workflow và `git diff --check` đạt. Theo yêu cầu, **không chạy build image, workflow GitHub, backup, deploy hoặc rollback thực tế**. Chưa có domain/VPS secret trong repo; chưa xác nhận production hoạt động. Bước tiếp theo: người dùng cấu hình theo guide, chạy workflow trên `main`, phản hồi log lỗi đã che secret và kết quả kiểm tra để hoàn thiện/đưa prompt sang `completed/`.

Commit: xem `git log --all -- prompts/progress/009-build_workflow_github-VPS-deploy.md`.

# evn-ict-challenges-2026-be

Backend hệ thống **AOYAMA Service** — quản lý dịch vụ bảo dưỡng & sửa chữa xe máy.

NestJS 10 · TypeScript · TypeORM 0.3 · PostgreSQL 16

Tài liệu nguồn: [`RD-2026-001`](../evn-ict-challenges-2026-docs/docs/01-Dinh-nghia-yeu-cau-du-an.md) ·
[`SM-2026-001`](../evn-ict-challenges-2026-docs/docs/02-Danh-sach-so-do-man-hinh.md)

## Yêu cầu môi trường

| Thành phần | Phiên bản | Ghi chú |
| --- | --- | --- |
| Node.js | **20 LTS trở lên** | Node 16 không chạy được |
| PostgreSQL | 16 | Dùng Docker, hoặc bản portable đã cài sẵn (xem dưới) |
| Docker | tùy chọn | Chỉ để chạy PostgreSQL và Adminer |

### Môi trường đã dựng sẵn trên máy này

Máy không có quyền quản trị nên Node và PostgreSQL được cài **bản portable** trong
`%USERPROFILE%\tools` — gỡ chỉ cần xóa thư mục:

```powershell
# Đưa Node 20 lên đầu PATH cho phiên làm việc hiện tại
$env:Path = "$env:USERPROFILE\tools\node-v20.18.1-win-x64;" + $env:Path

# Khởi động / dừng PostgreSQL (dữ liệu nằm ở ~\tools\pgdata)
& "$env:USERPROFILE\tools\pgsql\bin\pg_ctl.exe" -D "$env:USERPROFILE\tools\pgdata" -l "$env:USERPROFILE\tools\pgdata.log" -o "-p 5432" start
& "$env:USERPROFILE\tools\pgsql\bin\pg_ctl.exe" -D "$env:USERPROFILE\tools\pgdata" stop
```

## Chạy lần đầu

```bash
cp .env.example .env          # sửa JWT_SECRET và JWT_REFRESH_SECRET
docker compose up -d          # PostgreSQL :5432, Adminer :8080 (bỏ qua nếu dùng bản portable)
npm install
npm run start:dev             # lần chạy đầu tạo bảng, API tại http://localhost:3001/api/v1
npm run seed                  # nạp dữ liệu khởi tạo (chạy sau khi bảng đã có)
```

Tài liệu API (Swagger): <http://localhost:3001/api/v1/docs>

Tài khoản mẫu sau khi `npm run seed`:

| Tên đăng nhập | Mật khẩu | Vai trò |
| --- | --- | --- |
| `admin` | `Aoyama@2026` | Quản trị viên |
| `staff.hamamatsu` | `Aoyama@2026` | Nhân viên cửa hàng Hamamatsu |

## Lược đồ cơ sở dữ liệu

Giai đoạn phát triển đang bật `DB_SYNCHRONIZE=true` để chạy được ngay khi chưa có migration nào.
**Trước khi phát hành**, sinh migration rồi tắt cờ này:

```bash
npm run migration:generate -- src/database/migrations/InitialSchema
npm run migration:run
# sau đó đặt DB_SYNCHRONIZE=false trong .env
```

## Cấu trúc

```
src/
├── common/              # BaseEntity, phân trang, guard, filter lỗi, tiện ích dùng chung
│   ├── enums/           # Máy trạng thái RD §5.1–5.3 — dùng chung với frontend
│   └── utils/           # Chuẩn hóa SĐT (BR-01), giờ Nhật Bản (C-03), mã lịch hẹn
├── config/              # Cấu hình theo nhóm, đọc từ biến môi trường
├── database/            # data-source, entities.ts, migrations, seeds
└── modules/             # 19 module nghiệp vụ M-01…M-19
    ├── auth/            # M-01 OTP qua SMS + JWT có xoay refresh token
    ├── content/         # M-02 nội dung công khai, FAQ, liên hệ
    ├── ai/              # M-03 chatbox chẩn đoán · M-12 trợ lý kỹ thuật
    ├── bookings/        # M-04 đặt lịch · M-05 mã QR và tiếp nhận
    ├── work-orders/     # M-06 phiếu dịch vụ
    ├── quotations/      # M-07 báo giá có phiên bản
    ├── vehicles/        # M-08 phương tiện và lịch sử dịch vụ
    ├── customers/       # M-09 khách hàng, gộp hồ sơ trùng
    ├── catalog/         # M-10 dịch vụ và quy tắc giá
    ├── parts/           # M-11 phụ tùng và tồn kho
    ├── payments/        # M-13 thanh toán tại cửa hàng
    ├── notifications/   # M-14 SMS/email theo mẫu, 3 ngôn ngữ
    ├── reports/         # M-15 báo cáo, xuất Excel và PDF
    ├── stores/          # M-16 cửa hàng, giờ làm việc, khung giờ
    ├── admin-users/     # M-17 tài khoản quản trị
    ├── system/          # M-18 cấu hình và nhật ký thao tác
    └── scheduler/       # Tiến trình nền: nhắc lịch, vắng mặt, dọn dữ liệu
```

## Những chỗ nghiệp vụ đáng chú ý

| Nơi | Quy tắc |
| --- | --- |
| `bookings/availability.service.ts` | Tính khung giờ còn chỗ — `BR-07`, `BR-08`, `BR-09` |
| `bookings/bookings.service.ts` | Máy trạng thái lịch hẹn `RD §5.1`; ngưỡng hủy/đổi `BR-04`, `BR-05` |
| `bookings/qr.service.ts` | Mã QR dùng một lần, hết hiệu lực sau 24 giờ — `BR-17` |
| `work-orders/work-orders.service.ts` | Máy trạng thái phiếu `RD §5.2`; hoàn tất thì trừ kho và ghi lịch sử xe — `BR-30`, `BR-42` |
| `quotations/quotations.service.ts` | Báo giá có phiên bản — `BR-34`; khách đồng ý thì phiếu chuyển thực hiện — `BR-33` |
| `parts/inventory.service.ts` | Tồn kho không âm, mọi thay đổi để lại một dòng biến động — `BR-42` |
| `payments/payments.service.ts` | Trạng thái thanh toán suy ra từ tổng các lần thu, không nhập tay |
| `ai/ai.provider.ts` | AI tắt hoặc lỗi thì trả kết quả rỗng, nghiệp vụ vẫn chạy thủ công |

## Tích hợp còn chờ chốt

| Hạng mục | Điểm cần làm rõ | Nơi cài đặt |
| --- | --- | --- |
| Nhà cung cấp SMS | `OQ-06` | `notifications/providers/sms.provider.ts` |
| Dịch vụ AI | — | `ai/ai.provider.ts` (`LlmAiProvider.callModel`) |
| Lưu trữ tệp | — | Hiện dùng data URL; thay bằng object storage khi triển khai |
| OTP cho Guest đặt lịch | `OQ-05` | Tham số `booking.requireOtpForGuest` tại SA-43 |

## Lệnh thường dùng

```bash
npm run start:dev          # chạy có theo dõi thay đổi
npm run build              # biên dịch ra dist/
npm run lint               # ESLint kèm tự sửa
npm test                   # Jest
npm run seed               # nạp lại dữ liệu khởi tạo (chạy nhiều lần được)
```

## Repo liên quan

| Repo | Vai trò |
| --- | --- |
| `evn-ict-challenges-2026-docs` | Tài liệu |
| `evn-ict-challenges-2026-be` | Backend (repo này) |
| `evn-ict-challenges-2026-fe` | Frontend |

## Quy ước nhánh

- `main` — trạng thái ổn định
- `develop` — nhánh tích hợp, tạo nhánh `feature/<tên>` từ đây

# evn-ict-challenges-2026-fe

Frontend hệ thống **AOYAMA Service** — site khách hàng và trang quản trị.

Nuxt 3 · TypeScript · Tailwind CSS · Pinia · @nuxtjs/i18n

Tài liệu nguồn: [`SM-2026-001`](../evn-ict-challenges-2026-docs/docs/02-Danh-sach-so-do-man-hinh.md) ·
[`SS-2026-001`](../evn-ict-challenges-2026-docs/docs/03-Dac-ta-chi-tiet-man-hinh.md)

## Yêu cầu môi trường

| Thành phần | Phiên bản | Ghi chú |
| --- | --- | --- |
| Node.js | **20.12 LTS trở lên** | Bắt buộc — Nuxt CLI không chạy trên Node 16 |
| Backend | đang chạy | Mặc định `http://localhost:3001/api/v1` |

## Chạy lần đầu

```bash
cp .env.example .env     # sửa NUXT_PUBLIC_API_BASE nếu backend chạy cổng khác
npm install
npm run dev              # http://localhost:3000
```

- Site khách hàng: <http://localhost:3000>
- Trang quản trị: <http://localhost:3000/admin> (đăng nhập `admin` / `Aoyama@2026`)

## Cấu trúc

```
assets/css/main.css      # Design token — bám theo bản thiết kế màn hình
components/
├── ui/                  # 26 thành phần dùng chung CP-01…CP-26
├── customer/            # Đầu trang, chân trang, thanh bước đặt lịch
└── admin/               # Thanh điều hướng và thanh tiêu đề trang quản trị
composables/             # useApi (tự xoay token khi 401), useFormat
layouts/                 # default · admin · auth · blank
middleware/              # auth · admin · admin-only
pages/                   # 83 màn hình theo SM-2026-001
stores/                  # auth · ui (toast, cửa hàng đang chọn) · booking (bản nháp wizard)
types/                   # enums và models — phải khớp với backend
locales/                 # ja · en · vi
```

## Bản đồ màn hình

| Nhóm | Mã | Đường dẫn |
| --- | --- | --- |
| Nội dung công khai | `SC-01`…`SC-09` | `/`, `/services`, `/pricing`, `/stores`, `/faq`, `/contact`, `/terms`, `/privacy` |
| Chatbox AI | `SC-10`, `SC-11` | `/chat` |
| Đặt lịch | `SC-12`…`SC-16` | `/booking/step1` → `/booking/done` |
| Tài khoản | `SC-17`…`SC-19`, `SC-33`, `SC-34` | `/register`, `/login`, `/verify-otp`, `/account/*` |
| Lịch hẹn | `SC-20`…`SC-26` | `/booking/lookup`, `/account/bookings`, `/bookings/:code/*` |
| Báo giá | `SC-27`, `SC-28` | `/quotations/:token` |
| Phương tiện | `SC-29`…`SC-32` | `/account/vehicles/*`, `/service-records/:id` |
| Quản trị | `SA-01`…`SA-44` | `/admin/*` |
| Hệ thống | `SY-01`…`SY-05` | `error.vue`, `/forbidden`, `/maintenance`, `/session-expired` |

## Quyết định thiết kế đáng chú ý

- **Nút cao tối thiểu 48px, chữ thân 15px** — ràng buộc `C-05`: giao diện phải dễ dùng với người lớn tuổi.
- **Nhãn trạng thái luôn có chữ, không chỉ màu** — `NFR-UX-09`, để người phân biệt màu kém vẫn đọc được.
- **Bản nháp đặt lịch lưu trong `sessionStorage`** — mất dữ liệu giữa chừng là lý do bỏ cuộc phổ biến (`RK-05`).
- **Mọi kết quả AI đều đeo nhãn "Gợi ý bởi AI"** kèm mức độ khớp, và không có gì tự động ghi vào dữ liệu nghiệp vụ (`AI-02`, `AI-04` bắt buộc người duyệt).
- **Trang quản trị chạy SPA, site khách hàng chạy SSR** — trang công khai cần lên chỉ mục tìm kiếm, trang quản trị thì không.
- **Máy quét QR luôn kèm ô nhập tay** — camera hỏng hoặc mã xước là tình huống thật ở quầy lễ tân (`FR-QR-08`).

## Kiểm tra chất lượng

```bash
npm run lint
npm run typecheck        # cần chạy `nuxt prepare` trước (npm install đã tự chạy)
npm run build            # dựng bản phát hành
```

## Repo liên quan

| Repo | Vai trò |
| --- | --- |
| `evn-ict-challenges-2026-docs` | Tài liệu |
| `evn-ict-challenges-2026-be` | Backend |
| `evn-ict-challenges-2026-fe` | Frontend (repo này) |

## Quy ước nhánh

- `main` — trạng thái ổn định
- `develop` — nhánh tích hợp, tạo nhánh `feature/<tên>` từ đây

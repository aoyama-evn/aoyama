# evn-ict-challenges-2026-docs

Tài liệu dự án **Challenges PJ 2026** — Hệ thống quản lý dịch vụ bảo dưỡng & sửa chữa xe máy AOYAMA.

Khách hàng: Mobility Enshu Railway Co., Ltd. · Đối tượng dịch vụ: chuỗi cửa hàng xe máy AOYAMA.

## Cấu trúc

```
docs/
├── Requirements/                      # Tài liệu nguồn từ khách hàng — giữ nguyên, không sửa
│   ├── Thu thập yêu cầu ban đầu.docx
│   └── Proposal.pptx
├── 00-Tong-quan-du-an.md              # OV-2026-001
├── 01-Dinh-nghia-yeu-cau-du-an.md     # RD-2026-001
├── 02-Danh-sach-so-do-man-hinh.md     # SM-2026-001
└── 03-Dac-ta-chi-tiet-man-hinh.md     # SS-2026-001

tools/
└── md2docx.py                         # Xuất .md sang .docx
```

## Bộ tài liệu

| Mã | Tài liệu | Phiên bản | Nội dung |
| --- | --- | --- | --- |
| `OV-2026-001` | [00 — Tổng quan dự án](docs/00-Tong-quan-du-an.md) | 1.0 | Bối cảnh, 10 vấn đề hiện tại, 6 mục tiêu có chỉ số đo, phạm vi trong/ngoài, 3 vai trò, kiến trúc hai site, 19 module chức năng, 5 điểm chạm AI, ràng buộc & giả định, lộ trình 3 giai đoạn, 7 rủi ro |
| `RD-2026-001` | [01 — Định nghĩa yêu cầu dự án](docs/01-Dinh-nghia-yeu-cau-du-an.md) | 1.0 | **209** yêu cầu chức năng (19 module), **46** phi chức năng, **52** quy tắc nghiệp vụ, 3 máy trạng thái, mô hình dữ liệu khái niệm, ma trận quyền 37 dòng, **24** quyết định đã chốt, **20** điểm cần làm rõ, **30** tiêu chí nghiệm thu |
| `SM-2026-001` | [02 — Danh sách & sơ đồ màn hình](docs/02-Danh-sach-so-do-man-hinh.md) | 1.0 | **83** màn hình (34 khách · 44 quản trị · 5 hệ thống), 2 sơ đồ site, 6 sơ đồ luồng nghiệp vụ, **26** thành phần dùng chung, ma trận màn hình × vai trò, 6 đợt triển khai |
| `SS-2026-001` | [03 — Đặc tả chi tiết màn hình](docs/03-Dac-ta-chi-tiet-man-hinh.md) | 1.0 | Đặc tả đủ **83** màn hình: bố cục, thành phần, hành động, quy tắc kiểm tra, thông báo; 21 thành phần dùng chung đặc tả riêng; danh mục 27 thông báo dùng chung |

Quan hệ giữa các tài liệu:

```
docs/Requirements/ (nguồn từ khách hàng)
            │
            ▼
     OV-2026-001  ──▶  RD-2026-001  ──▶  SM-2026-001  ──▶  SS-2026-001
      tổng quan          yêu cầu          màn hình        đặc tả màn hình
```

Mã tham chiếu `FR-*`, `NFR-*`, `BR-*`, `DEC-*`, `OQ-*`, `AC-*` được **định nghĩa một lần duy nhất** trong `RD-2026-001`; các tài liệu sau chỉ tham chiếu, không định nghĩa lại.

## Trạng thái

Cả bốn tài liệu đang ở trạng thái **Bản thảo — chờ khách hàng xác nhận**.

Còn **20 điểm cần làm rõ** (`OQ`). Sáu điểm mức **Cao** nên chốt trước khi sang thiết kế chi tiết vì ảnh hưởng phạm vi dự án:

| OQ | Nội dung |
| --- | --- |
| `OQ-01` | Có tách riêng vai trò **Kỹ thuật viên** không — Proposal có nhắc, yêu cầu ban đầu ghi rõ chỉ 3 vai trò |
| `OQ-02` | Có phân quyền theo **cửa hàng** không |
| `OQ-03` | Hệ thống phục vụ **bao nhiêu cửa hàng** trong giai đoạn đầu |
| `OQ-05` | Guest đặt lịch có cần **xác thực OTP** không |
| `OQ-06` | Nhà cung cấp **SMS gateway**, chi phí và giới hạn |
| `OQ-08` | AOYAMA có **tài liệu kỹ thuật dạng số** không — quyết định tính khả thi của trợ lý AI kỹ thuật |

## Quy ước

- Bản `.md` là **nguồn chính** — dễ sửa và xem được diff trên Git. Khi cần gửi cho người không dùng Git thì xuất sang `.docx` bằng `python tools/md2docx.py <thư mục nguồn> <thư mục đích>` (cần `pip install python-docx`).
- Mỗi tài liệu có bảng **Lịch sử phiên bản** ở cuối. Khi sửa nội dung có ảnh hưởng nghiệp vụ thì tăng phiên bản và ghi lại thay đổi.
- Thư mục `docs/Requirements/` là tài liệu nguồn của khách hàng — **không chỉnh sửa**.

## Repo liên quan

| Repo | Vai trò |
| --- | --- |
| `evn-ict-challenges-2026-docs` | Tài liệu (repo này) |
| `evn-ict-challenges-2026-be` | Backend — NestJS + TypeScript + TypeORM |
| `evn-ict-challenges-2026-fe` | Frontend — Nuxt 3 + TypeScript |

Mở cả 3 repo cùng lúc bằng `challenges-pj-2026.code-workspace` ở thư mục cha.

## Quy ước nhánh

- `main` — trạng thái ổn định
- `develop` — nhánh tích hợp, tạo nhánh `feature/<tên>` từ đây
- `docs` — nhánh chứa bộ tài liệu, đẩy lên `challenges_PJ_2026`

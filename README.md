# evn-ict-challenges-2026-docs

Tài liệu dự án **Challenges PJ 2026** — Hệ thống quản lý dịch vụ bảo dưỡng & sửa chữa xe máy AOYAMA.

Khách hàng: Mobility Enshu Railway Co., Ltd. · Đối tượng dịch vụ: chuỗi cửa hàng xe máy AOYAMA.

## Cấu trúc

```
docs/
├── Requirements/                  # Tài liệu nguồn, giữ nguyên không sửa (CS-03)
│   ├── Thu thập yêu cầu ban đầu.docx
│   └── Proposal.pptx
├── Requirement-Definition/        # Giai đoạn 1 — Định nghĩa yêu cầu
│   ├── Dinh-nghia-yeu-cau-du-an.md      # RD-2026-001
│   └── docx/                            # Thư mục xuất bản .docx/.pdf (đang trống)
└── Basic-Design/                  # Giai đoạn 2 — Thiết kế cơ bản
    ├── Thiet-ke-co-ban.md               # BD-2026-001
    ├── Danh-sach-man-hinh.md            # SL-2026-001
    └── Dac-ta-man-hinh.md               # SS-2026-001

tools/
└── md2docx.py                     # Xuất .md sang .docx
```

## Bộ tài liệu

| Mã | Tài liệu | Phiên bản | Nội dung |
| --- | --- | --- | --- |
| `RD-2026-001` | [Định nghĩa yêu cầu](docs/Requirement-Definition/Dinh-nghia-yeu-cau-du-an.md) | 1.17 | 175 yêu cầu chức năng, 35 phi chức năng, 48 quy tắc nghiệp vụ, 28 quyết định đã chốt, 35 tiêu chí nghiệm thu |
| `BD-2026-001` | [Thiết kế cơ bản](docs/Basic-Design/Thiet-ke-co-ban.md) | 1.1 | Kiến trúc hai site, 8 luồng nghiệp vụ, 29 bảng dữ liệu, 13 nhóm API, 9 tiến trình batch, 15 quyết định thiết kế |
| `SL-2026-001` | [Danh sách màn hình](docs/Basic-Design/Danh-sach-man-hinh.md) | 1.1 | 60 màn hình, 12 thành phần dùng chung, ma trận vai trò, đề xuất 5 đợt triển khai |
| `SS-2026-001` | [Đặc tả màn hình](docs/Basic-Design/Dac-ta-man-hinh.md) | 1.1 | Đặc tả chi tiết đủ 60 màn hình: thành phần, hành động, quy tắc nghiệp vụ, thông báo lỗi |

Quan hệ giữa các tài liệu:

```
Requirements/ (nguồn)  →  RD-2026-001  →  BD-2026-001  →  SL-2026-001  →  SS-2026-001
```

Mã tham chiếu (`FR-xx`, `BR-xx`, `NFR-xx`, `DEC-xx`, `OQ-xx`, `AC-xx`) đều trỏ về `RD-2026-001`, không định nghĩa lại ở tài liệu sau.

## Trạng thái

`RD-2026-001` đang ở trạng thái **Chờ khách hàng xác nhận**, còn **29 điểm cần làm rõ** (`OQ`). Ba điểm mức Cao nên chốt trước khi sang thiết kế chi tiết vì ảnh hưởng phạm vi dự án:

| OQ | Nội dung |
| --- | --- |
| `OQ-11` | Tài liệu kỹ thuật có sẵn ở dạng số không — quyết định `FR-AI-07` có khả thi hay không |
| `OQ-14` | Có dùng OTP qua SMS khi Guest đặt lịch không |
| `OQ-34` | Quản lý tồn kho có bao gồm đặt hàng từ nhà cung cấp không |

## Quy ước

- Bản `.md` là **nguồn chính** — dễ sửa và xem được diff trên Git. Thư mục `docx/` là bản xuất ra để gửi cho người không dùng Git; khi sửa `.md` thì cần xuất lại bằng `python tools/md2docx.py <thư mục nguồn> <thư mục đích>` (cần `pip install python-docx`).
- Mỗi tài liệu có bảng **Lịch sử phiên bản** ở cuối. Khi sửa nội dung có ảnh hưởng nghiệp vụ thì tăng phiên bản và ghi lại thay đổi.

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

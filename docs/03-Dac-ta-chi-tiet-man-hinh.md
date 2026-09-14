# 03 — Đặc tả chi tiết màn hình

| | |
| --- | --- |
| **Mã tài liệu** | `SS-2026-001` |
| **Dự án** | Hệ thống quản lý dịch vụ bảo dưỡng & sửa chữa xe máy AOYAMA |
| **Phiên bản** | 1.0 |
| **Ngày** | 2026-09-14 |
| **Trạng thái** | Bản thảo |
| **Tài liệu liên quan** | [`OV-2026-001`](00-Tong-quan-du-an.md) · [`RD-2026-001`](01-Dinh-nghia-yeu-cau-du-an.md) · [`SM-2026-001`](02-Danh-sach-so-do-man-hinh.md) |

> Tài liệu này đặc tả **toàn bộ 83 màn hình** liệt kê trong `SM-2026-001`. Mã màn hình, đường dẫn, vai trò và đợt triển khai lấy nguyên từ `SM-2026-001`; mã yêu cầu và quy tắc nghiệp vụ trỏ về `RD-2026-001`.

---

## Mục lục

- [A. Quy ước đặc tả](#a-quy-ước-đặc-tả)
- [B. Quy ước chung toàn hệ thống](#b-quy-ước-chung-toàn-hệ-thống)
- [C. Thành phần dùng chung](#c-thành-phần-dùng-chung)
- [D. Site khách hàng — `SC-01` … `SC-34`](#d-site-khách-hàng)
- [E. Trang quản trị — `SA-01` … `SA-44`](#e-trang-quản-trị)
- [F. Màn hình hệ thống — `SY-01` … `SY-05`](#f-màn-hình-hệ-thống)
- [G. Danh mục thông báo dùng chung](#g-danh-mục-thông-báo-dùng-chung)

---

## A. Quy ước đặc tả

Mỗi màn hình được mô tả theo cấu trúc cố định:

| Mục | Nội dung |
| --- | --- |
| **Thông tin chung** | Loại, thiết bị, đường dẫn, vai trò, yêu cầu liên quan, đợt triển khai |
| **Mục đích** | Màn hình giải quyết việc gì cho người dùng |
| **Bố cục** | Sơ đồ khối vị trí các thành phần *(với màn hình phức tạp)* |
| **Thành phần** | Danh sách phần tử: nhãn, kiểu, bắt buộc, ràng buộc |
| **Hành động** | Nút và liên kết: điều kiện hiển thị, kết quả |
| **Quy tắc & kiểm tra** | Quy tắc nghiệp vụ áp dụng và điều kiện hợp lệ của dữ liệu |
| **Thông báo** | Nội dung hiển thị cho từng tình huống |

Ký hiệu kiểu thành phần: `text` ô nhập chữ · `num` ô nhập số · `tel` ô nhập điện thoại · `sel` danh sách chọn · `radio` nút chọn một · `chk` ô đánh dấu · `date` chọn ngày · `file` tải tệp · `area` ô nhập nhiều dòng · `ro` chỉ đọc · `tbl` bảng · `btn` nút.

---

## B. Quy ước chung toàn hệ thống

### B.1 Định dạng dữ liệu

| Loại | Quy ước |
| --- | --- |
| Ngày | `YYYY/MM/DD` (JA, EN) · `DD/MM/YYYY` (VI) |
| Giờ | 24 giờ, `HH:mm` |
| Múi giờ | Hiển thị và tính nghiệp vụ theo **UTC+9**; lưu trữ theo UTC — `BR-51` |
| Tiền tệ | JPY, không phần thập phân, phân cách nghìn: `¥12,500` — `BR-39` |
| Số điện thoại | Nhập dạng quốc gia, lưu dạng E.164 — `BR-50` |
| Số km | Số nguyên, đơn vị `km`, phân cách nghìn |

### B.2 Kiểm tra dữ liệu dùng chung

| Trường | Ràng buộc |
| --- | --- |
| Họ tên | Bắt buộc, 1–100 ký tự |
| Số điện thoại | Bắt buộc, 9–15 chữ số sau khi chuẩn hóa, phải là số di động hợp lệ |
| Email | Tùy chọn, đúng định dạng email, tối đa 254 ký tự |
| Biển số | Tùy chọn, 1–20 ký tự, duy nhất trong hệ thống — `FR-VEH-03` |
| Mô tả tự do | Tối đa 1.000 ký tự |
| Ảnh tải lên | JPG / PNG / HEIC, mỗi tệp ≤ 10 MB |
| Ghi âm | ≤ 120 giây, ≤ 20 MB |

### B.3 Quy tắc hiển thị bắt buộc

| # | Quy tắc | Yêu cầu |
| --- | --- | --- |
| 1 | Cỡ chữ thân bài ≥ 16 px (PC) / 17 px (điện thoại) | `NFR-UX-02` |
| 2 | Độ tương phản ≥ 4,5:1 | `NFR-UX-03` |
| 3 | Vùng bấm ≥ 44 × 44 px | `NFR-UX-04` |
| 4 | Mỗi màn hình chỉ một hành động chính nổi bật | `NFR-UX-06` |
| 5 | Lỗi hiển thị ngay cạnh trường bị lỗi, viết bằng ngôn ngữ thường ngày | `NFR-UX-07` |
| 6 | Hành động không hoàn tác phải qua hộp thoại xác nhận | `NFR-UX-08` |
| 7 | Không dùng màu làm phương tiện truyền đạt duy nhất | `NFR-UX-09` |
| 8 | Thao tác quá 1 giây phải có trạng thái chờ | `NFR-UX-12` |
| 9 | Toàn bộ chữ lấy từ tệp ngôn ngữ, không viết cứng trong mã | `NFR-MA-02` |

### B.4 Màu trạng thái (`CP-10`)

| Trạng thái | Màu | Biểu tượng |
| --- | --- | --- |
| Chờ xác nhận | Vàng | ⏳ |
| Đã xác nhận | Xanh dương | ✔ |
| Đã tiếp nhận / Đang thực hiện | Xanh lá nhạt | 🔧 |
| Hoàn tất / Đã bàn giao | Xanh lá đậm | ✅ |
| Đã hủy | Xám | ✖ |
| Khách không đến | Cam | ⚠ |
| Chưa thanh toán | Đỏ nhạt | ¥ |
| Đã thanh toán | Xanh lá | ¥✓ |

---

## C. Thành phần dùng chung

Đặc tả chi tiết 26 thành phần đã liệt kê tại [`SM-2026-001` §9](02-Danh-sach-so-do-man-hinh.md#9-thành-phần-giao-diện-dùng-chung).

### `CP-01` — Đầu trang site khách hàng

| Vị trí | Phần tử | Ghi chú |
| --- | --- | --- |
| Trái | Logo AOYAMA | Bấm về `SC-01` |
| Giữa | Dịch vụ · Bảng giá · Cửa hàng · Câu hỏi thường gặp | Trên điện thoại thu vào nút ba gạch |
| Phải | `CP-03` chuyển ngôn ngữ · Đăng nhập / tên người dùng · **Nút Đặt lịch** | Nút Đặt lịch luôn hiện, kể cả trên điện thoại |

Trên điện thoại, nút **Đặt lịch** được ghim cố định ở đáy màn hình để người lớn tuổi không phải cuộn tìm — `NFR-UX-01`.

### `CP-03` — Bộ chuyển ngôn ngữ

- Ba lựa chọn: **English · Tiếng Việt · 日本語**.
- Hiển thị tên ngôn ngữ bằng chính ngôn ngữ đó, kèm biểu tượng 🌐.
- Lựa chọn lưu vào cookie; với `R-USER` lưu vào hồ sơ — `FR-I18N-03`.
- Đổi ngôn ngữ giữ nguyên trang và dữ liệu đang nhập.

### `CP-06` — Bảng dữ liệu

| Tính năng | Mô tả |
| --- | --- |
| Sắp xếp | Bấm tiêu đề cột; mặc định theo thời gian tạo giảm dần |
| Phân trang | 20 dòng mỗi trang, chọn được 20/50/100 — `NFR-PF-03` |
| Chọn nhiều | Ô đánh dấu đầu dòng, hiện thanh thao tác hàng loạt |
| Chọn cột | Ẩn/hiện cột, lưu theo từng người dùng |
| Trạng thái rỗng | Dùng `CP-26` |
| Đang tải | Khung xương thay cho vòng quay |

### `CP-07` — Thanh lọc & tìm kiếm

Bố cục một hàng: `[ô tìm kiếm] [khoảng ngày] [trạng thái ▾] [cửa hàng ▾] [Lọc] [Xóa lọc]`. Điều kiện lọc ghi vào tham số đường dẫn để chia sẻ và tải lại được.

### `CP-08` — Hộp thoại xác nhận

| Phần tử | Nội dung |
| --- | --- |
| Tiêu đề | Câu hỏi ngắn, ví dụ "Hủy lịch hẹn này?" |
| Nội dung | Hậu quả của hành động, viết rõ ràng |
| Nút phụ | **Quay lại** (mặc định được chọn) |
| Nút chính | Tên hành động cụ thể, ví dụ **Hủy lịch hẹn** — không dùng chữ "OK" |

### `CP-10` — Nhãn trạng thái

Hiển thị **biểu tượng + chữ + màu**. Không bao giờ chỉ dùng màu — `NFR-UX-09`. Bảng màu tại §B.4.

### `CP-11` — Bộ chọn ngày & khung giờ

```
◀  Tháng 10 / 2026  ▶
CN  T2  T3  T4  T5  T6  T7
             1   2   3   4
 5   6   7   8   9  10  11
        ▲ ngày nghỉ hiện mờ, không bấm được

Khung giờ ngày 08/10 (Thứ 5)
┌──────────────┬──────────────┬──────────────┐
│ 09:00–10:00  │ 10:00–11:00  │ 11:00–12:00  │
│ còn 2 chỗ    │  ĐÃ ĐẦY      │ còn 3 chỗ    │
└──────────────┴──────────────┴──────────────┘
```

| Quy tắc | Nội dung |
| --- | --- |
| Ngày nghỉ | Hiện mờ, không chọn được — `FR-STO-04` `BR-08` |
| Ngoài giờ làm việc | Không hiện khung giờ |
| Khung giờ đầy | Hiện nhãn **ĐÃ ĐẦY**, không bấm được — `BR-07` |
| Quá khứ | Không chọn được — `BR-09` |
| Giới hạn tương lai | **Không có** — `BR-03` |
| Chế độ quản trị | Admin chọn được cả khung giờ đầy, hệ thống cảnh báo — `BR-12` |

### `CP-13` — Biểu mẫu thông tin xe

| # | Nhãn | Kiểu | Bắt buộc | Ràng buộc |
| --- | --- | :---: | :---: | --- |
| 1 | Hãng xe | `sel` | ✔ | Danh mục hãng; có lựa chọn "Khác" |
| 2 | Dòng xe | `sel`/`text` | ✔ | Lọc theo hãng; nhập tự do khi chọn "Khác" |
| 3 | Loại xe | `sel` | ✔ | Xe số · Xe tay ga · Xe côn tay · Xe điện |
| 4 | Loại nhiên liệu | `sel` | ✔ | Xăng · Điện · Hybrid — ảnh hưởng giá bảo dưỡng `BR-34` |
| 5 | Năm sản xuất | `sel` | — | Từ 1980 đến năm hiện tại |
| 6 | Biển số | `text` | — | Duy nhất — `FR-VEH-03` |
| 7 | Số khung | `text` | — | Tối đa 30 ký tự |
| 8 | Màu xe | `text` | — | Tối đa 30 ký tự |
| 9 | Số km hiện tại | `num` | — | 0 – 999.999 |

### `CP-14` — Ô tải ảnh

Kéo thả hoặc bấm chọn; chụp trực tiếp bằng camera trên điện thoại. Xem trước dạng ô vuông, xóa từng ảnh. Giới hạn theo §B.2. Trước lần tải đầu tiên trên site khách hàng, hiện thông báo đồng ý xử lý dữ liệu cá nhân — `NFR-SE-11`.

### `CP-15` — Nút ghi âm

Trạng thái: *Sẵn sàng* → *Đang ghi (hiện đồng hồ đếm)* → *Đã ghi (nghe lại / ghi lại / xóa)*. Tự dừng ở 120 giây. Khi trình duyệt chặn micro, hiện hướng dẫn cấp quyền và gợi ý nhập văn bản thay thế.

### `CP-16` — Thẻ kết quả AI

```
┌───────────────────────────────────────────────┐
│ ✨ Gợi ý bởi AI — cần kỹ thuật viên kiểm tra  │
├───────────────────────────────────────────────┤
│ Mòn má phanh trước              ████████ 82 % │
│ Dịch vụ đề xuất: Thay má phanh · từ ¥3,500    │
│                                    [ Chọn ]   │
├───────────────────────────────────────────────┤
│ Đĩa phanh cong                  ████ 41 %     │
│ Dịch vụ đề xuất: Kiểm tra hệ thống phanh      │
│                                    [ Chọn ]   │
└───────────────────────────────────────────────┘
```

| Quy tắc | Nội dung |
| --- | --- |
| Nhãn | Luôn có dòng "Gợi ý bởi AI" — `FR-AI-10` |
| Độ tin cậy | Hiện thanh và số phần trăm khi mô hình trả về — `FR-AI-06` |
| Áp dụng | Nút **Chọn** riêng cho từng mục; không tự ghi vào biểu mẫu — `BR-29` |
| Nền | Nền khác biệt rõ với vùng dữ liệu do người nhập |

### `CP-17` — Hiển thị mã QR

Mã QR cỡ tối thiểu 240 × 240 px, kèm **mã lịch hẹn dạng chữ** cỡ lớn bên dưới để nhập tay khi quét không được — `FR-QR-08`. Có nút **Tải ảnh mã QR**. Khi mã hết hiệu lực, thay bằng thông báo lý do — `BR-16`.

### `CP-18` — Máy quét mã QR

Khung camera toàn màn hình, khung ngắm ở giữa, nút bật/tắt đèn. Bên dưới có ô **Nhập mã lịch hẹn** dự phòng. Tự nhận dạng, rung nhẹ khi quét thành công.

### `CP-19` — Thanh tiến độ trạng thái

```
● Tiếp nhận ──● Chẩn đoán ──○ Chờ duyệt báo giá ──○ Đang làm ──○ Hoàn tất
   10:15         10:40
```
Mốc đã qua tô đậm kèm thời điểm; mốc hiện tại nhấp nháy nhẹ; mốc chưa tới để mờ.

### `CP-20` — Bộ chọn phụ tùng

Ô tìm theo mã hoặc tên; kết quả hiện **tồn kho của cửa hàng đang chọn**. Phụ tùng hết hàng vẫn chọn được nhưng có cảnh báo. Hiện danh sách xe tương thích để đối chiếu — `FR-PRT-03`.

### `CP-21` — Bảng dòng tiền

| Dòng | Cách tính |
| --- | --- |
| Tổng tiền công | Cộng các hạng mục công việc |
| Tổng tiền phụ tùng | Cộng (đơn giá × số lượng) |
| Thuế | Theo thuế suất cấu hình — `OQ-13` |
| **Tổng cộng** | Tiền công + tiền phụ tùng + thuế — `BR-20` |

### `CP-22` — Thẻ chỉ số

Con số lớn, nhãn ngắn bên dưới, mũi tên so sánh kỳ trước kèm chữ (tăng/giảm) — không chỉ dùng màu.

### `CP-23` — Nút xuất tệp

Nút **Xuất ▾** với hai lựa chọn **Excel (.xlsx)** và **PDF**. Tệp trên 10.000 dòng xử lý nền và thông báo khi xong — `NFR-PF-06`.

### `CP-24` — Ô nhập đa ngôn ngữ

Ba tab `日本語 | English | Tiếng Việt`. Tab tiếng Nhật bắt buộc; hai tab còn lại tùy chọn. Tab thiếu nội dung có dấu chấm cảnh báo. Khi thiếu, hiển thị tiếng Nhật — `FR-I18N-05`.

### `CP-25` — Bảng nhật ký thay đổi

Bảng chỉ đọc: thời điểm · người thực hiện · hành động · trường · giá trị trước · giá trị sau. Không sửa, không xóa — `FR-SYS-06`.

### `CP-26` — Trạng thái rỗng

Biểu tượng, một câu giải thích vì sao trống, và nút dẫn tới hành động tiếp theo. Ví dụ: *"Chưa có lịch hẹn nào. Bấm Đặt lịch để bắt đầu."*

Các thành phần `CP-02`, `CP-04`, `CP-05`, `CP-09`, `CP-12` theo bố cục mô tả tại [`SM-2026-001` §11](02-Danh-sach-so-do-man-hinh.md#11-quy-ước-điều-hướng-và-bố-cục).

---

## D. Site khách hàng

### `SC-01` — Trang chủ

| | |
| --- | --- |
| **Loại · Thiết bị** | `P` · PC+SP |
| **Đường dẫn** | `/` |
| **Vai trò** | Tất cả |
| **Yêu cầu** | `FR-PUB-01` `NFR-UX-01` |
| **Đợt** | MVP |

**Mục đích.** Giới thiệu dịch vụ và đưa khách vào luồng đặt lịch nhanh nhất có thể.

**Bố cục**

```
┌───────────────────────────────────────────────┐
│ CP-01 Đầu trang                               │
├───────────────────────────────────────────────┤
│  Ảnh lớn + khẩu hiệu                          │
│  "Bảo dưỡng & sửa chữa xe máy AOYAMA"         │
│        [ ĐẶT LỊCH NGAY ]  ← nút chính         │
├───────────────────────────────────────────────┤
│  3 bước đơn giản:  ①Đặt lịch ②Mang xe đến ③Nhận xe │
├───────────────────────────────────────────────┤
│  Dịch vụ nổi bật (CP-12 × 4)                  │
├───────────────────────────────────────────────┤
│  Cửa hàng gần bạn                             │
├───────────────────────────────────────────────┤
│  Không rõ xe bị gì? → [ Hỏi trợ lý AI ]       │
├───────────────────────────────────────────────┤
│ CP-02 Chân trang                              │
└───────────────────────────────────────────────┘
```

**Thành phần**

| # | Thành phần | Kiểu | Mô tả |
| --- | --- | :---: | --- |
| 1 | Khối ảnh lớn | `ro` | Ảnh, khẩu hiệu, nút chính |
| 2 | Nút **Đặt lịch ngay** | `btn` | Hành động chính, cỡ lớn |
| 3 | Khối 3 bước | `ro` | Giải thích quy trình bằng biểu tượng và chữ ngắn |
| 4 | Dịch vụ nổi bật | `tbl` | Tối đa 4 thẻ `CP-12`, do Admin chọn thứ tự `FR-SVC-09` |
| 5 | Cửa hàng | `ro` | Tối đa 3 cửa hàng kèm địa chỉ và điện thoại |
| 6 | Lời mời dùng chatbox | `btn` | Mở `SC-10` *(từ G2)* |

**Hành động**

| Nút | Kết quả |
| --- | --- |
| Đặt lịch ngay | → `SC-12` |
| Thẻ dịch vụ | → `SC-03` |
| Xem tất cả dịch vụ | → `SC-02` |
| Hỏi trợ lý AI | Mở `SC-10` *(G2)* |
| Cửa hàng | → `SC-06` |

**Quy tắc & kiểm tra.** Không yêu cầu đăng nhập. Nội dung hiển thị theo ngôn ngữ đang chọn; thiếu bản dịch thì hiện tiếng Nhật (`FR-I18N-05`).

---

### `SC-02` — Danh sách dịch vụ

| | |
| --- | --- |
| **Loại · Thiết bị** | `L` · PC+SP |
| **Đường dẫn** | `/services` |
| **Vai trò** | Tất cả |
| **Yêu cầu** | `FR-PUB-02` |
| **Đợt** | MVP |

**Mục đích.** Cho khách xem toàn bộ dịch vụ, tách rõ hai nhóm bảo dưỡng và sửa chữa.

**Thành phần**

| # | Thành phần | Kiểu | Mô tả |
| --- | --- | :---: | --- |
| 1 | Tab nhóm dịch vụ | `radio` | **Tất cả · Bảo dưỡng · Sửa chữa** |
| 2 | Ô tìm kiếm | `text` | Tìm theo tên dịch vụ |
| 3 | Lưới thẻ dịch vụ | `tbl` | `CP-12` — tên, mô tả ngắn, giá tham khảo, thời gian ước tính |
| 4 | Nút Đặt lịch trên từng thẻ | `btn` | → `SC-12` với dịch vụ đã chọn sẵn |

**Quy tắc & kiểm tra.** Chỉ hiện dịch vụ đang bật hiển thị (`FR-SVC-03`). Thứ tự theo cấu hình Admin (`FR-SVC-09`). Giá hiển thị là **giá tham khảo**, kèm ghi chú *"Giá cuối cùng xác định sau khi kiểm tra xe"*.

**Thông báo.** Không có dịch vụ nào khớp → `CP-26`: *"Không tìm thấy dịch vụ phù hợp. Thử từ khóa khác hoặc xem tất cả."*

---

### `SC-03` — Chi tiết dịch vụ

| | |
| --- | --- |
| **Loại · Thiết bị** | `D` · PC+SP |
| **Đường dẫn** | `/services/:slug` |
| **Vai trò** | Tất cả |
| **Yêu cầu** | `FR-PUB-03` `FR-SVC-06` |
| **Đợt** | MVP |

**Thành phần**

| # | Thành phần | Kiểu | Mô tả |
| --- | --- | :---: | --- |
| 1 | Tên dịch vụ | `ro` | Theo ngôn ngữ đang chọn |
| 2 | Nhóm | `ro` | Bảo dưỡng / Sửa chữa |
| 3 | Mô tả đầy đủ | `ro` | Văn bản có định dạng |
| 4 | Hạng mục công việc | `ro` | Danh sách gạch đầu dòng |
| 5 | Thời gian ước tính | `ro` | Ví dụ "khoảng 60 phút" |
| 6 | Bảng giá tham khảo | `tbl` | Theo loại nhiên liệu (bảo dưỡng) hoặc mức độ khó (sửa chữa) |
| 7 | Cửa hàng cung cấp | `ro` | Danh sách cửa hàng có dịch vụ này — `FR-SVC-07` |
| 8 | Nút **Đặt dịch vụ này** | `btn` | Hành động chính |

**Hành động.** Đặt dịch vụ này → `SC-12` với dịch vụ đã chọn sẵn.

**Thông báo.** Dịch vụ không tồn tại hoặc đã ẩn → `SY-01`.

---

### `SC-04` — Bảng giá tham khảo

| | |
| --- | --- |
| **Loại · Thiết bị** | `L` · PC+SP |
| **Đường dẫn** | `/pricing` |
| **Vai trò** | Tất cả |
| **Yêu cầu** | `FR-PUB-04` `FR-SVC-06` `BR-34` `BR-35` |
| **Đợt** | MVP |

**Thành phần**

| # | Thành phần | Kiểu | Mô tả |
| --- | --- | :---: | --- |
| 1 | Lọc theo loại xe | `sel` | Xe số · Tay ga · Côn tay · Xe điện |
| 2 | Lọc theo loại nhiên liệu | `sel` | Xăng · Điện · Hybrid |
| 3 | Bảng giá bảo dưỡng | `tbl` | Cột: dịch vụ · loại nhiên liệu · phụ tùng đi kèm · giá từ–đến |
| 4 | Bảng giá sửa chữa | `tbl` | Cột: dịch vụ · loại phụ tùng · mức độ khó · giá từ–đến |
| 5 | Ghi chú | `ro` | *"Giá trên chỉ mang tính tham khảo. Giá cuối cùng được xác nhận qua báo giá sau khi kiểm tra xe."* |

**Quy tắc & kiểm tra.** Trên điện thoại, bảng chuyển sang dạng thẻ xếp dọc để không phải cuộn ngang (`NFR-CP-02`). Giá hiển thị là giá đang hiệu lực tại thời điểm xem (`FR-SVC-08`).

---

### `SC-05` — Danh sách cửa hàng

| | |
| --- | --- |
| **Loại · Thiết bị** | `L` · PC+SP |
| **Đường dẫn** | `/stores` |
| **Vai trò** | Tất cả · **Yêu cầu** `FR-PUB-05` · **Đợt** MVP |

**Thành phần.** Ô tìm theo tên hoặc khu vực (`text`); danh sách thẻ cửa hàng gồm tên, địa chỉ, số điện thoại, giờ mở cửa hôm nay, trạng thái *Đang mở / Đã đóng*; bản đồ tổng thể (`ro`).

**Hành động.** Bấm thẻ → `SC-06`. Nút **Đặt lịch tại đây** → `SC-12` với cửa hàng đã chọn sẵn.

**Quy tắc.** Chỉ hiện cửa hàng đang hoạt động (`FR-STO-01`). Trạng thái mở/đóng tính theo giờ làm việc và ngày nghỉ (`FR-STO-03` `FR-STO-04`), theo UTC+9.

---

### `SC-06` — Chi tiết cửa hàng

| | |
| --- | --- |
| **Loại · Thiết bị** | `D` · PC+SP |
| **Đường dẫn** | `/stores/:id` |
| **Vai trò** | Tất cả · **Yêu cầu** `FR-PUB-05` `FR-STO-02` · **Đợt** MVP |

**Thành phần.** Ảnh cửa hàng; tên · địa chỉ · điện thoại · email; bản đồ và nút chỉ đường; bảng giờ làm việc theo từng ngày trong tuần; danh sách ngày nghỉ sắp tới; danh sách dịch vụ cung cấp.

**Hành động.** **Đặt lịch tại cửa hàng này** → `SC-12` (hành động chính). Gọi điện → mở ứng dụng gọi trên điện thoại. Chỉ đường → mở bản đồ ngoài.

---

### `SC-07` — Câu hỏi thường gặp

| | |
| --- | --- |
| **Loại · Thiết bị** | `P` · PC+SP · **Đường dẫn** `/faq` · **Yêu cầu** `FR-PUB-06` · **Đợt** G2 |

Danh sách câu hỏi dạng gập mở, nhóm theo chủ đề (Đặt lịch · Giá & thanh toán · Bảo dưỡng · Tài khoản). Ô tìm kiếm ở đầu trang. Mỗi câu hỏi có đường dẫn neo riêng để chia sẻ.

---

### `SC-08` — Liên hệ

| | |
| --- | --- |
| **Loại · Thiết bị** | `F` · PC+SP · **Đường dẫn** `/contact` · **Yêu cầu** `FR-PUB-07` · **Đợt** G2 |

**Thành phần.** Họ tên (`text`, bắt buộc) · Số điện thoại (`tel`, bắt buộc) · Email (`text`, tùy chọn) · Cửa hàng liên quan (`sel`, tùy chọn) · Nội dung (`area`, bắt buộc, ≤ 1.000 ký tự) · ô đồng ý chính sách dữ liệu (`chk`, bắt buộc).

**Thông báo.** Gửi thành công → *"Đã gửi. Chúng tôi sẽ liên hệ lại trong vòng 1 ngày làm việc."* · Chưa đồng ý chính sách → *"Vui lòng đồng ý với chính sách bảo vệ dữ liệu cá nhân trước khi gửi."*

---

### `SC-09` — Điều khoản & chính sách dữ liệu

| | |
| --- | --- |
| **Loại · Thiết bị** | `P` · PC+SP · **Đường dẫn** `/terms`, `/privacy` · **Yêu cầu** `FR-PUB-08` `NFR-SE-11` · **Đợt** MVP |

Nội dung tĩnh do khách hàng cung cấp, có mục lục bên cạnh, ngày cập nhật gần nhất ở đầu trang, đủ ba ngôn ngữ. Nêu rõ thời hạn lưu trữ ảnh và ghi âm chẩn đoán (`NFR-SE-09`).

---

### `SC-10` — Chatbox AI chẩn đoán

| | |
| --- | --- |
| **Loại · Thiết bị** | `X` · PC+SP |
| **Đường dẫn** | Lớp phủ trên mọi trang site khách hàng |
| **Vai trò** | `R-GUEST` `R-USER` |
| **Yêu cầu** | `FR-AI-01`…`FR-AI-05` `FR-AI-11` `FR-AI-12` |
| **Đợt** | G2 |

**Mục đích.** Giúp khách mô tả được tình trạng xe kể cả khi không biết gọi tên lỗi, bằng chữ, ảnh hoặc giọng nói.

**Bố cục**

```
┌─────────────────────────────────────┐
│ 💬 Trợ lý AOYAMA               [✕] │
├─────────────────────────────────────┤
│ Xin chào! Bạn cần hỗ trợ gì?        │
│  ┌──────────────┐ ┌──────────────┐ │
│  │  Bảo dưỡng   │ │   Sửa chữa   │ │  ← FR-AI-02
│  └──────────────┘ └──────────────┘ │
│                                     │
│ (hội thoại cuộn ở đây)              │
│                                     │
├─────────────────────────────────────┤
│ [📷 Ảnh] [🎤 Giọng nói]             │
│ ┌─────────────────────────┐  ┌────┐ │
│ │ Mô tả tình trạng xe...  │  │Gửi │ │
│ └─────────────────────────┘  └────┘ │
└─────────────────────────────────────┘
```

**Thành phần**

| # | Thành phần | Kiểu | Mô tả |
| --- | --- | :---: | --- |
| 1 | Nút mở chatbox | `btn` | Nút tròn nổi góc dưới phải, luôn hiện |
| 2 | Lời chào và tùy chọn nhanh | `btn` | **Bảo dưỡng** / **Sửa chữa** — `FR-AI-02` |
| 3 | Khung hội thoại | `ro` | Tin nhắn của khách và của trợ lý, cuộn xuống mới nhất |
| 4 | Ô nhập văn bản | `area` | ≤ 1.000 ký tự — `FR-AI-03` |
| 5 | Nút tải ảnh | `file` | `CP-14` — tối đa 5 ảnh — `FR-AI-04` |
| 6 | Nút ghi âm | `btn` | `CP-15` — tối đa 120 giây — `FR-AI-05` |
| 7 | Chọn loại xe | `sel` | Hỏi khi chưa biết; `R-USER` chọn từ xe đã lưu |
| 8 | Trạng thái đang phân tích | `ro` | *"Đang phân tích…"* kèm hoạt ảnh |

**Hành động**

| Hành động | Kết quả |
| --- | --- |
| Chọn **Bảo dưỡng** | Bỏ qua chẩn đoán, sang thẳng `SC-12` với nhóm bảo dưỡng |
| Chọn **Sửa chữa** | Hỏi mô tả tình trạng xe |
| Gửi mô tả / ảnh / giọng nói | Gọi dịch vụ AI → hiển thị `SC-11` trong khung hội thoại |
| Đóng | Lưu phiên để mở lại trong cùng lượt truy cập |

**Quy tắc & kiểm tra**

| # | Quy tắc |
| --- | --- |
| 1 | Trước lần tải ảnh hoặc ghi âm đầu tiên, hiện thông báo đồng ý xử lý dữ liệu — `NFR-SE-11` |
| 2 | Ghi âm được chuyển thành văn bản trước khi phân tích; văn bản hiện lại cho khách kiểm tra — `FR-AI-05` |
| 3 | Chờ tối đa 10 giây; quá hạn thì chuyển sang lối thủ công — `NFR-PF-04` `FR-AI-11` |
| 4 | Toàn bộ hội thoại, ảnh, ghi âm được đính vào lịch hẹn tạo ra từ phiên này — `FR-AI-12` |
| 5 | Chatbox **không** trả lời câu hỏi ngoài phạm vi bảo dưỡng và sửa chữa xe máy |

**Thông báo**

| Tình huống | Nội dung |
| --- | --- |
| Ảnh quá lớn | *"Ảnh vượt quá 10 MB. Vui lòng chọn ảnh nhỏ hơn."* |
| Sai định dạng ảnh | *"Chỉ nhận ảnh JPG, PNG hoặc HEIC."* |
| Không cấp quyền micro | *"Trình duyệt chưa cho phép dùng micro. Bạn có thể mô tả bằng chữ."* |
| AI quá thời gian chờ | *"Trợ lý đang bận. Bạn vẫn đặt lịch bình thường được, kỹ thuật viên sẽ kiểm tra trực tiếp."* + nút **Đặt lịch** |
| AI lỗi | *"Không phân tích được lúc này."* + nút **Đặt lịch** |

---

### `SC-11` — Kết quả chẩn đoán AI

| | |
| --- | --- |
| **Loại · Thiết bị** | `D` · PC+SP |
| **Đường dẫn** | Trong chatbox, hoặc `/diagnosis/:id` |
| **Vai trò** | `R-GUEST` `R-USER` |
| **Yêu cầu** | `FR-AI-06`…`FR-AI-10` |
| **Đợt** | G2 |

**Thành phần**

| # | Thành phần | Kiểu | Mô tả |
| --- | --- | :---: | --- |
| 1 | Tóm tắt mô tả của khách | `ro` | Văn bản, ảnh thu nhỏ, đoạn ghi âm |
| 2 | Danh sách lỗi nghi ngờ | `tbl` | `CP-16` — tối đa 5 mục, sắp giảm dần theo % — `FR-AI-07` |
| 3 | Mức độ khớp | `ro` | Thanh + số phần trăm — `FR-AI-06` |
| 4 | Dịch vụ đề xuất | `ro` | Tên dịch vụ + giá tham khảo — `FR-AI-08` |
| 5 | Nhãn cảnh báo | `ro` | *"Gợi ý bởi AI — cần kỹ thuật viên kiểm tra thực tế"* — `FR-AI-10` |
| 6 | Nút **Đặt lịch với dịch vụ này** | `btn` | Hành động chính — `FR-AI-09` |
| 7 | Nút **Mô tả lại** | `btn` | Quay về ô nhập của `SC-10` |

**Quy tắc & kiểm tra**

| # | Quy tắc |
| --- | --- |
| 1 | Không hiện mục có mức độ khớp dưới 10 % |
| 2 | Khi không có mục nào đạt ngưỡng, hiện thông điệp trung tính và nút đặt lịch kiểm tra tổng quát |
| 3 | Chọn một lỗi → `SC-12` với **dịch vụ chọn sẵn** và **mô tả điền sẵn** — `FR-AI-09` |
| 4 | Kết quả chẩn đoán không được trình bày như kết luận chắc chắn |

**Thông báo.** Không có lỗi nào đủ tin cậy → *"Chưa xác định được nguyên nhân từ mô tả của bạn. Bạn có thể đặt lịch kiểm tra tổng quát để kỹ thuật viên xem trực tiếp."*

---

### `SC-12` — Đặt lịch, Bước 1: Chọn dịch vụ & cửa hàng

| | |
| --- | --- |
| **Loại · Thiết bị** | `W` · PC+SP |
| **Đường dẫn** | `/booking/step1` |
| **Vai trò** | `R-GUEST` `R-USER` |
| **Yêu cầu** | `FR-BOOK-02` `FR-BOOK-03` `NFR-UX-05` |
| **Đợt** | MVP |

**Bố cục**

```
┌───────────────────────────────────────────────┐
│  ①Dịch vụ ──── ②Thời gian ──── ③Thông tin     │  ← chỉ báo bước
├───────────────────────────────────────────────┤
│  Bạn cần dịch vụ nào?                         │
│   ☐ Bảo dưỡng      ☐ Sửa chữa                 │  ← chọn 1 hoặc cả 2
├───────────────────────────────────────────────┤
│  Chọn hạng mục (hiện theo nhóm đã chọn)       │
│   ☑ Thay dầu máy            ¥2,500 · 30 phút  │
│   ☐ Thay má phanh           từ ¥3,500 · 45 ph │
├───────────────────────────────────────────────┤
│  Chọn cửa hàng                                │
│   ◉ AOYAMA Hamamatsu   3,2 km                 │
│   ○ AOYAMA Shizuoka   12,5 km                 │
├───────────────────────────────────────────────┤
│                        [ Tiếp theo → ]        │
└───────────────────────────────────────────────┘
```

**Thành phần**

| # | Nhãn | Kiểu | Bắt buộc | Ràng buộc |
| --- | --- | :---: | :---: | --- |
| 1 | Chỉ báo bước | `ro` | — | 3 bước — `NFR-UX-05` |
| 2 | Loại dịch vụ | `chk` | ✔ | **Bảo dưỡng** và/hoặc **Sửa chữa**; chọn được cả hai — `FR-BOOK-02` `BR-02` |
| 3 | Danh sách hạng mục | `chk` | ✔ | Chọn ít nhất một; lọc theo loại đã chọn và theo cửa hàng |
| 4 | Cửa hàng | `radio` | ✔ | Chỉ cửa hàng đang hoạt động — `FR-BOOK-03` |
| 5 | Ghi chú từ chẩn đoán AI | `ro` | — | Hiện khi đến từ `SC-11` |
| 6 | Tổng giá tham khảo | `ro` | — | Cộng các hạng mục, ghi rõ là tạm tính |

**Hành động**

| Nút | Điều kiện | Kết quả |
| --- | --- | --- |
| Tiếp theo | Đã chọn ≥ 1 hạng mục và 1 cửa hàng | → `SC-13` |
| Quay lại | Luôn | Về trang trước |

**Quy tắc & kiểm tra**

| # | Quy tắc |
| --- | --- |
| 1 | Được chọn đồng thời cả bảo dưỡng và sửa chữa trong một lần đặt — `BR-02` |
| 2 | Đổi cửa hàng làm bỏ chọn những hạng mục cửa hàng đó không cung cấp, kèm cảnh báo — `FR-SVC-07` |
| 3 | Giá hiển thị là tham khảo; giá cuối cùng theo báo giá |
| 4 | Lựa chọn được lưu nháp để không mất khi tải lại — `NFR-UX-11` |

**Thông báo.** Chưa chọn hạng mục → *"Vui lòng chọn ít nhất một dịch vụ."* · Chưa chọn cửa hàng → *"Vui lòng chọn cửa hàng bạn muốn đến."* · Hạng mục bị bỏ do đổi cửa hàng → *"Cửa hàng này không cung cấp: [tên hạng mục]. Mục đó đã được bỏ chọn."*

---

### `SC-13` — Đặt lịch, Bước 2: Chọn ngày & khung giờ

| | |
| --- | --- |
| **Loại · Thiết bị** | `W` · PC+SP |
| **Đường dẫn** | `/booking/step2` |
| **Vai trò** | `R-GUEST` `R-USER` |
| **Yêu cầu** | `FR-BOOK-04` `FR-BOOK-05` `BR-03` `BR-07`…`BR-09` |
| **Đợt** | MVP |

**Thành phần.** `CP-11` bộ chọn ngày & khung giờ; tóm tắt lựa chọn bước 1 (`ro`); thời gian dự kiến hoàn thành (`ro`, tính theo tổng thời gian ước tính của các hạng mục).

**Hành động.** **Tiếp theo** (khi đã chọn khung giờ) → `SC-14`. **Quay lại** → `SC-12` giữ nguyên lựa chọn.

**Quy tắc & kiểm tra**

| # | Quy tắc |
| --- | --- |
| 1 | **Không giới hạn** khoảng thời gian đặt trước — lịch mở tới bao xa tùy ý — `BR-03` |
| 2 | Ngày nghỉ và ngoài giờ làm việc không chọn được — `BR-08` |
| 3 | Khung giờ đã đầy hiện **ĐÃ ĐẦY**, không chọn được — `BR-07` |
| 4 | Không chọn được thời điểm quá khứ — `BR-09` |
| 5 | Số chỗ còn lại được kiểm tra lại ở máy chủ khi gửi biểu mẫu, đề phòng có người đặt trước trong lúc thao tác |

**Thông báo.** Khung giờ vừa hết chỗ → *"Rất tiếc, khung giờ này vừa có người đặt. Vui lòng chọn khung giờ khác."* · Cửa hàng nghỉ cả ngày → *"Cửa hàng nghỉ ngày này. Vui lòng chọn ngày khác."*

---

### `SC-14` — Đặt lịch, Bước 3: Thông tin khách & xe

| | |
| --- | --- |
| **Loại · Thiết bị** | `W` · PC+SP |
| **Đường dẫn** | `/booking/step3` |
| **Vai trò** | `R-GUEST` `R-USER` |
| **Yêu cầu** | `FR-BOOK-01` `FR-BOOK-06`…`FR-BOOK-08` `DEC-07` |
| **Đợt** | MVP |

**Mục đích.** Thu thập **tối thiểu** thông tin cần thiết. Theo `DEC-07`, chỉ **họ tên** và **số điện thoại** là bắt buộc.

**Thành phần**

| # | Nhãn | Kiểu | Bắt buộc | Ràng buộc |
| --- | --- | :---: | :---: | --- |
| 1 | Họ tên | `text` | ✔ | 1–100 ký tự |
| 2 | Số điện thoại | `tel` | ✔ | Số di động hợp lệ, chuẩn hóa E.164 — `BR-50` |
| 3 | Email | `text` | — | Dùng để gửi nhắc bảo dưỡng nếu có — `FR-NOT-05` |
| 4 | Chọn xe đã lưu | `sel` | — | Chỉ hiện với `R-USER` — `FR-BOOK-08` |
| 5 | Thông tin xe | — | ✔¹ | `CP-13`; ẩn khi đã chọn xe đã lưu |
| 6 | Số km hiện tại | `num` | — | `FR-BOOK-06` |
| 7 | Mô tả tình trạng xe / yêu cầu | `area` | — | ≤ 1.000 ký tự; **điền sẵn** khi đến từ `SC-11` — `FR-BOOK-07` |
| 8 | Ảnh đính kèm | `file` | — | `CP-14`, tối đa 5 ảnh |
| 9 | Đồng ý điều khoản | `chk` | ✔ | Liên kết tới `SC-09` |
| 10 | Đăng nhập để lưu lịch sử | `btn` | — | Chỉ hiện với `R-GUEST`, không bắt buộc |

¹ Hãng, dòng, loại xe và loại nhiên liệu là bắt buộc; biển số và số khung tùy chọn.

**Hành động.** **Tiếp theo** → `SC-15`. **Quay lại** → `SC-13`. **Đăng nhập** → `SC-18`, sau khi đăng nhập quay lại đúng bước này và giữ nguyên dữ liệu.

**Quy tắc & kiểm tra**

| # | Quy tắc |
| --- | --- |
| 1 | **Không bắt buộc đăng nhập** — `BR-01` `DEC-06` |
| 2 | Số điện thoại đã có trong hệ thống thì gắn lịch hẹn vào khách hàng đó, không tạo trùng — `BR-50` |
| 3 | Một số điện thoại có tối đa 5 lịch hẹn đang hoạt động — `BR-10` |
| 4 | Loại nhiên liệu ảnh hưởng giá bảo dưỡng — `BR-34` |
| 5 | Biểu mẫu tự lưu nháp — `NFR-UX-11` |

**Thông báo**

| Tình huống | Nội dung |
| --- | --- |
| Thiếu họ tên | *"Vui lòng nhập họ tên."* |
| Số điện thoại sai định dạng | *"Số điện thoại chưa đúng. Ví dụ: 090-1234-5678."* |
| Vượt giới hạn lịch hẹn | *"Số điện thoại này đang có 5 lịch hẹn chưa hoàn tất. Vui lòng hủy bớt hoặc liên hệ cửa hàng."* |
| Chưa đồng ý điều khoản | *"Vui lòng đồng ý với điều khoản sử dụng trước khi tiếp tục."* |

---

### `SC-15` — Đặt lịch: Xác nhận

| | |
| --- | --- |
| **Loại · Thiết bị** | `W` · PC+SP · **Đường dẫn** `/booking/confirm` · **Yêu cầu** `FR-BOOK-09` · **Đợt** MVP |

**Thành phần.** Bảng tóm tắt chỉ đọc gồm: dịch vụ đã chọn · cửa hàng · ngày giờ · họ tên · số điện thoại · thông tin xe · mô tả · ảnh đính kèm · tổng giá tham khảo. Mỗi khối có liên kết **Sửa** quay về đúng bước tương ứng.

**Hành động.** **Xác nhận đặt lịch** (hành động chính) → gửi lên máy chủ → `SC-16`. **Sửa** → về bước tương ứng, giữ nguyên dữ liệu.

**Quy tắc & kiểm tra.** Máy chủ kiểm tra lại số chỗ khung giờ (`BR-07`) và giới hạn 5 lịch hẹn (`BR-10`) ngay trước khi ghi. Nút xác nhận bị khóa sau lần bấm đầu để tránh đặt trùng.

**Thông báo.** Khung giờ vừa hết chỗ → *"Khung giờ này vừa có người đặt. Vui lòng chọn lại thời gian."* kèm nút quay về `SC-13`.

---

### `SC-16` — Đặt lịch: Hoàn tất

| | |
| --- | --- |
| **Loại · Thiết bị** | `W` · PC+SP · **Đường dẫn** `/booking/done` · **Yêu cầu** `FR-BOOK-10` `FR-BOOK-11` `DEC-11` · **Đợt** MVP |

**Bố cục**

```
┌───────────────────────────────────────────────┐
│              ✅  Đặt lịch thành công           │
│                                               │
│         Mã lịch hẹn:   B-20261008-0421        │
│                                               │
│  📅 08/10/2026 (Thứ 5)  09:00 – 10:00         │
│  📍 AOYAMA Hamamatsu                          │
│  🔧 Thay dầu máy, Kiểm tra phanh              │
│                                               │
│  Chúng tôi đã gửi tin nhắn xác nhận tới       │
│  090-****-5678                                │
│                                               │
│  Cửa hàng sẽ xác nhận và gửi mã QR cho bạn.   │
│                                               │
│  [ Xem chi tiết lịch hẹn ]  [ Về trang chủ ]  │
└───────────────────────────────────────────────┘
```

**Quy tắc & kiểm tra**

| # | Quy tắc |
| --- | --- |
| 1 | Mã lịch hẹn hiển thị cỡ lớn, sao chép được |
| 2 | SMS xác nhận gửi ngay — `BR-45` `FR-NOT-01` |
| 3 | Số điện thoại hiển thị dạng che bớt |
| 4 | Nêu rõ rằng **mã QR sẽ có sau khi cửa hàng xác nhận** — `BR-14` |
| 5 | Với `R-GUEST`, nhắc ghi lại mã lịch hẹn để tra cứu sau — `FR-BOOK-15` |
| 6 | Tải lại trang không tạo lịch hẹn mới |

---

### `SC-17` — Đăng ký

| | |
| --- | --- |
| **Loại · Thiết bị** | `F` · PC+SP · **Đường dẫn** `/register` · **Yêu cầu** `FR-AUTH-01` `DEC-05` · **Đợt** MVP |

**Thành phần.** Họ tên (`text`, bắt buộc) · Số điện thoại (`tel`, bắt buộc, là định danh chính) · Email (`text`, tùy chọn) · Ngôn ngữ ưa dùng (`sel`, mặc định theo ngôn ngữ đang chọn) · Đồng ý điều khoản (`chk`, bắt buộc).

**Hành động.** **Đăng ký** → gửi OTP → `SC-19`. **Đã có tài khoản?** → `SC-18`.

**Quy tắc & kiểm tra.** Không có trường mật khẩu — đăng nhập bằng số điện thoại và OTP (`DEC-05`). Số điện thoại đã đăng ký → chuyển sang luồng đăng nhập thay vì báo lỗi. Giới hạn tần suất gửi OTP theo số điện thoại và địa chỉ IP (`NFR-SE-04`).

**Thông báo.** Số đã đăng ký → *"Số điện thoại này đã có tài khoản. Chúng tôi sẽ gửi mã đăng nhập."* (tự chuyển sang `SC-19`).

---

### `SC-18` — Đăng nhập

| | |
| --- | --- |
| **Loại · Thiết bị** | `F` · PC+SP · **Đường dẫn** `/login` · **Yêu cầu** `FR-AUTH-02` `FR-AUTH-03` · **Đợt** MVP |

**Thành phần.** Số điện thoại (`tel`, bắt buộc) · nút **Gửi mã đăng nhập** · liên kết **Chưa có tài khoản? Đăng ký**.

**Quy tắc & kiểm tra.** Chỉ đăng nhập bằng số điện thoại (`DEC-05`). Không tiết lộ số đó có tồn tại hay không — luôn hiện màn nhập OTP. Giới hạn tần suất (`NFR-SE-04`).

---

### `SC-19` — Nhập mã OTP

| | |
| --- | --- |
| **Loại · Thiết bị** | `F` · PC+SP · **Đường dẫn** `/verify-otp` · **Yêu cầu** `FR-AUTH-03` `FR-AUTH-04` · **Đợt** MVP |

**Thành phần.** 6 ô nhập một chữ số, tự nhảy ô và dán được cả mã; dòng hiển thị số điện thoại đã che bớt; đồng hồ đếm ngược tới khi được gửi lại; nút **Gửi lại mã** (khóa 60 giây); liên kết **Đổi số điện thoại**.

**Quy tắc & kiểm tra.** Mã có hiệu lực 5 phút; tối đa 5 lần nhập sai; gửi lại sau 60 giây (`FR-AUTH-04`). Sau 5 lần sai, khóa gửi mã cho số đó trong 15 phút. Đăng nhập xong quay về đúng trang trước đó (kể cả đang giữa luồng đặt lịch).

**Thông báo.** Sai mã → *"Mã không đúng. Bạn còn {n} lần thử."* · Hết hạn → *"Mã đã hết hạn. Vui lòng bấm Gửi lại mã."* · Vượt số lần → *"Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút."*

---

### `SC-20` — Tra cứu lịch hẹn (Guest)

| | |
| --- | --- |
| **Loại · Thiết bị** | `F` · PC+SP · **Đường dẫn** `/booking/lookup` · **Yêu cầu** `FR-BOOK-15` · **Đợt** MVP |

**Mục đích.** Cho khách chưa đăng nhập xem, đổi và hủy lịch hẹn của chính mình.

**Thành phần.** Mã lịch hẹn (`text`, bắt buộc, dạng `B-YYYYMMDD-nnnn`) · Số điện thoại (`tel`, bắt buộc) · nút **Tra cứu**.

**Quy tắc & kiểm tra.** Phải khớp **cả hai** giá trị. Sai quá 5 lần trong 15 phút thì chặn theo địa chỉ IP (`NFR-SE-04`). Thông báo lỗi **không** tiết lộ giá trị nào sai.

**Thông báo.** Không tìm thấy → *"Không tìm thấy lịch hẹn khớp với thông tin đã nhập. Vui lòng kiểm tra lại mã lịch hẹn và số điện thoại."*

---

### `SC-21` — Lịch hẹn của tôi

| | |
| --- | --- |
| **Loại · Thiết bị** | `L` · PC+SP · **Đường dẫn** `/account/bookings` · **Vai trò** `R-USER` · **Yêu cầu** `FR-BOOK-16` · **Đợt** MVP |

**Thành phần.** Hai tab **Sắp tới** / **Đã qua**; danh sách thẻ lịch hẹn gồm mã · ngày giờ · cửa hàng · dịch vụ · xe · `CP-10` nhãn trạng thái; nút hành động nhanh trên từng thẻ.

**Hành động.** Bấm thẻ → `SC-22`. **Đổi lịch** → `SC-23` (chỉ khi trạng thái là *Chờ xác nhận* hoặc *Đã xác nhận*, `BR-06`). **Hủy** → `SC-24` (cùng điều kiện). **Đặt lại** → `SC-25` (chỉ lịch hẹn bảo dưỡng đã hoàn tất, `BR-11`).

**Quy tắc.** Tab *Sắp tới* sắp xếp tăng dần theo thời gian hẹn; tab *Đã qua* giảm dần. Trạng thái rỗng dùng `CP-26` kèm nút **Đặt lịch**.

---

### `SC-22` — Chi tiết lịch hẹn & mã QR

| | |
| --- | --- |
| **Loại · Thiết bị** | `D` · PC+SP |
| **Đường dẫn** | `/bookings/:code` |
| **Vai trò** | `R-GUEST`¹ `R-USER` |
| **Yêu cầu** | `FR-QR-02` `FR-QR-03` `BR-16` |
| **Đợt** | MVP |

¹ Truy cập sau khi tra cứu ở `SC-20`, hoặc qua đường dẫn trong SMS.

**Bố cục**

```
┌───────────────────────────────────────────────┐
│  Mã lịch hẹn  B-20261008-0421   [✔ Đã xác nhận]│
├───────────────────────────────────────────────┤
│        ┌───────────────────┐                  │
│        │                   │                  │
│        │    ▪▪  MÃ QR  ▪▪  │   ← CP-17        │
│        │                   │                  │
│        └───────────────────┘                  │
│         B-20261008-0421                       │
│   Đưa mã này cho lễ tân khi đến cửa hàng      │
├───────────────────────────────────────────────┤
│  📅 08/10/2026 (Thứ 5) 09:00–10:00            │
│  📍 AOYAMA Hamamatsu · 053-xxx-xxxx           │
│  🔧 Thay dầu máy · Kiểm tra phanh             │
│  🏍 Honda Lead 125 · 34A1-234.56 · 18.400 km  │
│  📝 "Xe kêu lạ khi phanh gấp"                 │
├───────────────────────────────────────────────┤
│  [ Đổi lịch ]  [ Hủy lịch ]  [ Xem tiến độ ]  │
└───────────────────────────────────────────────┘
```

**Thành phần**

| # | Thành phần | Kiểu | Điều kiện hiện |
| --- | --- | :---: | --- |
| 1 | Mã lịch hẹn + nhãn trạng thái | `ro` | Luôn |
| 2 | Mã QR (`CP-17`) | `ro` | Chỉ khi trạng thái *Đã xác nhận* — `BR-14` |
| 3 | Thông tin thời gian, cửa hàng, dịch vụ, xe | `ro` | Luôn |
| 4 | Mô tả tình trạng xe và ảnh đính kèm | `ro` | Khi có |
| 5 | Kết quả chẩn đoán AI | `ro` | Khi lịch hẹn đến từ `SC-11` |
| 6 | Chỉ đường tới cửa hàng | `btn` | Luôn |
| 7 | Liên kết tới báo giá | `btn` | Khi đã có báo giá gửi cho khách |
| 8 | Thanh tiến độ (`CP-19`) | `ro` | Khi đã tiếp nhận xe |

**Hành động**

| Nút | Điều kiện hiện | Kết quả |
| --- | --- | --- |
| Đổi lịch | Trạng thái *Chờ xác nhận* hoặc *Đã xác nhận* — `BR-06` | → `SC-23` |
| Hủy lịch | Cùng điều kiện | → `SC-24` |
| Xem tiến độ | Đã tiếp nhận | → `SC-26` |
| Tải ảnh mã QR | Có mã QR hiệu lực | Lưu ảnh về máy |

**Quy tắc & kiểm tra**

| # | Quy tắc |
| --- | --- |
| 1 | Mã QR **chỉ** xuất hiện sau khi Admin xác nhận — `BR-14` `DEC-19` |
| 2 | Mã QR mất hiệu lực khi đã tiếp nhận, đã hủy, hoặc quá giờ hẹn 24 giờ — `BR-16` |
| 3 | Khi mã hết hiệu lực, thay khu vực QR bằng dòng giải thích lý do |
| 4 | `R-GUEST` chỉ vào được bằng mã lịch hẹn + số điện thoại, hoặc qua đường dẫn có mã bảo mật trong SMS |

**Thông báo.** Mã QR đã dùng → *"Xe của bạn đã được tiếp nhận. Mã QR không còn cần thiết."* · Lịch hẹn đã hủy → *"Lịch hẹn này đã bị hủy ngày {ngày}."* · Chờ xác nhận → *"Cửa hàng đang xác nhận lịch hẹn. Mã QR sẽ hiện tại đây ngay sau khi được xác nhận."*

---

### `SC-23` — Đổi lịch hẹn

| | |
| --- | --- |
| **Loại · Thiết bị** | `F` · PC+SP · **Đường dẫn** `/bookings/:code/reschedule` · **Yêu cầu** `FR-BOOK-14` `BR-05` `BR-06` `DEC-14` · **Đợt** MVP |

**Thành phần.** Thông tin lịch hẹn hiện tại (`ro`); `CP-11` chọn ngày & khung giờ mới; ô lý do đổi lịch (`area`, tùy chọn); dòng ghi rõ **"Đổi lịch không mất phí và không giới hạn thời gian."**

**Hành động.** **Xác nhận đổi lịch** → qua `CP-08` → cập nhật và gửi thông báo cho khách. **Quay lại** → `SC-22`.

**Quy tắc & kiểm tra**

| # | Quy tắc |
| --- | --- |
| 1 | **Không giới hạn** thời gian đổi lịch, **không** phí phạt — `BR-05` `DEC-14` |
| 2 | Chỉ đổi được khi trạng thái là *Chờ xác nhận* hoặc *Đã xác nhận* — `BR-06` |
| 3 | Trạng thái lịch hẹn **không đổi** sau khi đổi lịch; chỉ cập nhật thời gian và ghi nhật ký |
| 4 | Mã QR đã sinh vẫn giữ nguyên hiệu lực với thời gian mới — `BR-15` |
| 5 | Khung giờ mới phải còn chỗ — `BR-07` |

**Thông báo.** Thành công → *"Đã đổi lịch sang {ngày giờ mới}. Chúng tôi đã gửi tin nhắn xác nhận."* · Không đổi được → *"Lịch hẹn ở trạng thái {trạng thái} nên không đổi được. Vui lòng liên hệ cửa hàng."*

---

### `SC-24` — Hủy lịch hẹn

| | |
| --- | --- |
| **Loại · Thiết bị** | `F` · PC+SP · **Đường dẫn** `/bookings/:code/cancel` · **Yêu cầu** `FR-BOOK-13` `BR-04` `BR-06` `DEC-13` · **Đợt** MVP |

**Thành phần.** Thông tin lịch hẹn (`ro`); lý do hủy (`sel`, tùy chọn: Bận việc · Đã sửa nơi khác · Đổi ý · Khác); ghi chú (`area`, tùy chọn); dòng ghi rõ **"Hủy lịch không mất phí và không giới hạn thời gian."**

**Hành động.** **Xác nhận hủy** → `CP-08` với nội dung *"Hủy lịch hẹn này? Thao tác không hoàn tác được."* → chuyển trạng thái sang *Đã hủy*, vô hiệu mã QR, gửi thông báo. **Giữ lịch hẹn** → `SC-22`.

**Quy tắc & kiểm tra.** Không giới hạn thời gian, không phí phạt (`BR-04`). Chỉ hủy được ở trạng thái *Chờ xác nhận* hoặc *Đã xác nhận* (`BR-06`). Hủy xong mã QR mất hiệu lực (`BR-16`) và không gửi thêm thông báo nào cho lịch hẹn đó (`BR-48`).

**Thông báo.** Thành công → *"Đã hủy lịch hẹn. Bạn có thể đặt lịch mới bất cứ lúc nào."* + nút **Đặt lịch mới**.

---

### `SC-25` — Đặt lại lịch bảo dưỡng

| | |
| --- | --- |
| **Loại · Thiết bị** | `F` · PC+SP · **Đường dẫn** `/bookings/:code/rebook` · **Vai trò** `R-USER` · **Yêu cầu** `FR-BOOK-17` `FR-BOOK-18` `BR-11` `DEC-15` · **Đợt** G2 |

**Mục đích.** Với lịch hẹn **bảo dưỡng**, tạo nhanh lịch hẹn tiếp theo theo chu kỳ mà không phải nhập lại từ đầu.

**Thành phần**

| # | Thành phần | Kiểu | Mô tả |
| --- | --- | :---: | --- |
| 1 | Tóm tắt lần bảo dưỡng trước | `ro` | Ngày, dịch vụ, cửa hàng, số km |
| 2 | Thời điểm đề xuất | `ro` | `CP-16` — do `AI-05` tính từ lịch sử và chu kỳ — `FR-BOOK-18` |
| 3 | Chu kỳ lặp | `sel` | 3 tháng · 6 tháng · 12 tháng · Tùy chọn |
| 4 | Ngày & khung giờ | — | `CP-11`, điền sẵn theo đề xuất |
| 5 | Dịch vụ | `chk` | Điền sẵn theo lần trước, sửa được |
| 6 | Cửa hàng | `radio` | Điền sẵn theo lần trước |
| 7 | Nhắc tự động | `chk` | Bật nhận nhắc trước kỳ bảo dưỡng tiếp theo — `FR-NOT-05` |

**Quy tắc & kiểm tra.** Chỉ áp dụng cho lịch hẹn có dịch vụ thuộc nhóm **Bảo dưỡng** (`BR-11` `DEC-15`). Thời điểm đề xuất mang nhãn "Gợi ý bởi AI" và sửa được. Tạo ra một lịch hẹn mới độc lập ở trạng thái *Chờ xác nhận*.

---

### `SC-26` — Theo dõi tiến độ sửa chữa

| | |
| --- | --- |
| **Loại · Thiết bị** | `X` · PC+SP · **Đường dẫn** `/bookings/:code/progress` · **Yêu cầu** `FR-WO-09` `FR-WO-10` · **Đợt** G2 |

**Bố cục**

```
┌───────────────────────────────────────────────┐
│  Xe của bạn đang được xử lý                   │
│  Honda Lead 125 · 34A1-234.56                 │
├───────────────────────────────────────────────┤
│  ● Tiếp nhận      10:15 ✔                     │
│  ● Chẩn đoán      10:40 ✔                     │
│  ● Chờ bạn duyệt báo giá  11:05  ← hiện tại   │
│  ○ Đang thực hiện                             │
│  ○ Hoàn tất                                   │
├───────────────────────────────────────────────┤
│  ⚠ Cần bạn xác nhận báo giá ¥12,500           │
│              [ Xem báo giá ]                  │
├───────────────────────────────────────────────┤
│  Dự kiến xong: 08/10/2026 15:00               │
│  Liên hệ cửa hàng: 053-xxx-xxxx               │
└───────────────────────────────────────────────┘
```

**Thành phần.** `CP-19` thanh tiến độ với thời điểm từng mốc; khối cảnh báo khi cần khách hành động; thời gian hoàn thành dự kiến; thông tin liên hệ cửa hàng; danh sách hạng mục đang thực hiện (`ro`).

**Quy tắc & kiểm tra.** Chỉ hiện khi lịch hẹn đã ở trạng thái *Đã tiếp nhận* trở đi. Trạng thái cập nhật qua WebSocket; khi mất kết nối thì tự tải lại mỗi 30 giây. **Không** hiển thị ghi chú nội bộ của Admin (`FR-BOOK-26`). Khi phiếu hoàn tất, hiện thông điệp *"Xe đã sẵn sàng. Vui lòng đến nhận."*

---

### `SC-27` — Xem báo giá

| | |
| --- | --- |
| **Loại · Thiết bị** | `D` · PC+SP · **Đường dẫn** `/quotations/:token` · **Yêu cầu** `FR-QUO-07` `NFR-SE-08` · **Đợt** G2 |

**Thành phần**

| # | Thành phần | Kiểu | Mô tả |
| --- | --- | :---: | --- |
| 1 | Tiêu đề và mã báo giá | `ro` | Kèm số phiên bản — `FR-QUO-11` |
| 2 | Thông tin xe và cửa hàng | `ro` | |
| 3 | Chẩn đoán của kỹ thuật viên | `ro` | Triệu chứng và nguyên nhân — `FR-WO-04` |
| 4 | Bảng hạng mục công việc | `tbl` | Tên · mô tả · thời gian · đơn giá |
| 5 | Bảng phụ tùng | `tbl` | Tên · mã · số lượng · đơn giá · thành tiền |
| 6 | Bảng dòng tiền | `ro` | `CP-21` — tiền công, tiền phụ tùng, thuế, tổng cộng |
| 7 | Hiệu lực báo giá | `ro` | Ngày hết hiệu lực |
| 8 | Nút **Đồng ý** / **Từ chối** | `btn` | → `SC-28` |
| 9 | Nút **Tải PDF** | `btn` | `FR-QUO-12` |

**Quy tắc & kiểm tra.** Truy cập bằng mã bảo mật ngẫu nhiên trong đường dẫn, không cần đăng nhập (`NFR-SE-08`). Chỉ hiện phiên bản đang ở trạng thái *Đã gửi* (`BR-31`). Báo giá đã được phản hồi thì ẩn nút hành động và hiện kết quả đã chọn.

**Thông báo.** Đường dẫn không hợp lệ → `SY-02`. Báo giá đã bị thay thế → *"Báo giá này đã được cập nhật. Vui lòng mở đường dẫn mới nhất trong tin nhắn."*

---

### `SC-28` — Phản hồi báo giá

| | |
| --- | --- |
| **Loại · Thiết bị** | `F` · PC+SP · **Đường dẫn** `/quotations/:token/respond` · **Yêu cầu** `FR-QUO-08` `FR-QUO-09` `BR-32` `BR-33` · **Đợt** G2 |

**Thành phần.** Lựa chọn **Đồng ý toàn bộ** / **Từ chối** (`radio`, bắt buộc); ô lý do (`area`, bắt buộc khi từ chối); tóm tắt tổng tiền (`ro`); ô xác nhận đã đọc (`chk`, bắt buộc).

**Hành động.** **Gửi phản hồi** → `CP-08` → ghi nhận và thông báo cho cửa hàng.

**Quy tắc & kiểm tra.** Đồng ý → phiếu dịch vụ chuyển sang *Đang thực hiện* (`FR-QUO-09` `BR-33`). Từ chối → phiếu giữ nguyên trạng thái chờ để Admin xử lý tiếp (`BR-32`). Một báo giá chỉ phản hồi được một lần.

**Thông báo.** Đồng ý → *"Cảm ơn bạn. Cửa hàng sẽ bắt đầu thực hiện."* · Từ chối → *"Đã ghi nhận. Cửa hàng sẽ liên hệ lại với bạn."* · Đã phản hồi rồi → *"Báo giá này đã được phản hồi ngày {ngày}."*

---

### `SC-29` — Xe của tôi

| | |
| --- | --- |
| **Loại · Thiết bị** | `L` · PC+SP · **Đường dẫn** `/account/vehicles` · **Vai trò** `R-USER` · **Yêu cầu** `FR-VEH-01` `FR-VEH-07` · **Đợt** MVP |

**Thành phần.** Danh sách thẻ xe gồm: hãng và dòng xe · biển số · số km gần nhất · ngày bảo dưỡng gần nhất · **thời điểm bảo dưỡng tiếp theo đề xuất** (`FR-VEH-07`); nút **Thêm xe**.

**Hành động.** Bấm thẻ → `SC-31`. **Sửa** → `SC-30`. **Xóa** → `CP-08`. **Đặt lịch cho xe này** → `SC-12` với xe chọn sẵn.

**Quy tắc.** Xe đã có phiếu dịch vụ thì không xóa hẳn mà chỉ ẩn khỏi danh sách, để giữ lịch sử. Thẻ xe đến hạn bảo dưỡng có nhãn cảnh báo kèm chữ, không chỉ màu (`NFR-UX-09`).

---

### `SC-30` — Thêm / sửa xe

| | |
| --- | --- |
| **Loại · Thiết bị** | `F` · PC+SP · **Đường dẫn** `/account/vehicles/:id/edit` · **Vai trò** `R-USER` · **Yêu cầu** `FR-VEH-01` `FR-VEH-02` `FR-VEH-03` · **Đợt** MVP |

**Thành phần.** `CP-13` biểu mẫu thông tin xe; ảnh xe (`file`, tùy chọn); tên gợi nhớ (`text`, tùy chọn, ví dụ "Xe đi làm").

**Quy tắc & kiểm tra.** Biển số là duy nhất toàn hệ thống (`FR-VEH-03`). Khi trùng, không tạo được và hướng dẫn khách liên hệ cửa hàng. Số km mới không được nhỏ hơn số km đã ghi trong phiếu dịch vụ gần nhất, trừ khi khách xác nhận đã thay đồng hồ.

**Thông báo.** Biển số trùng → *"Biển số này đã được đăng ký. Vui lòng kiểm tra lại hoặc liên hệ cửa hàng."* · Số km giảm → *"Số km nhỏ hơn lần ghi nhận trước ({n} km). Bạn có chắc không?"*

---

### `SC-31` — Lịch sử dịch vụ của xe

| | |
| --- | --- |
| **Loại · Thiết bị** | `L` · PC+SP · **Đường dẫn** `/account/vehicles/:id/history` · **Vai trò** `R-USER` · **Yêu cầu** `FR-VEH-04` `FR-VEH-05` · **Đợt** MVP |

**Bố cục**

```
Honda Lead 125 · 34A1-234.56 · 18.400 km
Bảo dưỡng tiếp theo đề xuất: 04/2027 hoặc 21.400 km
─────────────────────────────────────────────
● 08/10/2026 · AOYAMA Hamamatsu · Bảo dưỡng
  Thay dầu máy, thay lọc gió · 18.400 km
  Tổng: ¥8,200 · ✅ Đã thanh toán        [Chi tiết]
─────────────────────────────────────────────
● 12/04/2026 · AOYAMA Hamamatsu · Sửa chữa
  Thay má phanh trước · 15.100 km
  Tổng: ¥5,600 · ✅ Đã thanh toán        [Chi tiết]
```

**Thành phần.** Tiêu đề thông tin xe và thời điểm bảo dưỡng tiếp theo; dòng thời gian các lần dịch vụ, mỗi mục có ngày · cửa hàng · loại dịch vụ · hạng mục · phụ tùng đã thay · số km · tổng tiền · trạng thái thanh toán.

**Hành động.** **Chi tiết** → `SC-32`. **Lọc theo loại dịch vụ** (Tất cả / Bảo dưỡng / Sửa chữa). **Đặt lịch cho xe này** → `SC-12`.

**Quy tắc.** Chỉ hiện phiếu ở trạng thái *Hoàn tất* hoặc *Đã bàn giao* (`FR-WO-12`). Sắp xếp giảm dần theo ngày.

---

### `SC-32` — Chi tiết phiếu dịch vụ (khách)

| | |
| --- | --- |
| **Loại · Thiết bị** | `D` · PC+SP · **Đường dẫn** `/service-records/:id` · **Vai trò** `R-USER` · **Yêu cầu** `FR-VEH-06` `FR-PAY-06` · **Đợt** MVP |

**Thành phần.** Mã phiếu · ngày · cửa hàng · xe · số km; chẩn đoán của kỹ thuật viên; bảng hạng mục công việc; bảng phụ tùng đã thay; `CP-21` bảng dòng tiền; trạng thái thanh toán và hình thức (`FR-PAY-06`); ảnh hiện trạng khi tiếp nhận; nút **Tải PDF** (`FR-VEH-06`).

**Quy tắc.** Chỉ chủ sở hữu xe xem được; kiểm tra quyền ở máy chủ (`NFR-SE-05`). **Không** hiện ghi chú nội bộ và giá nhập phụ tùng.

---

### `SC-33` — Hồ sơ cá nhân

| | |
| --- | --- |
| **Loại · Thiết bị** | `F` · PC+SP · **Đường dẫn** `/account/profile` · **Vai trò** `R-USER` · **Yêu cầu** `FR-AUTH-06` `FR-AUTH-07` `FR-AUTH-12` · **Đợt** MVP |

**Thành phần.** Họ tên (`text`, bắt buộc) · Số điện thoại (`ro` + nút **Đổi số**) · Email (`text`, tùy chọn) · Địa chỉ (`text`, tùy chọn) · Ngôn ngữ ưa dùng (`sel`); nút **Đăng xuất**; liên kết **Yêu cầu xóa tài khoản** (`FR-AUTH-12`, G2).

**Quy tắc & kiểm tra.** Đổi số điện thoại phải xác thực OTP trên số mới trước khi có hiệu lực (`FR-AUTH-07`) — số cũ vẫn dùng được cho tới khi xác thực xong. Số mới không được trùng tài khoản khác. Xóa tài khoản làm ẩn danh dữ liệu cá nhân nhưng giữ lịch sử dịch vụ (`FR-AUTH-12`).

**Thông báo.** Số mới đã tồn tại → *"Số điện thoại này đã thuộc về tài khoản khác."* · Xác nhận xóa tài khoản → *"Xóa tài khoản sẽ gỡ thông tin cá nhân của bạn. Lịch sử dịch vụ của xe vẫn được cửa hàng lưu giữ. Thao tác không hoàn tác được."*

---

### `SC-34` — Cài đặt thông báo & ngôn ngữ

| | |
| --- | --- |
| **Loại · Thiết bị** | `F` · PC+SP · **Đường dẫn** `/account/settings` · **Vai trò** `R-USER` · **Yêu cầu** `FR-I18N-03` `FR-NOT-14` · **Đợt** MVP |

**Thành phần**

| # | Nhãn | Kiểu | Mô tả |
| --- | --- | :---: | --- |
| 1 | Ngôn ngữ giao diện và thông báo | `sel` | EN / VI / JA — `FR-I18N-03` |
| 2 | Nhận SMS xác nhận lịch hẹn | `chk` | **Không tắt được** — thuộc nghiệp vụ bắt buộc |
| 3 | Nhận SMS nhắc trước 12 tiếng | `chk` | Bật mặc định |
| 4 | Nhận nhắc bảo dưỡng định kỳ | `chk` | Bật mặc định — `FR-NOT-14` |
| 5 | Kênh nhận nhắc bảo dưỡng | `chk` | SMS và/hoặc Email; email chỉ chọn được khi đã nhập email |

**Quy tắc.** Thông báo bắt buộc (xác nhận đặt lịch, hủy, đổi lịch) không tắt được và hiện rõ lý do. Đổi ngôn ngữ áp dụng ngay cho giao diện và cho thông báo gửi sau đó (`FR-NOT-11`).

---

## E. Trang quản trị

### `SA-01` — Đăng nhập quản trị

| | |
| --- | --- |
| **Loại · Thiết bị** | `F` · PC+SP · **Đường dẫn** `/admin/login` · **Yêu cầu** `FR-AUTH-09` `FR-AUTH-10` `FR-AUTH-11` · **Đợt** MVP |

**Thành phần.** Tên đăng nhập hoặc email (`text`, bắt buộc) · Mật khẩu (`text`, bắt buộc, có nút hiện/ẩn) · Ghi nhớ đăng nhập (`chk`) · nút **Đăng nhập** · liên kết **Quên mật khẩu**.

**Quy tắc & kiểm tra.** Mật khẩu tối thiểu 8 ký tự có chữ và số (`FR-AUTH-10`). Khóa tài khoản 15 phút sau 5 lần sai liên tiếp (`FR-AUTH-11`). Thông báo lỗi **không** phân biệt sai tên đăng nhập hay sai mật khẩu. Đăng nhập thành công → `SA-02`.

**Thông báo.** Sai thông tin → *"Tên đăng nhập hoặc mật khẩu không đúng."* · Bị khóa → *"Tài khoản tạm khóa do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút."*

---

### `SA-02` — Bảng điều khiển

| | |
| --- | --- |
| **Loại · Thiết bị** | `X` · PC · **Đường dẫn** `/admin` · **Yêu cầu** `FR-RPT-11` · **Đợt** MVP |

**Bố cục**

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Lịch hẹn     │ Xe đang ở    │ Chờ thanh    │ Cảnh báo     │
│ hôm nay      │ xưởng        │ toán         │ tồn kho      │
│     12       │      5       │      3       │      7       │
│ +2 so hôm qua│              │  ¥42,300     │  mặt hàng    │
└──────────────┴──────────────┴──────────────┴──────────────┘
┌───────────────────────────────┬──────────────────────────┐
│ Lịch hẹn hôm nay              │ Cần xử lý                │
│ 09:00 Nguyễn A · Bảo dưỡng ⏳ │ · 3 lịch chờ xác nhận    │
│ 10:00 Trần B   · Sửa chữa  ✔ │ · 2 báo giá chờ khách    │
│ 11:00 Lê C     · Cả hai    ✔ │ · 1 thông báo gửi lỗi    │
└───────────────────────────────┴──────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ Doanh thu 7 ngày gần nhất (biểu đồ cột)                  │
└──────────────────────────────────────────────────────────┘
```

**Thành phần**

| # | Khối | Kiểu | Nội dung |
| --- | --- | :---: | --- |
| 1 | Thẻ chỉ số | `ro` | `CP-22` — lịch hẹn hôm nay · xe đang ở xưởng · phiếu chờ thanh toán · cảnh báo tồn kho |
| 2 | Lịch hẹn hôm nay | `tbl` | Giờ · khách · dịch vụ · `CP-10` trạng thái |
| 3 | Danh sách cần xử lý | `ro` | Liên kết nhanh tới các màn hình tương ứng |
| 4 | Biểu đồ doanh thu 7 ngày | `ro` | Cột, kèm bảng số liệu cho người đọc bằng trình đọc màn hình |
| 5 | Nút tắt **Quét mã QR** | `btn` | → `SA-07`, luôn hiện nổi bật |

**Quy tắc.** Dữ liệu lọc theo cửa hàng đang chọn ở `CP-05`. Số liệu tính theo UTC+9. Bấm thẻ chỉ số mở màn hình danh sách tương ứng đã lọc sẵn.

---

### `SA-03` — Danh sách lịch hẹn

| | |
| --- | --- |
| **Loại · Thiết bị** | `L` · PC · **Đường dẫn** `/admin/bookings` · **Yêu cầu** `FR-BOOK-20` · **Đợt** MVP |

**Thành phần**

| # | Thành phần | Kiểu | Mô tả |
| --- | --- | :---: | --- |
| 1 | Thanh lọc `CP-07` | — | Cửa hàng · khoảng ngày · trạng thái · loại dịch vụ · từ khóa (tên, số điện thoại, mã lịch hẹn, biển số) |
| 2 | Bảng `CP-06` | `tbl` | Mã · ngày giờ · khách · số điện thoại · xe · dịch vụ · cửa hàng · `CP-10` trạng thái · nguồn (Web / AI / Admin) |
| 3 | Nút **Tạo lịch hẹn** | `btn` | → `SA-06` |
| 4 | Nút **Xem dạng lịch** | `btn` | → `SA-04` |
| 5 | Thao tác hàng loạt | `btn` | Xác nhận nhiều lịch hẹn cùng lúc |

**Hành động.** Bấm dòng → `SA-05`. **Xác nhận nhanh** trên dòng (chỉ với trạng thái *Chờ xác nhận*) → chuyển sang *Đã xác nhận*, sinh mã QR và gửi SMS.

**Quy tắc.** Mặc định lọc **từ hôm nay trở đi**, sắp xếp tăng dần theo giờ hẹn. Cột nguồn cho biết lịch hẹn đến từ chatbox AI hay không (`FR-AI-12`).

---

### `SA-04` — Lịch hẹn dạng lịch

| | |
| --- | --- |
| **Loại · Thiết bị** | `X` · PC · **Đường dẫn** `/admin/bookings/calendar` · **Yêu cầu** `FR-BOOK-21` `FR-STO-08` · **Đợt** MVP |

**Bố cục**

```
◀  Tuần 05/10 – 11/10/2026  ▶     [Ngày] [Tuần]   Cửa hàng ▾
┌───────┬───────┬───────┬───────┬───────┬───────┬───────┐
│  T2   │  T3   │  T4   │  T5   │  T6   │  T7   │  CN   │
├───────┼───────┼───────┼───────┼───────┼───────┼───────┤
│09:00  │       │       │ ██ 3/3│       │ ██ 2/3│ NGHỈ  │
│10:00  │ ██ 1/3│       │ ██ 2/3│       │       │ NGHỈ  │
│11:00  │       │ ██ 2/3│       │ ██ 1/3│       │ NGHỈ  │
└───────┴───────┴───────┴───────┴───────┴───────┴───────┘
```

**Thành phần.** Chuyển đổi **Ngày / Tuần**; điều hướng lùi/tới; bộ chọn cửa hàng; lưới khung giờ hiển thị số lượt đã đặt trên tổng năng lực (`FR-STO-08`); thẻ lịch hẹn có màu theo trạng thái **kèm biểu tượng**.

**Hành động.** Bấm thẻ → `SA-05`. Bấm ô trống → `SA-06` với ngày giờ điền sẵn. Kéo thả thẻ sang khung giờ khác → hộp thoại xác nhận đổi lịch (`FR-BOOK-24`).

**Quy tắc.** Ngày nghỉ hiện rõ nhãn **NGHỈ**. Khung giờ đầy đánh dấu riêng nhưng Admin vẫn đặt được kèm cảnh báo (`BR-12`).

---

### `SA-05` — Chi tiết lịch hẹn

| | |
| --- | --- |
| **Loại · Thiết bị** | `D` · PC |
| **Đường dẫn** | `/admin/bookings/:id` |
| **Yêu cầu** | `FR-BOOK-22`…`FR-BOOK-26` `FR-AI-12` `FR-QR-01` |
| **Đợt** | MVP |

**Thành phần**

| # | Khối | Kiểu | Mô tả |
| --- | --- | :---: | --- |
| 1 | Tiêu đề | `ro` | Mã lịch hẹn · `CP-10` trạng thái · nguồn |
| 2 | Thông tin khách | `ro` | Tên · số điện thoại · email · liên kết tới `SA-16` |
| 3 | Thông tin xe | `ro` | `CP-13` dạng chỉ đọc · liên kết tới `SA-20` |
| 4 | Dịch vụ đã đặt | `tbl` | Hạng mục · giá tham khảo |
| 5 | Thời gian & cửa hàng | `ro` | |
| 6 | Mô tả của khách | `ro` | Văn bản và ảnh đính kèm |
| 7 | **Kết quả chẩn đoán AI** | `ro` | `CP-16` — hội thoại, ảnh, ghi âm, lỗi nghi ngờ kèm % — `FR-AI-12` |
| 8 | Mã QR | `ro` | Hiện sau khi xác nhận — `FR-QR-01` |
| 9 | Ghi chú nội bộ | `area` | **Khách không nhìn thấy** — `FR-BOOK-26` |
| 10 | Lịch sử thay đổi | `tbl` | `CP-25` |

**Hành động**

| Nút | Điều kiện | Kết quả |
| --- | --- | --- |
| **Xác nhận** | Trạng thái *Chờ xác nhận* | → *Đã xác nhận*, sinh mã QR, gửi SMS — `FR-BOOK-22` `BR-14` |
| **Đổi lịch** | *Chờ xác nhận* / *Đã xác nhận* | Mở bộ chọn ngày giờ + ô lý do, gửi thông báo — `FR-BOOK-24` |
| **Hủy** | *Chờ xác nhận* / *Đã xác nhận* | `CP-08` + ô lý do bắt buộc, gửi thông báo — `FR-BOOK-23` |
| **Khách không đến** | *Đã xác nhận* và đã quá giờ hẹn | → *Khách không đến* — `FR-BOOK-25` |
| **Tiếp nhận xe** | *Đã xác nhận* | → `SA-08` |
| **Lưu ghi chú** | Luôn | Ghi nhật ký |

**Quy tắc & kiểm tra.** Mọi chuyển trạng thái tuân theo máy trạng thái `RD-2026-001` §5.1 và được ghi nhật ký kèm người thực hiện (`FR-WO-08` `FR-SYS-03`). Hủy và đổi lịch bắt buộc nhập lý do. Không gửi thông báo cho lịch hẹn đã hủy (`BR-48`).

**Thông báo.** Xác nhận thành công → *"Đã xác nhận. Mã QR đã được gửi tới khách qua SMS."* · Gửi SMS lỗi → *"Đã xác nhận nhưng gửi SMS thất bại. Hệ thống sẽ thử lại; bạn có thể gọi cho khách."*

---

### `SA-06` — Tạo lịch hẹn thay khách

| | |
| --- | --- |
| **Loại · Thiết bị** | `F` · PC+SP · **Đường dẫn** `/admin/bookings/new` · **Yêu cầu** `FR-BOOK-19` `BR-12` `DEC-10` · **Đợt** MVP |

**Thành phần**

| # | Nhãn | Kiểu | Bắt buộc | Ghi chú |
| --- | --- | :---: | :---: | --- |
| 1 | Tìm khách hàng có sẵn | `text` | — | Theo số điện thoại, tên hoặc biển số; chọn xong tự điền các trường |
| 2 | Họ tên | `text` | ✔ | |
| 3 | Số điện thoại | `tel` | ✔ | Tự nhận diện khách đã tồn tại — `BR-50` |
| 4 | Email | `text` | — | |
| 5 | Xe | — | ✔ | Chọn xe đã có hoặc nhập mới bằng `CP-13` |
| 6 | Cửa hàng | `sel` | ✔ | Mặc định theo cửa hàng đang chọn |
| 7 | Dịch vụ | `chk` | ✔ | Bảo dưỡng và/hoặc sửa chữa |
| 8 | Ngày & khung giờ | — | ✔ | `CP-11` ở chế độ quản trị |
| 9 | Mô tả tình trạng xe | `area` | — | |
| 10 | Xác nhận ngay | `chk` | — | Bật mặc định — bỏ qua bước chờ xác nhận, sinh mã QR luôn |
| 11 | Gửi SMS cho khách | `chk` | — | Bật mặc định |

**Quy tắc & kiểm tra.** Admin đặt được cả vào khung giờ đã đầy, nhưng phải qua cảnh báo (`BR-12`). Giới hạn 5 lịch hẹn đang hoạt động (`BR-10`) **không** áp dụng cho Admin. Khi bật *Xác nhận ngay*, lịch hẹn vào thẳng trạng thái *Đã xác nhận*.

**Thông báo.** Khung giờ đầy → *"Khung giờ này đã đủ {n}/{n} lượt. Vẫn tạo lịch hẹn?"* (`CP-08`). Trùng khách → *"Số điện thoại này đã có hồ sơ: {tên}. Dùng hồ sơ này?"*

---

### `SA-07` — Quét mã QR

| | |
| --- | --- |
| **Loại · Thiết bị** | `X` · **SP** · **Đường dẫn** `/admin/scan` · **Yêu cầu** `FR-QR-05` `FR-QR-08` `BR-17` · **Đợt** MVP |

**Mục đích.** Cho lễ tân quét mã QR của khách để nắm ngay tình hình xe, rút ngắn thời gian tiếp nhận (`DEC-21`).

**Bố cục**

```
┌───────────────────────────────┐
│  Quét mã QR               [✕] │
├───────────────────────────────┤
│  ┌───────────────────────┐    │
│  │                       │    │
│  │   ┌───────────────┐   │    │
│  │   │  khung ngắm   │   │    │
│  │   └───────────────┘   │    │
│  │                       │    │
│  └───────────────────────┘    │
│              [💡 Đèn]          │
├───────────────────────────────┤
│  Không quét được?             │
│  ┌───────────────────┐ ┌────┐ │
│  │ Nhập mã lịch hẹn  │ │ OK │ │
│  └───────────────────┘ └────┘ │
└───────────────────────────────┘
```

**Thành phần.** Khung camera (`CP-18`); nút bật/tắt đèn; ô nhập mã lịch hẹn dự phòng (`FR-QR-08`); danh sách 5 lần quét gần nhất.

**Quy tắc & kiểm tra**

| # | Quy tắc |
| --- | --- |
| 1 | Quét thành công → chuyển thẳng sang `SA-08` |
| 2 | Mã hết hiệu lực → hiện lý do cụ thể, **không** mở phiếu dịch vụ — `BR-17` |
| 3 | Chưa cấp quyền camera → hướng dẫn cấp quyền, ô nhập tay vẫn dùng được |
| 4 | Rung nhẹ và phát âm thanh ngắn khi quét thành công |
| 5 | Màn hình tối ưu cho điện thoại vì dùng tại quầy |

**Thông báo.** Đã tiếp nhận → *"Lịch hẹn này đã được tiếp nhận lúc {giờ}."* + nút mở phiếu · Đã hủy → *"Lịch hẹn đã bị hủy ngày {ngày}."* · Quá hạn → *"Lịch hẹn đã quá giờ hẹn hơn 24 giờ."* + nút tạo lịch hẹn mới · Không hợp lệ → *"Mã không hợp lệ. Vui lòng nhập mã lịch hẹn."*

---

### `SA-08` — Tiếp nhận xe

| | |
| --- | --- |
| **Loại · Thiết bị** | `F` · PC+SP |
| **Đường dẫn** | `/admin/intake/:bookingId` |
| **Yêu cầu** | `FR-QR-06` `FR-QR-07` `FR-WO-01` `FR-WO-03` |
| **Đợt** | MVP |

**Mục đích.** Hiển thị **ngay lập tức** toàn bộ thông tin lễ tân cần, để không phải hỏi lại khách (`DEC-21`), rồi mở phiếu dịch vụ bằng một thao tác.

**Bố cục**

```
┌──────────────────────────────────────────────────────┐
│ ✔ B-20261008-0421   ·   09:00 · AOYAMA Hamamatsu     │
├───────────────────────────┬──────────────────────────┤
│ KHÁCH HÀNG                │ XE                       │
│ Nguyễn Văn A              │ Honda Lead 125 · Xăng    │
│ 090-1234-5678             │ 34A1-234.56 · 18.400 km  │
│ Khách quen · 4 lần đến    │ Bảo dưỡng gần nhất 04/26 │
├───────────────────────────┴──────────────────────────┤
│ DỊCH VỤ ĐÃ ĐẶT                                       │
│ · Thay dầu máy      · Kiểm tra phanh                 │
├──────────────────────────────────────────────────────┤
│ MÔ TẢ CỦA KHÁCH                                      │
│ "Xe kêu lạ khi phanh gấp, phanh trước không ăn"      │
│ [ảnh 1] [ảnh 2]                                      │
├──────────────────────────────────────────────────────┤
│ ✨ CHẨN ĐOÁN AI                                       │
│ Mòn má phanh trước ────────── 82 %                   │
│ Đĩa phanh cong     ────       41 %                   │
├──────────────────────────────────────────────────────┤
│ GHI NHẬN HIỆN TRẠNG KHI TIẾP NHẬN                    │
│ Số km *  [ 18400 ]   Nhiên liệu  [ 1/2 ▾ ]           │
│ Ảnh hiện trạng * [📷 Chụp ảnh]                       │
│ Phụ kiện đi kèm  [ mũ bảo hiểm, cốp sau ]            │
│ Ghi chú          [____________________]              │
├──────────────────────────────────────────────────────┤
│                        [ TIẾP NHẬN XE ]              │
└──────────────────────────────────────────────────────┘
```

**Thành phần**

| # | Khối | Kiểu | Bắt buộc | Mô tả |
| --- | --- | :---: | :---: | --- |
| 1 | Thông tin khách | `ro` | — | Tên · điện thoại · số lần đến trước — `FR-QR-06` |
| 2 | Thông tin xe | `ro` | — | Kèm lần bảo dưỡng gần nhất |
| 3 | Dịch vụ đã đặt | `ro` | — | |
| 4 | Mô tả và ảnh của khách | `ro` | — | |
| 5 | Chẩn đoán AI | `ro` | — | `CP-16` — `FR-QR-06` |
| 6 | Số km khi tiếp nhận | `num` | ✔ | Cảnh báo nếu nhỏ hơn lần trước |
| 7 | Mức nhiên liệu | `sel` | — | Cạn · 1/4 · 1/2 · 3/4 · Đầy |
| 8 | Ảnh hiện trạng | `file` | ✔ | `CP-14` — tối thiểu 1 ảnh — `FR-WO-03` |
| 9 | Phụ kiện đi kèm | `text` | — | |
| 10 | Ghi chú tiếp nhận | `area` | — | |

**Hành động.** **Tiếp nhận xe** (hành động chính) → lịch hẹn chuyển sang *Đã tiếp nhận*, tạo phiếu dịch vụ, mã QR mất hiệu lực → `SA-10`. **Quay lại** → `SA-05`.

**Quy tắc & kiểm tra**

| # | Quy tắc |
| --- | --- |
| 1 | Một lịch hẹn chỉ mở **một** phiếu dịch vụ — `BR-18` |
| 2 | Số km và ảnh hiện trạng là bắt buộc — `FR-WO-03` |
| 3 | Sau khi tiếp nhận, mã QR hết hiệu lực — `BR-16` |
| 4 | Khách vãng lai không đặt trước: mở `SA-08` ở chế độ nhập tay, tạo khách và xe mới — `FR-VEH-11` |
| 5 | Số km ghi nhận ở đây cập nhật vào hồ sơ xe |

**Thông báo.** Thiếu ảnh → *"Vui lòng chụp ít nhất một ảnh hiện trạng xe."* · Số km giảm → *"Số km nhỏ hơn lần ghi nhận trước ({n} km). Kiểm tra lại hoặc ghi chú lý do."* · Đã có phiếu → *"Lịch hẹn này đã có phiếu dịch vụ {mã}."* + nút mở phiếu.

---

### `SA-09` — Danh sách phiếu dịch vụ

| | |
| --- | --- |
| **Loại · Thiết bị** | `L` · PC · **Đường dẫn** `/admin/work-orders` · **Yêu cầu** `FR-WO-07` `FR-PAY-07` · **Đợt** MVP |

**Thành phần.** `CP-07` lọc theo cửa hàng · khoảng ngày · trạng thái phiếu · trạng thái thanh toán · từ khóa; `CP-06` bảng gồm mã phiếu · ngày tiếp nhận · khách · xe · dịch vụ · tổng tiền · `CP-10` trạng thái phiếu · `CP-10` trạng thái thanh toán · kỹ thuật viên phụ trách.

**Hành động.** Bấm dòng → `SA-10`. Nút lọc nhanh **Đang ở xưởng** · **Chờ thanh toán** (`FR-PAY-07`) · **Chờ khách duyệt báo giá**.

**Quy tắc.** Mặc định hiện phiếu chưa bàn giao, sắp xếp theo ngày tiếp nhận giảm dần. Dòng có phiếu chờ thanh toán quá 7 ngày được đánh dấu cảnh báo kèm chữ.

---

### `SA-10` — Chi tiết phiếu dịch vụ

| | |
| --- | --- |
| **Loại · Thiết bị** | `D` · PC |
| **Đường dẫn** | `/admin/work-orders/:id` |
| **Yêu cầu** | `FR-WO-02` `FR-WO-07`…`FR-WO-16` `BR-19`…`BR-27` |
| **Đợt** | MVP |

**Bố cục**

```
┌──────────────────────────────────────────────────────┐
│ WO-20261008-0135   🔧 Đang thực hiện   ¥ Chưa thanh toán│
├──────────────────────────────────────────────────────┤
│ CP-19  ●Tiếp nhận ─●Chẩn đoán ─●Báo giá ─◉Đang làm ─○Xong │
├───────────────────────────┬──────────────────────────┤
│ Khách · Xe · Cửa hàng     │ Hiện trạng khi tiếp nhận │
│ (chỉ đọc, có liên kết)    │ 18.400 km · 1/2 · [ảnh]  │
├───────────────────────────┴──────────────────────────┤
│ CHẨN ĐOÁN KỸ THUẬT VIÊN                 [Sửa → SA-11]│
├──────────────────────────────────────────────────────┤
│ HẠNG MỤC CÔNG VIỆC                      [Sửa → SA-11]│
│ Thay dầu máy                    30 ph      ¥2,500    │
│ Thay má phanh trước             45 ph      ¥3,500    │
├──────────────────────────────────────────────────────┤
│ PHỤ TÙNG                                [Sửa → SA-11]│
│ Dầu máy 10W-40 1L    ×1    ¥1,200   ¥1,200           │
│ Má phanh trước Honda ×1    ¥2,800   ¥2,800           │
├──────────────────────────────────────────────────────┤
│ CP-21  Tiền công ¥6,000 · Phụ tùng ¥4,000            │
│        Thuế ¥1,000 · TỔNG ¥11,000                    │
├──────────────────────────────────────────────────────┤
│ [Lập báo giá] [Hoàn tất] [Ghi thanh toán] [In PDF]   │
├──────────────────────────────────────────────────────┤
│ CP-25 Lịch sử thay đổi                               │
└──────────────────────────────────────────────────────┘
```

**Thành phần**

| # | Khối | Kiểu | Mô tả |
| --- | --- | :---: | --- |
| 1 | Tiêu đề | `ro` | Mã phiếu · trạng thái phiếu · trạng thái thanh toán |
| 2 | Thanh tiến độ | `ro` | `CP-19` |
| 3 | Khách · xe · cửa hàng · lịch hẹn nguồn | `ro` | Có liên kết — `FR-WO-02` |
| 4 | Hiện trạng khi tiếp nhận | `ro` | Số km · nhiên liệu · ảnh · phụ kiện — `FR-WO-03` |
| 5 | Chẩn đoán kỹ thuật viên | `ro` | Triệu chứng · nguyên nhân — `FR-WO-04` |
| 6 | Hạng mục công việc | `tbl` | Tên · thời gian · đơn giá — `FR-WO-05` |
| 7 | Phụ tùng | `tbl` | Tên · mã · số lượng · đơn giá · thành tiền — `FR-WO-06` |
| 8 | Bảng dòng tiền | `ro` | `CP-21` — `FR-WO-11` `BR-20` |
| 9 | Báo giá liên quan | `ro` | Danh sách phiên bản và trạng thái |
| 10 | Thanh toán | `ro` | Hình thức · số tiền · thời điểm · người thu |
| 11 | Lịch sử thay đổi | `tbl` | `CP-25` — `FR-WO-08` |
| 12 | Nút **Hỏi trợ lý kỹ thuật** | `btn` | Mở `SA-30` mang theo ngữ cảnh xe và triệu chứng — `FR-TEC-06` *(G3)* |

**Hành động**

| Nút | Điều kiện | Kết quả |
| --- | --- | --- |
| **Sửa chẩn đoán / hạng mục / phụ tùng** | Phiếu chưa hoàn tất | → `SA-11` |
| **Lập báo giá** | Trạng thái từ *Đang chẩn đoán* trở đi | → `SA-12` — `BR-28` |
| **Bắt đầu thực hiện** | Đã duyệt báo giá, hoặc không cần báo giá | → *Đang thực hiện* — `BR-33` |
| **Hoàn tất** | Mọi hạng mục đã xong | → *Hoàn tất*: trừ kho, ghi lịch sử xe, tính chu kỳ bảo dưỡng — `BR-22` `BR-24` `FR-WO-12` `FR-WO-13` |
| **Ghi nhận thanh toán** | Phiếu đã hoàn tất | → `SA-14` |
| **Bàn giao xe** | Phiếu đã hoàn tất | → *Đã bàn giao* — `BR-26` |
| **In PDF** | Luôn | Xuất phiếu — `FR-WO-14` |
| **Hủy phiếu** | Chưa bàn giao | `CP-08` + lý do bắt buộc; hoàn lại tồn kho — `FR-WO-15` `BR-25` |

**Quy tắc & kiểm tra**

| # | Quy tắc |
| --- | --- |
| 1 | Phiếu đã hoàn tất **không sửa được**; điều chỉnh phải tạo bản ghi mới có lý do — `BR-23` `FR-WO-16` |
| 2 | Giá áp dụng là giá tại thời điểm tạo phiếu — `BR-21` |
| 3 | Phụ tùng trừ kho tại thời điểm **hoàn tất**, không phải khi thêm vào phiếu — `BR-24` |
| 4 | Phiếu bảo dưỡng bắt buộc có số km để tính chu kỳ tiếp theo — `BR-27` |
| 5 | Bàn giao chỉ thực hiện được sau khi hoàn tất — `BR-26` |
| 6 | Mỗi lần chuyển trạng thái ghi người thực hiện và thời điểm — `FR-WO-08` |

**Thông báo**

| Tình huống | Nội dung |
| --- | --- |
| Hoàn tất khi còn hạng mục dở | *"Còn {n} hạng mục chưa hoàn thành. Vui lòng cập nhật trước khi hoàn tất phiếu."* |
| Trừ kho làm âm tồn | *"Phụ tùng {tên} chỉ còn {n} trong kho, cần {m}. Vui lòng nhập kho hoặc điều chỉnh số lượng."* — `BR-42` |
| Hoàn tất thành công | *"Đã hoàn tất phiếu. Tồn kho đã được cập nhật và lịch sử xe đã được ghi nhận."* |
| Thử sửa phiếu đã hoàn tất | *"Phiếu đã hoàn tất nên không sửa được. Bạn có thể tạo bản điều chỉnh."* |
| Bàn giao khi chưa thanh toán | *"Phiếu chưa thanh toán. Vẫn bàn giao xe?"* — cho phép tiếp tục sau xác nhận |

---

### `SA-11` — Chẩn đoán & hạng mục công việc

| | |
| --- | --- |
| **Loại · Thiết bị** | `F` · PC · **Đường dẫn** `/admin/work-orders/:id/items` · **Yêu cầu** `FR-WO-04` `FR-WO-05` `FR-WO-06` · **Đợt** MVP |

**Thành phần**

| # | Khối | Kiểu | Bắt buộc | Mô tả |
| --- | --- | :---: | :---: | --- |
| 1 | Triệu chứng ghi nhận | `area` | ✔ | Điền sẵn từ mô tả của khách |
| 2 | Nguyên nhân xác định | `area` | ✔ | |
| 3 | Đối chiếu chẩn đoán AI | `ro` | — | `CP-16` — hiện lỗi AI dự đoán để so sánh, phục vụ `FR-AI-14` |
| 4 | Mức độ khó | `sel` | ✔¹ | Dễ · Trung bình · Khó — ảnh hưởng giá sửa chữa `BR-35` `OQ-04` |
| 5 | Bảng hạng mục công việc | `tbl` | ✔ | Mỗi dòng: chọn dịch vụ hoặc nhập tự do · thời gian · đơn giá · trạng thái (Chờ / Đang làm / Xong) |
| 6 | Bảng phụ tùng | `tbl` | — | `CP-20` chọn phụ tùng · số lượng · đơn giá · thành tiền |
| 7 | Kỹ thuật viên phụ trách | `sel` | — | Chọn từ tài khoản quản trị |
| 8 | Bảng dòng tiền | `ro` | — | `CP-21`, cập nhật theo thời gian thực |

¹ Bắt buộc với dịch vụ nhóm sửa chữa.

**Quy tắc & kiểm tra**

| # | Quy tắc |
| --- | --- |
| 1 | Đơn giá điền sẵn theo bảng giá, sửa được, mọi thay đổi được ghi nhật ký |
| 2 | `CP-20` hiện tồn kho của cửa hàng đang xử lý; phụ tùng hết hàng vẫn chọn được kèm cảnh báo |
| 3 | Hệ thống cảnh báo khi phụ tùng không nằm trong danh sách xe tương thích — `FR-PRT-03` |
| 4 | Tồn kho **chưa** bị trừ ở màn hình này — `BR-24` |
| 5 | Xóa dòng đã lưu phải qua `CP-08` |

**Thông báo.** Phụ tùng không tương thích → *"Phụ tùng này không có trong danh sách tương thích với {dòng xe}. Vẫn thêm?"* · Tồn kho không đủ → *"Kho {cửa hàng} còn {n}. Bạn vẫn thêm được, nhưng cần nhập kho trước khi hoàn tất phiếu."*

---

### `SA-12` — Lập báo giá (có AI gợi ý)

| | |
| --- | --- |
| **Loại · Thiết bị** | `F` · PC |
| **Đường dẫn** | `/admin/work-orders/:id/quotation` |
| **Yêu cầu** | `FR-QUO-01`…`FR-QUO-06` `FR-QUO-11` `BR-28`…`BR-31` |
| **Đợt** | G2 |

**Bố cục**

```
┌────────────────────────────────┬─────────────────────────┐
│ BÁO GIÁ (phiên bản 1)          │ ✨ GỢI Ý BỞI AI          │
│                                │ dựa trên: Honda Lead 125│
│ Hạng mục công việc             │ triệu chứng phanh kêu   │
│ · Thay dầu máy      ¥2,500 [x] │─────────────────────────│
│ · Thay má phanh     ¥3,500 [x] │ Kiểm tra đĩa phanh      │
│   [+ Thêm hạng mục]            │ ~¥1,500        [ Chọn ] │
│                                │─────────────────────────│
│ Phụ tùng                       │ Thay dầu phanh DOT4     │
│ · Dầu 10W-40 ×1     ¥1,200 [x] │ ~¥900          [ Chọn ] │
│ · Má phanh   ×1     ¥2,800 [x] │─────────────────────────│
│   [+ Thêm phụ tùng]            │ Má phanh sau (mòn 60 %) │
│                                │ ~¥2,600        [ Chọn ] │
│ CP-21 Tổng cộng    ¥11,000     │                         │
│                                │ ⓘ Gợi ý tham khảo. Phải │
│ Hiệu lực đến [ 15/10/2026 ]    │   kiểm tra thực tế trước│
│                                │   khi đưa vào báo giá.  │
│ [Lưu nháp] [GỬI CHO KHÁCH]     │                         │
└────────────────────────────────┴─────────────────────────┘
```

**Thành phần**

| # | Khối | Kiểu | Mô tả |
| --- | --- | :---: | --- |
| 1 | Số phiên bản báo giá | `ro` | `FR-QUO-11` |
| 2 | Bảng hạng mục công việc | `tbl` | Kế thừa từ phiếu, sửa/thêm/xóa được — `FR-QUO-01` `FR-QUO-04` |
| 3 | Bảng phụ tùng | `tbl` | `CP-20` |
| 4 | Bảng dòng tiền | `ro` | `CP-21` — tiền công · phụ tùng · thuế · tổng — `FR-QUO-05` |
| 5 | **Khu vực gợi ý AI** | `ro` | `CP-16` — hạng mục kiểm tra, phụ tùng cần thay, chi phí tham khảo — `FR-QUO-02` |
| 6 | Nút **Chọn** trên từng gợi ý | `btn` | Thêm mục đó vào báo giá — `FR-QUO-03` |
| 7 | Hiệu lực báo giá | `date` | Mặc định 7 ngày |
| 8 | Ghi chú gửi khách | `area` | Khách nhìn thấy |

**Hành động.** **Lưu nháp** → trạng thái *Nháp*. **Gửi cho khách** → `CP-08` → trạng thái *Đã gửi*, gửi SMS kèm đường dẫn `SC-27` (`FR-QUO-06`). **Tạo phiên bản mới** (khi đã gửi) → nhân bản thành phiên bản kế tiếp, phiên bản cũ chuyển sang *Đã thay thế* (`BR-30`). **Ghi nhận phản hồi thay khách** → `FR-QUO-10`. **In PDF** → `FR-QUO-12`.

**Quy tắc & kiểm tra**

| # | Quy tắc |
| --- | --- |
| 1 | Chỉ lập được từ phiếu ở trạng thái *Đã chẩn đoán* trở đi — `BR-28` |
| 2 | Gợi ý AI **không bao giờ** tự động thêm vào báo giá; bắt buộc bấm **Chọn** từng mục — `FR-QUO-03` `BR-29` |
| 3 | Mọi gợi ý AI nằm trong vùng riêng có nhãn, tách khỏi vùng dữ liệu do Admin nhập |
| 4 | Báo giá đã gửi không sửa trực tiếp; phải tạo phiên bản mới — `BR-30` |
| 5 | Chỉ một phiên bản ở trạng thái *Đã gửi* tại một thời điểm — `BR-31` |
| 6 | Khi dịch vụ AI lỗi, khu vực gợi ý hiện thông báo và Admin vẫn lập báo giá thủ công bình thường — `NFR-AV-04` |

**Thông báo.** AI không phản hồi → *"Chưa lấy được gợi ý. Bạn vẫn lập báo giá bình thường."* + nút **Thử lại** · Gửi thành công → *"Đã gửi báo giá. Khách nhận được tin nhắn kèm đường dẫn xem báo giá."* · Sửa báo giá đã gửi → *"Báo giá này đã gửi cho khách. Tạo phiên bản mới để chỉnh sửa?"*

---

### `SA-13` — Danh sách báo giá

| | |
| --- | --- |
| **Loại · Thiết bị** | `L` · PC · **Đường dẫn** `/admin/quotations` · **Yêu cầu** `FR-QUO-10` `FR-QUO-12` · **Đợt** G2 |

**Thành phần.** `CP-07` lọc theo trạng thái (Nháp · Đã gửi · Đã đồng ý · Đã từ chối · Đã thay thế) · cửa hàng · khoảng ngày; `CP-06` bảng gồm mã báo giá · phiên bản · phiếu dịch vụ · khách · xe · tổng tiền · ngày gửi · hiệu lực · `CP-10` trạng thái.

**Hành động.** Bấm dòng → `SA-12`. **Ghi nhận phản hồi thay khách** (`FR-QUO-10`) → hộp thoại chọn Đồng ý / Từ chối kèm ghi chú và tên người tiếp nhận. **Gửi lại SMS**. **In PDF**.

**Quy tắc.** Báo giá quá hạn hiệu lực mà chưa phản hồi được đánh dấu cảnh báo kèm chữ.

---

### `SA-14` — Ghi nhận thanh toán

| | |
| --- | --- |
| **Loại · Thiết bị** | `F` · PC+SP · **Đường dẫn** `/admin/work-orders/:id/payment` · **Yêu cầu** `FR-PAY-02`…`FR-PAY-05` `FR-PAY-08` `DEC-18` · **Đợt** MVP |

**Thành phần**

| # | Nhãn | Kiểu | Bắt buộc | Ghi chú |
| --- | --- | :---: | :---: | --- |
| 1 | Tổng tiền phiếu | `ro` | — | `CP-21` |
| 2 | Đã thu trước đó | `ro` | — | Khi có đặt cọc — `FR-PAY-05` |
| 3 | Còn phải thu | `ro` | — | Tính tự động |
| 4 | Hình thức thanh toán | `radio` | ✔ | **Tiền mặt · Chuyển khoản · Khác** — `FR-PAY-02` |
| 5 | Số tiền thực thu | `num` | ✔ | Không vượt quá số còn phải thu — `BR-38` |
| 6 | Thời điểm thu | `date` | ✔ | Mặc định thời điểm hiện tại (UTC+9) |
| 7 | Người thu | `ro` | — | Tài khoản đang đăng nhập — `FR-PAY-04` |
| 8 | Ghi chú | `area` | — | Số tham chiếu chuyển khoản |

**Hành động.** **Ghi nhận thanh toán** → `CP-08` → cập nhật trạng thái thanh toán, ghi nhật ký (`FR-PAY-08`), gửi thông báo cho khách.

**Quy tắc & kiểm tra**

| # | Quy tắc |
| --- | --- |
| 1 | Hệ thống **chỉ ghi nhận**, không xử lý giao dịch trực tuyến — `BR-36` `DEC-18` |
| 2 | Trạng thái *Đã thanh toán* chỉ do Admin cập nhật — `BR-37` `FR-PAY-03` |
| 3 | Thu đủ → `PAID`; thu một phần → `PARTIAL` |
| 4 | Số tiền thực thu không vượt tổng tiền phiếu — `BR-38` |
| 5 | Tiền tệ JPY, không phần thập phân — `BR-39` |
| 6 | Điều chỉnh sau khi ghi nhận phải tạo bản ghi mới kèm lý do, không sửa đè |

**Thông báo.** Vượt số tiền → *"Số tiền vượt quá số còn phải thu (¥{n})."* · Thành công → *"Đã ghi nhận thanh toán ¥{n} bằng {hình thức}."*

---

### `SA-15` — Danh sách khách hàng

| | |
| --- | --- |
| **Loại · Thiết bị** | `L` · PC · **Đường dẫn** `/admin/customers` · **Yêu cầu** `FR-CUS-01` `FR-CUS-02` · **Đợt** MVP |

**Thành phần.** `CP-07` lọc theo cửa hàng thường đến · trạng thái · khoảng thời gian sử dụng dịch vụ; ô tìm theo **tên, số điện thoại, email, biển số xe** (`FR-CUS-02`); `CP-06` bảng gồm tên · số điện thoại · email · số xe · số lần dùng dịch vụ · lần gần nhất · tổng chi tiêu · trạng thái.

**Hành động.** Bấm dòng → `SA-16`. **Thêm khách hàng** → `SA-17`. **Gộp hồ sơ** → `SA-18` *(G2)*. **Xuất Excel**.

**Quy tắc.** Số điện thoại tìm theo giá trị đã chuẩn hóa (`BR-50`), nhập dạng nào cũng tìm được. Khách đã vô hiệu hóa hiện mờ và lọc riêng.

---

### `SA-16` — Chi tiết khách hàng

| | |
| --- | --- |
| **Loại · Thiết bị** | `D` · PC · **Đường dẫn** `/admin/customers/:id` · **Yêu cầu** `FR-CUS-03` `FR-CUS-05` · **Đợt** MVP |

**Thành phần**

| # | Khối | Kiểu | Mô tả |
| --- | --- | :---: | --- |
| 1 | Thông tin cá nhân | `ro` | Tên · điện thoại · email · địa chỉ · ngôn ngữ ưa dùng |
| 2 | Thẻ chỉ số | `ro` | `CP-22` — số lần dùng dịch vụ · tổng chi tiêu · lần gần nhất · số xe |
| 3 | Tab **Phương tiện** | `tbl` | Danh sách xe, liên kết tới `SA-20` |
| 4 | Tab **Lịch hẹn** | `tbl` | Toàn bộ lịch hẹn, liên kết tới `SA-05` |
| 5 | Tab **Phiếu dịch vụ** | `tbl` | Toàn bộ phiếu, liên kết tới `SA-10` |
| 6 | Tab **Thông báo đã gửi** | `tbl` | Liên kết tới `SA-42` |
| 7 | Ghi chú nội bộ | `area` | `FR-CUS-05` — khách không nhìn thấy |
| 8 | Lịch sử thay đổi | `tbl` | `CP-25` |

**Hành động.** **Sửa** → `SA-17`. **Đặt lịch cho khách này** → `SA-06` điền sẵn. **Vô hiệu hóa** → `CP-08` (`FR-CUS-08`). **Gộp với hồ sơ khác** → `SA-18`.

---

### `SA-17` — Thêm / sửa khách hàng

| | |
| --- | --- |
| **Loại · Thiết bị** | `F` · PC · **Đường dẫn** `/admin/customers/:id/edit` · **Yêu cầu** `FR-CUS-04` `FR-CUS-08` · **Đợt** MVP |

**Thành phần.** Họ tên (`text`, bắt buộc) · Số điện thoại (`tel`, bắt buộc) · Email (`text`) · Địa chỉ (`text`) · Ngôn ngữ ưa dùng (`sel`) · Cửa hàng thường đến (`sel`) · Trạng thái (`sel`: Đang hoạt động / Vô hiệu hóa) · Ghi chú nội bộ (`area`).

**Quy tắc & kiểm tra.** Số điện thoại duy nhất sau khi chuẩn hóa (`BR-50`); trùng thì đề xuất mở hồ sơ đã có hoặc gộp. Khách hàng **không xóa được**, chỉ vô hiệu hóa để giữ toàn vẹn lịch sử (`FR-CUS-08`).

**Thông báo.** Số điện thoại trùng → *"Số này đã thuộc hồ sơ {tên}. Mở hồ sơ đó hay gộp hai hồ sơ?"*

---

### `SA-18` — Gộp hồ sơ khách hàng

| | |
| --- | --- |
| **Loại · Thiết bị** | `F` · PC · **Đường dẫn** `/admin/customers/merge` · **Yêu cầu** `FR-CUS-06` `FR-CUS-07` · **Đợt** G2 |

**Thành phần.** Danh sách hồ sơ nghi trùng do hệ thống phát hiện theo số điện thoại (`FR-CUS-06`); hai cột so sánh **Hồ sơ nguồn** / **Hồ sơ đích**; bảng chọn giá trị giữ lại cho từng trường; tóm tắt số xe, lịch hẹn, phiếu dịch vụ sẽ được chuyển.

**Hành động.** **Gộp hồ sơ** → `CP-08` với nội dung nêu rõ hậu quả → chuyển toàn bộ xe, lịch hẹn, phiếu dịch vụ sang hồ sơ đích (`FR-CUS-07`), hồ sơ nguồn chuyển sang trạng thái đã gộp.

**Quy tắc & kiểm tra.** Thao tác **không hoàn tác được** — phải xác nhận hai bước. Ghi nhật ký đầy đủ (`FR-SYS-03`). Không gộp được hồ sơ đang có phiếu dịch vụ chưa bàn giao.

**Thông báo.** Có phiếu đang xử lý → *"Hồ sơ nguồn còn {n} phiếu dịch vụ chưa bàn giao. Vui lòng hoàn tất trước khi gộp."*

---

### `SA-19` — Danh sách phương tiện

| | |
| --- | --- |
| **Loại · Thiết bị** | `L` · PC · **Đường dẫn** `/admin/vehicles` · **Yêu cầu** `FR-VEH-08` `FR-VEH-09` · **Đợt** MVP |

**Thành phần.** Ô tìm theo **biển số, số khung, tên khách, số điện thoại** (`FR-VEH-09`); lọc theo hãng · loại xe · loại nhiên liệu · cửa hàng; `CP-06` bảng gồm biển số · hãng và dòng · loại · nhiên liệu · chủ xe · số km gần nhất · lần dịch vụ gần nhất · bảo dưỡng tiếp theo.

**Hành động.** Bấm dòng → `SA-20`. **Thêm phương tiện** → `SA-21`. **Xuất Excel**.

**Quy tắc.** Xe đến hạn bảo dưỡng được đánh dấu cảnh báo kèm chữ, lọc riêng được — hỗ trợ chăm sóc khách hàng chủ động.

---

### `SA-20` — Chi tiết phương tiện & lịch sử

| | |
| --- | --- |
| **Loại · Thiết bị** | `D` · PC · **Đường dẫn** `/admin/vehicles/:id` · **Yêu cầu** `FR-VEH-10` · **Đợt** MVP |

**Thành phần.** Thông tin xe đầy đủ (`ro`); chủ sở hữu, liên kết tới `SA-16`; thẻ chỉ số: tổng số lần dịch vụ · tổng chi tiêu · số km hiện tại · bảo dưỡng tiếp theo; **dòng thời gian toàn bộ lịch sử dịch vụ** trong một màn hình (`FR-VEH-10`), mỗi mục liên kết tới `SA-10`; biểu đồ số km theo thời gian; danh sách phụ tùng đã thay kèm ngày thay.

**Hành động.** **Sửa** → `SA-21`. **Đặt lịch cho xe này** → `SA-06`. **In lịch sử dịch vụ**.

---

### `SA-21` — Thêm / sửa phương tiện

| | |
| --- | --- |
| **Loại · Thiết bị** | `F` · PC · **Đường dẫn** `/admin/vehicles/:id/edit` · **Yêu cầu** `FR-VEH-08` `FR-VEH-02` `FR-VEH-03` · **Đợt** MVP |

**Thành phần.** Chủ sở hữu (`sel`, bắt buộc, tìm theo tên hoặc số điện thoại); `CP-13` biểu mẫu thông tin xe; chu kỳ bảo dưỡng riêng (`sel`, tùy chọn, ghi đè mặc định — `OQ-10`); ghi chú kỹ thuật (`area`).

**Quy tắc & kiểm tra.** Biển số duy nhất toàn hệ thống (`FR-VEH-03`); trùng thì hiện hồ sơ xe đang tồn tại để Admin xử lý. Đổi chủ sở hữu phải qua `CP-08` và ghi nhật ký. Xe đã có phiếu dịch vụ không xóa được, chỉ ẩn.

---

### `SA-22` — Danh sách dịch vụ

| | |
| --- | --- |
| **Loại · Thiết bị** | `L` · PC · **Đường dẫn** `/admin/services` · **Yêu cầu** `FR-SVC-01` `FR-SVC-09` `FR-SVC-10` · **Đợt** MVP |

**Thành phần.** Tab nhóm **Bảo dưỡng / Sửa chữa**; `CP-06` bảng gồm tên (theo ngôn ngữ đang chọn) · nhóm · thời gian ước tính · khoảng giá · số cửa hàng cung cấp · trạng thái hiển thị · thứ tự; tay cầm kéo thả để sắp xếp thứ tự (`FR-SVC-09`).

**Hành động.** **Thêm dịch vụ** → `SA-23`. **Sửa** → `SA-23`. **Ẩn / hiện** trên site khách hàng. **Xóa** → chỉ khi dịch vụ chưa từng dùng trong phiếu (`FR-SVC-10`).

**Thông báo.** Xóa dịch vụ đã dùng → *"Dịch vụ này đã được dùng trong {n} phiếu nên không xóa được. Bạn có thể ẩn khỏi site khách hàng."*

---

### `SA-23` — Thêm / sửa dịch vụ

| | |
| --- | --- |
| **Loại · Thiết bị** | `F` · PC · **Đường dẫn** `/admin/services/:id/edit` · **Yêu cầu** `FR-SVC-01`…`FR-SVC-03` `FR-SVC-07` `FR-I18N-04` · **Đợt** MVP |

**Thành phần**

| # | Nhãn | Kiểu | Bắt buộc | Ghi chú |
| --- | --- | :---: | :---: | --- |
| 1 | Tên dịch vụ | — | ✔ | `CP-24` ba ngôn ngữ — `FR-I18N-04` |
| 2 | Nhóm | `radio` | ✔ | **Bảo dưỡng** / **Sửa chữa** — `FR-SVC-02` |
| 3 | Mô tả | — | — | `CP-24` ba ngôn ngữ |
| 4 | Hạng mục công việc bao gồm | `area` | — | Mỗi dòng một hạng mục, hiện trên `SC-03` |
| 5 | Thời gian thực hiện ước tính | `num` | ✔ | Đơn vị phút |
| 6 | Ảnh minh họa | `file` | — | |
| 7 | Cửa hàng cung cấp | `chk` | ✔ | Chọn nhiều — `FR-SVC-07` |
| 8 | Hiển thị trên site khách hàng | `chk` | — | |
| 9 | Đưa vào nhóm nổi bật | `chk` | — | Hiện trên `SC-01` |

**Quy tắc & kiểm tra.** Tên tiếng Nhật bắt buộc; thiếu bản dịch khác thì hiện tiếng Nhật (`FR-I18N-05`). Giá cấu hình ở `SA-24`, không nhập tại đây. Đổi nhóm dịch vụ đã dùng trong phiếu phải qua cảnh báo.

---

### `SA-24` — Quản lý bảng giá

| | |
| --- | --- |
| **Loại · Thiết bị** | `F` · PC |
| **Đường dẫn** | `/admin/pricing` |
| **Yêu cầu** | `FR-SVC-04` `FR-SVC-05` `FR-SVC-06` `FR-SVC-08` `BR-34` `BR-35` |
| **Đợt** | MVP |

**Mục đích.** Thiết lập quy tắc giá theo đúng mô hình khách hàng yêu cầu: **bảo dưỡng theo loại nhiên liệu và phụ tùng**, **sửa chữa theo loại phụ tùng và mức độ khó**.

**Bố cục**

```
[ Bảo dưỡng ]  [ Sửa chữa ]

── Bảo dưỡng ──────────────────────────────────────────
Dịch vụ: Thay dầu máy
┌────────────────┬──────────────┬──────────┬──────────┐
│ Loại nhiên liệu│ Phụ tùng     │ Giá từ   │ Giá đến  │
├────────────────┼──────────────┼──────────┼──────────┤
│ Xăng           │ Dầu 10W-40   │ ¥2,500   │ ¥2,500   │
│ Xăng           │ Dầu tổng hợp │ ¥4,200   │ ¥4,200   │
│ Điện           │ —            │ ¥1,800   │ ¥1,800   │
└────────────────┴──────────────┴──────────┴──────────┘

── Sửa chữa ───────────────────────────────────────────
Dịch vụ: Thay má phanh
┌────────────────┬──────────────┬──────────┬──────────┐
│ Loại phụ tùng  │ Mức độ khó   │ Giá từ   │ Giá đến  │
├────────────────┼──────────────┼──────────┼──────────┤
│ Chính hãng     │ Dễ           │ ¥3,500   │ ¥4,000   │
│ Chính hãng     │ Trung bình   │ ¥4,500   │ ¥5,500   │
│ Thay thế       │ Dễ           │ ¥2,200   │ ¥2,800   │
└────────────────┴──────────────┴──────────┴──────────┘

Hiệu lực từ: [ 01/11/2026 ]        [ Lưu bảng giá ]
```

**Thành phần**

| # | Thành phần | Kiểu | Mô tả |
| --- | --- | :---: | --- |
| 1 | Tab nhóm | `radio` | Bảo dưỡng / Sửa chữa |
| 2 | Chọn dịch vụ | `sel` | |
| 3 | Bảng giá bảo dưỡng | `tbl` | Loại nhiên liệu · phụ tùng đi kèm · giá từ · giá đến — `FR-SVC-04` `BR-34` |
| 4 | Bảng giá sửa chữa | `tbl` | Loại phụ tùng · mức độ khó · giá từ · giá đến — `FR-SVC-05` `BR-35` |
| 5 | Ngày hiệu lực | `date` | `FR-SVC-08` |
| 6 | Lịch sử bảng giá | `tbl` | Các phiên bản đã áp dụng |

**Quy tắc & kiểm tra**

| # | Quy tắc |
| --- | --- |
| 1 | Giá đặt theo khoảng (từ — đến); bằng nhau nghĩa là giá cố định — `FR-SVC-06` |
| 2 | Giá đến không nhỏ hơn giá từ |
| 3 | Giá mới áp dụng từ ngày hiệu lực; **lịch hẹn và phiếu đã tạo giữ nguyên giá cũ** — `FR-SVC-08` `BR-21` |
| 4 | Không được có hai dòng trùng tổ hợp điều kiện cho cùng một dịch vụ |
| 5 | Khoảng giá hiển thị công khai trên `SC-04` như giá tham khảo |

**Thông báo.** Trùng tổ hợp → *"Đã có dòng giá cho tổ hợp này. Vui lòng sửa dòng hiện có."* · Ngày hiệu lực trong quá khứ → *"Ngày hiệu lực phải từ hôm nay trở đi."*

---

### `SA-25` — Danh sách phụ tùng

| | |
| --- | --- |
| **Loại · Thiết bị** | `L` · PC · **Đường dẫn** `/admin/parts` · **Yêu cầu** `FR-PRT-08` `FR-PRT-14` · **Đợt** MVP |

**Thành phần.** `CP-07` lọc theo nhóm · hãng sản xuất · xe tương thích · trạng thái tồn kho; ô tìm theo mã hoặc tên; `CP-06` bảng gồm ảnh nhỏ · mã · tên · hãng · nhóm · quy cách · đơn vị · giá bán · tổng tồn tất cả cửa hàng · trạng thái.

**Hành động.** **Thêm phụ tùng** → `SA-26`. **Thêm bằng AI** → `SA-27` *(G2)*. **Nhập từ Excel** → `FR-PRT-14` *(G3)*. Bấm dòng → `SA-26`. **Xuất Excel**.

**Quy tắc.** Phụ tùng dưới mức tồn tối thiểu được đánh dấu cảnh báo kèm chữ (`FR-PRT-12`). Phụ tùng đã phát sinh giao dịch không xóa được, chỉ ẩn (`BR-44`).

---

### `SA-26` — Thêm / sửa phụ tùng

| | |
| --- | --- |
| **Loại · Thiết bị** | `F` · PC · **Đường dẫn** `/admin/parts/:id/edit` · **Yêu cầu** `FR-PRT-01`…`FR-PRT-03` · **Đợt** MVP |

**Thành phần**

| # | Nhãn | Kiểu | Bắt buộc | Ghi chú |
| --- | --- | :---: | :---: | --- |
| 1 | Mã phụ tùng | `text` | ✔ | Duy nhất toàn hệ thống — `BR-40` |
| 2 | Tên phụ tùng | — | ✔ | `CP-24` ba ngôn ngữ |
| 3 | Hãng sản xuất | `sel` | ✔ | |
| 4 | Nhóm phụ tùng | `sel` | ✔ | Dầu nhớt · Phanh · Lốp · Điện · Động cơ · Khác |
| 5 | Quy cách | `text` | — | Ví dụ "10W-40, 1L" |
| 6 | Đơn vị tính | `sel` | ✔ | Cái · Bộ · Lít · Mét |
| 7 | Giá nhập | `num` | — | **Không** hiển thị cho khách |
| 8 | Giá bán | `num` | ✔ | |
| 9 | Ảnh phụ tùng | `file` | — | `CP-14` |
| 10 | Xe tương thích | `tbl` | — | Hãng · dòng · khoảng năm, thêm nhiều dòng — `FR-PRT-03` |
| 11 | Mức tồn tối thiểu mặc định | `num` | — | |
| 12 | Trạng thái | `sel` | — | Đang dùng / Ngừng dùng |

**Quy tắc & kiểm tra.** Mã phụ tùng duy nhất (`BR-40`); trùng thì đề xuất mở bản ghi đã có. Giá bán không nhỏ hơn giá nhập — chỉ cảnh báo, không chặn. Khi vào từ `SA-27`, các trường do AI điền được **đánh dấu rõ** và chỉ lưu sau khi Admin xác nhận (`FR-PRT-05` `BR-43`).

---

### `SA-27` — Nhập liệu phụ tùng bằng AI

| | |
| --- | --- |
| **Loại · Thiết bị** | `X` · PC+SP |
| **Đường dẫn** | `/admin/parts/ai-import` |
| **Yêu cầu** | `FR-PRT-04`…`FR-PRT-07` `BR-43` `DEC-23` |
| **Đợt** | G2 |

**Mục đích.** Giảm công nhập liệu cho Admin: tải ảnh phụ tùng hoặc ảnh hộp vỏ, AI tự sinh thông tin và điền sẵn vào biểu mẫu.

**Bố cục**

```
┌──────────────────────┬───────────────────────────────┐
│  Ảnh đã tải          │ ✨ THÔNG TIN AI NHẬN DẠNG      │
│                      │                               │
│  ┌────────────────┐  │ Mã phụ tùng   ✨ 06455-KVB-901│
│  │                │  │ Tên           ✨ Má phanh trước│
│  │   [ảnh hộp]    │  │ Hãng          ✨ Honda         │
│  │                │  │ Nhóm          ✨ Phanh         │
│  └────────────────┘  │ Quy cách      ✨ Bộ 2 miếng    │
│                      │ Xe tương thích ✨ Lead 125     │
│  [📷 Chụp lại]       │                  Vision 110    │
│  [📁 Chọn ảnh khác]  │                               │
│                      │ ⓘ Vui lòng kiểm tra lại trước │
│                      │   khi lưu.                    │
│                      │ [ Bỏ qua ] [ ÁP DỤNG & SỬA ]  │
└──────────────────────┴───────────────────────────────┘
```

**Thành phần**

| # | Thành phần | Kiểu | Mô tả |
| --- | --- | :---: | --- |
| 1 | Ô tải ảnh | `file` | `CP-14` — ảnh phụ tùng hoặc **ảnh hộp vỏ** — `FR-PRT-04` `DEC-23` |
| 2 | Nút chụp trực tiếp | `btn` | Trên điện thoại |
| 3 | Trạng thái đang nhận dạng | `ro` | *"Đang nhận dạng…"* — tối đa 15 giây — `NFR-PF-05` |
| 4 | Khu vực kết quả AI | `ro` | `CP-16` — mỗi trường có biểu tượng ✨ — `FR-PRT-05` |
| 5 | Mã đọc được từ hộp | `ro` | Kết quả OCR — `FR-PRT-06` |
| 6 | Cảnh báo trùng mã | `ro` | Khi mã đã tồn tại — `FR-PRT-07` |
| 7 | Nút **Áp dụng & sửa** | `btn` | → `SA-26` với các trường điền sẵn |
| 8 | Nút **Bỏ qua** | `btn` | → `SA-26` với biểu mẫu trống |

**Quy tắc & kiểm tra**

| # | Quy tắc |
| --- | --- |
| 1 | AI **không tự lưu**; chỉ điền sẵn vào biểu mẫu để Admin xác nhận — `FR-PRT-05` `BR-43` |
| 2 | Trường do AI điền mang biểu tượng ✨ cho tới khi Admin chạm vào và sửa |
| 3 | Mã đọc được đã tồn tại → cảnh báo và đề xuất mở bản ghi cũ — `FR-PRT-07` |
| 4 | Trường AI không xác định được thì để trống, **không đoán** |
| 5 | AI lỗi hoặc quá thời gian chờ → chuyển sang nhập tay bình thường — `NFR-AV-04` |
| 6 | Ảnh tải lên được lưu làm ảnh minh họa của phụ tùng |

**Thông báo.** Trùng mã → *"Mã {mã} đã có trong hệ thống: {tên}. Mở bản ghi đó hay tạo phụ tùng mới?"* · Không nhận dạng được → *"Chưa đọc được thông tin từ ảnh. Thử chụp rõ phần mã trên hộp, hoặc nhập tay."* · Quá thời gian chờ → *"Nhận dạng lâu hơn dự kiến. Bạn có thể nhập tay và lưu ảnh sau."*

---

### `SA-28` — Tồn kho theo cửa hàng

| | |
| --- | --- |
| **Loại · Thiết bị** | `L` · PC · **Đường dẫn** `/admin/inventory` · **Yêu cầu** `FR-PRT-09` `FR-PRT-12` `BR-41` · **Đợt** MVP |

**Thành phần.** Bộ chọn cửa hàng (`sel`, bắt buộc — tồn kho quản lý theo từng cửa hàng, `BR-41`); lọc theo nhóm phụ tùng và trạng thái tồn; `CP-06` bảng gồm mã · tên · tồn hiện có · mức tối thiểu · đã đặt trong phiếu chưa hoàn tất · khả dụng · cập nhật gần nhất; khối tóm tắt số mặt hàng dưới mức tối thiểu.

**Hành động.** **Nhập kho / Xuất kho / Điều chỉnh** → `SA-29`. Bấm dòng → lịch sử biến động của phụ tùng đó (`FR-PRT-13`). **Xuất Excel**.

**Quy tắc.** Dòng dưới mức tối thiểu được đánh dấu cảnh báo kèm chữ (`FR-PRT-12`). Tồn kho không bao giờ âm (`BR-42`).

---

### `SA-29` — Nhập / xuất / điều chỉnh kho

| | |
| --- | --- |
| **Loại · Thiết bị** | `F` · PC · **Đường dẫn** `/admin/inventory/transactions` · **Yêu cầu** `FR-PRT-11` `FR-PRT-13` `BR-42` · **Đợt** MVP |

**Thành phần**

| # | Nhãn | Kiểu | Bắt buộc | Ghi chú |
| --- | --- | :---: | :---: | --- |
| 1 | Loại giao dịch | `radio` | ✔ | **Nhập kho · Xuất kho · Điều chỉnh** |
| 2 | Cửa hàng | `sel` | ✔ | — `BR-41` |
| 3 | Bảng phụ tùng | `tbl` | ✔ | `CP-20` — phụ tùng · số lượng · đơn giá (khi nhập kho) |
| 4 | Ngày giao dịch | `date` | ✔ | Mặc định hôm nay |
| 5 | Lý do | `sel` | ✔ | Mua hàng · Trả nhà cung cấp · Hỏng · Mất · Kiểm kê · Khác |
| 6 | Ghi chú / số chứng từ | `area` | — | |

**Quy tắc & kiểm tra.** Xuất kho hoặc điều chỉnh làm âm tồn bị chặn (`BR-42`). Mọi giao dịch ghi nhật ký gồm thời điểm, loại, số lượng, người thực hiện, chứng từ liên quan (`FR-PRT-13`). Giao dịch đã ghi **không sửa được** — điều chỉnh phải tạo giao dịch mới.

**Thông báo.** Vượt tồn → *"Kho chỉ còn {n} {đơn vị} phụ tùng {tên}. Không xuất được {m}."* · Thành công → *"Đã ghi nhận. Tồn kho {tên} hiện là {n}."*

---

### `SA-30` — Trợ lý AI kỹ thuật

| | |
| --- | --- |
| **Loại · Thiết bị** | `X` · PC+SP |
| **Đường dẫn** | `/admin/tech-assistant` |
| **Yêu cầu** | `FR-TEC-01`…`FR-TEC-04` `FR-TEC-06` `FR-TEC-07` |
| **Đợt** | G3 |

**Mục đích.** Cho nhân viên tra cứu quy trình sửa chữa, mã lỗi và thông số kỹ thuật bằng ngôn ngữ tự nhiên, thay vì lật tài liệu giấy.

**Bố cục**

```
┌──────────────────────────────────────────────────────┐
│ Trợ lý kỹ thuật        Ngữ cảnh: Honda Lead 125 ✕    │
├──────────────────────────────────────────────────────┤
│ 👤 Quy trình thay má phanh trước của Lead 125?       │
│                                                      │
│ 🤖 Các bước:                                         │
│    1. Tháo bánh trước (lực siết trục 59 N·m)         │
│    2. Tháo cùm phanh ...                             │
│                                                      │
│    📄 Nguồn: Sách hướng dẫn Honda Lead 125 (2022),   │
│       mục 12-4, trang 231                            │
│                            [👍 Hữu ích] [👎 Không]   │
├──────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────┐  ┌───────────┐  │
│ │ Nhập câu hỏi kỹ thuật...         │  │   Gửi     │  │
│ └──────────────────────────────────┘  └───────────┘  │
└──────────────────────────────────────────────────────┘
```

**Thành phần.** Khung hội thoại (`ro`); ô nhập câu hỏi (`area`); chỉ báo ngữ cảnh xe và triệu chứng khi mở từ `SA-10` (`FR-TEC-06`); khối **trích dẫn nguồn** dưới mỗi câu trả lời (`FR-TEC-03`); nút đánh giá hữu ích / không hữu ích (`FR-TEC-07`); danh sách câu hỏi gần đây.

**Quy tắc & kiểm tra**

| # | Quy tắc |
| --- | --- |
| 1 | Mỗi câu trả lời **bắt buộc** kèm tên tài liệu và vị trí trang/mục — `FR-TEC-03` |
| 2 | Không tìm được nguồn phù hợp → trả lời **"không có dữ liệu"**, tuyệt đối không suy đoán — `FR-TEC-04` |
| 3 | Trợ lý **chỉ đọc** — không tạo, sửa hay xóa dữ liệu nghiệp vụ |
| 4 | Chỉ trả lời trong phạm vi kỹ thuật xe máy |
| 5 | Nhật ký câu hỏi và đánh giá dùng để cải thiện kho tri thức |

**Thông báo.** Không có nguồn → *"Không tìm thấy thông tin này trong tài liệu hiện có. Vui lòng tra cứu sách hướng dẫn của hãng hoặc hỏi kỹ thuật viên có kinh nghiệm."* · Kho tri thức trống → *"Chưa có tài liệu kỹ thuật nào được nạp. Vui lòng nạp tài liệu tại Kho tài liệu kỹ thuật."*

---

### `SA-31` — Kho tài liệu kỹ thuật

| | |
| --- | --- |
| **Loại · Thiết bị** | `L` · PC · **Đường dẫn** `/admin/knowledge-base` · **Yêu cầu** `FR-TEC-05` · **Đợt** G3 |

**Thành phần.** Danh sách tài liệu gồm tên · hãng · dòng xe áp dụng · loại (sách hướng dẫn · bảng mã lỗi · thông số · quy trình) · số trang · ngày nạp · trạng thái xử lý; ô tải tài liệu (`file`, PDF hoặc ảnh); thanh tiến trình xử lý.

**Hành động.** **Nạp tài liệu** · **Cập nhật** · **Gỡ khỏi kho tri thức** → `CP-08` (`FR-TEC-05`).

**Quy tắc & kiểm tra.** Tài liệu được xử lý nền; trong lúc xử lý chưa dùng để trả lời. Gỡ tài liệu làm mọi trích dẫn tới nó ngừng xuất hiện ở `SA-30`. Khả thi của màn hình này phụ thuộc `OQ-08`.

---

### `SA-32` — Danh sách cửa hàng

| | |
| --- | --- |
| **Loại · Thiết bị** | `L` · PC · **Đường dẫn** `/admin/stores` · **Yêu cầu** `FR-STO-01` · **Đợt** MVP |

**Thành phần.** `CP-06` bảng gồm tên cửa hàng · địa chỉ · điện thoại · số khung giờ mỗi ngày · năng lực mỗi khung · số lịch hẹn tuần này · trạng thái.

**Hành động.** **Thêm cửa hàng** → `SA-33`. Bấm dòng → `SA-33`. **Giờ làm việc** → `SA-34`. **Khung giờ** → `SA-35`. **Vô hiệu hóa** → `CP-08`.

**Quy tắc.** Cửa hàng đã vô hiệu hóa không hiện trên site khách hàng và không nhận lịch hẹn mới; lịch hẹn đã có vẫn xử lý bình thường.

---

### `SA-33` — Thêm / sửa cửa hàng

| | |
| --- | --- |
| **Loại · Thiết bị** | `F` · PC · **Đường dẫn** `/admin/stores/:id/edit` · **Yêu cầu** `FR-STO-01` `FR-STO-02` `FR-I18N-04` · **Đợt** MVP |

**Thành phần.** Tên cửa hàng (`CP-24` ba ngôn ngữ, bắt buộc) · Địa chỉ (`CP-24`, bắt buộc) · Số điện thoại (`tel`, bắt buộc) · Email (`text`) · Tọa độ bản đồ (`text`, có nút chọn trên bản đồ) · Ảnh cửa hàng (`file`) · Giới thiệu (`CP-24`) · Dịch vụ cung cấp (`chk`) · Trạng thái (`sel`).

**Quy tắc.** Tên và địa chỉ tiếng Nhật bắt buộc. Tọa độ dùng để tính khoảng cách hiển thị trên `SC-05`. Bỏ chọn một dịch vụ không ảnh hưởng lịch hẹn đã đặt.

---

### `SA-34` — Giờ làm việc & ngày nghỉ

| | |
| --- | --- |
| **Loại · Thiết bị** | `F` · PC · **Đường dẫn** `/admin/stores/:id/hours` · **Yêu cầu** `FR-STO-03` `FR-STO-04` `BR-08` · **Đợt** MVP |

**Bố cục**

```
GIỜ LÀM VIỆC THEO TUẦN
┌──────┬────────┬──────────────┬──────────────┐
│ Thứ  │ Mở cửa │ Giờ bắt đầu  │ Giờ kết thúc │
├──────┼────────┼──────────────┼──────────────┤
│ T2   │  ☑     │   09:00      │    18:00     │
│ T3   │  ☑     │   09:00      │    18:00     │
│ ...  │        │              │              │
│ CN   │  ☐     │      —       │      —       │
└──────┴────────┴──────────────┴──────────────┘

NGÀY NGHỈ CỤ THỂ                    [+ Thêm ngày nghỉ]
┌────────────┬──────────────────────┬──────────┐
│ 01/01/2027 │ Tết Dương lịch       │  [Xóa]   │
│ 11/02/2027 │ Ngày Quốc khánh      │  [Xóa]   │
└────────────┴──────────────────────┴──────────┘
```

**Quy tắc & kiểm tra.** Giờ kết thúc phải sau giờ bắt đầu. Đặt ngày nghỉ khi đã có lịch hẹn trong ngày đó thì cảnh báo và liệt kê các lịch hẹn bị ảnh hưởng để Admin xử lý. Khách không đặt được vào ngày nghỉ và ngoài giờ làm việc (`BR-08`). Mọi giờ theo UTC+9.

**Thông báo.** Có lịch hẹn trong ngày định nghỉ → *"Ngày này đang có {n} lịch hẹn. Vui lòng đổi lịch hoặc hủy trước khi đặt ngày nghỉ."*

---

### `SA-35` — Khung giờ & năng lực tiếp nhận

| | |
| --- | --- |
| **Loại · Thiết bị** | `F` · PC · **Đường dẫn** `/admin/stores/:id/slots` · **Yêu cầu** `FR-STO-05` `FR-STO-07` `BR-07` · **Đợt** MVP |

**Thành phần.** Độ dài khung giờ (`sel`: 30 · 60 · 90 · 120 phút); bảng khung giờ theo từng ngày trong tuần gồm giờ bắt đầu · giờ kết thúc · số lượt tối đa; nút sinh khung giờ tự động theo giờ làm việc; khu vực **ghi đè theo ngày cụ thể** (`FR-STO-07`).

**Quy tắc & kiểm tra.** Số lượt tối đa ≥ 1. Khung giờ không được chồng lấn. Giảm số lượt xuống dưới số lịch hẹn đã đặt thì bị chặn. Khung giờ đầy hiện **ĐÃ ĐẦY** trên `SC-13` (`BR-07`), riêng Admin vẫn đặt được kèm cảnh báo (`BR-12`).

**Thông báo.** Giảm quá số đã đặt → *"Khung giờ này đã có {n} lịch hẹn. Không đặt số lượt tối đa nhỏ hơn {n}."*

---

### `SA-36` — Báo cáo tổng hợp

| | |
| --- | --- |
| **Loại · Thiết bị** | `X` · PC |
| **Đường dẫn** | `/admin/reports` |
| **Yêu cầu** | `FR-RPT-01`…`FR-RPT-06` `FR-RPT-12` `DEC-22` |
| **Đợt** | MVP |

**Bố cục**

```
Kỳ báo cáo [ Tháng ▾ ] [ 10/2026 ]  Cửa hàng [ Tất cả ▾ ]  [Xuất ▾]

┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ Lịch hẹn │ Hoàn tất │ Tỷ lệ hủy│ Không đến│ Doanh thu│
│   312    │   287    │   6,1 %  │   2,9 %  │ ¥2,84 tr │
└──────────┴──────────┴──────────┴──────────┴──────────┘

Theo ngày / tháng          Theo loại xe
(biểu đồ đường)            (biểu đồ tròn + bảng)

Theo loại dịch vụ          Theo cửa hàng
(bảng)                     (bảng)
```

**Thành phần**

| # | Khối | Kiểu | Mô tả |
| --- | --- | :---: | --- |
| 1 | Bộ chọn kỳ | `sel` | **Ngày · Tháng** hoặc khoảng tùy chọn — `FR-RPT-02` `FR-RPT-12` |
| 2 | Bộ chọn cửa hàng | `sel` | Tất cả hoặc từng cửa hàng — `FR-RPT-05` |
| 3 | Thẻ chỉ số | `ro` | `CP-22` — số lịch hẹn · phiếu hoàn tất · tỷ lệ hủy · tỷ lệ không đến · doanh thu — `FR-RPT-06` |
| 4 | Biểu đồ theo thời gian | `ro` | Theo ngày hoặc theo tháng — `FR-RPT-02` |
| 5 | **Thống kê theo loại xe** | `tbl` | Số lượt · doanh thu — `FR-RPT-03` `DEC-22` |
| 6 | Thống kê theo loại dịch vụ | `tbl` | Bảo dưỡng / sửa chữa — `FR-RPT-04` |
| 7 | Thống kê theo cửa hàng | `tbl` | `FR-RPT-05` |
| 8 | Nút xuất | `btn` | `CP-23` — **Excel và PDF** — `FR-RPT-09` `FR-RPT-10` |

**Quy tắc & kiểm tra**

| # | Quy tắc |
| --- | --- |
| 1 | **Chỉ `R-ADMIN`** truy cập được; kiểm tra quyền ở máy chủ — `FR-RPT-01` `NFR-SE-05` `DEC-22` |
| 2 | Mọi biểu đồ kèm bảng số liệu tương ứng, không chỉ dựa vào hình — `NFR-UX-09` |
| 3 | Doanh thu tính trên phiếu ở trạng thái *Hoàn tất* hoặc *Đã bàn giao* |
| 4 | Kỳ báo cáo theo UTC+9 — `BR-51` |
| 5 | Tệp xuất chứa đúng dữ liệu đang hiển thị, kèm điều kiện lọc — `AC-26` |
| 6 | Trên 10.000 dòng thì xử lý nền và thông báo khi xong — `NFR-PF-06` |

---

### `SA-37` — Báo cáo doanh thu

| | |
| --- | --- |
| **Loại · Thiết bị** | `X` · PC · **Đường dẫn** `/admin/reports/revenue` · **Yêu cầu** `FR-RPT-06` `FR-RPT-08` `FR-RPT-09` `FR-RPT-10` · **Đợt** MVP |

**Thành phần.** Bộ chọn kỳ và cửa hàng; tách **doanh thu tiền công** và **doanh thu phụ tùng** (`FR-RPT-06`); biểu đồ so sánh kỳ trước; bảng chi tiết theo ngày; **báo cáo khách hàng quay lại**: khách mới · khách cũ · tỷ lệ quay lại (`FR-RPT-08`); bảng phiếu chưa thanh toán; `CP-23` nút xuất Excel và PDF.

**Quy tắc.** Chỉ tính phiếu đã hoàn tất. Doanh thu chưa thu và đã thu được tách riêng để không nhầm lẫn với dòng tiền thực tế.

---

### `SA-38` — Báo cáo phụ tùng & tồn kho

| | |
| --- | --- |
| **Loại · Thiết bị** | `X` · PC · **Đường dẫn** `/admin/reports/parts` · **Yêu cầu** `FR-RPT-07` `FR-PRT-12` · **Đợt** G2 |

**Thành phần.** Bảng **phụ tùng dùng nhiều nhất trong kỳ** (`FR-RPT-07`): mã · tên · số lượng · doanh thu · tồn hiện tại; bảng mặt hàng dưới mức tối thiểu; bảng phụ tùng không phát sinh giao dịch trong 6 tháng; biểu đồ cơ cấu theo nhóm phụ tùng; `CP-23` nút xuất.

---

### `SA-39` — Tài khoản quản trị

| | |
| --- | --- |
| **Loại · Thiết bị** | `L` · PC · **Đường dẫn** `/admin/users` · **Yêu cầu** `FR-USR-01` `FR-USR-05` · **Đợt** MVP |

**Thành phần.** `CP-06` bảng gồm họ tên · email · số điện thoại · cửa hàng phụ trách · lần đăng nhập gần nhất · trạng thái; ô tìm kiếm; lọc theo cửa hàng và trạng thái.

**Hành động.** **Thêm tài khoản** → `SA-40`. Bấm dòng → `SA-40`. **Đặt lại mật khẩu** → `CP-08` (`FR-USR-03`). **Vô hiệu hóa** → `CP-08`. **Buộc đăng xuất** (`FR-USR-05`, G3).

**Quy tắc.** Luôn còn ít nhất một tài khoản quản trị đang hoạt động (`FR-USR-04`). Không tự vô hiệu hóa tài khoản của chính mình.

---

### `SA-40` — Thêm / sửa tài khoản quản trị

| | |
| --- | --- |
| **Loại · Thiết bị** | `F` · PC · **Đường dẫn** `/admin/users/:id/edit` · **Yêu cầu** `FR-USR-02` `FR-USR-03` `FR-USR-04` · **Đợt** MVP |

**Thành phần.** Họ tên (`text`, bắt buộc) · Email (`text`, bắt buộc, duy nhất, dùng để đăng nhập) · Số điện thoại (`tel`) · Cửa hàng phụ trách (`sel`, nhiều giá trị — `OQ-02`) · Mật khẩu ban đầu (`text`, chỉ khi tạo mới) · Trạng thái (`sel`) · Ghi chú (`area`).

**Quy tắc & kiểm tra.** Email duy nhất. Mật khẩu tối thiểu 8 ký tự có chữ và số (`FR-AUTH-10`). Không vô hiệu hóa được tài khoản quản trị cuối cùng đang hoạt động (`FR-USR-04`). Cấu trúc dữ liệu để sẵn chỗ mở rộng thêm vai trò về sau (`FR-USR-06` `OQ-01`).

**Thông báo.** Tài khoản cuối cùng → *"Đây là tài khoản quản trị đang hoạt động duy nhất. Vui lòng tạo tài khoản khác trước khi vô hiệu hóa."*

---

### `SA-41` — Mẫu thông báo

| | |
| --- | --- |
| **Loại · Thiết bị** | `F` · PC · **Đường dẫn** `/admin/notifications/templates` · **Yêu cầu** `FR-NOT-09` `FR-NOT-10` `FR-NOT-11` · **Đợt** MVP |

**Thành phần**

| # | Thành phần | Kiểu | Mô tả |
| --- | --- | :---: | --- |
| 1 | Danh sách loại sự kiện | `sel` | Đặt lịch thành công · Xác nhận lịch hẹn (kèm QR) · Nhắc trước 12 tiếng · Hủy · Đổi lịch · Nhắc bảo dưỡng định kỳ · Gửi báo giá · Hoàn tất phiếu |
| 2 | Kênh gửi | `radio` | SMS / Email |
| 3 | Tiêu đề *(email)* | — | `CP-24` ba ngôn ngữ |
| 4 | Nội dung | — | `CP-24` ba ngôn ngữ — `FR-NOT-11` |
| 5 | Danh sách biến thay thế | `ro` | `{tên_khách}` `{mã_lịch_hẹn}` `{ngày_giờ}` `{cửa_hàng}` `{đường_dẫn_qr}` `{đường_dẫn_đặt_lịch}` `{biển_số}` `{tổng_tiền}` — `FR-NOT-10` |
| 6 | Khung xem trước | `ro` | Hiện nội dung sau khi thay biến bằng dữ liệu mẫu |
| 7 | Đếm ký tự SMS | `ro` | Cảnh báo khi vượt một tin nhắn |

**Quy tắc & kiểm tra**

| # | Quy tắc |
| --- | --- |
| 1 | Mẫu tiếng Nhật bắt buộc; thiếu ngôn ngữ khác thì dùng tiếng Nhật — `BR-52` |
| 2 | Mẫu **Nhắc bảo dưỡng định kỳ** bắt buộc chứa biến `{đường_dẫn_đặt_lịch}` — `BR-47` `FR-NOT-05` |
| 3 | Mẫu **Xác nhận lịch hẹn** bắt buộc chứa biến `{đường_dẫn_qr}` — `FR-NOT-02` `DEC-20` |
| 4 | Chỉ dùng biến có trong danh sách; biến lạ bị chặn khi lưu |
| 5 | SMS nên gói gọn trong một tin nhắn để tiết kiệm chi phí |

**Thông báo.** Thiếu biến bắt buộc → *"Mẫu nhắc bảo dưỡng phải có {đường_dẫn_đặt_lịch} để khách đặt lịch được ngay."* · Biến không hợp lệ → *"Biến {tên} không tồn tại. Vui lòng chọn từ danh sách."*

---

### `SA-42` — Nhật ký gửi thông báo

| | |
| --- | --- |
| **Loại · Thiết bị** | `L` · PC · **Đường dẫn** `/admin/notifications/logs` · **Yêu cầu** `FR-NOT-12` `FR-NOT-13` · **Đợt** MVP |

**Thành phần.** `CP-07` lọc theo kênh · loại sự kiện · kết quả gửi · khoảng ngày · người nhận; `CP-06` bảng gồm thời điểm · kênh · loại · người nhận (số điện thoại che bớt) · nội dung rút gọn · kết quả · số lần thử · thông báo lỗi.

**Hành động.** **Gửi lại** với bản ghi thất bại. Bấm dòng → xem nội dung đầy đủ.

**Quy tắc.** Thất bại được tự thử lại tối đa 3 lần, sau đó đánh dấu lỗi để Admin xử lý tay (`FR-NOT-13`). Số điện thoại và thông tin cá nhân hiển thị che bớt (`NFR-SE-10`). Mỗi sự kiện chỉ gửi một lần cho một người nhận (`BR-49`).

---

### `SA-43` — Cấu hình hệ thống

| | |
| --- | --- |
| **Loại · Thiết bị** | `F` · PC · **Đường dẫn** `/admin/settings` · **Yêu cầu** `FR-SYS-01` `FR-SYS-02` `FR-SYS-07` · **Đợt** G2 |

**Thành phần**

| # | Nhóm | Tham số |
| --- | --- | --- |
| 1 | Lịch hẹn | Số lịch hẹn tối đa đang hoạt động cho một số điện thoại (mặc định 5 — `BR-10`) · Số giờ tự chuyển sang *Khách không đến* (mặc định 24 — `BR-13`) |
| 2 | Thông báo | Thời gian nhắc trước giờ hẹn (**mặc định 12 tiếng**, `DEC-12`) · Thời gian nhắc trước kỳ bảo dưỡng (mặc định 7 ngày) · Khung giờ không gửi SMS (mặc định 21:00–08:00 — `FR-NOT-15`) |
| 3 | Bảo dưỡng | Chu kỳ mặc định theo tháng và theo km (`OQ-10`) |
| 4 | Giá & thuế | Thuế suất (`OQ-13`) · Ngưỡng tổng tiền bắt buộc lập báo giá (`OQ-19`) |
| 5 | Tồn kho | Mức tồn tối thiểu mặc định |
| 6 | Dữ liệu | Thời hạn lưu ảnh và ghi âm chẩn đoán (mặc định 90 ngày — `NFR-SE-09`) |
| 7 | Doanh nghiệp | Tên · địa chỉ · mã số thuế · logo in trên phiếu và báo giá — `FR-SYS-02` |
| 8 | Ngôn ngữ | Ngôn ngữ mặc định (`OQ-17`) |
| 9 | Tiến trình nền | Trạng thái các tiến trình: gửi thông báo · sinh nhắc lịch · xuất báo cáo · dọn tệp quá hạn — `FR-SYS-07` |

**Quy tắc.** Mọi thay đổi ghi nhật ký kèm giá trị trước và sau (`FR-SYS-04`). Thay đổi ảnh hưởng nghiệp vụ phải qua `CP-08`. Tham số mang giá trị mặc định an toàn và có mô tả giải thích ngay cạnh.

---

### `SA-44` — Nhật ký thao tác

| | |
| --- | --- |
| **Loại · Thiết bị** | `L` · PC · **Đường dẫn** `/admin/audit-logs` · **Yêu cầu** `FR-SYS-03`…`FR-SYS-06` · **Đợt** MVP |

**Thành phần.** `CP-07` lọc theo người thực hiện · khoảng thời gian · loại đối tượng (lịch hẹn · phiếu dịch vụ · khách hàng · phụ tùng · cấu hình…) · loại hành động (`FR-SYS-05`); `CP-06` bảng gồm thời điểm · người thực hiện · hành động · đối tượng · mã đối tượng · địa chỉ IP; bấm dòng mở `CP-25` xem giá trị trước và sau (`FR-SYS-04`).

**Quy tắc & kiểm tra.** Nhật ký **chỉ đọc** — không sửa, không xóa qua giao diện (`FR-SYS-06`). Thông tin cá nhân trong nhật ký hiển thị che bớt (`NFR-SE-10`). Xuất Excel để phục vụ kiểm toán.

---

## F. Màn hình hệ thống

Năm màn hình dùng chung cho cả hai site, giữ nguyên đầu trang và chân trang của site tương ứng.

| Mã | Tên | Nội dung hiển thị | Hành động |
| --- | --- | --- | --- |
| `SY-01` | Không tìm thấy trang (404) | Biểu tượng, *"Trang bạn tìm không tồn tại hoặc đã được chuyển đi."* | **Về trang chủ** · **Xem dịch vụ** · **Đặt lịch** |
| `SY-02` | Không có quyền truy cập (403) | *"Bạn không có quyền xem trang này."* — không tiết lộ nội dung hay sự tồn tại của tài nguyên | **Về trang chủ** · **Đăng nhập** |
| `SY-03` | Lỗi hệ thống (500) | *"Hệ thống đang gặp sự cố. Chúng tôi đã ghi nhận và đang xử lý."* kèm **mã truy vết** để báo hỗ trợ | **Thử lại** · **Về trang chủ** · số điện thoại cửa hàng |
| `SY-04` | Đang bảo trì | *"Hệ thống đang bảo trì. Dự kiến hoạt động lại lúc {giờ}."* | Số điện thoại cửa hàng để đặt lịch qua điện thoại |
| `SY-05` | Phiên đăng nhập hết hạn | *"Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại."* | **Đăng nhập lại** — quay về đúng trang trước đó sau khi đăng nhập |

**Quy tắc chung**

| # | Quy tắc |
| --- | --- |
| 1 | Không hiển thị dấu vết lỗi kỹ thuật cho người dùng cuối; chỉ hiện mã truy vết — `NFR-MA-03` |
| 2 | Mọi màn hình lỗi đều có ít nhất một lối đi tiếp, không để người dùng bị kẹt |
| 3 | Đủ ba ngôn ngữ — `FR-I18N-01` |
| 4 | `SY-03` được ghi nhật ký kèm mã truy vết để đối chiếu với nhật ký máy chủ |
| 5 | `SY-04` cấu hình được thời điểm dự kiến hoạt động lại |

---

## G. Danh mục thông báo dùng chung

Các thông báo dùng ở nhiều màn hình. Nội dung viết bằng ngôn ngữ thường ngày, nêu rõ cách khắc phục (`NFR-UX-07`), và có đủ ba ngôn ngữ.

### G.1 Kiểm tra dữ liệu

| Mã | Tình huống | Nội dung |
| --- | --- | --- |
| `MSG-V01` | Bỏ trống trường bắt buộc | *"Vui lòng nhập {tên trường}."* |
| `MSG-V02` | Số điện thoại sai định dạng | *"Số điện thoại chưa đúng. Ví dụ: 090-1234-5678."* |
| `MSG-V03` | Email sai định dạng | *"Địa chỉ email chưa đúng. Ví dụ: ten@example.com."* |
| `MSG-V04` | Vượt số ký tự | *"Nội dung tối đa {n} ký tự. Hiện tại {m}."* |
| `MSG-V05` | Số ngoài khoảng cho phép | *"Giá trị phải từ {min} đến {max}."* |
| `MSG-V06` | Tệp quá lớn | *"Tệp vượt quá {n} MB. Vui lòng chọn tệp nhỏ hơn."* |
| `MSG-V07` | Sai định dạng tệp | *"Chỉ nhận tệp {danh sách định dạng}."* |
| `MSG-V08` | Ngày không hợp lệ | *"Vui lòng chọn ngày từ hôm nay trở đi."* |
| `MSG-V09` | Giá trị đã tồn tại | *"{Tên trường} này đã được sử dụng. Vui lòng dùng giá trị khác."* |

### G.2 Kết quả thao tác

| Mã | Tình huống | Nội dung |
| --- | --- | --- |
| `MSG-S01` | Lưu thành công | *"Đã lưu."* |
| `MSG-S02` | Tạo mới thành công | *"Đã tạo {tên đối tượng}."* |
| `MSG-S03` | Xóa thành công | *"Đã xóa {tên đối tượng}."* |
| `MSG-S04` | Xuất tệp thành công | *"Đã xuất tệp. Bấm để tải về."* |
| `MSG-S05` | Xử lý nền | *"Đang xử lý. Chúng tôi sẽ báo khi hoàn tất."* |

### G.3 Quyền và phiên làm việc

| Mã | Tình huống | Nội dung |
| --- | --- | --- |
| `MSG-A01` | Không đủ quyền | *"Bạn không có quyền thực hiện thao tác này."* → `SY-02` |
| `MSG-A02` | Phiên hết hạn | *"Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại."* → `SY-05` |
| `MSG-A03` | Vượt giới hạn tần suất | *"Bạn thao tác quá nhanh. Vui lòng thử lại sau {n} giây."* — `NFR-SE-04` |

### G.4 Kết nối và dịch vụ ngoài

| Mã | Tình huống | Nội dung |
| --- | --- | --- |
| `MSG-N01` | Mất kết nối mạng | *"Mất kết nối. Dữ liệu bạn nhập đã được giữ lại."* — `NFR-UX-11` |
| `MSG-N02` | Máy chủ không phản hồi | *"Không kết nối được máy chủ. Vui lòng thử lại."* + nút **Thử lại** |
| `MSG-N03` | Dịch vụ AI không phản hồi | *"Trợ lý đang bận. Bạn vẫn tiếp tục được bình thường."* — `NFR-AV-04` |
| `MSG-N04` | Gửi SMS thất bại | *"Gửi tin nhắn thất bại. Hệ thống sẽ tự thử lại."* — `FR-NOT-13` |
| `MSG-N05` | Xung đột dữ liệu | *"Dữ liệu vừa được người khác cập nhật. Vui lòng tải lại trang."* |

### G.5 Xác nhận trước khi thực hiện

| Mã | Tình huống | Nội dung |
| --- | --- | --- |
| `MSG-C01` | Xóa bản ghi | *"Xóa {tên}? Thao tác này không hoàn tác được."* |
| `MSG-C02` | Hủy lịch hẹn | *"Hủy lịch hẹn {mã}? Khách hàng sẽ nhận được thông báo."* |
| `MSG-C03` | Hoàn tất phiếu | *"Hoàn tất phiếu {mã}? Tồn kho sẽ được trừ và phiếu không sửa được nữa."* |
| `MSG-C04` | Rời trang khi chưa lưu | *"Bạn có thay đổi chưa lưu. Rời khỏi trang?"* |
| `MSG-C05` | Gộp hồ sơ | *"Gộp hồ sơ? Toàn bộ xe, lịch hẹn và phiếu dịch vụ sẽ chuyển sang hồ sơ đích. Thao tác không hoàn tác được."* |

---

## Lịch sử phiên bản

| Phiên bản | Ngày | Người sửa | Thay đổi |
| --- | --- | --- | --- |
| 1.0 | 2026-09-14 | Đội tài liệu | Bản đầu tiên — đặc tả đủ 83 màn hình (34 `SC` · 44 `SA` · 5 `SY`), 21/26 thành phần dùng chung được đặc tả riêng (5 thành phần bố cục theo `SM-2026-001` §11), danh mục 27 thông báo dùng chung |

# Danh sách màn hình
## Hệ thống quản lý dịch vụ bảo dưỡng & sửa chữa xe máy AOYAMA

| Hạng mục | Nội dung |
| --- | --- |
| Mã tài liệu | SL-2026-001 |
| Phiên bản | 1.1 (Draft) |
| Ngày lập | 2026-08-25 |
| Tài liệu nguồn | `BD-2026-001` Thiết kế cơ bản, `RD-2026-001` Định nghĩa yêu cầu |
| Tài liệu liên quan | `SS-2026-001` Đặc tả màn hình |
| Trạng thái | Chờ rà soát nội bộ |

---

## 1. Mục đích và cách dùng

Tài liệu này là **danh mục đầy đủ mọi màn hình** của hệ thống, dùng để:

- Ước lượng khối lượng công việc thiết kế giao diện và lập trình.
- Kiểm tra không bỏ sót yêu cầu chức năng nào khi dựng màn hình.
- Làm căn cứ chia đợt bàn giao (chương 6).
- Làm mục lục tra cứu sang `SS-2026-001` để xem đặc tả chi tiết từng màn hình.

Danh sách này **giữ nguyên mã màn hình** đã dùng ở chương 3 của `BD-2026-001`. Khi thêm màn hình mới, cấp mã tiếp theo trong dãy, **không tái sử dụng mã cũ**.

## 2. Quy ước

### 2.1 Mã màn hình

| Dạng mã | Ý nghĩa |
| --- | --- |
| `SCR-C-nn` | Màn hình thuộc **site khách hàng** (Customer) |
| `SCR-A-nn` | Màn hình thuộc **site quản trị** (Admin/CMS) |
| `CMP-nn` | Thành phần dùng chung, xuất hiện trên nhiều màn hình |

### 2.2 Ý nghĩa các cột

| Cột | Giải thích |
| --- | --- |
| **Loại** | `Trang` — có đường dẫn riêng · `Hộp thoại` — mở chồng lên trang khác, không có đường dẫn · `Bước` — một bước trong luồng nhiều bước |
| **Vai trò** | Ai mở được màn hình: Guest · User · Staff · Admin. Ký hiệu ⬤ nghĩa là Staff chỉ thấy dữ liệu cửa hàng mình (`BR-42`, `BR-47`) |
| **Thiết bị** | `SP◎` — bản smartphone là bản gốc · `SP○` — có hỗ trợ SP · `PC◎` — bản PC là bản gốc · `—` không hỗ trợ |
| **Render** | `SSR` · `SPA` · `SSR+noindex` |
| **Ưu tiên** | Lấy theo mức MoSCoW của yêu cầu chức năng gốc |
| **Đặc tả** | Mục tương ứng trong `SS-2026-001` |

### 2.3 Tên miền

| Site | Tên miền (đề xuất) |
| --- | --- |
| Site khách hàng | `aoyama-service.example.jp` |
| Site quản trị | `cms.aoyama-service.example.jp` |

Tên miền thật do khách hàng quyết định; đường dẫn trong tài liệu này là phần sau tên miền.

---

## 3. Tổng quan số lượng

| Nhóm | Trang | Bước | Hộp thoại | Tổng |
| --- | :---: | :---: | :---: | :---: |
| Site khách hàng | 23 | 4 | 1 | **28** |
| Site quản trị (CMS) | 30 | 0 | 2 | **32** |
| **Tổng cộng** | **53** | **4** | **3** | **60** |

| Theo mức ưu tiên | Số lượng |
| --- | :---: |
| Must | 51 |
| Should | 9 |
| Could | 0 |

Không có màn hình nào ở mức *Could*. Ba yêu cầu mức *Could* trong `RD-2026-001` (`FR-NTF-17`, `FR-RPT-05`, và phần lọc nâng cao) đều là **tính năng bổ sung bên trong một màn hình đã có**, không phát sinh màn hình mới.

| Theo thiết bị | Số lượng |
| --- | :---: |
| Bắt buộc có bản SP (`SP◎`) | 28 |
| Tối ưu PC, có hỗ trợ SP (`PC◎` + `SP○`) | 3 |
| Chỉ PC (`PC◎`) | 29 |

Toàn bộ 28 màn hình của site khách hàng đều bắt buộc có bản SP — đây là hệ quả trực tiếp của `NFR-PLT-08` và `AC-34`: **không có chức năng nào dành cho khách mà chỉ chạy được trên PC**.

---

## 4. Danh sách màn hình — Site khách hàng

### 4.1 Nhóm công khai (không cần đăng nhập)

| Mã | Tên màn hình | Đường dẫn | Loại | Vai trò | Thiết bị | Render | Ưu tiên | FR chính | Đặc tả |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCR-C-01 | Trang chủ | `/` | Trang | Guest, User | SP◎ | SSR | Must | `FR-AUT-03` | SS §A.1 |
| SCR-C-02 | Danh sách dịch vụ & bảng giá | `/services` | Trang | Guest, User | SP◎ | SSR | Must | `FR-SRV-01`, `FR-SRV-05` | SS §A.2 |
| SCR-C-03 | Chi tiết dịch vụ | `/services/{id}` | Trang | Guest, User | SP◎ | SSR | Must | `FR-SRV-02`, `FR-SRV-03` | SS §A.3 |
| SCR-C-04 | Danh sách cửa hàng | `/shops` | Trang | Guest, User | SP◎ | SSR | Should | `FR-SHP-05` | SS §A.4 |
| SCR-C-05 | Chi tiết cửa hàng | `/shops/{id}` | Trang | Guest, User | SP◎ | SSR | Should | `FR-SHP-05`, `FR-SHP-28` | SS §A.5 |
| SCR-C-26 | Chatbox AI | `/chat` | Trang | Guest, User | SP◎ | SPA | Must | `FR-AI-01`…`05` | SS §A.26 |

### 4.2 Nhóm tài khoản

| Mã | Tên màn hình | Đường dẫn | Loại | Vai trò | Thiết bị | Render | Ưu tiên | FR chính | Đặc tả |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCR-C-06 | Đăng ký tài khoản | `/register` | Trang | Guest | SP◎ | SSR | Must | `FR-AUT-01` | SS §A.6 |
| SCR-C-07 | Đăng nhập | `/login` | Trang | Guest | SP◎ | SSR | Must | `FR-AUT-02` | SS §A.7 |
| SCR-C-08 | Quên mật khẩu | `/forgot-password` | Trang | Guest | SP◎ | SSR | Should | `FR-AUT-08` | SS §A.8 |
| SCR-C-09 | Đặt lại mật khẩu | `/reset-password` | Trang | Guest | SP◎ | SSR | Should | `FR-AUT-08` | SS §A.9 |
| SCR-C-10 | Hồ sơ cá nhân | `/account/profile` | Trang | User | SP◎ | SSR | Should | `FR-AUT-09` | SS §A.10 |

### 4.3 Nhóm phương tiện

| Mã | Tên màn hình | Đường dẫn | Loại | Vai trò | Thiết bị | Render | Ưu tiên | FR chính | Đặc tả |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCR-C-11 | Danh sách xe của tôi | `/account/vehicles` | Trang | User | SP◎ | SSR | Must | `FR-VEH-01` | SS §A.11 |
| SCR-C-12 | Thêm / sửa xe | `/account/vehicles/new`<br/>`/account/vehicles/{id}/edit` | Trang | User | SP◎ | SSR | Must | `FR-VEH-02` | SS §A.12 |
| SCR-C-24 | Lịch sử bảo dưỡng của xe | `/account/vehicles/{id}/history` | Trang | User | SP◎ | SSR | Must | `FR-BKG-10`, `FR-RPR-04` | SS §A.24 |

### 4.4 Nhóm đặt lịch — luồng 4 bước

Luồng này bị ràng buộc bởi `NFR-UX-03`: **tối đa 3–4 bước**. Bốn màn hình dưới đây là toàn bộ luồng, không được thêm bước thứ năm.

| Mã | Tên màn hình | Đường dẫn | Loại | Vai trò | Thiết bị | Render | Ưu tiên | FR chính | Đặc tả |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCR-C-13 | Đặt lịch B1 — Chọn dịch vụ | `/booking/service` | Bước | Guest, User | SP◎ | SSR | Must | `FR-BKG-01` | SS §A.13 |
| SCR-C-14 | Đặt lịch B2 — Cửa hàng & khung giờ | `/booking/slot` | Bước | Guest, User | SP◎ | SSR | Must | `FR-SHP-03`, `FR-SHP-31`, `FR-BKG-35` | SS §A.14 |
| SCR-C-15 | Đặt lịch B3 — Thông tin khách & xe | `/booking/info` | Bước | Guest, User | SP◎ | SSR | Must | `FR-AUT-04`, `FR-VEH-05` | SS §A.15 |
| SCR-C-16 | Đặt lịch B4 — Xác nhận | `/booking/confirm` | Bước | Guest, User | SP◎ | SSR | Must | `FR-BKG-01` | SS §A.16 |
| SCR-C-17 | Đặt lịch hoàn tất | `/booking/complete` | Trang | Guest, User | SP◎ | SSR | Must | `FR-BKG-04`, `FR-AUT-06` | SS §A.17 |
| SCR-C-25 | Đặt lịch lặp lại | `/account/recurring-plans` | Trang | User | SP◎ | SSR | Must | `FR-BKG-07`, `FR-BKG-14` | SS §A.25 |

### 4.5 Nhóm theo dõi booking

| Mã | Tên màn hình | Đường dẫn | Loại | Vai trò | Thiết bị | Render | Ưu tiên | FR chính | Đặc tả |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCR-C-18 | Booking của tôi | `/account/bookings` | Trang | User | SP◎ | SSR | Must | `FR-BKG-08` | SS §A.18 |
| SCR-C-19 | Chi tiết booking | `/account/bookings/{id}` | Trang | User | SP◎ | SSR | Must | `FR-BKG-08`, `FR-BKG-18` | SS §A.19 |
| SCR-C-20 | Tra cứu bằng link token | `/t/{token}` | Trang | Guest | SP◎ | **SSR+noindex** | Must | `FR-BKG-13`, `NFR-SEC-10` | SS §A.20 |
| SCR-C-21 | Mã QR | `/account/bookings/{id}/qr`<br/>`/t/{token}/qr` | Trang | User, Guest | SP◎ | SSR+noindex | Must | `FR-QRC-02`, `FR-QRC-10` | SS §A.21 |
| SCR-C-22 | Đổi lịch | `/account/bookings/{id}/reschedule`<br/>`/t/{token}/reschedule` | Trang | User, Guest | SP◎ | SSR | Must | `FR-BKG-06` | SS §A.22 |
| SCR-C-23 | Xác nhận hủy booking | (hộp thoại trên SCR-C-19 / SCR-C-20) | Hộp thoại | User, Guest | SP◎ | — | Must | `FR-BKG-05`, `FR-BKG-05a` | SS §A.23 |
| SCR-C-27 | Xem báo giá | `/account/bookings/{id}/quotation` | Trang | User, Guest | SP◎ | SSR | Should | `FR-RPR-02` | SS §A.27 |
| SCR-C-28 | Theo dõi tiến độ sửa chữa | `/account/bookings/{id}/progress` | Trang | User | SP◎ | SSR | Must | `FR-BKG-09`, `FR-RPR-03` | SS §A.28 |

---

## 5. Danh sách màn hình — Site quản trị (CMS)

### 5.1 Nhóm chung

| Mã | Tên màn hình | Đường dẫn | Loại | Vai trò | Thiết bị | Render | Ưu tiên | FR chính | Đặc tả |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCR-A-01 | Đăng nhập CMS | `/login` | Trang | Staff, Admin | PC◎ | SPA | Must | `NFR-PLT-05` | SS §B.1 |
| SCR-A-02 | Dashboard | `/` | Trang | Staff ⬤, Admin | PC◎ | SPA | Should | `FR-BKG-21` | SS §B.2 |
| SCR-A-15 | Danh sách thông báo | `/notifications` | Trang | Staff ⬤, Admin | PC◎ | SPA | Must | `FR-NTF-12`, `FR-NTF-15` | SS §B.15 |

### 5.2 Nhóm quản lý booking

| Mã | Tên màn hình | Đường dẫn | Loại | Vai trò | Thiết bị | Render | Ưu tiên | FR chính | Đặc tả |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCR-A-03 | Danh sách booking | `/bookings` | Trang | Staff ⬤, Admin | PC◎ | SPA | Must | `FR-BKG-11`, `21`, `24`, `29` | SS §B.3 |
| SCR-A-04 | Chi tiết booking | `/bookings/{id}` | Trang | Staff ⬤, Admin | PC◎ | SPA | Must | `FR-BKG-16`, `26`, `27`, `34` | SS §B.4 |
| SCR-A-05 | Tạo booking thay khách | `/bookings/new` | Trang | Staff ⬤, Admin | PC◎ | SPA | Must | `FR-BKG-03`, `FR-SHP-33` | SS §B.5 |
| SCR-A-06 | Đổi lịch / chuyển cửa hàng | `/bookings/{id}/reschedule` | Trang | Staff ⬤, Admin | PC◎ | SPA | Must | `FR-BKG-31`, `FR-SHP-06` | SS §B.6 |
| SCR-A-07 | Hủy booking + chọn lý do | (hộp thoại trên SCR-A-04) | Hộp thoại | Staff ⬤, Admin | PC◎ | — | Must | `FR-BKG-19`, `FR-BKG-23` | SS §B.7 |

### 5.3 Nhóm tiếp nhận xe

| Mã | Tên màn hình | Đường dẫn | Loại | Vai trò | Thiết bị | Render | Ưu tiên | FR chính | Đặc tả |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCR-A-08 | Quét mã QR | `/scan` | Trang | Staff ⬤, Admin | **PC◎ + SP○** | SPA | Must | `FR-QRC-03`, `NFR-PLT-06` | SS §B.8 |
| SCR-A-09 | Màn hình tiếp nhận xe | `/scan/result/{bookingId}` | Trang | Staff ⬤, Admin | **PC◎ + SP○** | SPA | Must | `FR-QRC-04`…`07` | SS §B.9 |
| SCR-A-10 | Tra cứu booking thủ công | `/bookings/search` | Trang | Staff ⬤, Admin | **PC◎ + SP○** | SPA | Must | `FR-QRC-11` | SS §B.10 |

Ba màn hình này là **ngoại lệ duy nhất** của CMS phải dùng được trên thiết bị di động (`NFR-PLT-06`) — lễ tân cầm điện thoại hoặc máy quét ra tận chỗ khách.

### 5.4 Nhóm sửa chữa & thanh toán

| Mã | Tên màn hình | Đường dẫn | Loại | Vai trò | Thiết bị | Render | Ưu tiên | FR chính | Đặc tả |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCR-A-11 | Lập báo giá | `/bookings/{id}/quotation` | Trang | Staff ⬤, Admin | PC◎ | SPA | Must | `FR-RPR-01`, `FR-AI-06` | SS §B.11 |
| SCR-A-12 | Cập nhật tiến độ sửa chữa | `/bookings/{id}/progress` | Trang | Staff ⬤, Admin | PC◎ | SPA | Must | `FR-BKG-17`, `FR-RPR-03` | SS §B.12 |
| SCR-A-13 | Cập nhật thanh toán | (hộp thoại trên SCR-A-04) | Hộp thoại | Staff ⬤, Admin | PC◎ | — | Must | `FR-PAY-01`, `FR-PAY-02` | SS §B.13 |
| SCR-A-14 | Hóa đơn | `/invoices` | Trang | Staff ⬤, Admin | PC◎ | SPA | Must | `FR-PAY-03`, `FR-PAY-04` | SS §B.14 |

### 5.5 Nhóm kho phụ tùng và điều phối

| Mã | Tên màn hình | Đường dẫn | Loại | Vai trò | Thiết bị | Render | Ưu tiên | FR chính | Đặc tả |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCR-A-19 | Tồn kho cửa hàng | `/inventory` | Trang | Staff ⬤, Admin | PC◎ | SPA | Must | `FR-SHP-12`, `FR-SHP-19` | SS §B.19 |
| SCR-A-20 | Tra cứu tồn kho toàn chuỗi | `/inventory/lookup` | Trang | Staff, Admin | PC◎ | SPA | Must | `FR-SHP-13`, `FR-SHP-37` | SS §B.20 |
| SCR-A-21 | Tạo yêu cầu điều phối | `/part-transfers/new` | Trang | Staff ⬤, Admin | PC◎ | SPA | Must | `FR-SHP-14` | SS §B.21 |
| SCR-A-22 | Danh sách yêu cầu điều phối | `/part-transfers` | Trang | Staff ⬤, Admin | PC◎ | SPA | Must | `FR-SHP-15` | SS §B.22 |
| SCR-A-23 | Chi tiết & duyệt yêu cầu | `/part-transfers/{id}` | Trang | Staff ⬤, Admin | PC◎ | SPA | Must | `FR-SHP-21`, `FR-SHP-22` | SS §B.23 |

### 5.6 Nhóm quản trị chuỗi

| Mã | Tên màn hình | Đường dẫn | Loại | Vai trò | Thiết bị | Render | Ưu tiên | FR chính | Đặc tả |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCR-A-16 | Quản lý dịch vụ | `/master/services` | Trang | **Admin** | PC◎ | SPA | Must | `FR-SRV-04`, `FR-SRV-06` | SS §B.16 |
| SCR-A-17 | Quản lý phụ tùng | `/master/parts` | Trang | **Admin** | PC◎ | SPA | Must | `FR-PRT-01`, `FR-PRT-02` | SS §B.17 |
| SCR-A-18 | Nhập phụ tùng bằng AI | `/master/parts/ai-import` | Trang | **Admin** | PC◎ | SPA | Must | `FR-PRT-03`, `FR-AI-08` | SS §B.18 |
| SCR-A-24 | Quản lý cửa hàng | `/master/shops` | Trang | **Admin** | PC◎ | SPA | Must | `FR-SHP-01`, `FR-ADM-07` | SS §B.24 |
| SCR-A-25 | Giờ làm việc & ngày nghỉ | `/master/shops/{id}/schedules` | Trang | **Admin** | PC◎ | SPA | Must | `FR-SHP-28`, `FR-SHP-30` | SS §B.25 |
| SCR-A-26 | Năng lực khung giờ | `/master/shops/{id}/capacities` | Trang | **Admin** | PC◎ | SPA | Must | `FR-SHP-29` | SS §B.26 |
| SCR-A-27 | Bảng tải theo khung giờ | `/capacity-board` | Trang | Staff ⬤, Admin | PC◎ | SPA | Must | `FR-SHP-32`, `FR-SHP-42` | SS §B.27 |
| SCR-A-28 | Quản lý khách hàng | `/customers` | Trang | Staff ⬤, Admin | PC◎ | SPA | Must | `FR-ADM-06`, `FR-BKG-15` | SS §B.28 |
| SCR-A-29 | Người dùng & phân quyền | `/master/staff` | Trang | **Admin** | PC◎ | SPA | Must | `FR-ADM-05`, `FR-SHP-02` | SS §B.29 |
| SCR-A-32 | Danh mục lý do hủy | `/master/cancel-reasons` | Trang | **Admin** | PC◎ | SPA | Should | `FR-BKG-23` | SS §B.32 |

### 5.7 Nhóm báo cáo và AI

| Mã | Tên màn hình | Đường dẫn | Loại | Vai trò | Thiết bị | Render | Ưu tiên | FR chính | Đặc tả |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCR-A-30 | Báo cáo & thống kê | `/reports` | Trang | **Chỉ Admin** | PC◎ | SPA | Must | `FR-RPT-01`…`07`, `DEC-28` | SS §B.30 |
| SCR-A-31 | Trợ lý AI kỹ thuật viên | `/ai-assistant` | Trang | Staff, Admin | PC◎ | SPA | Should ⚠ | `FR-AI-07` | SS §B.31 |

⚠ `SCR-A-31` phụ thuộc `OQ-11` — nếu tài liệu kỹ thuật không có ở dạng số thì màn hình này bị loại khỏi phạm vi. Đã tách thành khối độc lập để bỏ ra mà không ảnh hưởng màn hình khác.

---

## 6. Thành phần dùng chung

Các thành phần dưới đây xuất hiện trên nhiều màn hình, đặc tả một lần và dùng lại.

| Mã | Thành phần | Site | Mô tả | Yêu cầu liên quan |
| --- | --- | --- | --- | --- |
| CMP-01 | Thanh điều hướng khách hàng | Khách | Logo, menu, nút chuyển ngôn ngữ, nút Đặt lịch | `NFR-I18N-02` |
| CMP-02 | Chân trang | Khách | Thông tin công ty, liên kết cửa hàng | — |
| CMP-03 | Bộ chuyển ngôn ngữ | Cả hai | Ja / Vi / En, lưu vào hồ sơ và `localStorage` | `NFR-I18N-02` |
| CMP-04 | Thẻ booking | Khách | Dùng lại ở SCR-C-18, SCR-C-19 — dạng thẻ thay bảng trên SP | `NFR-UX-08` |
| CMP-05 | Bộ chọn khung giờ | Khách | Lịch + danh sách khung giờ, **chỉ hiện khung còn chỗ** | `FR-SHP-31` |
| CMP-06 | Chỉ báo trạng thái booking | Cả hai | 5 trạng thái, màu và nhãn thống nhất | `FR-BKG-18` |
| CMP-07 | Thanh điều hướng CMS | CMS | Menu bên, **badge số thông báo chưa đọc** | `FR-NTF-11` |
| CMP-08 | Bảng dữ liệu CMS | CMS | Phân trang, sắp xếp, lọc, xuất dữ liệu | — |
| CMP-09 | Hộp thoại xác nhận | Cả hai | Mẫu chung cho mọi thao tác cần xác nhận | — |
| CMP-10 | Thông báo lỗi | Cả hai | Hiển thị thông điệp theo mã `ERR-xx`, ngôn ngữ đời thường | `NFR-UX-04` |
| CMP-11 | Trạng thái rỗng | Cả hai | Khi danh sách không có dữ liệu, kèm gợi ý hành động | — |
| CMP-12 | Trạng thái đang tải | Cả hai | Skeleton cho trang, spinner cho thao tác; AI có thanh tiến trình | `NFR-PRF-02` |

---

## 7. Ma trận màn hình × vai trò

| Nhóm màn hình | Guest | User | Staff | Admin |
| --- | :---: | :---: | :---: | :---: |
| Công khai (SCR-C-01…05, 26) | ✔ | ✔ | — | — |
| Tài khoản (SCR-C-06…10) | ✔ | ✔ | — | — |
| Phương tiện (SCR-C-11, 12, 24) | — | ✔ | — | — |
| Đặt lịch (SCR-C-13…17) | ✔ | ✔ | — | — |
| Đặt lịch lặp lại (SCR-C-25) | — | ✔ | — | — |
| Booking của tôi (SCR-C-18, 19, 28) | — | ✔ | — | — |
| Tra cứu token (SCR-C-20…23, 27) | ✱ | ✔ | — | — |
| CMS chung (SCR-A-01, 02, 15) | — | — | ⬤ | ✔ |
| Booking CMS (SCR-A-03…07) | — | — | ⬤ | ✔ |
| Tiếp nhận xe (SCR-A-08…10) | — | — | ⬤ | ✔ |
| Sửa chữa & thanh toán (SCR-A-11…14) | — | — | ⬤ | ✔ |
| Kho & điều phối (SCR-A-19, 21…23) | — | — | ⬤ | ✔ |
| Tra cứu tồn kho toàn chuỗi (SCR-A-20) | — | — | ✔ | ✔ |
| Bảng tải khung giờ (SCR-A-27) | — | — | ⬤ | ✔ |
| Khách hàng (SCR-A-28) | — | — | ⬤ | ✔ |
| Danh mục & cấu hình (SCR-A-16…18, 24…26, 29, 32) | — | — | **—** | ✔ |
| Báo cáo (SCR-A-30) | — | — | **—** | ✔ |
| Trợ lý AI (SCR-A-31) | — | — | ✔ | ✔ |

**Chú thích:** ✔ đầy đủ · ⬤ chỉ trong phạm vi cửa hàng mình · ✱ qua link token, không qua đăng nhập · — không truy cập được.

**Mười một màn hình chỉ Admin mới mở được:**

- **Mười màn hình cấu hình** có ảnh hưởng ra ngoài phạm vi một cửa hàng — bảng giá dùng chung toàn chuỗi (`BR-48`), cấu hình cửa hàng, phân quyền: `SCR-A-16`…`18`, `SCR-A-24`…`26`, `SCR-A-29`, `SCR-A-32`.
- **Màn hình báo cáo** `SCR-A-30` — theo `DEC-28`, Staff **không** xem được báo cáo, kể cả của chính cửa hàng mình (`FR-RPT-01`, `BR-08`).

Ngược lại, **cập nhật trạng thái thanh toán** (`SCR-A-13`) thì Staff **làm được** trong cửa hàng mình (`BR-07`, `DEC-28`) — đây là thao tác hằng ngày tại quầy. Hai quyền này đi theo hai hướng ngược nhau nên dễ bị gộp nhầm.

---

## 8. Đề xuất thứ tự triển khai

Chia theo đợt để có thể chạy thử nghiệp vụ sớm. Mỗi đợt là một lát cắt dọc chạy được từ đầu đến cuối, không phải một tầng kỹ thuật.

### Đợt 1 — Luồng đặt lịch tối thiểu (16 màn hình)

Mục tiêu: khách đặt được lịch, nhân viên xác nhận được, khách đến quét QR được.

`SCR-C-01` `SCR-C-02` `SCR-C-03` `SCR-C-13` `SCR-C-14` `SCR-C-15` `SCR-C-16` `SCR-C-17` `SCR-C-20` `SCR-C-21` `SCR-C-23`
`SCR-A-01` `SCR-A-03` `SCR-A-04` `SCR-A-08` `SCR-A-09`

Nghiệm thu được: `AC-01`, `AC-02`…`AC-02m`, `AC-03`, `AC-04`…`AC-04c`.

### Đợt 2 — Vận hành cửa hàng (13 màn hình)

`SCR-C-19` `SCR-C-22` `SCR-C-27` `SCR-C-28`
`SCR-A-05` `SCR-A-06` `SCR-A-07` `SCR-A-10` `SCR-A-11` `SCR-A-12` `SCR-A-13` `SCR-A-14` `SCR-A-15`

Nghiệm thu được: `AC-05`…`AC-09`.

### Đợt 3 — Tài khoản và chuỗi cửa hàng (17 màn hình)

`SCR-C-06`…`SCR-C-12` `SCR-C-18` `SCR-C-24` `SCR-C-25`
`SCR-A-24`…`SCR-A-27` `SCR-A-28` `SCR-A-29` `SCR-A-32`

Nghiệm thu được: `AC-12`, `AC-24`…`AC-33`.

### Đợt 4 — Kho phụ tùng và điều phối (9 màn hình)

`SCR-C-04` `SCR-C-05`
`SCR-A-16` `SCR-A-17` `SCR-A-19` `SCR-A-20`…`SCR-A-23`

Nghiệm thu được: `AC-13`…`AC-23`.

### Đợt 5 — AI và báo cáo (5 màn hình)

`SCR-C-26` `SCR-A-02` `SCR-A-18` `SCR-A-30` `SCR-A-31` ⚠

Nghiệm thu được: `AC-10`, `AC-11`.

> Thứ tự trên là **đề xuất của đội phát triển**, chưa được khách hàng chốt. `SCR-A-31` nằm ở đợt cuối vì phụ thuộc `OQ-11`.

---

## 9. Đối chiếu độ phủ yêu cầu

Bảng dưới xác nhận mọi nhóm yêu cầu chức năng đều có ít nhất một màn hình thực hiện.

| Nhóm FR | Số FR | Màn hình thực hiện | Đủ phủ |
| --- | :---: | --- | :---: |
| `FR-AUT` | 9 | SCR-C-06…10, SCR-A-01 | ✔ |
| `FR-VEH` | 6 | SCR-C-11, 12, 15, 24 | ✔ |
| `FR-SRV` | 7 | SCR-C-02, 03, SCR-A-16 | ✔ |
| `FR-BKG` | 37 | SCR-C-13…25, 28, SCR-A-03…07 | ✔ |
| `FR-QRC` | 12 | SCR-C-21, SCR-A-08…10 | ✔ |
| `FR-RPR` | 4 | SCR-C-27, 28, SCR-A-11, 12 | ✔ |
| `FR-PRT` | 4 | SCR-A-17, 18 | ✔ |
| `FR-SHP` | 42 | SCR-C-04, 05, 14, SCR-A-19…27 | ✔ |
| `FR-PAY` | 4 | SCR-A-13, 14 | ✔ |
| `FR-NTF` | 26 | SCR-A-15 + kênh SMS/email (không phải màn hình) | ✔ |
| `FR-RPT` | 7 | SCR-A-30 | ✔ |
| `FR-AI` | 10 | SCR-C-26, SCR-A-11, 18, 31 | ✔ |
| `FR-ADM` | 7 | SCR-A-24, 28, 29, 32 | ✔ |

**Lưu ý về `FR-NTF`:** phần lớn 26 yêu cầu của nhóm này là **kênh gửi ra ngoài** (SMS/email) và **tiến trình chạy nền**, không có màn hình tương ứng. Chỉ nhóm thông báo trong CMS (`FR-NTF-08`…`17`) có màn hình là `SCR-A-15`. Chi tiết xem chương 8 và 9 của `BD-2026-001`.

---

## 10. Lịch sử phiên bản

| Phiên bản | Ngày | Người lập | Nội dung |
| --- | --- | --- | --- |
| 1.1 | 2026-08-25 | Đội phát triển | Cập nhật theo `DEC-28`: `SCR-A-30` chuyển thành **chỉ Admin**; sửa ma trận vai trò chương 7 và ghi chú về nhóm màn hình chỉ Admin |
| 1.0 | 2026-08-25 | Đội phát triển | Bản đầu tiên. 60 màn hình (28 khách + 32 CMS), 12 thành phần dùng chung, ma trận vai trò, đề xuất 5 đợt triển khai, đối chiếu độ phủ 175 yêu cầu chức năng |

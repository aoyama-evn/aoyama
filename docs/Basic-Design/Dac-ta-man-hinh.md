# Đặc tả màn hình
## Hệ thống quản lý dịch vụ bảo dưỡng & sửa chữa xe máy AOYAMA

| Hạng mục | Nội dung |
| --- | --- |
| Mã tài liệu | SS-2026-001 |
| Phiên bản | 1.1 (Draft) |
| Ngày lập | 2026-08-25 |
| Tài liệu nguồn | `SL-2026-001` Danh sách màn hình, `BD-2026-001` Thiết kế cơ bản, `RD-2026-001` Định nghĩa yêu cầu |
| Trạng thái | Chờ rà soát nội bộ |

---

## 1. Cách đọc tài liệu

### 1.1 Mẫu đặc tả

Mỗi màn hình được mô tả theo cùng một khuôn:

| Phần | Nội dung |
| --- | --- |
| **Bảng thuộc tính** | Đường dẫn, vai trò truy cập, thiết bị, API sử dụng, yêu cầu chức năng gốc |
| **Thành phần màn hình** | Từng phần tử: loại, bắt buộc hay không, quy tắc nhập liệu và hiển thị |
| **Hành động** | Từng nút bấm: điều kiện hiển thị, xử lý, màn hình chuyển tới |
| **Quy tắc nghiệp vụ** | Ràng buộc riêng của màn hình, có dẫn chiếu sang `BR-xx` |
| **Thông báo lỗi** | Các mã `ERR-xx` màn hình có thể gặp và câu chữ hiển thị |

Phần nào không có nội dung thì bỏ qua, không ghi "không có".

### 1.2 Ký hiệu loại thành phần

| Ký hiệu | Nghĩa |
| --- | --- |
| `Nhãn` | Chỉ hiển thị, không nhập |
| `Text` `Số` `SĐT` `Email` `Mật khẩu` | Ô nhập một dòng |
| `Vùng văn bản` | Ô nhập nhiều dòng |
| `Chọn` `Chọn nhiều` | Danh sách chọn |
| `Ngày` `Giờ` | Bộ chọn ngày / giờ |
| `Bật tắt` | Công tắc hai trạng thái |
| `Tệp` | Tải tệp lên |
| `Bảng` `Thẻ` | Vùng hiển thị danh sách |
| `Nút` | Nút hành động |

### 1.3 Quy ước chung áp dụng cho mọi màn hình

Những quy tắc dưới đây **không lặp lại ở từng màn hình**.

**Kiểm tra dữ liệu nhập**

| Trường | Quy tắc |
| --- | --- |
| Số điện thoại | Định dạng Nhật Bản, 10–11 chữ số, cho phép dấu gạch. Ô nhập mở **bàn phím số** (`NFR-UX-07`) |
| Email | Định dạng chuẩn RFC 5322, tối đa 254 ký tự |
| Mật khẩu | Tối thiểu 8 ký tự, có ít nhất một chữ và một số |
| Biển số xe | Tối đa 20 ký tự |
| Trường bắt buộc | Đánh dấu bằng dấu **✱** màu đỏ ngay cạnh nhãn |
| Thời điểm kiểm tra | Kiểm tra khi rời khỏi ô, kiểm tra lại toàn bộ khi bấm nút gửi |

**Trạng thái màn hình**

| Trạng thái | Cách thể hiện |
| --- | --- |
| Đang tải | Khung xám dạng skeleton cho nội dung trang; vòng xoay cho thao tác (`CMP-12`) |
| Danh sách rỗng | Hình minh họa + câu gợi ý hành động (`CMP-11`) |
| Lỗi mạng | Thông báo kèm nút "Thử lại", không mất dữ liệu đã nhập |
| Đang gửi | Vô hiệu hóa nút gửi, tránh bấm hai lần |

**Ngôn ngữ và thời gian**

- Mọi chữ trên màn hình lấy từ tệp dịch, không viết cứng (`NFR-I18N-01`).
- Ngày giờ hiển thị theo `Asia/Tokyo`, định dạng theo ngôn ngữ đang chọn (`NFR-I18N-03`).
- Thông báo lỗi dùng **ngôn ngữ đời thường**, không có thuật ngữ kỹ thuật (`NFR-UX-04`).

**Riêng site khách hàng** (`DEC-27`)

- Bố cục một cột, không cuộn ngang ở bề rộng 375 px (`NFR-UX-05`).
- Vùng bấm tối thiểu 44 × 44 px (`NFR-UX-06`).
- Nút hành động chính đặt cố định ở đáy màn hình trên SP, trong tầm ngón cái.
- Danh sách nhiều dữ liệu hiển thị dạng **thẻ**, không dùng bảng nhiều cột (`NFR-UX-08`).

**Riêng site quản trị**

- Mọi màn hình có dữ liệu theo cửa hàng đều bị `ShopScopeGuard` lọc ở phía máy chủ. Staff **không bao giờ** nhận được dữ liệu cửa hàng khác, kể cả khi sửa tham số trên trình duyệt (`FR-SHP-36`).
- Bảng dữ liệu mặc định 20 dòng mỗi trang, có sắp xếp và lọc (`CMP-08`).

---

# PHẦN A — SITE KHÁCH HÀNG

## A.1 — `SCR-C-01` Trang chủ

| | |
| --- | --- |
| Đường dẫn | `/` |
| Vai trò | Guest, User |
| Thiết bị | SP◎ / PC |
| API | `GET /services` (rút gọn) |
| FR | `FR-AUT-03` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Thanh điều hướng | `CMP-01` | Logo, menu, bộ chuyển ngôn ngữ (`CMP-03`) |
| 2 | Khối mở đầu | `Nhãn` | Một câu giới thiệu dịch vụ + **nút Đặt lịch nổi bật** |
| 3 | Ba dịch vụ tiêu biểu | `Thẻ` | Tên, mô tả ngắn, giá tham khảo |
| 4 | Khối "Đặt lịch trong 4 bước" | `Nhãn` | Minh họa quy trình, trấn an người dùng lớn tuổi |
| 5 | Khối cửa hàng gần bạn | `Thẻ` | Tối đa 3 cửa hàng, dẫn sang `SCR-C-04` |
| 6 | Nút mở chatbox | `Nút` | Nút tròn cố định góc dưới phải |
| 7 | Chân trang | `CMP-02` | |

**Hành động**

| Nút | Xử lý | Chuyển tới |
| --- | --- | --- |
| Đặt lịch ngay | Bắt đầu luồng đặt lịch | `SCR-C-13` |
| Xem tất cả dịch vụ | | `SCR-C-02` |
| Xem cửa hàng | | `SCR-C-04` |
| Đăng nhập | | `SCR-C-07` |
| Biểu tượng chat | Mở chatbox | `SCR-C-26` |

**Quy tắc nghiệp vụ**

- Guest xem được toàn bộ trang này mà **không cần đăng nhập** (`FR-AUT-03`).
- Nút Đặt lịch phải nhìn thấy được ngay khi mở trang trên SP, không phải cuộn xuống.

---

## A.2 — `SCR-C-02` Danh sách dịch vụ & bảng giá

| | |
| --- | --- |
| Đường dẫn | `/services` |
| Vai trò | Guest, User |
| Thiết bị | SP◎ / PC |
| API | `GET /services` |
| FR | `FR-SRV-01`, `FR-SRV-05` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Bộ lọc nhóm dịch vụ | `Chọn` | Tất cả / Bảo dưỡng / Sửa chữa (`FR-SRV-01`) |
| 2 | Danh sách dịch vụ | `Thẻ` | Mỗi thẻ: tên, mô tả ngắn, **giá tham khảo**, nút Đặt lịch |
| 3 | Ghi chú về giá | `Nhãn` | "Giá tham khảo. Chi phí cuối cùng theo báo giá tại cửa hàng." |

**Hành động**

| Nút | Xử lý | Chuyển tới |
| --- | --- | --- |
| Thẻ dịch vụ | | `SCR-C-03` |
| Đặt lịch (trên thẻ) | Chọn sẵn dịch vụ này | `SCR-C-13` |

**Quy tắc nghiệp vụ**

- Giá hiển thị là **giá chung toàn chuỗi**, không phụ thuộc cửa hàng (`FR-SRV-06`, `BR-32`). Không hiển thị bộ chọn cửa hàng ở màn hình này.
- Tên dịch vụ lấy theo ngôn ngữ đang chọn từ trường đa ngữ.

---

## A.3 — `SCR-C-03` Chi tiết dịch vụ

| | |
| --- | --- |
| Đường dẫn | `/services/{id}` |
| Vai trò | Guest, User |
| Thiết bị | SP◎ / PC |
| API | `GET /services/{id}` |
| FR | `FR-SRV-02`, `FR-SRV-03` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Tên và mô tả dịch vụ | `Nhãn` | |
| 2 | Bảng giá theo điều kiện | `Bảng` | **Bảo dưỡng:** giá theo *loại nhiên liệu* (`FR-SRV-02`)<br/>**Sửa chữa:** giá theo *mức độ lỗi* dễ / khó (`FR-SRV-03`) |
| 3 | Hạng mục bao gồm | `Nhãn` | Danh sách gạch đầu dòng |
| 4 | Phụ tùng thường dùng | `Nhãn` | Tên và giá tham khảo |
| 5 | Nút Đặt lịch | `Nút` | Cố định đáy màn hình trên SP |

**Quy tắc nghiệp vụ**

- Chi phí thực tế = phí dịch vụ + chi phí phụ tùng sử dụng (`BR-06`). Màn hình phải nói rõ đây là giá tham khảo.
- Trên SP, bảng giá nhiều cột chuyển sang dạng thẻ để không cuộn ngang (`NFR-UX-08`).

---

## A.4 — `SCR-C-04` Danh sách cửa hàng

| | |
| --- | --- |
| Đường dẫn | `/shops` |
| Vai trò | Guest, User |
| Thiết bị | SP◎ / PC |
| API | `GET /shops` |
| FR | `FR-SHP-05` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Ô tìm theo tên hoặc khu vực | `Text` | |
| 2 | Danh sách cửa hàng | `Thẻ` | Tên, **địa chỉ**, số điện thoại, **giờ mở cửa hôm nay** |
| 3 | Nhãn trạng thái | `Nhãn` | "Đang mở cửa" / "Đã đóng cửa" / "Hôm nay nghỉ" — tính từ `shop_schedules` |

**Hành động**

| Nút | Xử lý | Chuyển tới |
| --- | --- | --- |
| Thẻ cửa hàng | | `SCR-C-05` |
| Đặt lịch tại đây | Chọn sẵn cửa hàng này | `SCR-C-13` |
| Gọi điện | Mở ứng dụng gọi trên SP | — |

**Quy tắc nghiệp vụ**

- ⚠ `OQ-36` — chưa chốt việc có **gợi ý cửa hàng gần nhất theo vị trí** hay không. Thiết kế hiện chỉ liệt kê để khách tự chọn; nếu bật tính năng định vị thì bổ sung nút "Tìm gần tôi" ở đầu danh sách.

---

## A.5 — `SCR-C-05` Chi tiết cửa hàng

| | |
| --- | --- |
| Đường dẫn | `/shops/{id}` |
| Vai trò | Guest, User |
| Thiết bị | SP◎ / PC |
| API | `GET /shops/{id}` |
| FR | `FR-SHP-05`, `FR-SHP-28` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Tên, địa chỉ, số điện thoại | `Nhãn` | |
| 2 | Bản đồ | `Nhãn` | Ảnh tĩnh hoặc nhúng, có nút mở ứng dụng bản đồ |
| 3 | Bảng giờ làm việc | `Bảng` | Theo từng thứ trong tuần (`FR-SHP-28`) |
| 4 | Ngày nghỉ sắp tới | `Nhãn` | Lấy từ `shop_schedules` bản ghi ngày cụ thể (`FR-SHP-30`) |
| 5 | Nút Đặt lịch tại cửa hàng này | `Nút` | |

---

## A.6 — `SCR-C-06` Đăng ký tài khoản

| | |
| --- | --- |
| Đường dẫn | `/register` |
| Vai trò | Guest |
| Thiết bị | SP◎ / PC |
| API | `POST /auth/register` |
| FR | `FR-AUT-01`, `FR-AUT-06` |

**Thành phần màn hình**

| # | Thành phần | Loại | Bắt buộc | Quy tắc |
| --- | --- | --- | :---: | --- |
| 1 | Họ tên | `Text` | ✱ | Tối đa 100 ký tự |
| 2 | Số điện thoại | `SĐT` | ✱ | Là khóa nhận diện khách hàng (`BR-12`) |
| 3 | Email | `Email` | — | Tùy chọn |
| 4 | Mật khẩu | `Mật khẩu` | ✱ | Có nút hiện/ẩn mật khẩu |
| 5 | Ngôn ngữ hiển thị | `Chọn` | ✱ | Mặc định theo ngôn ngữ đang dùng |
| 6 | Đồng ý điều khoản | `Bật tắt` | ✱ | |

**Hành động**

| Nút | Xử lý | Chuyển tới |
| --- | --- | --- |
| Đăng ký | Tạo tài khoản, đăng nhập luôn | `SCR-C-18` |
| Đã có tài khoản | | `SCR-C-07` |

**Quy tắc nghiệp vụ**

- Đăng ký là **tùy chọn**, không phải điều kiện để đặt lịch (`FR-AUT-05`, `DEC-01`). Màn hình phải nêu rõ lợi ích: quản lý nhiều xe, xem lịch sử bảo dưỡng, đặt lịch lặp lại.
- ⚠ `OQ-16` — khi số điện thoại đăng ký **trùng với số đã dùng đặt lịch trước đó**, hệ thống hiện **chưa tự gom** booking và xe cũ vào tài khoản mới, vì cần xác thực OTP để tránh chiếm đoạt dữ liệu người khác. Màn hình hiển thị dòng: *"Chúng tôi thấy số điện thoại này đã từng đặt lịch. Xin liên hệ cửa hàng để gộp lịch sử."*

**Thông báo lỗi**

| Mã | Câu chữ hiển thị |
| --- | --- |
| 409 | "Số điện thoại này đã có tài khoản. Quý khách đăng nhập giúp chúng tôi." |

---

## A.7 — `SCR-C-07` Đăng nhập

| | |
| --- | --- |
| Đường dẫn | `/login` |
| Vai trò | Guest |
| Thiết bị | SP◎ / PC |
| API | `POST /auth/login` |
| FR | `FR-AUT-02` |

**Thành phần màn hình**

| # | Thành phần | Loại | Bắt buộc | Quy tắc |
| --- | --- | --- | :---: | --- |
| 1 | Email hoặc số điện thoại | `Text` | ✱ | **Một ô duy nhất**, hệ thống tự nhận dạng (`FR-AUT-02`) |
| 2 | Mật khẩu | `Mật khẩu` | ✱ | |
| 3 | Ghi nhớ đăng nhập | `Bật tắt` | — | |

**Hành động**

| Nút | Xử lý | Chuyển tới |
| --- | --- | --- |
| Đăng nhập | Cấp access token + refresh token | `SCR-C-18` |
| Quên mật khẩu | | `SCR-C-08` |
| Chưa có tài khoản | | `SCR-C-06` |
| Đặt lịch không cần đăng nhập | | `SCR-C-13` |

**Quy tắc nghiệp vụ**

- Dùng **một ô nhập chung** cho email và số điện thoại thay vì bắt khách chọn loại — giảm một bước thao tác cho người lớn tuổi (`NFR-UX-01`).
- Nút "Đặt lịch không cần đăng nhập" phải luôn hiện, để màn hình đăng nhập không trở thành rào cản (`DEC-01`).

**Thông báo lỗi**

| Mã | Câu chữ hiển thị |
| --- | --- |
| `ERR-AUT-01` | "Thông tin đăng nhập chưa đúng. Xin quý khách kiểm tra lại." |

---

## A.8 — `SCR-C-08` Quên mật khẩu

| | |
| --- | --- |
| Đường dẫn | `/forgot-password` |
| Vai trò | Guest |
| API | `POST /auth/forgot-password` |
| FR | `FR-AUT-08` |

**Thành phần:** một ô nhập email hoặc số điện thoại ✱, nút Gửi link đặt lại.

**Quy tắc nghiệp vụ**

- Phản hồi **luôn giống nhau** dù tài khoản có tồn tại hay không, để không lộ danh sách người dùng: *"Nếu thông tin quý khách nhập có trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu."*
- Nếu nhập số điện thoại thì gửi qua SMS; nếu nhập email thì gửi qua email.
- Link đặt lại có hiệu lực **60 phút** — khác với token tra cứu booking vốn không hết hạn (`BR-15`).

---

## A.9 — `SCR-C-09` Đặt lại mật khẩu

| | |
| --- | --- |
| Đường dẫn | `/reset-password?token=...` |
| Vai trò | Guest |
| API | `POST /auth/reset-password` |
| FR | `FR-AUT-08` |

**Thành phần:** mật khẩu mới ✱, nhập lại mật khẩu ✱, nút Xác nhận.

**Quy tắc nghiệp vụ**

- Token hết hạn hoặc đã dùng thì hiện màn hình lỗi kèm nút quay lại `SCR-C-08`.
- Sau khi đổi thành công, **thu hồi toàn bộ refresh token** đang có của tài khoản.

---

## A.10 — `SCR-C-10` Hồ sơ cá nhân

| | |
| --- | --- |
| Đường dẫn | `/account/profile` |
| Vai trò | User |
| API | `GET /me`, `PATCH /me` |
| FR | `FR-AUT-09` |

**Thành phần màn hình**

| # | Thành phần | Loại | Bắt buộc | Quy tắc |
| --- | --- | --- | :---: | --- |
| 1 | Họ tên | `Text` | ✱ | |
| 2 | Số điện thoại | `SĐT` | ✱ | ⚠ Đổi số điện thoại ảnh hưởng khóa nhận diện (`BR-12`) — cần xác nhận lại |
| 3 | Email | `Email` | — | |
| 4 | Ngôn ngữ hiển thị | `Chọn` | ✱ | Đổi ở đây cũng đổi ngôn ngữ SMS/email (`FR-NTF-05`) |
| 5 | Đổi mật khẩu | `Nút` | — | Mở hộp thoại riêng |

**Quy tắc nghiệp vụ**

- Vì số điện thoại là khóa nhận diện khách hàng (`BR-12`), thao tác đổi số phải hiện cảnh báo: *"Số điện thoại là cách chúng tôi nhận ra quý khách và gửi thông báo. Quý khách chắc chắn muốn đổi?"*

---

## A.11 — `SCR-C-11` Danh sách xe của tôi

| | |
| --- | --- |
| Đường dẫn | `/account/vehicles` |
| Vai trò | User |
| API | `GET /vehicles`, `DELETE /vehicles/{id}` |
| FR | `FR-VEH-01` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Danh sách xe | `Thẻ` | Mỗi thẻ: hãng + model, biển số, loại nhiên liệu, **lần bảo dưỡng gần nhất** |
| 2 | Nhắc bảo dưỡng | `Nhãn` | Hiện trên thẻ khi sắp đến kỳ bảo dưỡng (`FR-NTF-03`) |
| 3 | Nút Thêm xe | `Nút` | |
| 4 | Trạng thái rỗng | `CMP-11` | "Quý khách chưa thêm xe nào" + nút Thêm xe |

**Hành động**

| Nút | Xử lý | Chuyển tới |
| --- | --- | --- |
| Thêm xe | | `SCR-C-12` |
| Sửa | | `SCR-C-12` |
| Xem lịch sử | | `SCR-C-24` |
| Đặt lịch cho xe này | Chọn sẵn xe | `SCR-C-13` |
| Xóa | Hộp thoại xác nhận (`CMP-09`) | — |

**Quy tắc nghiệp vụ**

- Xe **đang gắn với booking chưa hoàn tất** thì không xóa được. Hiện thông báo: *"Xe này đang có lịch hẹn. Xin hủy lịch hẹn trước khi xóa xe."*
- Xóa xe là **xóa mềm** — lịch sử bảo dưỡng vẫn tra lại được (`TKD-12`).

---

## A.12 — `SCR-C-12` Thêm / sửa xe

| | |
| --- | --- |
| Đường dẫn | `/account/vehicles/new` · `/account/vehicles/{id}/edit` |
| Vai trò | User |
| API | `POST /vehicles`, `PATCH /vehicles/{id}` |
| FR | `FR-VEH-02`, `FR-VEH-03` |

**Thành phần màn hình**

| # | Thành phần | Loại | Bắt buộc | Quy tắc |
| --- | --- | --- | :---: | --- |
| 1 | Loại xe | `Chọn` | ✱ | **Không giới hạn chủng loại** (`FR-VEH-03`) |
| 2 | Hãng | `Chọn` | ✱ | Có mục "Khác" cho phép nhập tay |
| 3 | Model | `Text` | ✱ | |
| 4 | Biển số | `Text` | ✱ | |
| 5 | Loại nhiên liệu | `Chọn` | ✱ | Là căn cứ tính giá bảo dưỡng (`FR-SRV-02`) |
| 6 | Năm sản xuất | `Chọn` | — | |
| 7 | Số km hiện tại | `Số` | — | Phục vụ `FR-AI-09` ⚠ `OQ-08` |

**Quy tắc nghiệp vụ**

- Ưu tiên **chọn từ danh sách** thay vì gõ tay ở mọi trường có thể (`NFR-UX-07`).
- Biển số không cần là duy nhất trong hệ thống — hai khách có thể nhập nhầm giống nhau, nghiệp vụ không phụ thuộc vào tính duy nhất này.

---

## A.13 — `SCR-C-13` Đặt lịch B1: Chọn dịch vụ

| | |
| --- | --- |
| Đường dẫn | `/booking/service` |
| Vai trò | Guest, User |
| Thiết bị | SP◎ / PC |
| API | `GET /services` |
| FR | `FR-BKG-01`, `FR-BKG-02` |

**Thành phần màn hình**

| # | Thành phần | Loại | Bắt buộc | Quy tắc |
| --- | --- | --- | :---: | --- |
| 1 | Chỉ báo bước | `Nhãn` | | "Bước 1 / 4" — hiện ở mọi bước |
| 2 | Chọn loại dịch vụ | `Chọn nhiều` | ✱ | **Bảo dưỡng · Sửa chữa · cả hai** (`FR-BKG-01`) |
| 3 | Danh sách hạng mục bảo dưỡng | `Chọn nhiều` | — | Hiện khi đã chọn Bảo dưỡng |
| 4 | Mô tả tình trạng xe | `Vùng văn bản` | — | Hiện khi đã chọn Sửa chữa; tối đa 1.000 ký tự |
| 5 | Nút mở chatbox mô tả lỗi | `Nút` | — | Dẫn sang `SCR-C-26`, kết quả đổ ngược về ô số 4 |
| 6 | Nút Tiếp tục | `Nút` | | Cố định đáy màn hình trên SP |

**Hành động**

| Nút | Điều kiện hiện | Xử lý | Chuyển tới |
| --- | --- | --- | --- |
| Tiếp tục | Đã chọn ít nhất một loại dịch vụ | Lưu vào phiên đặt lịch | `SCR-C-14` |
| Mô tả bằng chatbox | Luôn | | `SCR-C-26` |

**Quy tắc nghiệp vụ**

- Một lần đặt có thể chọn **bảo dưỡng, sửa chữa, hoặc cả hai** (`BR-01`).
- **Không giới hạn thời gian đặt trước** (`FR-BKG-02`, `BR-02`) — không có ràng buộc "phải đặt trước N ngày".
- Dịch vụ **không có thuộc tính thời lượng** (`BR-41`, `DEC-25`), nên việc chọn nhiều hạng mục **không** làm thay đổi số khung giờ bị chiếm.

---

## A.14 — `SCR-C-14` Đặt lịch B2: Cửa hàng & khung giờ

| | |
| --- | --- |
| Đường dẫn | `/booking/slot` |
| Vai trò | Guest, User |
| Thiết bị | SP◎ / PC |
| API | `GET /shops`, `GET /shops/{id}/availability` |
| FR | `FR-SHP-03`, `FR-SHP-31`, `FR-BKG-12`, `FR-BKG-35` |

**Thành phần màn hình**

| # | Thành phần | Loại | Bắt buộc | Quy tắc |
| --- | --- | --- | :---: | --- |
| 1 | Chọn cửa hàng | `Chọn` | ✱ | Hiển thị **kèm địa chỉ** để khách chọn nơi thuận tiện (`FR-SHP-03`) |
| 2 | Lịch chọn ngày | `Ngày` | ✱ | Ngày nghỉ của cửa hàng bị **làm mờ, không bấm được** |
| 3 | Danh sách khung giờ | `CMP-05` | ✱ | **Chỉ hiện khung giờ còn chỗ của đúng cửa hàng đã chọn** (`FR-SHP-31`) |
| 4 | Chú thích | `Nhãn` | | "Chỉ hiển thị các khung giờ còn nhận lịch." |
| 5 | Nút Tiếp tục | `Nút` | | |

**Hành động**

| Nút | Điều kiện hiện | Xử lý | Chuyển tới |
| --- | --- | --- | --- |
| Tiếp tục | Đã chọn cửa hàng + ngày + khung giờ | Lưu vào phiên | `SCR-C-15` |
| Quay lại | Luôn | Giữ nguyên lựa chọn bước 1 | `SCR-C-13` |

**Quy tắc nghiệp vụ**

- Khi đổi cửa hàng thì **danh sách khung giờ phải tải lại**, vì giờ làm việc và năng lực cấu hình **riêng theo từng cửa hàng** (`BR-40`, `FR-SHP-28`, `FR-SHP-29`).
- Khách **không đặt được** vào khung giờ hết chỗ, ngoài giờ làm việc, hoặc ngày nghỉ (`FR-BKG-35`). Cách thực hiện là **không hiển thị** các lựa chọn đó, thay vì hiển thị rồi báo lỗi.
- Số chỗ còn lại tính **thuần theo số booking** trong khung giờ (`BR-41`).
- Khung giờ vẫn có thể bị người khác đặt mất trong lúc khách đang thao tác — bước cuối cùng ở `SCR-C-16` phải kiểm tra lại (`TKD-07`).

**Thông báo lỗi**

| Mã | Câu chữ hiển thị |
| --- | --- |
| `ERR-SHP-01` | "Cửa hàng không làm việc vào thời điểm này. Xin quý khách chọn ngày khác." |

---

## A.15 — `SCR-C-15` Đặt lịch B3: Thông tin khách & xe

| | |
| --- | --- |
| Đường dẫn | `/booking/info` |
| Vai trò | Guest, User |
| Thiết bị | SP◎ / PC |
| API | `GET /vehicles` (nếu đã đăng nhập) |
| FR | `FR-AUT-04`, `FR-VEH-05`, `FR-VEH-04` |

**Thành phần — khi chưa đăng nhập (Guest)**

| # | Thành phần | Loại | Bắt buộc | Quy tắc |
| --- | --- | --- | :---: | --- |
| 1 | Họ tên | `Text` | ✱ | |
| 2 | Số điện thoại | `SĐT` | ✱ | Bàn phím số; là nơi nhận SMS xác nhận |
| 3 | Email | `Email` | **—** | **Tùy chọn** (`FR-AUT-04`) |
| 4 | Loại xe, hãng, model | `Chọn` `Text` | ✱ | Guest **nhập trực tiếp**, không lưu vào danh sách xe (`FR-VEH-05`) |
| 5 | Biển số | `Text` | ✱ | |
| 6 | Loại nhiên liệu | `Chọn` | ✱ | Căn cứ tính giá bảo dưỡng |
| 7 | Ngôn ngữ nhận thông báo | `Chọn` | ✱ | Lưu vào `bookings.locale` (`FR-NTF-26`) |

**Thành phần — khi đã đăng nhập (User)**

| # | Thành phần | Loại | Bắt buộc | Quy tắc |
| --- | --- | --- | :---: | --- |
| 1 | Thông tin liên hệ | `Nhãn` | | Điền sẵn từ hồ sơ, có nút Sửa |
| 2 | Chọn xe | `Chọn` | ✱ | Từ danh sách xe đã có (`FR-VEH-04`) |
| 3 | Nút Thêm xe mới | `Nút` | — | Mở hộp thoại nhập nhanh |

**Quy tắc nghiệp vụ**

- **Chỉ Tên và Số điện thoại là bắt buộc** để hoàn tất booking (`BR-11`, `DEC-01`). Không được đặt email thành trường bắt buộc.
- Vì email là tùy chọn, **SMS là kênh thông báo bắt buộc** (`FR-NTF-04`). Màn hình phải ghi rõ: *"Chúng tôi sẽ gửi tin nhắn xác nhận tới số điện thoại này."*
- Booking luôn gắn với **một xe cụ thể** (`FR-VEH-04`).
- ⚠ `OQ-14` — nếu khách hàng quyết định bật **OTP qua SMS**, thêm một bước xác thực mã sau khi nhập số điện thoại. Thiết kế hiện chưa bật, để giữ luồng trong 4 bước (`NFR-UX-03`).

---

## A.16 — `SCR-C-16` Đặt lịch B4: Xác nhận

| | |
| --- | --- |
| Đường dẫn | `/booking/confirm` |
| Vai trò | Guest, User |
| API | `POST /bookings` |
| FR | `FR-BKG-01`, `FR-BKG-04` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Tóm tắt dịch vụ | `Nhãn` | Có nút Sửa dẫn về `SCR-C-13` |
| 2 | Tóm tắt cửa hàng, ngày giờ | `Nhãn` | Có nút Sửa dẫn về `SCR-C-14` |
| 3 | Tóm tắt thông tin khách và xe | `Nhãn` | Có nút Sửa dẫn về `SCR-C-15` |
| 4 | Chi phí tham khảo | `Nhãn` | Kèm ghi chú "Chi phí cuối cùng theo báo giá tại cửa hàng" |
| 5 | Điều kiện hủy / đổi lịch | `Nhãn` | "Quý khách hủy hoặc đổi lịch bất cứ lúc nào, **không mất phí**, cho tới khi cửa hàng bắt đầu tiếp nhận xe." |
| 6 | Nút Xác nhận đặt lịch | `Nút` | |

**Hành động**

| Nút | Xử lý | Chuyển tới |
| --- | --- | --- |
| Xác nhận đặt lịch | Gọi `POST /bookings`; vô hiệu hóa nút trong lúc chờ | `SCR-C-17` |
| Sửa (từng khối) | Quay lại bước tương ứng, **giữ nguyên dữ liệu đã nhập** | `SCR-C-13`…`15` |

**Quy tắc nghiệp vụ**

- Đây là điểm **kiểm tra lại năng lực khung giờ trong cùng giao dịch** với việc tạo booking (`TKD-07`). Nếu khung giờ vừa bị đặt mất, trả `ERR-BKG-01` và đưa khách về `SCR-C-14` với thông báo rõ ràng.
- Booking mới luôn khởi tạo ở trạng thái **Chờ xác nhận** (`BR-16`).
- Câu chữ về điều kiện hủy phải phản ánh đúng `BR-02` và `BR-03`: ràng buộc là **trạng thái**, không phải thời gian, và **không có phí phạt**.

**Thông báo lỗi**

| Mã | Câu chữ hiển thị |
| --- | --- |
| `ERR-BKG-01` | "Rất tiếc, khung giờ này vừa có người đặt. Xin quý khách chọn giúp khung giờ khác." |
| `ERR-AUT-02` | "Số điện thoại này đã đặt nhiều lịch hẹn. Xin quý khách liên hệ cửa hàng." |

---

## A.17 — `SCR-C-17` Đặt lịch hoàn tất

| | |
| --- | --- |
| Đường dẫn | `/booking/complete` |
| Vai trò | Guest, User |
| FR | `FR-BKG-04`, `FR-AUT-06`, `FR-QRC-10` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Biểu tượng thành công + mã booking | `Nhãn` | Mã cỡ chữ lớn, dễ đọc |
| 2 | Tóm tắt lịch hẹn | `Nhãn` | Ngày giờ, cửa hàng, địa chỉ |
| 3 | Thông báo đã gửi SMS | `Nhãn` | "Chúng tôi đã gửi tin nhắn kèm đường dẫn tra cứu tới số 090-xxxx-1234." |
| 4 | Ghi chú về mã QR | `Nhãn` | **"Mã QR sẽ có sau khi cửa hàng xác nhận lịch hẹn"** (`FR-QRC-10`) |
| 5 | Gợi ý tạo tài khoản | `Thẻ` | Chỉ hiện với Guest — điền sẵn tên và SĐT vừa nhập (`FR-AUT-06`) |
| 6 | Nút Thêm vào lịch | `Nút` | Tải tệp `.ics` |

**Quy tắc nghiệp vụ**

- Booking đang ở *Chờ xác nhận* nên **chưa có mã QR** (`BR-44`, `DEC-21`). Màn hình **không được** hiển thị mã QR hay hứa hẹn mã QR có ngay — đây là điểm khác với `RQ §7` của tài liệu nguồn, cần nêu rõ khi trao đổi với khách hàng.
- Gợi ý tạo tài khoản là **tùy chọn**, không được chặn khách rời trang (`FR-AUT-06`).

---

## A.18 — `SCR-C-18` Booking của tôi

| | |
| --- | --- |
| Đường dẫn | `/account/bookings` |
| Vai trò | User |
| API | `GET /bookings` |
| FR | `FR-BKG-08` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Tab lọc | `Chọn` | Sắp tới · Đã hoàn tất · Đã hủy |
| 2 | Danh sách booking | `CMP-04` | Mỗi thẻ: **chỉ báo trạng thái** (`CMP-06`), ngày giờ, cửa hàng, xe, dịch vụ |
| 3 | Nút nhanh trên thẻ | `Nút` | "Xem mã QR" hiện khi trạng thái là *Xác nhận* |
| 4 | Trạng thái rỗng | `CMP-11` | "Quý khách chưa có lịch hẹn nào" + nút Đặt lịch |

**Quy tắc nghiệp vụ**

- Trên SP dùng **thẻ**, không dùng bảng nhiều cột (`NFR-UX-08`).
- Trạng thái hiển thị theo đúng 5 trạng thái của `DEC-03`, dùng chung bộ màu với CMS (`CMP-06`).

---

## A.19 — `SCR-C-19` Chi tiết booking

| | |
| --- | --- |
| Đường dẫn | `/account/bookings/{id}` |
| Vai trò | User |
| API | `GET /bookings/{id}` |
| FR | `FR-BKG-08`, `FR-BKG-18`, `FR-BKG-05a` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Chỉ báo trạng thái | `CMP-06` | Trạng thái hiện tại nổi bật ở đầu màn hình (`FR-BKG-18`) |
| 2 | Mã booking | `Nhãn` | |
| 3 | Ngày giờ hẹn | `Nhãn` | **Luôn là ngày hẹn còn hiệu lực**, không phải ngày đã qua (`BR-39`) |
| 4 | Cửa hàng | `Nhãn` | Tên, địa chỉ, số điện thoại, nút Gọi |
| 5 | Dịch vụ và xe | `Nhãn` | |
| 6 | Nút Xem mã QR | `Nút` | Chỉ hiện khi trạng thái ≥ *Xác nhận* |
| 7 | Nút Xem báo giá | `Nút` | Chỉ hiện khi đã có báo giá |
| 8 | Nút Đổi lịch | `Nút` | Xem quy tắc bên dưới |
| 9 | Nút Hủy lịch | `Nút` | Xem quy tắc bên dưới |
| 10 | Khối giải thích khi nút bị khóa | `Nhãn` | Lý do + số điện thoại cửa hàng (`FR-BKG-05a`) |

**Hành động**

| Nút | Điều kiện hiện hoạt | Chuyển tới |
| --- | --- | --- |
| Xem mã QR | Trạng thái *Xác nhận* / *Đang tiến hành* | `SCR-C-21` |
| Đổi lịch | Trạng thái *Chờ xác nhận* hoặc *Xác nhận* | `SCR-C-22` |
| Hủy lịch | Trạng thái *Chờ xác nhận* hoặc *Xác nhận* | `SCR-C-23` |
| Xem tiến độ | Trạng thái *Đang tiến hành* | `SCR-C-28` |

**Quy tắc nghiệp vụ**

- Khách **chỉ tự hủy và đổi lịch được ở hai trạng thái đầu** (`BR-14`, `DEC-02`, `DEC-05`). Từ *Đang tiến hành* trở đi, nút bị **vô hiệu hóa kèm giải thích và số điện thoại cửa hàng** — không được ẩn nút đi, vì khách sẽ tưởng chức năng không tồn tại (`FR-BKG-05a`).
- **Không có giới hạn thời gian** nào cho việc hủy hay đổi lịch, và **không có phí phạt** (`BR-02`, `BR-03`).
- Màn hình **không hiển thị** ghi chú nội bộ của nhân viên (`FR-BKG-26`) và **không hiển thị** cờ Chờ phụ tùng.

---

## A.20 — `SCR-C-20` Tra cứu bằng link token

| | |
| --- | --- |
| Đường dẫn | `/t/{token}` |
| Vai trò | Guest (không đăng nhập) |
| Render | **SSR + `noindex`** |
| API | `GET /t/{token}` |
| FR | `FR-BKG-13`, `FR-BKG-13a`, `NFR-SEC-09`, `NFR-SEC-10` |

**Thành phần màn hình**

Giống `SCR-C-19` nhưng **rút gọn và che bớt thông tin**:

| # | Thành phần | Quy tắc |
| --- | --- | --- |
| 1 | Chỉ báo trạng thái | Như `SCR-C-19` |
| 2 | Tên khách | **Che bớt** — ví dụ "Nguyễn V. A." |
| 3 | Số điện thoại | **Che bớt** — ví dụ "090-****-1234" (`NFR-SEC-10`) |
| 4 | Ngày giờ, cửa hàng, dịch vụ, xe | Hiển thị đầy đủ |
| 5 | Nút Xem mã QR / Đổi lịch / Hủy | Cùng điều kiện với `SCR-C-19` |
| 6 | Gợi ý tạo tài khoản | Nhẹ nhàng, không bắt buộc |

**Quy tắc nghiệp vụ**

- Link **không có thời hạn hiệu lực** — vẫn truy cập được sau khi booking hoàn tất hoặc bị hủy, để khách tra lại lịch sử dịch vụ (`FR-BKG-13a`, `BR-15`).
- Vì link không hết hạn, **độ mạnh của token là lớp bảo vệ duy nhất** (`NFR-SEC-07`). Bắt buộc:
  - Header `X-Robots-Tag: noindex` và thẻ `<meta name="robots" content="noindex">`.
  - Header `Referrer-Policy: no-referrer` để token không rò rỉ khi khách bấm ra ngoài (`NFR-SEC-09`).
  - Giới hạn tần suất truy cập theo IP.
- Màn hình **chỉ hiển thị đúng booking của token đó**, không có đường dẫn nào sang booking khác (`NFR-SEC-10`).

---

## A.21 — `SCR-C-21` Mã QR

| | |
| --- | --- |
| Đường dẫn | `/account/bookings/{id}/qr` · `/t/{token}/qr` |
| Vai trò | User, Guest |
| API | `GET /bookings/{id}/qr` · `GET /t/{token}/qr` |
| FR | `FR-QRC-02`, `FR-QRC-10`, `FR-QRC-12` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Mã QR | `Nhãn` | **Chiếm phần lớn màn hình**, nền trắng, viền dày |
| 2 | Mã booking dạng chữ | `Nhãn` | Dự phòng khi máy quét không đọc được |
| 3 | Tóm tắt lịch hẹn | `Nhãn` | Ngày giờ, cửa hàng |
| 4 | Hướng dẫn | `Nhãn` | "Xin quý khách đưa màn hình này cho nhân viên khi đến cửa hàng." |

**Quy tắc theo trạng thái booking**

| Trạng thái | Màn hình hiển thị |
| --- | --- |
| *Chờ xác nhận* | **Không có mã QR.** Hiện thông báo *"Mã QR sẽ có sau khi cửa hàng xác nhận lịch hẹn."* (`FR-QRC-10`) |
| *Xác nhận* | Hiển thị mã QR đầy đủ |
| *Đang tiến hành* | Hiển thị mã QR kèm ghi chú "Xe của quý khách đã được tiếp nhận" |
| *Hoàn thành* | Hiện tóm tắt, không cần mã QR |
| *Đã hủy* | **Mã QR mất hiệu lực**, hiện trạng thái đã hủy (`FR-QRC-12`) |

**Quy tắc nghiệp vụ**

- Mã QR **chỉ chứa chuỗi định danh ngẫu nhiên**, không chứa thông tin cá nhân dạng rõ (`NFR-SEC-05`).
- Trên SP, màn hình **tự tăng độ sáng tối đa** khi mở, để máy quét đọc được trong điều kiện ánh sáng kém.
- ⚠ `OQ-46` — booking bị đổi lịch thì mã QR cũ **vẫn dùng được**, vì mã gắn với booking chứ không gắn với ngày hẹn. Cần khách hàng xác nhận.

---

## A.22 — `SCR-C-22` Đổi lịch

| | |
| --- | --- |
| Đường dẫn | `/account/bookings/{id}/reschedule` · `/t/{token}/reschedule` |
| Vai trò | User, Guest |
| API | `GET /shops/{id}/availability`, `PATCH /bookings/{id}/reschedule` |
| FR | `FR-BKG-06` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Lịch hẹn hiện tại | `Nhãn` | Để đối chiếu |
| 2 | Lịch chọn ngày | `Ngày` | Cùng cửa hàng, ngày nghỉ bị làm mờ |
| 3 | Danh sách khung giờ | `CMP-05` | Chỉ khung còn chỗ |
| 4 | Nút Xác nhận đổi lịch | `Nút` | |

**Quy tắc nghiệp vụ**

- **Đổi lịch giữ nguyên cửa hàng.** Khách **không tự đổi cửa hàng được** — việc đó phải qua nhân viên (`BR-28`, `FR-SHP-06`). ⚠ `OQ-35` đang bỏ ngỏ điểm này.
- Không giới hạn số lần đổi lịch và **không có phí** (`BR-02`, `BR-03`).
- Mỗi lần đổi ghi vào lịch sử: ngày cũ, ngày mới, người thực hiện, thời điểm (`FR-BKG-34`).
- Sau khi đổi thành công, hệ thống **đẩy thông báo vào CMS** cho cửa hàng (`FR-NTF-10`).

---

## A.23 — `SCR-C-23` Xác nhận hủy booking

| | |
| --- | --- |
| Loại | Hộp thoại trên `SCR-C-19` / `SCR-C-20` |
| Vai trò | User, Guest |
| API | `PATCH /bookings/{id}/cancel` |
| FR | `FR-BKG-05`, `FR-BKG-05a` |

**Thành phần**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Câu hỏi xác nhận | `Nhãn` | "Quý khách chắc chắn muốn hủy lịch hẹn ngày {ngày giờ} tại {cửa hàng}?" |
| 2 | Ghi chú không mất phí | `Nhãn` | "Việc hủy **không mất phí**." (`BR-03`) |
| 3 | Lý do hủy | `Chọn` | **Tùy chọn** với khách hàng |
| 4 | Nút Hủy lịch hẹn / Quay lại | `Nút` | Nút Quay lại là nút mặc định |

**Quy tắc nghiệp vụ**

- Khách chỉ hủy được ở trạng thái *Chờ xác nhận* hoặc *Xác nhận* (`BR-14`).
- **Lý do hủy là bắt buộc với Admin/Staff** (`FR-BKG-23`) nhưng **tùy chọn với khách hàng** — không nên dựng thêm rào cản cho khách.
- Sau khi hủy: ghi `booking_status_logs` với `actor_type = CUSTOMER` (`BR-19`), đẩy thông báo vào CMS (`FR-NTF-09`), **mã QR mất hiệu lực** (`FR-QRC-12`).
- Hệ thống **không** gửi SMS xác nhận hủy cho khách khi chính khách là người hủy — khách đã biết việc mình làm.

---

## A.24 — `SCR-C-24` Lịch sử bảo dưỡng của xe

| | |
| --- | --- |
| Đường dẫn | `/account/vehicles/{id}/history` |
| Vai trò | User |
| API | `GET /vehicles/{id}/maintenance-histories` |
| FR | `FR-BKG-10`, `FR-RPR-04` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Thông tin xe | `Nhãn` | |
| 2 | Dòng thời gian | `Thẻ` | Mỗi mục: ngày, cửa hàng, dịch vụ, phụ tùng đã thay, chi phí |
| 3 | Nhắc kỳ bảo dưỡng tiếp theo | `Thẻ` | Kèm nút Đặt lịch ngay (`FR-NTF-03`, `FR-AI-09`) |
| 4 | Nút xuất lịch sử | `Nút` | Tải PDF |

**Quy tắc nghiệp vụ**

- Lịch sử **gom theo số điện thoại**, nên bao gồm cả các lần khách đặt với tư cách Guest trước khi có tài khoản (`BR-12`, `FR-BKG-15`).
- ⚠ `OQ-08` — cách xác định kỳ bảo dưỡng tiếp theo (theo km, theo thời gian, hay theo loại xe) chưa được chốt. Khối số 3 hiện dựa trên khoảng thời gian cố định.

---

## A.25 — `SCR-C-25` Đặt lịch lặp lại

| | |
| --- | --- |
| Đường dẫn | `/account/recurring-plans` |
| Vai trò | **User** (bắt buộc đăng nhập) |
| API | `GET/POST/DELETE /recurring-plans` |
| FR | `FR-BKG-07`, `FR-BKG-14` |

**Thành phần màn hình**

| # | Thành phần | Loại | Bắt buộc | Quy tắc |
| --- | --- | --- | :---: | --- |
| 1 | Chọn xe | `Chọn` | ✱ | |
| 2 | Chọn dịch vụ bảo dưỡng | `Chọn` | ✱ | **Chỉ dịch vụ nhóm Bảo dưỡng** (`BR-04`) |
| 3 | Chu kỳ | `Chọn` | ✱ | 3 tháng · 6 tháng · 12 tháng |
| 4 | Cửa hàng | `Chọn` | ✱ | |
| 5 | Khung giờ ưu tiên | `Giờ` | — | |
| 6 | Danh sách lịch đang có | `Thẻ` | | Kèm nút Tạm dừng và Xóa |

**Quy tắc nghiệp vụ**

- Chức năng này **chỉ dành cho User đã đăng nhập**, không mở cho Guest (`FR-BKG-14`).
- **Chỉ booking loại Bảo dưỡng** mới có đặt lịch lặp lại (`BR-04`) — màn hình không được cho chọn dịch vụ Sửa chữa.
- Tiến trình `BAT-04` sinh booking mới theo cấu hình. Booking sinh ra vẫn ở trạng thái *Chờ xác nhận* như booking thường (`BR-16`).
- Nếu khung giờ ưu tiên đã hết chỗ, hệ thống chọn khung gần nhất còn trống trong cùng ngày và **thông báo cho khách**.

---

## A.26 — `SCR-C-26` Chatbox AI

| | |
| --- | --- |
| Đường dẫn | `/chat` |
| Vai trò | Guest, User |
| API | `POST /chat/sessions`, `/messages`, `/attachments`, `GET /suggestion` |
| FR | `FR-AI-01`…`FR-AI-05`, `FR-AI-10` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Nút chọn nhanh mở đầu | `Nút` | **Bảo dưỡng / Sửa chữa** (`FR-AI-01`) |
| 2 | Khung hội thoại | `Thẻ` | Phân biệt rõ tin của khách và của trợ lý |
| 3 | Ô nhập văn bản | `Vùng văn bản` | Mô tả lỗi bằng chữ (`FR-AI-02`) |
| 4 | Nút tải ảnh | `Tệp` | JPEG/PNG/WebP, tối đa 10 MB, tối đa 5 ảnh (`FR-AI-03`) |
| 5 | Nút ghi âm | `Nút` | Tối đa 60 giây, có hiển thị dạng sóng (`FR-AI-04`) |
| 6 | Thẻ gợi ý dịch vụ | `Thẻ` | Kết quả AI phân loại (`FR-AI-05`), kèm nút "Đặt lịch với dịch vụ này" |
| 7 | Trạng thái đang xử lý | `CMP-12` | Hiện trong lúc chờ AI (`NFR-PRF-02`) |

**Quy tắc nghiệp vụ**

- **Bắt đầu bằng nút bấm, không bắt khách gõ chữ** (`FR-AI-01`, `NFR-UX-07`) — quan trọng với người lớn tuổi.
- Kết quả AI là **gợi ý**, khách phải bấm chọn mới áp dụng (`FR-AI-10`). Không được tự động tạo booking từ nội dung chat.
- Phản hồi phải trong **10 giây**, có hiển thị trạng thái đang xử lý (`NFR-PRF-02`).
- Khi khách bấm "Đặt lịch với dịch vụ này", chuyển sang `SCR-C-13` với dịch vụ và mô tả lỗi **điền sẵn**.
- ⚠ `OQ-24` — chưa chốt việc chatbox có sinh thông báo vào CMS hay không. Thiết kế hiện **không** sinh, để tránh làm nhiễu danh sách thông báo của nhân viên.

---

## A.27 — `SCR-C-27` Xem báo giá

| | |
| --- | --- |
| Đường dẫn | `/account/bookings/{id}/quotation` |
| Vai trò | User, Guest (qua token) |
| API | `GET /bookings/{id}/quotation` |
| FR | `FR-RPR-02` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Ngày lập báo giá | `Nhãn` | |
| 2 | Hạng mục kiểm tra | `Thẻ` | Tên, đơn giá |
| 3 | Phụ tùng thay thế | `Thẻ` | Tên, số lượng, đơn giá, thành tiền |
| 4 | Tổng cộng | `Nhãn` | Cỡ chữ lớn |
| 5 | Trạng thái thanh toán | `Nhãn` | Chưa thanh toán / Đã thanh toán |

**Quy tắc nghiệp vụ**

- Giá hiển thị là **giá chung toàn chuỗi** (`BR-32`), không đổi khi booking chuyển cửa hàng.
- Trên SP hiển thị dạng thẻ, không dùng bảng nhiều cột (`NFR-UX-08`).
- Đây là màn hình **chỉ đọc** — khách không duyệt hay từ chối báo giá trên hệ thống; việc trao đổi diễn ra trực tiếp tại cửa hàng.

---

## A.28 — `SCR-C-28` Theo dõi tiến độ sửa chữa

| | |
| --- | --- |
| Đường dẫn | `/account/bookings/{id}/progress` |
| Vai trò | User |
| API | `GET /bookings/{id}` |
| FR | `FR-BKG-09`, `FR-RPR-03` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Thanh tiến trình | `Nhãn` | 4 mốc: Chờ xác nhận → Xác nhận → Đang tiến hành → Hoàn thành |
| 2 | Mốc hiện tại | `CMP-06` | Nổi bật, kèm thời điểm chuyển sang trạng thái đó |
| 3 | Ghi chú tiến độ | `Nhãn` | Nội dung nhân viên cập nhật ở `SCR-A-12` |
| 4 | Số điện thoại cửa hàng | `Nút` | Nút Gọi |

**Quy tắc nghiệp vụ**

- Dữ liệu lấy từ `booking_status_logs` (`BR-19`).
- Màn hình **không hiển thị** ghi chú nội bộ (`FR-BKG-26`) và **không hiển thị** cờ Chờ phụ tùng — đó là thông tin nội bộ của cửa hàng.
- Trạng thái *Đã hủy* không nằm trên thanh tiến trình; nếu booking bị hủy thì hiện thông báo riêng.

---

# PHẦN B — SITE QUẢN TRỊ (CMS)

## B.1 — `SCR-A-01` Đăng nhập CMS

| | |
| --- | --- |
| Đường dẫn | `cms.…/login` |
| Vai trò | Staff, Admin |
| API | `POST /auth/login` |
| FR | `NFR-PLT-05` |

**Thành phần:** tài khoản ✱, mật khẩu ✱, nút Đăng nhập.

**Quy tắc nghiệp vụ**

- Màn hình này **hoàn toàn tách khỏi** màn hình đăng nhập của khách (`SCR-C-07`) và đặt ở **tên miền riêng** (`TKD-02`, `NFR-PLT-05`).
- Guest và User **không** truy cập được bất kỳ đường dẫn nào của CMS.
- Sau khi đăng nhập, phiên chứa `role` và `shopId` — hai giá trị này quyết định toàn bộ phạm vi dữ liệu người dùng nhìn thấy (`FR-SHP-02`, `BR-47`).
- Access token 15 phút, refresh token **8 giờ** — ngắn hơn phía khách vì máy quầy dùng chung.
- Khóa tài khoản 15 phút sau 5 lần đăng nhập sai liên tiếp.

---

## B.2 — `SCR-A-02` Dashboard

| | |
| --- | --- |
| Đường dẫn | `cms.…/` |
| Vai trò | Staff ⬤, Admin |
| API | `GET /cms/bookings` (tổng hợp), `GET /cms/notifications` |
| FR | `FR-BKG-21` |

**Thành phần màn hình**

| # | Khối | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Lịch hẹn hôm nay | `Bảng` | Sắp theo giờ, hiện trạng thái |
| 2 | Chờ xác nhận | `Thẻ` | Số lượng + nút mở danh sách đã lọc sẵn (`FR-BKG-21`) |
| 3 | Quá hạn — khách không đến | `Thẻ` | Số lượng, **màu cảnh báo** (`FR-BKG-24`) |
| 4 | Chờ phụ tùng | `Thẻ` | Số lượng (`FR-BKG-29`) |
| 5 | Tải theo khung giờ hôm nay | `Bảng` | Đã nhận / tối đa (`FR-SHP-32`) |
| 6 | Cảnh báo tồn kho thấp | `Thẻ` | (`FR-SHP-19`) |
| 7 | Yêu cầu điều phối cần xử lý | `Thẻ` | (`FR-SHP-16`) |
| 8 | Bộ chọn cửa hàng | `Chọn` | **Chỉ Admin thấy** — Staff bị khóa vào cửa hàng mình (`BR-47`) |

**Quy tắc nghiệp vụ**

- Với Staff, mọi con số chỉ tính trong **cửa hàng mình** (`BR-42`). Với Admin, mặc định hiện **toàn chuỗi**, có bộ lọc theo cửa hàng (`FR-SHP-39`).
- Khối số 3 là nơi nhân viên thấy kết quả của tiến trình `BAT-01` chạy lúc 16:00 (`FR-NTF-18`).

---

## B.3 — `SCR-A-03` Danh sách booking

| | |
| --- | --- |
| Đường dẫn | `cms.…/bookings` |
| Vai trò | Staff ⬤, Admin |
| API | `GET /cms/bookings` |
| FR | `FR-BKG-11`, `FR-BKG-21`, `FR-BKG-24`, `FR-BKG-29`, `FR-BKG-32` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Bộ lọc trạng thái | `Chọn nhiều` | 5 trạng thái; **mặc định chọn *Chờ xác nhận*** để xử lý trước (`FR-BKG-21`) |
| 2 | Bộ lọc **Quá hạn — khách không đến** | `Bật tắt` | Booking đã qua ngày hẹn chưa xử lý (`FR-BKG-24`) |
| 3 | Bộ lọc **Chờ phụ tùng** | `Bật tắt` | Theo cờ `is_waiting_for_part` (`FR-BKG-29`) |
| 4 | Bộ lọc cửa hàng | `Chọn` | **Chỉ Admin thấy** |
| 5 | Khoảng ngày | `Ngày` | |
| 6 | Ô tìm | `Text` | Theo mã booking, tên khách, số điện thoại, biển số |
| 7 | Bảng booking | `CMP-08` | Cột: mã, ngày giờ, khách, SĐT, xe, dịch vụ, cửa hàng, trạng thái, thanh toán, cờ |
| 8 | Biểu tượng cảnh báo | `Nhãn` | ⚠ trên dòng có ngày hẹn đã qua mà vẫn *Chờ xác nhận* (`FR-BKG-32`) |
| 9 | Nút Tạo booking | `Nút` | |

**Quy tắc nghiệp vụ**

- Staff **chỉ thấy booking của cửa hàng mình** — lọc ở phía máy chủ, không phải ẩn trên giao diện (`FR-SHP-34`, `FR-SHP-36`).
- Ba bộ lọc số 1, 2, 3 phản ánh ba nhóm công việc khác nhau và phải kết hợp được với nhau.
- Booking mang cờ **Chờ phụ tùng** không bị tính là quá hạn (`BR-36`) — hai bộ lọc này loại trừ nhau về mặt nghiệp vụ.

---

## B.4 — `SCR-A-04` Chi tiết booking

| | |
| --- | --- |
| Đường dẫn | `cms.…/bookings/{id}` |
| Vai trò | Staff ⬤, Admin |
| API | `GET /cms/bookings/{id}` và các API thao tác |
| FR | `FR-BKG-16`, `17`, `19`, `25`, `26`, `27`, `34` |

**Thành phần màn hình**

| # | Khối | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Thanh trạng thái | `CMP-06` | Trạng thái hiện tại + nút chuyển trạng thái hợp lệ tiếp theo |
| 2 | Thông tin khách | `Nhãn` | Tên, SĐT (**đầy đủ**, có nút Gọi), email nếu có |
| 3 | Thông tin xe | `Nhãn` | Với Guest thì lấy từ `vehicle_snapshot` |
| 4 | Dịch vụ và mô tả lỗi | `Nhãn` | Kèm nội dung khách nhập ở chatbox nếu có |
| 5 | Cửa hàng, ngày giờ hẹn | `Nhãn` | Có nút Đổi lịch / Chuyển cửa hàng |
| 6 | **Cờ Chờ phụ tùng** | `Bật tắt` | Cách **duy nhất** đánh dấu tình trạng này (`FR-BKG-27`, `BR-45`) |
| 7 | Ghi chú nội bộ | `Vùng văn bản` | **Khách không nhìn thấy** (`FR-BKG-26`) |
| 8 | Kết quả liên hệ khách | `Chọn` | Đã gọi / Chưa liên lạc được / Khách xác nhận không đến (`FR-BKG-25`) |
| 9 | Báo giá | `Thẻ` | Tóm tắt + nút mở `SCR-A-11` |
| 10 | Thanh toán | `Thẻ` | Trạng thái + nút mở `SCR-A-13` |
| 11 | Yêu cầu điều phối liên quan | `Thẻ` | Kèm **ngày gửi phụ tùng** (`FR-SHP-25`) |
| 12 | Lịch sử trạng thái | `Bảng` | Từ trạng thái nào sang trạng thái nào, **ai làm, lúc nào**, lý do hủy (`BR-19`, `FR-BKG-34`) |

**Hành động**

| Nút | Điều kiện hiện | Xử lý |
| --- | --- | --- |
| Xác nhận booking | Trạng thái *Chờ xác nhận* | `PENDING` → `CONFIRMED`, **sinh mã QR**, gửi thông báo cho khách (`FR-BKG-16`, `BR-44`) |
| Hoàn thành | Trạng thái *Đang tiến hành* | `IN_PROGRESS` → `COMPLETED`, trừ tồn kho phụ tùng đã dùng (`FR-SHP-18`) |
| Hủy booking | **Mọi trạng thái** | Mở `SCR-A-07` (`FR-BKG-19`, `BR-18`) |
| Đổi lịch / Chuyển cửa hàng | Mọi trạng thái đang hoạt động | Mở `SCR-A-06` |

**Quy tắc nghiệp vụ**

- Chuyển trạng thái **mặc định là thủ công** (`BR-17`, `DEC-04`). **Ngoại lệ duy nhất** là bước *Xác nhận* → *Đang tiến hành*, do quét QR tự chuyển (`BR-22`) — màn hình này **không** có nút chuyển sang *Đang tiến hành*.
- Admin/Staff hủy được ở **mọi trạng thái**, kể cả *Đang tiến hành* và *Hoàn thành* (`BR-18`).
- Tình trạng chờ phụ tùng đánh dấu bằng **cờ số 6**, tuyệt đối **không dùng ghi chú tự do** ở khối số 7 (`FR-BKG-26`, `BR-45`) — mọi xử lý tự động của hệ thống căn cứ vào cờ này.
- Khi bật cờ Chờ phụ tùng, booking **giữ nguyên trạng thái *Chờ xác nhận*** (`BR-35`, `DEC-16`) và bị loại khỏi tiến trình rà soát 16:00 (`FR-BKG-28`).
- ⚠ `OQ-21` — chưa chốt cách xử lý **hóa đơn và trạng thái thanh toán** khi hủy một booking đã ở *Đang tiến hành* hoặc *Hoàn thành*. Thiết kế hiện giữ nguyên hóa đơn đã lập và đánh dấu hủy, không tự hoàn tiền.

---

## B.5 — `SCR-A-05` Tạo booking thay khách

| | |
| --- | --- |
| Đường dẫn | `cms.…/bookings/new` |
| Vai trò | Staff ⬤, Admin |
| API | `POST /cms/bookings` |
| FR | `FR-BKG-03`, `FR-SHP-33` |

**Thành phần màn hình**

| # | Thành phần | Loại | Bắt buộc | Quy tắc |
| --- | --- | --- | :---: | --- |
| 1 | Tìm khách theo số điện thoại | `SĐT` | ✱ | Nếu đã có hồ sơ thì **điền sẵn** tên và danh sách xe (`BR-12`) |
| 2 | Tên khách | `Text` | ✱ | |
| 3 | Email | `Email` | — | |
| 4 | Thông tin xe | `Chọn` `Text` | ✱ | Chọn từ xe đã có hoặc nhập mới |
| 5 | Dịch vụ | `Chọn nhiều` | ✱ | |
| 6 | Cửa hàng | `Chọn` | ✱ | Staff bị khóa vào cửa hàng mình |
| 7 | Ngày giờ hẹn | `Ngày` `Giờ` | ✱ | **Hiện cả khung giờ đã đầy**, khác với phía khách |
| 8 | Cảnh báo vượt năng lực | `Nhãn` | | Hiện khi chọn khung giờ đã đạt mức tối đa |
| 9 | Ghi chú nội bộ | `Vùng văn bản` | — | |

**Quy tắc nghiệp vụ**

- Admin/Staff **vẫn tạo được booking vượt mức tối đa** để xử lý ngoại lệ, kèm cảnh báo (`FR-SHP-33`) — đây là điểm khác biệt so với luồng của khách, vốn bị chặn cứng (`FR-BKG-35`).
- Booking do nhân viên tạo có `created_by = STAFF`, nên **không sinh thông báo trong CMS** (`BR-20`).
- Vẫn **gửi SMS xác nhận cho khách** như booking thường (`FR-NTF-04`).

---

## B.6 — `SCR-A-06` Đổi lịch / Chuyển cửa hàng

| | |
| --- | --- |
| Đường dẫn | `cms.…/bookings/{id}/reschedule` |
| Vai trò | Staff ⬤, Admin |
| API | `PATCH /cms/bookings/{id}/reschedule`, `/transfer`, `GET /cms/shops/load` |
| FR | `FR-BKG-31`, `FR-BKG-33`, `FR-SHP-06`…`11` |

**Thành phần màn hình**

| # | Khối | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Tab **Đổi ngày giờ** | | |
| 1a | Lịch hẹn hiện tại | `Nhãn` | |
| 1b | Ngày giờ mới | `Ngày` `Giờ` | |
| 2 | Tab **Chuyển cửa hàng** | | |
| 2a | Cửa hàng đích | `Chọn` | |
| 2b | **Bảng tải các cửa hàng khác** | `Bảng` | Còn chỗ / hết chỗ trong cùng khung giờ (`FR-SHP-10`, `FR-SHP-38`) |
| 2c | Ô xác nhận đã trao đổi với khách | `Bật tắt` | ✱ Bắt buộc tích |
| 3 | Nút Xác nhận | `Nút` | |

**Quy tắc nghiệp vụ**

- **Chỉ Admin/Staff chuyển được cửa hàng, và chỉ sau khi khách đã đồng ý** (`BR-28`). Ô số 2c là cách nhắc nhân viên thực hiện đúng quy trình.
- Chuyển cửa hàng **không đổi trạng thái booking** và **không tạo booking mới** (`BR-29`).
- **Giá không đổi** vì bảng giá dùng chung toàn chuỗi (`BR-32`).
- Sau khi chuyển: ghi `booking_shop_transfer_logs` (`FR-SHP-07`), gửi thông báo cho khách kèm **tên và địa chỉ cửa hàng mới** (`FR-SHP-08`), đẩy thông báo vào CMS của **cửa hàng tiếp nhận** (`FR-SHP-09`), **quyền xem chuyển theo** (`FR-SHP-40`).
- Bảng ở ô 2b **chỉ hiện mức độ bận**, không hiện chi tiết booking của cửa hàng khác (`FR-SHP-38`, `BR-43`).
- Với booking đang chờ phụ tùng, đây là nơi **chốt ngày hẹn mới** — không được giữ ngày hẹn cũ đã trôi qua (`BR-38`, `FR-BKG-31`).

---

## B.7 — `SCR-A-07` Hủy booking + chọn lý do

| | |
| --- | --- |
| Loại | Hộp thoại trên `SCR-A-04` |
| Vai trò | Staff ⬤, Admin |
| API | `PATCH /cms/bookings/{id}/cancel` |
| FR | `FR-BKG-19`, `FR-BKG-20`, `FR-BKG-23` |

**Thành phần**

| # | Thành phần | Loại | Bắt buộc | Quy tắc |
| --- | --- | --- | :---: | --- |
| 1 | Tóm tắt booking | `Nhãn` | | Mã, khách, ngày giờ |
| 2 | **Lý do hủy** | `Chọn` | ✱ | Từ danh mục `cancel_reasons`, **có mục "Khách không đến"** (`FR-BKG-23`) |
| 3 | Ghi chú thêm | `Vùng văn bản` | ✱ khi chọn "Khác" | |
| 4 | Cảnh báo theo trạng thái | `Nhãn` | | Hiện khi hủy booking đang *Đang tiến hành* hoặc *Hoàn thành* |
| 5 | Nút Xác nhận hủy | `Nút` | | |

**Quy tắc nghiệp vụ**

- **Lý do hủy là bắt buộc** với Admin/Staff (`FR-BKG-23`) — khác với khách hàng, nơi lý do là tùy chọn (`SCR-C-23`).
- Lý do hủy là căn cứ để báo cáo **tách "khách chủ động hủy" khỏi "khách không đến"** (`FR-RPT-06`, `BR-24`). Đây chính là cách hệ thống giải quyết vấn đề mà không cần thêm trạng thái thứ sáu.
- Hệ thống ghi **người hủy, thời điểm và lý do** vào `booking_status_logs` (`FR-BKG-20`, `BR-19`).
- Gửi thông báo cho khách khi booking bị Admin/Staff hủy (`FR-NTF-07`, `MSG-04`).
- ⚠ `OQ-28` — danh mục lý do hủy chưa được khách hàng chốt. Đề xuất hiện tại: *Khách yêu cầu hủy · Khách không đến · Cửa hàng không đáp ứng được · Khách đổi sang lịch khác · Khác*.

---

## B.8 — `SCR-A-08` Quét mã QR

| | |
| --- | --- |
| Đường dẫn | `cms.…/scan` |
| Vai trò | Staff ⬤, Admin |
| Thiết bị | **PC◎ + SP○** — bắt buộc dùng được trên di động (`NFR-PLT-06`) |
| API | `POST /cms/qr/scan` |
| FR | `FR-QRC-03`, `FR-QRC-08` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Khung camera | `Nhãn` | Chiếm phần lớn màn hình, có khung ngắm |
| 2 | Nút chuyển camera | `Nút` | Trước / sau, cho thiết bị di động |
| 3 | Ô nhập mã thủ công | `Text` | Dự phòng khi camera không đọc được |
| 4 | Nút Tra cứu thủ công | `Nút` | Dẫn sang `SCR-A-10` khi khách chưa có QR |
| 5 | Nhật ký quét gần đây | `Bảng` | 5 lượt gần nhất trong ca |

**Quy tắc nghiệp vụ**

- Cần quyền truy cập camera; nếu bị từ chối thì hiện hướng dẫn bật quyền và chuyển sang ô nhập thủ công.
- Quét thành công thì chuyển thẳng sang `SCR-A-09` — **không có màn hình xác nhận trung gian**, vì mục tiêu của `RQ §7` là giảm thời gian xác nhận qua lại tại quầy.
- Thao tác quét là **idempotent**: quét lại cùng một mã nhiều lần không sinh thêm lần chuyển trạng thái nào (`FR-QRC-08`, `TKD-08`).

---

## B.9 — `SCR-A-09` Màn hình tiếp nhận xe

| | |
| --- | --- |
| Đường dẫn | `cms.…/scan/result/{bookingId}` |
| Vai trò | Staff ⬤, Admin |
| Thiết bị | **PC◎ + SP○** |
| API | Kết quả từ `POST /cms/qr/scan` |
| FR | `FR-QRC-04`…`FR-QRC-07`, `FR-QRC-09` |

**Thành phần màn hình**

| # | Khối | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | **Băng xác nhận trạng thái** | `Nhãn` | Nổi bật ở đầu: *"Đã tiếp nhận — chuyển sang Đang tiến hành"* (`FR-QRC-06`) |
| 2 | Thông tin khách | `Nhãn` | Tên, số điện thoại |
| 3 | Thông tin xe | `Nhãn` | Hãng, model, biển số, nhiên liệu |
| 4 | Dịch vụ đã đặt | `Nhãn` | |
| 5 | **Mô tả lỗi của khách** | `Nhãn` | Gồm nội dung nhập tay, ảnh và bản ghi âm từ chatbox |
| 6 | **Lịch sử bảo dưỡng của xe** | `Bảng` | Các lần dịch vụ trước (`FR-QRC-04`) |
| 7 | Nút Lập báo giá | `Nút` | Dẫn sang `SCR-A-11` |

**Xử lý theo trạng thái booking khi quét** (`FR-QRC-07`)

| Trạng thái lúc quét | Hành vi hệ thống |
| --- | --- |
| *Xác nhận* | **Tự chuyển sang *Đang tiến hành***, ghi log với người thực hiện là tài khoản đang đăng nhập (`FR-QRC-05`, `FR-QRC-09`) |
| *Đang tiến hành* | Hiện thông tin + cảnh báo *"Xe đã được tiếp nhận trước đó"*, **không đổi trạng thái** |
| *Hoàn thành* | Hiện thông tin + trạng thái hiện tại, không cho chuyển |
| *Đã hủy* | Hiện trạng thái đã hủy, mã QR không còn hiệu lực (`FR-QRC-12`) |
| *Chờ xác nhận* | **Không xảy ra** — booking chưa xác nhận thì chưa có mã QR (`BR-44`, `DEC-21`) |

**Quy tắc nghiệp vụ**

- Đây là **ngoại lệ duy nhất** của quy tắc "chuyển trạng thái thủ công" (`BR-17`, `BR-22`): quét một lần vừa tra cứu vừa chuyển trạng thái, không cần thao tác thứ hai (`DEC-07`).
- Toàn bộ thông tin ở khối 2–6 phải hiện **cùng lúc trên một màn hình**, không chia tab — mục tiêu là lễ tân nắm ngay tình hình xe mà không phải hỏi lại khách (`RQ §7`).

---

## B.10 — `SCR-A-10` Tra cứu booking thủ công

| | |
| --- | --- |
| Đường dẫn | `cms.…/bookings/search` |
| Vai trò | Staff ⬤, Admin |
| Thiết bị | **PC◎ + SP○** |
| API | `GET /cms/bookings/search` |
| FR | `FR-QRC-11` |

**Thành phần:** ô tìm theo **số điện thoại hoặc tên khách** ✱, danh sách kết quả kèm trạng thái, nút Xác nhận booking trên từng dòng.

**Quy tắc nghiệp vụ**

- Dùng khi khách đến cửa hàng **mà chưa có mã QR** — trường hợp phổ biến là booking còn ở *Chờ xác nhận* nên chưa được sinh QR (`BR-44`).
- Nhân viên xác nhận booking ngay tại đây rồi tiếp tục quy trình bình thường (`FR-QRC-11`).
- Staff chỉ tìm được trong phạm vi cửa hàng mình (`FR-SHP-34`).

---

## B.11 — `SCR-A-11` Lập báo giá

| | |
| --- | --- |
| Đường dẫn | `cms.…/bookings/{id}/quotation` |
| Vai trò | Staff ⬤, Admin |
| API | `POST /cms/bookings/{id}/quotation`, `/quotation/suggest` |
| FR | `FR-RPR-01`, `FR-AI-06`, `FR-AI-10` |

**Thành phần màn hình**

| # | Khối | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Thông tin xe và triệu chứng | `Nhãn` | Để đối chiếu |
| 2 | **Nút Gợi ý bằng AI** | `Nút` | Gọi `POST /quotation/suggest` (`FR-AI-06`) |
| 3 | Vùng gợi ý của AI | `Thẻ` | **Nền khác màu, có nhãn "Gợi ý của AI"** — phân biệt rõ với nội dung đã xác nhận |
| 4 | Hạng mục kiểm tra | `Bảng` | Thêm/sửa/xóa dòng, chọn từ danh mục dịch vụ |
| 5 | Phụ tùng thay thế | `Bảng` | Chọn phụ tùng, số lượng; **hiện tồn kho cửa hàng ngay cạnh** |
| 6 | Cảnh báo thiếu phụ tùng | `Nhãn` | Kèm nút "Tạo yêu cầu điều phối" dẫn sang `SCR-A-21` |
| 7 | Tổng chi phí | `Nhãn` | Tự tính = phí dịch vụ + chi phí phụ tùng (`BR-06`) |
| 8 | Nút Lưu báo giá | `Nút` | |

**Quy tắc nghiệp vụ**

- Gợi ý của AI **không được tự ghi vào báo giá** — nhân viên phải xác nhận từng dòng (`FR-AI-10`, `TKD-15`). Nút "Áp dụng gợi ý" chỉ đổ dữ liệu vào bảng ở dạng sửa được.
- Giá lấy từ **bảng giá chung toàn chuỗi** (`FR-SRV-06`), Staff không sửa được đơn giá tại đây (`BR-48`).
- Tồn kho **chưa bị trừ** khi lập báo giá — chỉ trừ khi booking chuyển sang *Hoàn thành* (`FR-SHP-18`).
- Khi phụ tùng không đủ, booking **giữ nguyên trạng thái *Chờ xác nhận*** và nhân viên bật cờ Chờ phụ tùng ở `SCR-A-04` (`BR-35`, `DEC-16`).
- Báo giá diễn ra **trong** trạng thái *Đang tiến hành*, không phải một trạng thái riêng (mục 7.1 `RD-2026-001`).

---

## B.12 — `SCR-A-12` Cập nhật tiến độ sửa chữa

| | |
| --- | --- |
| Đường dẫn | `cms.…/bookings/{id}/progress` |
| Vai trò | Staff ⬤, Admin |
| API | `PATCH /cms/bookings/{id}/progress`, `/status` |
| FR | `FR-BKG-17`, `FR-RPR-03`, `FR-RPR-04` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Trạng thái hiện tại | `CMP-06` | |
| 2 | Ghi chú tiến độ | `Vùng văn bản` | **Khách nhìn thấy** ở `SCR-C-28` — khác với ghi chú nội bộ |
| 3 | Nút Hoàn thành | `Nút` | Chuyển `IN_PROGRESS` → `COMPLETED` |
| 4 | Kết quả dịch vụ | `Vùng văn bản` | Ghi vào lịch sử bảo dưỡng của xe (`FR-RPR-04`) |
| 5 | Phụ tùng đã dùng | `Bảng` | Xác nhận trước khi trừ tồn kho |

**Quy tắc nghiệp vụ**

- Chuyển trạng thái ở đây là **thủ công** (`BR-17`, `FR-BKG-17`).
- Khi bấm Hoàn thành, hệ thống thực hiện đồng thời: chuyển trạng thái, **trừ tồn kho phụ tùng của cửa hàng thực hiện** (`FR-SHP-18`), ghi bản ghi vào `maintenance_histories` (`FR-RPR-04`), ghi `inventory_logs` (`BR-31`).
- Cần phân biệt rõ hai loại ghi chú: **ghi chú tiến độ** (khách thấy) và **ghi chú nội bộ** ở `SCR-A-04` (khách không thấy, `FR-BKG-26`).

---

## B.13 — `SCR-A-13` Cập nhật thanh toán

| | |
| --- | --- |
| Loại | Hộp thoại trên `SCR-A-04` |
| Vai trò | Staff ⬤, Admin |
| API | `PATCH /cms/bookings/{id}/payment` |
| FR | `FR-PAY-01`, `FR-PAY-02`, `DEC-28` |

**Thành phần:** tổng tiền (chỉ đọc), hình thức thanh toán ✱ (**Tiền mặt / Chuyển khoản**), trạng thái ✱ (Chưa thanh toán / Đã thanh toán), ghi chú, nút Lưu.

**Quy tắc nghiệp vụ**

- Giai đoạn đầu **chỉ thanh toán tại cửa hàng** — không có cổng thanh toán trực tuyến (`FR-PAY-01`, `CS-02`).
- Trạng thái "đã thanh toán" do **cả Admin và Staff cập nhật thủ công** (`FR-PAY-02`, `BR-07`, `DEC-28`). Staff chỉ thao tác được trên booking của cửa hàng mình.
- Trạng thái thanh toán là **trường riêng biệt**, không nằm trong 5 trạng thái booking — một booking *Hoàn thành* vẫn có thể *Chưa thanh toán*.
- Khách hàng đã chốt tại `DEC-28`: **cả Admin và Staff** cập nhật được trạng thái thanh toán, vì đây là thao tác hằng ngày tại quầy khi khách trả tiền. `BR-07` của `RD-2026-001` đã được sửa lại theo quyết định này ở v1.17.
- Cần phân biệt với quyền **báo cáo** ở `SCR-A-30`: quyền đó **chỉ thuộc Admin**. Hai quyền đi theo hai hướng ngược nhau.

---

## B.14 — `SCR-A-14` Hóa đơn

| | |
| --- | --- |
| Đường dẫn | `cms.…/invoices` |
| Vai trò | Staff ⬤, Admin |
| API | `GET /cms/invoices/export` |
| FR | `FR-PAY-03`, `FR-PAY-04` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Chọn ngày | `Ngày` | Mặc định hôm nay |
| 2 | Danh sách booking trong ngày | `CMP-08` | Có ô chọn từng dòng |
| 3 | Nút Xuất PDF | `Nút` | Xuất từng hóa đơn hoặc hàng loạt |
| 4 | Nút In | `Nút` | Mở hộp thoại in của trình duyệt |
| 5 | Xem trước hóa đơn | `Nhãn` | |

**Nội dung hóa đơn**

Thông tin công ty (tên, địa chỉ, mã số thuế, số điện thoại) `FR-PAY-04` · Thông tin cửa hàng · Thông tin khách · Danh sách dịch vụ và phụ tùng · Tổng tiền · Hình thức và trạng thái thanh toán · Ngày xuất.

**Quy tắc nghiệp vụ**

- ⚠ `OQ-10` — chưa rõ "hóa đơn theo ngày" (`FR-PAY-03`) nghĩa là **một hóa đơn tổng hợp cả ngày** hay **từng hóa đơn của các booking trong ngày**. Thiết kế hiện theo phương án thứ hai vì phù hợp với việc `FR-PAY-02` cập nhật thanh toán theo từng booking. **Cần khách hàng xác nhận.**
- ⚠ `OQ-15` — khách không cung cấp email thì nhận hóa đơn thế nào. Thiết kế hiện chỉ có **bản in tại cửa hàng**.

---

## B.15 — `SCR-A-15` Danh sách thông báo

| | |
| --- | --- |
| Đường dẫn | `cms.…/notifications` |
| Vai trò | Staff ⬤, Admin |
| API | `GET /cms/notifications`, `PATCH /{id}/read`, `PATCH /read-all`, WS `/ws/notifications` |
| FR | `FR-NTF-11`…`FR-NTF-21` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Badge số chưa đọc | `CMP-07` | Trên thanh điều hướng, mọi màn hình (`FR-NTF-11`) |
| 2 | Bộ lọc loại sự kiện | `Chọn nhiều` | Booking mới · Hủy · Đổi lịch · **Quá hạn** · Điều phối phụ tùng (`FR-NTF-17`, `FR-NTF-19`) |
| 3 | Bộ lọc khoảng thời gian | `Ngày` | (`FR-NTF-17`) |
| 4 | Danh sách thông báo | `Thẻ` | **Mới nhất trước**, phân biệt rõ đã đọc / chưa đọc (`FR-NTF-12`) |
| 5 | Nội dung mỗi thông báo | `Nhãn` | Loại sự kiện, **tên khách**, dịch vụ, thời gian hẹn, thời điểm phát sinh (`FR-NTF-14`) |
| 6 | **Số điện thoại khách** | `Nhãn` | **Chỉ với loại "Quá hạn"** — hiện ngay để gọi, không phải mở thêm màn hình (`FR-NTF-20`) |
| 7 | Nút Đánh dấu đã đọc tất cả | `Nút` | (`FR-NTF-15`) |

**Quy tắc nghiệp vụ**

- Thông báo **chỉ đẩy tới cửa hàng liên quan** — Staff cửa hàng A không nhận thông báo của cửa hàng B (`FR-SHP-35`). Việc lọc thực hiện ở phía máy chủ qua phòng WebSocket `shop:{shopId}`.
- **Chỉ thao tác của khách mới sinh thông báo**; thao tác do chính Admin/Staff thực hiện thì không (`BR-20`).
- Thông báo CMS **không thay thế** SMS/email gửi cho khách — hai luồng độc lập (`BR-21`).
- Bấm vào thông báo mở thẳng màn hình chi tiết booking liên quan (`FR-NTF-13`).
- Thông báo **quá hạn** là loại sự kiện riêng, phân biệt được với các loại khác (`FR-NTF-19`), và mỗi booking **chỉ sinh một thông báo duy nhất** dù tiến trình chạy lại nhiều lần (`FR-NTF-21`).
- ⚠ `OQ-23` — hiện dùng WebSocket có dự phòng polling 30 giây (`FR-NTF-16`, `TKD-14`). Phần **âm thanh cảnh báo** khi có booking mới đã chừa chỗ nhưng mặc định tắt.

---

## B.16 — `SCR-A-16` Quản lý dịch vụ

| | |
| --- | --- |
| Đường dẫn | `cms.…/master/services` |
| Vai trò | **Chỉ Admin** |
| API | `GET/POST/PATCH/DELETE /cms/services` |
| FR | `FR-SRV-04`, `FR-SRV-06`, `FR-SRV-07`, `FR-ADM-01` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Bảng dịch vụ | `CMP-08` | Tên (3 ngôn ngữ), nhóm, giá, trạng thái |
| 2 | Nút Thêm dịch vụ | `Nút` | |
| 3 | Biểu mẫu thêm/sửa | `Text` `Chọn` | Tên `ja` `vi` `en` ✱, nhóm ✱ (Bảo dưỡng / Sửa chữa), mô tả, **bảng giá theo điều kiện** |
| 4 | Bảng giá theo điều kiện | `Bảng` | Bảo dưỡng: theo **loại nhiên liệu** · Sửa chữa: theo **mức độ lỗi** (`FR-SRV-02`, `FR-SRV-03`) |
| 5 | Cảnh báo phạm vi | `Nhãn` | **"Giá này áp dụng cho toàn bộ cửa hàng trong chuỗi."** |

**Quy tắc nghiệp vụ**

- **Chỉ Admin** vào được màn hình này. Staff sửa giá sẽ ảnh hưởng tới mọi cửa hàng, nên quyền này thuộc cấp chuỗi (`BR-48`, `DEC-24`).
- Bảng giá **dùng chung toàn chuỗi** — biểu mẫu **không có** trường chọn cửa hàng (`FR-SRV-06`, `BR-32`).
- Sửa giá một lần là **áp dụng đồng thời cho tất cả cửa hàng** (`FR-SRV-07`) — cần hộp thoại xác nhận nêu rõ điều này.
- Dịch vụ **không có trường thời lượng** (`BR-41`, `DEC-25`). Đây là điểm dễ bị thêm nhầm khi dựng biểu mẫu.
- Xóa dịch vụ là **xóa mềm**; dịch vụ đang gắn với booking chưa hoàn tất thì không xóa được.
- ⚠ `OQ-39` — chưa chốt việc có cần **lịch sử thay đổi giá** hay không, và booking tạo trước khi đổi giá thì áp giá cũ hay giá mới. Thiết kế hiện: báo giá chốt giá tại thời điểm lập, không lưu lịch sử bảng giá.

---

## B.17 — `SCR-A-17` Quản lý phụ tùng

| | |
| --- | --- |
| Đường dẫn | `cms.…/master/parts` |
| Vai trò | **Chỉ Admin** |
| API | `GET/POST/PATCH/DELETE /cms/parts` |
| FR | `FR-PRT-01`, `FR-PRT-02`, `FR-ADM-03` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Bảng phụ tùng | `CMP-08` | Mã, tên, hãng, quy cách, **giá**, ảnh |
| 2 | Ô tìm và lọc theo hãng | `Text` `Chọn` | |
| 3 | Nút Thêm thủ công | `Nút` | |
| 4 | **Nút Nhập bằng AI** | `Nút` | Dẫn sang `SCR-A-18` |
| 5 | Biểu mẫu thêm/sửa | | Mã ✱, tên (3 ngôn ngữ) ✱, hãng, quy cách, giá ✱, ảnh |

**Quy tắc nghiệp vụ**

- Giá phụ tùng là cơ sở tính chi phí dịch vụ (`FR-PRT-02`, `BR-06`) và **dùng chung toàn chuỗi** (`BR-32`).
- Màn hình này quản lý **danh mục** phụ tùng. **Số lượng tồn kho quản lý riêng theo từng cửa hàng** ở `SCR-A-19` (`BR-30`) — hai khái niệm này không được trộn vào nhau.

---

## B.18 — `SCR-A-18` Nhập phụ tùng bằng AI

| | |
| --- | --- |
| Đường dẫn | `cms.…/master/parts/ai-import` |
| Vai trò | **Chỉ Admin** |
| API | `POST /cms/parts/ai-extract`, `POST /cms/parts` |
| FR | `FR-PRT-03`, `FR-PRT-04`, `FR-AI-08`, `FR-AI-10` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Vùng tải ảnh | `Tệp` | Ảnh **phụ tùng** hoặc **hộp/vỏ phụ tùng** (`FR-PRT-03`); kéo thả hoặc chụp trực tiếp |
| 2 | Trạng thái đang xử lý | `CMP-12` | Có thanh tiến trình |
| 3 | **Biểu mẫu do AI điền sẵn** | `Text` | Mã, tên, hãng, quy cách — **nền khác màu, có nhãn "AI đề xuất"** |
| 4 | Chỉ số tin cậy từng trường | `Nhãn` | Trường có độ tin cậy thấp được đánh dấu để người kiểm lại |
| 5 | Giá | `Số` | ✱ — **AI không đề xuất giá**, phải nhập tay |
| 6 | Nút Lưu | `Nút` | |
| 7 | Nút Tải ảnh khác | `Nút` | |

**Quy tắc nghiệp vụ**

- Admin **xem lại, chỉnh sửa và xác nhận** thông tin do AI sinh ra **trước khi lưu** (`FR-PRT-04`, `FR-AI-10`). Hệ thống **không** được tự lưu vào danh mục.
- Kết quả AI trả về là **đối tượng nháp**, chưa ghi vào cơ sở dữ liệu (`TKD-15`).
- Mục tiêu là **giảm khối lượng nhập liệu** cho Admin (`RQ §10`), không phải thay thế hoàn toàn thao tác của người.

---

## B.19 — `SCR-A-19` Tồn kho cửa hàng

| | |
| --- | --- |
| Đường dẫn | `cms.…/inventory` |
| Vai trò | Staff ⬤, Admin |
| API | `GET /cms/inventory`, `GET /cms/inventory/logs` |
| FR | `FR-SHP-12`, `FR-SHP-19`, `FR-SHP-20` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Bảng tồn kho | `CMP-08` | Phụ tùng, **số lượng hiện có**, ngưỡng tối thiểu, trạng thái |
| 2 | Nhãn cảnh báo | `Nhãn` | Màu đỏ khi số lượng dưới ngưỡng (`FR-SHP-19`) |
| 3 | Bộ lọc "Chỉ hiện hàng sắp hết" | `Bật tắt` | |
| 4 | Nút Điều chỉnh số lượng | `Nút` | Mở hộp thoại, **bắt buộc nhập lý do** |
| 5 | Nút Tìm ở cửa hàng khác | `Nút` | Dẫn sang `SCR-A-20` |
| 6 | Tab Nhật ký biến động | `Bảng` | Thời điểm, phụ tùng, thay đổi, lý do, người thực hiện (`FR-SHP-20`) |

**Quy tắc nghiệp vụ**

- Tồn kho quản lý **riêng theo từng cửa hàng**, không có kho chung toàn chuỗi (`BR-30`). Staff chỉ thấy kho cửa hàng mình.
- Mọi thay đổi số lượng đều sinh một bản ghi `inventory_logs` với lý do thuộc `{Dùng cho booking, Điều phối đi, Điều phối đến, Điều chỉnh}` (`BR-31`).
- Phụ tùng **chỉ được chuyển giữa các cửa hàng thông qua yêu cầu điều phối có ghi nhận**, không tự ý trừ cộng (`BR-31`).
- ⚠ `OQ-34` — **nhập hàng từ nhà cung cấp hiện nằm ngoài phạm vi**. Màn hình này chỉ theo dõi số lượng hiện có và điều phối nội bộ. Đây là điểm ảnh hưởng phạm vi dự án, cần khách hàng chốt.

---

## B.20 — `SCR-A-20` Tra cứu tồn kho toàn chuỗi

| | |
| --- | --- |
| Đường dẫn | `cms.…/inventory/lookup` |
| Vai trò | **Staff (không giới hạn cửa hàng)**, Admin |
| API | `GET /cms/inventory/lookup` |
| FR | `FR-SHP-13`, `FR-SHP-37` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Ô tìm phụ tùng | `Text` | ✱ |
| 2 | Bảng kết quả | `Bảng` | Cửa hàng, **số lượng còn**, khoảng cách (nếu có) |
| 3 | Nút Tạo yêu cầu điều phối | `Nút` | Trên từng dòng, dẫn sang `SCR-A-21` |

**Quy tắc nghiệp vụ**

- Đây là **ngoại lệ thứ nhất** của quy tắc cô lập dữ liệu (`BR-43`, `FR-SHP-37`): nhân viên tra cứu được tồn kho của các cửa hàng khác.
- Ngoại lệ này **hẹp và có kiểm soát** — màn hình **chỉ hiển thị số lượng**, tuyệt đối không hiển thị booking, khách hàng, hay bất kỳ dữ liệu nghiệp vụ nào khác của cửa hàng bạn.
- API phía máy chủ phải trả về đúng tập trường tối thiểu, không dựa vào giao diện để ẩn bớt (`FR-SHP-36`).

---

## B.21 — `SCR-A-21` Tạo yêu cầu điều phối phụ tùng

| | |
| --- | --- |
| Đường dẫn | `cms.…/part-transfers/new` |
| Vai trò | Staff ⬤, Admin |
| API | `POST /cms/part-transfers` |
| FR | `FR-SHP-14` |

**Thành phần màn hình**

| # | Thành phần | Loại | Bắt buộc | Quy tắc |
| --- | --- | --- | :---: | --- |
| 1 | Phụ tùng | `Chọn` | ✱ | |
| 2 | Số lượng | `Số` | ✱ | Không vượt quá tồn kho cửa hàng nguồn |
| 3 | Cửa hàng nguồn | `Chọn` | ✱ | Chỉ hiện cửa hàng còn hàng (`FR-SHP-13`) |
| 4 | Booking liên quan | `Chọn` | — | Để hiển thị ngược lại trên `SCR-A-04` |
| 5 | Ghi chú / mức độ gấp | `Vùng văn bản` | — | |
| 6 | Nút Gửi yêu cầu | `Nút` | | |

**Quy tắc nghiệp vụ**

- Yêu cầu khởi tạo ở trạng thái **Chờ phản hồi** (mục 7.2 `RD-2026-001`).
- Cửa hàng nguồn **nhận thông báo trong CMS** ngay khi có yêu cầu (`FR-SHP-16`).
- **Tồn kho chưa thay đổi** ở bước này (`BR-34`).

**Thông báo lỗi**

| Mã | Câu chữ hiển thị |
| --- | --- |
| `ERR-INV-01` | "Cửa hàng nguồn không còn đủ số lượng. Xin chọn cửa hàng khác." |

---

## B.22 — `SCR-A-22` Danh sách yêu cầu điều phối

| | |
| --- | --- |
| Đường dẫn | `cms.…/part-transfers` |
| Vai trò | Staff ⬤, Admin |
| API | `GET /cms/part-transfers?direction=` |
| FR | `FR-SHP-15` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Tab **Yêu cầu gửi đi** | `Bảng` | Cửa hàng mình đề nghị lấy hàng về |
| 2 | Tab **Yêu cầu nhận về** | `Bảng` | Cửa hàng khác xin hàng của mình — **cần mình xử lý** |
| 3 | Cột trạng thái | `CMP-06` | Chờ phản hồi · Đã đồng ý · Bị từ chối · Đang chuyển · Đã nhận |
| 4 | Cột **Ngày gửi đi** | `Nhãn` | Nhãn ghi rõ *"Ngày gửi đi"*, không phải "ngày nhận" (`BR-37`) |
| 5 | Nhãn cảnh báo | `Nhãn` | Yêu cầu quá hạn chưa nhận được hàng (`FR-SHP-26`) |

**Quy tắc nghiệp vụ**

- Tab số 2 là danh sách việc cần làm — nên hiển thị badge số lượng chờ xử lý.
- Cột số 4 dễ bị hiểu nhầm nhất trong toàn hệ thống: đây là **ngày cửa hàng nguồn gửi hàng đi**, không phải ngày hàng tới nơi (`DEC-17`, `BR-37`).

---

## B.23 — `SCR-A-23` Chi tiết & duyệt yêu cầu điều phối

| | |
| --- | --- |
| Đường dẫn | `cms.…/part-transfers/{id}` |
| Vai trò | Staff ⬤, Admin |
| API | `PATCH /approve`, `/reject`, `/ship`, `/receive`, `POST /resend` |
| FR | `FR-SHP-17`, `21`, `22`, `23`, `24`, `27` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Thông tin yêu cầu | `Nhãn` | Phụ tùng, số lượng, hai cửa hàng, booking liên quan |
| 2 | Dòng thời gian trạng thái | `Nhãn` | Theo vòng đời mục 7.2 `RD-2026-001` |
| 3 | Tồn kho hiện tại của mình | `Nhãn` | Để cân nhắc trước khi đồng ý |
| 4 | **Nút Đồng ý** | `Nút` | Mở hộp thoại **bắt buộc chọn ngày bàn giao** (`FR-SHP-22`) |
| 5 | **Nút Từ chối** | `Nút` | Mở hộp thoại **bắt buộc nhập lý do** (`FR-SHP-21`) |
| 6 | Nút Đã gửi đi | `Nút` | Chuyển sang *Đang chuyển* |
| 7 | Nút Đã nhận được | `Nút` | **Bắt buộc nhập ngày nhận thực tế** (`FR-SHP-27`) |
| 8 | Nút Gửi lại sang cửa hàng khác | `Nút` | Chỉ hiện khi trạng thái *Bị từ chối* (`FR-SHP-24`) |
| 9 | Ghi chú nhắc nhở | `Nhãn` | **"Ngày bàn giao là ngày gửi hàng đi. Khi hẹn ngày trả xe cho khách, xin cộng thêm thời gian vận chuyển."** (`FR-SHP-25`) |

**Quy tắc theo vai trò**

| Người xem | Nút hiện |
| --- | --- |
| Cửa hàng **nguồn** | Đồng ý · Từ chối · Đã gửi đi |
| Cửa hàng **nhận** | Đã nhận được · Gửi lại sang cửa hàng khác |

**Quy tắc nghiệp vụ**

- Cửa hàng nguồn **có quyền từ chối**, và **phải nêu lý do** (`FR-SHP-21`, `BR-33`).
- **Ngày bàn giao do cửa hàng nguồn quyết định**, không phải cửa hàng nhận đề xuất (`FR-SHP-22`).
- **Tồn kho chỉ thay đổi khi đạt trạng thái *Đã nhận*** — trừ kho nguồn, cộng kho nhận (`BR-34`, `FR-SHP-17`). Không trừ kho ngay lúc đồng ý.
- Nhánh **Bị từ chối là điểm kết thúc**; muốn lấy phụ tùng thì tạo yêu cầu mới tới cửa hàng khác, nhưng nút số 8 cho phép làm việc đó **mà không phải nhập lại từ đầu** (`FR-SHP-24`).
- Sau khi đạt *Đã nhận*, hệ thống **gợi ý bỏ cờ Chờ phụ tùng** trên booking liên quan và nhắc nhân viên liên hệ khách chốt ngày hẹn mới (`FR-BKG-30`, `FR-BKG-31`).
- ⚠ `OQ-41` — khoảng dự phòng để cảnh báo phụ tùng chưa tới hiện đặt tạm **3 ngày** (`FR-SHP-26`, `BAT-06`).

---

## B.24 — `SCR-A-24` Quản lý cửa hàng

| | |
| --- | --- |
| Đường dẫn | `cms.…/master/shops` |
| Vai trò | **Chỉ Admin** |
| API | `GET/POST/PATCH/DELETE /cms/shops` |
| FR | `FR-SHP-01`, `FR-SHP-04`, `FR-ADM-07` |

**Thành phần:** bảng cửa hàng (tên, **địa chỉ**, số điện thoại, số nhân viên, trạng thái), biểu mẫu thêm/sửa, nút mở cấu hình giờ làm việc (`SCR-A-25`) và năng lực (`SCR-A-26`).

**Quy tắc nghiệp vụ**

- Hệ thống **vận hành nhiều cửa hàng ngay từ đầu** (`AS-01`, `DEC-11`) — không phải một cửa hàng rồi mở rộng sau.
- Thêm cửa hàng mới **chỉ là thêm một bản ghi dữ liệu**, không cần sửa cấu hình mã nguồn (`NFR-PRF-05`).
- Không xóa được cửa hàng còn booking chưa hoàn tất hoặc còn tồn kho; thay vào đó chuyển sang trạng thái ngừng hoạt động.
- Mỗi booking **luôn thuộc về đúng một cửa hàng** tại mọi thời điểm (`BR-27`, `FR-SHP-04`).

---

## B.25 — `SCR-A-25` Giờ làm việc & ngày nghỉ

| | |
| --- | --- |
| Đường dẫn | `cms.…/master/shops/{id}/schedules` |
| Vai trò | **Chỉ Admin** |
| API | `GET/PUT /cms/shops/{id}/schedules` |
| FR | `FR-SHP-28`, `FR-SHP-30` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Bảng giờ làm việc theo tuần | `Bảng` | 7 dòng: thứ, giờ mở, giờ đóng, công tắc **Nghỉ** (`FR-SHP-28`) |
| 2 | Danh sách ngày nghỉ đặc biệt | `Bảng` | Ngày, lý do — ngày lễ Nhật Bản, nghỉ đột xuất (`FR-SHP-30`) |
| 3 | Nút Thêm ngày nghỉ | `Nút` | |
| 4 | Xem trước lịch tháng | `Nhãn` | Đánh dấu ngày nghỉ, để Admin kiểm tra trực quan |
| 5 | Cảnh báo ảnh hưởng | `Nhãn` | Hiện khi có booking đã đặt vào ngày sắp chuyển thành ngày nghỉ |

**Quy tắc nghiệp vụ**

- Giờ làm việc và ngày nghỉ cấu hình **riêng cho từng cửa hàng**, **không có cấu hình dùng chung toàn chuỗi** (`BR-40`, `DEC-19`).
- Ngày nghỉ đặc biệt **ghi đè** lịch thường lệ theo thứ trong tuần.
- Khách **không đặt được** vào ngày nghỉ hoặc ngoài giờ làm việc (`FR-BKG-35`) — thực hiện bằng cách **không hiển thị** các lựa chọn đó ở `SCR-C-14`.
- Cảnh báo số 5 rất quan trọng: chuyển một ngày đã có booking thành ngày nghỉ **không tự hủy** các booking đó — nhân viên phải liên hệ khách và xử lý thủ công, đúng tinh thần `BR-23`.

---

## B.26 — `SCR-A-26` Năng lực khung giờ

| | |
| --- | --- |
| Đường dẫn | `cms.…/master/shops/{id}/capacities` |
| Vai trò | **Chỉ Admin** |
| API | `GET/PUT /cms/shops/{id}/capacities` |
| FR | `FR-SHP-29` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Độ dài khung giờ | `Chọn` | 30 phút · 60 phút |
| 2 | Bảng khung giờ | `Bảng` | Mỗi dòng: khung giờ, **số booking tối đa** (`FR-SHP-29`) |
| 3 | Nút Áp dụng cho mọi khung | `Nút` | Đặt nhanh cùng một giá trị |
| 4 | Ghi chú | `Nhãn` | **"Năng lực tính theo số lượng booking, không theo thời lượng dịch vụ."** |

**Quy tắc nghiệp vụ**

- Khả năng nhận booking tính **thuần theo số lượng booking trong khung giờ** (`BR-41`, `DEC-25`). Màn hình **không có** bất kỳ trường nào liên quan tới thời lượng dịch vụ hay số kỹ thuật viên.
- Cấu hình **riêng theo từng cửa hàng** (`BR-40`).
- Đây là **giới hạn cứng** áp dụng với khách (`FR-BKG-35`), khác với khái niệm "quá tải" vốn là **đánh giá của nhân viên** ở `SCR-A-27` (`BR-46`).

---

## B.27 — `SCR-A-27` Bảng tải theo khung giờ

| | |
| --- | --- |
| Đường dẫn | `cms.…/capacity-board` |
| Vai trò | Staff ⬤, Admin |
| API | `GET /cms/shops/load`, `PATCH /cms/shops/{id}/slots/{slotId}/block` |
| FR | `FR-SHP-32`, `FR-SHP-38`, `FR-SHP-41`, `FR-SHP-42` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Chọn ngày | `Ngày` | |
| 2 | Bảng tải cửa hàng mình | `Bảng` | Mỗi khung giờ: **đã nhận / tối đa**, thanh trực quan (`FR-SHP-32`) |
| 3 | **Công tắc Đánh dấu quá tải** | `Bật tắt` | Trên từng khung giờ (`FR-SHP-42`) |
| 4 | Bảng tải cửa hàng khác | `Bảng` | **Chỉ hiện còn chỗ / hết chỗ** (`FR-SHP-38`) |
| 5 | Ghi chú | `Nhãn` | **"Số liệu này là thông tin tham khảo. Việc kết luận cửa hàng có quá tải hay không do nhân viên tự đánh giá."** |

**Quy tắc nghiệp vụ**

- Hệ thống **chỉ cung cấp số liệu**, **không tự kết luận quá tải** — việc đánh giá thuộc về nhân viên (`FR-SHP-32`, `DEC-23`).
- Nhân viên **chủ động gợi ý khách chuyển cửa hàng** dựa trên đánh giá của mình (`FR-SHP-41`), không cần hệ thống tự phát hiện.
- Công tắc số 3 cho phép **tạm dừng nhận thêm booking ở một khung giờ kể cả khi chưa đạt mức tối đa** (`FR-SHP-42`). Khi bật, khung giờ đó biến mất khỏi `SCR-C-14`.
- Bảng số 4 là **ngoại lệ thứ hai** của quy tắc cô lập dữ liệu (`BR-43`): chỉ thấy mức độ bận, không thấy chi tiết booking của cửa hàng khác.
- Cần phân biệt rõ hai khái niệm (`BR-46`): **giới hạn nhận booking** là ràng buộc cứng do hệ thống áp dụng (`SCR-A-26`), còn **quá tải** là đánh giá của con người (màn hình này).

---

## B.28 — `SCR-A-28` Quản lý khách hàng

| | |
| --- | --- |
| Đường dẫn | `cms.…/customers` |
| Vai trò | Staff ⬤, Admin |
| API | `GET /cms/customers` |
| FR | `FR-ADM-06`, `FR-BKG-15` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Ô tìm | `Text` | Theo **số điện thoại**, tên, biển số |
| 2 | Bảng khách hàng | `CMP-08` | Tên, SĐT, số xe, số lần dịch vụ, lần gần nhất, **có tài khoản hay không** |
| 3 | Chi tiết khách hàng | `Thẻ` | Danh sách xe, lịch sử booking, lịch sử bảo dưỡng |

**Quy tắc nghiệp vụ**

- Hồ sơ khách hàng **định danh bằng số điện thoại**, tồn tại cả khi khách chưa có tài khoản (`BR-12`, `FR-BKG-15`).
- Nhờ vậy, các booking khách đặt với tư cách Guest ở nhiều thời điểm khác nhau vẫn **gom về một hồ sơ**.
- Staff chỉ thấy khách hàng đã từng dịch vụ tại **cửa hàng mình** (`BR-42`, `FR-SHP-34`); Admin thấy toàn chuỗi (`FR-SHP-39`).
- Dữ liệu cá nhân được bảo vệ theo quy định pháp luật Nhật Bản (`NFR-SEC-04`) ⚠ `OQ-06` — thời hạn lưu trữ chưa được xác nhận.

---

## B.29 — `SCR-A-29` Người dùng & phân quyền

| | |
| --- | --- |
| Đường dẫn | `cms.…/master/staff` |
| Vai trò | **Chỉ Admin** |
| API | `GET/POST/PATCH/DELETE /cms/staff` |
| FR | `FR-ADM-05`, `FR-SHP-02` |

**Thành phần màn hình**

| # | Thành phần | Loại | Bắt buộc | Quy tắc |
| --- | --- | --- | :---: | --- |
| 1 | Bảng tài khoản | `CMP-08` | | Tên, tài khoản, **vai trò**, **cửa hàng**, trạng thái, lần đăng nhập cuối |
| 2 | Vai trò | `Chọn` | ✱ | **Staff** hoặc **Admin** |
| 3 | Cửa hàng | `Chọn` | ✱ khi vai trò là Staff | Mỗi tài khoản Staff **gắn với một cửa hàng** (`FR-SHP-02`) |
| 4 | Nút Đặt lại mật khẩu | `Nút` | | |
| 5 | Nút Khóa tài khoản | `Nút` | | Thay cho xóa |

**Quy tắc nghiệp vụ**

- Hệ thống có **4 vai trò** trên thực tế: Guest, User, Staff, Admin. Màn hình này chỉ quản lý hai vai trò phía cửa hàng.
- **Admin nhìn toàn chuỗi, Staff chỉ nhìn cửa hàng mình** (`DEC-24`, `BR-47`). Trường "cửa hàng" bắt buộc với Staff và không áp dụng với Admin.
- Đây là điểm **khác với `RQ §3.1`** vốn gộp chung *"Admin/Staff: Full quyền"*. Thay đổi này cần nêu rõ khi trao đổi lại với khách hàng.
- Mọi thao tác trên màn hình này ghi vào `audit_logs` (`NFR-SEC-06`).
- Quyền **xem báo cáo** đã chốt tại `DEC-28`: **không cấp cho Staff**. Quyền **cập nhật thanh toán** thì có. Vai trò chọn ở ô số 2 quyết định cả hai.
- ⚠ `OQ-05` — điểm duy nhất còn lại: Staff có được **xóa** booking và dữ liệu không. Thiết kế hiện **không cấp quyền xóa**.

---

## B.30 — `SCR-A-30` Báo cáo & thống kê

| | |
| --- | --- |
| Đường dẫn | `cms.…/reports` |
| Vai trò | **Chỉ Admin** |
| API | `GET /cms/reports`, `GET /cms/reports/export` |
| FR | `FR-RPT-01`…`FR-RPT-07`, `FR-ADM-04`, `DEC-28` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Khoảng thời gian | `Ngày` | Theo **ngày / tháng** (`FR-RPT-02`) |
| 2 | Bộ chọn cửa hàng | `Chọn nhiều` | Lọc theo một hoặc nhiều cửa hàng trong chuỗi |
| 3 | Tab **Theo loại xe** | `Bảng` | (`FR-RPT-03`) |
| 4 | Tab **Theo dịch vụ và doanh thu** | `Bảng` | (`FR-RPT-05`) |
| 5 | Tab **Theo lý do hủy** | `Bảng` | **Tách riêng "khách chủ động hủy" và "khách không đến"** (`FR-RPT-06`) |
| 6 | Tab **So sánh giữa các cửa hàng** | `Bảng` | (`FR-RPT-07`) |
| 7 | Tab **Tồn kho theo cửa hàng** | `Bảng` | (`FR-RPT-07`) |
| 8 | Biểu đồ | `Nhãn` | Cột và đường, kèm bảng số liệu bên dưới |
| 9 | Nút Export | `Nút` | **Excel và PDF** (`FR-RPT-04`) |

**Quy tắc nghiệp vụ**

- **Chỉ Admin truy cập được màn hình này** (`FR-RPT-01`, `BR-08`, `DEC-28`). Staff **không xem được báo cáo, kể cả của chính cửa hàng mình**. Ma trận phân quyền mục 4.2 của `RD-2026-001` đã được sửa lại theo quyết định này ở v1.17.
- Vì Staff bị chặn ngay từ vai trò, màn hình này **không cần tới `ShopScopeGuard`** — `RolesGuard` ở lớp đầu đã đủ. Đây là màn hình duy nhất của CMS có dữ liệu theo cửa hàng mà không cần lớp lọc thứ hai.
- Không dựng biến thể giao diện "báo cáo cửa hàng mình" cho Staff: mục điều hướng tới màn hình này **không hiện** với tài khoản Staff.
- Tab số 5 là lý do tồn tại của trường lý do hủy (`FR-BKG-23`, `BR-24`): nếu chỉ có trạng thái *Đã hủy* chung chung thì không tách được hai nhóm này.
- Số liệu tính theo múi giờ `Asia/Tokyo` (`BR-10`).

---

## B.31 — `SCR-A-31` Trợ lý AI kỹ thuật viên ⚠

| | |
| --- | --- |
| Đường dẫn | `cms.…/ai-assistant` |
| Vai trò | Staff, Admin |
| API | `POST /cms/ai/tech-assistant` |
| FR | `FR-AI-07`, `FR-AI-10` |

**Thành phần màn hình**

| # | Thành phần | Loại | Quy tắc |
| --- | --- | --- | --- |
| 1 | Ô hỏi bằng ngôn ngữ tự nhiên | `Vùng văn bản` | (`FR-AI-07`) |
| 2 | Bộ lọc ngữ cảnh | `Chọn` | Hãng xe, model — thu hẹp phạm vi tra cứu |
| 3 | Khung trả lời | `Thẻ` | **Kèm trích dẫn nguồn tài liệu** |
| 4 | Câu hỏi gợi ý | `Nút` | Mã lỗi thường gặp, quy trình phổ biến |
| 5 | Nút gắn vào booking | `Nút` | Lưu nội dung tra cứu vào ghi chú nội bộ |

**Quy tắc nghiệp vụ**

- Kết quả là **tham khảo**, kỹ thuật viên phải tự đánh giá trước khi áp dụng (`FR-AI-10`).
- Câu trả lời **phải kèm trích dẫn nguồn** để thợ kiểm chứng — không được trả lời chung chung.
- ⚠ **Màn hình này phụ thuộc `OQ-11`**: tài liệu quy trình sửa chữa, mã lỗi và thông số kỹ thuật **có sẵn ở dạng số hay không**. Nếu tài liệu chỉ có bản giấy thì chức năng không khả thi và màn hình bị loại khỏi phạm vi. Đã tách thành khối độc lập để bỏ ra mà không ảnh hưởng màn hình khác.

---

## B.32 — `SCR-A-32` Danh mục lý do hủy

| | |
| --- | --- |
| Đường dẫn | `cms.…/master/cancel-reasons` |
| Vai trò | **Chỉ Admin** |
| API | `GET/POST/PATCH/DELETE /cms/cancel-reasons` |
| FR | `FR-BKG-23`, `FR-RPT-06` |

**Thành phần:** bảng lý do (tên 3 ngôn ngữ, thứ tự hiển thị, có yêu cầu ghi chú thêm hay không, trạng thái), biểu mẫu thêm/sửa.

**Quy tắc nghiệp vụ**

- Danh mục **bắt buộc có mục "Khách không đến"** (`FR-BKG-23`) — đây là mục hệ thống dùng để tách nhóm khi thống kê (`FR-RPT-06`, `BR-24`), nên **không cho xóa**.
- Lý do đã được dùng trong booking thì **không xóa cứng**, chỉ chuyển sang trạng thái ngừng sử dụng.
- ⚠ `OQ-28` — danh mục chưa được khách hàng chốt. Đề xuất: *Khách yêu cầu hủy · Khách không đến · Cửa hàng không đáp ứng được · Khách đổi sang lịch khác · Khác*.

---

# PHẦN C — TỔNG HỢP

## C.1 Các điểm cần khách hàng xác nhận

Trong quá trình đặc tả, phát hiện **hai chỗ mâu thuẫn nội bộ** giữa các mục của `RD-2026-001`. Thiết kế đã chọn một phương án và ghi rõ, nhưng cần khách hàng chốt lại.

| # | Mâu thuẫn | Khách hàng đã chốt (`DEC-28`) | Đã sửa ở đâu |
| --- | --- | --- | --- |
| 1 | `BR-07` ghi *"Chỉ Admin được chuyển trạng thái sang đã thanh toán"*, nhưng ma trận phân quyền mục 4.2 cho Staff quyền này (⬤) | **Cả Admin và Staff** — thao tác hằng ngày tại quầy. Ma trận đúng, `BR-07` sai | `RD-2026-001` v1.17 sửa `BR-07`, `FR-PAY-02`, mục 7.1, `AC-09`; đặc tả `SCR-A-13` |
| 2 | `FR-RPT-01` ghi *"Chỉ Admin được xem báo cáo"* và `BR-08` ghi *"Chỉ Admin được truy cập màn hình báo cáo, thống kê"*, nhưng `DEC-24` và ma trận mục 4.2 cho Staff xem báo cáo cửa hàng mình (⬤) | **Chỉ Admin** — Staff không xem được, kể cả cửa hàng mình. `FR-RPT-01` và `BR-08` đúng, ma trận sai | `RD-2026-001` v1.17 sửa **ma trận mục 4.2**, `FR-RPT-01`, `BR-08`, `AC-10`; đặc tả `SCR-A-30` |

Nguyên nhân của cả hai: `BR-07`, `BR-08` và `FR-RPT-01` được viết từ `RQ §6.2` và `RQ §9` khi hệ thống mới có **3 vai trò** và cụm *"Admin/Staff"* còn được gộp chung. Ma trận mục 4.2 thì đã được cập nhật ở v1.13 theo `DEC-24`. Ba mục kia chưa được rà lại theo thay đổi đó.

**Điểm đáng chú ý của `DEC-28`:** hai mâu thuẫn nhìn giống nhau nhưng được giải theo **hai hướng ngược nhau** — một bên ma trận đúng, một bên ma trận sai. Lý do là bản chất nghiệp vụ của hai quyền khác nhau:

- **Thanh toán** là thao tác **tác nghiệp tại quầy** — khách trả tiền thì nhân viên đánh dấu ngay, bắt phải chờ Admin sẽ làm nghẽn quầy.
- **Báo cáo** là thông tin **điều hành**, gồm doanh thu và so sánh giữa các cửa hàng — thuộc cấp quản lý chuỗi, không phải nhu cầu tác nghiệp hằng ngày.

Vì vậy khi lập trình, **không được gom hai quyền này vào cùng một nhóm quyền**.

## C.2 Điểm tồn đọng theo màn hình

| OQ | Màn hình ảnh hưởng |
| --- | --- |
| `OQ-05` Quyền **xóa** của Staff *(phần báo cáo đã chốt tại `DEC-28`)* | `SCR-A-29` |
| `OQ-06` Thời hạn lưu dữ liệu cá nhân | `SCR-A-28` |
| `OQ-08` Cách xác định chu kỳ bảo dưỡng | `SCR-C-12`, `SCR-C-24` |
| `OQ-10` Hóa đơn theo ngày | `SCR-A-14` |
| `OQ-11` Tài liệu kỹ thuật dạng số | **`SCR-A-31`** — quyết định màn hình này có tồn tại hay không |
| `OQ-14` OTP cho Guest | `SCR-C-15` |
| `OQ-15` Gửi hóa đơn khi không có email | `SCR-A-14` |
| `OQ-16` Gom booking cũ khi Guest đăng ký | `SCR-C-06` |
| `OQ-21` Hóa đơn khi hủy booking đã tiến hành | `SCR-A-04`, `SCR-A-07` |
| `OQ-23` Realtime hay polling, âm thanh cảnh báo | `SCR-A-15` |
| `OQ-24` Chatbox có sinh thông báo CMS không | `SCR-C-26` |
| `OQ-28` Danh mục lý do hủy | `SCR-A-07`, `SCR-A-32` |
| `OQ-34` Tồn kho có gồm đặt hàng nhà cung cấp | **`SCR-A-19`** — ảnh hưởng phạm vi dự án |
| `OQ-35` Khách tự đổi cửa hàng | `SCR-C-22` |
| `OQ-36` Gợi ý cửa hàng gần nhất | `SCR-C-04` |
| `OQ-39` Lịch sử thay đổi giá | `SCR-A-16` |
| `OQ-41` Khoảng dự phòng cảnh báo phụ tùng | `SCR-A-23` |
| `OQ-46` Mã QR khi đổi lịch | `SCR-C-21` |

## C.3 Lịch sử phiên bản

| Phiên bản | Ngày | Người lập | Nội dung |
| --- | --- | --- | --- |
| 1.1 | 2026-08-25 | Đội phát triển | Cập nhật theo `DEC-28`: `SCR-A-30` chuyển thành **chỉ Admin**, `SCR-A-13` xác nhận **cả Admin và Staff**. Mục C.1 chuyển từ *mâu thuẫn chờ xác nhận* sang *đã chốt*, bổ sung lý do vì sao hai mâu thuẫn được giải theo hai hướng ngược nhau |
| 1.0 | 2026-08-25 | Đội phát triển | Bản đầu tiên. Đặc tả đầy đủ 60 màn hình (28 site khách hàng, 32 CMS) theo mẫu thống nhất: thuộc tính, thành phần, hành động, quy tắc nghiệp vụ, thông báo lỗi. Phát hiện và ghi nhận 2 mâu thuẫn nội bộ trong `RD-2026-001` tại mục C.1 |

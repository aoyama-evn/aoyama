# Định nghĩa yêu cầu dự án
## Hệ thống quản lý dịch vụ bảo dưỡng & sửa chữa xe máy AOYAMA

| Hạng mục | Nội dung |
| --- | --- |
| Mã tài liệu | RD-2026-001 |
| Phiên bản | 1.17 (Draft) |
| Ngày lập | 2026-08-24 |
| Khách hàng | Mobility Enshu Railway Co., Ltd. — https://mobility.entetsu.co.jp/ |
| Đối tượng dịch vụ | Chuỗi cửa hàng xe máy AOYAMA — https://www.aoyama-shoukai.co.jp/ |
| Tài liệu nguồn | `docs/Requirements/Thu thập yêu cầu ban đầu.docx`, `docs/Requirements/Proposal.pptx` |
| Trạng thái | Chờ khách hàng xác nhận |

---

## 1. Giới thiệu

### 1.1 Mục đích tài liệu

Tài liệu này tổng hợp và chuẩn hóa toàn bộ yêu cầu của dự án từ hai tài liệu nguồn, làm cơ sở thống nhất giữa khách hàng và đội phát triển trước khi bước sang giai đoạn Mockup Design và thiết kế chi tiết.

### 1.2 Phạm vi tài liệu

Tài liệu mô tả **yêu cầu chức năng, yêu cầu phi chức năng, quy tắc nghiệp vụ và các điểm cần làm rõ**. Tài liệu **không** bao gồm thiết kế màn hình, thiết kế cơ sở dữ liệu chi tiết, kiến trúc kỹ thuật hay kế hoạch triển khai — các nội dung này thuộc các tài liệu giai đoạn sau.

### 1.3 Quy ước đọc tài liệu

| Ký hiệu | Ý nghĩa |
| --- | --- |
| `RQ §x` | Trích từ *Thu thập yêu cầu ban đầu.docx*, mục x |
| `PP sN` | Trích từ *Proposal.pptx*, slide N |
| (suy diễn) | Nội dung do đội phát triển bổ sung để hoàn chỉnh, **cần khách hàng xác nhận** |
| `DEC-xx` | Quyết định đã được chốt với khách hàng, ghi tại mục 12.1 |
| `OQ-xx` | Điểm còn cần làm rõ, ghi tại mục 12.2 |
| Must / Should / Could | Mức độ ưu tiên (MoSCoW) |

### 1.4 Thuật ngữ

| Thuật ngữ | Định nghĩa |
| --- | --- |
| Booking | Một lượt đặt lịch dịch vụ của khách hàng tại cửa hàng |
| Bảo dưỡng | Dịch vụ kiểm tra/bảo trì định kỳ, có tính chất lặp lại theo chu kỳ |
| Sửa chữa | Dịch vụ khắc phục sự cố phát sinh, không định kỳ |
| Guest | Người truy cập website chưa đăng nhập |
| User | Khách hàng đã có tài khoản |
| Admin/Staff | Nhân viên và quản trị viên cửa hàng |
| Reminder | Thông báo nhắc lịch tự động qua email/SMS |

---

## 2. Tổng quan dự án

### 2.1 Bối cảnh

Shizuoka là khu vực có tỷ lệ sử dụng xe máy cao và là trung tâm của ngành công nghiệp xe máy Nhật Bản. Mảng **bán xe** của chuỗi AOYAMA đã được số hóa thông qua một sàn thương mại điện tử bên thứ ba. Tuy nhiên mảng **bảo dưỡng, sửa chữa và chăm sóc khách hàng** vẫn đang quản lý theo phương thức truyền thống. `RQ §1` `PP s2`

### 2.2 Vấn đề hiện tại

| Đối tượng | Vấn đề |
| --- | --- |
| Khách hàng | Khó đặt lịch và theo dõi bảo dưỡng; không có lịch sử sửa chữa tập trung; thiếu thông tin minh bạch về dịch vụ |
| Cửa hàng | Quản lý thủ công, thiếu công cụ hỗ trợ; khó theo dõi khách hàng và phương tiện; quy trình tiếp nhận và báo giá mất nhiều thời gian |

`PP s2`

### 2.3 Mục tiêu

Xây dựng nền tảng số kết nối khách hàng và cửa hàng, hỗ trợ quản lý toàn bộ quy trình từ **đặt lịch → tiếp nhận xe → bảo dưỡng/sửa chữa → chăm sóc khách hàng sau dịch vụ**. `PP s2`

Lợi ích kỳ vọng: `PP s5`

- **Khách hàng** — đặt lịch thuận tiện, theo dõi được lịch sử bảo dưỡng, minh bạch thông tin dịch vụ.
- **Cửa hàng** — chuẩn hóa quy trình, nâng cao hiệu quả quản lý, tăng chất lượng dịch vụ và tỷ lệ khách quay lại.
- **Doanh nghiệp** — nền tảng kết nối nhiều cửa hàng, dễ mở rộng dịch vụ trong tương lai.

### 2.4 Kiến trúc chức năng tổng thể

Hệ thống gồm 3 khối chức năng: `PP s3`

| Khối | Nhóm chức năng |
| --- | --- |
| **Ứng dụng khách hàng** | Quản lý phương tiện · Đặt lịch bảo dưỡng, sửa chữa · Theo dõi tiến độ sửa chữa · Lịch sử bảo dưỡng · Nhắc lịch bảo dưỡng |
| **Hệ thống cửa hàng** | Quản lý lịch hẹn · Tiếp nhận xe · Báo giá · Quản lý sửa chữa · Quản lý phụ tùng |
| **Hệ thống quản trị** | Quản lý người dùng · Quản lý khách hàng · Quản lý cửa hàng · Báo cáo & thống kê · Phân quyền |

Khối **Hệ thống cửa hàng** vận hành cho **nhiều cửa hàng ở các địa chỉ khác nhau** (`DEC-11`), có điều phối booking và phụ tùng qua lại giữa các cửa hàng — xem mục 6.B.7.

---

## 3. Phạm vi hệ thống

### 3.1 Trong phạm vi

| # | Hạng mục |
| --- | --- |
| 1 | Website giới thiệu dịch vụ (bảo dưỡng, sửa chữa) cho Guest |
| 2 | Đăng ký / đăng nhập tài khoản khách hàng |
| 3 | Đặt lịch, hủy, đổi lịch, đặt lịch lặp lại |
| 4 | Sinh và quét QR code khi khách đến cửa hàng |
| 5 | Thông báo và nhắc lịch qua email / SMS |
| 6 | Chatbox AI hỗ trợ mô tả tình trạng xe (text / hình ảnh / voice) |
| 7 | Trang quản trị: quản lý dịch vụ, booking, phụ tùng, khách hàng |
| 8 | AI hỗ trợ nhập liệu thông tin phụ tùng từ hình ảnh |
| 9 | Xuất hóa đơn PDF và bản in |
| 10 | Báo cáo, thống kê và export Excel / PDF |
| 11 | Đa ngôn ngữ: Tiếng Anh, Tiếng Việt, Tiếng Nhật |
| 12 | **Vận hành chuỗi nhiều cửa hàng** ở các địa chỉ khác nhau (`DEC-11`) |
| 13 | **Chuyển booking sang cửa hàng khác** khi cửa hàng gốc quá tải (`DEC-12`) |
| 14 | **Quản lý tồn kho phụ tùng theo từng cửa hàng và điều phối phụ tùng giữa các cửa hàng** (`DEC-13`) |
| 15 | **Hai site tách biệt**: site khách hàng và site quản trị (CMS) — xem mục 5 (`DEC-26`) |

### 3.2 Ngoài phạm vi

| # | Hạng mục | Ghi chú |
| --- | --- | --- |
| 1 | Ứng dụng di động native (iOS/Android) | Chỉ làm Web. Site khách hàng thiết kế **mobile-first**, chạy trên trình duyệt điện thoại, không cài đặt (`RQ §1`, `DEC-27`) |
| 2 | Thanh toán trực tuyến (cổng thanh toán, ví điện tử) | Giai đoạn đầu chỉ thanh toán tại cửa hàng `RQ §6.2` |
| 3 | Quản lý bán xe | Đã có hệ thống bên thứ ba `RQ §1` |
| 4 | ~~Quản lý kho phụ tùng~~ | ⚠ **Đã chuyển vào trong phạm vi tại v1.8** (`DEC-13`) — tồn kho theo cửa hàng và điều phối giữa các cửa hàng nay là yêu cầu bắt buộc. Riêng phần **đặt hàng nhà cung cấp** vẫn ngoài phạm vi, xem `OQ-34` |
| 5 | Kế toán, quản lý nhân sự, chấm công | (suy diễn) |

---

## 4. Người dùng và phân quyền

### 4.1 Danh sách actor

Hệ thống chỉ có **3 role**. `RQ §3.1`

| Role | Mô tả |
| --- | --- |
| **Admin** | Quản trị **toàn chuỗi** — xem và thao tác được trên **mọi cửa hàng**, quản lý cấu hình, bảng giá, người dùng và báo cáo tổng hợp (`DEC-24`) |
| **Staff** (Nhân viên cửa hàng) | Nghiệp vụ hằng ngày, **chỉ trong phạm vi cửa hàng mình** (`DEC-20`, `DEC-24`) |
| **User** (Khách hàng) | Đăng ký, đăng nhập, booking dịch vụ |
| **Guest** | Xem website và **đặt lịch không cần đăng nhập**, chỉ cần nhập **Tên và Số điện thoại** (`DEC-01`) |

> **Lưu ý 1:** Theo `DEC-01`, Guest đặt lịch được mà không cần tài khoản. Đăng ký tài khoản là **tùy chọn**, mang lại giá trị tăng thêm: quản lý nhiều xe, xem lịch sử bảo dưỡng, đặt lịch lặp lại.
>
> **Quy ước đọc:** trong các mục sau, cụm **"Admin/Staff"** nghĩa là *cả hai vai trò đều làm được việc này*, trong đó **Staff bị giới hạn trong phạm vi cửa hàng mình** (`BR-47`). Khi một yêu cầu chỉ dành riêng cho một vai trò, tài liệu ghi rõ **"Admin"** hoặc **"Staff"**.
>
> **Lưu ý 2:** Tài liệu nguồn gộp chung *"Admin/Staff: Full quyền"* (`RQ §3.1`). Từ v1.13, hai vai trò này **được tách ra theo phạm vi cửa hàng** (`DEC-24`): Admin nhìn toàn chuỗi, Staff chỉ nhìn cửa hàng mình. Vì vậy hệ thống thực chất có **4 vai trò** — Guest, User, Staff, Admin — thay vì 3 như `RQ §3.1` nêu. Cần nêu rõ thay đổi này khi trao đổi lại với khách hàng.

### 4.2 Ma trận phân quyền

Theo `DEC-24`, **Admin và Staff là hai vai trò khác nhau về phạm vi dữ liệu**: Staff chỉ thao tác trong cửa hàng của mình, Admin nhìn được tất cả các cửa hàng.

| Chức năng | Guest | User | Staff | Admin |
| --- | :---: | :---: | :---: | :---: |
| Xem website, danh sách dịch vụ | ✔ | ✔ | ✔ | ✔ |
| Đăng ký / đăng nhập | ✔ | — | — | — |
| Tạo booking | ✔ | ✔ | ✔ | ✔ |
| Xem booking của mình | ✱ | ✔ | — | — |
| Hủy / đổi lịch booking của mình (chỉ ở trạng thái *Chờ xác nhận* / *Xác nhận*) | ✱ | ✔ | — | — |
| Chọn cửa hàng khi đặt lịch | ✔ | ✔ | ✔ | ✔ |
| Đặt lịch lặp lại (bảo dưỡng) | — | ✔ | — | — |
| Xem lịch sử bảo dưỡng xe của mình | — | ✔ | — | — |
| Theo dõi tiến độ sửa chữa | — | ✔ | — | — |
| Sử dụng chatbox AI | ✔ | ✔ | — | — |
| **Nghiệp vụ cửa hàng** | | | | |
| Xem / quản lý booking | — | — | ⬤ | ✔ |
| Booking thay cho khách hàng | — | — | ⬤ | ✔ |
| Hủy booking ở **bất kỳ trạng thái nào** | — | — | ⬤ | ✔ |
| Cập nhật trạng thái booking | — | — | ⬤ | ✔ |
| Nhận thông báo trong CMS | — | — | ⬤ | ✔ |
| **Đánh giá cửa hàng quá tải** (`DEC-23`) | — | — | ⬤ | ✔ |
| Chuyển booking sang cửa hàng khác | — | — | ⬤ | ✔ |
| Cập nhật trạng thái thanh toán | — | — | ⬤ | ✔ |
| Xuất hóa đơn | — | — | ⬤ | ✔ |
| **Kho phụ tùng** | | | | |
| Tra cứu **số lượng tồn kho** ở các cửa hàng khác | — | — | ✔ | ✔ |
| Xem **tình trạng còn chỗ** của cửa hàng khác | — | — | ✔ | ✔ |
| Tạo yêu cầu điều phối phụ tùng | — | — | ⬤ | ✔ |
| Duyệt / từ chối yêu cầu điều phối gửi đến | — | — | ⬤ | ✔ |
| **Cấp chuỗi** | | | | |
| Xem dữ liệu **của mọi cửa hàng** | — | — | — | ✔ |
| Quản lý danh sách cửa hàng | — | — | — | ✔ |
| Cấu hình giờ làm việc, ngày nghỉ, năng lực cửa hàng | — | — | — | ✔ |
| Quản lý dịch vụ và **bảng giá toàn chuỗi** | — | — | — | ✔ |
| Quản lý người dùng và phân quyền | — | — | — | ✔ |
| Xem báo cáo & export **toàn chuỗi** | — | — | — | ✔ |
| Xem báo cáo **cửa hàng mình** | — | — | **—** | ✔ |

**Chú thích:**

- ✔ — có quyền đầy đủ
- ⬤ — **có quyền, nhưng chỉ trong phạm vi cửa hàng mình** (`DEC-20`, `DEC-24`)
- ✱ — Guest truy cập booking của mình qua **link tra cứu kèm token** gửi trong SMS, không qua màn hình đăng nhập (`DEC-02`, `FR-BKG-13`)

**Lưu ý về quyền hủy / đổi lịch:** cả Guest và User chỉ tự thao tác được khi booking đang ở trạng thái **Chờ xác nhận** hoặc **Xác nhận**. Từ **Đang tiến hành** trở đi, chỉ Admin/Staff mới thay đổi được (`BR-14`, mục 7.1).

**Lưu ý về bảng giá:** vì giá dùng chung toàn chuỗi (`DEC-14`), việc sửa giá thuộc quyền Admin — Staff sửa giá sẽ ảnh hưởng tới mọi cửa hàng.

**Lưu ý về báo cáo và thanh toán** (`DEC-28`): hai quyền này **không đi cùng nhau**.

- **Báo cáo, thống kê thuộc quyền Admin duy nhất** — Staff không truy cập được màn hình báo cáo, kể cả báo cáo của chính cửa hàng mình (`FR-RPT-01`, `BR-08`).
- **Cập nhật trạng thái thanh toán thì cả Admin và Staff đều làm được**, vì đây là thao tác hằng ngày tại quầy khi khách trả tiền (`FR-PAY-02`, `BR-07`). Staff chỉ thao tác được trên booking của cửa hàng mình.

Xem `OQ-05` cho quyền **xóa** dữ liệu — điểm duy nhất còn lại cần phân định.

---

## 5. Kiến trúc hai site

### 5.1 Tổng quan

Hệ thống gồm **hai site tách biệt**, dùng chung một cơ sở dữ liệu và một tầng nghiệp vụ:

| | **Site khách hàng** | **Site quản trị (CMS)** |
| --- | --- | --- |
| **Đối tượng sử dụng** | Guest, User (khách hàng) | Staff, Admin (nhân viên và quản trị cửa hàng) |
| **Mục đích** | Tìm hiểu dịch vụ, đặt lịch, theo dõi tiến độ và lịch sử bảo dưỡng | Vận hành nghiệp vụ hằng ngày, quản lý kho, cấu hình và báo cáo |
| **Truy cập** | Công khai — xem được không cần đăng nhập (`FR-AUT-03`) | Bắt buộc đăng nhập, phân quyền theo vai trò và cửa hàng |
| **Ngôn ngữ** | Đầy đủ 3 ngôn ngữ: Anh, Việt, Nhật (`NFR-I18N-01`) | Đầy đủ 3 ngôn ngữ (xem `OQ-47`) |
| **Thiết bị** | PC và smartphone, **SP là thiết bị chính** — thiết kế mobile-first, ưu tiên người lớn tuổi (`NFR-UX-01`, `DEC-27`) | Chủ yếu PC tại quầy; màn hình quét QR cần dùng được trên thiết bị di động |
| **Phạm vi dữ liệu** | Chỉ dữ liệu của chính khách hàng đó | Staff: chỉ cửa hàng mình · Admin: toàn chuỗi (`DEC-20`, `DEC-24`) |

> **Site khách hàng thiết kế theo hướng mobile-first** (`DEC-27`). Khách dùng được trên cả PC và điện thoại, nhưng **phần lớn lượt truy cập là từ điện thoại**, nên bố cục dựng cho màn hình nhỏ trước rồi mở rộng lên PC. Giao diện giữ ở mức đơn giản nhất có thể: mỗi màn hình gánh một việc, thao tác được bằng một tay, hạn chế nhập liệu bằng bàn phím.

### 5.2 Ranh giới trách nhiệm

| Nhóm chức năng | Site khách hàng | Site quản trị |
| --- | :---: | :---: |
| Đăng ký, đăng nhập, hồ sơ cá nhân | ✔ | — |
| Quản lý xe của khách | ✔ | — |
| Xem dịch vụ, bảng giá, danh sách cửa hàng | ✔ | — |
| Tạo booking, hủy, đổi lịch, đặt lịch lặp lại | ✔ | — |
| Tra cứu booking bằng link token | ✔ | — |
| Chatbox AI mô tả tình trạng xe | ✔ | — |
| Hiển thị mã QR cho khách | ✔ | — |
| Xác nhận và cập nhật trạng thái booking | — | ✔ |
| Quét QR, tiếp nhận xe | — | ✔ |
| Lập báo giá, quản lý sửa chữa | — | ✔ |
| Quản lý dịch vụ, bảng giá, phụ tùng | — | ✔ |
| Tồn kho và điều phối phụ tùng giữa cửa hàng | — | ✔ |
| Thông báo nội bộ trong CMS | — | ✔ |
| Thanh toán, hóa đơn | — | ✔ |
| Báo cáo, thống kê, cấu hình chuỗi | — | ✔ |

### 5.3 Các điểm giao nhau giữa hai site

Hai site tách biệt về giao diện nhưng liên thông về nghiệp vụ. Những điểm sau đòi hỏi hai bên phải khớp nhau chặt chẽ:

| # | Điểm giao | Diễn biến |
| --- | --- | --- |
| 1 | **Tạo booking** | Khách đặt trên site khách hàng → sinh thông báo trong CMS (`FR-NTF-08`) → nhân viên xác nhận trên CMS (`FR-BKG-16`) |
| 2 | **Mã QR** | Nhân viên xác nhận trên CMS → hệ thống sinh QR (`FR-QRC-01`) → khách xem QR trên site khách hàng (`FR-QRC-02`) |
| 3 | **Tiếp nhận xe** | Nhân viên quét QR trên CMS → trạng thái chuyển sang *Đang tiến hành* (`FR-QRC-05`) → khách thấy trạng thái mới trên site khách hàng (`FR-BKG-18`) |
| 4 | **Hủy và đổi lịch** | Khách thao tác trên site khách hàng → thông báo vào CMS (`FR-NTF-09`, `FR-NTF-10`); hoặc nhân viên thao tác trên CMS → gửi thông báo cho khách (`FR-NTF-07`) |
| 5 | **Chuyển cửa hàng** | Nhân viên chuyển trên CMS (`FR-SHP-06`) → khách nhận thông báo kèm địa chỉ mới (`FR-SHP-08`) |
| 6 | **Chờ phụ tùng** | Nhân viên đánh cờ trên CMS (`FR-BKG-27`) → chốt ngày hẹn mới với khách → khách thấy ngày mới trên site khách hàng (`BR-39`) |

> **Kênh thông báo email/SMS không thuộc site nào.** Đây là kênh gửi ra ngoài, được kích hoạt bởi sự kiện nghiệp vụ ở cả hai site — xem mục 6.C.2.

---

## 6. Yêu cầu chức năng

Các yêu cầu được phân theo hai site. **Mã yêu cầu giữ nguyên** so với các phiên bản trước để không phá vỡ tham chiếu chéo từ quy tắc nghiệp vụ, quyết định và tiêu chí nghiệm thu.

| Nhóm | Số lượng |
| --- | --- |
| 6.A — Site khách hàng | 45 yêu cầu |
| 6.B — Site quản trị (CMS) | 111 yêu cầu |
| 6.C — Dùng chung cho cả hai site | 19 yêu cầu |
| **Tổng** | **175 yêu cầu** |

---

## 6.A SITE KHÁCH HÀNG

### 6.A.1 Xác thực & tài khoản (FR-AUT)

| ID | Yêu cầu | Ưu tiên | Nguồn |
| --- | --- | --- | --- |
| FR-AUT-01 | Người dùng đăng ký tài khoản bằng **số điện thoại hoặc email** | Must | `RQ §3.2` |
| FR-AUT-02 | Đăng nhập bằng **email hoặc số điện thoại** | Must | `RQ §3.2` |
| FR-AUT-03 | Guest xem được website và danh sách dịch vụ mà không cần đăng nhập | Must | `RQ §3.3` |
| FR-AUT-04 | Khi Guest bấm "Booking", hệ thống chỉ yêu cầu nhập **Tên** và **Số điện thoại**; **Email là trường tùy chọn** | Must | `DEC-01` |
| FR-AUT-05 | **Không bắt buộc đăng nhập** để hoàn tất booking | Must | `DEC-01` |
| FR-AUT-06 | Sau khi Guest đặt lịch thành công, hệ thống **gợi ý** tạo tài khoản từ chính thông tin vừa nhập (không bắt buộc) | Should | (suy diễn từ `DEC-01`) |
| FR-AUT-07 | Xác thực **OTP qua SMS** khi Guest đặt lịch, để bảo đảm số điện thoại là có thật | Should | (suy diễn — xem `OQ-14`) |
| FR-AUT-08 | Chức năng quên mật khẩu / đặt lại mật khẩu | Should | (suy diễn) |
| FR-AUT-09 | Người dùng cập nhật hồ sơ cá nhân (tên, email, SĐT, ngôn ngữ hiển thị) | Should | (suy diễn) |

### 6.A.2 Quản lý phương tiện (FR-VEH)

| ID | Yêu cầu | Ưu tiên | Nguồn |
| --- | --- | --- | --- |
| FR-VEH-01 | Khách hàng quản lý danh sách xe của mình (thêm/sửa/xóa) | Must | `PP s3` |
| FR-VEH-02 | Thông tin xe gồm: loại xe, hãng, model, biển số, loại nhiên liệu, năm sản xuất | Must | `PP s3` + (suy diễn) |
| FR-VEH-03 | Hệ thống hỗ trợ **mọi loại xe máy**, không giới hạn chủng loại | Must | `RQ §2.1, §2.2` |
| FR-VEH-04 | Mỗi booking được gắn với một xe cụ thể | Must | (suy diễn) |
| FR-VEH-05 | Guest **nhập trực tiếp thông tin xe trong form booking** (không cần tài khoản, không lưu vào danh sách xe) | Must | (suy diễn từ `DEC-01`) |
| FR-VEH-06 | Khi Guest đăng ký tài khoản sau đó bằng cùng số điện thoại, hệ thống liên kết các booking và xe cũ vào tài khoản mới | Should | (suy diễn — xem `OQ-16`) |

### 6.A.3 Xem dịch vụ & chọn cửa hàng

| ID | Yêu cầu | Ưu tiên | Nguồn |
| --- | --- | --- | --- |
| FR-SRV-05 | Hiển thị công khai thông tin và giá tham khảo của dịch vụ cho khách hàng | Must | `PP s2` (minh bạch thông tin) |
| FR-SHP-03 | Khách hàng **chọn cửa hàng** khi đặt lịch; hiển thị kèm địa chỉ để khách chọn nơi thuận tiện | Must | `DEC-11` |
| FR-SHP-05 | Danh sách cửa hàng hiển thị công khai trên website kèm địa chỉ và giờ mở cửa | Should | (suy diễn từ `DEC-11`) |
| FR-SHP-31 | Khi khách chọn cửa hàng, hệ thống **chỉ hiển thị các khung giờ còn chỗ** của đúng cửa hàng đó | Must | `DEC-19` |

### 6.A.4 Đặt lịch (FR-BKG)

| ID | Yêu cầu | Ưu tiên | Nguồn |
| --- | --- | --- | --- |
| FR-BKG-01 | Một lần đặt có thể chọn **bảo dưỡng**, **sửa chữa**, hoặc **cả hai** | Must | `RQ §4.1` |
| FR-BKG-02 | **Không giới hạn** thời gian đặt trước | Must | `RQ §4.1` |
| FR-BKG-04 | Sau khi đặt thành công, gửi **SMS xác nhận** tới số điện thoại đã nhập; nếu khách có cung cấp email thì gửi thêm **email xác nhận** | Must | `RQ §4.2` + `DEC-01` |
| FR-BKG-07 | Booking loại **Bảo dưỡng** có thêm chức năng **Đặt lại lịch** (recurring) | Must | `RQ §4.5` |
| FR-BKG-12 | Kiểm soát số lượng booking theo **khung giờ và năng lực của đúng cửa hàng khách chọn**, dựa trên cấu hình tại `FR-SHP-28`…`FR-SHP-30` | Must | `DEC-19` |
| FR-BKG-14 | Chức năng **đặt lịch lặp lại** (FR-BKG-07) chỉ dành cho User đã đăng nhập | Should | (suy diễn từ `DEC-01`) |
| FR-BKG-35 | Khách **không đặt được** vào khung giờ đã hết chỗ, ngoài giờ làm việc, hoặc vào ngày nghỉ của cửa hàng đó | Must | `DEC-19` |

### 6.A.5 Theo dõi và quản lý booking của khách

| ID | Yêu cầu | Ưu tiên | Nguồn |
| --- | --- | --- | --- |
| FR-BKG-05 | Hủy booking: **không giới hạn thời gian**, **không tính phí phạt**; chỉ cho phép khi booking đang ở trạng thái **Chờ xác nhận** hoặc **Xác nhận** | Must | `RQ §4.3` + `DEC-02` |
| FR-BKG-05a | Khi booking không còn hủy/đổi được, nút thao tác bị vô hiệu hóa kèm giải thích lý do và số điện thoại cửa hàng để liên hệ | Must | (suy diễn từ `DEC-02`) |
| FR-BKG-06 | Đổi lịch (reschedule): **không giới hạn thời gian**, **không tính phí phạt**; áp dụng cùng điều kiện trạng thái với FR-BKG-05 | Must | `RQ §4.4` + `DEC-02` |
| FR-BKG-08 | Khách hàng xem danh sách và chi tiết booking của mình | Must | `PP s3` |
| FR-BKG-09 | Khách hàng theo dõi **tiến độ sửa chữa** theo trạng thái | Must | `PP s3` |
| FR-BKG-10 | Khách hàng xem **lịch sử bảo dưỡng** của từng xe | Must | `PP s3` |
| FR-BKG-13 | Ngay sau khi Guest đặt lịch thành công, hệ thống gửi **SMS chứa link tra cứu kèm token**; qua link này Guest xem, hủy và đổi lịch được booking của mình | Must | `DEC-02` |
| FR-BKG-13a | Link tra cứu **không có thời hạn hiệu lực** — vẫn truy cập được sau khi booking hoàn tất, để khách tra lại lịch sử dịch vụ | Must | `DEC-02` |
| FR-BKG-18 | Trạng thái hiện tại của booking hiển thị rõ trên màn hình khách hàng và trên trang tra cứu bằng link | Must | `DEC-03` |

### 6.A.6 Mã QR và báo giá hiển thị cho khách

| ID | Yêu cầu | Ưu tiên | Nguồn |
| --- | --- | --- | --- |
| FR-QRC-01 | Hệ thống sinh **mã QR khi booking chuyển sang trạng thái *Xác nhận***, không sinh ngay lúc khách đặt lịch | Must | `DEC-21` |
| FR-QRC-02 | QR hiển thị trên web **và** đính kèm trong **thông báo xác nhận booking** (`FR-BKG-16`); với SMS thì gửi **link mở trang chứa mã QR** (SMS không đính kèm được ảnh) | Must | `RQ §7` + `DEC-21` |
| FR-QRC-10 | Booking ở trạng thái *Chờ xác nhận* **chưa có mã QR**; trang tra cứu của khách hiển thị thông báo *"mã QR sẽ có sau khi cửa hàng xác nhận lịch hẹn"* | Must | (suy diễn từ `DEC-21`) |
| FR-QRC-12 | Nếu booking bị hủy, **mã QR mất hiệu lực**; quét vào chỉ hiển thị trạng thái đã hủy | Must | (suy diễn từ `DEC-21`) |
| FR-RPR-02 | Khách hàng xem được báo giá | Should | `PP s2` (minh bạch) |

### 6.A.7 Chatbox AI (FR-AI)

| ID | Yêu cầu | Ưu tiên | Nguồn |
| --- | --- | --- | --- |
| FR-AI-01 | Chatbox đưa ra **tùy chọn**: Bảo dưỡng / Sửa chữa | Must | `RQ §2.3` |
| FR-AI-02 | Khách hàng mô tả lỗi bằng **văn bản** | Must | `RQ §2.3` |
| FR-AI-03 | Khách hàng **upload hình ảnh** xe để mô tả lỗi | Must | `RQ §2.3` |
| FR-AI-04 | Khách hàng dùng **voice** để mô tả lỗi | Must | `RQ §2.3` |
| FR-AI-05 | AI phân loại yêu cầu và **gợi ý dịch vụ phù hợp** trước khi gửi đến cửa hàng | Must | `PP s4` |

---

## 6.B SITE QUẢN TRỊ (CMS)

### 6.B.1 Quản lý booking

| ID | Yêu cầu | Ưu tiên | Nguồn |
| --- | --- | --- | --- |
| FR-BKG-03 | Admin có thể tạo booking thay cho khách hàng | Must | `RQ §4.1` |
| FR-BKG-11 | Admin quản lý lịch hẹn: xem toàn bộ, tạo thay, hủy, đổi lịch | Must | `RQ §10`, `PP s3` |
| FR-BKG-16 | Admin/Staff **xác nhận booking**, chuyển trạng thái từ *Chờ xác nhận* sang *Xác nhận*; hệ thống gửi thông báo cho khách | Must | `DEC-03`, `DEC-04` |
| FR-BKG-17 | Admin/Staff cập nhật trạng thái booking **thủ công** theo vòng đời tại mục 7.1; hệ thống **không tự động chuyển** bất kỳ trạng thái nào sau khi khởi tạo | Must | `DEC-04` |
| FR-BKG-19 | Admin/Staff **hủy booking ở bất kỳ trạng thái nào**, kể cả *Đang tiến hành* và *Hoàn thành* | Must | `DEC-05` |
| FR-BKG-20 | Khi hủy, hệ thống ghi nhận **người hủy** (khách / Admin / Staff), **thời điểm hủy** và **lý do hủy** vào lịch sử trạng thái | Must | (suy diễn từ `DEC-05`, `DEC-08`) |
| FR-BKG-21 | Màn hình quản lý booking cho phép Admin **lọc theo trạng thái**, ưu tiên hiển thị nhóm *Chờ xác nhận* để xử lý trước | Should | (suy diễn từ `DEC-04`) |
| FR-BKG-22 | Nhắc nhở nội bộ cho Admin/Staff khi có booking ở trạng thái *Chờ xác nhận* quá lâu chưa được xử lý | Should | (suy diễn từ `DEC-04` — xem `OQ-20`) |
| FR-BKG-23 | Khi Admin/Staff hủy booking, hệ thống yêu cầu **chọn lý do hủy** từ danh mục, trong đó có mục **"Khách không đến"** | Must | `DEC-08` |
| FR-BKG-24 | Màn hình quản lý booking có bộ lọc **"Quá hạn — khách không đến"**, liệt kê booking đã qua ngày hẹn mà chưa được xử lý | Must | `DEC-08` |
| FR-BKG-25 | Nhân viên **ghi nhận kết quả liên hệ khách** vào booking (đã gọi / chưa liên lạc được / khách xác nhận không đến) | Should | (suy diễn từ `DEC-08`) |
| FR-BKG-26 | Booking có trường **ghi chú nội bộ** để Admin/Staff ghi thông tin bổ sung. Ghi chú **chỉ hiển thị trong CMS**, khách hàng không nhìn thấy. **Không dùng ghi chú để đánh dấu tình trạng chờ phụ tùng** — việc đó dùng cờ tại `FR-BKG-27` | Should | `DEC-16`, `DEC-22` |
| FR-BKG-27 | Booking có **cờ "Chờ phụ tùng"** dạng bật/tắt. Đây là **cách duy nhất** để đánh dấu tình trạng chờ phụ tùng, không dùng văn bản tự do | Must | `DEC-22` |
| FR-BKG-28 | Booking đang mang cờ **Chờ phụ tùng** được **loại khỏi tiến trình rà soát 16:00** (`FR-NTF-18`), không sinh thông báo quá hạn và không gửi SMS nhắc | Must | (suy diễn từ `DEC-16`) |
| FR-BKG-29 | Màn hình quản lý booking có bộ lọc **"Chờ phụ tùng"** để nhân viên theo dõi riêng nhóm này | Should | (suy diễn từ `DEC-16`) |
| FR-BKG-30 | Khi phụ tùng về tới nơi (yêu cầu điều phối đạt *Đã nhận*), hệ thống **gợi ý bỏ cờ Chờ phụ tùng** và nhắc nhân viên liên hệ khách hẹn lịch | Should | (suy diễn từ `DEC-16`) |
| FR-BKG-31 | Booking chờ phụ tùng **phải được chuyển sang ngày hẹn mới**, không giữ lại ngày hẹn cũ đã trôi qua. Admin/Staff liên hệ khách chốt ngày rồi cập nhật vào booking | Must | `DEC-18` |
| FR-BKG-32 | Hệ thống hiển thị cảnh báo trên các booking **có ngày hẹn đã qua mà vẫn ở *Chờ xác nhận*** — nhắc nhân viên chốt ngày hẹn mới | Must | (suy diễn từ `DEC-18`) |
| FR-BKG-33 | Sau khi đặt ngày hẹn mới, hệ thống **gửi thông báo cho khách** kèm ngày giờ và cửa hàng đã cập nhật | Must | (suy diễn từ `DEC-18`) |
| FR-BKG-34 | Mỗi lần đổi ngày hẹn đều được ghi vào lịch sử booking: **ngày cũ, ngày mới, người thực hiện, thời điểm** | Must | (suy diễn từ `BR-19`) |
| FR-ADM-02 | Quản lý booking: tạo thay, hủy, xem toàn bộ | Must | `RQ §10` |

### 6.B.2 Tiếp nhận xe & quét QR (FR-QRC)

| ID | Yêu cầu | Ưu tiên | Nguồn |
| --- | --- | --- | --- |
| FR-QRC-03 | Lễ tân quét QR để tra cứu ngay thông tin xe và nội dung yêu cầu | Must | `RQ §7` |
| FR-QRC-04 | Sau khi quét, màn hình tiếp nhận hiển thị: thông tin khách, xe, dịch vụ đặt, mô tả lỗi, lịch sử bảo dưỡng | Must | `RQ §7` + `PP s3` |
| FR-QRC-05 | Khi quét QR, hệ thống **tự động tra cứu booking và chuyển trạng thái từ *Xác nhận* sang *Đang tiến hành***, không cần thao tác thủ công thêm | Must | `PP s3` + `DEC-07` |
| FR-QRC-06 | Sau khi chuyển, màn hình hiển thị **xác nhận trạng thái mới** để lễ tân biết thao tác đã có hiệu lực | Must | (suy diễn từ `DEC-07`) |
| FR-QRC-07 | Nếu booking đang ở trạng thái **không phải *Xác nhận***, hệ thống **vẫn hiển thị thông tin tra cứu** nhưng **không đổi trạng thái**, kèm cảnh báo phù hợp: <br>• *Đang tiến hành* → báo "xe đã được tiếp nhận trước đó" <br>• *Hoàn thành* / *Đã hủy* → báo trạng thái hiện tại, không cho chuyển <br>*(Trường hợp *Chờ xác nhận* không còn xảy ra: theo `DEC-21`, booking chưa xác nhận thì chưa có mã QR để quét.)* | Must | (suy diễn từ `DEC-07`, `DEC-21`) |
| FR-QRC-08 | Quét lại cùng một mã QR nhiều lần **không** tạo thêm lần chuyển trạng thái nào (thao tác idempotent) | Must | (suy diễn từ `DEC-07`) |
| FR-QRC-09 | Lần chuyển trạng thái do quét QR được ghi vào lịch sử với người thực hiện là **tài khoản nhân viên đang đăng nhập trên máy quét** | Must | (suy diễn từ `BR-19`) |
| FR-QRC-11 | Khi khách đến cửa hàng **mà chưa có mã QR**, nhân viên **tra cứu booking thủ công theo số điện thoại hoặc tên khách**, xác nhận booking rồi tiếp tục quy trình | Must | (suy diễn từ `DEC-21`) |

### 6.B.3 Báo giá & quản lý sửa chữa

| ID | Yêu cầu | Ưu tiên | Nguồn |
| --- | --- | --- | --- |
| FR-RPR-01 | Nhân viên lập **báo giá** cho booking gồm hạng mục kiểm tra, phụ tùng thay thế và chi phí | Must | `PP s3, s4` |
| FR-RPR-03 | Cập nhật trạng thái tiến trình sửa chữa để khách theo dõi | Must | `PP s3` |
| FR-RPR-04 | Ghi nhận kết quả dịch vụ vào lịch sử bảo dưỡng của xe | Must | `PP s3` |
| FR-AI-06 | AI **đề xuất hạng mục kiểm tra, phụ tùng cần thay và chi phí tham khảo** dựa trên thông tin xe và triệu chứng | Should | `PP s4` |
| FR-AI-07 | AI hỗ trợ kỹ thuật viên **tra cứu quy trình sửa chữa, mã lỗi, thông số kỹ thuật, tài liệu bảo dưỡng** bằng ngôn ngữ tự nhiên | Should | `PP s4` |

### 6.B.4 Quản lý dịch vụ và phụ tùng

| ID | Yêu cầu | Ưu tiên | Nguồn |
| --- | --- | --- | --- |
| FR-SRV-04 | Admin quản lý danh mục dịch vụ: thêm / sửa / xóa | Must | `RQ §10` |
| FR-PRT-01 | Admin thêm / sửa / xóa các loại phụ tùng | Must | `RQ §10` |
| FR-PRT-02 | Phụ tùng có thông tin giá, dùng làm cơ sở tính chi phí dịch vụ | Must | `RQ §6.1` |
| FR-PRT-03 | **AI hỗ trợ nhập liệu:** upload ảnh phụ tùng hoặc hộp/vỏ phụ tùng → AI tự sinh thông tin phụ tùng | Must | `RQ §10`, `PP s4` |
| FR-PRT-04 | Admin xem lại, chỉnh sửa và xác nhận thông tin do AI sinh ra trước khi lưu | Must | (suy diễn) |
| FR-AI-08 | AI hỗ trợ **nhập liệu phụ tùng** từ hình ảnh (xem FR-PRT-03) | Must | `RQ §10`, `PP s4` |
| FR-ADM-01 | Quản lý dịch vụ: thêm / sửa / xóa | Must | `RQ §10` |
| FR-ADM-03 | Quản lý phụ tùng | Must | `RQ §10` |

### 6.B.5 Thanh toán & hóa đơn (FR-PAY)

| ID | Yêu cầu | Ưu tiên | Nguồn |
| --- | --- | --- | --- |
| FR-PAY-01 | Giai đoạn đầu **chỉ thanh toán tại cửa hàng**: chuyển khoản hoặc tiền mặt | Must | `RQ §6.2` |
| FR-PAY-02 | Trạng thái "đã thanh toán" do **Admin hoặc Staff cập nhật thủ công** cho từng booking; Staff chỉ cập nhật được booking của cửa hàng mình | Must | `RQ §6.2` + `DEC-28` |
| FR-PAY-03 | Xuất hóa đơn **theo ngày**, định dạng **PDF và bản in** | Must | `RQ §8` |
| FR-PAY-04 | Hóa đơn có đầy đủ **thông tin công ty** | Must | `RQ §8` |

### 6.B.6 Thông báo trong CMS (FR-NTF)

| ID | Yêu cầu | Ưu tiên | Nguồn |
| --- | --- | --- | --- |
| FR-NTF-08 | Khi khách **tạo booking mới**, hệ thống đẩy **thông báo vào CMS** cho Admin/Staff | Must | `DEC-06` |
| FR-NTF-09 | Khi khách **tự hủy booking**, hệ thống đẩy **thông báo vào CMS** cho Admin/Staff | Must | `DEC-06` |
| FR-NTF-10 | Khi khách **đổi lịch** booking, hệ thống đẩy thông báo vào CMS *(bổ sung để đồng bộ — xem `OQ-24`)* | Should | (suy diễn từ `DEC-06`) |
| FR-NTF-11 | Hiển thị **badge số thông báo chưa đọc** trên thanh điều hướng CMS | Must | `DEC-06` |
| FR-NTF-12 | Có **màn hình danh sách thông báo**, sắp xếp mới nhất trước, phân biệt rõ đã đọc / chưa đọc | Must | `DEC-06` |
| FR-NTF-13 | Bấm vào thông báo mở thẳng **màn hình chi tiết booking** liên quan | Must | `DEC-06` |
| FR-NTF-14 | Nội dung thông báo tối thiểu gồm: **loại sự kiện** (tạo mới / hủy / đổi lịch), **tên khách**, **dịch vụ**, **thời gian hẹn**, **thời điểm phát sinh** | Must | (suy diễn từ `DEC-06`) |
| FR-NTF-15 | Đánh dấu **đã đọc** từng thông báo và **đọc tất cả** | Must | (suy diễn từ `DEC-06`) |
| FR-NTF-16 | Thông báo **hiển thị ngay không cần tải lại trang** | Should | (suy diễn từ `DEC-06` — xem `OQ-23`) |
| FR-NTF-17 | Lọc danh sách thông báo theo loại sự kiện và theo khoảng thời gian | Could | (suy diễn) |
| FR-NTF-18 | Hệ thống chạy tiến trình rà soát **hằng ngày lúc 16:00 (UTC+9)**, quét các booking **có ngày hẹn là chính ngày hôm đó** mà vẫn ở trạng thái *Chờ xác nhận* hoặc *Xác nhận* (khách chưa đến), và đẩy **thông báo vào CMS** để nhân viên nhắc hoặc gọi điện cho khách | Must | `DEC-08`, `DEC-09` |
| FR-NTF-19 | Thông báo booking quá hạn là **một loại sự kiện riêng**, phân biệt được với thông báo booking mới / hủy / đổi lịch | Must | `DEC-08` |
| FR-NTF-20 | Thông báo quá hạn hiển thị **số điện thoại khách** để nhân viên gọi ngay, không phải mở thêm màn hình | Should | (suy diễn từ `DEC-08`) |
| FR-NTF-21 | Mỗi booking quá hạn **chỉ sinh một thông báo duy nhất**, dù tiến trình rà soát chạy lại nhiều lần | Must | (suy diễn từ `DEC-09`) |
| FR-NTF-22 | Nếu một lần chạy bị lỗi hoặc bị bỏ sót, lần chạy kế tiếp phải **quét bù các booking quá hạn chưa được xử lý**, không chỉ giới hạn đúng ngày hôm trước | Must | (suy diễn từ `DEC-09`) |

### 6.B.7 Quản lý nhiều cửa hàng (FR-SHP)

Hệ thống vận hành cho **chuỗi nhiều cửa hàng ở các địa chỉ khác nhau** (`DEC-11`).

**Quản lý cửa hàng**

| ID | Yêu cầu | Ưu tiên | Nguồn |
| --- | --- | --- | --- |
| FR-SHP-01 | Admin quản lý danh sách cửa hàng: **tên, địa chỉ, số điện thoại, giờ làm việc** | Must | `DEC-11` |
| FR-SHP-02 | Mỗi tài khoản Staff được **gắn với một cửa hàng**; Admin xem được toàn bộ cửa hàng | Must | `DEC-11`, `DEC-24` |
| FR-SHP-04 | **Mỗi booking luôn gắn với đúng một cửa hàng** | Must | `DEC-11` |

**Cấu hình năng lực tiếp nhận theo cửa hàng** (`DEC-19`)

| ID | Yêu cầu | Ưu tiên | Nguồn |
| --- | --- | --- | --- |
| FR-SHP-28 | Admin cấu hình **giờ làm việc riêng cho từng cửa hàng**: giờ mở cửa, giờ đóng cửa, theo từng ngày trong tuần | Must | `DEC-19` |
| FR-SHP-29 | Admin cấu hình **số booking tối đa nhận được trong mỗi khung giờ**, riêng cho từng cửa hàng | Must | `DEC-19` |
| FR-SHP-30 | Admin cấu hình **ngày nghỉ** của từng cửa hàng (ngày nghỉ cố định trong tuần, ngày lễ, nghỉ đột xuất) | Must | (suy diễn từ `DEC-19`) |
| FR-SHP-32 | Hệ thống hiển thị **số liệu tải theo khung giờ** (số booking đã nhận / mức tối đa) làm **thông tin tham khảo**; việc kết luận cửa hàng có quá tải hay không **do nhân viên tự đánh giá** | Must | `DEC-23` |
| FR-SHP-33 | Admin **vẫn tạo được booking vượt mức tối đa** khi cần xử lý ngoại lệ, kèm cảnh báo | Should | (suy diễn từ `DEC-19`) |
| FR-SHP-41 | Nhân viên **chủ động gợi ý khách chuyển sang cửa hàng khác** dựa trên đánh giá của mình, không cần hệ thống phải tự phát hiện quá tải | Must | `DEC-23` |
| FR-SHP-42 | Nhân viên **đánh dấu thủ công một khung giờ là đã quá tải** để tạm dừng nhận thêm booking, kể cả khi chưa đạt mức tối đa cấu hình | Should | (suy diễn từ `DEC-23`) |

**Cô lập dữ liệu giữa các cửa hàng** (`DEC-20`)

| ID | Yêu cầu | Ưu tiên | Nguồn |
| --- | --- | --- | --- |
| FR-SHP-34 | **Staff chỉ xem được booking, khách hàng và lịch sử dịch vụ của cửa hàng mình**; không truy cập được dữ liệu cửa hàng khác. **Admin không bị giới hạn này** | Must | `DEC-20`, `DEC-24` |
| FR-SHP-35 | **Thông báo trong CMS chỉ đẩy tới cửa hàng liên quan**; Staff cửa hàng A không nhận thông báo của cửa hàng B | Must | `DEC-20` |
| FR-SHP-36 | Việc lọc dữ liệu theo cửa hàng được **kiểm tra ở phía máy chủ trên mọi API**, không chỉ ẩn trên giao diện | Must | (suy diễn từ `DEC-20`) |
| FR-SHP-37 | **Ngoại lệ 1 — tồn kho:** nhân viên tra cứu được **số lượng tồn kho phụ tùng của các cửa hàng khác** để phục vụ điều phối (`FR-SHP-13`). Chỉ thấy số lượng, không thấy booking hay khách hàng | Must | (suy diễn từ `DEC-20`) |
| FR-SHP-38 | **Ngoại lệ 2 — tình trạng tải:** nhân viên xem được **mức độ bận của cửa hàng khác** theo khung giờ (`FR-SHP-10`) để gợi ý khách chuyển cửa hàng. Chỉ thấy còn chỗ hay hết chỗ, không thấy chi tiết booking | Must | (suy diễn từ `DEC-20`) |
| FR-SHP-39 | **Ngoại lệ 3 — vai trò Admin:** Admin **xem được dữ liệu của mọi cửa hàng**, phục vụ báo cáo tổng hợp (`FR-RPT-07`) và điều hành chuỗi. Việc cô lập dữ liệu chỉ áp dụng với **Staff** | Must | `DEC-24` |
| FR-SHP-40 | Khi booking được chuyển sang cửa hàng khác (`FR-SHP-06`), **quyền xem chuyển theo**: cửa hàng cũ thôi thấy, cửa hàng mới bắt đầu thấy | Must | (suy diễn từ `DEC-20` — xem `OQ-44`) |

**Điều phối booking giữa các cửa hàng** (`DEC-12`)

| ID | Yêu cầu | Ưu tiên | Nguồn |
| --- | --- | --- | --- |
| FR-SHP-06 | Admin/Staff **chuyển booking sang cửa hàng khác** sau khi đã trao đổi và được khách đồng ý | Must | `DEC-12` |
| FR-SHP-07 | Khi chuyển, hệ thống **giữ nguyên lịch sử booking** và ghi lại **cửa hàng cũ, cửa hàng mới, người thực hiện, thời điểm** | Must | `DEC-12` |
| FR-SHP-08 | Sau khi chuyển, hệ thống **gửi thông báo cho khách** kèm **tên và địa chỉ cửa hàng mới** | Must | (suy diễn từ `DEC-12`) |
| FR-SHP-09 | Thông báo trong CMS được đẩy tới **cửa hàng tiếp nhận** để họ biết có booking chuyển sang | Must | (suy diễn từ `DEC-12`) |
| FR-SHP-10 | Khi xem một booking, nhân viên thấy được **tình trạng tải của các cửa hàng khác** trong cùng khung giờ để gợi ý cho khách | Should | `DEC-12`, `DEC-19` |
| FR-SHP-11 | Việc chuyển cửa hàng **không làm thay đổi trạng thái** booking | Must | (suy diễn từ `DEC-12`) |

**Tồn kho và điều phối phụ tùng** (`DEC-13`, `DEC-15`, `DEC-17`)

| ID | Yêu cầu | Ưu tiên | Nguồn |
| --- | --- | --- | --- |
| FR-SHP-12 | Hệ thống theo dõi **số lượng tồn kho phụ tùng theo từng cửa hàng** | Must | `DEC-13` |
| FR-SHP-13 | Nhân viên **tra cứu tồn kho một phụ tùng ở tất cả các cửa hàng** để biết nơi nào còn hàng | Must | `DEC-13` |
| FR-SHP-14 | Nhân viên tạo **yêu cầu điều phối phụ tùng** từ cửa hàng khác về cửa hàng mình | Must | `DEC-13` |
| FR-SHP-15 | Yêu cầu điều phối có vòng đời trạng thái riêng, xem mục 7.2 | Must | `DEC-15` |
| FR-SHP-16 | Cửa hàng nguồn **nhận thông báo trong CMS** khi có yêu cầu điều phối gửi đến | Must | (suy diễn từ `DEC-13`) |
| FR-SHP-17 | Khi điều phối hoàn tất, hệ thống **tự trừ tồn kho cửa hàng nguồn và cộng vào cửa hàng nhận** | Must | (suy diễn từ `DEC-13`) |
| FR-SHP-18 | Khi phụ tùng được dùng cho một booking, hệ thống **trừ tồn kho của cửa hàng thực hiện** | Must | (suy diễn từ `DEC-13`) |
| FR-SHP-19 | Cảnh báo khi tồn kho một phụ tùng **xuống dưới ngưỡng tối thiểu** của cửa hàng | Should | (suy diễn từ `DEC-13`) |
| FR-SHP-20 | Lịch sử biến động tồn kho theo phụ tùng và theo cửa hàng | Should | (suy diễn từ `DEC-13`) |
| FR-SHP-21 | **Cửa hàng nguồn có quyền từ chối** yêu cầu điều phối, kèm **lý do từ chối** | Must | `DEC-15` |
| FR-SHP-22 | Khi đồng ý, **cửa hàng nguồn ấn định ngày bàn giao** — hiểu là **ngày cửa hàng nguồn gửi phụ tùng đi**, không phải ngày cửa hàng nhận nhận được | Must | `DEC-15`, `DEC-17` |
| FR-SHP-23 | Cửa hàng gửi yêu cầu **nhận thông báo trong CMS** khi yêu cầu được đồng ý (kèm ngày bàn giao) hoặc bị từ chối (kèm lý do) | Must | (suy diễn từ `DEC-15`) |
| FR-SHP-24 | Khi bị từ chối, nhân viên **gửi lại yêu cầu tới cửa hàng khác** mà không phải nhập lại từ đầu | Should | (suy diễn từ `DEC-15`) |
| FR-SHP-25 | **Ngày gửi phụ tùng hiển thị trên booking liên quan**. Vì đây là ngày gửi đi chứ không phải ngày nhận được, nhân viên **tự cộng thêm thời gian vận chuyển** khi hẹn ngày trả xe cho khách | Must | `DEC-17` |
| FR-SHP-26 | Cảnh báo khi **đã quá ngày gửi cộng thêm một khoảng dự phòng** mà cửa hàng nhận vẫn chưa xác nhận nhận được phụ tùng | Should | (suy diễn từ `DEC-17` — ngưỡng dự phòng xem `OQ-41`) |
| FR-SHP-27 | Cửa hàng nhận **xác nhận ngày nhận thực tế**, để hệ thống tích lũy dữ liệu về thời gian vận chuyển giữa các cửa hàng | Should | (suy diễn từ `DEC-17`) |

### 6.B.8 Báo cáo & quản trị chuỗi

| ID | Yêu cầu | Ưu tiên | Nguồn |
| --- | --- | --- | --- |
| FR-RPT-01 | **Chỉ Admin** được xem báo cáo. Staff **không** truy cập được màn hình báo cáo, kể cả báo cáo của cửa hàng mình | Must | `RQ §9` + `DEC-28` |
| FR-RPT-02 | Thống kê **theo ngày / theo tháng** | Must | `RQ §9` |
| FR-RPT-03 | Thống kê **theo loại xe** | Must | `RQ §9` |
| FR-RPT-04 | Export báo cáo ra **Excel và PDF** | Must | `RQ §9` |
| FR-RPT-05 | Thống kê theo dịch vụ, doanh thu, tỷ lệ hủy | Could | (suy diễn) |
| FR-RPT-06 | Thống kê **tách riêng theo lý do hủy**, để phân biệt "khách chủ động hủy" với **"khách không đến"** | Should | `DEC-08` |
| FR-RPT-07 | Thống kê **theo từng cửa hàng** và **so sánh giữa các cửa hàng**; báo cáo tồn kho phụ tùng theo cửa hàng | Must | `DEC-11`, `DEC-13` |
| FR-ADM-04 | Xem báo cáo & export | Must | `RQ §10` |
| FR-ADM-05 | Quản lý người dùng và phân quyền | Must | `PP s3` |
| FR-ADM-06 | Quản lý khách hàng | Must | `PP s3` |
| FR-ADM-07 | Quản lý cửa hàng | Must | `PP s3, s5`, `DEC-11` |

---

## 6.C YÊU CẦU DÙNG CHUNG CHO CẢ HAI SITE

Những yêu cầu dưới đây không thuộc riêng giao diện nào — chúng là quy tắc dữ liệu hoặc kênh gửi ra ngoài, được kích hoạt bởi sự kiện phát sinh ở cả hai site.

### 6.C.1 Mô hình dịch vụ & bảng giá (FR-SRV)

| ID | Yêu cầu | Ưu tiên | Nguồn |
| --- | --- | --- | --- |
| FR-SRV-01 | Hệ thống cung cấp 2 nhóm dịch vụ chính: **Bảo dưỡng** và **Sửa chữa** | Must | `RQ §2` |
| FR-SRV-02 | Giá bảo dưỡng tính riêng theo **loại nhiên liệu** và **phụ tùng** sử dụng | Must | `RQ §6.1` |
| FR-SRV-03 | Giá sửa chữa tính riêng theo **loại phụ tùng** và **mức độ lỗi** (dễ / khó) | Must | `RQ §6.1` |
| FR-SRV-06 | **Bảng giá dịch vụ và phụ tùng dùng chung cho toàn chuỗi** — mọi cửa hàng áp dụng cùng một mức giá, không có giá riêng theo cửa hàng | Must | `DEC-14` |
| FR-SRV-07 | Sửa giá một lần là **áp dụng đồng thời cho tất cả cửa hàng** | Must | (suy diễn từ `DEC-14`) |

### 6.C.2 Thông báo gửi tới khách hàng qua email / SMS (FR-NTF)

| ID | Yêu cầu | Ưu tiên | Nguồn |
| --- | --- | --- | --- |
| FR-NTF-01 | Gửi **xác nhận** ngay sau khi đặt lịch thành công | Must | `RQ §4.2` |
| FR-NTF-02 | Gửi **nhắc lịch trước 12 tiếng** (nửa ngày) so với giờ hẹn | Must | `RQ §4.2` |
| FR-NTF-03 | Khi gần đến kỳ bảo dưỡng tiếp theo, gửi thông báo nhắc, **kèm URL đặt lịch** | Must | `RQ §2.3` |
| FR-NTF-04 | **SMS là kênh bắt buộc** cho mọi thông báo (vì số điện thoại là thông tin duy nhất chắc chắn có); email chỉ gửi khi khách đã cung cấp | Must | `DEC-01` |
| FR-NTF-05 | Nội dung thông báo theo ngôn ngữ mà khách hàng đã chọn | Should | (suy diễn từ `RQ §1`) |
| FR-NTF-06 | Ghi log lịch sử gửi thông báo (thành công / thất bại) | Should | (suy diễn) |
| FR-NTF-07 | Gửi thông báo cho khách khi booking được **xác nhận** và khi booking **bị hủy bởi Admin/Staff** | Must | (suy diễn từ `DEC-04`, `DEC-05`) |
| FR-NTF-23 | Khi phát hiện booking **quá hạn** (`FR-NTF-18`), hệ thống **tự gửi SMS cho khách** nhắc đặt lại lịch, **kèm URL đặt lịch** | Must | `DEC-10` |
| FR-NTF-24 | SMS nhắc đặt lại lịch **chỉ gửi một lần cho mỗi booking quá hạn**, không gửi lặp | Must | `DEC-10` |
| FR-NTF-25 | **Không gửi** SMS nhắc đặt lại lịch nếu booking đó đã được hủy trước thời điểm rà soát | Must | (suy diễn từ `DEC-10`) |
| FR-NTF-26 | Nội dung SMS nhắc đặt lại lịch dùng **ngôn ngữ khách đã chọn** khi đặt lịch | Should | (suy diễn từ `NFR-I18N-04`) |

### 6.C.3 Dữ liệu khách hàng & AI dùng chung

| ID | Yêu cầu | Ưu tiên | Nguồn |
| --- | --- | --- | --- |
| FR-BKG-15 | Hệ thống nhận diện khách quen theo **số điện thoại** để gom lịch sử bảo dưỡng kể cả khi khách chưa có tài khoản | Should | (suy diễn từ `DEC-01`) |
| FR-AI-09 | AI **phân tích lịch sử bảo dưỡng và chu kỳ sử dụng** để gợi ý thời điểm bảo dưỡng tiếp theo và gửi nhắc tự động | Should | `PP s4` |
| FR-AI-10 | Kết quả do AI đề xuất luôn ở dạng **gợi ý**, phải được người dùng/nhân viên xác nhận trước khi áp dụng | Must | (suy diễn) |

## 7. Quy tắc nghiệp vụ

### 7.1 Vòng đời trạng thái booking

Booking có **5 trạng thái** (`DEC-03`). Việc chuyển trạng thái mặc định do **Admin/Staff thao tác thủ công** (`DEC-04`), với hai ngoại lệ: bước **Xác nhận → Đang tiến hành** do hệ thống tự chuyển khi quét mã QR (`DEC-07`), và trạng thái *Đã hủy* mà khách hàng cũng tự đặt được trong giới hạn cho phép (`DEC-05`).

| # | Trạng thái | Thời điểm chuyển sang | Người chuyển | Khách tự hủy / đổi lịch |
| --- | --- | --- | --- | :---: |
| 1 | **Chờ xác nhận** | Ngay khi khách đặt lịch thành công | Hệ thống (tự động) | ✔ **Có** |
| 2 | **Xác nhận** | Cửa hàng xác nhận tiếp nhận lịch hẹn (`FR-BKG-16`) | Admin/Staff — thủ công | ✔ **Có** |
| 3 | **Đang tiến hành** | Lễ tân **quét mã QR** khi khách mang xe đến | **Hệ thống — tự động khi quét QR** (`DEC-07`) | ✘ **Không** |
| 4 | **Hoàn thành** | Dịch vụ xong, bàn giao xe cho khách | Admin/Staff — thủ công | ✘ **Không** |
| 5 | **Đã hủy** | Xem `DEC-05` bên dưới | **Khách hàng** (ở trạng thái 1–2) **hoặc Admin/Staff** (mọi trạng thái) | — |

**Quyền hủy booking** (`DEC-05`):

| Vai trò | Được hủy ở trạng thái |
| --- | --- |
| Khách hàng (Guest & User) | *Chờ xác nhận*, *Xác nhận* |
| Admin / Staff | **Mọi trạng thái, bất cứ lúc nào** |

**Ghi chú:**

- **Ranh giới chặn khách hủy nằm giữa trạng thái 2 và 3:** một khi cửa hàng đã bắt đầu xử lý xe, khách không còn tự hủy hay đổi lịch được (`DEC-02`, `DEC-05`).
- **Quét QR vừa tra cứu vừa chuyển trạng thái** (`DEC-07`): lễ tân quét một lần là hệ thống hiển thị thông tin tiếp nhận **và** tự chuyển booking từ *Xác nhận* sang *Đang tiến hành*, không cần thao tác thứ hai.
- Các bước còn lại (*Chờ xác nhận* → *Xác nhận*, *Đang tiến hành* → *Hoàn thành*) vẫn **thủ công** (`DEC-04`).
- **Trạng thái thanh toán là một trường riêng biệt**, không nằm trong vòng đời trên. Admin/Staff cập nhật thủ công (`FR-PAY-02`, `DEC-28`), thường ở trạng thái 3 hoặc 4.
- Báo giá (`FR-RPR-01`) diễn ra **trong** trạng thái *Đang tiến hành*, không phải một trạng thái riêng.

### 7.2 Vòng đời yêu cầu điều phối phụ tùng

Yêu cầu điều phối phụ tùng giữa hai cửa hàng có vòng đời riêng, tách biệt với vòng đời booking (`DEC-15`).

| # | Trạng thái | Chuyển sang khi | Người thực hiện |
| --- | --- | --- | --- |
| 1 | **Chờ phản hồi** | Cửa hàng cần phụ tùng tạo yêu cầu (`FR-SHP-14`) | Cửa hàng **nhận** |
| 2a | **Đã đồng ý** | Cửa hàng nguồn chấp thuận **và ấn định ngày bàn giao** (`FR-SHP-22`) | Cửa hàng **nguồn** |
| 2b | **Bị từ chối** | Cửa hàng nguồn từ chối **kèm lý do** (`FR-SHP-21`) | Cửa hàng **nguồn** |
| 3 | **Đang chuyển** | Phụ tùng được bàn giao đi | Cửa hàng **nguồn** |
| 4 | **Đã nhận** | Cửa hàng nhận xác nhận đã nhận được hàng | Cửa hàng **nhận** |

**Ghi chú:**

- **Tồn kho chỉ thay đổi ở trạng thái *Đã nhận*** (`BR-34`) — trừ kho cửa hàng nguồn, cộng vào kho cửa hàng nhận. Trước đó phụ tùng vẫn thuộc về cửa hàng nguồn.
- **Nhánh *Bị từ chối* là điểm kết thúc**; muốn lấy phụ tùng thì phải tạo yêu cầu mới tới cửa hàng khác (`FR-SHP-24`).
- **Ngày bàn giao do cửa hàng nguồn quyết định**, không phải cửa hàng nhận đề xuất. Đây là **ngày gửi hàng đi** (`DEC-17`), nên khi hẹn ngày trả xe cho khách, nhân viên phải cộng thêm thời gian vận chuyển (`FR-SHP-25`).
- Trong lúc chờ phụ tùng, **booking liên quan vẫn nằm ở trạng thái *Chờ xác nhận*** và được đánh dấu cờ **Chờ phụ tùng** (`DEC-16`) — vòng đời điều phối phụ tùng không làm thay đổi vòng đời booking.

### 7.3 Danh sách quy tắc

| ID | Quy tắc | Nguồn |
| --- | --- | --- |
| BR-01 | Một booking có thể chứa dịch vụ bảo dưỡng, sửa chữa, hoặc cả hai | `RQ §4.1` |
| BR-02 | Không áp dụng bất kỳ giới hạn **thời gian** nào cho việc đặt trước, hủy hoặc đổi lịch. Ràng buộc duy nhất là **trạng thái** booking (`BR-14`) | `RQ §4.1, §4.3, §4.4` + `DEC-02` |
| BR-03 | Không thu phí phạt khi khách hủy hoặc đổi lịch | `RQ §4.3, §4.4` |
| BR-04 | Chỉ booking loại **Bảo dưỡng** mới có chức năng đặt lịch lặp lại | `RQ §4.5` |
| BR-05 | Reminder gửi trước giờ hẹn đúng **12 tiếng** | `RQ §4.2` |
| BR-06 | Chi phí = phí dịch vụ (theo loại nhiên liệu / mức độ lỗi) + chi phí phụ tùng sử dụng | `RQ §6.1` |
| BR-07 | **Admin và Staff** đều chuyển được trạng thái booking sang "đã thanh toán"; Staff chỉ trong phạm vi cửa hàng mình | `RQ §6.2` + `DEC-28` |
| BR-08 | **Chỉ Admin** được truy cập màn hình báo cáo, thống kê — không có ngoại lệ theo cửa hàng | `RQ §9` + `DEC-28` |
| BR-09 | Mỗi booking thành công sinh đúng một mã QR duy nhất | `RQ §7` |
| BR-10 | Toàn bộ thời gian trong hệ thống dùng múi giờ **UTC+9** | `RQ §1` |
| BR-11 | **Không bắt buộc đăng nhập để đặt lịch.** Thông tin tối thiểu để tạo booking là **Tên + Số điện thoại**; email là tùy chọn | `DEC-01` |
| BR-12 | **Số điện thoại là khóa nhận diện khách hàng.** Các booking có cùng số điện thoại được gom về một hồ sơ khách hàng, kể cả khi khách chưa đăng ký tài khoản | (suy diễn từ `DEC-01`) |
| BR-13 | Booking do Guest tạo được truy cập qua **link kèm token**, không qua đăng nhập | `DEC-01`, `DEC-02` |
| BR-14 | Khách **chỉ tự hủy / đổi lịch được khi booking ở trạng thái *Chờ xác nhận* hoặc *Xác nhận***. Từ *Đang tiến hành* trở đi, mọi thay đổi phải do Admin/Staff thực hiện | `DEC-02`, `DEC-05` |
| BR-15 | **Link tra cứu booking không có thời hạn hiệu lực**, vẫn dùng được sau khi booking hoàn thành hoặc bị hủy | `DEC-02` |
| BR-16 | Booking mới tạo luôn bắt đầu ở trạng thái **Chờ xác nhận**; việc chuyển sang **Xác nhận** do Admin/Staff thực hiện | `DEC-03` |
| BR-17 | Các bước chuyển trạng thái **mặc định là thủ công**, do Admin/Staff thao tác. Hệ thống **không** tự chuyển trạng thái theo thời gian. Ngoại lệ duy nhất: **quét QR tự chuyển *Xác nhận* → *Đang tiến hành*** (`BR-22`) | `DEC-04`, `DEC-07` |
| BR-22 | **Quét mã QR tự động chuyển booking từ *Xác nhận* sang *Đang tiến hành*.** Chỉ áp dụng khi booking đang ở đúng trạng thái *Xác nhận*; ở trạng thái khác, quét QR chỉ tra cứu mà không đổi trạng thái | `DEC-07` |
| BR-23 | Booking đã qua ngày hẹn mà vẫn ở *Chờ xác nhận* hoặc *Xác nhận* được coi là **quá hạn**. Hệ thống **chỉ thông báo, tuyệt đối không tự hủy** — quyền hủy vẫn thuộc Admin/Staff sau khi liên hệ khách | `DEC-08` |
| BR-24 | Hủy do khách không đến phải được ghi **lý do "Khách không đến"**, để tách khỏi nhóm khách chủ động hủy khi thống kê | `DEC-08` |
| BR-25 | Tiến trình rà soát chạy **mỗi ngày một lần, lúc 16:00 giờ Nhật (UTC+9)**, xét các booking có **ngày hẹn là chính ngày hôm đó** mà khách chưa đến. Mục đích là **nhắc trong ngày**, không phải xử lý sau khi đã lỡ hẹn | `DEC-09` |
| BR-26 | Mỗi lần phát hiện booking quá hạn sinh **đồng thời hai việc**: thông báo trong CMS cho nhân viên (`FR-NTF-18`) và **SMS nhắc đặt lại lịch gửi cho khách** (`FR-NTF-23`). Cả hai chỉ phát sinh **một lần** cho mỗi booking | `DEC-08`, `DEC-10` |
| BR-27 | **Mỗi booking luôn thuộc về đúng một cửa hàng** tại mọi thời điểm | `DEC-11` |
| BR-28 | **Chỉ Admin/Staff mới chuyển được booking sang cửa hàng khác**, và chỉ sau khi khách đã đồng ý. Khách hàng không tự đổi cửa hàng | `DEC-12` |
| BR-29 | Chuyển cửa hàng **không đổi trạng thái booking** và **không tạo booking mới** — vẫn là cùng một booking, giữ nguyên lịch sử | `DEC-12` |
| BR-30 | **Tồn kho phụ tùng quản lý riêng theo từng cửa hàng**, không dùng chung kho toàn chuỗi | `DEC-13` |
| BR-31 | Phụ tùng chỉ được chuyển giữa các cửa hàng **thông qua yêu cầu điều phối có ghi nhận**, không tự ý trừ cộng tồn kho | `DEC-13` |
| BR-32 | **Giá dịch vụ và phụ tùng là giá chung toàn chuỗi.** Chi phí một booking không phụ thuộc vào cửa hàng thực hiện, nên **chuyển booking sang cửa hàng khác không làm thay đổi giá** | `DEC-14` |
| BR-33 | Điều phối phụ tùng **phải có sự đồng ý của cửa hàng nguồn**. Cửa hàng nguồn được quyền từ chối và phải nêu lý do | `DEC-15` |
| BR-34 | **Tồn kho hai cửa hàng chỉ thay đổi khi yêu cầu điều phối đạt trạng thái *Đã nhận*** — không trừ kho ngay lúc đồng ý | `DEC-15` |
| BR-35 | Khi **không cửa hàng nào còn phụ tùng hoặc tất cả đều từ chối**, booking **giữ nguyên trạng thái *Chờ xác nhận***. Không thêm trạng thái mới, không tự hủy. Tình huống được ghi bằng **ghi chú nội bộ và cờ *Chờ phụ tùng*** | `DEC-16` |
| BR-36 | Booking mang cờ **Chờ phụ tùng** **không bị coi là quá hạn** và **không sinh thông báo hay SMS nhắc** từ tiến trình 16:00 | `DEC-16` |
| BR-37 | **Ngày bàn giao là ngày cửa hàng nguồn gửi phụ tùng đi**, không phải ngày cửa hàng nhận nhận được | `DEC-17` |
| BR-38 | Booking chờ phụ tùng **không được giữ ngày hẹn đã trôi qua**. Khi đã xác định được thời điểm có phụ tùng, nhân viên liên hệ khách và **cập nhật sang ngày hẹn mới** | `DEC-18` |
| BR-39 | Ngày hẹn hiển thị cho khách phải luôn là **ngày hẹn còn hiệu lực**, không phải ngày đã qua | `DEC-18` |
| BR-40 | **Giờ làm việc, ngày nghỉ và số booking tối đa mỗi khung giờ được cấu hình riêng cho từng cửa hàng.** Không có cấu hình dùng chung toàn chuỗi | `DEC-19` |
| BR-41 | Khả năng nhận booking được tính **thuần theo số lượng booking trong khung giờ**. Dịch vụ **không có thuộc tính thời lượng**, và hệ thống không tính toán gì dựa trên thời lượng | `DEC-19`, `DEC-25` |
| BR-46 | Cần phân biệt hai khái niệm: **giới hạn nhận booking** là ràng buộc cứng do hệ thống áp dụng với khách (`BR-40`), còn **quá tải** là **đánh giá của nhân viên** để quyết định có gợi ý khách chuyển cửa hàng hay không (`DEC-23`) | `DEC-19`, `DEC-23` |
| BR-47 | **Admin xem và thao tác được trên mọi cửa hàng; Staff chỉ trong cửa hàng mình.** Ngoại lệ tại `BR-43` vẫn áp dụng cho Staff | `DEC-24` |
| BR-48 | **Bảng giá và cấu hình cửa hàng thuộc quyền Admin.** Staff không sửa được, vì các thiết lập này ảnh hưởng ngoài phạm vi cửa hàng họ | `DEC-14`, `DEC-24` |
| BR-42 | **Dữ liệu booking, khách hàng và thông báo bị cô lập theo cửa hàng.** Nhân viên chỉ thấy dữ liệu cửa hàng mình | `DEC-20` |
| BR-43 | Ba ngoại lệ có kiểm soát của `BR-42`: **tồn kho phụ tùng** (chỉ số lượng), **tình trạng còn chỗ** của cửa hàng khác (chỉ mức độ bận), và **Admin cấp chuỗi** xem được toàn bộ | `DEC-20` |
| BR-44 | **Mã QR chỉ được sinh khi booking đạt trạng thái *Xác nhận***. Booking ở *Chờ xác nhận* không có mã QR | `DEC-21` |
| BR-45 | Tình trạng **chờ phụ tùng được thể hiện bằng cờ có cấu trúc**, không bằng văn bản tự do. Mọi xử lý tự động của hệ thống căn cứ vào cờ này | `DEC-22` |
| BR-18 | **Admin/Staff hủy được booking ở mọi trạng thái**, không phụ thuộc trạng thái hiện tại | `DEC-05` |
| BR-19 | Mọi lần chuyển trạng thái đều ghi lại **ai thực hiện và lúc nào**, phục vụ truy vết và giải quyết khiếu nại | (suy diễn từ `DEC-04`, `DEC-05`) |
| BR-20 | Mọi thao tác booking **do khách hàng thực hiện** (tạo mới, hủy, đổi lịch) đều sinh **thông báo trong CMS** cho Admin/Staff. Thao tác do chính Admin/Staff thực hiện **không** sinh thông báo | `DEC-06` |
| BR-21 | Thông báo CMS **không thay thế** thông báo email/SMS gửi cho khách; hai luồng độc lập với nhau | `DEC-06` |

---

## 8. Yêu cầu phi chức năng

### 8.1 Nền tảng & giao diện

| ID | Yêu cầu | Nguồn |
| --- | --- | --- |
| NFR-PLT-01 | Hệ thống là **Web only** — không phát triển ứng dụng native | `RQ §1` |
| NFR-PLT-02 | Giao diện có mockup cho cả **PC và SP (smartphone)** — thiết kế responsive. Với site khách hàng, **bản SP là bản gốc**, bản PC dựng theo sau | `RQ §1`, `DEC-27` |
| NFR-PLT-03 | Hỗ trợ trình duyệt hiện đại: Chrome, Edge, Safari, Firefox (2 phiên bản gần nhất) | (suy diễn) |
| NFR-PLT-04 | Hệ thống gồm **hai site tách biệt** — site khách hàng và site quản trị — dùng chung cơ sở dữ liệu và tầng nghiệp vụ (xem mục 5) | `DEC-26` |
| NFR-PLT-05 | Site quản trị đặt ở **đường dẫn riêng biệt**, không lẫn với site khách hàng, và **không cho phép Guest truy cập** | (suy diễn từ `DEC-26`) |
| NFR-PLT-06 | Site khách hàng yêu cầu responsive đầy đủ PC + SP; site quản trị tối ưu cho **PC tại quầy**, riêng **màn hình quét QR phải dùng được trên thiết bị di động** | (suy diễn từ `DEC-26`) |
| NFR-PLT-07 | Site khách hàng thiết kế **mobile-first** — dựng bố cục cho SP trước, mở rộng lên PC sau | `DEC-27` |
| NFR-PLT-08 | **Mọi chức năng dành cho khách phải dùng được đầy đủ trên SP.** Không có chức năng nào chỉ chạy được ở bản PC | `DEC-27` |

### 8.2 Đa ngôn ngữ & quốc tế hóa

| ID | Yêu cầu | Nguồn |
| --- | --- | --- |
| NFR-I18N-01 | Giao diện hỗ trợ 3 ngôn ngữ: **Tiếng Anh, Tiếng Việt, Tiếng Nhật** | `RQ §1` |
| NFR-I18N-02 | Người dùng chuyển đổi ngôn ngữ trực tiếp trên giao diện | (suy diễn) |
| NFR-I18N-03 | Toàn hệ thống dùng múi giờ **UTC+9**; định dạng ngày giờ theo ngôn ngữ đang chọn | `RQ §1` |
| NFR-I18N-04 | Nội dung email / SMS cũng phải đa ngôn ngữ | (suy diễn) |

### 8.3 Trải nghiệm người dùng

| ID | Yêu cầu | Nguồn |
| --- | --- | --- |
| NFR-UX-01 | UI/UX **đơn giản, dễ thao tác**, đặc biệt dễ sử dụng cho **người lớn tuổi** | `RQ §11` |
| NFR-UX-02 | Cỡ chữ lớn, độ tương phản cao, vùng bấm rộng, hạn chế số bước thao tác | (suy diễn từ `RQ §11`) |
| NFR-UX-03 | Luồng đặt lịch hoàn tất trong tối đa 3–4 bước | (suy diễn) |
| NFR-UX-04 | Thông báo lỗi rõ ràng, bằng ngôn ngữ đời thường, không dùng thuật ngữ kỹ thuật | (suy diễn) |
| NFR-UX-05 | Trên SP, màn hình site khách hàng bố cục **một cột**, đọc được không cần phóng to, **không cuộn ngang** | (suy diễn từ `DEC-27`) |
| NFR-UX-06 | Vùng bấm tối thiểu **44 × 44 px**, khoảng cách giữa hai nút đủ rộng để không bấm nhầm; nút thao tác chính đặt trong tầm ngón cái | (suy diễn từ `DEC-27`) |
| NFR-UX-07 | **Hạn chế gõ bàn phím trên SP** — ưu tiên chọn từ danh sách, nút bấm có sẵn, bộ chọn ngày giờ; trường số điện thoại mở đúng bàn phím số | (suy diễn từ `DEC-27`) |
| NFR-UX-08 | Màn hình nhiều dữ liệu của khách (lịch sử bảo dưỡng, danh sách xe, chi tiết báo giá) hiển thị dạng **thẻ** trên SP thay cho bảng nhiều cột | (suy diễn từ `DEC-27`) |

### 8.4 Bảo mật & dữ liệu cá nhân

| ID | Yêu cầu | Nguồn |
| --- | --- | --- |
| NFR-SEC-01 | Toàn bộ kết nối qua HTTPS | (suy diễn) |
| NFR-SEC-02 | Mật khẩu lưu dưới dạng hash, không lưu dạng rõ | (suy diễn) |
| NFR-SEC-03 | Phân quyền theo role, kiểm tra quyền ở phía server cho mọi API | (suy diễn) |
| NFR-SEC-04 | Thông tin cá nhân (tên, email, SĐT, thông tin xe) được bảo vệ theo quy định pháp luật Nhật Bản về bảo vệ thông tin cá nhân | (suy diễn — xem `OQ-06`) |
| NFR-SEC-05 | Mã QR không chứa thông tin cá nhân dạng rõ; tra cứu qua mã định danh | (suy diễn) |
| NFR-SEC-07 | **Link tra cứu booking của Guest** dùng token ngẫu nhiên tối thiểu 128 bit, sinh bằng bộ sinh số ngẫu nhiên an toàn, không lộ ID tuần tự. Vì link **không hết hạn** (`BR-15`), độ mạnh của token là lớp bảo vệ duy nhất | `DEC-02` |
| NFR-SEC-09 | Trang tra cứu bằng token đặt `noindex` và `Referrer-Policy: no-referrer` để link không bị công cụ tìm kiếm thu thập hoặc rò rỉ qua header | (suy diễn từ `DEC-02`) |
| NFR-SEC-10 | Trang tra cứu bằng token chỉ hiển thị thông tin của đúng booking đó, **che bớt** thông tin cá nhân nhạy cảm (ví dụ hiển thị một phần số điện thoại) | (suy diễn từ `DEC-02`) |
| NFR-SEC-08 | Chống lạm dụng form booking không cần đăng nhập: giới hạn số lần đặt theo số điện thoại / IP, có CAPTCHA hoặc OTP | (suy diễn từ `DEC-01` — xem `OQ-14`) |
| NFR-SEC-06 | Ghi log thao tác quan trọng của Admin (tạo/sửa/xóa, cập nhật thanh toán) | (suy diễn) |

### 8.5 Hiệu năng & vận hành

| ID | Yêu cầu | Nguồn |
| --- | --- | --- |
| NFR-PRF-01 | Thời gian phản hồi trang thông thường < 3 giây | (suy diễn) |
| NFR-PRF-02 | Phản hồi của chatbox AI < 10 giây; có hiển thị trạng thái đang xử lý | (suy diễn) |
| NFR-PRF-03 | Hệ thống hoạt động ổn định trong giờ làm việc của cửa hàng | (suy diễn) |
| NFR-PRF-04 | Sao lưu dữ liệu định kỳ hằng ngày | (suy diễn) |
| NFR-PRF-05 | Kiến trúc cho phép mở rộng thêm cửa hàng và dịch vụ mới | `PP s5` |

---

## 9. Thực thể dữ liệu chính (sơ bộ)

> Mục này chỉ liệt kê thực thể để thống nhất phạm vi; thiết kế CSDL chi tiết thuộc tài liệu giai đoạn sau.

| Thực thể | Mô tả |
| --- | --- |
| Customer | **Hồ sơ khách hàng, định danh bằng số điện thoại** — tồn tại cả khi khách chưa có tài khoản (`BR-12`) |
| User | Tài khoản đăng nhập, liên kết tới một Customer (tùy chọn — Guest không có User) |
| Staff | Tài khoản nhân viên / quản trị, gắn role |
| Vehicle | Xe của khách (loại, hãng, model, biển số, nhiên liệu) |
| Service | Danh mục dịch vụ bảo dưỡng / sửa chữa |
| Part | Phụ tùng và giá |
| Booking | Lượt đặt lịch (Customer, xe, **cửa hàng**, dịch vụ, thời gian, **trạng thái** theo mục 7.1, **access token vĩnh viễn** cho link tra cứu, trạng thái thanh toán, **ghi chú nội bộ**, **cờ Chờ phụ tùng**) |
| BookingStatusLog | Lịch sử chuyển trạng thái booking: từ trạng thái nào sang trạng thái nào, **ai thực hiện** (khách / Staff / Admin / hệ thống), lúc nào, **lý do hủy** nếu có — `BR-19`, `BR-24` |
| CancelReason | Danh mục lý do hủy, gồm mục **"Khách không đến"** — `FR-BKG-23`, xem `OQ-28` |
| BookingItem | Chi tiết dịch vụ / phụ tùng trong một booking |
| RecurringPlan | Cấu hình đặt lịch lặp lại cho bảo dưỡng |
| Quotation | Báo giá cho một booking |
| MaintenanceHistory | Lịch sử bảo dưỡng / sửa chữa theo xe |
| Invoice | Hóa đơn |
| Payment | Thông tin và trạng thái thanh toán |
| Notification | Lịch sử gửi email / SMS cho khách hàng |
| StaffNotification | Thông báo nội bộ trong CMS: loại sự kiện, booking liên quan, thời điểm phát sinh, trạng thái đã đọc — `DEC-06` |
| ChatSession | Phiên chatbox AI, kèm file ảnh / voice đính kèm |
| Shop | Cửa hàng: tên, **địa chỉ**, số điện thoại — `DEC-11` |
| ShopSchedule | **Giờ làm việc và ngày nghỉ riêng của từng cửa hàng**, theo từng ngày trong tuần — `DEC-19` |
| ShopCapacity | **Số booking tối đa nhận được mỗi khung giờ**, cấu hình riêng theo cửa hàng — `DEC-19` |
| ShopInventory | **Tồn kho phụ tùng theo từng cửa hàng**: cửa hàng, phụ tùng, số lượng, ngưỡng tối thiểu — `DEC-13` |
| PartTransfer | **Yêu cầu điều phối phụ tùng** giữa hai cửa hàng: cửa hàng nguồn, cửa hàng nhận, phụ tùng, số lượng, **trạng thái** theo mục 7.2, **lý do từ chối**, **ngày bàn giao**, ngày nhận thực tế, booking liên quan — `DEC-13`, `DEC-15` |
| InventoryLog | Lịch sử biến động tồn kho: dùng cho booking, điều phối đi, điều phối đến — `FR-SHP-20` |
| BookingShopTransferLog | Lịch sử chuyển booking giữa các cửa hàng: cửa hàng cũ, cửa hàng mới, người thực hiện, thời điểm — `FR-SHP-07` |

---

## 10. Tích hợp bên ngoài

| ID | Hệ thống | Mục đích | Ghi chú |
| --- | --- | --- | --- |
| INT-01 | Dịch vụ gửi Email | Xác nhận booking, nhắc lịch, hóa đơn | Nhà cung cấp cần xác nhận — `OQ-04` |
| INT-02 | Dịch vụ gửi SMS | Xác nhận booking, nhắc lịch | Nhà cung cấp và chi phí cần xác nhận — `OQ-04` |
| INT-03 | Dịch vụ AI (LLM / Vision / Speech-to-Text) | Chatbox, nhận diện ảnh phụ tùng, xử lý voice | Cần xác nhận nhà cung cấp và ràng buộc dữ liệu |
| INT-04 | Sàn TMĐT bên thứ ba (mảng bán xe) | Hiện **không** tích hợp | `RQ §1` — xác nhận có cần liên thông dữ liệu khách hàng không |

---

## 11. Giả định và ràng buộc

| ID | Nội dung |
| --- | --- |
| AS-01 | Hệ thống phục vụ chuỗi cửa hàng AOYAMA, **vận hành nhiều cửa hàng ngay từ đầu** (`DEC-11`) — không phải triển khai một cửa hàng rồi mở rộng sau |
| AS-02 | Khách hàng chính ở Nhật Bản, do đó múi giờ UTC+9 và tiếng Nhật là ngôn ngữ mặc định |
| AS-03 | Tiếng Việt và tiếng Anh phục vụ đội phát triển và khách hàng nước ngoài |
| CS-01 | Không phát triển ứng dụng native trong phạm vi dự án |
| CS-02 | Không tích hợp cổng thanh toán trực tuyến trong giai đoạn đầu |
| CS-03 | Nội dung tài liệu nguồn trong `docs/Requirements/` được giữ nguyên, không chỉnh sửa |

---

## 12. Quyết định và các điểm cần làm rõ

### 12.1 Quyết định đã chốt

Bảng dưới liệt kê toàn bộ quyết định đã thống nhất với khách hàng. Phần yêu cầu chịu ảnh hưởng và hệ quả thiết kế của từng quyết định nằm ở mục 12.1.1.

| ID | Vấn đề | Quyết định | Ngày chốt |
| --- | --- | --- | --- |
| **DEC-01** | Mâu thuẫn trong tài liệu nguồn về quyền booking của Guest: `RQ §3.2` ghi *"Booking: Bắt buộc phải đăng nhập mới được đặt chỗ"*, trong khi `RQ §3.3` và `RQ §4.1` cho phép Guest booking không cần đăng nhập. | **Guest được đặt lịch mà không cần đăng nhập, chỉ cần nhập Tên và Số điện thoại.** Email chuyển thành trường tùy chọn. Câu *"Bắt buộc phải đăng nhập mới được đặt chỗ"* tại `RQ §3.2` **không còn hiệu lực**. | 2026-08-24 |
| **DEC-02** | Guest không đăng nhập thì xem, hủy và đổi lịch booking bằng cách nào? Link tra cứu có thời hạn không? | Sau khi Guest đặt lịch xong, hệ thống **gửi SMS chứa link kèm token**. **Link không có thời hạn.** Ràng buộc duy nhất: **không cho hủy khi booking đã chuyển sang trạng thái tiếp theo** (xem `BR-14`). | 2026-08-24 |
| **DEC-03** | Booking có những trạng thái nào? | **5 trạng thái:** *Chờ xác nhận* → *Xác nhận* → *Đang tiến hành* → *Hoàn thành*, cộng trạng thái *Đã hủy*. Chi tiết tại mục 7.1. | 2026-08-24 |
| **DEC-04** | Việc chuyển trạng thái booking là thủ công hay tự động? *(đóng `OQ-18`)* | **Thủ công.** Admin/Staff chủ động chuyển trạng thái. Hệ thống không tự động chuyển bước nào ngoài việc khởi tạo booking ở *Chờ xác nhận*. <br>⚠ **Đã được `DEC-07` sửa đổi:** bước *Xác nhận* → *Đang tiến hành* nay là tự động. | 2026-08-24 |
| **DEC-05** | Ai được hủy booking, ở trạng thái nào? *(đóng `OQ-17`)* | **Khách hàng** hủy được khi booking ở *Chờ xác nhận* hoặc *Xác nhận*. **Admin/Staff** hủy được **bất cứ lúc nào, ở mọi trạng thái**. Ranh giới chặn khách nằm giữa *Xác nhận* và *Đang tiến hành* — đúng như đội phát triển đã diễn giải ở v1.2. | 2026-08-24 |
| **DEC-06** | *(yêu cầu bổ sung, không có trong tài liệu nguồn)* Admin/Staff biết được booking mới hoặc booking bị khách hủy bằng cách nào? | **CMS có thông báo nội bộ.** Khi khách **tạo booking mới** hoặc **hủy booking**, hệ thống đẩy thông báo vào CMS cho Admin/Staff, kèm badge số chưa đọc và màn hình danh sách thông báo. | 2026-08-24 |
| **DEC-07** | *(sửa đổi `DEC-04`)* Ai chuyển booking sang *Đang tiến hành*? | **Hệ thống tự động.** Khi lễ tân **quét mã QR**, hệ thống tự tra cứu booking và **chuyển trạng thái từ *Xác nhận* sang *Đang tiến hành***. Đây là ngoại lệ duy nhất của nguyên tắc "chuyển trạng thái thủ công" tại `DEC-04`. | 2026-08-24 |
| **DEC-08** | Xử lý booking mà khách **không đến** thế nào? Có cần thêm trạng thái *Khách không đến* không? *(đóng `OQ-19`)* | **Không thêm trạng thái mới — giữ nguyên 5 trạng thái.** Booking đã qua ngày hẹn mà khách không đến sẽ **sinh thông báo trong CMS** để nhân viên chủ động liên hệ khách. **Nếu khách xác nhận không đến, Admin/Staff chuyển sang *Đã hủy*.** Hệ thống không tự hủy. | 2026-08-24 |
| **DEC-09** | Khi nào chạy rà soát booking quá hạn? *(đóng `OQ-26`)* | **Mỗi ngày một lần, lúc 16:00 giờ Nhật (UTC+9)**, quét các booking có **ngày hẹn là chính ngày hôm đó** mà khách chưa đến, rồi gửi SMS nhắc hoặc để nhân viên gọi điện. <br>*Đính chính v1.8: bản v1.7 ghi nhầm là "booking của ngày hôm trước".* | 2026-08-24 |
| **DEC-10** | Có tự gửi SMS cho khách khi phát hiện quá hạn không? *(đóng `OQ-27`)* | **Có.** Hệ thống **tự gửi SMS nhắc khách đặt lại lịch**, kèm URL đặt lịch. Gửi cùng thời điểm với thông báo CMS, mỗi booking chỉ một lần. | 2026-08-24 |
| **DEC-11** | Hệ thống chạy cho một hay nhiều cửa hàng? *(đóng `OQ-03`)* | **Nhiều cửa hàng** ở các địa chỉ khác nhau. Khách chọn cửa hàng khi đặt lịch; mỗi booking gắn với đúng một cửa hàng. | 2026-08-24 |
| **DEC-12** | Xử lý thế nào khi cửa hàng khách chọn bị **quá tải**? | Admin/Staff **gợi ý khách sang cửa hàng khác**. Nếu khách đồng ý, Admin **cập nhật lại booking sang cửa hàng mới** — vẫn là cùng booking đó, không tạo mới. | 2026-08-24 |
| **DEC-13** | Xử lý thế nào khi cửa hàng **hết phụ tùng**? *(đóng `OQ-09`)* | Hệ thống **quản lý tồn kho phụ tùng theo từng cửa hàng** và cho phép **điều phối phụ tùng từ cửa hàng khác về**. | 2026-08-24 |
| **DEC-14** | Các cửa hàng dùng chung bảng giá hay giá riêng? *(đóng `OQ-32`)* | **Chung bảng giá toàn chuỗi.** Mọi cửa hàng áp dụng cùng mức giá dịch vụ và phụ tùng. | 2026-08-24 |
| **DEC-15** | Cửa hàng nguồn có quyền từ chối điều phối phụ tùng không? *(đóng `OQ-33`)* | **Có quyền từ chối**, kèm lý do. Khi đồng ý, cửa hàng nguồn **ấn định ngày bàn giao phụ tùng**. | 2026-08-24 |
| **DEC-16** | Xử lý thế nào khi **mọi cửa hàng đều hết phụ tùng hoặc đều từ chối** điều phối? *(đóng `OQ-37`)* | Booking **giữ nguyên trạng thái *Chờ xác nhận***, không thêm trạng thái mới. Admin/Staff **ghi chú nội bộ** vào booking, ví dụ *"chờ phụ tùng"*. | 2026-08-24 |
| **DEC-17** | **Ngày bàn giao** là ngày gửi đi hay ngày nhận được? *(đóng `OQ-38`)* | **Ngày cửa hàng nguồn gửi phụ tùng đi.** | 2026-08-24 |
| **DEC-18** | Booking chờ phụ tùng giữ ngày hẹn cũ hay đổi sang ngày mới? *(đóng `OQ-42`)* | **Chuyển sang ngày hẹn mới.** Không giữ lại ngày hẹn đã trôi qua. | 2026-08-24 |
| **DEC-19** | Khung giờ làm việc và số booking tối đa cấu hình ở đâu? *(đóng `OQ-02`)* | **Cấu hình riêng theo từng cửa hàng** — giờ làm việc, ngày nghỉ và số booking nhận được mỗi khung giờ. Không có cấu hình chung toàn chuỗi. | 2026-08-24 |
| **DEC-20** | Nhân viên cửa hàng A có thấy dữ liệu và thông báo của cửa hàng B không? *(đóng `OQ-22`)* | **Không.** Dữ liệu và thông báo **cô lập theo cửa hàng**. | 2026-08-24 |
| **DEC-21** | Khi nào sinh mã QR? *(đóng `OQ-25`)* | **Khi booking chuyển sang trạng thái *Xác nhận***, không sinh lúc khách vừa đặt lịch. | 2026-08-24 |
| **DEC-22** | Đánh dấu chờ phụ tùng bằng gì? *(đóng `OQ-40`)* | **Bằng cờ có cấu trúc**, không dùng ô ghi chú văn bản tự do. | 2026-08-24 |
| **DEC-23** | Hệ thống tự xác định cửa hàng quá tải, hay nhân viên đánh giá? | **Nhân viên tự đánh giá.** Hệ thống chỉ cung cấp số liệu tải theo khung giờ làm thông tin tham khảo. | 2026-08-24 |
| **DEC-24** | Phân biệt quyền Admin và Staff thế nào? *(đóng `OQ-43`, thu hẹp `OQ-05`)* | **Admin nhìn được mọi cửa hàng; Staff chỉ nhìn được cửa hàng của mình.** Việc cô lập dữ liệu tại `DEC-20` chỉ áp dụng cho Staff. | 2026-08-24 |
| **DEC-25** | Dịch vụ có cần gắn **thời lượng ước tính** để tính năng lực tiếp nhận không? *(đóng `OQ-45`)* | **Không cần.** Năng lực tính thuần theo **số booking mỗi khung giờ**; dịch vụ không có thuộc tính thời lượng. | 2026-08-24 |
| **DEC-26** | Hệ thống gồm mấy site? | **Hai site tách biệt:** một site cho **khách hàng và Guest**, một site quản trị (**CMS**) cho **nhân viên và Admin cửa hàng**. Hai site dùng chung cơ sở dữ liệu và tầng nghiệp vụ. | 2026-08-24 |
| **DEC-28** | Hai mâu thuẫn trong tài liệu: `BR-07` và `FR-RPT-01`/`BR-08` ghi *"chỉ Admin"*, trong khi ma trận phân quyền mục 4.2 cho Staff cả hai quyền (⬤). *(thu hẹp `OQ-05`)* | **Tách hai quyền:** **Báo cáo — chỉ Admin**, Staff không xem được kể cả cửa hàng mình (giữ nguyên `FR-RPT-01`, `BR-08`; **sửa ma trận 4.2**). **Thanh toán — cả Admin và Staff**, Staff trong phạm vi cửa hàng mình (**sửa `BR-07`**; giữ nguyên ma trận 4.2). | 2026-08-25 |
| **DEC-27** | Site khách hàng chủ yếu dùng trên thiết bị nào? | **Dùng được cả PC và SP, nhưng SP là thiết bị chính.** Site khách hàng thiết kế **mobile-first** — dựng cho điện thoại trước rồi mở rộng lên PC; giao diện **đơn giản, tiện lợi, dễ thao tác**. | 2026-08-25 |

#### 12.1.1 Yêu cầu chịu ảnh hưởng và hệ quả thiết kế

**Các yêu cầu chịu ảnh hưởng của `DEC-01`:** FR-AUT-04, FR-AUT-05, FR-AUT-06, FR-AUT-07, FR-VEH-05, FR-VEH-06, FR-BKG-04, FR-BKG-13, FR-BKG-14, FR-BKG-15, FR-QRC-02, FR-NTF-04, BR-11, BR-12, BR-13, NFR-SEC-07, NFR-SEC-08.

**Hệ quả thiết kế cần lưu ý:**

1. **SMS trở thành kênh thông báo bắt buộc** — số điện thoại là thông tin duy nhất chắc chắn có, nên toàn bộ xác nhận, nhắc lịch và link QR phải gửi được qua SMS. Điều này làm tăng chi phí vận hành so với email; xem `OQ-04`.
2. **Cần cơ chế truy cập booking không qua đăng nhập** — Guest vẫn phải hủy và đổi lịch được (`RQ §4.3`, `§4.4`), nên cần link tra cứu kèm token bảo mật.
3. **Số điện thoại trở thành khóa nhận diện khách hàng** — tách khái niệm `Customer` (hồ sơ theo số điện thoại) khỏi `User` (tài khoản đăng nhập) trong mô hình dữ liệu.
4. **Form booking không đăng nhập dễ bị lạm dụng** — cần OTP hoặc CAPTCHA và giới hạn tần suất.

**Các yêu cầu chịu ảnh hưởng của `DEC-02` và `DEC-03`:** FR-BKG-05, FR-BKG-05a, FR-BKG-06, FR-BKG-13, FR-BKG-13a, FR-BKG-16, FR-BKG-17, FR-BKG-18, FR-QRC-05, BR-02, BR-13, BR-14, BR-15, BR-16, NFR-SEC-07, NFR-SEC-09, NFR-SEC-10, mục 7.1.

**Hệ quả thiết kế của `DEC-02`:**

1. **Token là lớp bảo vệ duy nhất** — link không hết hạn nên ai giữ được link là xem được booking mãi mãi. Bù lại bằng token đủ mạnh (`NFR-SEC-07`), chặn lập chỉ mục (`NFR-SEC-09`) và che bớt thông tin cá nhân trên trang (`NFR-SEC-10`).
2. **Link trở thành "sổ lịch sử" của khách không có tài khoản** — vì không hết hạn, khách vẫn mở lại được sau khi dịch vụ hoàn thành. Đây là điểm cộng cho `NFR-UX-01` (người lớn tuổi không phải nhớ mật khẩu).
3. **Cần thông báo khi trạng thái đổi** — khách bị chặn hủy từ *Đang tiến hành*, nên hệ thống phải hiển thị trạng thái rõ ràng (`FR-BKG-18`) và giải thích lý do khi nút hủy bị vô hiệu hóa (`FR-BKG-05a`).

**Các yêu cầu chịu ảnh hưởng của `DEC-04` và `DEC-05`:** FR-BKG-16, FR-BKG-17, FR-BKG-19…22, FR-QRC-05, FR-NTF-07, BR-14, BR-17, BR-18, BR-19, mục 4.2, mục 7.1.

**Hệ quả thiết kế của `DEC-04` (chuyển trạng thái thủ công):**

1. **Booking có thể bị bỏ quên ở *Chờ xác nhận*.** Không có cơ chế tự động nào kéo nó đi tiếp, nên nếu nhân viên quên xử lý, khách sẽ chờ vô thời hạn mà không biết cửa hàng đã nhận hay chưa. Đã bổ sung `FR-BKG-21` (lọc theo trạng thái, ưu tiên nhóm chờ) và `FR-BKG-22` (nhắc nội bộ); cần chốt ngưỡng thời gian tại `OQ-20`.
2. ~~Quét QR không còn tự chuyển trạng thái.~~ **Đã đảo lại bởi `DEC-07`** — xem bên dưới.
3. **Cần lịch sử chuyển trạng thái** (`BR-19`, thực thể `BookingStatusLog`) — vì thao tác do người thực hiện, phải truy vết được ai đổi gì lúc nào khi có khiếu nại.

**Các yêu cầu chịu ảnh hưởng của `DEC-06`:** FR-NTF-08…17 (mục 6.B.6), BR-20, BR-21, mục 4.2, thực thể `StaffNotification`.

**Hệ quả thiết kế của `DEC-06`:**

1. **Giảm đáng kể rủi ro của `OQ-20`.** Vì mọi bước chuyển trạng thái đều thủ công (`DEC-04`), nguy cơ lớn nhất là booking mắc kẹt ở *Chờ xác nhận*. Thông báo CMS khiến nhân viên thấy ngay booking mới, nên `FR-BKG-22` (nhắc booking bị bỏ quên) hạ từ rủi ro chính xuống lớp bảo vệ dự phòng.
2. **Chỉ thao tác của khách mới sinh thông báo** (`BR-20`) — nếu Admin tự tạo booking thay khách (`FR-BKG-03`) mà vẫn báo thì danh sách sẽ đầy nhiễu.
3. **Cần quyết định cơ chế đẩy** — realtime (WebSocket/SSE) hay polling định kỳ. Quầy lễ tân cần biết ngay, nhưng realtime làm tăng độ phức tạp hạ tầng; xem `OQ-23`.

**Các yêu cầu chịu ảnh hưởng của `DEC-07`:** FR-QRC-05…09, BR-17, BR-22, mục 7.1.

**Hệ quả thiết kế của `DEC-07`:**

1. **Bớt được một thao tác ở quầy lễ tân** — đúng tinh thần `RQ §7` (*"đỡ mất công hỏi lại vấn đề với KH, giảm thời gian xác nhận qua lại"*). Quét một lần là vừa tra cứu vừa chuyển trạng thái.
2. **Phải xử lý trường hợp quét khi booking không ở trạng thái *Xác nhận*.** `FR-QRC-07` quy định: vẫn hiển thị thông tin tra cứu nhưng không đổi trạng thái, kèm cảnh báo tương ứng. Riêng trường hợp booking còn ở *Chờ xác nhận* — khách đến nơi mà nhân viên chưa kịp xác nhận — cần khách hàng quyết định cách xử lý (`OQ-25`).
3. **Quét lại nhiều lần phải an toàn** (`FR-QRC-08`) — mã QR nằm trong tay khách, có thể bị quét nhầm nhiều lần; thao tác phải idempotent, không sinh nhiều bản ghi chuyển trạng thái.
4. **Nhân viên vẫn phải đăng nhập trên máy quét** (`FR-QRC-09`) — dù hệ thống tự chuyển, lịch sử vẫn cần ghi được ai đã quét, phục vụ `BR-19`.

**Các yêu cầu chịu ảnh hưởng của `DEC-08`:** FR-NTF-18…20, FR-BKG-20, FR-BKG-23…25, FR-RPT-06, BR-23, BR-24.

**Hệ quả thiết kế của `DEC-08`:**

1. **Không phá vỡ nguyên tắc "hệ thống không tự đổi trạng thái theo thời gian"** (`BR-17`). Cơ chế quá hạn chỉ **phát hiện và thông báo**; việc chuyển sang *Đã hủy* vẫn là thao tác có chủ đích của con người, sau khi đã liên hệ khách. Giữ được sự chủ động cho cửa hàng và tránh hủy nhầm khi khách chỉ đến muộn.
2. **Cần bổ sung trường "lý do hủy"** (`FR-BKG-23`). Đây chính là cách giải quyết vướng mắc mà `OQ-19` nêu ra: nếu chỉ có trạng thái *Đã hủy* chung chung thì thống kê không tách được "khách chủ động hủy" khỏi "khách không đến". Lý do hủy giải quyết được việc này mà không cần thêm trạng thái thứ sáu (`FR-RPT-06`).
3. **Thông báo quá hạn là loại sự kiện khác về bản chất** so với `DEC-06`. Thông báo của `DEC-06` do **khách hàng** kích hoạt; thông báo này do **hệ thống rà soát theo thời gian** sinh ra, nên cần phân loại riêng (`FR-NTF-19`) và có việc cần làm kèm theo — gọi cho khách.
4. **Cần một tiến trình chạy định kỳ** để rà soát booking quá hạn; ngưỡng thời gian và tần suất chạy cần chốt tại `OQ-26`.

**Các yêu cầu chịu ảnh hưởng của `DEC-09` và `DEC-10`:** FR-NTF-18, FR-NTF-21…26, BR-25, BR-26.

**Hệ quả thiết kế của `DEC-09` (rà soát 16:00 hằng ngày, xét booking trong chính ngày đó):**

1. **Đây là cơ chế nhắc trong ngày, không phải xử lý hậu lỡ hẹn.** Lúc 16:00, một ngày làm việc còn vài tiếng: nhân viên vẫn kịp gọi khách và khách vẫn kịp đến. Nhờ vậy nhiều booking được cứu thay vì chuyển thẳng sang *Đã hủy*.
2. **Một lượt quét phục vụ hai tình huống khác nhau** — booking đã quá giờ hẹn (khách lỡ hẹn) và booking còn hẹn vào cuối ngày (khách chưa đến lượt). Nội dung nhắn cho hai nhóm này nên khác nhau; xem `OQ-31`.
3. **Cần cơ chế quét bù** (`FR-NTF-22`). Nếu tiến trình lỗi hoặc hệ thống dừng đúng hôm đó, các booking của ngày hôm trước sẽ bị bỏ sót vĩnh viễn nếu lần chạy sau chỉ xét đúng một ngày. Vì vậy điều kiện quét phải là "**mọi booking quá hạn chưa xử lý**", không phải "đúng ngày hôm qua".
4. **Chống gửi trùng** (`FR-NTF-21`, `FR-NTF-24`) — hệ quả trực tiếp của điểm 3: khi đã quét bù thì phải đánh dấu booking nào đã sinh thông báo/SMS để không bắn lại mỗi ngày.

**Hệ quả thiết kế của `DEC-10` (tự gửi SMS nhắc đặt lại lịch):**

1. **Biến sự cố lỡ hẹn thành cơ hội quay lại** — đúng mục tiêu *"tăng tỷ lệ khách hàng quay lại"* của `PP s5`, và bổ trợ cho `FR-NTF-03` (nhắc kỳ bảo dưỡng).
2. **Khách có thể bị liên hệ hai lần** — SMS tự động lúc 16:00 và cuộc gọi của nhân viên sau đó. Nên soạn nội dung SMS ở giọng điệu hỗ trợ, và cho nhân viên thấy trên màn hình rằng SMS đã được gửi để họ chào hỏi cho phù hợp.
3. **Thêm một khoản chi phí SMS** ngoài 3 loại tin đã có (xác nhận, nhắc 12 tiếng, nhắc kỳ bảo dưỡng). Bổ sung vào phần ước tính chi phí khi trao đổi nhà cung cấp SMS tại `OQ-04`.
4. **Không gửi cho booking đã hủy** (`FR-NTF-25`) — nếu khách đã chủ động hủy từ trước thì việc nhắc "bạn có lỡ hẹn không" là sai tình huống.

**Các yêu cầu chịu ảnh hưởng của `DEC-11`…`DEC-13`:** toàn bộ mục 6.B.7 (FR-SHP-01…20), BR-27…31, mục 3.1 (hạng mục 13–14), mục 3.2 (hạng mục 4), FR-RPT-07, thực thể `ShopInventory` / `PartTransfer` / `BookingShopTransferLog`.

**Hệ quả thiết kế của `DEC-11`…`DEC-13`:**

1. ⚠ **Phạm vi dự án mở rộng đáng kể.** Bản v1.0 xếp *"quản lý kho phụ tùng chuyên sâu"* vào **ngoài phạm vi** vì tài liệu nguồn chỉ nói thêm/sửa/xóa phụ tùng (`RQ §10`). Nhưng bài toán "cửa hàng A hết phụ tùng thì điều phối từ cửa hàng khác" **bắt buộc phải có tồn kho theo cửa hàng** — không thể biết cửa hàng nào còn hàng nếu không theo dõi số lượng. Đây là khối lượng công việc mới, cần đánh giá lại tiến độ và chi phí với khách hàng.
2. **Cửa hàng trở thành chiều dữ liệu xuyên suốt.** Booking, tồn kho, nhân viên, thông báo CMS và báo cáo đều phải gắn cửa hàng. Cần rà lại toàn bộ màn hình và API để bảo đảm dữ liệu được lọc đúng theo cửa hàng.
3. **`OQ-22` chuyển từ câu hỏi phụ thành câu hỏi then chốt.** Khi đã có nhiều cửa hàng, việc nhân viên cửa hàng A có thấy dữ liệu và thông báo của cửa hàng B hay không là vấn đề phân quyền cốt lõi, không còn là chi tiết nhỏ về giao diện.
4. **`OQ-02` (khung giờ, năng lực tiếp nhận) trở nên bắt buộc phải chốt.** `FR-SHP-10` cần biết "cửa hàng nào đang quá tải" mới gợi ý được cửa hàng thay thế — mà khái niệm "quá tải" chỉ tồn tại khi đã định nghĩa năng lực tiếp nhận theo khung giờ.
5. **Vai trò Admin có thể phải tách hai cấp** — Admin cấp chuỗi (thấy toàn bộ cửa hàng, điều phối giữa các cửa hàng) và Admin/Staff cấp cửa hàng. Điều này làm `OQ-05` (tách quyền Admin/Staff) trở nên cấp thiết hơn.

**Các yêu cầu chịu ảnh hưởng của `DEC-14` và `DEC-15`:** FR-SRV-06, FR-SRV-07, FR-SHP-15, FR-SHP-21…26, BR-32…34, mục 7.2.

**Hệ quả thiết kế của `DEC-14` (giá chung toàn chuỗi):**

1. **Đơn giản hóa đáng kể việc chuyển booking giữa các cửa hàng** (`DEC-12`). Vì giá không đổi theo nơi thực hiện, chuyển cửa hàng không kéo theo tính lại chi phí hay giải thích chênh lệch với khách (`BR-32`).
2. **Bảng giá quản lý ở cấp chuỗi, không cấp cửa hàng** — Admin cấp chuỗi sửa giá một lần, áp dụng cho tất cả. Cần phân biệt rõ với tồn kho, vốn quản lý theo từng cửa hàng (`BR-30`).

**Hệ quả thiết kế của `DEC-15` (từ chối và ngày bàn giao):**

1. **Yêu cầu điều phối cần vòng đời trạng thái riêng** với nhánh rẽ đồng ý / từ chối — đã bổ sung tại mục 7.2.
2. **Ngày bàn giao là mắt xích nối kho với khách hàng.** Nhân viên chỉ hẹn được ngày trả xe khi biết bao giờ phụ tùng về (`FR-SHP-25`). Vì vậy ngày bàn giao phải hiển thị ngay trên booking đang chờ phụ tùng, không nằm riêng trong màn hình kho.
3. **Cần lối thoát khi bị từ chối** (`FR-SHP-24`) — nhân viên phải gửi lại yêu cầu sang cửa hàng khác nhanh chóng, vì khách đang chờ. Nếu **mọi cửa hàng đều từ chối hoặc đều hết hàng** thì hệ thống chưa có phương án; xem `OQ-37`.
4. **Trừ kho tại thời điểm nhận, không phải lúc đồng ý** (`BR-34`) — nếu trừ sớm, phụ tùng sẽ biến mất khỏi sổ sách trong lúc còn đang trên đường, khiến cửa hàng nguồn không dùng được cho ca gấp mà cửa hàng nhận cũng chưa có.

**Các yêu cầu chịu ảnh hưởng của `DEC-16` và `DEC-17`:** FR-BKG-26…30, FR-SHP-22, FR-SHP-25…27, BR-35…37, mục 7.2.

**Hệ quả thiết kế của `DEC-16` (chờ phụ tùng — giữ nguyên *Chờ xác nhận*):**

1. ⚠ **Va chạm trực tiếp với tiến trình rà soát 16:00.** `FR-NTF-18` quét đúng các booking còn ở *Chờ xác nhận* / *Xác nhận* và coi đó là khách chưa đến. Một booking đang chờ phụ tùng sẽ **lọt vào lưới này** và khiến hệ thống nhắn cho khách *"bạn có lỡ hẹn không"* — sai hoàn toàn tình huống, vì chính cửa hàng mới là bên chưa sẵn sàng. Đã xử lý bằng `FR-BKG-28` và `BR-36`: booking mang cờ *Chờ phụ tùng* bị loại khỏi lượt quét.
2. **Ghi chú tự do không đủ để máy hiểu.** Vì lý do ở điểm 1, ngoài phần ghi chú dạng văn bản (`FR-BKG-26`) cần thêm **một cờ đánh dấu có cấu trúc** (`FR-BKG-27`) — hệ thống không thể dựa vào việc dò chữ *"chờ phụ tùng"* trong ghi chú tự do để quyết định có gửi SMS hay không. Cần khách hàng xác nhận cách làm này tại `OQ-40`.
3. **Ghi chú là nội bộ.** `FR-BKG-26` quy định khách không nhìn thấy ghi chú, kể cả trên trang tra cứu bằng link (`FR-BKG-13`). Nhân viên cần chỗ ghi thẳng thắn về tình hình xử lý.
4. **Cần đường quay lại khi phụ tùng về** (`FR-BKG-30`) — nếu không, booking sẽ nằm im ở *Chờ xác nhận* kể cả sau khi hàng đã tới, vì không còn cơ chế tự động nào nhắc (`DEC-04`).

**Hệ quả thiết kế của `DEC-17` (ngày bàn giao = ngày gửi đi):**

1. **Còn thiếu một mốc để hẹn khách.** Nhân viên cần biết bao giờ phụ tùng **tới nơi** mới hẹn được ngày trả xe, mà hệ thống chỉ ghi ngày gửi. Trước mắt nhân viên tự ước lượng (`FR-SHP-25`); về lâu dài, `FR-SHP-27` ghi nhận ngày nhận thực tế để tích lũy dữ liệu thời gian vận chuyển giữa từng cặp cửa hàng.
2. **Cảnh báo trễ hàng cần khoảng dự phòng.** Không thể cảnh báo ngay khi qua ngày gửi, vì hàng còn đang trên đường. `FR-SHP-26` dùng ngưỡng "ngày gửi + N ngày"; giá trị N cần chốt tại `OQ-41`.

**Các yêu cầu chịu ảnh hưởng của `DEC-18`:** FR-BKG-31…34, BR-38, BR-39.

**Hệ quả thiết kế của `DEC-18`:**

1. **Trình tự xử lý được xác định rõ:** cửa hàng biết được thời điểm có phụ tùng → nhân viên gọi khách chốt ngày → cập nhật ngày hẹn mới vào booking → gửi thông báo cho khách (`FR-BKG-33`). Chỉ chốt ngày mới khi đã ước lượng được ngày phụ tùng về, tránh phải hẹn lại lần nữa.
2. **Cần cảnh báo cho booking có ngày hẹn đã qua** (`FR-BKG-32`). Vì `DEC-04` không có cơ chế tự động nào, nếu không nhắc thì booking sẽ nằm im với một ngày hẹn quá khứ. Đây là lớp bảo vệ khác với thông báo 16:00 — thông báo kia đã bị `BR-36` loại trừ với booking chờ phụ tùng.
3. **Giải quyết được vướng mắc hiển thị** mà `OQ-42` nêu ra: trang tra cứu của khách sẽ không còn hiện một lịch hẹn đã qua kèm trạng thái *Chờ xác nhận* (`BR-39`).
4. **Cần lịch sử đổi ngày hẹn** (`FR-BKG-34`) — booking chờ phụ tùng có thể phải dời lịch nhiều lần, cần truy vết được đã dời bao nhiêu lần và vì sao, phục vụ xử lý khiếu nại.

**Các yêu cầu chịu ảnh hưởng của `DEC-19`…`DEC-22`:** FR-SHP-28…40, FR-BKG-12, FR-BKG-26, FR-BKG-27, FR-BKG-35, FR-QRC-01, FR-QRC-02, FR-QRC-07, FR-QRC-10…12, BR-40…45, thực thể `ShopSchedule`, `ShopCapacity`.

**Hệ quả thiết kế của `DEC-19` (cấu hình theo cửa hàng):**

1. **Định nghĩa được khái niệm "quá tải"** mà `FR-SHP-10` cần: cửa hàng quá tải trong một khung giờ khi số booking đã nhận đạt mức tối đa đã cấu hình (`FR-SHP-32`). Nhờ vậy tính năng gợi ý chuyển sang cửa hàng khác (`DEC-12`) mới chạy được.
2. **Năng lực tính theo số lượng booking, không theo thời lượng dịch vụ** (`BR-41`). Cách này đơn giản và đúng với những gì khách hàng mô tả, nhưng chưa phân biệt một ca thay dầu 15 phút với một ca sửa lớn nửa ngày; xem `OQ-45`.
3. **Cấu hình ngày nghỉ theo cửa hàng cũng giải quyết `OQ-30`** — tiến trình 16:00 biết được cửa hàng nào đang nghỉ để không tạo việc cho nhân viên vắng mặt.

**Hệ quả thiết kế của `DEC-20` (cô lập dữ liệu):**

1. ⚠ **Va chạm với chính chức năng điều phối đã chốt.** `FR-SHP-13` yêu cầu nhân viên **tra cứu tồn kho các cửa hàng khác**, và `FR-SHP-10` yêu cầu **xem tình trạng tải của cửa hàng khác** — cả hai đều là điều kiện cần của `DEC-12` và `DEC-13`. Nếu cô lập tuyệt đối thì hai tính năng này không hoạt động được.
   **Cách xử lý:** cô lập áp dụng cho **booking, khách hàng, lịch sử dịch vụ và thông báo** (`BR-42`); mở ba ngoại lệ hẹp (`BR-43`) — chỉ thấy **số lượng tồn kho**, chỉ thấy **còn chỗ hay hết chỗ**, và một vai trò **Admin cấp chuỗi** cho báo cáo tổng hợp. Nhân viên cửa hàng khác vẫn không thấy được khách hàng hay booking.
2. **Cần xác nhận sự tồn tại của vai trò Admin cấp chuỗi** (`OQ-43`). `RQ §3.1` khẳng định hệ thống *"chỉ có 3 role"*, nhưng `FR-RPT-07` (báo cáo toàn chuỗi) và việc điều phối giữa các cửa hàng đòi hỏi một vai trò nhìn được tất cả. Đây là điểm cần thống nhất lại với khách hàng, gắn liền với `OQ-05`.
3. **Phải kiểm tra quyền ở phía máy chủ** (`FR-SHP-36`) — chỉ ẩn trên giao diện là không đủ khi dữ liệu giữa các cửa hàng đã được coi là tách biệt.

**Hệ quả thiết kế của `DEC-21` (QR sinh khi xác nhận):**

1. ⚠ **Khác với tài liệu nguồn.** `RQ §7` ghi *"Sau khi booking thành công, hệ thống tạo mã QR cho khách"*. Nay mã QR chỉ có sau khi **cửa hàng xác nhận**. Cần nêu rõ thay đổi này khi trao đổi lại với khách hàng.
2. **Khách nhận hai tin nhắn ở hai thời điểm khác nhau:** tin thứ nhất khi đặt lịch xong — chứa **link tra cứu** (`DEC-02`) nhưng chưa có QR; tin thứ hai khi cửa hàng xác nhận — chứa **mã QR** (`FR-QRC-02`). Cần soạn nội dung hai tin cho rõ ràng để khách không tưởng bị thiếu thông tin.
3. **Giải quyết được `OQ-25` một cách tự nhiên.** Câu hỏi cũ là "khách đến khi booking chưa được xác nhận thì quét QR ra sao" — nay tình huống đó không tồn tại, vì chưa xác nhận thì chưa có QR. Thay vào đó nhân viên **tra cứu thủ công theo số điện thoại hoặc tên** rồi xác nhận booking (`FR-QRC-11`).
4. **Tạo thêm động lực xác nhận booking sớm** — nhân viên không xác nhận thì khách không có QR, và lợi ích rút ngắn thời gian tiếp nhận mà `RQ §7` mong muốn sẽ mất.

**Hệ quả thiết kế của `DEC-22` (dùng cờ thay ghi chú):**

1. **Xử lý tự động chạy được** — `FR-BKG-28` (loại khỏi lượt rà soát 16:00) và `FR-BKG-29` (bộ lọc) đều căn cứ vào cờ, không phải dò chữ trong văn bản tự do.
2. **Ô ghi chú nội bộ vẫn giữ** nhưng hạ xuống mức Should và đổi mục đích: ghi thông tin bổ sung, **không** dùng để đánh dấu trạng thái chờ phụ tùng (`FR-BKG-26`).

**Các yêu cầu chịu ảnh hưởng của `DEC-23` và `DEC-24`:** FR-SHP-32, FR-SHP-34, FR-SHP-39, FR-SHP-41, FR-SHP-42, BR-46…48, mục 4.1, mục 4.2.

**Hệ quả thiết kế của `DEC-23` (nhân viên đánh giá quá tải):**

1. **Tách bạch hai khái niệm từng bị gộp làm một** (`BR-46`): **giới hạn nhận booking** là ràng buộc cứng hệ thống áp với khách khi đặt lịch (`BR-40`, `FR-BKG-35`), còn **quá tải** là nhận định của nhân viên để quyết định có gợi ý khách chuyển cửa hàng không. Bản v1.12 nhập hai thứ này vào `FR-SHP-32`, nay đã tách ra.
2. **Phù hợp với thực tế vận hành** — kỹ thuật viên nghỉ ốm, một ca sửa phát sinh lâu hơn dự kiến: những tình huống này con số cấu hình không phản ánh được, nhưng nhân viên tại quầy thì biết.
3. **Giảm mức độ quan trọng của `OQ-45`** (có cần gắn thời lượng cho từng dịch vụ không). Vì con số chỉ mang tính tham khảo và người mới là bên quyết định, việc tính toán chính xác thời lượng không còn cấp thiết.

**Hệ quả thiết kế của `DEC-24` (tách Admin và Staff):**

1. ⚠ **Hệ thống thực chất có 4 vai trò, không phải 3.** `RQ §3.1` ghi *"Chỉ có 3 role"* và gộp *"Admin/Staff: Full quyền"*. Nay Admin và Staff khác nhau về phạm vi dữ liệu, nên danh sách vai trò là **Guest · User · Staff · Admin**. Cần nêu rõ khi trao đổi lại với khách hàng.
2. **Ma trận phân quyền tại mục 4.2 đã tách thành 4 cột**, với ký hiệu ⬤ cho các quyền *"có, nhưng chỉ trong cửa hàng mình"*.
3. **Giải quyết được mâu thuẫn của `DEC-20`.** Câu hỏi "ai làm báo cáo toàn chuỗi nếu dữ liệu bị cô lập" nay đã rõ: Admin. Ngoại lệ thứ ba tại `BR-43` không còn là một vai trò cần bổ sung mà chính là vai trò Admin sẵn có.
4. **Bảng giá và cấu hình cửa hàng thuộc quyền Admin** (`BR-48`) — vì giá dùng chung toàn chuỗi (`DEC-14`), để Staff sửa được sẽ ảnh hưởng tới mọi cửa hàng khác.

**Hệ quả của `DEC-25`:** đơn giản hóa cả mô hình dữ liệu `Service` lẫn màn hình cấu hình — không phải nhập và bảo trì thời lượng cho từng dịch vụ. Việc cân đối khối lượng công việc thực tế trong một khung giờ do nhân viên tự xử lý (`DEC-23`), phù hợp với cách vận hành hiện tại của cửa hàng.

**Các yêu cầu chịu ảnh hưởng của `DEC-26`:** toàn bộ mục 5 (Kiến trúc hai site), cấu trúc lại mục 6 thành 6.A / 6.B / 6.C, NFR-PLT-04…06, mục 3.1 hạng mục 15.

**Hệ quả thiết kế của `DEC-26`:**

1. **Chương yêu cầu chức năng đã được sắp xếp lại theo site** — 45 yêu cầu thuộc site khách hàng, 111 thuộc site quản trị, 19 dùng chung. **Mã yêu cầu giữ nguyên** để không phá vỡ tham chiếu chéo từ `BR`, `DEC` và tiêu chí nghiệm thu.
2. **Xuất hiện nhóm "dùng chung" (6.C).** Không phải yêu cầu nào cũng thuộc về một site: **bảng giá** là quy tắc dữ liệu, còn **email/SMS** là kênh gửi ra ngoài do sự kiện ở cả hai site kích hoạt. Gán ép chúng vào một site sẽ gây hiểu nhầm khi phân chia công việc.
3. **Sáu điểm giao nhau giữa hai site** được liệt kê tại mục 5.3 — đây là những chỗ hai đội phát triển phải thống nhất chặt với nhau, đặc biệt là luồng mã QR (`DEC-21`) trải dài qua cả hai site.
4. **Yêu cầu thiết bị khác nhau giữa hai site** (`NFR-PLT-06`): site khách hàng cần responsive đầy đủ cho người lớn tuổi dùng điện thoại; site quản trị chủ yếu dùng trên PC tại quầy, **trừ màn hình quét QR** — lễ tân cần quét bằng thiết bị di động.

**Các yêu cầu chịu ảnh hưởng của `DEC-27`:** mục 3.2 hạng mục 1, mục 5.1 (dòng *Thiết bị*), NFR-PLT-02, NFR-PLT-07, NFR-PLT-08, NFR-UX-01…08, AC-11, AC-34, AC-35.

**Hệ quả thiết kế của `DEC-27`:**

1. **Thứ tự dựng mockup thay đổi.** Trước đây PC và SP là hai bản song song (`NFR-PLT-02`); nay **bản SP là bản gốc**, bản PC dựng theo sau từ bản SP. Điều này ảnh hưởng trực tiếp tới trình tự và khối lượng công việc của giai đoạn Mockup Design.
2. **Hai yêu cầu dễ dùng cộng dồn lên nhau:** người lớn tuổi (`NFR-UX-01`) **trên màn hình điện thoại**. Đây là ràng buộc chặt hơn từng yêu cầu riêng lẻ — chữ phải lớn trong khi diện tích màn hình nhỏ, nên mỗi màn hình chỉ nên gánh **một việc**, và giới hạn 3–4 bước của luồng đặt lịch (`NFR-UX-03`) cần được giữ nghiêm.
3. **Các màn hình nhiều dữ liệu của khách phải thiết kế lại cho SP** (`NFR-UX-08`) — lịch sử bảo dưỡng, danh sách xe, chi tiết báo giá. Trên PC là bảng nhiều cột; trên SP phải chuyển sang dạng thẻ, không để cuộn ngang.
4. **Màn hình hiển thị mã QR (`FR-QRC-02`) trở thành màn hình chủ đạo trên SP** — khách mở điện thoại đưa cho nhân viên quét ngay tại quầy. Cần mở được nhanh (ít bước, không bắt đăng nhập lại), mã đủ lớn và rõ để máy quét đọc được.
5. **Chatbox AI (`FR-AI`) phải khai thác được năng lực của điện thoại** — chụp ảnh trực tiếp từ camera và ghi âm giọng nói ngay trên trình duyệt, thay vì chỉ tải file lên như trên PC.
6. **Không ảnh hưởng site quản trị.** CMS vẫn tối ưu cho PC tại quầy (`NFR-PLT-06`), riêng màn hình quét QR dùng được trên thiết bị di động.



### 12.2 Các điểm còn cần làm rõ

| ID | Vấn đề | Mức ảnh hưởng |
| --- | --- | --- |
| **OQ-04** | Nhà cung cấp dịch vụ **Email và SMS** tại Nhật, chi phí và giới hạn gửi. | **Trung bình** |
| **OQ-05** | *(đã thu hẹp bởi `DEC-24` và `DEC-28` — phạm vi cửa hàng và quyền báo cáo đã rõ)* Còn lại duy nhất: Staff có được **xóa** booking và dữ liệu không, hay chỉ được tạo và sửa? | **Thấp** — ảnh hưởng mục 4.2 |
| **OQ-06** | Yêu cầu tuân thủ pháp lý về **bảo vệ thông tin cá nhân** và thời hạn lưu trữ dữ liệu khách hàng. | **Trung bình** |
| **OQ-07** | `RQ §5` để trống trong tài liệu nguồn — có nội dung nào bị thiếu không? | **Trung bình** |
| **OQ-08** | **Chu kỳ bảo dưỡng** được xác định thế nào (theo số km, theo thời gian, theo loại xe)? Đây là cơ sở cho FR-NTF-03 và FR-AI-09. | **Trung bình** |
| **OQ-10** | Hóa đơn xuất **theo ngày** — là hóa đơn tổng hợp toàn bộ giao dịch trong ngày, hay hóa đơn từng booking được xuất trong ngày? | **Trung bình** |
| **OQ-11** | Tài liệu kỹ thuật phục vụ FR-AI-07 (quy trình sửa chữa, mã lỗi, thông số) có sẵn ở dạng số không? Nếu không, chức năng này khó khả thi. | **Cao** — quyết định khả thi của FR-AI-07 |
| **OQ-12** | Ngôn ngữ mặc định khi người dùng truy cập lần đầu là gì? | **Thấp** |
| **OQ-14** | *(phát sinh từ `DEC-01`)* Có áp dụng **OTP qua SMS** khi Guest đặt lịch không? Có OTP thì chặn được số điện thoại giả và booking rác, nhưng thêm một bước thao tác — đi ngược yêu cầu "dễ dùng cho người lớn tuổi" (`NFR-UX-01`) và phát sinh chi phí SMS. | **Cao** — ảnh hưởng FR-AUT-07, NFR-SEC-08 |
| **OQ-15** | *(phát sinh từ `DEC-01`)* Nếu khách **không cung cấp email**, hóa đơn (`FR-PAY-03`) gửi cho khách bằng cách nào — chỉ bản in tại cửa hàng, hay qua link tải trong SMS? | **Trung bình** |
| **OQ-16** | *(tách từ `OQ-13`, chưa được trả lời)* Khi khách đăng ký tài khoản bằng **cùng số điện thoại** đã dùng để đặt lịch với tư cách Guest, hệ thống có **tự động gom các booking và xe cũ** vào tài khoản mới không? Nếu có thì cần xác thực OTP để tránh chiếm đoạt dữ liệu người khác. | **Trung bình** — ảnh hưởng FR-VEH-06, FR-BKG-15 |
| **OQ-20** | *(phát sinh từ `DEC-04`, đã giảm nhẹ nhờ `DEC-06`)* Ngưỡng thời gian nào thì coi là booking **bị bỏ quên ở *Chờ xác nhận***? Thông báo CMS đã giúp nhân viên thấy booking mới ngay, nhưng vẫn cần một lớp nhắc lại cho trường hợp thông báo bị bỏ qua. | **Trung bình** — ảnh hưởng FR-BKG-22 |
| **OQ-21** | *(phát sinh từ `DEC-05`, một phần đã được `DEC-08` giải quyết)* Khi Admin/Staff hủy một booking đang ở *Đang tiến hành* hoặc *Hoàn thành* — tức xe đã được xử lý và có thể đã phát sinh chi phí phụ tùng — thì **hóa đơn và trạng thái thanh toán** xử lý thế nào? *(Phần "có bắt buộc nhập lý do hủy không" đã chốt tại `FR-BKG-23`: có.)* | **Trung bình** — ảnh hưởng FR-BKG-19, FR-PAY-02, FR-PAY-03 |
| **OQ-23** | *(phát sinh từ `DEC-06`)* Thông báo đẩy **realtime** (WebSocket/SSE, hiện ngay không cần tải lại) hay **polling định kỳ** (ví dụ 30 giây/lần)? Quầy lễ tân có cần **âm thanh cảnh báo** khi có booking mới không? | **Trung bình** — ảnh hưởng FR-NTF-16, kiến trúc hệ thống |
| **OQ-24** | *(phát sinh từ `DEC-06`)* Ngoài **tạo mới** và **hủy**, còn sự kiện nào cần báo vào CMS không? Đội phát triển đã tạm thêm **đổi lịch** (`FR-NTF-10`) vì thao tác này cũng làm thay đổi lịch hẹn của cửa hàng. Có cần báo khi khách gửi mô tả lỗi qua chatbox AI không? | **Trung bình** — ảnh hưởng FR-NTF-10 |
| **OQ-28** | *(phát sinh từ `DEC-08`)* **Danh mục lý do hủy** gồm những mục nào? Đề xuất: *Khách yêu cầu hủy · Khách không đến · Cửa hàng không đáp ứng được · Khách đổi sang lịch khác · Khác (nhập tay)*. | **Thấp** — ảnh hưởng FR-BKG-23, FR-RPT-06 |
| **OQ-29** | *(phát sinh từ `DEC-10`)* **URL trong SMS nhắc đặt lại lịch** dẫn tới đâu: form đặt lịch mới **điền sẵn** thông tin xe và dịch vụ từ booking cũ (thuận tiện hơn cho người lớn tuổi, `NFR-UX-01`), hay trang đặt lịch trống? | **Trung bình** — ảnh hưởng FR-NTF-23 |
| **OQ-30** | *(phát sinh từ `DEC-09`)* Tiến trình rà soát 16:00 có chạy vào **ngày cửa hàng nghỉ** (chủ nhật, ngày lễ Nhật Bản) không? Nếu cửa hàng đóng cửa thì nhân viên không có mặt để gọi khách. | **Thấp** — ảnh hưởng FR-NTF-18 |
| **OQ-31** | *(phát sinh từ `DEC-09`)* Lượt quét 16:00 gộp hai nhóm khác nhau: booking **đã quá giờ hẹn** (khách lỡ hẹn) và booking **còn hẹn vào cuối ngày** (chưa đến lượt). Nội dung SMS cho hai nhóm này có nên khác nhau không, hay dùng chung một mẫu? | **Trung bình** — ảnh hưởng FR-NTF-23 |
| **OQ-34** | *(phát sinh từ `DEC-13`)* Tồn kho có bao gồm **nhập hàng từ nhà cung cấp** không, hay chỉ theo dõi số lượng hiện có và điều phối nội bộ? Bản v1.8 tạm để phần đặt hàng nhà cung cấp **ngoài phạm vi**. | **Cao** — ảnh hưởng phạm vi dự án |
| **OQ-35** | *(phát sinh từ `DEC-12`)* Khách hàng có được **tự chọn đổi cửa hàng** không, hay bắt buộc phải qua nhân viên? Bản v1.8 quy định chỉ nhân viên chuyển được (`BR-28`). | **Trung bình** — ảnh hưởng FR-SHP-06 |
| **OQ-36** | *(phát sinh từ `DEC-11`)* Khi khách đặt lịch, hệ thống có **gợi ý cửa hàng gần nhất** theo vị trí không, hay chỉ hiện danh sách để khách tự chọn? | **Thấp** — ảnh hưởng FR-SHP-03 |
| **OQ-39** | *(phát sinh từ `DEC-14`)* Bảng giá chung có cần **lịch sử thay đổi giá** không? Booking đã tạo trước khi đổi giá thì áp giá cũ hay giá mới? | **Trung bình** — ảnh hưởng FR-SRV-07, FR-PAY-03 |
| **OQ-41** | *(phát sinh từ `DEC-17`)* **Khoảng dự phòng** bao nhiêu ngày kể từ ngày gửi thì cảnh báo phụ tùng chưa tới? Có phụ thuộc khoảng cách giữa hai cửa hàng không? | **Thấp** — ảnh hưởng FR-SHP-26 |
| **OQ-44** | *(phát sinh từ `DEC-20`)* Khi booking chuyển sang cửa hàng khác, **cửa hàng cũ có còn xem được lịch sử** booking đó không, hay mất quyền hoàn toàn? Nếu mất hoàn toàn thì họ không tra lại được công việc đã làm trước khi chuyển. | **Trung bình** — ảnh hưởng FR-SHP-40 |
| **OQ-46** | *(phát sinh từ `DEC-21`)* Khách đã có mã QR nhưng booking sau đó **bị đổi lịch** sang ngày khác — mã QR cũ còn dùng được hay phải sinh mã mới? | **Thấp** — ảnh hưởng FR-QRC-01 |
| **OQ-47** | *(phát sinh từ `DEC-26`)* **Site quản trị có cần đủ 3 ngôn ngữ** như site khách hàng không? Nhân viên cửa hàng ở Nhật nhiều khả năng chỉ dùng tiếng Nhật; làm đủ 3 ngôn ngữ cho CMS sẽ tốn thêm công dịch và bảo trì đáng kể. | **Trung bình** — ảnh hưởng `NFR-I18N-01`, khối lượng công việc |
| **OQ-48** | *(phát sinh từ `DEC-27`)* Site khách hàng có cần **cài được lên màn hình chính điện thoại (PWA)** không? Có thì khách mở nhanh như một ứng dụng — thuận cho màn hình QR và cho người lớn tuổi — nhưng phát sinh thêm khối lượng công việc. Nếu không, khách truy cập qua trình duyệt như website thường. | **Trung bình** — ảnh hưởng `NFR-PLT-01`, khối lượng công việc |
| **OQ-49** | *(phát sinh từ `DEC-27`)* **Danh sách thiết bị và trình duyệt SP phải bảo đảm** — iOS Safari và Android Chrome từ phiên bản nào trở lên — và **bề rộng màn hình nhỏ nhất** cần hiển thị đúng (đề xuất 375 px). | **Thấp** — ảnh hưởng `NFR-PLT-03`, `AC-35` |

---

## 13. Tiêu chí nghiệm thu sơ bộ

| ID | Tiêu chí |
| --- | --- |
| AC-01 | Guest xem được website và danh sách dịch vụ ở cả 3 ngôn ngữ |
| AC-02 | Khách hàng hoàn tất một booking và nhận được SMS (và email nếu có cung cấp) xác nhận kèm mã QR |
| AC-02b | **Guest hoàn tất booking chỉ với Tên và Số điện thoại, không đăng nhập** (`DEC-01`) |
| AC-02c | Guest mở link trong SMS và xem, hủy, đổi lịch được booking của mình mà không cần đăng nhập |
| AC-02d | Khi booking đã chuyển sang **Đang tiến hành**, nút hủy / đổi lịch trên link tra cứu bị vô hiệu hóa kèm giải thích lý do (`DEC-02`) |
| AC-02e | Link tra cứu vẫn mở được sau khi booking chuyển sang **Hoàn thành** (`BR-15`) |
| AC-02f | Booking chạy đủ vòng đời 5 trạng thái và khách thấy được trạng thái hiện tại ở mỗi bước (`DEC-03`) |
| AC-02g | Admin/Staff chuyển được booking qua từng trạng thái bằng thao tác thủ công, và mỗi lần chuyển đều ghi lại người thực hiện + thời điểm (`DEC-04`, `BR-19`) |
| AC-02h | Admin hủy được một booking đang ở trạng thái **Đang tiến hành**, thao tác mà khách hàng bị chặn (`DEC-05`) |
| AC-02i | Khách tạo booking mới → **thông báo xuất hiện trong CMS** và badge chưa đọc tăng lên (`DEC-06`) |
| AC-02j | Khách hủy booking → thông báo xuất hiện trong CMS; bấm vào mở đúng màn hình chi tiết booking đó |
| AC-02k | Admin đánh dấu đã đọc và badge giảm tương ứng |
| AC-02l | Booking đã qua ngày hẹn mà khách không đến → **thông báo quá hạn xuất hiện trong CMS**, và booking **không bị hệ thống tự hủy** (`DEC-08`, `BR-23`) |
| AC-02m | Nhân viên hủy booking đó với lý do **"Khách không đến"**, và báo cáo tách được nhóm này khỏi nhóm khách chủ động hủy (`FR-RPT-06`) |
| AC-02n | Tiến trình rà soát chạy lúc **16:00 (UTC+9)** phát hiện đúng các booking của **ngày hôm trước** còn ở *Chờ xác nhận* / *Xác nhận* (`DEC-09`) |
| AC-02o | Khách nhận được **SMS nhắc đặt lại lịch kèm URL đặt lịch**, và chỉ nhận **một lần** dù tiến trình chạy lại (`DEC-10`, `FR-NTF-24`) |
| AC-02p | Booking đã bị hủy trước đó **không** nhận SMS nhắc đặt lại lịch (`FR-NTF-25`) |
| AC-12 | Khách chọn được cửa hàng khi đặt lịch, và booking gắn đúng cửa hàng đó (`DEC-11`) |
| AC-13 | Admin chuyển một booking từ cửa hàng A sang cửa hàng B; booking giữ nguyên trạng thái và lịch sử, khách nhận thông báo kèm địa chỉ cửa hàng mới (`DEC-12`) |
| AC-14 | Nhân viên tra được tồn kho một phụ tùng ở tất cả cửa hàng và biết nơi nào còn hàng (`FR-SHP-13`) |
| AC-15 | Nhân viên tạo yêu cầu điều phối phụ tùng từ cửa hàng khác; khi hoàn tất, tồn kho hai cửa hàng thay đổi đúng (`FR-SHP-17`) |
| AC-15a | Cửa hàng nguồn **từ chối** yêu cầu kèm lý do; cửa hàng gửi nhận được thông báo và gửi lại được sang cửa hàng khác (`DEC-15`) |
| AC-15b | Cửa hàng nguồn **đồng ý và đặt ngày bàn giao**; ngày này hiển thị trên booking đang chờ phụ tùng (`FR-SHP-25`) |
| AC-15c | Tồn kho **không đổi** khi yêu cầu mới ở trạng thái *Đã đồng ý* / *Đang chuyển*, chỉ đổi khi chuyển sang *Đã nhận* (`BR-34`) |
| AC-17 | Cùng một dịch vụ có **giá như nhau ở mọi cửa hàng**, và chuyển booking sang cửa hàng khác không làm đổi giá (`DEC-14`, `BR-32`) |
| AC-18 | Khi mọi cửa hàng đều hết phụ tùng, booking **vẫn ở *Chờ xác nhận***, nhân viên ghi được ghi chú nội bộ và đánh cờ *Chờ phụ tùng* (`DEC-16`) |
| AC-19 | Booking mang cờ *Chờ phụ tùng* **không nhận SMS nhắc** từ tiến trình 16:00 (`BR-36`) |
| AC-20 | Ghi chú nội bộ **không hiển thị** trên trang tra cứu bằng link của khách (`FR-BKG-26`) |
| AC-21 | Ngày bàn giao cửa hàng nguồn nhập vào được hiểu và hiển thị là **ngày gửi đi** (`DEC-17`, `BR-37`) |
| AC-22 | Nhân viên cập nhật booking chờ phụ tùng sang **ngày hẹn mới**; khách nhận được thông báo và trang tra cứu hiển thị ngày mới, không còn ngày cũ (`DEC-18`) |
| AC-23 | Booking có ngày hẹn đã qua mà vẫn ở *Chờ xác nhận* hiện **cảnh báo trong CMS** để nhân viên xử lý (`FR-BKG-32`) |
| AC-24 | Mỗi cửa hàng cấu hình được **giờ làm việc, ngày nghỉ và số booking tối đa mỗi khung giờ riêng**; khách chỉ chọn được khung giờ còn chỗ của cửa hàng đó (`DEC-19`) |
| AC-25 | Khách **không đặt được** vào ngày nghỉ hoặc khung giờ đã đầy của cửa hàng đã chọn (`FR-BKG-35`) |
| AC-26 | Nhân viên cửa hàng A đăng nhập **không thấy booking, khách hàng và thông báo của cửa hàng B** (`DEC-20`) |
| AC-27 | Nhân viên cửa hàng A **vẫn tra được số lượng tồn kho** và **tình trạng còn chỗ** của cửa hàng B, nhưng không thấy booking hay khách hàng của B (`BR-43`) |
| AC-28 | Booking ở *Chờ xác nhận* **chưa có mã QR**; sau khi cửa hàng xác nhận, mã QR được sinh và gửi cho khách (`DEC-21`) |
| AC-29 | Khách đến khi chưa có QR → nhân viên **tra cứu thủ công theo số điện thoại**, xác nhận booking rồi tiếp tục (`FR-QRC-11`) |
| AC-30 | Tình trạng chờ phụ tùng bật/tắt được bằng **cờ**, và bộ lọc cùng cơ chế loại khỏi rà soát 16:00 đều chạy theo cờ này (`DEC-22`) |
| AC-31 | Nhân viên xem được **số liệu tải theo khung giờ** và tự quyết định có gợi ý khách chuyển cửa hàng hay không; hệ thống **không tự kết luận quá tải** (`DEC-23`) |
| AC-32 | Tài khoản **Admin** đăng nhập xem được dữ liệu và báo cáo của **mọi cửa hàng** (`DEC-24`) |
| AC-33 | Tài khoản **Staff** đăng nhập chỉ thấy dữ liệu cửa hàng mình, **không sửa được bảng giá và cấu hình cửa hàng** (`BR-47`, `BR-48`) |
| AC-16 | Báo cáo tách được số liệu theo từng cửa hàng (`FR-RPT-07`) |
| AC-03 | Reminder được gửi tự động đúng 12 tiếng trước giờ hẹn |
| AC-04 | Nhân viên quét QR và xem được đầy đủ thông tin tiếp nhận xe |
| AC-04a | Quét QR một booking đang ở **Xác nhận** → hệ thống tự chuyển sang **Đang tiến hành** và hiển thị xác nhận (`DEC-07`) |
| AC-04b | Quét lại cùng mã QR đó lần thứ hai → không phát sinh thêm lần chuyển trạng thái nào (`FR-QRC-08`) |
| AC-04c | Quét QR một booking đã **Hoàn thành** hoặc **Đã hủy** → chỉ hiển thị thông tin kèm cảnh báo, không đổi trạng thái (`FR-QRC-07`) |
| AC-05 | Khách hàng hủy và đổi lịch thành công, không phát sinh phí |
| AC-06 | Booking bảo dưỡng tạo được lịch lặp lại |
| AC-07 | Chatbox nhận được cả 3 dạng đầu vào: text, hình ảnh, voice |
| AC-08 | Admin upload ảnh phụ tùng và nhận được thông tin do AI sinh ra |
| AC-09 | **Admin và Staff** cập nhật được trạng thái thanh toán và xuất được hóa đơn PDF có thông tin công ty (`DEC-28`) |
| AC-10 | Admin xem thống kê theo ngày/tháng/loại xe và export ra Excel, PDF. Tài khoản **Staff mở màn hình báo cáo thì bị từ chối** (`DEC-28`) |
| AC-11 | Toàn bộ màn hình hiển thị đúng trên PC và smartphone |
| AC-34 | **Toàn bộ luồng của khách hoàn tất được trên smartphone** — xem dịch vụ, đặt lịch, nhận và mở mã QR, tra cứu, hủy và đổi lịch — không cần dùng tới PC ở bất kỳ bước nào (`DEC-27`, `NFR-PLT-08`) |
| AC-35 | Trên màn hình SP rộng **375 px**, không màn hình nào của site khách hàng bị **cuộn ngang**, và các nút thao tác chính đều bấm được bằng một tay (`NFR-UX-05`, `NFR-UX-06`) |

---

## 14. Lịch sử phiên bản

| Phiên bản | Ngày | Người lập | Nội dung |
| --- | --- | --- | --- |
| 1.0 | 2026-08-24 | Đội phát triển | Bản đầu tiên, tổng hợp từ *Thu thập yêu cầu ban đầu.docx* và *Proposal.pptx* |
| 1.1 | 2026-08-24 | Đội phát triển | Chốt `DEC-01` (Guest đặt lịch chỉ cần Tên + SĐT). Cập nhật mục 4, FR-AUT, FR-VEH, FR-BKG, FR-QRC, FR-NTF, BR-11…13, NFR-SEC-07/08, mô hình dữ liệu. Bổ sung `OQ-13`, `OQ-14`, `OQ-15` |
| 1.2 | 2026-08-24 | Đội phát triển | Chốt `DEC-02` (link token gửi qua SMS, không hết hạn, chặn hủy theo trạng thái) và `DEC-03` (5 trạng thái booking). Bổ sung mục 7.1 Vòng đời trạng thái, FR-BKG-05a/13a/16/17/18, BR-14…16, NFR-SEC-09/10, thực thể `BookingStatusLog`. Đóng `OQ-13`; bổ sung `OQ-16`…`OQ-19` |
| 1.3 | 2026-08-24 | Đội phát triển | Chốt `DEC-04` (chuyển trạng thái thủ công) và `DEC-05` (quyền hủy theo vai trò). Cập nhật mục 4.2, 6.1, FR-BKG-16/17, FR-QRC-05; bổ sung FR-BKG-19…22, FR-NTF-07, BR-17…19. Đóng `OQ-17`, `OQ-18`; bổ sung `OQ-20`, `OQ-21` |
| 1.4 | 2026-08-24 | Đội phát triển | Bổ sung `DEC-06` — thông báo trong CMS cho Admin/Staff khi khách tạo mới hoặc hủy booking. Tách mục 6.C.2 thành 5.8.1 (thông báo cho khách) và 5.8.2 (thông báo CMS), bổ sung FR-NTF-08…17, BR-20, BR-21, thực thể `StaffNotification`. Hạ mức `OQ-20`; bổ sung `OQ-22`…`OQ-24` |
| 1.5 | 2026-08-24 | Đội phát triển | Bổ sung `DEC-07` **sửa đổi `DEC-04`** — quét QR tự động chuyển *Xác nhận* → *Đang tiến hành*. Cập nhật mục 7.1, FR-QRC-05, BR-17; bổ sung FR-QRC-06…09, BR-22, AC-04a…c. Bổ sung `OQ-25` |
| 1.6 | 2026-08-24 | Đội phát triển | Chốt `DEC-08` — thông báo booking quá hạn khi khách không đến, nhân viên liên hệ rồi hủy thủ công; giữ nguyên 5 trạng thái. Bổ sung FR-NTF-18…20, FR-BKG-23…25, FR-RPT-06, BR-23, BR-24, thực thể `CancelReason`; cập nhật FR-BKG-20. Đóng `OQ-19`, thu hẹp `OQ-21`; bổ sung `OQ-26`…`OQ-28` |
| 1.7 | 2026-08-24 | Đội phát triển | Chốt `DEC-09` (rà soát quá hạn lúc 16:00 UTC+9, xét booking ngày hôm trước) và `DEC-10` (tự gửi SMS nhắc đặt lại lịch). Cập nhật FR-NTF-18; bổ sung FR-NTF-21…26, BR-25, BR-26, AC-02n…p. Đóng `OQ-26`, `OQ-27`; bổ sung `OQ-29`, `OQ-30` |
| 1.8 | 2026-08-24 | Đội phát triển | **Đính chính `DEC-09`** (rà soát 16:00 xét booking của chính ngày hôm đó, không phải ngày hôm trước). Chốt `DEC-11` (nhiều cửa hàng), `DEC-12` (chuyển booking giữa cửa hàng), `DEC-13` (tồn kho theo cửa hàng + điều phối phụ tùng). Bổ sung mục 6.B.7 FR-SHP-01…20, FR-RPT-07, BR-27…31, AC-12…16, 5 thực thể mới; cập nhật mục 3.1, 3.2, 4.2, AS-01. Đóng `OQ-03`, `OQ-09`; bổ sung `OQ-31`…`OQ-36` |
| 1.9 | 2026-08-24 | Đội phát triển | Chốt `DEC-14` (chung bảng giá toàn chuỗi) và `DEC-15` (cửa hàng nguồn được từ chối điều phối, ấn định ngày bàn giao). Bổ sung mục 7.2 Vòng đời yêu cầu điều phối, FR-SRV-06/07, FR-SHP-21…26, BR-32…34, AC-15a…c, AC-17; cập nhật FR-SHP-15, thực thể `PartTransfer`. Đóng `OQ-32`, `OQ-33`; bổ sung `OQ-37`…`OQ-39` |
| 1.10 | 2026-08-24 | Đội phát triển | Chốt `DEC-16` (hết phụ tùng thì booking giữ *Chờ xác nhận*, ghi chú nội bộ) và `DEC-17` (ngày bàn giao = ngày gửi đi). Bổ sung FR-BKG-26…30, FR-SHP-27, BR-35…37, AC-18…21; cập nhật FR-SHP-22/25/26, mục 7.2, thực thể `Booking`. Đóng `OQ-37`, `OQ-38`; bổ sung `OQ-40`…`OQ-42` |
| 1.11 | 2026-08-24 | Đội phát triển | Chốt `DEC-18` — booking chờ phụ tùng chuyển sang ngày hẹn mới, không giữ ngày cũ. Bổ sung FR-BKG-31…34, BR-38, BR-39, AC-22, AC-23. Đóng `OQ-42` |
| 1.12 | 2026-08-24 | Đội phát triển | Chốt `DEC-19` (cấu hình giờ làm việc và năng lực theo từng cửa hàng), `DEC-20` (cô lập dữ liệu giữa các cửa hàng), `DEC-21` (mã QR sinh khi booking được xác nhận — **khác `RQ §7`**), `DEC-22` (dùng cờ thay ghi chú tự do). Bổ sung FR-SHP-28…40, FR-QRC-10…12, FR-BKG-35, BR-40…45, AC-24…30, thực thể `ShopSchedule` / `ShopCapacity`; cập nhật FR-BKG-12/26/27, FR-QRC-01/02/07. Đóng `OQ-02`, `OQ-22`, `OQ-25`, `OQ-40`; bổ sung `OQ-43`…`OQ-46` |
| 1.13 | 2026-08-24 | Đội phát triển | Chốt `DEC-23` (nhân viên tự đánh giá quá tải) và `DEC-24` (Admin nhìn toàn chuỗi, Staff chỉ cửa hàng mình). **Tách ma trận phân quyền mục 4.2 thành 4 cột** Guest/User/Staff/Admin; cập nhật mục 4.1, FR-SHP-32/34/39; bổ sung FR-SHP-41, FR-SHP-42, BR-46…48, AC-31…33. Đóng `OQ-43`, thu hẹp `OQ-05`, hạ mức `OQ-45` |
| 1.14 | 2026-08-24 | Đội phát triển | Chốt `DEC-25` — dịch vụ không gắn thời lượng, năng lực tính thuần theo số booking mỗi khung giờ. Cập nhật `BR-41`. Đóng `OQ-45` |
| 1.15 | 2026-08-24 | Đội phát triển | Chốt `DEC-26` — hệ thống gồm **hai site tách biệt**. Bổ sung chương 5 *Kiến trúc hai site*; **tái cấu trúc chương yêu cầu chức năng thành 6.A (site khách hàng, 45 yêu cầu), 6.B (site quản trị, 111), 6.C (dùng chung, 19)** — giữ nguyên toàn bộ mã yêu cầu. Đánh số lại các chương 6–13 thành 7–14 và cập nhật tham chiếu chéo. Gộp mục 12.1 thành một bảng quyết định duy nhất, tách phần hệ quả sang 12.1.1. Bổ sung NFR-PLT-04…06, `OQ-47` |
| 1.16 | 2026-08-25 | Đội phát triển | Chốt `DEC-27` — site khách hàng **ưu tiên SP (mobile-first)**, giao diện đơn giản, tiện lợi, dễ thao tác. Cập nhật mục 3.2, mục 5.1 (dòng *Thiết bị*), NFR-PLT-02; bổ sung ghi chú mobile-first tại mục 5.1, NFR-PLT-07, NFR-PLT-08, NFR-UX-05…08, AC-34, AC-35, `OQ-48`, `OQ-49` |
| 1.17 | 2026-08-25 | Đội phát triển | Chốt `DEC-28` — **tách hai quyền đang bị gộp nhầm**: *báo cáo* thuộc quyền **Admin duy nhất**, còn *cập nhật trạng thái thanh toán* thuộc **cả Admin và Staff**. **Sửa ma trận phân quyền mục 4.2** (dòng *Xem báo cáo cửa hàng mình*: Staff ⬤ → —) và **sửa `BR-07`** (từ *chỉ Admin* thành *Admin và Staff*). Cập nhật FR-PAY-02, FR-RPT-01, BR-08, mục 7.1, AC-09, AC-10; bổ sung ghi chú *Báo cáo và thanh toán* tại mục 4.2. Thu hẹp `OQ-05` xuống còn mỗi câu hỏi về quyền xóa, hạ mức xuống **Thấp**. **Sắp lại thứ tự** hai dòng 1.15 và 1.16 vốn bị đảo |

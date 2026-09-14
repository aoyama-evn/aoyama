# 01 — Định nghĩa yêu cầu dự án

| | |
| --- | --- |
| **Mã tài liệu** | `RD-2026-001` |
| **Dự án** | Hệ thống quản lý dịch vụ bảo dưỡng & sửa chữa xe máy AOYAMA |
| **Phiên bản** | 1.0 |
| **Ngày** | 2026-09-14 |
| **Trạng thái** | Bản thảo — chờ khách hàng xác nhận |
| **Tài liệu liên quan** | [`OV-2026-001`](00-Tong-quan-du-an.md) · [`SM-2026-001`](02-Danh-sach-so-do-man-hinh.md) · [`SS-2026-001`](03-Dac-ta-chi-tiet-man-hinh.md) |

---

## Mục lục

1. [Giới thiệu](#1-giới-thiệu)
2. [Vai trò người dùng](#2-vai-trò-người-dùng)
3. [Yêu cầu chức năng](#3-yêu-cầu-chức-năng)
4. [Quy tắc nghiệp vụ](#4-quy-tắc-nghiệp-vụ)
5. [Máy trạng thái](#5-máy-trạng-thái)
6. [Mô hình dữ liệu khái niệm](#6-mô-hình-dữ-liệu-khái-niệm)
7. [Yêu cầu phi chức năng](#7-yêu-cầu-phi-chức-năng)
8. [Ma trận phân quyền](#8-ma-trận-phân-quyền)
9. [Các quyết định đã chốt](#9-các-quyết-định-đã-chốt)
10. [Các điểm cần làm rõ](#10-các-điểm-cần-làm-rõ)
11. [Tiêu chí nghiệm thu](#11-tiêu-chí-nghiệm-thu)

---

## 1. Giới thiệu

### 1.1 Mục đích

Tài liệu này định nghĩa đầy đủ yêu cầu của hệ thống, làm căn cứ cho thiết kế màn hình, thiết kế cơ sở dữ liệu, phát triển và kiểm thử. Mọi mã tham chiếu (`FR`, `NFR`, `BR`, `DEC`, `OQ`, `AC`) được định nghĩa **một lần duy nhất** tại đây.

### 1.2 Đối tượng đọc

Khách hàng (Mobility Enshu Railway, AOYAMA), quản lý dự án, kiến trúc sư, lập trình viên, kiểm thử viên.

### 1.3 Quy ước mã

| Tiền tố | Ý nghĩa |
| --- | --- |
| `FR-<module>-nn` | Yêu cầu chức năng |
| `NFR-<nhóm>-nn` | Yêu cầu phi chức năng |
| `BR-nn` | Quy tắc nghiệp vụ |
| `DEC-nn` | Quyết định đã chốt với khách hàng |
| `OQ-nn` | Điểm cần làm rõ (open question) |
| `AC-nn` | Tiêu chí nghiệm thu |

### 1.4 Mức ưu tiên

| Ký hiệu | Ý nghĩa |
| --- | --- |
| **BB** | Bắt buộc — nằm trong MVP, thiếu là không nghiệm thu được |
| **NC** | Nên có — Giai đoạn 2 |
| **CT** | Có thể — Giai đoạn 3, làm nếu còn thời gian |

### 1.5 Tổng hợp số lượng

| Loại | Số lượng |
| --- | --- |
| Yêu cầu chức năng (`FR`) | 209 |
| Yêu cầu phi chức năng (`NFR`) | 46 |
| Quy tắc nghiệp vụ (`BR`) | 52 |
| Quyết định đã chốt (`DEC`) | 24 |
| Điểm cần làm rõ (`OQ`) | 20 |
| Tiêu chí nghiệm thu (`AC`) | 30 |

---

## 2. Vai trò người dùng

| Mã | Vai trò | Cách nhận diện | Phạm vi dữ liệu |
| --- | --- | --- | --- |
| `R-GUEST` | Khách vãng lai | Không đăng nhập | Chỉ dữ liệu công khai; tra cứu lịch hẹn của chính mình qua mã tra cứu + số điện thoại |
| `R-USER` | Khách hàng | Đăng nhập bằng số điện thoại | Hồ sơ, xe, lịch hẹn, phiếu dịch vụ, báo giá của chính mình |
| `R-ADMIN` | Admin / Staff | Đăng nhập tài khoản quản trị | Toàn bộ dữ liệu nghiệp vụ |

`DEC-01` — Hệ thống chỉ có **ba vai trò**. Việc tách vai trò Kỹ thuật viên / Quản lý cửa hàng là `OQ-01`, `OQ-02`.

---

## 3. Yêu cầu chức năng

### 3.1 `M-01` — Xác thực & tài khoản

| Mã | Yêu cầu | Vai trò | Ưu tiên |
| --- | --- | --- | --- |
| `FR-AUTH-01` | Khách hàng đăng ký tài khoản bằng **số điện thoại** làm định danh chính; họ tên là trường bắt buộc | `R-GUEST` | BB |
| `FR-AUTH-02` | Khách hàng đăng nhập bằng **số điện thoại**; không dùng email hay tên đăng nhập làm phương thức chính | `R-USER` | BB |
| `FR-AUTH-03` | Hệ thống hỗ trợ xác thực số điện thoại bằng **mã OTP gửi qua SMS** khi đăng ký và khi đăng nhập | `R-USER` | BB |
| `FR-AUTH-04` | Mã OTP có hiệu lực 5 phút, tối đa 5 lần nhập sai, cho phép gửi lại sau 60 giây | — | BB |
| `FR-AUTH-05` | Số điện thoại được chuẩn hóa về định dạng E.164 trước khi lưu và so khớp | — | BB |
| `FR-AUTH-06` | Người dùng xem và sửa hồ sơ cá nhân: họ tên, số điện thoại, email, địa chỉ, ngôn ngữ ưa dùng | `R-USER` | BB |
| `FR-AUTH-07` | Đổi số điện thoại phải xác thực OTP trên số mới trước khi có hiệu lực | `R-USER` | BB |
| `FR-AUTH-08` | Người dùng đăng xuất; phiên làm việc hết hạn sau thời gian không hoạt động cấu hình được | `R-USER` `R-ADMIN` | BB |
| `FR-AUTH-09` | Admin đăng nhập trang quản trị bằng tài khoản riêng (tên đăng nhập / email + mật khẩu) | `R-ADMIN` | BB |
| `FR-AUTH-10` | Admin đổi mật khẩu; mật khẩu tối thiểu 8 ký tự, có chữ và số | `R-ADMIN` | BB |
| `FR-AUTH-11` | Khóa tạm thời tài khoản quản trị sau 5 lần đăng nhập sai liên tiếp trong 15 phút | — | BB |
| `FR-AUTH-12` | Người dùng yêu cầu xóa tài khoản; hệ thống ẩn danh dữ liệu cá nhân nhưng giữ lại lịch sử dịch vụ phục vụ thống kê | `R-USER` | NC |

### 3.2 `M-02` — Nội dung công khai

| Mã | Yêu cầu | Vai trò | Ưu tiên |
| --- | --- | --- | --- |
| `FR-PUB-01` | Trang chủ giới thiệu chuỗi cửa hàng, dịch vụ nổi bật và nút **Đặt lịch** đặt ở vị trí dễ thấy nhất | `R-GUEST` | BB |
| `FR-PUB-02` | Trang danh sách dịch vụ phân theo hai nhóm **Bảo dưỡng** và **Sửa chữa** | `R-GUEST` | BB |
| `FR-PUB-03` | Trang chi tiết dịch vụ: mô tả, hạng mục công việc, thời gian ước tính, giá tham khảo | `R-GUEST` | BB |
| `FR-PUB-04` | Trang bảng giá tham khảo, lọc được theo loại xe và loại nhiên liệu | `R-GUEST` | BB |
| `FR-PUB-05` | Trang danh sách cửa hàng: tên, địa chỉ, điện thoại, giờ mở cửa, bản đồ | `R-GUEST` | BB |
| `FR-PUB-06` | Trang câu hỏi thường gặp | `R-GUEST` | NC |
| `FR-PUB-07` | Trang liên hệ và biểu mẫu gửi câu hỏi | `R-GUEST` | NC |
| `FR-PUB-08` | Trang điều khoản sử dụng và chính sách bảo vệ dữ liệu cá nhân | `R-GUEST` | BB |

### 3.3 `M-03` — Chatbox AI chẩn đoán

| Mã | Yêu cầu | Vai trò | Ưu tiên |
| --- | --- | --- | --- |
| `FR-AI-01` | Chatbox hiển thị trên site khách hàng, mở được ở mọi trang mà không rời trang hiện tại | `R-GUEST` `R-USER` | NC |
| `FR-AI-02` | Bước đầu chatbox đưa **tùy chọn nhanh**: *Bảo dưỡng* hoặc *Sửa chữa* | `R-GUEST` | NC |
| `FR-AI-03` | Khách mô tả lỗi bằng **văn bản** tự do | `R-GUEST` | NC |
| `FR-AI-04` | Khách **tải lên ảnh** xe hoặc bộ phận nghi hỏng (tối đa 5 ảnh, mỗi ảnh ≤ 10 MB, định dạng JPG/PNG/HEIC) | `R-GUEST` | NC |
| `FR-AI-05` | Khách **ghi âm giọng nói** mô tả lỗi (tối đa 120 giây); hệ thống chuyển thành văn bản trước khi phân tích | `R-GUEST` | NC |
| `FR-AI-06` | AI trả về **danh sách lỗi nghi ngờ**, mỗi lỗi kèm **mức độ khớp tính theo %** và mô tả ngắn | — | NC |
| `FR-AI-07` | Kết quả chẩn đoán sắp xếp giảm dần theo % và hiển thị tối đa 5 mục | — | NC |
| `FR-AI-08` | Mỗi lỗi nghi ngờ được ánh xạ sang một hoặc nhiều **dịch vụ đề xuất** kèm giá tham khảo | — | NC |
| `FR-AI-09` | Từ kết quả chẩn đoán, khách chuyển thẳng sang màn đặt lịch với dịch vụ và mô tả lỗi đã điền sẵn | `R-GUEST` | NC |
| `FR-AI-10` | Mọi kết quả AI hiển thị nhãn **"Gợi ý bởi AI — cần kỹ thuật viên kiểm tra thực tế"** | — | NC |
| `FR-AI-11` | Khi dịch vụ AI lỗi hoặc quá thời gian chờ, chatbox thông báo và chuyển khách sang luồng đặt lịch thủ công | — | NC |
| `FR-AI-12` | Toàn bộ nội dung hội thoại, ảnh và ghi âm được đính vào lịch hẹn tạo ra từ phiên đó, để Admin xem lại | `R-ADMIN` | NC |
| `FR-AI-13` | Khách xem lại lịch sử các phiên chẩn đoán của mình (chỉ với `R-USER`) | `R-USER` | CT |
| `FR-AI-14` | Admin xem thống kê độ chính xác chẩn đoán: so sánh lỗi AI dự đoán với lỗi thực tế ghi trong phiếu dịch vụ | `R-ADMIN` | CT |

### 3.4 `M-04` — Đặt lịch

| Mã | Yêu cầu | Vai trò | Ưu tiên |
| --- | --- | --- | --- |
| `FR-BOOK-01` | Đặt lịch **không bắt buộc đăng nhập**; chỉ cần **họ tên + số điện thoại** | `R-GUEST` | BB |
| `FR-BOOK-02` | Một lần đặt có thể chọn **chỉ bảo dưỡng**, **chỉ sửa chữa**, hoặc **cả hai** | `R-GUEST` `R-USER` | BB |
| `FR-BOOK-03` | Khách chọn cửa hàng từ danh sách cửa hàng đang hoạt động | — | BB |
| `FR-BOOK-04` | Khách chọn ngày và khung giờ; lịch chỉ hiện khung giờ còn chỗ | — | BB |
| `FR-BOOK-05` | **Không giới hạn thời gian đặt trước** — khách đặt được bao xa trong tương lai tùy ý | — | BB |
| `FR-BOOK-06` | Khách nhập thông tin xe: loại xe, hãng, dòng, biển số, số km hiện tại (biển số và số km không bắt buộc) | — | BB |
| `FR-BOOK-07` | Khách nhập mô tả tình trạng xe / yêu cầu; trường này được điền sẵn nếu đến từ chatbox AI | — | BB |
| `FR-BOOK-08` | `R-USER` đã đăng nhập được chọn nhanh xe đã lưu trong hồ sơ thay vì nhập lại | `R-USER` | BB |
| `FR-BOOK-09` | Màn xác nhận hiển thị lại toàn bộ thông tin trước khi gửi | — | BB |
| `FR-BOOK-10` | Sau khi đặt thành công, hệ thống sinh **mã lịch hẹn** và hiển thị trên màn hình hoàn tất | — | BB |
| `FR-BOOK-11` | Sau khi đặt thành công, hệ thống **gửi SMS xác nhận** tới số điện thoại đã nhập | — | BB |
| `FR-BOOK-12` | Hệ thống **gửi SMS nhắc trước 12 tiếng** (nửa ngày) so với giờ hẹn | — | BB |
| `FR-BOOK-13` | Khách **hủy lịch hẹn** — **không giới hạn thời gian hủy, không tính phí phạt** | `R-GUEST` `R-USER` | BB |
| `FR-BOOK-14` | Khách **đổi lịch** sang ngày/giờ khác — **không giới hạn thời gian đổi, không tính phí phạt** | `R-GUEST` `R-USER` | BB |
| `FR-BOOK-15` | `R-GUEST` tra cứu, hủy và đổi lịch hẹn bằng **mã lịch hẹn + số điện thoại** | `R-GUEST` | BB |
| `FR-BOOK-16` | `R-USER` xem danh sách lịch hẹn của mình, tách **Sắp tới** và **Đã qua** | `R-USER` | BB |
| `FR-BOOK-17` | Với lịch hẹn loại **Bảo dưỡng**, hệ thống cho phép **"Đặt lại lịch"** — tạo lịch hẹn mới theo chu kỳ lặp lại | `R-USER` | NC |
| `FR-BOOK-18` | Khi đặt lại lịch, hệ thống đề xuất sẵn thời điểm dựa trên chu kỳ bảo dưỡng của xe (`AI-05`) | `R-USER` | NC |
| `FR-BOOK-19` | **Admin đặt lịch thay cho khách hàng** — nhập tên, số điện thoại, dịch vụ, thời gian | `R-ADMIN` | BB |
| `FR-BOOK-20` | Admin xem **toàn bộ lịch hẹn** với bộ lọc: cửa hàng, ngày, trạng thái, loại dịch vụ, từ khóa | `R-ADMIN` | BB |
| `FR-BOOK-21` | Admin xem lịch hẹn dưới dạng **lịch theo ngày / theo tuần** | `R-ADMIN` | BB |
| `FR-BOOK-22` | Admin **xác nhận** lịch hẹn; hệ thống sinh mã QR và gửi cho khách | `R-ADMIN` | BB |
| `FR-BOOK-23` | Admin **hủy** lịch hẹn kèm lý do; hệ thống thông báo cho khách | `R-ADMIN` | BB |
| `FR-BOOK-24` | Admin **đổi lịch** thay khách kèm lý do; hệ thống thông báo cho khách | `R-ADMIN` | BB |
| `FR-BOOK-25` | Admin đánh dấu lịch hẹn **Khách không đến** | `R-ADMIN` | BB |
| `FR-BOOK-26` | Admin ghi chú nội bộ lên lịch hẹn, khách không nhìn thấy | `R-ADMIN` | BB |

### 3.5 `M-05` — Mã QR & tiếp nhận xe

| Mã | Yêu cầu | Vai trò | Ưu tiên |
| --- | --- | --- | --- |
| `FR-QR-01` | Khi Admin xác nhận lịch hẹn, hệ thống **sinh mã QR** gắn với lịch hẹn đó | — | BB |
| `FR-QR-02` | Mã QR hiển thị **trên web** trong màn chi tiết lịch hẹn của khách | `R-GUEST` `R-USER` | BB |
| `FR-QR-03` | Mã QR được gửi kèm **trong SMS** dưới dạng đường dẫn mở trang hiển thị mã | — | BB |
| `FR-QR-04` | Mã QR mã hóa định danh không đoán được; không lộ thông tin cá nhân trong bản thân mã | — | BB |
| `FR-QR-05` | Lễ tân **quét mã QR** trên trang quản trị bằng camera thiết bị | `R-ADMIN` | BB |
| `FR-QR-06` | Sau khi quét, màn hình hiển thị ngay: tên khách, số điện thoại, xe, dịch vụ đã đặt, **mô tả lỗi**, **kết quả chẩn đoán AI**, lịch sử dịch vụ gần nhất | `R-ADMIN` | BB |
| `FR-QR-07` | Từ màn hình sau khi quét, Admin bấm một nút để **tiếp nhận xe** và mở phiếu dịch vụ | `R-ADMIN` | BB |
| `FR-QR-08` | Admin nhập tay mã lịch hẹn khi không quét được QR | `R-ADMIN` | BB |
| `FR-QR-09` | Mã QR hết hiệu lực sau khi lịch hẹn đã tiếp nhận, bị hủy, hoặc quá giờ hẹn 24 giờ | — | BB |

### 3.6 `M-06` — Phiếu dịch vụ

| Mã | Yêu cầu | Vai trò | Ưu tiên |
| --- | --- | --- | --- |
| `FR-WO-01` | Phiếu dịch vụ được mở từ lịch hẹn khi tiếp nhận xe, hoặc tạo mới trực tiếp cho khách vãng lai không đặt trước | `R-ADMIN` | BB |
| `FR-WO-02` | Phiếu dịch vụ mang mã riêng, liên kết tới khách hàng, phương tiện, cửa hàng và lịch hẹn nguồn | — | BB |
| `FR-WO-03` | Ghi nhận tình trạng xe khi tiếp nhận: số km, mức nhiên liệu, ảnh hiện trạng, phụ kiện đi kèm | `R-ADMIN` | BB |
| `FR-WO-04` | Ghi nhận kết quả chẩn đoán của kỹ thuật viên: triệu chứng, nguyên nhân, hạng mục đề xuất | `R-ADMIN` | BB |
| `FR-WO-05` | Thêm **hạng mục công việc** vào phiếu: chọn từ danh mục dịch vụ hoặc nhập tự do, kèm đơn giá và thời gian ước tính | `R-ADMIN` | BB |
| `FR-WO-06` | Thêm **phụ tùng** vào phiếu: chọn từ danh mục, nhập số lượng; hệ thống tự tính thành tiền | `R-ADMIN` | BB |
| `FR-WO-07` | Phiếu dịch vụ chuyển trạng thái theo máy trạng thái tại §5.2 | `R-ADMIN` | BB |
| `FR-WO-08` | Mỗi lần chuyển trạng thái được ghi lại kèm người thực hiện và thời điểm | — | BB |
| `FR-WO-09` | Khách hàng **theo dõi tiến độ** phiếu dịch vụ của mình theo các mốc trạng thái | `R-GUEST` `R-USER` | NC |
| `FR-WO-10` | Hệ thống gửi thông báo cho khách khi phiếu chuyển sang *Chờ duyệt báo giá*, *Đang thực hiện* và *Hoàn tất* | — | NC |
| `FR-WO-11` | Khi hoàn tất, hệ thống tính tổng tiền = tiền công + tiền phụ tùng, hiển thị rõ từng phần | — | BB |
| `FR-WO-12` | Khi hoàn tất, phiếu dịch vụ được ghi vào **lịch sử bảo dưỡng/sửa chữa** của phương tiện | — | BB |
| `FR-WO-13` | Khi hoàn tất phiếu bảo dưỡng, hệ thống tính và lưu **thời điểm bảo dưỡng tiếp theo** đề xuất | — | NC |
| `FR-WO-14` | Phiếu dịch vụ in được ra PDF để giao cho khách | `R-ADMIN` | BB |
| `FR-WO-15` | Admin hủy phiếu dịch vụ kèm lý do; phụ tùng đã trừ kho được hoàn lại | `R-ADMIN` | BB |
| `FR-WO-16` | Phiếu dịch vụ đã hoàn tất **không sửa được**; chỉ tạo bản điều chỉnh có ghi lý do | — | BB |

### 3.7 `M-07` — Báo giá

| Mã | Yêu cầu | Vai trò | Ưu tiên |
| --- | --- | --- | --- |
| `FR-QUO-01` | Admin lập báo giá từ phiếu dịch vụ; báo giá kế thừa hạng mục công việc và phụ tùng đã nhập | `R-ADMIN` | NC |
| `FR-QUO-02` | **AI gợi ý hạng mục kiểm tra, phụ tùng cần thay và chi phí tham khảo** dựa trên thông tin xe và triệu chứng | `R-ADMIN` | NC |
| `FR-QUO-03` | Gợi ý AI hiển thị ở khu vực riêng có nhãn rõ ràng; Admin chọn từng mục để thêm vào báo giá, **không** tự động thêm | `R-ADMIN` | NC |
| `FR-QUO-04` | Admin sửa đơn giá, số lượng, thêm/xóa dòng trước khi gửi | `R-ADMIN` | NC |
| `FR-QUO-05` | Báo giá có tổng tiền công, tổng tiền phụ tùng, thuế và tổng cộng | — | NC |
| `FR-QUO-06` | Admin **gửi báo giá** cho khách; hệ thống thông báo qua SMS kèm đường dẫn xem | `R-ADMIN` | NC |
| `FR-QUO-07` | Khách xem báo giá chi tiết trên web mà không cần đăng nhập (qua đường dẫn có mã bảo mật) | `R-GUEST` `R-USER` | NC |
| `FR-QUO-08` | Khách **đồng ý** hoặc **từ chối** báo giá; có thể ghi chú lý do từ chối | `R-GUEST` `R-USER` | NC |
| `FR-QUO-09` | Khi khách đồng ý, phiếu dịch vụ tự chuyển sang trạng thái *Đang thực hiện* | — | NC |
| `FR-QUO-10` | Admin ghi nhận thay khách việc đồng ý/từ chối (trường hợp khách trả lời qua điện thoại) | `R-ADMIN` | NC |
| `FR-QUO-11` | Báo giá có thể sửa và gửi lại thành **phiên bản mới**; các phiên bản cũ được lưu lại | `R-ADMIN` | NC |
| `FR-QUO-12` | Báo giá in ra PDF | `R-ADMIN` | NC |

### 3.8 `M-08` — Phương tiện & lịch sử dịch vụ

| Mã | Yêu cầu | Vai trò | Ưu tiên |
| --- | --- | --- | --- |
| `FR-VEH-01` | `R-USER` thêm, sửa, xóa xe trong hồ sơ của mình | `R-USER` | BB |
| `FR-VEH-02` | Thông tin xe: hãng, dòng xe, loại xe, loại nhiên liệu, năm sản xuất, biển số, số khung, màu, số km | — | BB |
| `FR-VEH-03` | Biển số là duy nhất trong hệ thống; khi trùng, hệ thống cảnh báo và yêu cầu Admin xử lý | — | BB |
| `FR-VEH-04` | `R-USER` xem **lịch sử bảo dưỡng và sửa chữa** của từng xe theo thứ tự thời gian | `R-USER` | BB |
| `FR-VEH-05` | Mỗi mục lịch sử hiển thị: ngày, cửa hàng, loại dịch vụ, hạng mục đã làm, phụ tùng đã thay, số km, tổng tiền | — | BB |
| `FR-VEH-06` | `R-USER` tải phiếu dịch vụ đã hoàn tất dưới dạng PDF | `R-USER` | NC |
| `FR-VEH-07` | Hệ thống hiển thị **thời điểm bảo dưỡng tiếp theo** đề xuất cho từng xe | `R-USER` | NC |
| `FR-VEH-08` | Admin thêm, sửa, xóa phương tiện và gán phương tiện cho khách hàng | `R-ADMIN` | BB |
| `FR-VEH-09` | Admin tra cứu phương tiện theo biển số, số khung, tên khách hoặc số điện thoại | `R-ADMIN` | BB |
| `FR-VEH-10` | Admin xem toàn bộ lịch sử dịch vụ của một phương tiện trong một màn hình | `R-ADMIN` | BB |
| `FR-VEH-11` | Khi tiếp nhận, phương tiện của khách vãng lai được tự tạo hồ sơ và gắn với khách hàng tương ứng | — | BB |

### 3.9 `M-09` — Quản lý khách hàng

| Mã | Yêu cầu | Vai trò | Ưu tiên |
| --- | --- | --- | --- |
| `FR-CUS-01` | Admin xem danh sách khách hàng, lọc theo cửa hàng, trạng thái, khoảng thời gian sử dụng dịch vụ | `R-ADMIN` | BB |
| `FR-CUS-02` | Admin tìm khách hàng theo tên, số điện thoại, email, biển số xe | `R-ADMIN` | BB |
| `FR-CUS-03` | Màn chi tiết khách hàng gộp: thông tin cá nhân, danh sách xe, lịch hẹn, phiếu dịch vụ, tổng chi tiêu | `R-ADMIN` | BB |
| `FR-CUS-04` | Admin thêm và sửa thông tin khách hàng | `R-ADMIN` | BB |
| `FR-CUS-05` | Admin ghi **ghi chú nội bộ** về khách hàng | `R-ADMIN` | BB |
| `FR-CUS-06` | Hệ thống phát hiện khách hàng trùng theo số điện thoại và đề xuất **gộp hồ sơ** | `R-ADMIN` | NC |
| `FR-CUS-07` | Khi gộp hồ sơ, toàn bộ xe, lịch hẹn và phiếu dịch vụ chuyển về hồ sơ đích | — | NC |
| `FR-CUS-08` | Admin vô hiệu hóa khách hàng thay vì xóa, để giữ toàn vẹn lịch sử | `R-ADMIN` | BB |

### 3.10 `M-10` — Dịch vụ & bảng giá

| Mã | Yêu cầu | Vai trò | Ưu tiên |
| --- | --- | --- | --- |
| `FR-SVC-01` | Admin **thêm, sửa, xóa** dịch vụ | `R-ADMIN` | BB |
| `FR-SVC-02` | Dịch vụ phân loại thành **Bảo dưỡng** và **Sửa chữa** | — | BB |
| `FR-SVC-03` | Dịch vụ có: tên (3 ngôn ngữ), mô tả, nhóm, thời gian thực hiện ước tính, trạng thái hiển thị | — | BB |
| `FR-SVC-04` | **Giá dịch vụ bảo dưỡng** thiết lập được theo **loại nhiên liệu** và **phụ tùng đi kèm** | `R-ADMIN` | BB |
| `FR-SVC-05` | **Giá dịch vụ sửa chữa** thiết lập được theo **loại phụ tùng** và **mức độ khó** (dễ / trung bình / khó) | `R-ADMIN` | BB |
| `FR-SVC-06` | Giá có thể đặt theo khoảng (từ — đến) khi chưa xác định chính xác, dùng làm giá tham khảo hiển thị công khai | — | BB |
| `FR-SVC-07` | Admin gán dịch vụ cho từng cửa hàng — cửa hàng chỉ hiện những dịch vụ mình cung cấp | `R-ADMIN` | NC |
| `FR-SVC-08` | Thay đổi giá có hiệu lực từ thời điểm chỉ định; lịch hẹn và phiếu dịch vụ đã tạo giữ nguyên giá tại thời điểm tạo | — | BB |
| `FR-SVC-09` | Admin sắp xếp thứ tự hiển thị của dịch vụ trên site khách hàng | `R-ADMIN` | NC |
| `FR-SVC-10` | Dịch vụ đã được dùng trong phiếu dịch vụ không xóa được, chỉ ẩn đi | — | BB |

### 3.11 `M-11` — Phụ tùng & tồn kho

| Mã | Yêu cầu | Vai trò | Ưu tiên |
| --- | --- | --- | --- |
| `FR-PRT-01` | Admin **thêm, sửa, xóa** phụ tùng | `R-ADMIN` | BB |
| `FR-PRT-02` | Thông tin phụ tùng: mã, tên (3 ngôn ngữ), hãng sản xuất, nhóm, quy cách, đơn vị tính, giá nhập, giá bán, ảnh | — | BB |
| `FR-PRT-03` | Phụ tùng khai báo được **danh sách xe tương thích** (hãng / dòng / năm) | `R-ADMIN` | BB |
| `FR-PRT-04` | **AI hỗ trợ nhập liệu**: Admin tải lên **ảnh phụ tùng hoặc ảnh hộp vỏ phụ tùng**, AI tự sinh thông tin phụ tùng và điền sẵn vào biểu mẫu | `R-ADMIN` | NC |
| `FR-PRT-05` | Các trường do AI điền được đánh dấu rõ; **Admin phải xác nhận** trước khi lưu | `R-ADMIN` | NC |
| `FR-PRT-06` | AI đọc được mã phụ tùng in trên hộp (OCR) và tự điền vào trường mã | — | NC |
| `FR-PRT-07` | Nếu mã phụ tùng AI đọc được đã tồn tại, hệ thống cảnh báo trùng và đề xuất mở bản ghi cũ | — | NC |
| `FR-PRT-08` | Admin xem danh sách phụ tùng, tìm theo mã, tên, hãng, nhóm, xe tương thích | `R-ADMIN` | BB |
| `FR-PRT-09` | Quản lý **tồn kho theo từng cửa hàng**: số lượng hiện có, mức tồn tối thiểu | `R-ADMIN` | BB |
| `FR-PRT-10` | Khi phiếu dịch vụ hoàn tất, số lượng phụ tùng sử dụng được **trừ khỏi tồn kho** của cửa hàng đó | — | BB |
| `FR-PRT-11` | Admin nhập kho, xuất kho và điều chỉnh tồn thủ công kèm lý do | `R-ADMIN` | BB |
| `FR-PRT-12` | Hệ thống cảnh báo khi tồn kho xuống dưới mức tối thiểu | `R-ADMIN` | BB |
| `FR-PRT-13` | Mọi biến động tồn kho được ghi nhật ký: thời điểm, loại giao dịch, số lượng, người thực hiện, chứng từ liên quan | — | BB |
| `FR-PRT-14` | Admin nhập hàng loạt phụ tùng từ tệp Excel | `R-ADMIN` | CT |

### 3.12 `M-12` — Trợ lý AI kỹ thuật

| Mã | Yêu cầu | Vai trò | Ưu tiên |
| --- | --- | --- | --- |
| `FR-TEC-01` | Nhân viên đặt câu hỏi bằng **ngôn ngữ tự nhiên** về quy trình sửa chữa, mã lỗi, thông số kỹ thuật | `R-ADMIN` | CT |
| `FR-TEC-02` | Trợ lý trả lời dựa trên kho tài liệu kỹ thuật đã nạp vào hệ thống | — | CT |
| `FR-TEC-03` | Mỗi câu trả lời kèm **trích dẫn nguồn**: tên tài liệu và vị trí trang/mục | — | CT |
| `FR-TEC-04` | Khi không tìm được nguồn phù hợp, trợ lý trả lời **"không có dữ liệu"** thay vì suy đoán | — | CT |
| `FR-TEC-05` | Admin nạp, cập nhật và gỡ tài liệu kỹ thuật khỏi kho tri thức | `R-ADMIN` | CT |
| `FR-TEC-06` | Trợ lý mở được ngay trong màn phiếu dịch vụ, mang theo ngữ cảnh xe và triệu chứng đang xử lý | `R-ADMIN` | CT |
| `FR-TEC-07` | Nhân viên đánh giá câu trả lời hữu ích / không hữu ích để cải thiện chất lượng | `R-ADMIN` | CT |

### 3.13 `M-13` — Thanh toán

| Mã | Yêu cầu | Vai trò | Ưu tiên |
| --- | --- | --- | --- |
| `FR-PAY-01` | Thanh toán thực hiện **tại cửa hàng**; hệ thống chỉ ghi nhận, không xử lý giao dịch trực tuyến | — | BB |
| `FR-PAY-02` | Hình thức thanh toán ghi nhận được: **tiền mặt**, **chuyển khoản**, khác | `R-ADMIN` | BB |
| `FR-PAY-03` | **Admin cập nhật trạng thái "Đã thanh toán"** cho phiếu dịch vụ | `R-ADMIN` | BB |
| `FR-PAY-04` | Ghi nhận số tiền thực thu, thời điểm thu và người thu | — | BB |
| `FR-PAY-05` | Hỗ trợ thanh toán một phần (đặt cọc) và ghi nhận số tiền còn lại | `R-ADMIN` | NC |
| `FR-PAY-06` | Khách xem trạng thái thanh toán của phiếu dịch vụ của mình | `R-USER` | BB |
| `FR-PAY-07` | Admin xem danh sách phiếu dịch vụ **chưa thanh toán** | `R-ADMIN` | BB |
| `FR-PAY-08` | Thay đổi trạng thái thanh toán được ghi nhật ký đầy đủ | — | BB |

### 3.14 `M-14` — Thông báo

| Mã | Yêu cầu | Vai trò | Ưu tiên |
| --- | --- | --- | --- |
| `FR-NOT-01` | Gửi **SMS xác nhận** ngay sau khi khách đặt lịch thành công | — | BB |
| `FR-NOT-02` | Gửi **SMS xác nhận kèm đường dẫn mã QR** khi Admin xác nhận lịch hẹn | — | BB |
| `FR-NOT-03` | Gửi **SMS nhắc trước 12 tiếng** so với giờ hẹn | — | BB |
| `FR-NOT-04` | Gửi thông báo khi lịch hẹn bị hủy hoặc đổi lịch | — | BB |
| `FR-NOT-05` | Gửi **email và SMS nhắc bảo dưỡng định kỳ**, nội dung **có chứa đường dẫn đặt lịch bảo dưỡng** | — | BB |
| `FR-NOT-06` | Thời điểm nhắc bảo dưỡng tính theo chu kỳ của xe; nhắc trước một khoảng cấu hình được (mặc định 7 ngày) | — | BB |
| `FR-NOT-07` | Gửi thông báo khi báo giá được gửi cho khách | — | NC |
| `FR-NOT-08` | Gửi thông báo khi phiếu dịch vụ hoàn tất, xe sẵn sàng bàn giao | — | NC |
| `FR-NOT-09` | Admin quản lý **mẫu thông báo** SMS và email cho từng loại sự kiện, theo từng ngôn ngữ | `R-ADMIN` | BB |
| `FR-NOT-10` | Mẫu thông báo hỗ trợ biến thay thế: tên khách, mã lịch hẹn, thời gian, cửa hàng, đường dẫn | — | BB |
| `FR-NOT-11` | Ngôn ngữ thông báo theo ngôn ngữ ưa dùng của khách; mặc định là tiếng Nhật | — | BB |
| `FR-NOT-12` | Hệ thống lưu **nhật ký gửi thông báo**: người nhận, loại, thời điểm, kết quả gửi | `R-ADMIN` | BB |
| `FR-NOT-13` | Thông báo gửi thất bại được **thử lại tối đa 3 lần**, sau đó đánh dấu lỗi để Admin xử lý tay | — | BB |
| `FR-NOT-14` | Khách hàng tắt nhận thông báo nhắc bảo dưỡng trong hồ sơ cá nhân | `R-USER` | NC |
| `FR-NOT-15` | Không gửi SMS trong khung giờ đêm cấu hình được (mặc định 21:00 — 08:00 JST); tin nhắn được xếp hàng đợi sang sáng hôm sau | — | NC |

### 3.15 `M-15` — Báo cáo & thống kê

| Mã | Yêu cầu | Vai trò | Ưu tiên |
| --- | --- | --- | --- |
| `FR-RPT-01` | **Chỉ Admin** xem được báo cáo và thống kê | `R-ADMIN` | BB |
| `FR-RPT-02` | Thống kê **theo ngày** và **theo tháng** | `R-ADMIN` | BB |
| `FR-RPT-03` | Thống kê **theo loại xe** | `R-ADMIN` | BB |
| `FR-RPT-04` | Thống kê theo loại dịch vụ (bảo dưỡng / sửa chữa) | `R-ADMIN` | BB |
| `FR-RPT-05` | Thống kê theo cửa hàng | `R-ADMIN` | BB |
| `FR-RPT-06` | Chỉ số báo cáo: số lịch hẹn, số phiếu hoàn tất, tỷ lệ hủy, tỷ lệ khách không đến, doanh thu tiền công, doanh thu phụ tùng, tổng doanh thu | — | BB |
| `FR-RPT-07` | Báo cáo phụ tùng sử dụng nhiều nhất trong kỳ | `R-ADMIN` | NC |
| `FR-RPT-08` | Báo cáo khách hàng quay lại: số khách mới, số khách cũ, tỷ lệ quay lại | `R-ADMIN` | NC |
| `FR-RPT-09` | **Xuất báo cáo ra Excel** | `R-ADMIN` | BB |
| `FR-RPT-10` | **Xuất báo cáo ra PDF** | `R-ADMIN` | BB |
| `FR-RPT-11` | Bảng điều khiển hiển thị chỉ số nhanh trong ngày: lịch hẹn hôm nay, xe đang ở xưởng, phiếu chờ thanh toán, cảnh báo tồn kho | `R-ADMIN` | BB |
| `FR-RPT-12` | Báo cáo lọc được theo khoảng thời gian tùy chọn | `R-ADMIN` | BB |

### 3.16 `M-16` — Cửa hàng & lịch làm việc

| Mã | Yêu cầu | Vai trò | Ưu tiên |
| --- | --- | --- | --- |
| `FR-STO-01` | Admin thêm, sửa, vô hiệu hóa cửa hàng | `R-ADMIN` | BB |
| `FR-STO-02` | Thông tin cửa hàng: tên (3 ngôn ngữ), địa chỉ, điện thoại, email, tọa độ bản đồ, ảnh | — | BB |
| `FR-STO-03` | Khai báo **giờ làm việc theo từng ngày trong tuần** | `R-ADMIN` | BB |
| `FR-STO-04` | Khai báo **ngày nghỉ** cụ thể (lễ, nghỉ đột xuất) | `R-ADMIN` | BB |
| `FR-STO-05` | Khai báo **khung giờ nhận xe** và **số lượt tối đa** mỗi khung giờ | `R-ADMIN` | BB |
| `FR-STO-06` | Hệ thống chặn đặt lịch vào ngày nghỉ, ngoài giờ làm việc, hoặc khung giờ đã đầy | — | BB |
| `FR-STO-07` | Admin đặt số lượt riêng cho một ngày cụ thể, ghi đè cấu hình chung | `R-ADMIN` | NC |
| `FR-STO-08` | Admin xem mức lấp đầy khung giờ theo ngày để điều tiết | `R-ADMIN` | NC |

### 3.17 `M-17` — Người dùng quản trị & phân quyền

| Mã | Yêu cầu | Vai trò | Ưu tiên |
| --- | --- | --- | --- |
| `FR-USR-01` | Admin tạo, sửa, vô hiệu hóa tài khoản quản trị | `R-ADMIN` | BB |
| `FR-USR-02` | Thông tin tài khoản quản trị: họ tên, email, số điện thoại, cửa hàng phụ trách, trạng thái | — | BB |
| `FR-USR-03` | Admin đặt lại mật khẩu cho tài khoản quản trị khác | `R-ADMIN` | BB |
| `FR-USR-04` | Hệ thống luôn giữ **ít nhất một** tài khoản quản trị đang hoạt động | — | BB |
| `FR-USR-05` | Admin xem danh sách phiên đăng nhập đang hoạt động và buộc đăng xuất | `R-ADMIN` | CT |
| `FR-USR-06` | Cấu trúc dữ liệu phân quyền thiết kế sẵn để mở rộng thêm vai trò về sau mà không phải sửa lược đồ | — | BB |

### 3.18 `M-18` — Cấu hình & nhật ký

| Mã | Yêu cầu | Vai trò | Ưu tiên |
| --- | --- | --- | --- |
| `FR-SYS-01` | Admin cấu hình tham số hệ thống: thời gian nhắc trước, khung giờ không gửi SMS, mức tồn tối thiểu mặc định, thời hạn lưu ảnh chẩn đoán | `R-ADMIN` | NC |
| `FR-SYS-02` | Admin cấu hình thông tin doanh nghiệp hiển thị trên phiếu và báo giá | `R-ADMIN` | NC |
| `FR-SYS-03` | Hệ thống ghi **nhật ký thao tác** cho mọi hành vi thêm/sửa/xóa trên dữ liệu nghiệp vụ | — | BB |
| `FR-SYS-04` | Nhật ký ghi: thời điểm, người thực hiện, hành động, đối tượng, giá trị trước và sau | — | BB |
| `FR-SYS-05` | Admin tra cứu nhật ký theo người dùng, khoảng thời gian, loại đối tượng | `R-ADMIN` | NC |
| `FR-SYS-06` | Nhật ký **không sửa và không xóa** được qua giao diện | — | BB |
| `FR-SYS-07` | Admin xem trạng thái các tiến trình nền (gửi thông báo, sinh nhắc lịch, xuất báo cáo) | `R-ADMIN` | CT |

### 3.19 `M-19` — Đa ngôn ngữ

| Mã | Yêu cầu | Vai trò | Ưu tiên |
| --- | --- | --- | --- |
| `FR-I18N-01` | Giao diện hỗ trợ ba ngôn ngữ: **Tiếng Anh, Tiếng Việt, Tiếng Nhật** | — | BB |
| `FR-I18N-02` | Người dùng đổi ngôn ngữ ngay trên giao diện, lựa chọn được ghi nhớ | — | BB |
| `FR-I18N-03` | `R-USER` lưu ngôn ngữ ưa dùng trong hồ sơ; thông báo gửi theo ngôn ngữ đó | `R-USER` | BB |
| `FR-I18N-04` | Dữ liệu nghiệp vụ đa ngôn ngữ (tên dịch vụ, tên phụ tùng, tên cửa hàng) nhập được cho cả ba ngôn ngữ | `R-ADMIN` | BB |
| `FR-I18N-05` | Khi thiếu bản dịch, hệ thống hiển thị ngôn ngữ mặc định (tiếng Nhật) thay vì để trống | — | BB |
| `FR-I18N-06` | Ngày giờ, tiền tệ và số hiển thị theo quy ước của ngôn ngữ đang chọn; **múi giờ luôn là UTC+9** | — | BB |

---

## 4. Quy tắc nghiệp vụ

### 4.1 Đặt lịch

| Mã | Quy tắc |
| --- | --- |
| `BR-01` | Đặt lịch không bắt buộc đăng nhập; trường bắt buộc tối thiểu là **họ tên** và **số điện thoại** |
| `BR-02` | Một lịch hẹn có thể gồm **bảo dưỡng**, **sửa chữa**, hoặc **cả hai** |
| `BR-03` | **Không giới hạn** khoảng thời gian đặt trước |
| `BR-04` | **Không giới hạn** thời gian hủy và **không** tính phí phạt khi hủy |
| `BR-05` | **Không giới hạn** thời gian đổi lịch và **không** tính phí phạt khi đổi lịch |
| `BR-06` | Chỉ lịch hẹn ở trạng thái *Chờ xác nhận* hoặc *Đã xác nhận* mới hủy hoặc đổi được |
| `BR-07` | Số lượt đặt trong một khung giờ không vượt quá năng lực tiếp nhận của cửa hàng |
| `BR-08` | Không đặt được vào ngày nghỉ hoặc ngoài giờ làm việc của cửa hàng |
| `BR-09` | Không đặt được vào thời điểm trong quá khứ |
| `BR-10` | Một số điện thoại tạo tối đa 5 lịch hẹn đang hoạt động cùng lúc, nhằm hạn chế đặt ảo |
| `BR-11` | Tính năng **Đặt lại lịch** chỉ áp dụng cho lịch hẹn loại **Bảo dưỡng** |
| `BR-12` | Admin đặt lịch thay khách được bỏ qua giới hạn năng lực tiếp nhận, nhưng hệ thống phải cảnh báo |
| `BR-13` | Lịch hẹn quá giờ hẹn 24 giờ mà chưa tiếp nhận sẽ tự chuyển sang *Khách không đến* |

### 4.2 Mã QR & tiếp nhận

| Mã | Quy tắc |
| --- | --- |
| `BR-14` | Mã QR **chỉ** được sinh sau khi Admin xác nhận lịch hẹn |
| `BR-15` | Mỗi lịch hẹn có đúng một mã QR đang hiệu lực |
| `BR-16` | Mã QR hết hiệu lực khi lịch hẹn đã tiếp nhận, bị hủy, hoặc quá giờ hẹn 24 giờ |
| `BR-17` | Quét mã QR đã hết hiệu lực hiển thị thông báo rõ lý do, không mở phiếu dịch vụ |
| `BR-18` | Một lịch hẹn chỉ mở được **một** phiếu dịch vụ |

### 4.3 Phiếu dịch vụ

| Mã | Quy tắc |
| --- | --- |
| `BR-19` | Phiếu dịch vụ phải gắn với một phương tiện và một khách hàng |
| `BR-20` | Tổng tiền phiếu = tổng tiền công + tổng tiền phụ tùng + thuế |
| `BR-21` | Giá áp dụng cho phiếu là giá tại thời điểm **tạo phiếu**, không đổi khi bảng giá thay đổi sau đó |
| `BR-22` | Phiếu chỉ hoàn tất được khi mọi hạng mục công việc đã ở trạng thái xong |
| `BR-23` | Phiếu đã hoàn tất không sửa được; điều chỉnh phải tạo bản ghi mới có lý do |
| `BR-24` | Phụ tùng bị trừ kho tại thời điểm phiếu **hoàn tất**, không phải khi thêm vào phiếu |
| `BR-25` | Hủy phiếu sau khi đã trừ kho sẽ hoàn lại đúng số lượng đã trừ |
| `BR-26` | Bàn giao xe chỉ thực hiện được khi phiếu đã hoàn tất |
| `BR-27` | Phiếu bảo dưỡng khi hoàn tất phải ghi nhận số km để tính chu kỳ tiếp theo |

### 4.4 Báo giá

| Mã | Quy tắc |
| --- | --- |
| `BR-28` | Báo giá chỉ lập được từ phiếu dịch vụ đang ở trạng thái *Đã chẩn đoán* trở đi |
| `BR-29` | Gợi ý AI **không** tự động thêm vào báo giá; bắt buộc Admin chọn từng mục |
| `BR-30` | Báo giá đã gửi không sửa trực tiếp; phải tạo phiên bản mới |
| `BR-31` | Chỉ **một** phiên bản báo giá ở trạng thái *Đã gửi* tại một thời điểm |
| `BR-32` | Khi khách từ chối báo giá, phiếu dịch vụ giữ nguyên trạng thái chờ để Admin xử lý tiếp |
| `BR-33` | Thi công chỉ bắt đầu sau khi báo giá được đồng ý, hoặc Admin ghi nhận đồng ý thay khách |

### 4.5 Giá & thanh toán

| Mã | Quy tắc |
| --- | --- |
| `BR-34` | Giá **bảo dưỡng** xác định theo **loại nhiên liệu** và **phụ tùng đi kèm** |
| `BR-35` | Giá **sửa chữa** xác định theo **loại phụ tùng** và **mức độ khó** |
| `BR-36` | Thanh toán chỉ diễn ra **tại cửa hàng**; hệ thống không xử lý giao dịch trực tuyến |
| `BR-37` | Trạng thái *Đã thanh toán* **chỉ** do Admin cập nhật |
| `BR-38` | Số tiền thực thu không vượt quá tổng tiền phiếu |
| `BR-39` | Tiền tệ mặc định là **JPY**, không có phần thập phân |

### 4.6 Phụ tùng & tồn kho

| Mã | Quy tắc |
| --- | --- |
| `BR-40` | Mã phụ tùng là duy nhất trong toàn hệ thống |
| `BR-41` | Tồn kho quản lý **theo từng cửa hàng**, không dùng kho chung |
| `BR-42` | Tồn kho không được âm; thao tác làm âm tồn bị chặn kèm cảnh báo |
| `BR-43` | Thông tin do AI sinh ra chỉ được lưu sau khi Admin xác nhận |
| `BR-44` | Phụ tùng đã phát sinh giao dịch không xóa được, chỉ ẩn |

### 4.7 Thông báo

| Mã | Quy tắc |
| --- | --- |
| `BR-45` | SMS xác nhận gửi ngay sau khi đặt lịch thành công |
| `BR-46` | SMS nhắc gửi **trước 12 tiếng** so với giờ hẹn; nếu đặt trong vòng 12 tiếng thì bỏ qua nhắc |
| `BR-47` | Nhắc bảo dưỡng định kỳ **phải chứa đường dẫn đặt lịch** |
| `BR-48` | Không gửi thông báo cho lịch hẹn đã hủy |
| `BR-49` | Mỗi sự kiện chỉ gửi đúng một thông báo cho một người nhận; hệ thống phải chống gửi trùng |

### 4.8 Dữ liệu & ngôn ngữ

| Mã | Quy tắc |
| --- | --- |
| `BR-50` | Số điện thoại lưu ở định dạng E.164; so khớp khách hàng dựa trên giá trị đã chuẩn hóa |
| `BR-51` | Mọi thời điểm lưu ở UTC, hiển thị và tính nghiệp vụ theo **UTC+9** |
| `BR-52` | Ngôn ngữ mặc định khi chưa xác định được là **tiếng Nhật** |

---

## 5. Máy trạng thái

### 5.1 Lịch hẹn

```
                  ┌─────────────────┐
                  │  Chờ xác nhận   │ ◀── khách đặt / admin đặt thay
                  └────┬───────┬────┘
         admin xác nhận│       │hủy (khách hoặc admin)
                       ▼       ▼
                ┌─────────────┐  ┌──────────┐
                │ Đã xác nhận │  │  Đã hủy  │
                └──┬───┬───┬──┘  └──────────┘
      quét QR /    │   │   │ hủy
      tiếp nhận    │   │   └──────────────▶ Đã hủy
                   │   │ quá hạn 24h
                   │   └──────────────────▶ Khách không đến
                   ▼
             ┌─────────────┐
             │ Đã tiếp nhận│ ──▶ mở phiếu dịch vụ
             └──────┬──────┘
                    │ phiếu hoàn tất & bàn giao
                    ▼
             ┌─────────────┐
             │  Hoàn tất   │
             └─────────────┘
```

| Trạng thái | Mô tả | Chuyển tiếp hợp lệ |
| --- | --- | --- |
| `PENDING` — Chờ xác nhận | Vừa tạo, chờ cửa hàng xác nhận | → `CONFIRMED`, `CANCELLED` |
| `CONFIRMED` — Đã xác nhận | Đã xác nhận, đã sinh mã QR | → `RECEIVED`, `CANCELLED`, `NO_SHOW` |
| `RECEIVED` — Đã tiếp nhận | Xe đã vào xưởng, phiếu dịch vụ đã mở | → `DONE` |
| `DONE` — Hoàn tất | Đã bàn giao xe | *(kết thúc)* |
| `CANCELLED` — Đã hủy | Khách hoặc Admin hủy | *(kết thúc)* |
| `NO_SHOW` — Khách không đến | Quá giờ hẹn không đến | *(kết thúc)* |

Đổi lịch **không** đổi trạng thái — chỉ cập nhật thời gian và ghi nhật ký.

### 5.2 Phiếu dịch vụ

```
 Tiếp nhận ──▶ Đang chẩn đoán ──▶ Chờ duyệt báo giá ──▶ Đang thực hiện ──▶ Hoàn tất ──▶ Đã bàn giao
     │               │                    │                    │              │
     └───────────────┴────────────────────┴────────────────────┴──────────────┘
                                      │
                                      ▼
                                   Đã hủy
```

| Trạng thái | Điều kiện vào | Ghi chú |
| --- | --- | --- |
| `RECEIVED` — Tiếp nhận | Xe vào xưởng, đã ghi hiện trạng | Bắt buộc có số km và ảnh hiện trạng |
| `DIAGNOSING` — Đang chẩn đoán | Kỹ thuật viên kiểm tra | Ghi triệu chứng và nguyên nhân |
| `QUOTED` — Chờ duyệt báo giá | Đã gửi báo giá cho khách | Chỉ khi có báo giá (`M-07`) |
| `IN_PROGRESS` — Đang thực hiện | Khách đồng ý báo giá, hoặc không cần báo giá | `BR-33` |
| `COMPLETED` — Hoàn tất | Mọi hạng mục đã xong | Trừ kho phụ tùng, ghi lịch sử xe |
| `DELIVERED` — Đã bàn giao | Đã giao xe cho khách | Kết thúc |
| `CANCELLED` — Đã hủy | Hủy kèm lý do | Hoàn lại tồn kho nếu đã trừ |

Trạng thái thanh toán là **trường riêng**, độc lập với trạng thái phiếu: `UNPAID` → `PARTIAL` → `PAID`.

### 5.3 Báo giá

```
 Nháp ──▶ Đã gửi ──┬──▶ Đã đồng ý
                   ├──▶ Đã từ chối
                   └──▶ Đã thay thế (khi tạo phiên bản mới)
```

---

## 6. Mô hình dữ liệu khái niệm

```
Customer 1──* Vehicle 1──* ServiceHistory
   │              │
   │ 1            │ 1
   *              *
Booking *──1 Store 1──* TimeSlot
   │ 1                      │
   │ 1                      │
WorkOrder 1──* WorkOrderItem *──1 Service
   │ 1       1──* WorkOrderPart *──1 Part 1──* Inventory *──1 Store
   │ 1
Quotation 1──* QuotationItem
   │
Payment

AdminUser *──1 Store          NotificationLog *──1 Customer
AiDiagnosis 1──1 Booking      AuditLog
```

| Thực thể | Vai trò | Ghi chú |
| --- | --- | --- |
| `Customer` | Khách hàng | Định danh bằng số điện thoại chuẩn hóa; khách vãng lai cũng tạo bản ghi |
| `Vehicle` | Phương tiện | Gắn với khách hàng; biển số là khóa nghiệp vụ |
| `Store` | Cửa hàng | Có giờ làm việc, ngày nghỉ, khung giờ |
| `TimeSlot` | Khung giờ nhận xe | Có năng lực tiếp nhận tối đa |
| `Booking` | Lịch hẹn | Máy trạng thái §5.1; chứa mã QR |
| `AiDiagnosis` | Phiên chẩn đoán AI | Lưu hội thoại, ảnh, ghi âm, kết quả kèm % |
| `WorkOrder` | Phiếu dịch vụ | Máy trạng thái §5.2 |
| `WorkOrderItem` | Hạng mục công việc | Tham chiếu `Service` hoặc nhập tự do |
| `WorkOrderPart` | Phụ tùng sử dụng | Trừ kho khi phiếu hoàn tất |
| `Quotation` / `QuotationItem` | Báo giá và dòng báo giá | Có phiên bản |
| `Service` | Dịch vụ | Phân loại bảo dưỡng / sửa chữa |
| `PriceRule` | Quy tắc giá | Theo nhiên liệu, phụ tùng, mức độ khó |
| `Part` | Phụ tùng | Có danh sách xe tương thích |
| `Inventory` / `InventoryTransaction` | Tồn kho và biến động | Theo từng cửa hàng |
| `Payment` | Thanh toán | Ghi nhận tại cửa hàng |
| `ServiceHistory` | Lịch sử dịch vụ của xe | Sinh khi phiếu hoàn tất |
| `MaintenanceSchedule` | Lịch bảo dưỡng đề xuất | Nguồn của nhắc lịch định kỳ |
| `NotificationTemplate` / `NotificationLog` | Mẫu và nhật ký thông báo | Theo ngôn ngữ |
| `AdminUser` | Tài khoản quản trị | |
| `AuditLog` | Nhật ký thao tác | Chỉ ghi, không sửa |

---

## 7. Yêu cầu phi chức năng

### 7.1 Hiệu năng

| Mã | Yêu cầu |
| --- | --- |
| `NFR-PF-01` | Trang công khai tải xong nội dung chính trong **≤ 2 giây** trên đường truyền 4G |
| `NFR-PF-02` | API nghiệp vụ thông thường phản hồi trong **≤ 500 ms** ở phân vị 95 |
| `NFR-PF-03` | Danh sách trong trang quản trị phân trang, mặc định 20 dòng, tối đa 100 dòng mỗi trang |
| `NFR-PF-04` | Chẩn đoán AI trả kết quả trong **≤ 10 giây**; quá thời gian thì hiển thị lựa chọn thủ công |
| `NFR-PF-05` | Nhận dạng ảnh phụ tùng trả kết quả trong **≤ 15 giây** |
| `NFR-PF-06` | Xuất báo cáo dưới 10.000 dòng hoàn tất trong **≤ 30 giây**; vượt ngưỡng thì xử lý nền và thông báo khi xong |
| `NFR-PF-07` | Hệ thống chịu được **200 người dùng đồng thời** trên site khách hàng |

### 7.2 Khả dụng & tin cậy

| Mã | Yêu cầu |
| --- | --- |
| `NFR-AV-01` | Thời gian hoạt động mục tiêu **99,5 %** theo tháng, không tính bảo trì có báo trước |
| `NFR-AV-02` | Sao lưu cơ sở dữ liệu hằng ngày, lưu giữ tối thiểu 30 ngày |
| `NFR-AV-03` | Mục tiêu khôi phục: `RPO` ≤ 24 giờ, `RTO` ≤ 4 giờ |
| `NFR-AV-04` | Dịch vụ AI ngừng hoạt động **không** làm gián đoạn đặt lịch, tiếp nhận và phiếu dịch vụ |
| `NFR-AV-05` | Nhà cung cấp SMS ngừng hoạt động thì thông báo được xếp hàng đợi và gửi lại khi khôi phục |

### 7.3 Bảo mật

| Mã | Yêu cầu |
| --- | --- |
| `NFR-SE-01` | Toàn bộ lưu lượng qua **HTTPS**; chuyển hướng HTTP sang HTTPS |
| `NFR-SE-02` | Mật khẩu lưu dưới dạng băm có muối (bcrypt hoặc tương đương) |
| `NFR-SE-03` | Phiên đăng nhập dùng token có thời hạn; token làm mới thu hồi được |
| `NFR-SE-04` | Giới hạn tần suất cho gửi OTP, đăng nhập và tạo lịch hẹn theo số điện thoại và theo địa chỉ IP |
| `NFR-SE-05` | Kiểm tra quyền ở **phía máy chủ** cho mọi thao tác; không dựa vào việc ẩn nút trên giao diện |
| `NFR-SE-06` | Chống các lỗ hổng phổ biến: chèn mã SQL, kịch bản chéo trang, giả mạo yêu cầu, tham chiếu đối tượng trực tiếp |
| `NFR-SE-07` | Tệp tải lên bị giới hạn theo loại và dung lượng, quét trước khi lưu |
| `NFR-SE-08` | Đường dẫn xem báo giá và mã QR dùng định danh ngẫu nhiên không đoán được |
| `NFR-SE-09` | Ảnh và ghi âm chẩn đoán chỉ lưu tối đa **90 ngày** rồi tự xóa, trừ khi đã gắn vào phiếu dịch vụ |
| `NFR-SE-10` | Số điện thoại và thông tin cá nhân được che bớt trong nhật ký hệ thống |
| `NFR-SE-11` | Người dùng phải đồng ý điều khoản xử lý dữ liệu cá nhân trước khi tải ảnh hoặc ghi âm lên |

### 7.4 Khả dụng giao diện

| Mã | Yêu cầu |
| --- | --- |
| `NFR-UX-01` | Giao diện **đơn giản, dễ thao tác, đặc biệt cho người lớn tuổi** — đây là yêu cầu bắt buộc, không phải gợi ý |
| `NFR-UX-02` | Cỡ chữ thân bài tối thiểu **16 px** trên PC và **17 px** trên điện thoại |
| `NFR-UX-03` | Độ tương phản màu đạt chuẩn `WCAG 2.1 AA` (tối thiểu 4,5:1 cho chữ thường) |
| `NFR-UX-04` | Vùng bấm của nút và liên kết tối thiểu **44 × 44 px** |
| `NFR-UX-05` | Luồng đặt lịch hoàn thành trong **tối đa 3 bước** |
| `NFR-UX-06` | Mỗi màn hình chỉ có **một** hành động chính, hiển thị nổi bật |
| `NFR-UX-07` | Thông báo lỗi viết bằng ngôn ngữ thường ngày, nói rõ cách khắc phục, hiển thị ngay cạnh trường bị lỗi |
| `NFR-UX-08` | Mọi hành động không thể hoàn tác đều có bước xác nhận |
| `NFR-UX-09` | Không dùng màu sắc làm phương tiện truyền đạt duy nhất; kèm biểu tượng hoặc chữ |
| `NFR-UX-10` | Giao diện thao tác được hoàn toàn bằng bàn phím |
| `NFR-UX-11` | Biểu mẫu dài tự lưu nháp để không mất dữ liệu khi thoát giữa chừng |
| `NFR-UX-12` | Trạng thái chờ hiển thị rõ ràng cho mọi thao tác kéo dài quá 1 giây |

### 7.5 Tương thích

| Mã | Yêu cầu |
| --- | --- |
| `NFR-CP-01` | Hỗ trợ hai phiên bản gần nhất của Chrome, Edge, Safari và Firefox |
| `NFR-CP-02` | Site khách hàng hiển thị đúng ở bề rộng **từ 360 px đến 1920 px** |
| `NFR-CP-03` | Trang quản trị tối ưu cho PC từ 1280 px, dùng được trên máy tính bảng |
| `NFR-CP-04` | Quét mã QR hoạt động trên trình duyệt di động có quyền truy cập camera |
| `NFR-CP-05` | Có mockup thiết kế cho cả **PC** và **điện thoại** |

### 7.6 Bảo trì & vận hành

| Mã | Yêu cầu |
| --- | --- |
| `NFR-MA-01` | Mã nguồn viết bằng TypeScript ở cả frontend và backend |
| `NFR-MA-02` | Phần hiển thị chữ tách hoàn toàn khỏi mã nguồn qua tệp ngôn ngữ |
| `NFR-MA-03` | Ghi nhật ký có cấu trúc, phân mức, kèm mã truy vết theo yêu cầu |
| `NFR-MA-04` | Có tài liệu API cho toàn bộ endpoint |
| `NFR-MA-05` | Cấu hình môi trường tách khỏi mã nguồn |
| `NFR-MA-06` | Kiểm thử tự động phủ tối thiểu 60 % logic nghiệp vụ |

---

## 8. Ma trận phân quyền

| # | Chức năng | `R-GUEST` | `R-USER` | `R-ADMIN` |
| --- | --- | :---: | :---: | :---: |
| 1 | Xem trang chủ, dịch vụ, bảng giá, cửa hàng | ✔ | ✔ | ✔ |
| 2 | Dùng chatbox AI chẩn đoán | ✔ | ✔ | — |
| 3 | Tạo lịch hẹn | ✔ | ✔ | ✔ |
| 4 | Tra cứu lịch hẹn bằng mã + số điện thoại | ✔ | ✔ | ✔ |
| 5 | Xem danh sách lịch hẹn của mình | — | ✔ | — |
| 6 | Hủy lịch hẹn của mình | ✔¹ | ✔ | ✔ |
| 7 | Đổi lịch hẹn của mình | ✔¹ | ✔ | ✔ |
| 8 | Đặt lại lịch (bảo dưỡng) | — | ✔ | ✔ |
| 9 | Xem mã QR lịch hẹn | ✔¹ | ✔ | ✔ |
| 10 | Đăng ký / đăng nhập | ✔ | — | — |
| 11 | Quản lý hồ sơ cá nhân | — | ✔ | — |
| 12 | Quản lý xe của mình | — | ✔ | — |
| 13 | Xem lịch sử dịch vụ của xe mình | — | ✔ | — |
| 14 | Theo dõi tiến độ sửa chữa | ✔¹ | ✔ | ✔ |
| 15 | Xem báo giá | ✔² | ✔ | ✔ |
| 16 | Đồng ý / từ chối báo giá | ✔² | ✔ | ✔³ |
| 17 | Xem toàn bộ lịch hẹn | — | — | ✔ |
| 18 | Xác nhận lịch hẹn | — | — | ✔ |
| 19 | Đặt lịch thay khách | — | — | ✔ |
| 20 | Đánh dấu khách không đến | — | — | ✔ |
| 21 | Quét mã QR, tiếp nhận xe | — | — | ✔ |
| 22 | Tạo và xử lý phiếu dịch vụ | — | — | ✔ |
| 23 | Lập và gửi báo giá | — | — | ✔ |
| 24 | Dùng trợ lý AI kỹ thuật | — | — | ✔ |
| 25 | Cập nhật trạng thái thanh toán | — | — | ✔ |
| 26 | Quản lý dịch vụ và bảng giá | — | — | ✔ |
| 27 | Quản lý phụ tùng | — | — | ✔ |
| 28 | Dùng AI nhập liệu phụ tùng | — | — | ✔ |
| 29 | Quản lý tồn kho | — | — | ✔ |
| 30 | Quản lý khách hàng và phương tiện | — | — | ✔ |
| 31 | Quản lý cửa hàng và khung giờ | — | — | ✔ |
| 32 | Quản lý tài khoản quản trị | — | — | ✔ |
| 33 | Quản lý mẫu thông báo | — | — | ✔ |
| 34 | **Xem báo cáo và thống kê** | — | — | ✔ |
| 35 | **Xuất báo cáo Excel / PDF** | — | — | ✔ |
| 36 | Xem nhật ký thao tác | — | — | ✔ |
| 37 | Cấu hình hệ thống | — | — | ✔ |

¹ Chỉ với lịch hẹn của chính mình, truy cập qua mã lịch hẹn + số điện thoại.
² Chỉ qua đường dẫn báo giá có mã bảo mật gửi kèm SMS.
³ Admin ghi nhận thay khi khách trả lời qua điện thoại (`FR-QUO-10`).

---

## 9. Các quyết định đã chốt

Các quyết định dưới đây lấy trực tiếp từ tài liệu thu thập yêu cầu, không cần xác nhận lại.

| Mã | Quyết định | Nguồn |
| --- | --- | --- |
| `DEC-01` | Chỉ có **ba vai trò**: Admin/Staff, User, Guest | §3.1 nguồn |
| `DEC-02` | Nền tảng **chỉ web**, có mockup cho PC và điện thoại | §1 nguồn |
| `DEC-03` | Giao diện **ba ngôn ngữ**: Anh, Việt, Nhật | §1 nguồn |
| `DEC-04` | Múi giờ **UTC+9** | §1 nguồn |
| `DEC-05` | Đăng ký và đăng nhập bằng **số điện thoại** | §3.2 nguồn |
| `DEC-06` | Guest xem website không cần đăng nhập | §3.3 nguồn |
| `DEC-07` | Đặt lịch chỉ cần **tên + số điện thoại** | §3.3, §4.1 nguồn |
| `DEC-08` | **Không giới hạn** thời gian đặt trước | §4.1 nguồn |
| `DEC-09` | Một lần đặt được bảo dưỡng, sửa chữa, hoặc cả hai | §4.1 nguồn |
| `DEC-10` | **Admin đặt lịch thay** cho khách hàng | §4.1 nguồn |
| `DEC-11` | Gửi **SMS xác nhận** sau khi đặt thành công | §4.2 nguồn |
| `DEC-12` | Gửi **SMS nhắc trước 12 tiếng** | §4.2 nguồn |
| `DEC-13` | **Không giới hạn** thời gian hủy, **không** phí phạt | §4.3 nguồn |
| `DEC-14` | **Không giới hạn** thời gian đổi lịch, **không** phí phạt | §4.4 nguồn |
| `DEC-15` | Chỉ lịch hẹn **bảo dưỡng** có tính năng đặt lại lịch | §4.5 nguồn |
| `DEC-16` | Giá bảo dưỡng theo **loại nhiên liệu và phụ tùng** | §6.1 nguồn |
| `DEC-17` | Giá sửa chữa theo **loại phụ tùng và mức độ khó** | §6.1 nguồn |
| `DEC-18` | Thanh toán **tại cửa hàng**; trạng thái *Đã thanh toán* do **Admin** cập nhật | §6.2 nguồn |
| `DEC-19` | Mã QR sinh **sau khi Admin xác nhận** lịch hẹn | §7 nguồn |
| `DEC-20` | Mã QR có trên **web và trong SMS** | §7 nguồn |
| `DEC-21` | Lễ tân **quét QR** để nắm nhanh tình hình xe, giảm hỏi lại khách | §7 nguồn |
| `DEC-22` | Thống kê **chỉ Admin** xem; theo ngày/tháng/loại xe; xuất **Excel và PDF** | §9 nguồn |
| `DEC-23` | Dùng **AI nhập liệu phụ tùng từ ảnh** phụ tùng hoặc hộp vỏ | §10 nguồn |
| `DEC-24` | Giao diện **đơn giản, dễ dùng cho người lớn tuổi** | §11 nguồn |

---

## 10. Các điểm cần làm rõ

Cần chốt với khách hàng trước khi sang thiết kế chi tiết. Cột **Ảnh hưởng** cho biết mức tác động tới phạm vi và tiến độ.

| Mã | Câu hỏi | Ảnh hưởng | Đề xuất tạm |
| --- | --- | --- | --- |
| `OQ-01` | Có tách riêng vai trò **Kỹ thuật viên** không? Proposal nhắc tới nhưng yêu cầu ghi rõ chỉ 3 vai trò. | **Cao** | Giữ 3 vai trò cho MVP, thiết kế dữ liệu sẵn sàng mở rộng (`FR-USR-06`) |
| `OQ-02` | Có phân quyền theo **cửa hàng** không (nhân viên cửa hàng A chỉ thấy dữ liệu cửa hàng A)? | **Cao** | Có trường cửa hàng phụ trách nhưng chưa chặn dữ liệu ở MVP |
| `OQ-03` | Hệ thống phục vụ **bao nhiêu cửa hàng** trong giai đoạn đầu? | **Cao** | Giả định dưới 20 (`A-04`) |
| `OQ-04` | **Mức độ khó** của sửa chữa do ai và theo tiêu chí nào xác định? | Trung bình | Admin chọn tay khi lập phiếu, 3 mức |
| `OQ-05` | Guest đặt lịch có cần **xác thực OTP** không? Không có OTP thì dễ đặt ảo. | **Cao** | Có OTP cho Guest; giới hạn 5 lịch hẹn đang hoạt động (`BR-10`) |
| `OQ-06` | Nhà cung cấp **SMS gateway** nào? Có chi phí và giới hạn ra sao? | **Cao** | Chờ khách hàng chỉ định |
| `OQ-07` | Đã có **email** cho khách hàng chưa, hay chỉ có số điện thoại? Nhắc bảo dưỡng yêu cầu cả email và SMS. | Trung bình | Email là trường tùy chọn; thiếu email thì chỉ gửi SMS |
| `OQ-08` | AOYAMA có **tài liệu kỹ thuật dạng số** không? Quyết định tính khả thi của `AI-03`. | **Cao** | Xếp `M-12` vào Giai đoạn 3, sẵn sàng cắt |
| `OQ-09` | Quản lý tồn kho có bao gồm **đặt hàng từ nhà cung cấp** không? | Trung bình | Ngoài phạm vi (`OS-06`) |
| `OQ-10` | **Chu kỳ bảo dưỡng** tính theo thời gian, số km, hay cả hai? Giá trị mặc định là bao nhiêu? | Trung bình | Theo cả hai, mốc nào đến trước; mặc định 6 tháng hoặc 3.000 km |
| `OQ-11` | Có cần **đánh giá dịch vụ** sau khi hoàn tất không? | Thấp | Chưa đưa vào phạm vi |
| `OQ-12` | Có cần **tích hợp với hệ thống bán xe** hiện có để lấy thông tin xe đã bán không? | Trung bình | Ngoài phạm vi (`OS-08`) |
| `OQ-13` | **Thuế suất** áp dụng cho dịch vụ và phụ tùng là bao nhiêu? | Trung bình | Giả định thuế tiêu dùng 10 %, cấu hình được |
| `OQ-14` | Có in **hóa đơn / phiếu thu** theo mẫu riêng của AOYAMA không? | Trung bình | Dùng mẫu PDF chung, có logo và thông tin doanh nghiệp |
| `OQ-15` | Số lượng **khung giờ** và **năng lực tiếp nhận** mỗi khung giờ của một cửa hàng? | Trung bình | Khung 60 phút, 3 lượt mỗi khung, cấu hình được |
| `OQ-16` | Dữ liệu khách hàng và lịch sử dịch vụ cũ có cần **nhập từ hệ thống giấy** không? | Trung bình | Chưa đưa vào phạm vi; cần bàn riêng nếu có |
| `OQ-17` | Ngôn ngữ **mặc định** khi mở trang lần đầu là gì? | Thấp | Tiếng Nhật, có thể đổi theo ngôn ngữ trình duyệt |
| `OQ-18` | Ảnh và ghi âm của khách lưu giữ trong **bao lâu**? Có ràng buộc pháp lý nào không? | Trung bình | 90 ngày (`NFR-SE-09`) |
| `OQ-19` | Báo giá có **bắt buộc** cho mọi ca sửa chữa hay chỉ khi vượt một ngưỡng tiền? | Trung bình | Bắt buộc khi tổng tiền vượt ngưỡng cấu hình được |
| `OQ-20` | Có cần chức năng **xếp hàng đợi** khi khung giờ đã đầy không? | Thấp | Chưa đưa vào phạm vi |

---

## 11. Tiêu chí nghiệm thu

| Mã | Tiêu chí | Yêu cầu liên quan |
| --- | --- | --- |
| `AC-01` | Khách vãng lai đặt được lịch chỉ với tên và số điện thoại, nhận SMS xác nhận trong vòng 1 phút | `FR-BOOK-01` `FR-BOOK-11` `FR-NOT-01` |
| `AC-02` | Khách đặt được cùng lúc cả hai dịch vụ bảo dưỡng và sửa chữa trong một lịch hẹn | `FR-BOOK-02` |
| `AC-03` | Khách đặt lịch được cho thời điểm bất kỳ trong tương lai, không bị chặn bởi giới hạn đặt trước | `FR-BOOK-05` `BR-03` |
| `AC-04` | Khách hủy và đổi lịch được ở mọi thời điểm trước giờ hẹn, không phát sinh phí | `FR-BOOK-13` `FR-BOOK-14` `BR-04` `BR-05` |
| `AC-05` | Khách vãng lai tra cứu được lịch hẹn bằng mã lịch hẹn và số điện thoại | `FR-BOOK-15` |
| `AC-06` | SMS nhắc gửi đúng **12 tiếng** trước giờ hẹn | `FR-BOOK-12` `BR-46` |
| `AC-07` | Sau khi Admin xác nhận, mã QR xuất hiện trên web và đường dẫn tới mã có trong SMS | `FR-QR-01` `FR-QR-02` `FR-QR-03` |
| `AC-08` | Lễ tân quét mã QR và thấy ngay tên khách, xe, dịch vụ, mô tả lỗi mà không cần hỏi lại khách | `FR-QR-05` `FR-QR-06` |
| `AC-09` | Từ màn hình quét QR, Admin mở được phiếu dịch vụ bằng một thao tác | `FR-QR-07` `FR-WO-01` |
| `AC-10` | Chatbox AI nhận được cả ba dạng đầu vào: văn bản, ảnh, giọng nói | `FR-AI-03` `FR-AI-04` `FR-AI-05` |
| `AC-11` | Kết quả chẩn đoán hiển thị danh sách lỗi kèm **% mức độ khớp** | `FR-AI-06` |
| `AC-12` | Từ kết quả chẩn đoán, khách chuyển sang đặt lịch với dịch vụ và mô tả điền sẵn | `FR-AI-09` |
| `AC-13` | Khi dịch vụ AI ngừng hoạt động, khách vẫn đặt lịch được bình thường | `FR-AI-11` `NFR-AV-04` |
| `AC-14` | Admin tạo được lịch hẹn thay cho khách hàng | `FR-BOOK-19` |
| `AC-15` | Phiếu dịch vụ đi hết vòng đời từ tiếp nhận đến bàn giao, mỗi bước có ghi nhật ký | `FR-WO-07` `FR-WO-08` |
| `AC-16` | Khi phiếu hoàn tất, tồn kho phụ tùng giảm đúng số lượng đã dùng | `FR-PRT-10` `BR-24` |
| `AC-17` | Phiếu hoàn tất xuất hiện trong lịch sử dịch vụ của xe | `FR-WO-12` `FR-VEH-04` |
| `AC-18` | Admin tải ảnh hộp phụ tùng lên và AI điền sẵn tối thiểu tên, mã và hãng sản xuất | `FR-PRT-04` `FR-PRT-06` |
| `AC-19` | Thông tin do AI sinh chỉ lưu sau khi Admin bấm xác nhận | `FR-PRT-05` `BR-43` |
| `AC-20` | Giá bảo dưỡng thay đổi đúng theo loại nhiên liệu đã chọn | `FR-SVC-04` `BR-34` |
| `AC-21` | Giá sửa chữa thay đổi đúng theo loại phụ tùng và mức độ khó | `FR-SVC-05` `BR-35` |
| `AC-22` | Admin cập nhật được trạng thái *Đã thanh toán* và khách nhìn thấy trạng thái đó | `FR-PAY-03` `FR-PAY-06` |
| `AC-23` | Email và SMS nhắc bảo dưỡng có chứa đường dẫn đặt lịch hoạt động đúng | `FR-NOT-05` `BR-47` |
| `AC-24` | Chỉ Admin truy cập được màn hình báo cáo; `R-USER` và `R-GUEST` bị chặn ở phía máy chủ | `FR-RPT-01` `NFR-SE-05` |
| `AC-25` | Báo cáo thống kê được theo ngày, theo tháng và theo loại xe | `FR-RPT-02` `FR-RPT-03` |
| `AC-26` | Báo cáo xuất được ra cả Excel và PDF, số liệu khớp với màn hình | `FR-RPT-09` `FR-RPT-10` |
| `AC-27` | Toàn bộ giao diện chuyển được giữa ba ngôn ngữ Anh / Việt / Nhật, không còn chuỗi chưa dịch | `FR-I18N-01` `FR-I18N-02` |
| `AC-28` | Mọi thời điểm hiển thị đúng theo UTC+9 | `FR-I18N-06` `BR-51` |
| `AC-29` | Luồng đặt lịch hoàn thành trong tối đa 3 bước; cỡ chữ và độ tương phản đạt ngưỡng đã quy định | `NFR-UX-02` `NFR-UX-03` `NFR-UX-05` |
| `AC-30` | Site khách hàng hiển thị đúng ở bề rộng 360 px và 1920 px, không vỡ bố cục | `NFR-CP-02` |

---

## Lịch sử phiên bản

| Phiên bản | Ngày | Người sửa | Thay đổi |
| --- | --- | --- | --- |
| 1.0 | 2026-09-14 | Đội tài liệu | Bản đầu tiên — 209 `FR` (19 module), 46 `NFR`, 52 `BR`, 24 `DEC`, 20 `OQ`, 30 `AC` |

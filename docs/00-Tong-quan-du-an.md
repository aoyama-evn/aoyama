# 00 — Tổng quan dự án

| | |
| --- | --- |
| **Mã tài liệu** | `OV-2026-001` |
| **Tên dự án** | Hệ thống quản lý dịch vụ bảo dưỡng & sửa chữa xe máy AOYAMA |
| **Khách hàng** | Mobility Enshu Railway Co., Ltd. (遠州鉄道) — https://mobility.entetsu.co.jp/ |
| **Đối tượng dịch vụ** | Chuỗi cửa hàng xe máy AOYAMA — https://www.aoyama-shoukai.co.jp/ |
| **Phiên bản** | 1.0 |
| **Ngày** | 2026-09-14 |
| **Trạng thái** | Bản thảo — chờ khách hàng xác nhận |
| **Nguồn** | `docs/Requirements/Thu thập yêu cầu ban đầu.docx`, `docs/Requirements/Proposal.pptx` |

---

## 1. Bối cảnh

Shizuoka là khu vực có tỷ lệ sử dụng xe máy cao và là một trung tâm của ngành công nghiệp xe máy Nhật Bản. Tập đoàn Mobility Enshu Railway vận hành chuỗi cửa hàng xe máy **AOYAMA**.

Mảng **bán xe** của AOYAMA đã được số hóa thông qua một sàn thương mại điện tử của bên thứ ba. Ngược lại, mảng **bảo dưỡng, sửa chữa và chăm sóc khách hàng sau bán** vẫn vận hành hoàn toàn theo phương thức truyền thống: ghi chép giấy, gọi điện, trao đổi trực tiếp tại quầy.

Dự án này xây dựng nền tảng số cho đúng phần còn thiếu đó — **không** bao gồm và **không** thay thế hệ thống bán xe hiện có.

## 2. Vấn đề hiện tại

### 2.1 Phía khách hàng

| # | Vấn đề |
| --- | --- |
| P-01 | Khó đặt lịch — phải gọi điện hoặc đến trực tiếp cửa hàng trong giờ làm việc |
| P-02 | Không có nơi tra cứu lịch sử bảo dưỡng, sửa chữa của xe mình |
| P-03 | Không theo dõi được tiến độ khi xe đang nằm ở xưởng |
| P-04 | Thiếu minh bạch về hạng mục công việc và chi phí trước khi làm |
| P-05 | Không được nhắc khi đến kỳ bảo dưỡng, dẫn đến bỏ lỡ chu kỳ |

### 2.2 Phía cửa hàng

| # | Vấn đề |
| --- | --- |
| P-06 | Quản lý lịch hẹn thủ công, dễ trùng giờ và quá tải cục bộ |
| P-07 | Không có hồ sơ tập trung về khách hàng và phương tiện |
| P-08 | Quy trình tiếp nhận xe và báo giá mất nhiều thời gian trao đổi qua lại |
| P-09 | Nhập liệu phụ tùng thủ công, tốn công và dễ sai sót |
| P-10 | Không có số liệu tổng hợp để ra quyết định kinh doanh |

## 3. Mục tiêu dự án

| # | Mục tiêu | Chỉ số đo |
| --- | --- | --- |
| G-01 | Khách hàng đặt lịch được 24/7 mà không cần gọi điện | ≥ 60 % lịch hẹn đến từ kênh trực tuyến sau 6 tháng |
| G-02 | Rút ngắn thời gian tiếp nhận xe tại quầy | Từ ~10 phút xuống ≤ 3 phút nhờ mã QR |
| G-03 | Số hóa toàn bộ lịch sử dịch vụ của từng xe | 100 % phiếu dịch vụ được lưu trong hệ thống |
| G-04 | Giảm công nhập liệu phụ tùng cho quản trị viên | ≥ 50 % trường thông tin được AI điền sẵn |
| G-05 | Tăng tỷ lệ khách quay lại theo chu kỳ bảo dưỡng | Nhắc lịch tự động cho 100 % xe có lịch sử bảo dưỡng |
| G-06 | Cung cấp báo cáo vận hành cho ban quản lý | Báo cáo theo ngày/tháng, xuất Excel và PDF |

## 4. Phạm vi

### 4.1 Trong phạm vi

Hệ thống gồm **hai site chạy trên nền web**:

**A. Site khách hàng** (công khai, không bắt buộc đăng nhập để xem)

- Giới thiệu cửa hàng, dịch vụ, bảng giá tham khảo
- **Chatbox AI chẩn đoán**: khách mô tả lỗi bằng văn bản, ảnh hoặc giọng nói; AI gợi ý các lỗi có thể gặp kèm **mức độ khớp (%)** và đề xuất dịch vụ phù hợp
- Đặt lịch bảo dưỡng / sửa chữa / cả hai — có thể đặt với tư cách khách vãng lai (Guest) chỉ bằng **tên + số điện thoại**
- Đăng ký / đăng nhập bằng số điện thoại
- Quản lý lịch hẹn: xem, hủy, đổi lịch, đặt lại lịch (lặp lại) cho dịch vụ bảo dưỡng
- **Mã QR** cho lịch hẹn đã được xác nhận
- Quản lý phương tiện của tôi và lịch sử bảo dưỡng / sửa chữa
- Theo dõi tiến độ sửa chữa
- Xem và phản hồi báo giá
- Nhận nhắc lịch qua SMS và email

**B. Trang quản trị** (chỉ Admin/Staff)

- Bảng điều khiển tổng quan
- Quản lý lịch hẹn: xem toàn bộ, đặt thay khách, xác nhận, hủy, đổi lịch
- Quét mã QR để tiếp nhận xe
- **Phiếu dịch vụ** (work order): tiếp nhận → chẩn đoán → báo giá → thực hiện → hoàn tất → bàn giao
- Lập báo giá — **AI gợi ý** hạng mục kiểm tra, phụ tùng cần thay và chi phí tham khảo
- **Trợ lý AI kỹ thuật**: tra cứu quy trình sửa chữa, mã lỗi, thông số kỹ thuật bằng ngôn ngữ tự nhiên
- Quản lý dịch vụ và bảng giá
- Quản lý phụ tùng và tồn kho — **AI nhận dạng ảnh phụ tùng / hộp vỏ để tự sinh thông tin**
- Quản lý khách hàng và phương tiện
- Quản lý cửa hàng, khung giờ và năng lực tiếp nhận
- Quản lý người dùng và phân quyền
- Cập nhật trạng thái thanh toán
- Báo cáo, thống kê và xuất Excel / PDF
- Quản lý mẫu thông báo SMS / email
- Cấu hình hệ thống và nhật ký thao tác

### 4.2 Ngoài phạm vi

| # | Hạng mục | Lý do |
| --- | --- | --- |
| OS-01 | Bán xe máy, quản lý kho xe mới/cũ | Đã có sàn thương mại điện tử bên thứ ba |
| OS-02 | Ứng dụng di động gốc (iOS / Android) | Yêu cầu ghi rõ **Web only**; giao diện web đáp ứng cả PC và điện thoại |
| OS-03 | Thanh toán trực tuyến (thẻ, ví điện tử) | Giai đoạn đầu chỉ thanh toán tại cửa hàng |
| OS-04 | Kế toán, hóa đơn điện tử, kê khai thuế | Không được nêu trong yêu cầu |
| OS-05 | Quản lý nhân sự, chấm công, lương kỹ thuật viên | Không được nêu trong yêu cầu |
| OS-06 | Mua hàng từ nhà cung cấp, quản lý công nợ | Cần khách hàng xác nhận — xem `OQ-09` |
| OS-07 | Bảo hành, khiếu nại sau dịch vụ | Không được nêu trong yêu cầu |
| OS-08 | Tích hợp với hệ thống bán xe hiện có | Cần khách hàng xác nhận — xem `OQ-12` |

## 5. Các bên liên quan

| Bên liên quan | Quan tâm chính |
| --- | --- |
| Mobility Enshu Railway | Nền tảng chung kết nối nhiều cửa hàng, khả năng mở rộng dịch vụ |
| Quản lý chuỗi AOYAMA | Chuẩn hóa quy trình, số liệu vận hành, chất lượng dịch vụ |
| Nhân viên cửa hàng (lễ tân, kỹ thuật viên) | Thao tác nhanh, ít nhập liệu, tra cứu kỹ thuật thuận tiện |
| Khách hàng cuối | Đặt lịch dễ, minh bạch chi phí, biết tiến độ xe |
| Đội phát triển | Phạm vi rõ ràng, yêu cầu ổn định, tiêu chí nghiệm thu đo được |

## 6. Vai trò người dùng

Tài liệu thu thập yêu cầu chốt **ba vai trò**:

| Mã | Vai trò | Mô tả |
| --- | --- | --- |
| `R-GUEST` | Guest — khách vãng lai | Xem website và dịch vụ không cần đăng nhập. Khi đặt lịch chỉ cần nhập **tên + số điện thoại**. |
| `R-USER` | User — khách hàng | Đăng ký / đăng nhập bằng số điện thoại. Có hồ sơ, danh sách xe, lịch sử dịch vụ, lịch hẹn. |
| `R-ADMIN` | Admin / Staff | Toàn quyền trên trang quản trị. |

> **Lưu ý phạm vi.** Bản đề xuất (Proposal) có nhắc tới *kỹ thuật viên tra cứu tài liệu* và *phân quyền theo cửa hàng*. Tài liệu thu thập yêu cầu lại ghi rõ **"Chỉ có 3 role"**. Tài liệu này giữ nguyên ba vai trò làm cơ sở hợp đồng; việc tách riêng vai trò **Kỹ thuật viên** và **Quản lý cửa hàng** được ghi nhận là điểm cần làm rõ `OQ-01`, `OQ-02` và xếp vào Giai đoạn 3 nếu khách hàng đồng ý.

## 7. Kiến trúc tổng thể

```
┌──────────────────────────┐      ┌──────────────────────────┐
│   Site khách hàng        │      │   Trang quản trị         │
│   (Nuxt 3 — SSR)         │      │   (Nuxt 3 — SPA)         │
│   PC + điện thoại        │      │   PC là chính            │
└────────────┬─────────────┘      └────────────┬─────────────┘
             │                                 │
             └──────────────┬──────────────────┘
                            │  REST + WebSocket
                  ┌─────────▼──────────┐
                  │   API (NestJS)     │
                  │   Xác thực · Nghiệp│
                  │   vụ · Tiến trình  │
                  │   nền              │
                  └─────────┬──────────┘
                            │
        ┌───────────────────┼───────────────────┬───────────────┐
        │                   │                   │               │
  ┌─────▼─────┐      ┌──────▼──────┐     ┌──────▼─────┐  ┌──────▼─────┐
  │ CSDL quan │      │ Lưu trữ tệp │     │ Dịch vụ AI │  │ SMS / Email│
  │ hệ        │      │ (ảnh, voice,│     │ (chẩn đoán,│  │ (nhà cung  │
  │           │      │  tài liệu)  │     │  OCR, RAG) │  │  cấp ngoài)│
  └───────────┘      └─────────────┘     └────────────┘  └────────────┘
```

| Tầng | Công nghệ | Ghi chú |
| --- | --- | --- |
| Frontend | Nuxt 3 + TypeScript | Hai site dùng chung thư viện thành phần |
| Backend | NestJS + TypeScript + TypeORM | REST cho nghiệp vụ, WebSocket cho tiến độ sửa chữa |
| Cơ sở dữ liệu | Quan hệ (PostgreSQL / MySQL) | Chốt ở giai đoạn thiết kế cơ bản |
| AI | Dịch vụ mô hình ngôn ngữ + thị giác máy tính | Gọi qua API, không huấn luyện mô hình riêng |
| Thông báo | SMS gateway + SMTP | Nhà cung cấp do khách hàng chỉ định — `OQ-06` |

## 8. Danh mục module chức năng

| Mã | Module | Site | Mô tả ngắn |
| --- | --- | --- | --- |
| `M-01` | Xác thực & tài khoản | Cả hai | Đăng ký/đăng nhập bằng số điện thoại, hồ sơ cá nhân |
| `M-02` | Nội dung công khai | Khách hàng | Trang chủ, dịch vụ, bảng giá, cửa hàng, liên hệ |
| `M-03` | Chatbox AI chẩn đoán | Khách hàng | Nhận văn bản/ảnh/giọng nói, gợi ý lỗi kèm % |
| `M-04` | Đặt lịch | Cả hai | Tạo, xác nhận, hủy, đổi lịch, đặt lại lịch |
| `M-05` | Mã QR & tiếp nhận xe | Cả hai | Sinh QR, quét QR, mở phiếu dịch vụ |
| `M-06` | Phiếu dịch vụ | Quản trị | Vòng đời công việc từ tiếp nhận đến bàn giao |
| `M-07` | Báo giá | Cả hai | Lập báo giá có AI gợi ý, khách xem và phản hồi |
| `M-08` | Phương tiện & lịch sử | Cả hai | Hồ sơ xe, lịch sử bảo dưỡng/sửa chữa |
| `M-09` | Khách hàng | Quản trị | Hồ sơ khách, gộp trùng, ghi chú |
| `M-10` | Dịch vụ & bảng giá | Quản trị | Danh mục dịch vụ, quy tắc tính giá |
| `M-11` | Phụ tùng & tồn kho | Quản trị | Danh mục phụ tùng, AI nhập liệu từ ảnh, tồn kho |
| `M-12` | Trợ lý AI kỹ thuật | Quản trị | Tra cứu quy trình, mã lỗi, thông số |
| `M-13` | Thanh toán | Quản trị | Ghi nhận hình thức và trạng thái thanh toán |
| `M-14` | Thông báo | Cả hai | SMS/email xác nhận, nhắc lịch, cập nhật tiến độ |
| `M-15` | Báo cáo & thống kê | Quản trị | Báo cáo theo ngày/tháng/loại xe, xuất Excel & PDF |
| `M-16` | Cửa hàng & lịch làm việc | Quản trị | Thông tin cửa hàng, khung giờ, năng lực tiếp nhận |
| `M-17` | Người dùng & phân quyền | Quản trị | Tài khoản quản trị, vai trò |
| `M-18` | Cấu hình & nhật ký | Quản trị | Tham số hệ thống, nhật ký thao tác |
| `M-19` | Đa ngôn ngữ | Cả hai | Tiếng Anh, Tiếng Việt, Tiếng Nhật |

## 9. Ứng dụng AI

Bản đề xuất xác định năm điểm chạm AI. Bảng dưới ghi rõ **đầu vào, đầu ra và mức độ cần người duyệt** cho từng điểm — nguyên tắc chung là **AI đề xuất, con người quyết định**.

| # | Điểm chạm | Đầu vào | Đầu ra | Người duyệt |
| --- | --- | --- | --- | --- |
| `AI-01` | Chẩn đoán khi đặt lịch | Văn bản mô tả lỗi, ảnh xe, ghi âm giọng nói, loại xe | Danh sách lỗi nghi ngờ kèm **% mức độ khớp**, dịch vụ đề xuất | Không bắt buộc — chỉ là gợi ý cho khách |
| `AI-02` | Gợi ý báo giá | Thông tin xe, triệu chứng, kết quả chẩn đoán | Hạng mục kiểm tra, phụ tùng cần thay, chi phí tham khảo | **Bắt buộc** — Admin duyệt trước khi gửi khách |
| `AI-03` | Trợ lý kỹ thuật | Câu hỏi ngôn ngữ tự nhiên của nhân viên | Trích đoạn quy trình sửa chữa, mã lỗi, thông số, kèm nguồn | Không — chỉ tra cứu, không ghi dữ liệu |
| `AI-04` | Nhập liệu phụ tùng | Ảnh phụ tùng hoặc hộp vỏ phụ tùng | Tên, mã, hãng, quy cách, xe tương thích (điền sẵn vào biểu mẫu) | **Bắt buộc** — Admin kiểm tra trước khi lưu |
| `AI-05` | Gợi ý chu kỳ bảo dưỡng | Lịch sử dịch vụ, số km, thời gian sử dụng | Thời điểm bảo dưỡng tiếp theo đề xuất | Không — dùng để sinh nhắc lịch |

Nguyên tắc chung:

1. Mọi kết quả AI đều hiển thị nhãn **"Gợi ý bởi AI"** và độ tin cậy khi có.
2. AI **không** tự động tạo, sửa hoặc xóa dữ liệu nghiệp vụ; luôn qua bước xác nhận của con người ở `AI-02` và `AI-04`.
3. Ảnh và ghi âm do khách tải lên chỉ dùng cho phiên chẩn đoán tương ứng, có thời hạn lưu trữ theo yêu cầu bảo mật.
4. Khi dịch vụ AI không phản hồi, chức năng nghiệp vụ vẫn phải dùng được ở chế độ thủ công.
5. `AI-03` trả lời kèm **trích dẫn nguồn tài liệu**; nếu không tìm được nguồn thì trả lời "không có dữ liệu" thay vì suy đoán.

> Khả thi của `AI-03` phụ thuộc vào việc AOYAMA có sẵn tài liệu kỹ thuật ở dạng số hay không — xem `OQ-08`.

## 10. Lợi ích kỳ vọng

| Đối tượng | Lợi ích |
| --- | --- |
| Khách hàng | Đặt lịch thuận tiện · Theo dõi lịch sử bảo dưỡng · Minh bạch thông tin và chi phí dịch vụ |
| Cửa hàng | Chuẩn hóa quy trình làm việc · Nâng cao hiệu quả quản lý · Tăng chất lượng dịch vụ và tỷ lệ khách quay lại |
| Doanh nghiệp | Nền tảng kết nối nhiều cửa hàng · Dễ mở rộng và phát triển dịch vụ mới trong tương lai |

## 11. Ràng buộc và giả định

### 11.1 Ràng buộc

| Mã | Ràng buộc |
| --- | --- |
| `C-01` | Nền tảng: **chỉ web**, có thiết kế giao diện cho cả PC và điện thoại |
| `C-02` | Giao diện **đa ngôn ngữ**: Tiếng Anh, Tiếng Việt, Tiếng Nhật |
| `C-03` | Múi giờ hiển thị và xử lý nghiệp vụ: **UTC+9** (giờ Nhật Bản) |
| `C-04` | Giai đoạn đầu **không** thanh toán trực tuyến — chỉ thanh toán tại cửa hàng |
| `C-05` | Giao diện phải **đơn giản, dễ thao tác, đặc biệt cho người lớn tuổi** |
| `C-06` | Tài liệu trong `docs/Requirements/` là nguồn gốc, không chỉnh sửa |

### 11.2 Giả định

| Mã | Giả định | Rủi ro nếu sai |
| --- | --- | --- |
| `A-01` | Khách hàng có số điện thoại di động nhận được SMS | Toàn bộ luồng xác nhận và nhắc lịch mất tác dụng |
| `A-02` | AOYAMA cung cấp được danh mục dịch vụ và bảng giá ban đầu | Không có dữ liệu để chạy thử nghiệm |
| `A-03` | Khách hàng cung cấp tài khoản SMS gateway và SMTP | Chậm tiến độ tích hợp thông báo |
| `A-04` | Số lượng cửa hàng trong giai đoạn đầu ở mức nhỏ (< 20) | Ảnh hưởng thiết kế phân quyền và hiệu năng |
| `A-05` | Tài liệu kỹ thuật xe có ở dạng số hoặc có thể số hóa | `AI-03` phải cắt khỏi phạm vi |

## 12. Lộ trình triển khai đề xuất

| Giai đoạn | Nội dung | Module |
| --- | --- | --- |
| **MVP** | Đặt lịch, xác nhận, QR, tiếp nhận xe, phiếu dịch vụ cơ bản, quản lý dịch vụ/phụ tùng/khách hàng, thông báo SMS, báo cáo cơ bản | `M-01` `M-02` `M-04` `M-05` `M-06` `M-08` `M-09` `M-10` `M-11` `M-13` `M-14` `M-15` `M-16` `M-17` `M-19` |
| **Giai đoạn 2** | Chatbox AI chẩn đoán, AI nhập liệu phụ tùng, báo giá có AI gợi ý, theo dõi tiến độ, đặt lịch lặp lại | `M-03` `M-07` + `AI-01` `AI-02` `AI-04` `AI-05` |
| **Giai đoạn 3** | Trợ lý AI kỹ thuật, báo cáo nâng cao, mở rộng đa cửa hàng, tách vai trò kỹ thuật viên | `M-12` `M-18` + `OQ-01` `OQ-02` |

## 13. Rủi ro chính

| Mã | Rủi ro | Mức | Cách giảm thiểu |
| --- | --- | --- | --- |
| `RK-01` | Độ chính xác chẩn đoán AI thấp gây mất tin tưởng | Cao | Hiển thị rõ % và nhãn "gợi ý"; luôn cho phép mô tả thủ công; đo độ chính xác trong giai đoạn thử nghiệm |
| `RK-02` | Không có tài liệu kỹ thuật dạng số cho `AI-03` | Cao | Chốt `OQ-08` sớm; sẵn sàng cắt `AI-03` khỏi phạm vi |
| `RK-03` | Chi phí và độ trễ SMS tại Nhật | Trung bình | Cho phép cấu hình gộp email + SMS; chốt nhà cung cấp sớm |
| `RK-04` | Đặt lịch không cần đăng nhập dễ bị lạm dụng (đặt ảo) | Trung bình | Xem `OQ-05` về OTP; giới hạn tần suất theo số điện thoại |
| `RK-05` | Người lớn tuổi khó dùng giao diện nhiều bước | Trung bình | Luồng đặt lịch tối đa 3 bước, chữ lớn, tương phản cao, kiểm thử với người dùng thật |
| `RK-06` | Phạm vi vai trò chưa chốt (3 hay nhiều hơn) | Trung bình | Chốt `OQ-01`, `OQ-02` trước khi sang thiết kế chi tiết |
| `RK-07` | Dữ liệu ảnh / giọng nói của khách phát sinh nghĩa vụ bảo vệ dữ liệu cá nhân | Trung bình | Đặt thời hạn lưu trữ, hiển thị thông báo đồng ý khi tải lên |

## 14. Bộ tài liệu

| Mã | Tài liệu | Nội dung |
| --- | --- | --- |
| `OV-2026-001` | [00 — Tổng quan dự án](00-Tong-quan-du-an.md) | Bối cảnh, phạm vi, kiến trúc, lộ trình *(tài liệu này)* |
| `RD-2026-001` | [01 — Định nghĩa yêu cầu dự án](01-Dinh-nghia-yeu-cau-du-an.md) | Yêu cầu chức năng, phi chức năng, quy tắc nghiệp vụ, ma trận quyền, tiêu chí nghiệm thu |
| `SM-2026-001` | [02 — Danh sách & sơ đồ màn hình](02-Danh-sach-so-do-man-hinh.md) | Danh mục màn hình, sơ đồ site map, sơ đồ luồng màn hình |
| `SS-2026-001` | [03 — Đặc tả chi tiết màn hình](03-Dac-ta-chi-tiet-man-hinh.md) | Bố cục, thành phần, hành động, kiểm tra dữ liệu, thông báo của từng màn hình |

```
Requirements/ (nguồn)
      │
      ▼
OV-2026-001 ──▶ RD-2026-001 ──▶ SM-2026-001 ──▶ SS-2026-001
 tổng quan       yêu cầu         màn hình        đặc tả màn hình
```

Quy ước mã tham chiếu: `FR-*` (yêu cầu chức năng), `NFR-*` (phi chức năng), `BR-*` (quy tắc nghiệp vụ), `OQ-*` (điểm cần làm rõ), `AC-*` (tiêu chí nghiệm thu) đều được **định nghĩa một lần duy nhất** trong `RD-2026-001`; các tài liệu sau chỉ tham chiếu, không định nghĩa lại.

## 15. Thuật ngữ

| Thuật ngữ | Giải thích |
| --- | --- |
| **Lịch hẹn** (Booking) | Yêu cầu đặt lịch của khách cho một hoặc cả hai loại dịch vụ, tại một cửa hàng, vào một khung giờ |
| **Phiếu dịch vụ** (Work Order) | Hồ sơ công việc thực tế tại xưởng, mở khi xe được tiếp nhận |
| **Báo giá** (Quotation) | Bảng kê hạng mục công việc và phụ tùng kèm giá, gửi khách xác nhận trước khi thi công |
| **Guest** | Người dùng chưa đăng nhập |
| **Khung giờ** (Time slot) | Đơn vị thời gian nhận xe của cửa hàng, có giới hạn số lượt |
| **Năng lực tiếp nhận** | Số lượt xe tối đa cửa hàng nhận trong một khung giờ |
| **Chu kỳ bảo dưỡng** | Khoảng thời gian hoặc số km giữa hai lần bảo dưỡng của một xe |
| **Mức độ khớp (%)** | Điểm tin cậy AI gán cho mỗi lỗi nghi ngờ khi chẩn đoán |

---

## Lịch sử phiên bản

| Phiên bản | Ngày | Người sửa | Thay đổi |
| --- | --- | --- | --- |
| 1.0 | 2026-09-14 | Đội tài liệu | Bản đầu tiên, dựng từ `Thu thập yêu cầu ban đầu.docx` và `Proposal.pptx` |

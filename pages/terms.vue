<script setup lang="ts">
/** SC-09 Dieu khoan su dung. */
useHead({ title: 'Điều khoản sử dụng — AOYAMA Service' });
</script>

<template>
  <article class="prose-ay flex max-w-prose flex-col gap-4">
    <AyPageHeader code="SC-09" title="Điều khoản sử dụng" />

    <section class="card flex flex-col gap-3 text-[14px] leading-relaxed">
      <h2 class="font-heading text-[16px]">1. Phạm vi áp dụng</h2>
      <p>
        Điều khoản này áp dụng cho việc sử dụng dịch vụ đặt lịch bảo dưỡng và sửa chữa xe máy trực
        tuyến của chuỗi cửa hàng AOYAMA thuộc Mobility Enshu Railway.
      </p>

      <h2 class="font-heading text-[16px]">2. Đặt lịch và hủy lịch</h2>
      <p>
        Lịch hẹn chỉ có hiệu lực sau khi cửa hàng xác nhận. Bạn có thể hủy hoặc đổi lịch trực tuyến
        đến trước giờ hẹn tối thiểu 2 tiếng; sau mốc đó vui lòng liên hệ trực tiếp cửa hàng.
      </p>

      <h2 class="font-heading text-[16px]">3. Báo giá và thanh toán</h2>
      <p>
        Mọi hạng mục phát sinh ngoài nội dung đã đặt đều được báo giá và chỉ thực hiện sau khi bạn
        đồng ý. Giai đoạn hiện tại chỉ thanh toán tại cửa hàng.
      </p>

      <h2 class="font-heading text-[16px]">4. Kết quả gợi ý của trí tuệ nhân tạo</h2>
      <p>
        Kết quả chẩn đoán do trợ lý AI đưa ra chỉ mang tính tham khảo, kèm mức độ khớp ước lượng.
        Kết luận cuối cùng luôn do kỹ thuật viên đưa ra sau khi kiểm tra xe thực tế.
      </p>

      <h2 class="font-heading text-[16px]">5. Trách nhiệm của người dùng</h2>
      <p>
        Bạn chịu trách nhiệm về tính chính xác của thông tin cung cấp, bao gồm số điện thoại nhận
        thông báo và thông tin phương tiện.
      </p>
    </section>

    <p class="text-[12.5px] text-muted">
      Xem thêm <NuxtLink to="/privacy" class="underline">Chính sách dữ liệu</NuxtLink>.
    </p>
  </article>
</template>

<script setup lang="ts">
/** SC-09 Chinh sach du lieu — NFR-SE-11. */
useHead({ title: 'Chính sách dữ liệu — AOYAMA Service' });
</script>

<template>
  <article class="flex max-w-prose flex-col gap-4">
    <AyPageHeader code="SC-09" title="Chính sách dữ liệu cá nhân" />

    <section class="ay-card flex flex-col gap-3 text-[14px] leading-relaxed">
      <h2 class="font-heading text-[16px]">1. Dữ liệu chúng tôi thu thập</h2>
      <p>
        Họ tên, số điện thoại, email (nếu có), thông tin phương tiện, lịch sử dịch vụ, và nội dung
        bạn gửi cho trợ lý AI gồm văn bản, ảnh và ghi âm.
      </p>

      <h2 class="font-heading text-[16px]">2. Mục đích sử dụng</h2>
      <p>
        Xác nhận và nhắc lịch hẹn, thực hiện dịch vụ, lưu lịch sử bảo dưỡng của xe, và cải thiện
        chất lượng phục vụ. Chúng tôi không bán dữ liệu cho bên thứ ba.
      </p>

      <h2 class="font-heading text-[16px]">3. Ảnh và ghi âm gửi cho trợ lý AI</h2>
      <p>
        Ảnh và ghi âm chỉ dùng cho đúng phiên chẩn đoán tương ứng và được xóa tự động sau thời hạn
        lưu trữ do cửa hàng cấu hình (mặc định 30 ngày).
      </p>

      <h2 class="font-heading text-[16px]">4. Quyền của bạn</h2>
      <p>
        Bạn có thể yêu cầu xem, chỉnh sửa hoặc xóa dữ liệu cá nhân của mình bằng cách liên hệ cửa
        hàng. Một số dữ liệu liên quan tới hồ sơ dịch vụ đã hoàn tất được giữ lại theo yêu cầu quản
        lý chất lượng.
      </p>

      <h2 class="font-heading text-[16px]">5. Thông báo SMS và email</h2>
      <p>
        Bạn có thể tắt nhận thông báo trong phần cài đặt tài khoản. Tin nhắn xác nhận lịch hẹn vẫn
        được gửi vì đây là thông tin cần thiết cho giao dịch.
      </p>
    </section>
  </article>
</template>

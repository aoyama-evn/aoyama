<script setup lang="ts">
/** CP-02 Chan trang site khach hang. */
const year = new Date().getFullYear();
</script>

<template>
  <footer class="mt-12 border-t border-divider bg-surface ay-safe-bottom">
    <div class="mx-auto grid max-w-content gap-6 px-4 py-8 sm:grid-cols-3">
      <div>
        <p class="font-heading text-[15px] text-accent-700">AOYAMA Service</p>
        <p class="mt-1 text-[12.5px] ay-muted">
          Bảo dưỡng và sửa chữa xe máy — chuỗi cửa hàng AOYAMA, Mobility Enshu Railway.
        </p>
      </div>

      <nav aria-label="Liên kết">
        <p class="mb-2 text-[12.5px] font-semibold">Dịch vụ</p>
        <ul class="flex flex-col gap-1 text-[13px]">
          <li><NuxtLink to="/services" class="hover:underline">Danh sách dịch vụ</NuxtLink></li>
          <li><NuxtLink to="/pricing" class="hover:underline">Bảng giá tham khảo</NuxtLink></li>
          <li><NuxtLink to="/booking/lookup" class="hover:underline">Tra cứu lịch hẹn</NuxtLink></li>
          <li><NuxtLink to="/stores" class="hover:underline">Cửa hàng</NuxtLink></li>
        </ul>
      </nav>

      <nav aria-label="Chính sách">
        <p class="mb-2 text-[12.5px] font-semibold">Thông tin</p>
        <ul class="flex flex-col gap-1 text-[13px]">
          <li><NuxtLink to="/faq" class="hover:underline">Câu hỏi thường gặp</NuxtLink></li>
          <li><NuxtLink to="/contact" class="hover:underline">Liên hệ</NuxtLink></li>
          <li><NuxtLink to="/terms" class="hover:underline">Điều khoản sử dụng</NuxtLink></li>
          <li><NuxtLink to="/privacy" class="hover:underline">Chính sách dữ liệu</NuxtLink></li>
        </ul>
      </nav>
    </div>

    <p class="border-t border-divider px-4 py-4 text-center text-[11.5px] ay-muted">
      © {{ year }} 遠鉄グループ AOYAMA. All Rights Reserved.
    </p>
  </footer>
</template>

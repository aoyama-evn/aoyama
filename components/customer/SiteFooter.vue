<script setup lang="ts">
/**
 * CP-02 Chan trang site khach hang.
 * Ban thiet ke chi de mot dong ban quyen ngan o cuoi moi man hinh, khong co
 * khoi lien ket nhieu cot.
 */
const year = new Date().getFullYear();
</script>

<template>
  <footer class="sp-shell px-4 pb-6 ay-safe-bottom">
    <div
      class="pt-2.5 text-center text-[11px] leading-relaxed text-muted"
      style="border-top: 1px solid var(--color-divider)"
    >
      <nav class="mb-1.5 flex flex-wrap justify-center gap-x-3 gap-y-1">
        <NuxtLink to="/services">Dịch vụ</NuxtLink>
        <NuxtLink to="/stores">Cửa hàng</NuxtLink>
        <NuxtLink to="/booking/lookup">Tra cứu lịch hẹn</NuxtLink>
        <NuxtLink to="/faq">Hỏi đáp</NuxtLink>
        <NuxtLink to="/terms">Điều khoản</NuxtLink>
        <NuxtLink to="/privacy">Dữ liệu</NuxtLink>
      </nav>
      © {{ year }} 遠鉄のリフォーム All Rights Reserved.
    </div>
  </footer>
</template>

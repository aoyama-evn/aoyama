<script setup lang="ts">
/** SY-02 Khong co quyen truy cap. */
definePageMeta({ layout: 'blank' });
useHead({ title: 'Không có quyền truy cập' });
</script>

<template>
  <div class="grid min-h-screen place-items-center bg-neutral-200 px-4">
    <div class="card w-full max-w-md text-center">
      <p class="font-heading text-[56px] leading-none text-accent-300">403</p>
      <h1 class="mt-2 font-heading text-[20px]">Không có quyền truy cập</h1>
      <p class="mt-2 text-[13.5px] text-muted">
        Tài khoản của bạn không được phép xem nội dung này. Nếu cần quyền, hãy liên hệ quản trị viên.
      </p>
      <div class="mt-5 flex justify-center gap-2">
        <AyButton to="/" variant="secondary" size="sm">Về trang chủ</AyButton>
        <AyButton to="/admin" size="sm">Về trang quản trị</AyButton>
      </div>
    </div>
  </div>
</template>

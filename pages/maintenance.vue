<script setup lang="ts">
/** SY-04 Dang bao tri. */
definePageMeta({ layout: 'blank' });
useHead({ title: 'Hệ thống đang bảo trì' });
</script>

<template>
  <div class="grid min-h-screen place-items-center bg-neutral-200 px-4">
    <div class="card w-full max-w-md text-center">
      <p class="text-[40px]" aria-hidden="true">🛠</p>
      <h1 class="mt-2 font-heading text-[20px]">Hệ thống đang bảo trì</h1>
      <p class="mt-2 text-[13.5px] text-muted">
        Chúng tôi đang nâng cấp hệ thống và sẽ trở lại trong thời gian sớm nhất.
        Trong lúc này, bạn có thể gọi trực tiếp cửa hàng để đặt lịch.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app';

/** SY-01 404, SY-03 500 — man hinh loi dung chung. */
const props = defineProps<{ error: NuxtError }>();

const is404 = computed(() => props.error?.statusCode === 404);

const title = computed(() => (is404.value ? 'Không tìm thấy trang' : 'Hệ thống gặp sự cố'));
const hint = computed(() =>
  is404.value
    ? 'Đường dẫn có thể đã thay đổi hoặc nội dung đã được gỡ.'
    : 'Chúng tôi đã ghi nhận lỗi này. Vui lòng thử lại sau ít phút hoặc gọi cửa hàng.',
);
</script>

<template>
  <div class="grid min-h-screen place-items-center bg-neutral-200 px-4">
    <div class="ay-card w-full max-w-md text-center">
      <p class="font-heading text-[56px] leading-none text-accent-300">
        {{ error?.statusCode ?? 500 }}
      </p>
      <h1 class="mt-2 font-heading text-[20px]">{{ title }}</h1>
      <p class="mt-2 text-[13.5px] ay-muted">{{ hint }}</p>
      <div class="mt-5 flex justify-center gap-2">
        <AyButton variant="secondary" size="sm" @click="clearError({ redirect: '/' })">
          Về trang chủ
        </AyButton>
        <AyButton v-if="!is404" size="sm" @click="clearError()">Thử lại</AyButton>
      </div>
    </div>
  </div>
</template>

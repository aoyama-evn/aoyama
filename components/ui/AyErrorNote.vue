<script setup lang="ts">
import type { ApiError } from '~/types/models';

/** Hien loi tra ve tu API ngay tai cho thao tac, kem ma loi de bao ho tro. */
defineProps<{ error: ApiError | null }>();
</script>

<template>
  <div
    v-if="error"
    class="flex items-start gap-2 rounded-xl bg-danger-bg px-3 py-2.5 text-[13.5px] text-danger"
    role="alert"
  >
    <span aria-hidden="true">!</span>
    <div>
      <p class="font-semibold">{{ error.message }}</p>
      <p class="text-[11.5px] opacity-80">Mã lỗi: {{ error.code }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
/** CP-09 Thong bao ket qua thao tac — tu an sau 5 giay (8 giay voi loi). */
const ui = useUiStore();

const TONE: Record<string, string> = {
  success: 'bg-success-bg text-success border-success',
  warning: 'bg-warning-bg text-warning border-warning',
  error: 'bg-danger-bg text-danger border-danger',
  info: 'bg-info-bg text-info border-info',
};
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center gap-2 px-4 pt-4 ay-safe-top"
    role="status"
    aria-live="polite"
  >
    <TransitionGroup name="ay-toast">
      <div
        v-for="toast in ui.toasts"
        :key="toast.id"
        class="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border-l-4 px-4 py-3 shadow-card"
        :class="TONE[toast.type]"
      >
        <div class="flex-1">
          <p class="text-[14px] font-semibold">{{ toast.message }}</p>
          <p v-if="toast.detail" class="mt-0.5 text-[12.5px] opacity-90">{{ toast.detail }}</p>
        </div>
        <button
          type="button"
          class="text-[18px] leading-none opacity-60 hover:opacity-100"
          aria-label="Đóng thông báo"
          @click="ui.dismiss(toast.id)"
        >
          ×
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.ay-toast-enter-active,
.ay-toast-leave-active {
  transition: all 0.2s ease;
}
.ay-toast-enter-from,
.ay-toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>

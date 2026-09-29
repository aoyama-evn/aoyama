<script setup lang="ts">
/**
 * CP-09 Thong bao ket qua thao tac — tu an sau 5 giay (8 giay voi loi).
 *
 * Ban thiet ke ve thong bao thanh mot vien thuoc nen toi noi len o day man
 * hinh, kem mot bieu tuong nho. NFR-UX-09 — khong dua vao mau khong: bieu
 * tuong va chu deu noi ro ket qua.
 */
const ui = useUiStore();
const overlayTarget = useOverlayTarget();

/** Mau cua bieu tuong doi theo loai, con vien thuoc thi luon toi. */
const ICON_COLOR: Record<string, string> = {
  success: 'var(--color-accent-300)',
  info: 'var(--color-accent-300)',
  warning: 'var(--color-warning)',
  error: 'var(--color-danger)',
};

/** Duong ve cua bieu tuong cho tung loai thong bao. */
const ICON_PATH: Record<string, string> = {
  success: 'M4 12.5 9.5 18 20 6.5',
  info: 'M12 8h.01M11 12h1v5h1',
  warning: 'M12 8v5M12 17h.01M10.3 4.2 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z',
  error: 'M12 7v6M12 17h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z',
};
</script>

<template>
  <Teleport :to="overlayTarget">
    <div
      class="ay-toast-host pointer-events-none z-[70] flex flex-col items-center gap-2 px-4"
      role="status"
      aria-live="polite"
    >
      <TransitionGroup name="ay-toast">
        <div
          v-for="toast in ui.toasts"
          :key="toast.id"
          class="ay-toast pointer-events-auto"
        >
          <svg
            width="15" height="15" viewBox="0 0 24 24" fill="none"
            :stroke="ICON_COLOR[toast.type]" stroke-width="2.75" stroke-linecap="round"
            stroke-linejoin="round" class="mt-0.5 flex-none" aria-hidden="true"
          >
            <path :d="ICON_PATH[toast.type]" />
          </svg>

          <div class="min-w-0">
            <p class="text-[13px]">{{ toast.message }}</p>
            <p v-if="toast.detail" class="text-[11.5px] opacity-75">{{ toast.detail }}</p>
          </div>

          <button
            type="button"
            class="ml-1 flex-none text-[15px] leading-none opacity-60 hover:opacity-100"
            :aria-label="$t('ui.closeToast')"
            @click="ui.dismiss(toast.id)"
          >
            ✕
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
/**
 * Vi tri: absolute khi nam trong khung dien thoai (bo cuc khach hang), fixed
 * khi dua thang vao body (trang quan tri).
 *
 * Luat thu hai phai boc TRON selector trong :global(). Neu chi boc ve trai —
 * :global(.ay-device-screen) .ay-toast-host — trinh bien dich scoped cua Vue
 * cat bo phan con lai va phat ra ".ay-device-screen { position: absolute }",
 * bien ca khung dien thoai thanh absolute lam khung sap con moi phan padding.
 */
.ay-toast-host {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 30px;
}
:global(.ay-device-screen .ay-toast-host) {
  position: absolute;
}

.ay-toast {
  display: flex;
  max-width: 100%;
  align-items: flex-start;
  gap: 8px;
  border-radius: 999px;
  background: var(--color-neutral-900);
  padding: 10px 18px;
  color: var(--color-neutral-100);
  box-shadow: var(--shadow-md);
}

.ay-toast-enter-active,
.ay-toast-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.ay-toast-enter-from,
.ay-toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>

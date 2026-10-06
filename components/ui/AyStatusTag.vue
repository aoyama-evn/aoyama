<script setup lang="ts">
/**
 * CP-10 Nhan trang thai.
 * NFR-UX-09 — khong dua vao mau khong: moi trang thai deu co chu, va mau chi
 * la thong tin bo tro cho nguoi phan biet mau kem.
 */
const props = defineProps<{
  status: string;
  kind?: 'booking' | 'workOrder' | 'quotation' | 'payment' | 'notification';
}>();

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent';

const { t, te } = useI18n();

const TONES: Record<string, Tone> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  RECEIVED: 'accent',
  DONE: 'success',
  CANCELLED: 'neutral',
  NO_SHOW: 'danger',
  DIAGNOSING: 'info',
  DIAGNOSED: 'info',
  QUOTED: 'warning',
  QUOTING: 'warning',
  QUOTE_ACCEPTED: 'info',
  IN_PROGRESS: 'accent',
  COMPLETED: 'warning',
  DELIVERED: 'success',
  DRAFT: 'neutral',
  SENT: 'info',
  ACCEPTED: 'success',
  REJECTED: 'danger',
  SUPERSEDED: 'neutral',
  UNPAID: 'danger',
  PARTIAL: 'warning',
  PAID: 'success',
  QUEUED: 'neutral',
  FAILED: 'danger',
};

const TONE_CLASS: Record<Tone, string> = {
  neutral: 'tag-neutral',
  info: 'tag-accent-2',
  success: 'tag-success',
  warning: 'tag-accent',
  danger: 'tag-danger',
  accent: 'tag-accent',
};

/** Chu hien ra lay tu tep ngon ngu; trang thai la khoa dung chung ba thu tieng. */
const label = computed(() =>
  te(`status.${props.status}`) ? t(`status.${props.status}`) : props.status,
);
const toneClass = computed(() => TONE_CLASS[TONES[props.status] ?? 'neutral']);
</script>

<template>
  <!-- whitespace-nowrap: nhan trang thai chi vai chu, vo lam hai dong thi xau. -->
  <span class="tag whitespace-nowrap" :class="toneClass">
    <span
      class="h-1.5 w-1.5 rounded-full bg-current opacity-70"
      aria-hidden="true"
    />
    {{ label }}
  </span>
</template>

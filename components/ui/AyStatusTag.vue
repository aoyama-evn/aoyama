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

const LABELS: Record<string, string> = {
  // Lich hen — RD muc 5.1
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  RECEIVED: 'Đã tiếp nhận',
  DONE: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
  NO_SHOW: 'Khách không đến',
  // Phiếu dịch vụ — RD muc 5.2
  DIAGNOSING: 'Đang chẩn đoán',
  QUOTED: 'Chờ duyệt báo giá',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Hoàn tất',
  DELIVERED: 'Đã bàn giao',
  // Bao gia — RD muc 5.3
  DRAFT: 'Nháp',
  SENT: 'Đã gửi',
  ACCEPTED: 'Đã đồng ý',
  REJECTED: 'Đã từ chối',
  SUPERSEDED: 'Đã thay thế',
  // Thanh toan
  UNPAID: 'Chưa thanh toán',
  PARTIAL: 'Thanh toán một phần',
  PAID: 'Đã thanh toán',
  // Thong bao
  QUEUED: 'Chờ gửi',
  FAILED: 'Gửi lỗi',
};

const TONES: Record<string, Tone> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  RECEIVED: 'accent',
  DONE: 'success',
  CANCELLED: 'neutral',
  NO_SHOW: 'danger',
  DIAGNOSING: 'info',
  QUOTED: 'warning',
  IN_PROGRESS: 'accent',
  COMPLETED: 'success',
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
  neutral: 'bg-neutral-200 text-neutral-700',
  info: 'bg-info-bg text-info',
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  accent: 'bg-accent-200 text-accent-800',
};

const label = computed(() => LABELS[props.status] ?? props.status);
const toneClass = computed(() => TONE_CLASS[TONES[props.status] ?? 'neutral']);
</script>

<template>
  <span class="ay-tag" :class="toneClass">
    <span
      class="h-1.5 w-1.5 rounded-full bg-current opacity-70"
      aria-hidden="true"
    />
    {{ label }}
  </span>
</template>

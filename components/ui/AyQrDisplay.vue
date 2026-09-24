<script setup lang="ts">
/**
 * CP-17 Hien thi ma QR — SC-22.
 * Luon kem ma lich hen dang chu de le tan nhap tay khi camera khong doc duoc
 * (FR-QR-08) va de khach doc qua dien thoai.
 */
defineProps<{ dataUrl: string | null; code: string; available: boolean; message?: string }>();
</script>

<template>
  <div class="ay-card flex flex-col items-center gap-3 text-center">
    <template v-if="available && dataUrl">
      <img :src="dataUrl" alt="Mã QR lịch hẹn" class="h-56 w-56 rounded-xl bg-white p-2">
      <div>
        <p class="text-[12.5px] ay-muted">Mã lịch hẹn</p>
        <p class="select-all font-heading text-[22px] tracking-widest">{{ code }}</p>
      </div>
      <p class="max-w-prose text-[12.5px] ay-muted">
        Đưa mã này cho nhân viên khi đến cửa hàng. Nếu máy không quét được, đọc mã chữ ở trên.
      </p>
    </template>

    <AyEmptyState
      v-else
      title="Chưa có mã QR"
      :hint="message ?? 'Mã QR được tạo sau khi cửa hàng xác nhận lịch hẹn của bạn.'"
    />
  </div>
</template>

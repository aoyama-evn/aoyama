<script setup lang="ts">
/**
 * CP-17 Hien thi ma QR — SC-22.
 * Luon kem ma lich hen dang chu de le tan nhap tay khi camera khong doc duoc
 * (FR-QR-08) va de khach doc qua dien thoai.
 */
defineProps<{ dataUrl: string | null; code: string; available: boolean; message?: string }>();
</script>

<template>
  <div class="card flex flex-col items-center gap-3 text-center">
    <template v-if="available && dataUrl">
      <img :src="dataUrl" :alt="$t('qr.alt')" class="h-56 w-56 rounded-xl bg-white p-2">
      <div>
        <p class="text-[12.5px] text-muted">{{ $t('sc16.codeLabel') }}</p>
        <p class="select-all font-heading text-[22px] tracking-widest">{{ code }}</p>
      </div>
      <p class="max-w-prose text-[12.5px] text-muted">
        {{ $t('qr.hint') }}
      </p>
    </template>

    <AyEmptyState
      v-else
      :title="$t('sc22.noQrTitle')"
      :hint="message ?? $t('sc22.noQrLead')"
    />
  </div>
</template>

<script setup lang="ts">
/** CP-08 Hop thoai xac nhan — NFR-UX-08, bat buoc voi moi hanh dong khong hoan tac. */
const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    loading?: boolean;
    /** Buoc go dung chuoi nay de xac nhan — dung cho thao tac rat nguy hiem. */
    confirmPhrase?: string;
    /** Lop phu chi de xem, khong co lua chon nao de bo — vi du o xem ma QR. */
    hideCancel?: boolean;
  }>(),
  { confirmLabel: 'Xác nhận', cancelLabel: 'Hủy bỏ' },
);

const emit = defineEmits<{ (e: 'confirm'): void; (e: 'cancel'): void }>();

const typed = ref('');
const canConfirm = computed(() => !props.confirmPhrase || typed.value.trim() === props.confirmPhrase);

watch(() => props.open, (open) => { if (open) typed.value = ''; });
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      @click.self="emit('cancel')"
    >
      <div class="card w-full max-w-md">
        <h3 class="font-heading text-[17px]">{{ title }}</h3>
        <p v-if="message" class="mt-2 text-[14px] text-muted">{{ message }}</p>
        <slot />

        <div v-if="confirmPhrase" class="mt-3">
          <label class="label">Gõ <strong>{{ confirmPhrase }}</strong> để xác nhận</label>
          <input v-model="typed" class="input" type="text">
        </div>

        <div class="mt-5 flex justify-end gap-2">
          <AyButton v-if="!hideCancel" variant="secondary" size="sm" @click="emit('cancel')">
            {{ cancelLabel }}
          </AyButton>
          <AyButton
            :variant="danger ? 'danger' : 'primary'"
            size="sm"
            :disabled="!canConfirm"
            :loading="loading"
            @click="emit('confirm')"
          >
            {{ confirmLabel }}
          </AyButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>

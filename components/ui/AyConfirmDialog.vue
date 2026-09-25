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
  {},
);

const emit = defineEmits<{ (e: 'confirm'): void; (e: 'cancel'): void }>();

const { t } = useI18n();
const overlayTarget = useOverlayTarget();

const typed = ref('');
const canConfirm = computed(() => !props.confirmPhrase || typed.value.trim() === props.confirmPhrase);

watch(() => props.open, (open) => { if (open) typed.value = ''; });
</script>

<template>
  <Teleport :to="overlayTarget">
    <div
      v-if="open"
      class="ay-overlay z-50 grid place-items-center px-4"
      style="background: rgb(32 30 29 / 50%)"
      role="dialog"
      aria-modal="true"
      @click.self="emit('cancel')"
    >
      <div class="card w-full max-w-md">
        <h3 class="font-heading text-[17px]">{{ title }}</h3>
        <p v-if="message" class="mt-2 text-[14px] text-muted">{{ message }}</p>
        <slot />

        <div v-if="confirmPhrase" class="mt-3">
          <i18n-t keypath="ui.confirmType" tag="label" class="label">
            <template #phrase><strong>{{ confirmPhrase }}</strong></template>
          </i18n-t>
          <input v-model="typed" class="input" type="text">
        </div>

        <div class="mt-5 flex justify-end gap-2">
          <AyButton v-if="!hideCancel" variant="secondary" size="sm" @click="emit('cancel')">
            {{ cancelLabel ?? t('common.discard') }}
          </AyButton>
          <AyButton
            :variant="danger ? 'danger' : 'primary'"
            size="sm"
            :disabled="!canConfirm"
            :loading="loading"
            @click="emit('confirm')"
          >
            {{ confirmLabel ?? t('common.confirm') }}
          </AyButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>

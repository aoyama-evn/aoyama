<script setup lang="ts">
import type { ApiError, Booking } from '~/types/models';

/**
 * Popup huy lich hen — SC-21, FR-BOOK-13, BR-04.
 *
 * Ban thiet ke (cancelModal) dat viec nay trong mot lop phu ngay tren danh
 * sach: ma lich hen, gio hen, mot dong nhac ma QR se het hieu luc, roi o nhap
 * ly do bang chu. Ly do de trong van huy duoc — no chi de cua hang tham khao.
 *
 * Huy sat gio bi may chu chan theo BR-04; loi hien ngay trong popup va popup
 * o lai de khach doc duoc, khong dong mat.
 */
const props = defineProps<{ open: boolean; booking: Booking | null }>();
const emit = defineEmits<{ (e: 'cancelled', booking: Booking): void; (e: 'close'): void }>();

const api = useApi();
const ui = useUiStore();
const { t } = useI18n();
const { slotRange } = useFormat();
const overlayTarget = useOverlayTarget();

const reason = ref('');
const submitting = ref(false);
const error = ref<ApiError | null>(null);

/** Moi lan mo lai la mot to giay trang, khong giu loi hay ly do cua lan truoc. */
watch(
  () => props.open,
  (open) => {
    if (!open) return;
    reason.value = '';
    error.value = null;
  },
);

async function confirm(): Promise<void> {
  if (!props.booking || submitting.value) return;
  submitting.value = true;
  error.value = null;
  try {
    await api.put(`/bookings/${props.booking.id}/cancel`, {
      reason: reason.value.trim() || undefined,
    });
    ui.success(t('sc24.done'));
    emit('cancelled', props.booking);
  } catch (caught) {
    error.value = normalizeError(caught);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Teleport :to="overlayTarget">
    <div
      v-if="open && booking"
      class="ay-overlay z-50 grid place-items-center px-4"
      style="background: rgb(32 30 29 / 50%)"
      role="dialog"
      aria-modal="true"
      @click.self="emit('close')"
    >
      <form class="card w-full gap-3" style="max-height: 86%; overflow-y: auto" @submit.prevent="confirm">
        <h4>{{ $t('sc24.confirmTitle') }}</h4>

        <div
          class="flex flex-col gap-1 px-3.5 py-3"
          style="background: var(--color-neutral-100); border-radius: 16px"
        >
          <span class="font-heading text-[14px]">{{ booking.code }}</span>
          <span class="text-[13px]">{{ slotRange(booking) }}</span>
          <span class="text-muted text-[11.5px] leading-[1.45]">{{ $t('sc24.qrWarning') }}</span>
        </div>

        <AyField :label="$t('sc24.reasonLabel')" :hint="$t('sc24.reasonHint')">
          <template #default="{ id }">
            <input
              :id="id"
              v-model="reason"
              class="input"
              type="text"
              maxlength="200"
              :placeholder="$t('sc24.reasonPlaceholder')"
            />
          </template>
        </AyField>

        <AyErrorNote :error="error" />

        <div class="flex gap-2">
          <button
            type="button"
            class="btn btn-secondary flex-1"
            style="min-height: 46px; margin: 0"
            :disabled="submitting"
            @click="emit('close')"
          >
            {{ $t('common.close') }}
          </button>
          <button
            type="submit"
            class="btn btn-primary flex-1"
            style="min-height: 46px; margin: 0"
            :disabled="submitting"
          >
            {{ submitting ? $t('common.saving') : $t('common.agree') }}
          </button>
        </div>
      </form>
    </div>
  </Teleport>
</template>

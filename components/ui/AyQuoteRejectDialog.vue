<script setup lang="ts">
import type { ApiError } from '~/types/models';

/**
 * Popup tu choi bao gia — SC-27.
 *
 * Khach khong dong y thi co hai duong rat khac nhau, va truoc day man hinh
 * gop ca hai vao mot nut:
 *
 *   Tu choi  — thoi khong sua nua.
 *   Xem lai  — van muon sua, nhung xin mot ban bao gia khac.
 *
 * Ca hai deu dua ban bao gia ve "da tu choi", nhung viec cua hang phai lam
 * thi nguoc nhau, nen gui kem co requestRevision de nhan vien khong phai
 * doc ly do roi tu doan.
 *
 * O ly do de trong van gui duoc — ep khach giai thich thi nhieu nguoi bo
 * luon, cua hang mat ca tin hieu la khach khong dong y.
 */
const props = defineProps<{ open: boolean; token: string }>();
const emit = defineEmits<{ (e: 'done'): void; (e: 'close'): void }>();

const api = useApi();
const ui = useUiStore();
const { t } = useI18n();
const overlayTarget = useOverlayTarget();

const reason = ref('');
const submitting = ref<'REJECT' | 'REVISION' | null>(null);
const error = ref<ApiError | null>(null);

/** Moi lan mo lai la mot to giay trang. */
watch(
  () => props.open,
  (open) => {
    if (!open) return;
    reason.value = '';
    error.value = null;
  },
);

async function send(mode: 'REJECT' | 'REVISION'): Promise<void> {
  if (submitting.value) return;
  submitting.value = mode;
  error.value = null;
  try {
    await api.post(`/quotations/${props.token}/respond`, {
      accept: false,
      reason: reason.value.trim() || undefined,
      requestRevision: mode === 'REVISION',
    });
    ui.success(mode === 'REVISION' ? t('sc27.revisionSent') : t('sc28.sentReject'), t('sc28.sentSub'));
    emit('done');
  } catch (caught) {
    error.value = normalizeError(caught);
  } finally {
    submitting.value = null;
  }
}
</script>

<template>
  <Teleport :to="overlayTarget">
    <div
      v-if="open"
      class="ay-overlay z-50 grid place-items-center px-4"
      style="background: rgb(32 30 29 / 50%)"
      role="dialog"
      aria-modal="true"
      @click.self="emit('close')"
    >
      <div class="card w-full gap-3" style="max-height: 86%; overflow-y: auto">
        <h4>{{ $t('sc27.rejectTitle') }}</h4>
        <p class="text-muted text-[12.5px] leading-[1.5]">{{ $t('sc27.rejectLead') }}</p>

        <AyField :label="$t('sc28.reasonLabel')" :hint="$t('sc24.reasonHint')">
          <template #default="{ id }">
            <textarea
              :id="id"
              v-model="reason"
              class="input min-h-[80px]"
              maxlength="400"
              :placeholder="$t('sc27.rejectPlaceholder')"
            />
          </template>
        </AyField>

        <AyErrorNote :error="error" />

        <!-- Xin bao gia lai dat truoc: do la duong khach hay chon hon. -->
        <button
          type="button"
          class="btn btn-primary btn-block"
          style="min-height: 46px; margin: 0"
          :disabled="submitting !== null"
          @click="send('REVISION')"
        >
          {{ submitting === 'REVISION' ? $t('common.sending') : $t('sc27.askRevision') }}
        </button>

        <div class="flex gap-2">
          <button
            type="button"
            class="btn btn-secondary flex-1"
            style="min-height: 46px; margin: 0"
            :disabled="submitting !== null"
            @click="emit('close')"
          >
            {{ $t('common.close') }}
          </button>
          <button
            type="button"
            class="btn btn-danger flex-1"
            style="min-height: 46px; margin: 0"
            :disabled="submitting !== null"
            @click="send('REJECT')"
          >
            {{ submitting === 'REJECT' ? $t('common.sending') : $t('sc28.reject') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

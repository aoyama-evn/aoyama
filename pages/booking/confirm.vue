<script setup lang="ts">
import type { ApiError, Booking, Store } from '~/types/models';

/** SC-15 Dat lich — xac nhan. FR-BOOK-09. Bo cuc ba the "Sua" theo ban thiet ke. */
const api = useApi();
const booking = useBookingStore();
const ui = useUiStore();
const auth = useAuthStore();
const { t } = useI18n();
const { i18n, money, dayLabel } = useFormat();

const store = ref<Store | null>(null);
const submitting = ref(false);
const error = ref<ApiError | null>(null);

onMounted(async () => {
  booking.restore();
  if (!booking.step3Complete) {
    await navigateTo('/booking/step3');
    return;
  }
  if (booking.storeId) {
    store.value = await api.get<Store>(`/stores/${booking.storeId}`);
    booking.store = store.value;
  }
});

/** "2026/10/08 (T5) · 09:00 – 10:00" nhu ban thiet ke. */
const slotLabel = computed(() => {
  if (!booking.slot) return '—';
  const [h, m] = booking.slot.startTime.split(':').map(Number);
  const end = h * 60 + m + 60;
  const endText = `${String(Math.floor(end / 60) % 24).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`;
  return `${dayLabel(booking.slot.date)} · ${booking.slot.startTime} – ${endText}`;
});

const estimatedEnd = computed(() => {
  if (!booking.slot || !booking.estimatedMinutes) return null;
  const [h, m] = booking.slot.startTime.split(':').map(Number);
  const total = h * 60 + m + booking.estimatedMinutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
});

async function submit(): Promise<void> {
  submitting.value = true;
  error.value = null;
  try {
    const created = await api.post<Booking>('/bookings', booking.toPayload());
    const code = created.code;
    // Xoa ban nhap ngay sau khi tao thanh cong, tranh dat trung khi bam lai.
    booking.reset();
    await navigateTo(`/booking/done?code=${encodeURIComponent(code)}`);
  } catch (err) {
    error.value = normalizeError(err);
    if (error.value.code === 'SLOT_FULL' || error.value.code === 'SLOT_IN_PAST') {
      ui.warning('Khung giờ vừa hết chỗ', 'Vui lòng chọn khung giờ khác.');
      await navigateTo('/booking/step2');
    }
  } finally {
    submitting.value = false;
  }
}

useHead({ title: 'Đặt lịch — Xác nhận' });
</script>

<template>
  <div class="flex flex-col gap-3 pb-4">
    <div>
      <h4>{{ $t('sc15.title') }}</h4>
      <p class="text-muted text-[12px]">{{ $t('sc15.lead') }}</p>
    </div>

    <div class="card gap-1.5">
      <div class="flex items-baseline justify-between">
        <div class="card-kicker">{{ $t('sc15.service') }}</div>
        <NuxtLink to="/booking/step1" class="btn btn-ghost text-[12px]">{{ $t('sc15.edit') }}</NuxtLink>
      </div>
      <div class="text-[13.5px]">
        {{ booking.selectedServices.map((s) => i18n(s.name)).join(' · ') }}
      </div>
      <div class="text-[11.5px] text-muted">{{ store ? i18n(store.name) : '' }}</div>
    </div>

    <div class="card gap-1.5">
      <div class="flex items-baseline justify-between">
        <div class="card-kicker">{{ $t('sc15.datetime') }}</div>
        <NuxtLink to="/booking/step2" class="btn btn-ghost text-[12px]">{{ $t('sc15.edit') }}</NuxtLink>
      </div>
      <div class="text-[13.5px]">{{ slotLabel }}</div>
      <div v-if="estimatedEnd" class="text-[11.5px] text-muted">
        {{ $t('sc13.estimatedEnd') }} ≈ {{ estimatedEnd }}
      </div>
    </div>

    <div class="card gap-1.5">
      <div class="flex items-baseline justify-between">
        <div class="card-kicker">{{ $t('sc15.customerVehicle') }}</div>
        <NuxtLink to="/booking/step3" class="btn btn-ghost text-[12px]">{{ $t('sc15.edit') }}</NuxtLink>
      </div>
      <div class="text-[13.5px]">{{ booking.contactName }} · {{ booking.contactPhone }}</div>
      <div v-if="booking.vehicle.plateNumber" class="text-[11.5px] text-muted">
        {{ booking.vehicle.maker }} {{ booking.vehicle.model }}
        · {{ booking.vehicle.plateNumber }}
        <template v-if="booking.vehicle.odometer"> · {{ booking.vehicle.odometer }} km</template>
      </div>
      <div
        v-if="booking.symptomDescription"
        class="pt-1.5 text-[12px]"
        style="border-top: 1px solid var(--color-divider)"
      >
        “{{ booking.symptomDescription }}”
        <template v-if="booking.symptomPhotoUrls.length">
          · {{ booking.symptomPhotoUrls.length }} ảnh
        </template>
      </div>
    </div>

    <div
      v-if="auth.isCustomer"
      class="p-3 text-[12.5px] leading-[1.55]"
      style="background: var(--color-accent-2-100); border-radius: 20px; color: var(--color-accent-2-800)"
    >
      {{ $t('sc15.memberNote', { name: booking.contactName }) }}
    </div>

    <div class="flex items-baseline justify-between px-0.5 py-1">
      <span class="text-muted text-[12px]">{{ $t('sc15.totalLabel') }}</span>
      <span class="font-heading text-[23px]">{{ money(booking.estimatedTotal) }}</span>
    </div>

    <AyErrorNote :error="error" />

    <button
      type="button"
      class="btn btn-primary btn-cta"
      style="min-height: 50px"
      :disabled="submitting"
      @click="submit"
    >
      {{ submitting ? $t('sc15.submitting') : $t('sc15.confirm') }}
    </button>

    <NuxtLink to="/" class="btn btn-ghost self-center text-[13px]">{{ $t('sc15.cancel') }}</NuxtLink>

    <p class="text-muted text-center text-[11px]">
      <i18n-t keypath="sc15.terms" tag="span">
        <template #terms><NuxtLink to="/terms">{{ $t('sc15.termsLink') }}</NuxtLink></template>
        <template #privacy>
          <NuxtLink to="/privacy">{{ $t('sc15.privacyLink') }}</NuxtLink>
        </template>
      </i18n-t>
    </p>
  </div>
</template>

<script setup lang="ts">
import type { ApiError, Booking, DayAvailability, ServiceItem, Store } from '~/types/models';

/**
 * SC-23 Cap nhat lich hen — FR-BOOK-14, BR-05, BR-06.
 * Ban thiet ke cho sua ca hang muc, cua hang, ngay gio, so km va ghi chu trong
 * mot lan luu; ly do thay doi la bat buoc.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const api = useApi();
const ui = useUiStore();
const { t } = useI18n();
const { i18n, money, date: fmtDate } = useFormat();

const code = route.params.code as string;

const { data } = await useAsyncData(`resched-${code}`, async () => {
  const [booking, services, stores] = await Promise.all([
    api.get<Booking>(`/bookings/${code}`),
    api.get<ServiceItem[]>('/services'),
    api.get<Store[]>('/stores'),
  ]);
  return { booking, services, stores };
});

const booking = computed(() => data.value?.booking ?? null);

/**
 * Ngay hen theo gio Nhat. scheduledAt la moc UTC nen cat muoi ky tu dau se ra
 * sai ngay voi nhung khung gio som truoc 09:00 gio Nhat.
 */
const currentDate = computed(() =>
  booking.value ? fmtDate(booking.value.scheduledAt, 'yyyy-MM-dd') : '',
);

/**
 * Bieu mau dung ngay lich dang sua lam gia tri ban dau, gan thang luc khoi tao
 * chu khong doi den onMounted. Dat o onMounted thi watcher cua storeId chay
 * xen vao giua va xoa mat khung gio, con AySlotPicker da kip mo lich thang o
 * thang hien tai truoc khi biet lich nay hen vao thang nao.
 */
const days = ref<DayAvailability[]>([]);
const slot = ref<{ date: string; startTime: string } | null>(
  booking.value
    ? { date: currentDate.value, startTime: booking.value.slotStartTime.slice(0, 5) }
    : null,
);
const storeId = ref<string>(booking.value?.storeId ?? '');
const selectedIds = ref<string[]>(
  (booking.value?.services ?? [])
    .map((line) => line.serviceId)
    .filter((id): id is string => Boolean(id)),
);
const odometer = ref<number | null>(booking.value?.vehicle?.currentOdometer ?? null);
const note = ref(booking.value?.symptomDescription ?? '');
const reason = ref('');
const loading = ref(true);
const submitting = ref(false);
const error = ref<ApiError | null>(null);
const reasonError = ref<string | null>(null);

async function loadAvailability(): Promise<void> {
  if (!storeId.value) return;
  loading.value = true;
  try {
    days.value = await api.get<DayAvailability[]>('/bookings/availability', {
      storeId: storeId.value,
      from: new Date().toISOString().slice(0, 10),
      days: 45,
    });
  } finally {
    loading.value = false;
  }
}

onMounted(loadAvailability);

watch(storeId, () => {
  slot.value = null;
  void loadAvailability();
});

function toggle(id: string): void {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter((x) => x !== id)
    : [...selectedIds.value, id];
}

async function submit(): Promise<void> {
  const current = booking.value;
  if (!current) return;

  reasonError.value = null;
  if (!reason.value.trim()) {
    reasonError.value = t('sc23.reasonRequired');
    return;
  }
  if (selectedIds.value.length === 0) {
    error.value = {
      statusCode: 400,
      code: 'NO_SERVICE',
      message: t('sc23.needService'),
    };
    return;
  }

  submitting.value = true;
  error.value = null;
  try {
    await api.put(`/bookings/${current.id}/reschedule`, {
      date: slot.value?.date ?? currentDate.value,
      startTime: slot.value?.startTime ?? current.slotStartTime.slice(0, 5),
      storeId: storeId.value,
      serviceIds: selectedIds.value,
      odometer: odometer.value ?? undefined,
      symptomDescription: note.value,
      reason: reason.value.trim(),
    });
    ui.success(t('common.saved'), t('sc23.savedSub'));
    await navigateTo('/account/bookings');
  } catch (caught) {
    error.value = normalizeError(caught);
  } finally {
    submitting.value = false;
  }
}

useHead({ title: () => t('sc23.title', { code }) });
</script>

<template>
  <div v-if="booking" class="flex flex-col gap-3.5 pb-4 pt-1">
    <div class="flex flex-wrap items-center justify-between gap-2.5">
      <div>
        <p class="text-muted text-[11px]">{{ $t('sc23.updating') }}</p>
        <p class="font-heading text-[18px]">{{ booking.code }}</p>
      </div>
      <AyStatusTag :status="booking.status" />
    </div>

    <section class="flex flex-col gap-2.5">
      <h5>{{ $t('sc23.services') }}</h5>
      <label
        v-for="service in data?.services ?? []"
        :key="service.id"
        class="flex cursor-pointer items-start gap-[11px] px-3.5 py-3"
        style="border-radius: 20px"
        :style="
          selectedIds.includes(service.id)
            ? 'background: var(--color-surface)'
            : 'background: var(--color-neutral-100)'
        "
      >
        <input
          type="checkbox"
          class="mt-[3px] h-4 w-4 flex-none"
          style="accent-color: var(--color-accent)"
          :checked="selectedIds.includes(service.id)"
          @change="toggle(service.id)"
        />
        <span class="min-w-0 flex-1">
          <span class="block text-[14px]" :class="selectedIds.includes(service.id) ? 'font-semibold' : ''">
            {{ i18n(service.name) }}
          </span>
          <span class="text-muted block text-[11.5px]">
            {{ $t('common.minutes', { n: service.durationMinutes }) }}
          </span>
        </span>
        <span class="whitespace-nowrap font-heading text-[14px]">
          {{ service.quoteOnly ? $t('common.quoteOnly') : money(service.basePrice) }}
        </span>
      </label>
    </section>

    <AyField for="store" :label="$t('sc23.store')">
      <select id="store" v-model="storeId" class="input">
        <option v-for="store in data?.stores ?? []" :key="store.id" :value="store.id">
          {{ i18n(store.name) }}
        </option>
      </select>
    </AyField>

    <section class="flex flex-col gap-2.5">
      <h5>{{ $t('sc23.dateSlot') }}</h5>
      <AySlotPicker v-model="slot" :days="days" :loading="loading" />
    </section>

    <AyField for="odo" :label="$t('sc14.odometer')">
      <input id="odo" v-model.number="odometer" class="input" type="number" inputmode="numeric" min="0" />
    </AyField>

    <AyField for="note" :label="$t('sc23.noteLabel')">
      <textarea id="note" v-model="note" class="input" style="min-height: 74px" maxlength="1000" />
    </AyField>

    <AyField for="reason" :label="$t('sc23.reasonLabel')" required :error="reasonError ?? undefined">
      <input
        id="reason"
        v-model="reason"
        class="input"
        :placeholder="$t('sc23.reasonPlaceholder')"
      />
    </AyField>

    <AyErrorNote :error="error" />

    <div class="flex flex-wrap gap-2">
      <NuxtLink
        to="/account/bookings"
        class="btn btn-secondary flex-1 text-[14px]"
        style="min-height: 48px; margin: 0"
      >
        {{ $t('common.discard') }}
      </NuxtLink>
      <button
        type="button"
        class="btn btn-primary flex-1 text-[14px]"
        style="min-height: 48px; margin: 0"
        :disabled="submitting"
        @click="submit"
      >
        {{ submitting ? $t('common.saving') : $t('common.saveChanges') }}
      </button>
    </div>
  </div>
</template>

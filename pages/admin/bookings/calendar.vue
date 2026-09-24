<script setup lang="ts">
import type { Booking, Store } from '~/types/models';

/** SA-04 Lich hen dang lich theo ngay hoac tuan — FR-BOOK-21, FR-STO-08. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();
const { i18n, date: fmtDate, clock } = useFormat();

const mode = ref<'DAY' | 'WEEK'>('WEEK');
const anchor = ref(new Date().toISOString().slice(0, 10));

const { data: stores } = await useAsyncData('cal-stores', () => api.get<Store[]>('/admin/stores'));

/** Lich phai gan vao dung mot cua hang — nang luc tiep nhan la cua tung cua hang. */
const storeId = computed(() => ui.activeStoreId ?? stores.value?.[0]?.id ?? null);
const days = computed(() => (mode.value === 'DAY' ? 1 : 7));

const { data: bookings, pending } = await useAsyncData(
  'admin-calendar',
  () =>
    storeId.value
      ? api.get<Booking[]>('/admin/bookings/calendar', {
          storeId: storeId.value,
          from: anchor.value,
          days: days.value,
        })
      : Promise.resolve([]),
  { watch: [storeId, anchor, days] },
);

/** Gom lich theo ngay roi theo khung gio de dung bang luoi. */
const grid = computed(() => {
  const byDate = new Map<string, Map<string, Booking[]>>();
  for (const booking of bookings.value ?? []) {
    const d = fmtDate(booking.scheduledAt, 'yyyy-MM-dd');
    const t = clock(booking.slotStartTime);
    if (!byDate.has(d)) byDate.set(d, new Map());
    const slots = byDate.get(d)!;
    slots.set(t, [...(slots.get(t) ?? []), booking]);
  }
  return byDate;
});

const dateColumns = computed(() =>
  Array.from({ length: days.value }, (_, i) => {
    const d = new Date(`${anchor.value}T12:00:00+09:00`);
    d.setDate(d.getDate() + i);
    return fmtDate(d, 'yyyy-MM-dd');
  }),
);

const slotRows = computed(() => {
  const set = new Set<string>();
  for (const slots of grid.value.values()) for (const t of slots.keys()) set.add(t);
  // Khung gio mac dinh de bang khong trong rong khi chua co lich nao.
  if (set.size === 0) ['09:00', '10:30', '13:00', '14:30', '16:00'].forEach((t) => set.add(t));
  return [...set].sort();
});

function shift(step: number): void {
  const d = new Date(`${anchor.value}T12:00:00+09:00`);
  d.setDate(d.getDate() + step * days.value);
  anchor.value = fmtDate(d, 'yyyy-MM-dd');
}

useHead({ title: 'Lịch hẹn theo ngày — AOYAMA Admin' });
</script>

<template>
  <div class="flex flex-col gap-4">
    <AyPageHeader code="SA-04" title="Lịch hẹn theo ngày / tuần">
      <template #actions>
        <AyButton to="/admin/bookings" variant="secondary" size="sm">Xem danh sách</AyButton>
        <AyButton to="/admin/bookings/new" size="sm">Đặt thay khách</AyButton>
      </template>
    </AyPageHeader>

    <div class="card flex flex-wrap items-center gap-3">
      <div class="flex gap-1">
        <button
          type="button" class="btn text-[12.5px]"
          :class="mode === 'DAY' ? 'btn-primary' : 'btn-secondary'" @click="mode = 'DAY'"
        >
          Ngày
        </button>
        <button
          type="button" class="btn text-[12.5px]"
          :class="mode === 'WEEK' ? 'btn-primary' : 'btn-secondary'" @click="mode = 'WEEK'"
        >
          Tuần
        </button>
      </div>

      <div class="flex items-center gap-2">
        <AyButton variant="secondary" size="sm" @click="shift(-1)">←</AyButton>
        <input v-model="anchor" class="input h-9 min-h-0 w-auto py-1" type="date">
        <AyButton variant="secondary" size="sm" @click="shift(1)">→</AyButton>
      </div>

      <p v-if="!ui.activeStoreId" class="ml-auto text-[12.5px] text-muted">
        Đang xem: {{ i18n(stores?.find((s) => s.id === storeId)?.name ?? null) }}
      </p>
    </div>

    <AyLoading v-if="pending" />

    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th scope="col" class="w-20">Giờ</th>
            <th v-for="d in dateColumns" :key="d" scope="col">
              {{ fmtDate(d, 'MM/dd (EEE)') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="slotTime in slotRows" :key="slotTime">
            <th scope="row" class="whitespace-nowrap px-3 py-2 text-left font-heading text-[13px] tabular-nums">
              {{ slotTime }}
            </th>
            <td v-for="d in dateColumns" :key="`${d}-${slotTime}`" class="align-top">
              <ul class="flex flex-col gap-1">
                <li v-for="booking in grid.get(d)?.get(slotTime) ?? []" :key="booking.id">
                  <NuxtLink
                    :to="`/admin/bookings/${booking.id}`"
                    class="block rounded-lg px-2 py-1.5 text-[12.5px] transition-colors hover:brightness-95"
                    :class="{
                      'bg-warning-bg text-warning': booking.status === 'PENDING',
                      'bg-info-bg text-info': booking.status === 'CONFIRMED',
                      'bg-accent-200 text-accent-800': booking.status === 'RECEIVED',
                      'bg-success-bg text-success': booking.status === 'DONE',
                      'bg-neutral-200 text-neutral-600': booking.status === 'NO_SHOW',
                    }"
                  >
                    <span class="block truncate font-semibold">{{ booking.contactName }}</span>
                    <span class="block truncate opacity-80">
                      {{ booking.vehicle?.plateNumber ?? booking.code }}
                    </span>
                  </NuxtLink>
                </li>
              </ul>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

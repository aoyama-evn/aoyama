<script setup lang="ts">
import type { Booking, Store } from '~/types/models';

/** SA-04 Lich hen dang lich theo ngay hoac tuan — FR-BOOK-21, FR-STO-08. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();
const { t } = useI18n();
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

const total = computed(() => (bookings.value ?? []).length);

/** Ngay hom nay theo gio Nhat Ban — nut "Hom nay" nhay ve day. */
function todayIso(): string {
  return fmtDate(new Date(), 'yyyy-MM-dd');
}

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

useHead({ title: () => `${t('sa04.headTitle')} — AOYAMA Admin` });
</script>

<template>
  <div class="flex flex-col gap-[15px]">
    <AdminStoreBar />

    <AyPageHeader code="SA-04" :title="$t('sa04.title')">
      <template #actions>
        <AyButton to="/admin/bookings" variant="secondary" size="sm">{{ $t('sa04.listCta') }}</AyButton>
        <AyButton to="/admin/bookings/new" size="sm">{{ $t('sa04.newCta') }}</AyButton>
      </template>
    </AyPageHeader>

    <!--
      Thanh dieu khien lich: bo gat ngay/tuan ben trai, dieu huong ngay o giua,
      ten cua hang dang xem day sang phai. Phai ep flex-row vi .card cua he
      thong thiet ke mac dinh la mot cot.
    -->
    <div
      class="card flex-row flex-wrap items-center gap-3"
      style="background: #fff; padding: 11px 14px"
    >
      <div class="seg" role="radiogroup" :aria-label="$t('sa04.range')">
        <label class="seg-opt">
          <input v-model="mode" type="radio" value="DAY" name="calendar-mode" />
          {{ $t('sa04.day') }}
        </label>
        <label class="seg-opt">
          <input v-model="mode" type="radio" value="WEEK" name="calendar-mode" />
          {{ $t('sa04.week') }}
        </label>
      </div>

      <div class="flex items-center gap-1.5">
        <button
          type="button"
          class="btn btn-secondary btn-icon"
          :aria-label="mode === 'WEEK' ? $t('sa04.prevWeek') : $t('sa04.prevDay')"
          @click="shift(-1)"
        >
          ←
        </button>
        <AyDateField v-model="anchor" />
        <button
          type="button"
          class="btn btn-secondary btn-icon"
          :aria-label="mode === 'WEEK' ? $t('sa04.nextWeek') : $t('sa04.nextDay')"
          @click="shift(1)"
        >
          →
        </button>
      </div>

      <button
        type="button"
        class="btn btn-ghost text-[12.5px]"
        @click="anchor = todayIso()"
      >
        {{ $t('sa04.today') }}
      </button>

      <p class="text-muted ml-auto text-[12.5px]">
        <template v-if="ui.activeStoreId">
          {{ i18n(stores?.find((s) => s.id === storeId)?.name ?? null) }}
        </template>
        <template v-else>
          {{
            $t('sa04.viewing', {
              store: i18n(stores?.find((s) => s.id === storeId)?.name ?? null),
            })
          }}
        </template>
        · {{ $t('sa03.countHint', { n: total }) }}
      </p>
    </div>

    <AyLoading v-if="pending" />

    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th scope="col" class="w-20">{{ $t('sa02.colTime') }}</th>
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
                    class="block rounded-sm px-2 py-1.5 text-[12.5px] transition-colors hover:brightness-95"
                    :class="{
                      'bg-accent-200 text-accent-800': booking.status === 'PENDING',
                      'bg-olive-200 text-olive-800': booking.status === 'CONFIRMED',
                      'bg-neutral-300 text-neutral-800': booking.status === 'RECEIVED',
                      'bg-success-bg text-success': booking.status === 'DONE',
                      'bg-neutral-200 text-neutral-600': booking.status === 'NO_SHOW',
                      'bg-danger-bg text-danger': booking.status === 'CANCELLED',
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

<script setup lang="ts">
import type { Store, TimeSlotConfig } from '~/types/models';

/** SA-35 Khung gio va nang luc tiep nhan — FR-STO-05, FR-STO-07, BR-07. */
definePageMeta({ layout: 'admin', middleware: ['admin', 'admin-only'] });

interface SlotRow {
  weekday: number;
  startTime: string;
  endTime: string;
  capacity: number;
  isActive: boolean;
}

const route = useRoute();
const api = useApi();
const ui = useUiStore();
const { t } = useI18n();
const { i18n } = useFormat();

const id = route.params.id as string;
/** Ten bay thu; lay tu tep ngon ngu nen doi theo ngon ngu dang chon. */
const WEEKDAYS = computed(() => [0, 1, 2, 3, 4, 5, 6].map((d) => t(`weekday.${d}`)));

const { data: store } = await useAsyncData(`store-slots-${id}`, () =>
  api.get<Store>(`/admin/stores/${id}`),
);
if (!store.value) {
  throw createError({ statusCode: 404, statusMessage: t('sc06.notFound') });
}

const { data: existing, refresh } = await useAsyncData(`store-slots-list-${id}`, () =>
  api.get<TimeSlotConfig[]>(`/admin/stores/${id}/slots`),
);

const slots = ref<SlotRow[]>(
  (existing.value ?? []).map((s) => ({
    weekday: s.weekday,
    startTime: s.startTime.slice(0, 5),
    endTime: s.endTime.slice(0, 5),
    capacity: s.capacity,
    isActive: s.isActive,
  })),
);

const saving = ref(false);

function addSlot(weekday: number): void {
  const last = slots.value.filter((s) => s.weekday === weekday).at(-1);
  slots.value = [
    ...slots.value,
    {
      weekday,
      startTime: last?.endTime ?? '09:00',
      endTime: addMinutes(last?.endTime ?? '09:00', 90),
      capacity: store.value?.defaultCapacity ?? 3,
      isActive: true,
    },
  ];
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** Sao chep cau hinh cua mot thu sang cac thu con lai — do lap tay 7 lan. */
function copyToAll(weekday: number): void {
  const source = slots.value.filter((s) => s.weekday === weekday);
  if (source.length === 0) {
    ui.warning(t('sa35.nothingToCopy'));
    return;
  }
  const others = slots.value.filter((s) => s.weekday === weekday);
  const copies: SlotRow[] = [];
  for (let day = 0; day < 7; day += 1) {
    if (day === weekday) continue;
    copies.push(...source.map((s) => ({ ...s, weekday: day })));
  }
  slots.value = [...others, ...copies];
  ui.success(t('sa35.copied'));
}

const byWeekday = computed(() =>
  WEEKDAYS.value.map((label, weekday) => ({
    weekday,
    label,
    rows: slots.value.filter((s) => s.weekday === weekday),
  })),
);

async function save(): Promise<void> {
  const invalid = slots.value.find((s) => s.startTime >= s.endTime);
  if (invalid) {
    ui.warning(t('sa35.badRange'));
    return;
  }
  saving.value = true;
  try {
    await api.put(`/admin/stores/${id}/slots`, { slots: slots.value });
    ui.success(t('sa35.saved'));
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  } finally {
    saving.value = false;
  }
}

setScreenTitle(() => t('sa35.headTitle'));
useHead({ title: () => `${t('sa35.headTitle')} — AOYAMA Admin` });
</script>

<template>
  <div v-if="store" class="admin-form admin-form-wide">
    <AyPageHeader
      code="SA-35" :title="$t('sa35.title')" back-to="/admin/stores"
      :description="$t('sa35.lead', { store: i18n(store.name) })"
    >
      <template #actions>
        <AyButton :to="`/admin/stores/${id}/hours`" variant="secondary" size="sm">{{ $t('sa32.hoursCta') }}</AyButton>
      </template>
    </AyPageHeader>

    <section v-for="day in byWeekday" :key="day.weekday" class="card">
      <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 class="font-heading text-[15px]">{{ day.label }}</h2>
        <div class="flex gap-1">
          <AyButton variant="ghost" size="sm" @click="addSlot(day.weekday)">{{ $t('sa35.addSlot') }}</AyButton>
          <AyButton v-if="day.rows.length" variant="ghost" size="sm" @click="copyToAll(day.weekday)">
            {{ $t('sa35.copyAll') }}
          </AyButton>
        </div>
      </div>

      <p v-if="day.rows.length === 0" class="text-[13px] text-muted">
        {{ $t('sa35.noSlots') }}
      </p>

      <ul v-else class="flex flex-col gap-2">
        <li v-for="(slot, index) in day.rows" :key="index" class="flex flex-wrap items-center gap-2">
          <input v-model="slot.startTime" class="input h-10 min-h-0 w-auto py-1" type="time" :aria-label="$t('sa35.startAria')">
          <span class="text-muted">–</span>
          <input v-model="slot.endTime" class="input h-10 min-h-0 w-auto py-1" type="time" :aria-label="$t('sa35.endAria')">

          <label class="flex items-center gap-1.5 text-[13px]">
            <span class="text-muted">{{ $t('sa35.capacity') }}</span>
            <input v-model.number="slot.capacity" class="input h-10 min-h-0 w-20 py-1 text-center" type="number" min="0">
          </label>

          <label class="flex items-center gap-1.5 text-[13px]">
            <input v-model="slot.isActive" type="checkbox" class="h-4 w-4 accent-[var(--color-accent)]">
            {{ $t('sa35.isOpen') }}
          </label>

          <button
            type="button" class="ml-auto text-[12.5px] text-danger underline"
            @click="slots.splice(slots.indexOf(slot), 1)"
          >
            {{ $t('common.delete') }}
          </button>
        </li>
      </ul>
    </section>

    <div class="admin-actions">
      <AyButton to="/admin/stores" variant="secondary">{{ $t('common.cancel') }}</AyButton>
      <AyButton :loading="saving" @click="save">{{ $t('sa35.saveAll') }}</AyButton>
    </div>
  </div>
</template>

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
const { i18n } = useFormat();

const id = route.params.id as string;
const WEEKDAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

const { data: store } = await useAsyncData(`store-slots-${id}`, () =>
  api.get<Store>(`/admin/stores/${id}`),
);
if (!store.value) throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy cửa hàng' });

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
    ui.warning('Thứ này chưa có khung giờ nào để sao chép');
    return;
  }
  const others = slots.value.filter((s) => s.weekday === weekday);
  const copies: SlotRow[] = [];
  for (let day = 0; day < 7; day += 1) {
    if (day === weekday) continue;
    copies.push(...source.map((s) => ({ ...s, weekday: day })));
  }
  slots.value = [...others, ...copies];
  ui.success('Đã sao chép khung giờ sang các thứ còn lại');
}

const byWeekday = computed(() =>
  WEEKDAYS.map((label, weekday) => ({
    weekday,
    label,
    rows: slots.value.filter((s) => s.weekday === weekday),
  })),
);

async function save(): Promise<void> {
  const invalid = slots.value.find((s) => s.startTime >= s.endTime);
  if (invalid) {
    ui.warning('Có khung giờ kết thúc trước hoặc bằng giờ bắt đầu');
    return;
  }
  saving.value = true;
  try {
    await api.put(`/admin/stores/${id}/slots`, { slots: slots.value });
    ui.success('Đã lưu khung giờ');
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  } finally {
    saving.value = false;
  }
}

useHead({ title: 'Khung giờ nhận xe — AOYAMA Admin' });
</script>

<template>
  <div v-if="store" class="mx-auto flex max-w-3xl flex-col gap-4">
    <AyPageHeader
      code="SA-35" title="Khung giờ &amp; năng lực tiếp nhận" back-to="/admin/stores"
      :description="`${i18n(store.name)} — số chỗ là số xe tối đa nhận trong một khung giờ`"
    >
      <template #actions>
        <AyButton :to="`/admin/stores/${id}/hours`" variant="secondary" size="sm">Giờ làm việc</AyButton>
      </template>
    </AyPageHeader>

    <section v-for="day in byWeekday" :key="day.weekday" class="ay-card">
      <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 class="font-heading text-[15px]">{{ day.label }}</h2>
        <div class="flex gap-1">
          <AyButton variant="ghost" size="sm" @click="addSlot(day.weekday)">+ Khung giờ</AyButton>
          <AyButton v-if="day.rows.length" variant="ghost" size="sm" @click="copyToAll(day.weekday)">
            Sao chép sang mọi thứ
          </AyButton>
        </div>
      </div>

      <p v-if="day.rows.length === 0" class="text-[13px] ay-muted">
        Chưa có khung giờ — cửa hàng sẽ không nhận đặt lịch vào thứ này.
      </p>

      <ul v-else class="flex flex-col gap-2">
        <li v-for="(slot, index) in day.rows" :key="index" class="flex flex-wrap items-center gap-2">
          <input v-model="slot.startTime" class="ay-input h-10 min-h-0 w-auto py-1" type="time" aria-label="Giờ bắt đầu">
          <span class="ay-muted">–</span>
          <input v-model="slot.endTime" class="ay-input h-10 min-h-0 w-auto py-1" type="time" aria-label="Giờ kết thúc">

          <label class="flex items-center gap-1.5 text-[13px]">
            <span class="ay-muted">Số chỗ</span>
            <input v-model.number="slot.capacity" class="ay-input h-10 min-h-0 w-20 py-1 text-center" type="number" min="0">
          </label>

          <label class="flex items-center gap-1.5 text-[13px]">
            <input v-model="slot.isActive" type="checkbox" class="h-4 w-4 accent-[var(--color-accent)]">
            Đang mở
          </label>

          <button
            type="button" class="ml-auto text-[12.5px] text-danger underline"
            @click="slots.splice(slots.indexOf(slot), 1)"
          >
            Xóa
          </button>
        </li>
      </ul>
    </section>

    <div class="sticky bottom-0 -mx-4 border-t border-divider bg-surface px-4 py-3">
      <AyButton :loading="saving" @click="save">Lưu toàn bộ khung giờ</AyButton>
    </div>
  </div>
</template>

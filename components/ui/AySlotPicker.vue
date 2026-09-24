<script setup lang="ts">
import type { DayAvailability } from '~/types/models';

/**
 * CP-11 Bo chon ngay va khung gio — SC-13, SC-23, SA-06.
 * Ban thiet ke dung lich thang 7 cot: ngay nghi hien chu NGHI, ngay chon duoc
 * nen surface, ngay dang chon nen accent. Khung gio nam duoi, luoi hai cot,
 * moi o la mot nut radio co cham tron, o het cho hien "DA DAY".
 */
const props = defineProps<{
  days: DayAvailability[];
  modelValue: { date: string; startTime: string } | null;
  loading?: boolean;
}>();
const emit = defineEmits<{
  (e: 'update:modelValue', v: { date: string; startTime: string }): void;
  (e: 'need-range', from: string): void;
}>();

const { date: fmtDate } = useFormat();

const byDate = computed(() => new Map(props.days.map((d) => [d.date, d])));

/** Thang dang xem — mac dinh la thang cua ngay dau tien co du lieu. */
const cursor = ref<{ year: number; month: number } | null>(null);

watch(
  () => props.days,
  (list) => {
    if (cursor.value || list.length === 0) return;
    const first = new Date(`${list[0].date}T12:00:00+09:00`);
    cursor.value = { year: first.getFullYear(), month: first.getMonth() };
  },
  { immediate: true },
);

const monthLabel = computed(() =>
  cursor.value ? `${cursor.value.year}/${String(cursor.value.month + 1).padStart(2, '0')}` : '',
);

/** Luoi bat dau tu Thu Hai, dung thu tu T2..CN nhu ban thiet ke. */
const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

interface Cell {
  key: string;
  date: string | null;
  label: string;
  state: 'blank' | 'past' | 'closed' | 'open' | 'selected' | 'unknown';
}

const cells = computed<Cell[]>(() => {
  if (!cursor.value) return [];
  const { year, month } = cursor.value;
  const first = new Date(Date.UTC(year, month, 1));
  // getUTCDay: 0 = CN. Luoi bat dau T2 nen doi ve 0 = T2.
  const lead = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const out: Cell[] = [];
  for (let i = 0; i < lead; i += 1) {
    out.push({ key: `blank-${i}`, date: null, label: '', state: 'blank' });
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const day = byDate.value.get(iso);
    let state: Cell['state'] = 'unknown';
    if (day) {
      if (day.isHoliday || day.isClosed) state = 'closed';
      else if (day.slots.some((s) => s.available)) state = 'open';
      else state = 'past';
    }
    if (props.modelValue?.date === iso) state = 'selected';
    out.push({ key: iso, date: iso, label: String(d), state });
  }
  return out;
});

/** Ngay dang xem khung gio: ngay da chon, khong thi ngay dau tien con cho. */
const activeDate = ref<string | null>(null);

watch(
  () => [props.days, props.modelValue] as const,
  () => {
    if (props.modelValue) {
      activeDate.value = props.modelValue.date;
      return;
    }
    if (!activeDate.value) {
      activeDate.value = props.days.find((d) => d.slots.some((s) => s.available))?.date ?? null;
    }
  },
  { immediate: true, deep: true },
);

const activeDay = computed(() => (activeDate.value ? byDate.value.get(activeDate.value) : null));

function pickDate(cell: Cell): void {
  if (!cell.date || cell.state === 'blank' || cell.state === 'closed') return;
  activeDate.value = cell.date;
}

function shiftMonth(step: number): void {
  if (!cursor.value) return;
  const next = new Date(Date.UTC(cursor.value.year, cursor.value.month + step, 1));
  cursor.value = { year: next.getUTCFullYear(), month: next.getUTCMonth() };
  emit('need-range', `${cursor.value.year}-${String(cursor.value.month + 1).padStart(2, '0')}-01`);
}

const CELL_STYLE: Record<Cell['state'], string> = {
  blank: '',
  past: 'color: var(--color-neutral-400)',
  unknown: 'color: var(--color-neutral-400)',
  closed: 'background: var(--color-neutral-200); color: var(--color-neutral-500)',
  open: 'background: var(--color-surface)',
  selected: 'background: var(--color-accent); color: var(--color-bg); font-weight: 700',
};
</script>

<template>
  <div class="flex flex-col gap-3.5">
    <div v-if="loading" class="card text-center text-muted">Đang tải lịch trống…</div>

    <AyEmptyState
      v-else-if="days.length === 0"
      title="Không có ngày nào nhận xe trong khoảng này"
      hint="Cửa hàng có thể đang nghỉ. Hãy chọn cửa hàng khác hoặc gọi trực tiếp."
    />

    <template v-else>
      <!-- Dieu huong thang -->
      <div class="flex items-center justify-between">
        <button type="button" class="btn btn-secondary btn-icon" aria-label="Tháng trước" @click="shiftMonth(-1)">
          ‹
        </button>
        <h5>{{ monthLabel }}</h5>
        <button type="button" class="btn btn-secondary btn-icon" aria-label="Tháng sau" @click="shiftMonth(1)">
          ›
        </button>
      </div>

      <!-- Luoi ngay -->
      <div class="grid grid-cols-7 gap-1.5 text-center">
        <span v-for="w in WEEKDAYS" :key="w" class="text-[10px] text-muted">{{ w }}</span>

        <template v-for="cell in cells" :key="cell.key">
          <span v-if="cell.state === 'blank'" />
          <button
            v-else
            type="button"
            class="py-2 text-[13px]"
            style="border-radius: 14px"
            :style="CELL_STYLE[cell.state]"
            :disabled="cell.state === 'closed' || cell.state === 'past' || cell.state === 'unknown'"
            :aria-pressed="cell.state === 'selected'"
            :aria-label="`Ngày ${cell.label}`"
            @click="pickDate(cell)"
          >
            <template v-if="cell.state === 'closed'">
              <span class="text-[10px] font-semibold">NGHỈ</span>
            </template>
            <template v-else>{{ cell.label }}</template>
          </button>
        </template>
      </div>

      <!-- Khung gio cua ngay dang chon -->
      <div v-if="activeDay">
        <h5 class="mb-2.5">Khung giờ — {{ fmtDate(activeDay.date, 'yyyy/MM/dd (EEE)') }}</h5>

        <div class="grid grid-cols-2 gap-2">
          <template v-for="slot in activeDay.slots" :key="slot.startTime">
            <label
              v-if="slot.available"
              class="radio gap-2.5 px-3.5 py-2.5"
              style="border-radius: 18px; min-height: 46px"
              :style="
                modelValue?.date === activeDay.date && modelValue?.startTime === slot.startTime
                  ? 'background: var(--color-accent-200)'
                  : 'background: var(--color-surface)'
              "
            >
              <input
                type="radio"
                name="ay-slot"
                :checked="modelValue?.date === activeDay.date && modelValue?.startTime === slot.startTime"
                @change="emit('update:modelValue', { date: activeDay.date, startTime: slot.startTime })"
              >
              <span class="dot" />
              <span>
                <span class="block text-[14px] font-semibold">
                  {{ slot.startTime }} – {{ slot.endTime }}
                </span>
                <span class="block text-[10.5px] text-muted">còn {{ slot.remaining }} chỗ</span>
              </span>
            </label>

            <div
              v-else
              class="flex flex-col justify-center px-3.5 py-2.5"
              style="
                background: var(--color-neutral-200);
                border-radius: 18px;
                min-height: 46px;
                color: var(--color-neutral-500);
              "
            >
              <span class="text-[14px]">{{ slot.startTime }} – {{ slot.endTime }}</span>
              <span class="text-[10.5px] font-bold" style="letter-spacing: 0.06em">
                {{ slot.reason === 'PAST' ? 'ĐÃ QUA' : slot.reason === 'CLOSED' ? 'NGHỈ' : 'ĐÃ ĐẦY' }}
              </span>
            </div>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

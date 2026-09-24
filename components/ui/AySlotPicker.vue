<script setup lang="ts">
import type { DayAvailability } from '~/types/models';

/**
 * CP-11 Bo chon ngay va khung gio — SC-13, SC-23, SA-06.
 * An ngay nghi, hien so cho con lai, va noi ro ly do khi khung gio khong chon duoc.
 */
const props = defineProps<{
  days: DayAvailability[];
  modelValue: { date: string; startTime: string } | null;
  loading?: boolean;
}>();
const emit = defineEmits<{ (e: 'update:modelValue', v: { date: string; startTime: string }): void }>();

const { date: fmtDate } = useFormat();

const openDays = computed(() => props.days.filter((d) => !d.isHoliday && !d.isClosed));
const activeDate = ref<string | null>(null);

watch(
  openDays,
  (list) => {
    if (!activeDate.value && list.length > 0) activeDate.value = list[0].date;
  },
  { immediate: true },
);

const activeDay = computed(() => props.days.find((d) => d.date === activeDate.value) ?? null);

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
function weekdayLabel(date: string): string {
  return WEEKDAYS[new Date(`${date}T12:00:00+09:00`).getDay()];
}

const REASONS: Record<string, string> = {
  FULL: 'Hết chỗ',
  PAST: 'Đã qua',
  CLOSED: 'Nghỉ',
};

function isSelected(startTime: string): boolean {
  return props.modelValue?.date === activeDate.value && props.modelValue?.startTime === startTime;
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="loading" class="ay-card text-center ay-muted">Đang tải lịch trống…</div>

    <AyEmptyState
      v-else-if="openDays.length === 0"
      title="Không có ngày nào nhận xe trong khoảng này"
      hint="Cửa hàng có thể đang nghỉ. Hãy chọn cửa hàng khác hoặc gọi trực tiếp."
    />

    <template v-else>
      <div class="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Chọn ngày">
        <button
          v-for="day in openDays"
          :key="day.date"
          type="button"
          role="tab"
          :aria-selected="activeDate === day.date"
          class="flex min-w-[64px] flex-none flex-col items-center rounded-2xl px-3 py-2 transition-colors"
          :class="activeDate === day.date ? 'bg-accent text-white' : 'bg-surface hover:bg-accent-200'"
          @click="activeDate = day.date"
        >
          <span class="text-[11px] opacity-80">{{ weekdayLabel(day.date) }}</span>
          <span class="font-heading text-[16px]">{{ fmtDate(day.date, 'd') }}</span>
          <span class="text-[10.5px] opacity-80">{{ fmtDate(day.date, 'M') }}月</span>
        </button>
      </div>

      <div v-if="activeDay" class="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <button
          v-for="slot in activeDay.slots"
          :key="slot.startTime"
          type="button"
          :disabled="!slot.available"
          class="flex flex-col items-start rounded-xl border px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-55"
          :class="
            isSelected(slot.startTime)
              ? 'border-accent bg-accent text-white'
              : 'border-neutral-300 bg-surface hover:border-accent-300 hover:bg-accent-100'
          "
          style="min-height: 48px"
          @click="emit('update:modelValue', { date: activeDay.date, startTime: slot.startTime })"
        >
          <span class="font-heading text-[15px]">{{ slot.startTime }}–{{ slot.endTime }}</span>
          <span class="text-[11.5px]" :class="isSelected(slot.startTime) ? 'opacity-90' : 'ay-muted'">
            <template v-if="slot.available">Còn {{ slot.remaining }} chỗ</template>
            <template v-else>{{ REASONS[slot.reason ?? ''] ?? 'Không chọn được' }}</template>
          </span>
        </button>
      </div>
    </template>
  </div>
</template>

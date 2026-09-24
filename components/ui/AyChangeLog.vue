<script setup lang="ts">
/** CP-25 Bang nhat ky thay doi — SA-05, SA-10, SA-44. */
defineProps<{
  entries: {
    id: string;
    createdAt: string;
    actorName?: string | null;
    actorType?: string;
    action: string;
    detail?: string | null;
  }[];
}>();

const { dateTime } = useFormat();

const ACTOR: Record<string, string> = {
  ADMIN: 'Nhân viên',
  CUSTOMER: 'Khách hàng',
  SYSTEM: 'Hệ thống',
};
</script>

<template>
  <AyEmptyState v-if="entries.length === 0" title="Chưa có thay đổi nào được ghi nhận" />

  <ol v-else class="flex flex-col gap-0">
    <li
      v-for="(entry, index) in entries"
      :key="entry.id"
      class="flex gap-3 pb-4"
      :class="index === entries.length - 1 ? 'pb-0' : ''"
    >
      <div class="flex flex-col items-center">
        <span class="mt-1.5 h-2 w-2 flex-none rounded-full bg-accent-400" aria-hidden="true" />
        <span
          v-if="index !== entries.length - 1"
          class="w-0.5 flex-1 bg-neutral-300"
          aria-hidden="true"
        />
      </div>

      <div class="flex-1">
        <p class="text-[13.5px] font-semibold">{{ entry.action }}</p>
        <p class="text-[12px] text-muted">
          {{ dateTime(entry.createdAt) }}
          · {{ entry.actorName || ACTOR[entry.actorType ?? ''] || 'Hệ thống' }}
        </p>
        <p v-if="entry.detail" class="mt-0.5 text-[12.5px]">{{ entry.detail }}</p>
      </div>
    </li>
  </ol>
</template>

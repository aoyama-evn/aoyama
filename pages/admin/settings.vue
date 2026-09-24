<script setup lang="ts">
import type { SystemSetting } from '~/types/models';

/** SA-43 Cau hinh he thong — FR-SYS-01, FR-SYS-02, FR-SYS-07. */
definePageMeta({ layout: 'admin', middleware: ['admin', 'admin-only'] });

const api = useApi();
const ui = useUiStore();

const { data: settings, refresh } = await useAsyncData('admin-settings', () =>
  api.get<SystemSetting[]>('/admin/system/settings'),
);

const draft = ref<Record<string, unknown>>({});
const saving = ref(false);

watchEffect(() => {
  const next: Record<string, unknown> = {};
  for (const setting of settings.value ?? []) next[setting.key] = setting.value;
  draft.value = next;
});

const GROUP_LABELS: Record<string, string> = {
  booking: 'Đặt lịch',
  pricing: 'Giá & thuế',
  maintenance: 'Chu kỳ bảo dưỡng',
  ai: 'Trợ lý AI',
  system: 'Hệ thống',
};

const grouped = computed(() => {
  const map = new Map<string, SystemSetting[]>();
  for (const setting of settings.value ?? []) {
    const key = setting.group ?? 'other';
    map.set(key, [...(map.get(key) ?? []), setting]);
  }
  return [...map.entries()];
});

const changedKeys = computed(() =>
  (settings.value ?? [])
    .filter((s) => JSON.stringify(draft.value[s.key]) !== JSON.stringify(s.value))
    .map((s) => s.key),
);

async function save(): Promise<void> {
  if (changedKeys.value.length === 0) {
    ui.info('Không có thay đổi nào để lưu');
    return;
  }
  saving.value = true;
  try {
    await api.put('/admin/system/settings', {
      entries: changedKeys.value.map((key) => ({ key, value: draft.value[key] })),
    });
    ui.success(`Đã lưu ${changedKeys.value.length} tham số`);
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  } finally {
    saving.value = false;
  }
}

useHead({ title: 'Cấu hình hệ thống — AOYAMA Admin' });
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-4">
    <AyPageHeader
      code="SA-43" title="Cấu hình hệ thống"
      description="Các ngưỡng nghiệp vụ đọc từ đây trước. Thay đổi có hiệu lực ngay, không cần khởi động lại."
    >
      <template #actions>
        <AyButton :loading="saving" :disabled="changedKeys.length === 0" @click="save">
          Lưu {{ changedKeys.length > 0 ? `(${changedKeys.length})` : '' }}
        </AyButton>
      </template>
    </AyPageHeader>

    <section v-for="[group, items] in grouped" :key="group" class="ay-card">
      <h2 class="mb-3 font-heading text-[16px]">{{ GROUP_LABELS[group] ?? group }}</h2>

      <ul class="flex flex-col gap-3">
        <li
          v-for="setting in items" :key="setting.key"
          class="grid gap-2 sm:grid-cols-[1fr_180px] sm:items-center"
        >
          <div>
            <p class="text-[14px] font-semibold">{{ setting.description ?? setting.key }}</p>
            <p class="font-mono text-[11.5px] ay-muted">{{ setting.key }}</p>
          </div>

          <label v-if="setting.valueType === 'BOOLEAN'" class="flex items-center gap-2 text-[13.5px]">
            <input
              type="checkbox" class="h-4 w-4 accent-[var(--color-accent)]"
              :checked="Boolean(draft[setting.key])"
              :disabled="!setting.isEditable"
              @change="draft[setting.key] = ($event.target as HTMLInputElement).checked"
            >
            {{ draft[setting.key] ? 'Bật' : 'Tắt' }}
          </label>

          <input
            v-else-if="setting.valueType === 'NUMBER'"
            class="ay-input" type="number"
            :value="draft[setting.key]"
            :disabled="!setting.isEditable"
            :aria-label="setting.description ?? setting.key"
            @input="draft[setting.key] = Number(($event.target as HTMLInputElement).value)"
          >

          <input
            v-else
            class="ay-input" type="text"
            :value="draft[setting.key]"
            :disabled="!setting.isEditable"
            :aria-label="setting.description ?? setting.key"
            @input="draft[setting.key] = ($event.target as HTMLInputElement).value"
          >
        </li>
      </ul>
    </section>

    <p v-if="changedKeys.length" class="rounded-xl bg-warning-bg px-3 py-2 text-[13px] text-warning">
      Có {{ changedKeys.length }} tham số đang chờ lưu. Thay đổi ngưỡng đặt lịch ảnh hưởng tới
      quy tắc hủy và đổi lịch của khách.
    </p>
  </div>
</template>

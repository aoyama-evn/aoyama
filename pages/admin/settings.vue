<script setup lang="ts">
import type { SystemSetting } from '~/types/models';

/** SA-43 Cau hinh he thong — FR-SYS-01, FR-SYS-02, FR-SYS-07. */
definePageMeta({ layout: 'admin', middleware: ['admin', 'admin-only'] });

const { t, te } = useI18n();
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

/** Ten nhom tham so; nhom la khoa dung chung ba thu tieng. */
function groupLabel(group: string): string {
  return te(`settingGroup.${group}`) ? t(`settingGroup.${group}`) : group;
}

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
    ui.info(t('sa43.noChanges'));
    return;
  }
  saving.value = true;
  try {
    await api.put('/admin/system/settings', {
      entries: changedKeys.value.map((key) => ({ key, value: draft.value[key] })),
    });
    ui.success(t('sa43.saved', { n: changedKeys.value.length }));
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  } finally {
    saving.value = false;
  }
}

setScreenTitle(() => t('sa43.title'));
useHead({ title: () => `${t('sa43.title')} — AOYAMA Admin` });
</script>

<template>
  <div class="admin-form admin-form-wide">
    <AyPageHeader
      code="SA-43" :title="$t('sa43.title')"
      :description="$t('sa43.lead')"
    >
      <template #actions>
        <AyButton :loading="saving" :disabled="changedKeys.length === 0" @click="save">
          {{ $t('common.save') }}{{ changedKeys.length > 0 ? ` (${changedKeys.length})` : '' }}
        </AyButton>
      </template>
    </AyPageHeader>

    <section v-for="[group, items] in grouped" :key="group" class="card">
      <h2 class="mb-3 font-heading text-[16px]">{{ groupLabel(group) }}</h2>

      <ul class="flex flex-col gap-3">
        <li
          v-for="setting in items" :key="setting.key"
          class="grid gap-2 sm:grid-cols-[1fr_180px] sm:items-center"
        >
          <div>
            <p class="text-[14px] font-semibold">{{ setting.description ?? setting.key }}</p>
            <p class="font-mono text-[11.5px] text-muted">{{ setting.key }}</p>
          </div>

          <label v-if="setting.valueType === 'BOOLEAN'" class="flex items-center gap-2 text-[13.5px]">
            <input
              type="checkbox" class="h-4 w-4 accent-[var(--color-accent)]"
              :checked="Boolean(draft[setting.key])"
              :disabled="!setting.isEditable"
              @change="draft[setting.key] = ($event.target as HTMLInputElement).checked"
            >
            {{ draft[setting.key] ? $t('sa43.on') : $t('sa43.off') }}
          </label>

          <input
            v-else-if="setting.valueType === 'NUMBER'"
            class="input" type="number"
            :value="draft[setting.key]"
            :disabled="!setting.isEditable"
            :aria-label="setting.description ?? setting.key"
            @input="draft[setting.key] = Number(($event.target as HTMLInputElement).value)"
          >

          <input
            v-else
            class="input" type="text"
            :value="draft[setting.key]"
            :disabled="!setting.isEditable"
            :aria-label="setting.description ?? setting.key"
            @input="draft[setting.key] = ($event.target as HTMLInputElement).value"
          >
        </li>
      </ul>
    </section>

    <p v-if="changedKeys.length" class="rounded-xl bg-warning-bg px-3 py-2 text-[13px] text-warning">
      {{ $t('sa43.pending', { n: changedKeys.length }) }}
    </p>
  </div>
</template>

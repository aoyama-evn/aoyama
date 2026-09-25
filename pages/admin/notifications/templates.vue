<script setup lang="ts">
import type { NotificationTemplate } from '~/types/models';

/** SA-41 Mau thong bao — FR-NOT-09, FR-NOT-10, FR-NOT-11. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();

const { data: templates, refresh } = await useAsyncData('notif-templates', () =>
  api.get<NotificationTemplate[]>('/admin/notifications/templates'),
);

const { t, te } = useI18n();

/** Ten su kien; su kien la khoa dung chung ba thu tieng. */
function eventLabel(event: string): string {
  return te(`notifEvent.${event}`) ? t(`notifEvent.${event}`) : event;
}

/** Ten ngon ngu viet bang chinh ngon ngu do, khong dich. */
const LANG_LABELS: Record<string, string> = { ja: '日本語', en: 'English', vi: 'Tiếng Việt' };

const editing = ref<NotificationTemplate | null>(null);
const draft = reactive({ subject: '', body: '', isActive: true });
const saving = ref(false);

function startEdit(template: NotificationTemplate): void {
  editing.value = template;
  draft.subject = template.subject ?? '';
  draft.body = template.body;
  draft.isActive = template.isActive;
}

/** Canh bao som neu mau dung bien khong nam trong danh sach cho phep. */
const unknownVariables = computed(() => {
  if (!editing.value) return [];
  const used = [...draft.body.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map((m) => m[1]);
  return [...new Set(used)].filter((v) => !editing.value!.availableVariables.includes(v));
});

/** SMS tinh phi theo do dai — hien so ky tu de nguoi soan biet (RK-03). */
const smsLength = computed(() => draft.body.length);

/**
 * Bao bien bang cap ngoac nhon. Tach thanh ham vi viet thang trong the
 * se bi trinh bien dich mau doc nham la mot bieu thuc long nhau.
 */
const OPEN = '{' + '{';
const CLOSE = '}' + '}';

function braced(variable: string): string {
  return OPEN + variable + CLOSE;
}

function insertVariable(variable: string): void {
  draft.body += braced(variable);
}

async function save(): Promise<void> {
  if (!editing.value) return;
  saving.value = true;
  try {
    await api.put(`/admin/notifications/templates/${editing.value.id}`, {
      subject: draft.subject || undefined,
      body: draft.body,
      isActive: draft.isActive,
    });
    ui.success(t('sa41.saved'));
    editing.value = null;
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  } finally {
    saving.value = false;
  }
}

const grouped = computed(() => {
  const map = new Map<string, NotificationTemplate[]>();
  for (const template of templates.value ?? []) {
    map.set(template.event, [...(map.get(template.event) ?? []), template]);
  }
  return [...map.entries()];
});

setScreenTitle(() => t('sa41.title'));
useHead({ title: () => `${t('sa41.title')} — AOYAMA Admin` });
</script>

<template>
  <div class="flex flex-col gap-4">
    <AyPageHeader
      code="SA-41" :title="$t('sa41.title')"
      :description="$t('sa41.lead')"
    >
      <template #actions>
        <AyButton to="/admin/notifications/logs" variant="secondary" size="sm">{{ $t('sa41.logsCta') }}</AyButton>
      </template>
    </AyPageHeader>

    <section v-for="[event, list] in grouped" :key="event" class="card">
      <h2 class="mb-2 font-heading text-[16px]">{{ eventLabel(event) }}</h2>

      <ul class="flex flex-col gap-1.5">
        <li
          v-for="template in list" :key="template.id"
          class="flex flex-wrap items-center gap-3 border-b border-divider pb-1.5 text-[13.5px] last:border-0"
        >
          <span class="tag bg-neutral-200 text-neutral-700">{{ template.channel }}</span>
          <span class="w-20">{{ LANG_LABELS[template.language] }}</span>
          <span class="min-w-0 flex-1 truncate text-muted">{{ template.body }}</span>
          <span v-if="!template.isActive" class="tag bg-danger-bg text-danger">{{ $t('sa41.off') }}</span>
          <button type="button" class="text-[12.5px] underline" @click="startEdit(template)">{{ $t('common.edit') }}</button>
        </li>
      </ul>
    </section>

    <AyConfirmDialog
      :open="Boolean(editing)"
      :title="$t('sa41.editTitle')"
      :confirm-label="$t('sa41.saveCta')"
      :loading="saving"
      @confirm="save"
      @cancel="editing = null"
    >
      <div v-if="editing" class="mt-3 flex flex-col gap-3 text-left">
        <p class="text-[12.5px] text-muted">
          {{ eventLabel(editing.event) }} · {{ editing.channel }} ·
          {{ LANG_LABELS[editing.language] }}
        </p>

        <AyField v-if="editing.channel === 'EMAIL'" :label="$t('sa41.subject')">
          <template #default="{ id: fid }">
            <input :id="fid" v-model="draft.subject" class="input" type="text">
          </template>
        </AyField>

        <AyField
          :label="$t('sa41.body')"
          :hint="editing.channel === 'SMS' ? $t('sa41.smsHint', { n: smsLength }) : undefined"
        >
          <template #default="{ id: fid }">
            <textarea :id="fid" v-model="draft.body" class="input min-h-[120px]" />
          </template>
        </AyField>

        <div>
          <p class="mb-1 text-[12.5px] font-semibold">{{ $t('sa41.variables') }}</p>
          <ul class="flex flex-wrap gap-1">
            <li
              v-for="variable in editing.availableVariables" :key="variable"
              class="tag cursor-pointer bg-neutral-200 text-neutral-700"
              @click="insertVariable(variable)"
            >
              {{ braced(variable) }}
            </li>
          </ul>
        </div>

        <p v-if="unknownVariables.length" class="rounded-xl bg-warning-bg px-3 py-2 text-[12.5px] text-warning">
          {{ $t('sa41.badVariable', { list: unknownVariables.join(', ') }) }}
        </p>

        <label class="flex items-center gap-2.5 text-[13.5px]">
          <input v-model="draft.isActive" type="checkbox" class="h-4 w-4 accent-[var(--color-accent)]">
          {{ $t('sa41.inUse') }}
        </label>
      </div>
    </AyConfirmDialog>
  </div>
</template>

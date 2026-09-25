<script setup lang="ts">
import type { KnowledgeDocument, Page } from '~/types/models';

/** SA-31 Kho tai lieu ky thuat — FR-TEC-05. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();
const { t } = useI18n();
const { date } = useFormat();

const keyword = ref('');
const page = ref(1);

const query = computed(() => ({ page: page.value, limit: 20, keyword: keyword.value || undefined }));
const { data, pending, refresh } = await useAsyncData(
  'admin-knowledge',
  () => api.get<Page<KnowledgeDocument>>('/admin/ai/knowledge-base', query.value),
  { watch: [query] },
);

const adding = ref(false);
const form = reactive({ title: '', category: '', makers: '', models: '', fileUrl: '', content: '' });
const saving = ref(false);
const deleteTarget = ref<KnowledgeDocument | null>(null);

async function save(): Promise<void> {
  if (!form.title.trim()) {
    ui.warning(t('sa31k.needTitle'));
    return;
  }
  saving.value = true;
  try {
    await api.post('/admin/ai/knowledge-base', {
      title: form.title.trim(),
      category: form.category.trim() || undefined,
      applicableMakers: form.makers.split(',').map((s) => s.trim()).filter(Boolean),
      applicableModels: form.models.split(',').map((s) => s.trim()).filter(Boolean),
      fileUrl: form.fileUrl.trim() || undefined,
      content: form.content.trim() || undefined,
    });
    ui.success(t('sa31k.added'));
    Object.assign(form, { title: '', category: '', makers: '', models: '', fileUrl: '', content: '' });
    adding.value = false;
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  } finally {
    saving.value = false;
  }
}

async function remove(): Promise<void> {
  if (!deleteTarget.value) return;
  try {
    await api.del(`/admin/ai/knowledge-base/${deleteTarget.value.id}`);
    ui.success(t('sa31k.deleted'));
    deleteTarget.value = null;
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  }
}

const COLUMNS = computed(() => [
  { key: 'title', label: t('sa31k.titleField') },
  { key: 'category', label: t('sa25.colCategory'), width: '140px' },
  { key: 'applicableMakers', label: t('sa31k.colAppliesTo'), width: '200px' },
  { key: 'indexStatus', label: t('sa31k.colIndex'), width: '130px' },
  { key: 'createdAt', label: t('sa31k.colAdded'), width: '130px' },
  { key: 'actions', label: '', width: '80px' },
]);

setScreenTitle(() => t('sa31k.title'));
useHead({ title: () => `${t('sa31k.title')} — AOYAMA Admin` });
</script>

<template>
  <div class="flex flex-col gap-4">
    <AyPageHeader
      code="SA-31" :title="$t('sa31k.title')"
      :description="$t('sa31k.lead')"
    >
      <template #actions>
        <AyButton to="/admin/tech-assistant" variant="secondary" size="sm">{{ $t('sa31k.assistantCta') }}</AyButton>
        <AyButton size="sm" @click="adding = !adding">
          {{ adding ? $t('common.close') : $t('sa31k.addCta') }}
        </AyButton>
      </template>
    </AyPageHeader>

    <section v-if="adding" class="card grid gap-3 sm:grid-cols-2">
      <AyField :label="$t('sa31k.titleField')" required class="sm:col-span-2">
        <template #default="{ id }">
          <input :id="id" v-model="form.title" class="input" type="text">
        </template>
      </AyField>

      <AyField :label="$t('sa25.colCategory')">
        <template #default="{ id }">
          <input :id="id" v-model="form.category" class="input" type="text" :placeholder="$t('sa31k.categoryPlaceholder')">
        </template>
      </AyField>

      <AyField :label="$t('sa31k.fileUrl')">
        <template #default="{ id }">
          <input :id="id" v-model="form.fileUrl" class="input" type="url">
        </template>
      </AyField>

      <AyField :label="$t('sa31k.makers')" :hint="$t('sa31k.commaHint')">
        <template #default="{ id }">
          <input :id="id" v-model="form.makers" class="input" type="text" placeholder="Honda, Yamaha">
        </template>
      </AyField>

      <AyField :label="$t('sa31k.models')" :hint="$t('sa31k.commaHint')">
        <template #default="{ id }">
          <input :id="id" v-model="form.models" class="input" type="text" placeholder="PCX 125, NMAX 155">
        </template>
      </AyField>

      <AyField :label="$t('sa31k.content')" :hint="$t('sa31k.contentHint')" class="sm:col-span-2">
        <template #default="{ id }">
          <textarea :id="id" v-model="form.content" class="input min-h-[140px]" />
        </template>
      </AyField>

      <div class="sm:col-span-2">
        <AyButton :loading="saving" @click="save">{{ $t('sa31k.save') }}</AyButton>
      </div>
    </section>

    <AyFilterBar :has-active-filters="Boolean(keyword)" @reset="keyword = ''">
      <AyField :label="$t('common.search')" class="min-w-[240px] flex-1">
        <template #default="{ id }">
          <input :id="id" v-model="keyword" class="input" type="search" :placeholder="$t('sa31k.searchPlaceholder')">
        </template>
      </AyField>
    </AyFilterBar>

    <AyDataTable
      :columns="COLUMNS"
      :rows="data?.items ?? []"
      :meta="data?.meta ?? null"
      :loading="pending"
      :empty-title="$t('sa31k.empty')"
      :empty-hint="$t('sa31k.emptyHint')"
      @update:page="page = $event"
    >
      <template #cell-title="{ row }"><span class="font-semibold">{{ row.title }}</span></template>
      <template #cell-category="{ row }">{{ row.category ?? '—' }}</template>
      <template #cell-applicableMakers="{ row }">
        {{ ((row.applicableMakers as string[]) ?? []).join(', ') || $t('sa31k.allBikes') }}
      </template>
      <template #cell-indexStatus="{ row }">
        <span
          class="tag"
          :class="row.indexStatus === 'INDEXED' ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning'"
        >
          {{ row.indexStatus === 'INDEXED' ? $t('sa31k.indexed') : $t('sa31k.queued') }}
        </span>
      </template>
      <template #cell-createdAt="{ row }">{{ date(row.createdAt as string) }}</template>
      <template #cell-actions="{ row }">
        <button
          type="button" class="text-[12.5px] text-danger underline"
          @click.stop="deleteTarget = row as unknown as KnowledgeDocument"
        >
          {{ $t('common.delete') }}
        </button>
      </template>
    </AyDataTable>

    <AyConfirmDialog
      :open="Boolean(deleteTarget)"
      :title="$t('sa31k.askDelete')"
      :message="$t('sa31k.askDeleteBody')"
      :confirm-label="$t('common.delete')"
      danger
      @confirm="remove"
      @cancel="deleteTarget = null"
    />
  </div>
</template>

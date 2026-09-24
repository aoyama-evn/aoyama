<script setup lang="ts">
import type { KnowledgeDocument, Page } from '~/types/models';

/** SA-31 Kho tai lieu ky thuat — FR-TEC-05. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();
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
    ui.warning('Cần tiêu đề tài liệu');
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
    ui.success('Đã thêm tài liệu');
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
    ui.success('Đã xóa tài liệu');
    deleteTarget.value = null;
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  }
}

const COLUMNS = [
  { key: 'title', label: 'Tiêu đề' },
  { key: 'category', label: 'Nhóm', width: '140px' },
  { key: 'applicableMakers', label: 'Áp dụng cho', width: '200px' },
  { key: 'indexStatus', label: 'Lập chỉ mục', width: '130px' },
  { key: 'createdAt', label: 'Ngày thêm', width: '130px' },
  { key: 'actions', label: '', width: '80px' },
];

useHead({ title: 'Kho tài liệu kỹ thuật — AOYAMA Admin' });
</script>

<template>
  <div class="flex flex-col gap-4">
    <AyPageHeader
      code="SA-31" title="Kho tài liệu kỹ thuật"
      description="Nguồn trích dẫn cho trợ lý AI kỹ thuật. Không có tài liệu, trợ lý sẽ trả lời là chưa có dữ liệu thay vì suy đoán."
    >
      <template #actions>
        <AyButton to="/admin/tech-assistant" variant="secondary" size="sm">Trợ lý kỹ thuật</AyButton>
        <AyButton size="sm" @click="adding = !adding">{{ adding ? 'Đóng' : 'Thêm tài liệu' }}</AyButton>
      </template>
    </AyPageHeader>

    <section v-if="adding" class="ay-card grid gap-3 sm:grid-cols-2">
      <AyField label="Tiêu đề" required class="sm:col-span-2">
        <template #default="{ id }">
          <input :id="id" v-model="form.title" class="ay-input" type="text">
        </template>
      </AyField>

      <AyField label="Nhóm">
        <template #default="{ id }">
          <input :id="id" v-model="form.category" class="ay-input" type="text" placeholder="Sổ tay sửa chữa / Mã lỗi">
        </template>
      </AyField>

      <AyField label="Đường dẫn tệp">
        <template #default="{ id }">
          <input :id="id" v-model="form.fileUrl" class="ay-input" type="url">
        </template>
      </AyField>

      <AyField label="Hãng áp dụng" hint="Ngăn cách bằng dấu phẩy">
        <template #default="{ id }">
          <input :id="id" v-model="form.makers" class="ay-input" type="text" placeholder="Honda, Yamaha">
        </template>
      </AyField>

      <AyField label="Dòng xe áp dụng" hint="Ngăn cách bằng dấu phẩy">
        <template #default="{ id }">
          <input :id="id" v-model="form.models" class="ay-input" type="text" placeholder="PCX 125, NMAX 155">
        </template>
      </AyField>

      <AyField label="Nội dung văn bản" hint="Dán nội dung để trợ lý tìm kiếm toàn văn" class="sm:col-span-2">
        <template #default="{ id }">
          <textarea :id="id" v-model="form.content" class="ay-input min-h-[140px]" />
        </template>
      </AyField>

      <div class="sm:col-span-2">
        <AyButton :loading="saving" @click="save">Lưu tài liệu</AyButton>
      </div>
    </section>

    <AyFilterBar :has-active-filters="Boolean(keyword)" @reset="keyword = ''">
      <AyField label="Tìm kiếm" class="min-w-[240px] flex-1">
        <template #default="{ id }">
          <input :id="id" v-model="keyword" class="ay-input" type="search" placeholder="Tiêu đề tài liệu">
        </template>
      </AyField>
    </AyFilterBar>

    <AyDataTable
      :columns="COLUMNS"
      :rows="data?.items ?? []"
      :meta="data?.meta ?? null"
      :loading="pending"
      empty-title="Kho tài liệu còn trống"
      empty-hint="Khả thi của trợ lý kỹ thuật phụ thuộc vào việc có tài liệu dạng số hay không (OQ-08)."
      @update:page="page = $event"
    >
      <template #cell-title="{ row }"><span class="font-semibold">{{ row.title }}</span></template>
      <template #cell-category="{ row }">{{ row.category ?? '—' }}</template>
      <template #cell-applicableMakers="{ row }">
        {{ ((row.applicableMakers as string[]) ?? []).join(', ') || 'Mọi xe' }}
      </template>
      <template #cell-indexStatus="{ row }">
        <span
          class="ay-tag"
          :class="row.indexStatus === 'INDEXED' ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning'"
        >
          {{ row.indexStatus === 'INDEXED' ? 'Đã lập chỉ mục' : 'Chờ xử lý' }}
        </span>
      </template>
      <template #cell-createdAt="{ row }">{{ date(row.createdAt as string) }}</template>
      <template #cell-actions="{ row }">
        <button
          type="button" class="text-[12.5px] text-danger underline"
          @click.stop="deleteTarget = row as unknown as KnowledgeDocument"
        >
          Xóa
        </button>
      </template>
    </AyDataTable>

    <AyConfirmDialog
      :open="Boolean(deleteTarget)"
      title="Xóa tài liệu"
      message="Trợ lý kỹ thuật sẽ không còn trích dẫn tài liệu này."
      confirm-label="Xóa"
      danger
      @confirm="remove"
      @cancel="deleteTarget = null"
    />
  </div>
</template>

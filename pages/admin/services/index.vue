<script setup lang="ts">
import type { Page, ServiceItem } from '~/types/models';
import { ServiceType } from '~/types/enums';

/** SA-22 Danh sach dich vu — FR-SVC-01, FR-SVC-09, FR-SVC-10. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();
const { i18n, money } = useFormat();

const filters = reactive({ keyword: '', type: '' });
const page = ref(1);

const query = computed(() => ({
  page: page.value,
  limit: 20,
  keyword: filters.keyword || undefined,
  type: filters.type || undefined,
}));

const { data, pending, refresh } = await useAsyncData(
  'admin-services',
  () => api.get<Page<ServiceItem>>('/admin/services', query.value),
  { watch: [query] },
);

const deactivateTarget = ref<ServiceItem | null>(null);

async function deactivate(): Promise<void> {
  if (!deactivateTarget.value) return;
  try {
    await api.del(`/admin/services/${deactivateTarget.value.id}`);
    ui.success('Đã ngừng bán dịch vụ', 'Lịch hẹn và phiếu cũ vẫn giữ nguyên thông tin.');
    deactivateTarget.value = null;
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  }
}

const COLUMNS = [
  { key: 'code', label: 'Mã', width: '170px' },
  { key: 'name', label: 'Tên dịch vụ' },
  { key: 'type', label: 'Loại', width: '110px' },
  { key: 'durationMinutes', label: 'Thời gian', align: 'center' as const, width: '110px' },
  { key: 'basePrice', label: 'Giá cơ sở', align: 'right' as const, width: '130px' },
  { key: 'isActive', label: 'Trạng thái', width: '120px' },
  { key: 'actions', label: '', width: '90px' },
];

useHead({ title: 'Dịch vụ — AOYAMA Admin' });
</script>

<template>
  <div class="flex flex-col gap-4">
    <AyPageHeader code="SA-22" title="Danh mục dịch vụ">
      <template #actions>
        <AyButton to="/admin/pricing" variant="secondary" size="sm">Bảng giá</AyButton>
        <AyButton to="/admin/services/new/edit" size="sm">Thêm dịch vụ</AyButton>
      </template>
    </AyPageHeader>

    <AyFilterBar
      :has-active-filters="Boolean(filters.keyword || filters.type)"
      @reset="filters.keyword = ''; filters.type = ''"
    >
      <AyField label="Từ khóa" class="min-w-[220px] flex-1">
        <template #default="{ id }">
          <input :id="id" v-model="filters.keyword" class="ay-input" type="search" placeholder="Mã hoặc tên dịch vụ">
        </template>
      </AyField>
      <AyField label="Loại">
        <template #default="{ id }">
          <select :id="id" v-model="filters.type" class="ay-input">
            <option value="">Tất cả</option>
            <option :value="ServiceType.MAINTENANCE">Bảo dưỡng</option>
            <option :value="ServiceType.REPAIR">Sửa chữa</option>
          </select>
        </template>
      </AyField>
    </AyFilterBar>

    <AyDataTable
      :columns="COLUMNS"
      :rows="data?.items ?? []"
      :meta="data?.meta ?? null"
      :loading="pending"
      empty-title="Chưa có dịch vụ nào"
      @update:page="page = $event"
    >
      <template #cell-code="{ row }">
        <span class="font-mono text-[12.5px]">{{ row.code }}</span>
      </template>
      <template #cell-name="{ row }">
        <NuxtLink :to="`/admin/services/${row.id}/edit`" class="font-semibold hover:underline">
          {{ i18n((row as unknown as ServiceItem).name) }}
        </NuxtLink>
      </template>
      <template #cell-type="{ row }">
        {{ row.type === 'MAINTENANCE' ? 'Bảo dưỡng' : 'Sửa chữa' }}
      </template>
      <template #cell-durationMinutes="{ row }">{{ row.durationMinutes }} phút</template>
      <template #cell-basePrice="{ row }">
        {{ (row as unknown as ServiceItem).quoteOnly ? 'Báo giá riêng' : money(row.basePrice as number) }}
      </template>
      <template #cell-isActive="{ row }">
        <span class="ay-tag" :class="row.isActive ? 'bg-success-bg text-success' : 'bg-neutral-200 text-neutral-600'">
          {{ row.isActive ? 'Đang bán' : 'Ngừng bán' }}
        </span>
      </template>
      <template #cell-actions="{ row }">
        <button
          v-if="row.isActive" type="button" class="text-[12.5px] text-danger underline"
          @click.stop="deactivateTarget = row as unknown as ServiceItem"
        >
          Ngừng bán
        </button>
      </template>
    </AyDataTable>

    <AyConfirmDialog
      :open="Boolean(deactivateTarget)"
      title="Ngừng bán dịch vụ"
      message="Dịch vụ sẽ không còn hiện cho khách đặt mới. Lịch hẹn và phiếu dịch vụ cũ không bị ảnh hưởng."
      confirm-label="Ngừng bán"
      danger
      @confirm="deactivate"
      @cancel="deactivateTarget = null"
    />
  </div>
</template>

<script setup lang="ts">
import type { AdminUser, Page } from '~/types/models';
import { AdminRole } from '~/types/enums';

/** SA-39 Tai khoan quan tri — FR-USR-01, FR-USR-05. */
definePageMeta({ layout: 'admin', middleware: ['admin', 'admin-only'] });

const api = useApi();
const ui = useUiStore();
const { i18n, dateTime } = useFormat();

const keyword = ref('');
const page = ref(1);

const query = computed(() => ({ page: page.value, limit: 20, keyword: keyword.value || undefined }));
const { data, pending, refresh } = await useAsyncData(
  'admin-users',
  () => api.get<Page<AdminUser>>('/admin/users', query.value),
  { watch: [query] },
);

const toggleTarget = ref<AdminUser | null>(null);

async function toggleActive(): Promise<void> {
  if (!toggleTarget.value) return;
  try {
    await api.put(`/admin/users/${toggleTarget.value.id}/active`, {
      isActive: !toggleTarget.value.isActive,
    });
    ui.success(toggleTarget.value.isActive ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
    toggleTarget.value = null;
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  }
}

async function unlock(user: AdminUser): Promise<void> {
  try {
    await api.put(`/admin/users/${user.id}/unlock`);
    ui.success('Đã gỡ khóa đăng nhập');
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  }
}

const COLUMNS = [
  { key: 'username', label: 'Tên đăng nhập', width: '180px' },
  { key: 'fullName', label: 'Họ tên' },
  { key: 'role', label: 'Vai trò', width: '120px' },
  { key: 'store', label: 'Cửa hàng', width: '170px' },
  { key: 'lastLoginAt', label: 'Đăng nhập gần nhất', width: '160px' },
  { key: 'isActive', label: 'Trạng thái', width: '130px' },
  { key: 'actions', label: '', width: '130px' },
];

useHead({ title: 'Tài khoản quản trị — AOYAMA Admin' });
</script>

<template>
  <div class="flex flex-col gap-4">
    <AyPageHeader
      code="SA-39" title="Tài khoản quản trị"
      description="Tài khoản bị khóa thay vì xóa, để nhật ký thao tác vẫn truy nguyên được."
    >
      <template #actions>
        <AyButton to="/admin/users/new/edit" size="sm">Thêm tài khoản</AyButton>
      </template>
    </AyPageHeader>

    <AyFilterBar :has-active-filters="Boolean(keyword)" @reset="keyword = ''">
      <AyField label="Tìm kiếm" class="min-w-[240px] flex-1">
        <template #default="{ id }">
          <input :id="id" v-model="keyword" class="input" type="search" placeholder="Tên đăng nhập, họ tên hoặc email">
        </template>
      </AyField>
    </AyFilterBar>

    <AyDataTable
      :columns="COLUMNS"
      :rows="data?.items ?? []"
      :meta="data?.meta ?? null"
      :loading="pending"
      empty-title="Chưa có tài khoản nào"
      @update:page="page = $event"
    >
      <template #cell-username="{ row }">
        <NuxtLink :to="`/admin/users/${row.id}/edit`" class="font-mono text-[13px] hover:underline">
          {{ row.username }}
        </NuxtLink>
      </template>
      <template #cell-fullName="{ row }">{{ row.fullName }}</template>
      <template #cell-role="{ row }">
        <span
          class="tag"
          :class="row.role === AdminRole.ADMIN ? 'bg-accent-200 text-accent-800' : 'bg-neutral-200 text-neutral-700'"
        >
          {{ row.role === AdminRole.ADMIN ? 'Quản trị' : 'Nhân viên' }}
        </span>
      </template>
      <template #cell-store="{ row }">
        {{ i18n((row as unknown as AdminUser).store?.name ?? null) || 'Mọi cửa hàng' }}
      </template>
      <template #cell-lastLoginAt="{ row }">{{ dateTime(row.lastLoginAt as string) || '—' }}</template>
      <template #cell-isActive="{ row }">
        <span
          class="tag"
          :class="row.isActive ? 'bg-success-bg text-success' : 'bg-neutral-200 text-neutral-600'"
        >
          {{ row.isActive ? 'Hoạt động' : 'Đã khóa' }}
        </span>
        <span v-if="row.lockedUntil" class="tag mt-1 bg-danger-bg text-danger">tạm khóa</span>
      </template>
      <template #cell-actions="{ row }">
        <button
          type="button" class="text-[12.5px] underline"
          @click.stop="toggleTarget = row as unknown as AdminUser"
        >
          {{ row.isActive ? 'Khóa' : 'Mở khóa' }}
        </button>
        <button
          v-if="row.lockedUntil" type="button" class="ml-2 text-[12.5px] underline"
          @click.stop="unlock(row as unknown as AdminUser)"
        >
          Gỡ khóa
        </button>
      </template>
    </AyDataTable>

    <AyConfirmDialog
      :open="Boolean(toggleTarget)"
      :title="toggleTarget?.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'"
      :message="
        toggleTarget?.isActive
          ? 'Người dùng sẽ không đăng nhập được nữa. Lịch sử thao tác vẫn giữ nguyên.'
          : 'Người dùng có thể đăng nhập trở lại.'
      "
      :danger="toggleTarget?.isActive"
      @confirm="toggleActive"
      @cancel="toggleTarget = null"
    />
  </div>
</template>

<script setup lang="ts">
import type { AdminUser, Page } from '~/types/models';
import { AdminRole } from '~/types/enums';

/** SA-39 Tai khoan quan tri — FR-USR-01, FR-USR-05. */
definePageMeta({ layout: 'admin', middleware: ['admin', 'admin-only'] });

const api = useApi();
const ui = useUiStore();
const { t } = useI18n();
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
    ui.success(toggleTarget.value.isActive ? t('sa39.locked') : t('sa39.unlocked'));
    toggleTarget.value = null;
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  }
}

async function unlock(user: AdminUser): Promise<void> {
  try {
    await api.put(`/admin/users/${user.id}/unlock`);
    ui.success(t('sa39.lockCleared'));
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  }
}

const COLUMNS = computed(() => [
  { key: 'username', label: t('sa39.colUsername'), width: '180px' },
  { key: 'fullName', label: t('sa39.colName') },
  { key: 'role', label: t('sa39.colRole'), width: '120px' },
  { key: 'store', label: t('sa03.colStore'), width: '170px' },
  { key: 'lastLoginAt', label: t('sa39.colLastLogin'), width: '160px' },
  { key: 'isActive', label: t('sa02.colStatus'), width: '130px' },
  { key: 'actions', label: '', width: '130px' },
]);

setScreenTitle(() => t('sa39.title'));
useHead({ title: () => `${t('sa39.title')} — AOYAMA Admin` });
</script>

<template>
  <div class="flex flex-col gap-4">
    <AyPageHeader
      code="SA-39" :title="$t('sa39.title')"
      :description="$t('sa39.lead')"
    >
      <template #actions>
        <AyButton to="/admin/users/new/edit" size="sm">{{ $t('sa39.addCta') }}</AyButton>
      </template>
    </AyPageHeader>

    <AyFilterBar :has-active-filters="Boolean(keyword)" @reset="keyword = ''">
      <AyField :label="$t('common.search')" class="min-w-[240px] flex-1">
        <template #default="{ id }">
          <input :id="id" v-model="keyword" class="input" type="search" :placeholder="$t('sa39.searchPlaceholder')">
        </template>
      </AyField>
    </AyFilterBar>

    <AyDataTable
      :columns="COLUMNS"
      :rows="data?.items ?? []"
      :meta="data?.meta ?? null"
      :loading="pending"
      :empty-title="$t('sa39.empty')"
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
          {{ row.role === AdminRole.ADMIN ? $t('sa39.roleAdmin') : $t('sa39.roleStaff') }}
        </span>
      </template>
      <template #cell-store="{ row }">
        {{ i18n((row as unknown as AdminUser).store?.name ?? null) || $t('sa39.allStores') }}
      </template>
      <template #cell-lastLoginAt="{ row }">{{ dateTime(row.lastLoginAt as string) || '—' }}</template>
      <template #cell-isActive="{ row }">
        <span
          class="tag"
          :class="row.isActive ? 'bg-success-bg text-success' : 'bg-neutral-200 text-neutral-600'"
        >
          {{ row.isActive ? $t('sa39.active') : $t('sa39.disabled') }}
        </span>
        <span v-if="row.lockedUntil" class="tag mt-1 bg-danger-bg text-danger">
          {{ $t('sa39.tempLocked') }}
        </span>
      </template>
      <template #cell-actions="{ row }">
        <button
          type="button" class="text-[12.5px] underline"
          @click.stop="toggleTarget = row as unknown as AdminUser"
        >
          {{ row.isActive ? $t('sa39.lock') : $t('sa39.unlock') }}
        </button>
        <button
          v-if="row.lockedUntil" type="button" class="ml-2 text-[12.5px] underline"
          @click.stop="unlock(row as unknown as AdminUser)"
        >
          {{ $t('sa39.clearLock') }}
        </button>
      </template>
    </AyDataTable>

    <AyConfirmDialog
      :open="Boolean(toggleTarget)"
      :title="toggleTarget?.isActive ? $t('sa39.askLock') : $t('sa39.askUnlock')"
      :message="
        toggleTarget?.isActive ? $t('sa39.askLockBody') : $t('sa39.askUnlockBody')
      "
      :danger="toggleTarget?.isActive"
      @confirm="toggleActive"
      @cancel="toggleTarget = null"
    />
  </div>
</template>

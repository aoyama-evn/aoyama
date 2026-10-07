<script setup lang="ts">
import type { NotificationLog, Page } from '~/types/models';
import { NotificationChannel, NotificationSendStatus } from '~/types/enums';

/** SA-42 Nhat ky gui thong bao — FR-NOT-12, FR-NOT-13. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();
const { t } = useI18n();
const { dateTime, maskedPhone } = useFormat();

const filters = reactive({ status: '', channel: '', recipient: '', from: '', to: '' });
const page = ref(1);

const query = computed(() => ({
  page: page.value,
  limit: 25,
  status: filters.status || undefined,
  channel: filters.channel || undefined,
  recipient: filters.recipient || undefined,
  from: filters.from || undefined,
  to: filters.to || undefined,
}));

const { data, pending, refresh } = await useAsyncData(
  'notif-logs',
  () => api.get<Page<NotificationLog>>('/admin/notifications/logs', query.value),
  { watch: [query] },
);

const detail = ref<NotificationLog | null>(null);

async function retry(log: NotificationLog): Promise<void> {
  try {
    await api.post(`/admin/notifications/logs/${log.id}/retry`);
    ui.success(t('sa42.retried'));
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  }
}

function reset(): void {
  Object.assign(filters, { status: '', channel: '', recipient: '', from: '', to: '' });
  page.value = 1;
}

const COLUMNS = computed(() => [
  { key: 'createdAt', label: t('sa29.colWhen'), width: '150px' },
  { key: 'event', label: t('sa42.event'), width: '180px' },
  { key: 'channel', label: t('sa42.channel'), width: '90px' },
  { key: 'recipient', label: t('sa42.recipient'), width: '160px' },
  { key: 'status', label: t('sa42.result'), width: '130px' },
  { key: 'body', label: t('sa41.body') },
  { key: 'actions', label: '', width: '110px' },
]);

setScreenTitle(() => t('sa42.headTitle'));
useHead({ title: () => `${t('sa42.headTitle')} — AOYAMA Admin` });
</script>

<template>
  <div class="flex flex-col gap-4">
    <AyPageHeader
      code="SA-42" :title="$t('sa42.title')"
      :description="$t('sa42.lead')"
    >
      <template #actions>
        <AyButton to="/admin/notifications/templates" variant="secondary" size="sm">{{ $t('sa42.templatesCta') }}</AyButton>
      </template>
    </AyPageHeader>

    <AyFilterBar
      :has-active-filters="Boolean(filters.status || filters.channel || filters.recipient || filters.from)"
      @reset="reset"
    >
      <AyField :label="$t('sa42.recipient')" class="min-w-[180px]">
        <template #default="{ id }">
          <input :id="id" v-model="filters.recipient" class="input" type="search" :placeholder="$t('sa42.recipientPlaceholder')">
        </template>
      </AyField>
      <AyField :label="$t('sa42.channel')">
        <template #default="{ id }">
          <select :id="id" v-model="filters.channel" class="input">
            <option value="">{{ $t('common.all') }}</option>
            <option v-for="c in Object.values(NotificationChannel)" :key="c" :value="c">{{ c }}</option>
          </select>
        </template>
      </AyField>
      <AyField :label="$t('sa42.result')">
        <template #default="{ id }">
          <select :id="id" v-model="filters.status" class="input">
            <option value="">{{ $t('common.all') }}</option>
            <option v-for="s in Object.values(NotificationSendStatus)" :key="s" :value="s">{{ s }}</option>
          </select>
        </template>
      </AyField>
      <AyField :label="$t('sa03.fromDate')">
        <template #default="{ id }">
          <AyDateField :id="id" v-model="filters.from" />
        </template>
      </AyField>
      <AyField :label="$t('sa03.toDate')">
        <template #default="{ id }">
          <AyDateField :id="id" v-model="filters.to" />
        </template>
      </AyField>
    </AyFilterBar>

    <AyDataTable
      :columns="COLUMNS"
      :rows="data?.items ?? []"
      :meta="data?.meta ?? null"
      :loading="pending"
      :empty-title="$t('sa42.empty')"
      @update:page="page = $event"
      @row-click="detail = $event as unknown as NotificationLog"
    >
      <template #cell-createdAt="{ row }">{{ dateTime(row.createdAt as string) }}</template>
      <template #cell-event="{ row }"><span class="font-mono text-[12px]">{{ row.event }}</span></template>
      <template #cell-channel="{ row }">{{ row.channel }}</template>
      <template #cell-recipient="{ row }">{{ maskedPhone(row.recipient as string) }}</template>
      <template #cell-status="{ row }"><AyStatusTag :status="row.status as string" /></template>
      <template #cell-body="{ row }">
        <span class="line-clamp-1 text-[12.5px] text-muted">{{ row.body }}</span>
      </template>
      <template #cell-actions="{ row }">
        <button
          v-if="row.status === 'FAILED'" type="button" class="text-[12.5px] underline"
          @click.stop="retry(row as unknown as NotificationLog)"
        >
          {{ $t('sa42.retry') }}
        </button>
      </template>
    </AyDataTable>

    <AyConfirmDialog
      :open="Boolean(detail)"
      :title="$t('sa42.detail')"
      :confirm-label="$t('common.close')"
      :cancel-label="$t('common.close')"
      @confirm="detail = null"
      @cancel="detail = null"
    >
      <dl v-if="detail" class="mt-3 flex flex-col gap-2 text-left text-[13.5px]">
        <div class="flex justify-between"><dt class="text-muted">{{ $t('sa42.event') }}</dt><dd class="font-mono">{{ detail.event }}</dd></div>
        <div class="flex justify-between"><dt class="text-muted">{{ $t('sa42.recipient') }}</dt><dd>{{ detail.recipient }}</dd></div>
        <div class="flex justify-between"><dt class="text-muted">{{ $t('sa42.sentAt') }}</dt><dd>{{ dateTime(detail.sentAt) || '—' }}</dd></div>
        <div class="flex justify-between"><dt class="text-muted">{{ $t('sa42.retryCount') }}</dt><dd>{{ detail.retryCount }}</dd></div>
        <div v-if="detail.subject"><dt class="text-muted">{{ $t('sa41.subject') }}</dt><dd>{{ detail.subject }}</dd></div>
        <div><dt class="text-muted">{{ $t('sa41.body') }}</dt><dd class="whitespace-pre-line rounded-xl bg-neutral-100 p-2">{{ detail.body }}</dd></div>
        <div v-if="detail.errorMessage">
          <dt class="text-muted">{{ $t('sa42.error') }}</dt>
          <dd class="text-danger">{{ detail.errorMessage }}</dd>
        </div>
      </dl>
    </AyConfirmDialog>
  </div>
</template>

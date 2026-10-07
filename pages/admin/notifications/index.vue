<script setup lang="ts">
import type { AdminNotification } from '~/types/models';

/**
 * CP-05 Thong bao cho nhan vien.
 *
 * Chi hien tren web — site quan tri khong gui SMS. Danh sach chi gom nhung
 * viec can nguoi lam: lich hen moi dat va khach vua chot bao gia. Cac buoc
 * con lai cua lich hen (tiep nhan xe, bat dau sua, ban giao) do chinh nhan
 * vien thao tac nen khong can bao lai cho ho.
 */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();
const { t, te } = useI18n();
const { dateTime } = useFormat();

setScreenTitle(() => t('adm.notif.title'));

const { data, refresh, pending } = await useAsyncData(
  'admin-notif-feed',
  () =>
    api.get<AdminNotification[]>('/admin/notifications/feed', {
      storeId: ui.activeStoreId ?? undefined,
    }),
  { watch: [() => ui.activeStoreId] },
);

const unreadCount = computed(() => (data.value ?? []).filter((n) => !n.read).length);

/** Mo mot thong bao = da doc no; danh dau truoc roi moi chuyen trang. */
async function open(item: AdminNotification): Promise<void> {
  if (!item.read) await api.put(`/admin/notifications/feed/${item.id}/read`).catch(() => undefined);
  if (item.link) await navigateTo(item.link);
  else await refresh();
}

/**
 * Ten su kien doc theo ngon ngu dang chon.
 *
 * Tieu de luu trong co so du lieu duoc ket san luc su kien xay ra, nen no
 * chi co mot thu tieng; ma thanh tieu de lai cho doi ba thu. Phan loi van
 * dich o day theo `event`, con than thong bao chi con du lieu (ma phieu,
 * so tien, gio hen) nen doc thu tieng nao cung hieu.
 *
 * Su kien la chua co ban dich thi quay ve dung tieu de da luu — mat dau
 * con hon mat chu.
 */
function tieuDe(item: AdminNotification): string {
  const key = `adm.notif.event.${item.event}`;
  return te(key) ? t(key) : item.title;
}

async function markAll(): Promise<void> {
  // api.put khong nhan tham so truy van, nen ghep thang vao duong dan.
  const scope = ui.activeStoreId ? `?storeId=${ui.activeStoreId}` : '';
  await api.put(`/admin/notifications/feed/read-all${scope}`).catch(() => undefined);
  await refresh();
}

useHead({ title: () => `${t('adm.notif.title')} — AOYAMA Admin` });
</script>

<template>
  <div class="admin-stack gap-[15px]">
    <AdminStoreBar />

    <AyPageHeader code="CP-05" :title="$t('adm.notif.title')" :description="$t('adm.notif.lead')">
      <template #actions>
        <AyButton
          v-if="unreadCount"
          variant="secondary"
          size="sm"
          @click="markAll"
        >
          {{ $t('adm.notif.markAll') }}
        </AyButton>
        <AyButton to="/admin/notifications/logs" variant="ghost" size="sm">
          {{ $t('adm.notif.smsLogs') }}
        </AyButton>
      </template>
    </AyPageHeader>

    <AyLoading v-if="pending" :label="$t('table.loading')" />

    <AyEmptyState
      v-else-if="(data ?? []).length === 0"
      :title="$t('adm.notif.emptyTitle')"
      :hint="$t('adm.notif.emptyHint')"
    />

    <section v-else class="card gap-0" style="background: #fff; padding: 0; overflow: hidden">
      <button
        v-for="item in data ?? []"
        :key="item.id"
        type="button"
        class="flex w-full flex-col gap-1 px-4 py-3 text-left"
        style="border-bottom: 1px solid var(--color-divider)"
        :style="item.read ? undefined : 'background: var(--color-accent-100)'"
        @click="open(item)"
      >
        <span class="flex items-baseline justify-between gap-3">
          <span class="text-[13.5px] font-semibold">
            <!-- Cham tron: chua doc thi nhin la thay ngay, khong chi dua vao mau nen. -->
            <span
              v-if="!item.read"
              class="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
              style="background: var(--color-accent)"
              aria-hidden="true"
            />
            {{ tieuDe(item) }}
          </span>
          <span class="text-muted flex-none text-[11.5px]">{{ dateTime(item.createdAt) }}</span>
        </span>
        <span class="text-muted text-[12.5px] leading-[1.5]">{{ item.body }}</span>
      </button>
    </section>
  </div>
</template>

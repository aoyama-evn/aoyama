<script setup lang="ts">
import type { Booking, Page } from '~/types/models';

/**
 * SA-03 Danh sach lich hen — FR-BOOK-20.
 * Ban thiet ke: hang chon cua hang o tren cung, nut hanh dong can phai, roi the
 * loc mau trang va bang trong the rieng. Bang loc dat san (?status, ?range)
 * hien thanh dai "Dang loc: …" de nguoi dung biet vi sao danh sach ngan lai.
 */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();
const route = useRoute();
const { t } = useI18n();
const { i18n, dayLabel, clock, date: fmtDate } = useFormat();

setScreenTitle(() => t('sa03.title'));

/** Hom nay theo gio cua hang, khong phai gio UTC cua may chu. */
const today = fmtDate(new Date(), 'yyyy-MM-dd');

/**
 * Mac dinh chi hien lich TU HOM NAY TRO DI, sap xep tang dan theo gio hen.
 *
 * Danh sach nay la hang cho viec cua le tan: thu ho can la cai sap toi, chu
 * khong phai lich cu nhat. Truoc day mo ra la thay qua khu truoc va phai tu
 * loc lai moi lan. Muon xem lich cu thi xoa o "Tu ngay" — thanh loc van bao
 * dang loc gi va co nut dat lai.
 */
const filters = reactive({
  keyword: '',
  status: (route.query.status as string) ?? '',
  serviceType: '',
  from: (route.query.from as string) ?? today,
  to: route.query.range === 'today' ? today : ((route.query.to as string) ?? ''),
});
const page = ref(1);
const sortOrder = ref<'ASC' | 'DESC'>('ASC');

const query = computed(() => ({
  page: page.value,
  limit: 20,
  sortOrder: sortOrder.value,
  storeId: ui.activeStoreId ?? undefined,
  keyword: filters.keyword || undefined,
  status: filters.status || undefined,
  serviceType: filters.serviceType || undefined,
  from: filters.from || undefined,
  to: filters.to || undefined,
}));

const { data, pending, refresh } = await useAsyncData(
  'admin-bookings',
  () => api.get<Page<Booking>>('/admin/bookings', query.value),
  { watch: [query] },
);

/**
 * "Tu hom nay tro di" la trang thai mac dinh, khong tinh la nguoi dung dang
 * loc — neu tinh thi nut "Dat lai" sang den suot ngay va mat y nghia.
 */
const isDefaultRange = computed(() => filters.from === today && !filters.to);
const hasFilters = computed(() =>
  Boolean(
    filters.keyword || filters.status || filters.serviceType || !isDefaultRange.value,
  ),
);

/**
 * Chip loc chay tren TRANG THAI that cua lich hen, con cot trang thai hien
 * BUOC. Mot trang thai om nhieu buoc, nen chip phai dat ten theo nhom —
 * goi la "Da tiep nhan" thi nguoi dung cho ra dung buoc do, ma ket qua
 * lai gom ca dang bao gia, dang sua, da xong.
 */
const STATUS_KEYS = ['PENDING', 'CONFIRMED', 'RECEIVED', 'DONE', 'CANCELLED', 'NO_SHOW'];

/** Dai "Dang loc" chi hien khi bo loc den tu duong dan, khong phai tu nguoi go. */
const activeLabel = computed(() => {
  if (filters.status) {
    return t('sa03.filtering', { what: t(`status.${filters.status}`) });
  }
  if (filters.from && filters.from === filters.to) {
    return t('sa03.filtering', { what: dayLabel(filters.from) });
  }
  return undefined;
});

const activeHint = computed(() =>
  data.value ? t('sa03.countHint', { n: data.value.meta.total }) : undefined,
);

/**
 * SA-03 — xac nhan ngay tren danh sach.
 *
 * Xac nhan lich la viec le tan lam nhieu nhat moi sang. Truoc day phai vao
 * chi tiet tung lich roi quay ra, bon thao tac va hai lan tai trang cho mot
 * cai. Gio bam thang tren dong, hoac tich nhieu dong roi xac nhan mot the.
 */
const confirming = ref<string[]>([]);
const selectedIds = ref<string[]>([]);

/** Chi lich dang cho moi xac nhan duoc — tich cac dong khac khong tinh. */
const selectedPending = computed(() => {
  const pending = new Set(
    (data.value?.items ?? []).filter((b) => b.status === 'PENDING').map((b) => b.id),
  );
  return selectedIds.value.filter((id) => pending.has(id));
});

async function confirmOne(booking: Booking): Promise<void> {
  if (confirming.value.includes(booking.id)) return;
  confirming.value = [...confirming.value, booking.id];
  try {
    await api.put(`/admin/bookings/${booking.id}/confirm`);
    ui.success(t('sa03.confirmedOne', { code: booking.code }), t('sa05.confirmedSub'));
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  } finally {
    confirming.value = confirming.value.filter((x) => x !== booking.id);
  }
}

const bulkBusy = ref(false);

async function confirmSelected(): Promise<void> {
  const ids = selectedPending.value;
  if (ids.length === 0 || bulkBusy.value) return;
  bulkBusy.value = true;
  try {
    const result = await api.put<{ confirmed: string[]; failed: { message: string }[] }>(
      '/admin/bookings/bulk-confirm',
      { ids },
    );
    if (result.confirmed.length) {
      ui.success(t('sa03.confirmedMany', { n: result.confirmed.length }), t('sa05.confirmedSub'));
    }
    // Noi ro co bao nhieu cai khong xac nhan duoc va vi sao, dung nuot di.
    if (result.failed.length) {
      ui.warning(t('sa03.confirmFailed', { n: result.failed.length }), result.failed[0]?.message);
    }
    selectedIds.value = [];
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  } finally {
    bulkBusy.value = false;
  }
}

const STATUS_OPTIONS = computed(() => [
  { value: '', label: t('common.all') },
  ...STATUS_KEYS.map((value) => ({ value, label: t(`bookingFilter.${value}`) })),
]);

function reset(): void {
  filters.keyword = '';
  filters.status = '';
  filters.serviceType = '';
  // Ve lai mac dinh "tu hom nay tro di", khong phai ve rong.
  filters.from = today;
  filters.to = '';
  page.value = 1;
}

/**
 * Bam vao mot dong thi den thang viec dang cho o do.
 *
 * Lich dang cho khach duyet bao gia thi viec can lam nam o man chot bao
 * gia — do la noi doc duoc khach da tra loi gi va bam tiep. Dua ho ve
 * man chi tiet lich hen roi bat tu tim duong sang la thua mot chang.
 */
const STAGE_DESTINATION: Record<string, (workOrderId: string) => string> = {
  // Da kham xong, viec ke tiep la lap bao gia.
  DIAGNOSED: (wo) => `/admin/work-orders/${wo}/quotation`,
  // Da gui bao gia, viec ke tiep la doc tra loi cua khach va chot.
  QUOTING: (wo) => `/admin/work-orders/${wo}/quote-confirm`,
  /**
   * Khach da dong y nhung xuong chua bam "Tien hanh" — van la man chot
   * bao gia, dung cho ma thong bao tren chuong dan toi. Vao tu danh sach
   * hay vao tu chuong deu phai ra cung mot cho, khong thi cung mot viec
   * lai co hai duong di khac nhau.
   */
  QUOTE_ACCEPTED: (wo) => `/admin/work-orders/${wo}/quote-confirm`,
  // Sua xong roi: viec con lai la thu tien va giao xe, mo thang man do.
  COMPLETED: (wo) => `/admin/work-orders/${wo}/payment`,
};

function openBooking(row: Booking): void {
  const to = row.stage ? STAGE_DESTINATION[row.stage] : undefined;
  if (to && row.workOrderId) {
    void navigateTo(to(row.workOrderId));
    return;
  }
  void navigateTo(`/admin/bookings/${row.id}`);
}

const COLUMNS = computed(() => [
  { key: 'code', label: t('sa03.colCode'), width: '130px' },
  { key: 'scheduledAt', label: t('sa03.colWhen'), sortable: true, width: '170px' },
  { key: 'contactName', label: t('sa03.colCustomer') },
  { key: 'vehicle', label: t('sa03.colVehicle') },
  { key: 'store', label: t('sa03.colStore') },
  { key: 'status', label: t('sa02.colStatus'), width: '150px' },
  { key: 'actions', label: '', width: '120px', align: 'right' as const },
]);

const SERVICE_TYPES = computed(() => [
  { value: '', label: t('common.all') },
  { value: 'MAINTENANCE', label: t('serviceType.MAINTENANCE') },
  { value: 'REPAIR', label: t('serviceType.REPAIR') },
  { value: 'INSPECTION', label: t('serviceType.INSPECTION') },
  { value: 'BOTH', label: t('serviceType.BOTH') },
]);

useHead({ title: () => `${t('sa03.title')} — AOYAMA Admin` });
</script>

<template>
  <div class="flex flex-col gap-[15px]">
    <AdminStoreBar />

    <div class="flex justify-end gap-2">
      <NuxtLink
        to="/admin/bookings/calendar"
        class="btn btn-secondary text-[13px]"
        style="min-height: 44px"
      >
        {{ $t('sa03.calendarCta') }}
      </NuxtLink>
      <NuxtLink to="/admin/bookings/new" class="btn btn-primary text-[13px]" style="min-height: 44px">
        {{ $t('sa03.newCta') }}
      </NuxtLink>
    </div>

    <AyFilterBar
      :has-active-filters="hasFilters"
      :active-label="activeLabel"
      :active-hint="activeHint"
      @reset="reset"
    >
      <AyField :label="$t('common.search')" class="min-w-[210px] max-w-[300px] flex-1">
        <template #default="{ id }">
          <input
            :id="id"
            v-model="filters.keyword"
            class="input"
            type="search"
            :placeholder="$t('sa03.searchPlaceholder')"
          />
        </template>
      </AyField>
      <AyField :label="$t('sa03.fromDate')" class="min-w-[150px]">
        <template #default="{ id }">
          <AyDateField :id="id" v-model="filters.from" />
        </template>
      </AyField>
      <AyField :label="$t('sa03.toDate')" class="min-w-[150px]">
        <template #default="{ id }">
          <AyDateField :id="id" v-model="filters.to" />
        </template>
      </AyField>
      <AyField :label="$t('sa03.serviceKind')" class="min-w-[160px]">
        <template #default="{ id }">
          <select :id="id" v-model="filters.serviceType" class="input">
            <option v-for="item in SERVICE_TYPES" :key="item.value" :value="item.value">
              {{ item.label }}
            </option>
          </select>
        </template>
      </AyField>

      <template #chips>
        <AyChipFilter v-model="filters.status" :label="$t('sa02.colStatus')" :options="STATUS_OPTIONS" />
      </template>
    </AyFilterBar>

    <!--
      Thanh nay chi hien khi da tich duoc it nhat mot lich DANG CHO. Tich
      nham mot lich da xac nhan thi no khong dem vao day, de nhan vien khong
      bam roi moi biet la khong an gi.
    -->
    <div
      v-if="selectedPending.length"
      class="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
      style="background: var(--color-accent-2-100); border-radius: 20px"
    >
      <span class="text-[13.5px] font-semibold">
        {{ $t('sa03.selectedPending', { n: selectedPending.length }) }}
      </span>
      <AyButton size="sm" :loading="bulkBusy" @click="confirmSelected">
        {{ $t('sa03.confirmSelected') }}
      </AyButton>
    </div>

    <AyDataTable
      :columns="COLUMNS"
      :rows="data?.items ?? []"
      :meta="data?.meta ?? null"
      :loading="pending"
      selectable
      sort-by="scheduledAt"
      :sort-order="sortOrder"
      :empty-title="$t('sa03.emptyTitle')"
      :empty-hint="$t('sa03.emptyHint')"
      @update:page="page = $event"
      @update:sort="sortOrder = $event.sortOrder"
      @update:selected="selectedIds = $event"
      @row-click="openBooking($event as Booking)"
    >
      <template #cell-code="{ row }">
        <span class="font-mono text-[12.5px]">{{ row.code }}</span>
      </template>
      <template #cell-scheduledAt="{ row }">
        {{ dayLabel(row.scheduledAt) }} · {{ clock(row.slotStartTime) }}
      </template>
      <template #cell-contactName="{ row }">
        <span class="font-semibold">{{ row.contactName }}</span>
        <span class="text-muted block text-[12px]">{{ row.contactPhone }}</span>
      </template>
      <template #cell-vehicle="{ row }">
        {{ row.vehicle?.plateNumber ?? '—' }}
      </template>
      <template #cell-store="{ row }">
        {{ i18n(row.store?.name ?? null) }}
      </template>
      <!--
        Hien BUOC chu khong phai trang thai tho: "Da tiep nhan" om tron ca
        giai doan sua xe, nhin vao danh sach khong biet xe dang cho khach
        duyet bao gia hay sap ban giao.
      -->
      <template #cell-status="{ row }">
        <AyStatusTag :status="(row.stage as string) ?? (row.status as string)" />
      </template>
      <!--
        Bam nut khong duoc mo chi tiet: @click.stop o the o, neu khong thi
        vua xac nhan xong la trang nhay di mat.
      -->
      <template #cell-actions="{ row }">
        <span v-if="row.status === 'PENDING'" @click.stop>
          <AyButton
            size="sm"
            variant="secondary"
            :loading="confirming.includes(row.id)"
            @click="confirmOne(row as Booking)"
          >
            {{ $t('sa05.confirm') }}
          </AyButton>
        </span>
      </template>
    </AyDataTable>
  </div>
</template>

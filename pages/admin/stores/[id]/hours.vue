<script setup lang="ts">
import type { Store, StoreHoliday } from '~/types/models';

/** SA-34 Gio lam viec va ngay nghi — FR-STO-03, FR-STO-04. */
definePageMeta({ layout: 'admin', middleware: ['admin', 'admin-only'] });

const route = useRoute();
const api = useApi();
const ui = useUiStore();
const { t } = useI18n();
const { i18n } = useFormat();

const id = route.params.id as string;
/** Ten bay thu; lay tu tep ngon ngu nen doi theo ngon ngu dang chon. */
const WEEKDAYS = computed(() => [0, 1, 2, 3, 4, 5, 6].map((d) => t(`weekday.${d}`)));

const { data: store, refresh } = await useAsyncData(`store-hours-${id}`, () =>
  api.get<Store>(`/admin/stores/${id}`),
);
if (!store.value) {
  throw createError({ statusCode: 404, statusMessage: t('sc06.notFound') });
}

/** Luon dung du 7 dong, ke ca khi CSDL chua co ban ghi cho thu do. */
const hours = ref(
  [0, 1, 2, 3, 4, 5, 6].map((weekday) => {
    const existing = store.value?.businessHours?.find((h) => h.weekday === weekday);
    return {
      weekday,
      openTime: existing?.openTime?.slice(0, 5) ?? '09:00',
      closeTime: existing?.closeTime?.slice(0, 5) ?? '18:00',
      isClosed: existing?.isClosed ?? false,
    };
  }),
);

const savingHours = ref(false);

async function saveHours(): Promise<void> {
  savingHours.value = true;
  try {
    await api.put(`/admin/stores/${id}/business-hours`, {
      hours: hours.value.map((h) => ({
        weekday: h.weekday,
        openTime: h.isClosed ? undefined : h.openTime,
        closeTime: h.isClosed ? undefined : h.closeTime,
        isClosed: h.isClosed,
      })),
    });
    ui.success(t('sa34.hoursSaved'));
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  } finally {
    savingHours.value = false;
  }
}

// ---- Ngay nghi ----
const holidayDate = ref('');
const holidayReason = ref('');

const { data: holidays, refresh: refreshHolidays } = await useAsyncData(`store-holidays-${id}`, () =>
  api.get<StoreHoliday[]>(`/admin/stores/${id}/holidays`, {
    from: new Date().toISOString().slice(0, 10),
  }),
);

async function addHoliday(): Promise<void> {
  if (!holidayDate.value) return;
  try {
    await api.post(`/admin/stores/${id}/holidays`, {
      date: holidayDate.value,
      reason: holidayReason.value || undefined,
    });
    ui.success(t('sa34.holidayAdded'), t('sa34.holidayAddedSub'));
    holidayDate.value = '';
    holidayReason.value = '';
    await refreshHolidays();
  } catch (error) {
    ui.error(normalizeError(error).message);
  }
}

async function removeHoliday(holidayId: string): Promise<void> {
  try {
    await api.del(`/admin/stores/${id}/holidays/${holidayId}`);
    await refreshHolidays();
  } catch (error) {
    ui.error(normalizeError(error).message);
  }
}

setScreenTitle(() => t('sa34.headTitle'));
useHead({ title: () => `${t('sa34.headTitle')} — AOYAMA Admin` });
</script>

<template>
  <div v-if="store" class="admin-form admin-form-wide">
    <AyPageHeader
      code="SA-34" :title="$t('sa34.title')" back-to="/admin/stores"
      :description="i18n(store.name)"
    >
      <template #actions>
        <AyButton :to="`/admin/stores/${id}/slots`" variant="secondary" size="sm">{{ $t('sa32.slotsCta') }}</AyButton>
      </template>
    </AyPageHeader>

    <section class="card" style="background: #fff">
      <h2 class="mb-3 font-heading text-[16px]">{{ $t('sa34.byWeekday') }}</h2>

      <ul class="flex flex-col gap-2">
        <li v-for="hour in hours" :key="hour.weekday" class="flex flex-wrap items-center gap-3">
          <span class="w-24 text-[14px]">{{ WEEKDAYS[hour.weekday] }}</span>

          <label class="flex items-center gap-2 text-[13px]">
            <input v-model="hour.isClosed" type="checkbox" class="h-4 w-4 accent-[var(--color-accent)]">
            {{ $t('sa34.closed') }}
          </label>

          <template v-if="!hour.isClosed">
            <input
              v-model="hour.openTime" class="input h-10 min-h-0 w-auto py-1" type="time"
              :aria-label="$t('sa34.openAria', { day: WEEKDAYS[hour.weekday] })"
            >
            <span class="text-muted">–</span>
            <input
              v-model="hour.closeTime" class="input h-10 min-h-0 w-auto py-1" type="time"
              :aria-label="$t('sa34.closeAria', { day: WEEKDAYS[hour.weekday] })"
            >
          </template>
        </li>
      </ul>

      <div class="admin-actions mt-3">
        <AyButton :loading="savingHours" @click="saveHours">{{ $t('sa34.saveHours') }}</AyButton>
      </div>
    </section>

    <section class="card" style="background: #fff">
      <h2 class="mb-3 font-heading text-[16px]">{{ $t('sa34.holidays') }}</h2>

      <div class="flex flex-wrap items-end gap-2">
        <AyField :label="$t('sa34.date')">
          <template #default="{ id: fid }">
            <input :id="fid" v-model="holidayDate" class="input" type="date">
          </template>
        </AyField>
        <AyField :label="$t('sa29.reason')" class="min-w-[200px] flex-1">
          <template #default="{ id: fid }">
            <input :id="fid" v-model="holidayReason" class="input" type="text" :placeholder="$t('sa34.reasonPlaceholder')">
          </template>
        </AyField>
        <AyButton :disabled="!holidayDate" @click="addHoliday">{{ $t('sa34.addHoliday') }}</AyButton>
      </div>

      <AyEmptyState
        v-if="(holidays ?? []).length === 0"
        :title="$t('sa34.noHolidays')"
        :hint="$t('sa34.noHolidaysHint')"
      />

      <ul v-else class="mt-3 flex flex-col gap-1.5">
        <li
          v-for="holiday in holidays ?? []" :key="holiday.id"
          class="flex items-center gap-3 border-b border-divider pb-1.5 text-[13.5px] last:border-0"
        >
          <span class="font-heading">{{ holiday.date }}</span>
          <span class="flex-1 text-muted">{{ holiday.reason ?? '—' }}</span>
          <button type="button" class="text-[12.5px] text-danger underline" @click="removeHoliday(holiday.id)">
            {{ $t('common.delete') }}
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

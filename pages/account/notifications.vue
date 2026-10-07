<script setup lang="ts">
import type { NotificationLog } from '~/types/models';

/**
 * SC-33 Thong bao cua toi.
 *
 * Cua hang van nhan tin SMS nhu cu; day la ban sao doc duoc ngay trong ung
 * dung, de khach khong phai lui tim giua ca hop tin nhan dien thoai. Mo
 * trang la danh dau da doc het — khong bat bam tung cai, vi doc luot qua
 * danh sach cung la doc roi.
 */
definePageMeta({ middleware: 'auth' });

const { t } = useI18n();
const api = useApi();
const { dateTime } = useFormat();

const { data: items, pending } = await useAsyncData('thong-bao-cua-toi', () =>
  api.get<NotificationLog[]>('/account/notifications'),
);

onMounted(async () => {
  try {
    await api.put('/account/notifications/read-all', {});
  } catch {
    // Khong danh dau duoc thi chi la con so tren chuong chua giam — bo qua.
  }
});

/**
 * Don than tin nhan cho hop voi trong ung dung.
 *
 * Mot, cat "【AOYAMA】" va ten khach o dau: trong ung dung khach biet
 * minh la ai va dang o dau roi.
 *
 * Hai, bo duong dan. Tin nhan SMS phai dinh kem link vi do la duong duy
 * nhat de khach bam sang; con o day khach dang o trong ung dung roi, mot
 * chuoi http dai loong ngoong chi lam kho doc. Dong nao chi con moi cai
 * nhan dan duong ("ご確認", "進捗確認") thi bo luon ca dong.
 */
function body(log: NotificationLog): string {
  return log.body
    .replace(/^【[^】]*】\s*/, '')
    .split('\n')
    .map((line) => ({ line, rest: line.replace(/https?:\/\/\S+/g, '').trim() }))
    .filter(({ line, rest }) => rest.length > 0 && !(line !== rest && rest.length <= 12))
    .map(({ rest }) => rest)
    .join('\n')
    .trim();
}

useHead({ title: () => t('sc33.title') });
</script>

<template>
  <div class="flex flex-col gap-3.5 pb-4 pt-2">
    <div>
      <h3 class="mb-1.5">{{ $t('sc33.title') }}</h3>
      <p class="text-muted text-[12.5px]">{{ $t('sc33.lead') }}</p>
    </div>

    <AyLoading v-if="pending" :label="$t('common.loading')" />

    <AyEmptyState v-else-if="(items ?? []).length === 0" :title="$t('sc33.empty')" />

    <ul v-else class="flex flex-col gap-2.5">
      <!--
        Bam vao mot thong bao la muon xem chiec xe cua minh den dau roi,
        nen ca the dan thang sang man theo doi tien do. Tin khong gan
        lich hen nao thi de nguyen, khong bien thanh lien ket cut.
      -->
      <li v-for="log in items ?? []" :key="log.id">
        <NuxtLink
          v-if="log.bookingCode"
          :to="`/bookings/${log.bookingCode}/progress`"
          class="card flex flex-col gap-1.5"
          style="color: inherit; text-decoration: none"
          :style="log.readAt ? undefined : { borderLeft: '3px solid var(--color-accent)' }"
        >
          <span class="flex items-baseline justify-between gap-2.5">
            <span class="font-heading text-[13.5px]">{{ $t(`notifEvent.${log.event}`) }}</span>
            <span class="text-muted whitespace-nowrap text-[11.5px]">
              {{ dateTime(log.createdAt) }}
            </span>
          </span>
          <span class="whitespace-pre-line text-[13px] leading-[1.55]">{{ body(log) }}</span>
          <span class="text-[12px] font-semibold" style="color: var(--color-accent-700)">
            {{ $t('sc33.openProgress') }}
          </span>
        </NuxtLink>

        <!-- Tin khong gan lich hen nao thi de nguyen, khong thanh lien ket cut. -->
        <div
          v-else
          class="card flex flex-col gap-1.5"
          :style="log.readAt ? undefined : { borderLeft: '3px solid var(--color-accent)' }"
        >
          <span class="flex items-baseline justify-between gap-2.5">
            <span class="font-heading text-[13.5px]">{{ $t(`notifEvent.${log.event}`) }}</span>
            <span class="text-muted whitespace-nowrap text-[11.5px]">
              {{ dateTime(log.createdAt) }}
            </span>
          </span>
          <span class="whitespace-pre-line text-[13px] leading-[1.55]">{{ body(log) }}</span>
        </div>
      </li>
    </ul>

    <NuxtLink to="/account/bookings" class="btn btn-ghost self-center text-[13px]">
      {{ $t('nav.myBookings') }} →
    </NuxtLink>
  </div>
</template>

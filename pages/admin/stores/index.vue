<script setup lang="ts">
import type { Store } from '~/types/models';

/** SA-32 Danh sach cua hang — FR-STO-01. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();
const auth = useAuthStore();
const { t } = useI18n();
const { i18n } = useFormat();

const { data: stores, refresh } = await useAsyncData('admin-stores-list', () =>
  api.get<Store[]>('/admin/stores', { includeInactive: 'true' }),
);

const deactivateTarget = ref<Store | null>(null);

async function deactivate(): Promise<void> {
  if (!deactivateTarget.value) return;
  try {
    await api.del(`/admin/stores/${deactivateTarget.value.id}`);
    ui.success(t('sa32.stopped'));
    deactivateTarget.value = null;
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  }
}

setScreenTitle(() => t('sa32.title'));
useHead({ title: () => `${t('sa32.title')} — AOYAMA Admin` });
</script>

<template>
  <div class="flex flex-col gap-4">
    <AyPageHeader code="SA-32" :title="$t('sa32.title')">
      <template #actions>
        <AyButton v-if="auth.isSuperAdmin" to="/admin/stores/new/edit" size="sm">{{ $t('sa32.addCta') }}</AyButton>
      </template>
    </AyPageHeader>

    <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      <article v-for="store in stores ?? []" :key="store.id" class="card flex flex-col gap-2">
        <div class="flex items-start justify-between gap-2">
          <div>
            <h2 class="font-heading text-[16px]">{{ i18n(store.name) }}</h2>
            <p class="font-mono text-[11.5px] text-muted">{{ store.code }}</p>
          </div>
          <span
            class="tag"
            :class="store.isActive ? 'bg-success-bg text-success' : 'bg-neutral-200 text-neutral-600'"
          >
            {{ store.isActive ? $t('sa32.active') : $t('sa32.inactive') }}
          </span>
        </div>

        <p class="text-[13px] text-muted">{{ i18n(store.address) }}</p>
        <p class="text-[13.5px]">
          {{ store.phone }}
          <span v-if="store.fax" class="text-muted">· FAX {{ store.fax }}</span>
        </p>
        <p class="text-[12.5px] text-muted">
          {{ $t('sa32.capacity', { n: store.defaultCapacity }) }}
        </p>

        <div class="mt-auto flex flex-wrap gap-1.5 pt-2">
          <AyButton :to="`/admin/stores/${store.id}/edit`" variant="secondary" size="sm">{{ $t('common.edit') }}</AyButton>
          <AyButton :to="`/admin/stores/${store.id}/hours`" variant="secondary" size="sm">{{ $t('sa32.hoursCta') }}</AyButton>
          <AyButton :to="`/admin/stores/${store.id}/slots`" variant="secondary" size="sm">{{ $t('sa32.slotsCta') }}</AyButton>
          <AyButton
            v-if="store.isActive && auth.isSuperAdmin"
            variant="ghost" size="sm" @click="deactivateTarget = store"
          >
            {{ $t('sa32.stop') }}
          </AyButton>
        </div>
      </article>
    </div>

    <AyConfirmDialog
      :open="Boolean(deactivateTarget)"
      :title="$t('sa32.askStop')"
      :message="$t('sa32.askStopBody')"
      :confirm-label="$t('sa32.stopConfirm')"
      danger
      @confirm="deactivate"
      @cancel="deactivateTarget = null"
    />
  </div>
</template>

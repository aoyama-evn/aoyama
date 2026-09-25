<script setup lang="ts">
import type { Store } from '~/types/models';

/**
 * Bo chon cua hang dat o dau noi dung man hinh quan tri — ban thiet ke ve no o
 * day chu khong o CP-05.
 *
 * SA-02 ve dang day the bam, con cac man hinh danh sach ve dang o chon; prop
 * "variant" chon giua hai kieu do.
 */
withDefaults(defineProps<{ variant?: 'chips' | 'select'; label?: string }>(), {
  variant: 'select',
  label: 'Cửa hàng',
});

const api = useApi();
const auth = useAuthStore();
const ui = useUiStore();
const { i18n } = useFormat();

const { data: stores } = await useAsyncData('admin-stores', () => api.get<Store[]>('/admin/stores'));

/** Tai khoan gan voi mot cua hang thi khong duoc doi sang cua hang khac. */
const locked = computed(() => Boolean(auth.user?.storeId));

onMounted(() => {
  ui.restoreActiveStore();
  if (auth.user?.storeId) ui.setActiveStore(auth.user.storeId);
});

function pick(id: string | null): void {
  if (!locked.value) ui.setActiveStore(id);
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2.5">
    <span
      class="text-[10px] uppercase"
      style="letter-spacing: 0.09em; color: var(--color-neutral-600)"
    >
      {{ label }}
    </span>

    <template v-if="variant === 'chips'">
      <button
        v-for="store in stores ?? []"
        :key="store.id"
        type="button"
        class="ay-store-chip"
        :class="ui.activeStoreId === store.id ? 'ay-store-chip-on' : ''"
        :disabled="locked"
        :aria-pressed="ui.activeStoreId === store.id"
        @click="pick(store.id)"
      >
        {{ i18n(store.name) }}
      </button>
      <button
        type="button"
        class="ay-store-chip"
        :class="ui.activeStoreId === null ? 'ay-store-chip-on' : ''"
        :disabled="locked"
        :aria-pressed="ui.activeStoreId === null"
        @click="pick(null)"
      >
        Tất cả
      </button>
    </template>

    <select
      v-else
      class="input"
      style="width: auto; min-width: 220px; padding-right: 34px"
      :aria-label="label"
      :disabled="locked"
      :value="ui.activeStoreId ?? ''"
      @change="pick(($event.target as HTMLSelectElement).value || null)"
    >
      <option value="">Tất cả cửa hàng</option>
      <option v-for="store in stores ?? []" :key="store.id" :value="store.id">
        {{ i18n(store.name) }}
      </option>
    </select>

    <slot name="end" />
  </div>
</template>

<style scoped>
.ay-store-chip {
  border-radius: 999px;
  background: #fff;
  padding: 6px 14px;
  font-family: var(--font-body);
  font-size: 12.5px;
  color: var(--color-text);
}
.ay-store-chip:hover:not(:disabled) {
  background: var(--color-accent-200);
}
.ay-store-chip-on {
  background: var(--color-accent);
  font-weight: 700;
  color: var(--color-bg);
}
.ay-store-chip-on:hover:not(:disabled) {
  background: var(--color-accent);
}
.ay-store-chip:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>

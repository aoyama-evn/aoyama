<script setup lang="ts">
import type { CustomerProfile } from '~/types/models';

/** SA-18 Gop ho so khach hang — FR-CUS-06, FR-CUS-07. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();
const { date } = useFormat();

const { data: pairs, refresh } = await useAsyncData('admin-duplicates', () =>
  api.get<{ left: CustomerProfile; right: CustomerProfile }[]>('/admin/customers/duplicates'),
);

const selected = ref<{ left: CustomerProfile; right: CustomerProfile } | null>(null);
const keepId = ref<string>('');
const merging = ref(false);

/**
 * Mac dinh giu ho so da dang ky — ho so do co tai khoan dang nhap gan voi no.
 * Neu ca hai cung loai thi giu ho so tao truoc, vi lich su thuong dai hon.
 */
function choose(pair: { left: CustomerProfile; right: CustomerProfile }): void {
  selected.value = pair;
  if (!pair.left.isGuest) keepId.value = pair.left.id;
  else if (!pair.right.isGuest) keepId.value = pair.right.id;
  else keepId.value = pair.left.createdAt <= pair.right.createdAt ? pair.left.id : pair.right.id;
}

async function merge(): Promise<void> {
  if (!selected.value || !keepId.value) return;
  const sourceId =
    selected.value.left.id === keepId.value ? selected.value.right.id : selected.value.left.id;

  merging.value = true;
  try {
    await api.post('/admin/customers/merge', { sourceId, targetId: keepId.value });
    ui.success('Đã gộp hồ sơ', 'Toàn bộ xe và lịch sử đã chuyển sang hồ sơ giữ lại.');
    selected.value = null;
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  } finally {
    merging.value = false;
  }
}

useHead({ title: 'Gộp hồ sơ khách hàng — AOYAMA Admin' });
</script>

<template>
  <div class="flex flex-col gap-4">
    <AyPageHeader
      code="SA-18" title="Gộp hồ sơ khách hàng trùng" back-to="/admin/customers"
      description="Hệ thống gợi ý các cặp hồ sơ cùng tên. Chọn hồ sơ giữ lại — xe và lịch sử của hồ sơ kia sẽ chuyển sang."
    />

    <AyEmptyState
      v-if="(pairs ?? []).length === 0"
      title="Không phát hiện hồ sơ trùng"
      hint="Hệ thống so khớp theo tên khách hàng. Nếu nghi ngờ trùng, tìm theo số điện thoại ở danh sách khách hàng."
    >
      <AyButton to="/admin/customers" variant="secondary" size="sm">Về danh sách</AyButton>
    </AyEmptyState>

    <ul v-else class="flex flex-col gap-2">
      <li
        v-for="(pair, index) in pairs ?? []" :key="index"
        class="card grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-center"
      >
        <div>
          <p class="font-semibold">{{ pair.left.name }}</p>
          <p class="text-[12.5px] text-muted">
            {{ pair.left.phone }} · tạo {{ date(pair.left.createdAt) }}
          </p>
        </div>
        <span class="hidden text-center text-muted sm:block" aria-hidden="true">↔</span>
        <div>
          <p class="font-semibold">{{ pair.right.name }}</p>
          <p class="text-[12.5px] text-muted">
            {{ pair.right.phone }} · tạo {{ date(pair.right.createdAt) }}
          </p>
        </div>
        <AyButton variant="secondary" size="sm" @click="choose(pair)">Xem &amp; gộp</AyButton>
      </li>
    </ul>

    <AyConfirmDialog
      :open="Boolean(selected)"
      title="Gộp hai hồ sơ khách hàng"
      message="Thao tác này không hoàn tác được. Hồ sơ không giữ lại sẽ bị khóa và trỏ tới hồ sơ giữ lại."
      confirm-label="Gộp hồ sơ"
      danger
      confirm-phrase="GOP"
      :loading="merging"
      @confirm="merge"
      @cancel="selected = null"
    >
      <fieldset v-if="selected" class="mt-3 flex flex-col gap-2">
        <legend class="label">Giữ lại hồ sơ nào?</legend>
        <label
          v-for="candidate in [selected.left, selected.right]" :key="candidate.id"
          class="flex items-start gap-2.5 rounded-xl border px-3 py-2 text-[13.5px]"
          :class="keepId === candidate.id ? 'border-accent bg-accent-100' : 'border-neutral-300'"
        >
          <input v-model="keepId" type="radio" :value="candidate.id" class="mt-1 accent-[var(--color-accent)]">
          <span>
            <strong>{{ candidate.name }}</strong>
            <span class="block text-muted">
              {{ candidate.phone }}
              · {{ candidate.isGuest ? 'khách vãng lai' : 'đã đăng ký' }}
              · tạo {{ date(candidate.createdAt) }}
            </span>
          </span>
        </label>
      </fieldset>
    </AyConfirmDialog>
  </div>
</template>

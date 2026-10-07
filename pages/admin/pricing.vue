<script setup lang="ts">
import type { PriceRule, ServiceItem, Store } from '~/types/models';

/** SA-24 Quan ly bang gia — FR-SVC-04..06, FR-SVC-08, BR-36..BR-38. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();
const { t } = useI18n();
const { i18n, money } = useFormat();

const serviceFilter = ref('');

const { data: refs } = await useAsyncData('pricing-refs', async () => {
  const [services, stores] = await Promise.all([
    api.get<ServiceItem[]>('/services'),
    api.get<Store[]>('/admin/stores'),
  ]);
  return { services, stores };
});

const { data: rules, pending, refresh } = await useAsyncData(
  'pricing-rules',
  () => api.get<PriceRule[]>('/admin/pricing', { serviceId: serviceFilter.value || undefined }),
  { watch: [serviceFilter] },
);

const editing = ref<Partial<PriceRule> | null>(null);
const deleteTarget = ref<PriceRule | null>(null);
const saving = ref(false);

function startNew(): void {
  editing.value = {
    serviceId: serviceFilter.value || refs.value?.services[0]?.id,
    engineCcFrom: 0,
    engineCcTo: 125,
    difficultyLevel: 1,
    price: 0,
    isActive: true,
  };
}

async function save(): Promise<void> {
  if (!editing.value?.serviceId) return;
  saving.value = true;
  try {
    await api.post('/admin/pricing', editing.value);
    ui.success(t('sa24.saved'));
    editing.value = null;
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  } finally {
    saving.value = false;
  }
}

async function remove(): Promise<void> {
  if (!deleteTarget.value) return;
  try {
    await api.del(`/admin/pricing/${deleteTarget.value.id}`);
    ui.success(t('sa24.deleted'));
    deleteTarget.value = null;
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  }
}

function serviceName(serviceId: string): string {
  const found = refs.value?.services.find((s) => s.id === serviceId);
  return found ? i18n(found.name) : serviceId;
}

function storeName(storeId: string | null): string {
  if (!storeId) return t('sa24.allStores');
  const found = refs.value?.stores.find((s) => s.id === storeId);
  return found ? i18n(found.name) : storeId;
}

function rangeLabel(rule: PriceRule): string {
  const from = rule.engineCcFrom ?? 0;
  const to = rule.engineCcTo;
  return to ? t('sa24.ccRange', { from, to }) : t('sa24.ccFromOnly', { from });
}

setScreenTitle(() => t('sa24.headTitle'));
useHead({ title: () => `${t('sa24.headTitle')} — AOYAMA Admin` });
</script>

<template>
  <div class="flex flex-col gap-4">
    <AdminCatalogTabs />
    <AyPageHeader
      code="SA-24" :title="$t('sa24.title')"
      :description="$t('sa24.lead')"
    >
      <template #actions>
        <AyButton size="sm" @click="startNew">{{ $t('sa24.addRule') }}</AyButton>
      </template>
    </AyPageHeader>

    <AyFilterBar :has-active-filters="Boolean(serviceFilter)" @reset="serviceFilter = ''">
      <AyField :label="$t('sa24.filterBy')" class="min-w-[260px]">
        <template #default="{ id }">
          <select :id="id" v-model="serviceFilter" class="input">
            <option value="">{{ $t('sa24.allServices') }}</option>
            <option v-for="service in refs?.services ?? []" :key="service.id" :value="service.id">
              {{ i18n(service.name) }}
            </option>
          </select>
        </template>
      </AyField>
    </AyFilterBar>

    <AyLoading v-if="pending" />

    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th scope="col">{{ $t('sa02.colService') }}</th>
            <th scope="col">{{ $t('sa03.colStore') }}</th>
            <th scope="col">{{ $t('sa24.segment') }}</th>
            <th scope="col" class="text-center">{{ $t('sa24.difficulty') }}</th>
            <th scope="col" class="text-right">{{ $t('money.total') }}</th>
            <th scope="col">{{ $t('sa24.validity') }}</th>
            <th scope="col" class="w-24" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="rule in rules ?? []" :key="rule.id">
            <td>{{ serviceName(rule.serviceId) }}</td>
            <td>{{ storeName(rule.storeId) }}</td>
            <td>{{ rangeLabel(rule) }}</td>
            <td class="text-center">{{ rule.difficultyLevel }}</td>
            <td class="text-right font-heading">{{ money(rule.price) }}</td>
            <td class="text-[12.5px] text-muted">
              {{ rule.validFrom ?? '—' }} → {{ rule.validTo ?? '—' }}
            </td>
            <td>
              <button type="button" class="text-[12.5px] underline" @click="editing = { ...rule }">{{ $t('common.edit') }}</button>
              <button type="button" class="ml-2 text-[12.5px] text-danger underline" @click="deleteTarget = rule">{{ $t('common.delete') }}</button>
            </td>
          </tr>
          <tr v-if="(rules ?? []).length === 0">
            <td colspan="7" class="p-0">
              <AyEmptyState
                :title="$t('sa24.empty')"
                :hint="$t('sa24.emptyHint')"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Bieu mau them hoac sua -->
    <div v-if="editing" class="card grid gap-3 sm:grid-cols-3">
      <h2 class="font-heading text-[16px] sm:col-span-3">
        {{ editing.id ? $t('sa24.editRule') : $t('sa24.addRule') }}
      </h2>

      <AyField :label="$t('sa02.colService')" required>
        <template #default="{ id }">
          <select :id="id" v-model="editing.serviceId" class="input">
            <option v-for="service in refs?.services ?? []" :key="service.id" :value="service.id">
              {{ i18n(service.name) }}
            </option>
          </select>
        </template>
      </AyField>

      <AyField :label="$t('sa03.colStore')" :hint="$t('sa24.allStoresHint')">
        <template #default="{ id }">
          <select :id="id" v-model="editing.storeId" class="input">
            <option :value="null">{{ $t('sa24.allStores') }}</option>
            <option v-for="store in refs?.stores ?? []" :key="store.id" :value="store.id">
              {{ i18n(store.name) }}
            </option>
          </select>
        </template>
      </AyField>

      <AyField :label="$t('sa24.difficulty')" :hint="$t('sa24.difficultyHint')">
        <template #default="{ id }">
          <select :id="id" v-model.number="editing.difficultyLevel" class="input">
            <option :value="1">1</option><option :value="2">2</option><option :value="3">3</option>
          </select>
        </template>
      </AyField>

      <AyField :label="$t('sa24.ccFrom')">
        <template #default="{ id }">
          <input :id="id" v-model.number="editing.engineCcFrom" class="input" type="number" min="0">
        </template>
      </AyField>

      <AyField :label="$t('sa24.ccTo')" :hint="$t('sa24.ccToHint')">
        <template #default="{ id }">
          <input :id="id" v-model.number="editing.engineCcTo" class="input" type="number" min="0">
        </template>
      </AyField>

      <AyField :label="$t('sa24.price')" required>
        <template #default="{ id }">
          <input :id="id" v-model.number="editing.price" class="input" type="number" min="0">
        </template>
      </AyField>

      <AyField :label="$t('sa24.validFrom')">
        <template #default="{ id }">
          <AyDateField :id="id" v-model="editing.validFrom" />
        </template>
      </AyField>

      <AyField :label="$t('sa24.validTo')">
        <template #default="{ id }">
          <AyDateField :id="id" v-model="editing.validTo" />
        </template>
      </AyField>

      <div class="flex items-end gap-2">
        <AyButton :loading="saving" @click="save">{{ $t('common.save') }}</AyButton>
        <AyButton variant="secondary" @click="editing = null">{{ $t('common.cancel') }}</AyButton>
      </div>
    </div>

    <AyConfirmDialog
      :open="Boolean(deleteTarget)"
      :title="$t('sa24.askDelete')"
      :message="$t('sa24.askDeleteBody')"
      :confirm-label="$t('common.delete')"
      danger
      @confirm="remove"
      @cancel="deleteTarget = null"
    />
  </div>
</template>

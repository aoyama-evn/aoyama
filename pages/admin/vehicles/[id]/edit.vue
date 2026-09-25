<script setup lang="ts">
import type { ApiError, CustomerProfile, Page, Vehicle } from '~/types/models';
import type { VehicleFormValue } from '~/components/ui/AyVehicleForm.vue';

/** SA-21 Them hoac sua phuong tien — FR-VEH-08, FR-VEH-02, FR-VEH-03. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const route = useRoute();
const { t } = useI18n();
const api = useApi();
const ui = useUiStore();

const id = route.params.id as string;
const isNew = id === 'new';

const customerId = ref((route.query.customerId as string) ?? '');
const customerKeyword = ref('');
const customerResults = ref<CustomerProfile[]>([]);
const form = ref<VehicleFormValue>({
  plateNumber: '', maker: '', model: '', modelYear: null, engineCc: null,
  color: null, currentOdometer: null, note: null,
});
const errors = reactive<Record<string, string>>({});
const saving = ref(false);
const error = ref<ApiError | null>(null);

if (!isNew) {
  const { data } = await useAsyncData(`admin-vehicle-edit-${id}`, () =>
    api.get<Vehicle>(`/admin/vehicles/${id}`),
  );
  if (data.value) {
    customerId.value = data.value.customerId;
    form.value = {
      plateNumber: data.value.plateNumber,
      maker: data.value.maker,
      model: data.value.model,
      modelYear: data.value.modelYear,
      engineCc: data.value.engineCc,
      color: data.value.color,
      currentOdometer: data.value.currentOdometer,
      note: data.value.note,
    };
  }
}

const searchCustomers = useDebounceFn(async () => {
  if (customerKeyword.value.trim().length < 2) {
    customerResults.value = [];
    return;
  }
  const page = await api.get<Page<CustomerProfile>>('/admin/customers', {
    keyword: customerKeyword.value.trim(),
    limit: 8,
  });
  customerResults.value = page.items;
}, 300);

watch(customerKeyword, () => searchCustomers());

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k]);
  if (!customerId.value) errors.customer = t('sa21.ownerRequired');
  if (!form.value.plateNumber.trim()) errors.plateNumber = t('validate.plate');
  if (!form.value.maker.trim()) errors.maker = t('sc30.makerRequired');
  if (!form.value.model.trim()) errors.model = t('validate.model');
  return Object.keys(errors).length === 0;
}

async function save(): Promise<void> {
  if (!validate()) return;
  saving.value = true;
  error.value = null;
  try {
    if (isNew) {
      const created = await api.post<Vehicle>('/admin/vehicles', {
        ...form.value,
        customerId: customerId.value,
      });
      ui.success(t('sa21.added'));
      await navigateTo(`/admin/vehicles/${created.id}`);
    } else {
      await api.put(`/admin/vehicles/${id}`, form.value);
      ui.success(t('common.saved'));
      await navigateTo(`/admin/vehicles/${id}`);
    }
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    saving.value = false;
  }
}

setScreenTitle(() => (isNew ? t('sa21.addTitle') : t('sa21.editTitle')));
useHead({ title: () => (isNew ? t('sa21.addTitle') : t('sa21.editTitle')) });
</script>

<template>
  <div class="admin-form">
    <AyPageHeader
      code="SA-21" :title="isNew ? $t('sa21.addTitle') : $t('sa21.editTitle')"
      :back-to="isNew ? '/admin/vehicles' : `/admin/vehicles/${id}`"
    />

    <section v-if="isNew" class="card flex flex-col gap-2">
      <AyField :label="$t('sa21.ownerLabel')" required :error="errors.customer" :hint="$t('sa21.ownerHint')">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="customerKeyword" class="input" type="search">
        </template>
      </AyField>

      <ul v-if="customerResults.length" class="flex flex-col gap-1">
        <li v-for="customer in customerResults" :key="customer.id">
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13.5px]"
            :class="customerId === customer.id ? 'bg-accent-100' : 'hover:bg-neutral-200'"
            @click="customerId = customer.id; customerKeyword = customer.name"
          >
            <span class="flex-1">{{ customer.name }}</span>
            <span class="text-muted">{{ customer.phone }}</span>
          </button>
        </li>
      </ul>
    </section>

    <form class="card flex flex-col gap-4" style="background: #fff" @submit.prevent="save">
      <AyVehicleForm v-model="form" :errors="errors" />
      <AyErrorNote :error="error" />
      <div class="admin-actions">
        <AyButton :to="isNew ? '/admin/vehicles' : `/admin/vehicles/${id}`" variant="secondary">{{ $t('common.cancel') }}</AyButton>
        <AyButton type="submit" :loading="saving">{{ $t('common.save') }}</AyButton>
      </div>
    </form>
  </div>
</template>

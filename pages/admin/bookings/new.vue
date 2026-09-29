<script setup lang="ts">
import type {
  ApiError,
  CustomerProfile,
  DayAvailability,
  Page,
  ServiceItem,
  Store,
  Vehicle,
} from '~/types/models';
import type { VehicleFormValue } from '~/components/ui/AyVehicleForm.vue';

/** SA-06 Tao lich hen thay khach — FR-BOOK-19, BR-12. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();
const { t } = useI18n();
const { i18n, money } = useFormat();

const { data: refs } = await useAsyncData('admin-new-booking-refs', async () => {
  const [services, stores] = await Promise.all([
    api.get<ServiceItem[]>('/services'),
    api.get<Store[]>('/admin/stores'),
  ]);
  return { services, stores };
});

const form = reactive({
  storeId: ui.activeStoreId ?? '',
  serviceIds: [] as string[],
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  customerId: '' as string,
  symptomDescription: '',
  adminNote: '',
});
const vehicle = ref<VehicleFormValue>({
  plateNumber: '', maker: '', model: '', engineCc: null, currentOdometer: null,
  modelYear: null, color: null, note: null,
});
const slot = ref<{ date: string; startTime: string } | null>(null);
const days = ref<DayAvailability[]>([]);
const loadingSlots = ref(false);
const submitting = ref(false);
const error = ref<ApiError | null>(null);

/** Tim ho so khach theo so dien thoai de khong tao trung — BR-01. */
const matchedCustomer = ref<CustomerProfile | null>(null);
const customerVehicles = ref<Vehicle[]>([]);
const selectedVehicleId = ref<string>('');

const searchCustomer = useDebounceFn(async () => {
  const phone = form.contactPhone.trim();
  if (phone.length < 8) {
    matchedCustomer.value = null;
    customerVehicles.value = [];
    return;
  }
  try {
    const page = await api.get<Page<CustomerProfile>>('/admin/customers', { keyword: phone, limit: 1 });
    matchedCustomer.value = page.items[0] ?? null;
    if (matchedCustomer.value) {
      form.customerId = matchedCustomer.value.id;
      if (!form.contactName) form.contactName = matchedCustomer.value.name;
      const vehiclePage = await api.get<Page<Vehicle>>('/admin/vehicles', {
        customerId: matchedCustomer.value.id,
        limit: 20,
      });
      customerVehicles.value = vehiclePage.items;
    } else {
      form.customerId = '';
      customerVehicles.value = [];
    }
  } catch {
    matchedCustomer.value = null;
  }
}, 400);

watch(() => form.contactPhone, () => searchCustomer());

async function loadSlots(): Promise<void> {
  if (!form.storeId) return;
  loadingSlots.value = true;
  try {
    days.value = await api.get<DayAvailability[]>('/bookings/availability', {
      storeId: form.storeId,
      from: new Date().toISOString().slice(0, 10),
      days: 28,
    });
  } finally {
    loadingSlots.value = false;
  }
}

watch(() => form.storeId, loadSlots, { immediate: true });

function pickVehicle(id: string): void {
  selectedVehicleId.value = id;
  const found = customerVehicles.value.find((v) => v.id === id);
  if (found) {
    vehicle.value = {
      plateNumber: found.plateNumber,
      maker: found.maker,
      model: found.model,
      engineCc: found.engineCc,
      currentOdometer: found.currentOdometer,
      modelYear: found.modelYear,
      color: found.color,
      note: found.note,
    };
  }
}

const serviceType = computed(() => {
  const selected = (refs.value?.services ?? []).filter((s) => form.serviceIds.includes(s.id));
  return bookingServiceTypeOf(selected.map((s) => kindOfService(s.type)));
});

const canSubmit = computed(
  () =>
    Boolean(form.storeId) &&
    form.serviceIds.length > 0 &&
    Boolean(slot.value) &&
    form.contactName.trim().length > 0 &&
    form.contactPhone.trim().length > 0,
);

async function submit(): Promise<void> {
  if (!canSubmit.value || !slot.value) return;
  submitting.value = true;
  error.value = null;
  try {
    const created = await api.post<{ id: string; code: string }>('/admin/bookings', {
      storeId: form.storeId,
      serviceType: serviceType.value,
      serviceIds: form.serviceIds,
      date: slot.value.date,
      startTime: slot.value.startTime,
      contactName: form.contactName.trim(),
      contactPhone: form.contactPhone.trim(),
      contactEmail: form.contactEmail.trim() || undefined,
      customerId: form.customerId || undefined,
      vehicle: selectedVehicleId.value
        ? { vehicleId: selectedVehicleId.value }
        : vehicle.value.plateNumber
          ? {
              plateNumber: vehicle.value.plateNumber,
              maker: vehicle.value.maker,
              model: vehicle.value.model,
              engineCc: vehicle.value.engineCc,
              odometer: vehicle.value.currentOdometer,
            }
          : undefined,
      symptomDescription: form.symptomDescription.trim() || undefined,
      adminNote: form.adminNote.trim() || undefined,
    });
    // BR-12 — lich do nhan vien dat duoc xac nhan ngay, khach nhan SMS kem ma QR.
    ui.success(t('sa06.created'), t('sa06.createdSub', { code: created.code }));
    await navigateTo(`/admin/bookings/${created.id}`);
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    submitting.value = false;
  }
}

function toggleService(id: string): void {
  form.serviceIds = form.serviceIds.includes(id)
    ? form.serviceIds.filter((x) => x !== id)
    : [...form.serviceIds, id];
}

useHead({ title: () => `${t('sa06.title')} — AOYAMA Admin` });
</script>

<template>
  <div class="admin-form admin-form-wide">
    <AyPageHeader
      code="SA-06" :title="$t('sa06.title')" back-to="/admin/bookings"
      :description="$t('sa06.lead')"
    />

    <div class="grid gap-4 lg:grid-cols-2">
      <section class="card flex flex-col gap-3" style="background: #fff">
        <h2 class="font-heading text-[16px]">{{ $t('sa06.customer') }}</h2>

        <AyField :label="$t('sc14.phone')" required :hint="$t('sa06.phoneHint')">
          <template #default="{ id }">
            <input :id="id" v-model="form.contactPhone" class="input" type="tel" placeholder="090-1234-5678">
          </template>
        </AyField>

        <p v-if="matchedCustomer" class="rounded-xl bg-success-bg px-3 py-2 text-[13px] text-success">
          {{ $t('sa06.matched') }} <strong>{{ matchedCustomer.name }}</strong>
          {{ $t('sa06.matchedTail') }}
        </p>
        <p v-else-if="form.contactPhone.length >= 8" class="rounded-sm bg-olive-100 px-3 py-2 text-[13px] text-olive-800">
          {{ $t('sa06.noMatch') }}
        </p>

        <AyField :label="$t('sc14.fullName')" required>
          <template #default="{ id }">
            <input :id="id" v-model="form.contactName" class="input" type="text">
          </template>
        </AyField>

        <AyField :label="$t('sc14.email')">
          <template #default="{ id }">
            <input :id="id" v-model="form.contactEmail" class="input" type="email">
          </template>
        </AyField>
      </section>

      <section class="card flex flex-col gap-3" style="background: #fff">
        <h2 class="font-heading text-[16px]">{{ $t('sa06.storeAndService') }}</h2>

        <AyField :label="$t('sa03.colStore')" required>
          <template #default="{ id }">
            <select :id="id" v-model="form.storeId" class="input">
              <option value="">{{ $t('sa06.pickStore') }}</option>
              <option v-for="store in refs?.stores ?? []" :key="store.id" :value="store.id">
                {{ i18n(store.name) }}
              </option>
            </select>
          </template>
        </AyField>

        <div>
          <span class="label">{{ $t('sa02.colService') }}</span>
          <ul class="flex max-h-56 flex-col gap-1 overflow-y-auto">
            <li v-for="service in refs?.services ?? []" :key="service.id">
              <label class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13.5px] hover:bg-accent-100">
                <input
                  type="checkbox" class="h-4 w-4 accent-[var(--color-accent)]"
                  :checked="form.serviceIds.includes(service.id)"
                  @change="toggleService(service.id)"
                >
                <span class="flex-1">{{ i18n(service.name) }}</span>
                <span class="text-muted">
                  {{ service.quoteOnly ? $t('common.quoteOnly') : money(service.basePrice) }}
                </span>
              </label>
            </li>
          </ul>
        </div>
      </section>
    </div>

    <section class="card flex flex-col gap-3" style="background: #fff">
      <h2 class="font-heading text-[16px]">{{ $t('sa06.vehicleInfo') }}</h2>

      <div v-if="customerVehicles.length" class="flex flex-wrap gap-2">
        <button
          v-for="v in customerVehicles" :key="v.id" type="button"
          class="btn text-[12.5px]"
          :class="selectedVehicleId === v.id ? 'btn-primary' : 'btn-secondary'"
          @click="pickVehicle(v.id)"
        >
          {{ v.plateNumber }}
        </button>
        <button
          type="button" class="btn btn-ghost text-[12.5px]"
          @click="selectedVehicleId = ''"
        >
          {{ $t('sa06.newVehicle') }}
        </button>
      </div>

      <AyVehicleForm v-if="!selectedVehicleId" v-model="vehicle" />
    </section>

    <section class="card" style="background: #fff">
      <h2 class="mb-3 font-heading text-[16px]">{{ $t('sc23.dateSlot') }}</h2>
      <AySlotPicker v-model="slot" :days="days" :loading="loadingSlots" />
    </section>

    <section class="card admin-grid" style="background: #fff">
      <AyField :label="$t('sa06.symptom')">
        <template #default="{ id }">
          <textarea :id="id" v-model="form.symptomDescription" class="input min-h-[90px]" />
        </template>
      </AyField>
      <AyField :label="$t('sa06.internalNote')">
        <template #default="{ id }">
          <textarea :id="id" v-model="form.adminNote" class="input min-h-[90px]" />
        </template>
      </AyField>
    </section>

    <AyErrorNote :error="error" />

    <div class="admin-actions">
      <AyButton to="/admin/bookings" variant="secondary">{{ $t('common.cancel') }}</AyButton>
      <AyButton :disabled="!canSubmit" :loading="submitting" @click="submit">
        {{ $t('sa06.submit') }}
      </AyButton>
    </div>
  </div>
</template>

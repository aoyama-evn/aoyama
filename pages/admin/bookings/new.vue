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
  const types = new Set(selected.map((s) => s.type));
  if (types.size > 1) return 'BOTH';
  return types.has('REPAIR') ? 'REPAIR' : 'MAINTENANCE';
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
    ui.success('Đã tạo và xác nhận lịch hẹn', `Mã ${created.code} — SMS đã gửi cho khách.`);
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

useHead({ title: 'Đặt lịch thay khách — AOYAMA Admin' });
</script>

<template>
  <div class="mx-auto flex max-w-4xl flex-col gap-4">
    <AyPageHeader
      code="SA-06" title="Đặt lịch thay khách" back-to="/admin/bookings"
      description="Lịch tạo từ đây được xác nhận ngay và gửi mã QR cho khách."
    />

    <div class="grid gap-4 lg:grid-cols-2">
      <section class="ay-card flex flex-col gap-3">
        <h2 class="font-heading text-[16px]">Khách hàng</h2>

        <AyField label="Số điện thoại" required hint="Nhập để tìm hồ sơ khách đã có">
          <template #default="{ id }">
            <input :id="id" v-model="form.contactPhone" class="ay-input" type="tel" placeholder="090-1234-5678">
          </template>
        </AyField>

        <p v-if="matchedCustomer" class="rounded-xl bg-success-bg px-3 py-2 text-[13px] text-success">
          Đã tìm thấy hồ sơ: <strong>{{ matchedCustomer.name }}</strong>
          — lịch sẽ gắn vào hồ sơ này.
        </p>
        <p v-else-if="form.contactPhone.length >= 8" class="rounded-xl bg-info-bg px-3 py-2 text-[13px] text-info">
          Chưa có hồ sơ — hệ thống sẽ tạo mới khi lưu lịch hẹn.
        </p>

        <AyField label="Họ tên" required>
          <template #default="{ id }">
            <input :id="id" v-model="form.contactName" class="ay-input" type="text">
          </template>
        </AyField>

        <AyField label="Email">
          <template #default="{ id }">
            <input :id="id" v-model="form.contactEmail" class="ay-input" type="email">
          </template>
        </AyField>
      </section>

      <section class="ay-card flex flex-col gap-3">
        <h2 class="font-heading text-[16px]">Cửa hàng &amp; dịch vụ</h2>

        <AyField label="Cửa hàng" required>
          <template #default="{ id }">
            <select :id="id" v-model="form.storeId" class="ay-input">
              <option value="">— Chọn cửa hàng —</option>
              <option v-for="store in refs?.stores ?? []" :key="store.id" :value="store.id">
                {{ i18n(store.name) }}
              </option>
            </select>
          </template>
        </AyField>

        <div>
          <span class="ay-label">Dịch vụ</span>
          <ul class="flex max-h-56 flex-col gap-1 overflow-y-auto">
            <li v-for="service in refs?.services ?? []" :key="service.id">
              <label class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13.5px] hover:bg-accent-100">
                <input
                  type="checkbox" class="h-4 w-4 accent-[var(--color-accent)]"
                  :checked="form.serviceIds.includes(service.id)"
                  @change="toggleService(service.id)"
                >
                <span class="flex-1">{{ i18n(service.name) }}</span>
                <span class="ay-muted">{{ service.quoteOnly ? 'báo giá' : money(service.basePrice) }}</span>
              </label>
            </li>
          </ul>
        </div>
      </section>
    </div>

    <section class="ay-card flex flex-col gap-3">
      <h2 class="font-heading text-[16px]">Thông tin xe</h2>

      <div v-if="customerVehicles.length" class="flex flex-wrap gap-2">
        <button
          v-for="v in customerVehicles" :key="v.id" type="button"
          class="ay-btn ay-btn-sm"
          :class="selectedVehicleId === v.id ? 'ay-btn-primary' : 'ay-btn-secondary'"
          @click="pickVehicle(v.id)"
        >
          {{ v.plateNumber }}
        </button>
        <button
          type="button" class="ay-btn ay-btn-ghost ay-btn-sm"
          @click="selectedVehicleId = ''"
        >
          Khai báo xe mới
        </button>
      </div>

      <AyVehicleForm v-if="!selectedVehicleId" v-model="vehicle" />
    </section>

    <section class="ay-card">
      <h2 class="mb-3 font-heading text-[16px]">Ngày &amp; khung giờ</h2>
      <AySlotPicker v-model="slot" :days="days" :loading="loadingSlots" />
    </section>

    <section class="ay-card grid gap-3 sm:grid-cols-2">
      <AyField label="Mô tả tình trạng xe">
        <template #default="{ id }">
          <textarea :id="id" v-model="form.symptomDescription" class="ay-input min-h-[90px]" />
        </template>
      </AyField>
      <AyField label="Ghi chú nội bộ">
        <template #default="{ id }">
          <textarea :id="id" v-model="form.adminNote" class="ay-input min-h-[90px]" />
        </template>
      </AyField>
    </section>

    <AyErrorNote :error="error" />

    <div class="flex gap-2">
      <AyButton :disabled="!canSubmit" :loading="submitting" @click="submit">
        Tạo và xác nhận lịch hẹn
      </AyButton>
      <AyButton to="/admin/bookings" variant="secondary">Hủy</AyButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PriceRule, ServiceItem, Store } from '~/types/models';

/** SA-24 Quan ly bang gia — FR-SVC-04..06, FR-SVC-08, BR-36..BR-38. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();
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
    ui.success('Đã lưu quy tắc giá');
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
    ui.success('Đã xóa quy tắc giá');
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
  if (!storeId) return 'Mọi cửa hàng';
  const found = refs.value?.stores.find((s) => s.id === storeId);
  return found ? i18n(found.name) : storeId;
}

function rangeLabel(rule: PriceRule): string {
  const from = rule.engineCcFrom ?? 0;
  const to = rule.engineCcTo;
  return to ? `${from}–${to}cc` : `từ ${from}cc`;
}

useHead({ title: 'Bảng giá — AOYAMA Admin' });
</script>

<template>
  <div class="flex flex-col gap-4">
    <AyPageHeader
      code="SA-24" title="Quản lý bảng giá"
      description="Khi nhiều quy tắc cùng khớp, hệ thống chọn quy tắc hẹp nhất: ưu tiên quy tắc gắn cửa hàng cụ thể, rồi tới khoảng dung tích hẹp hơn."
    >
      <template #actions>
        <AyButton size="sm" @click="startNew">Thêm quy tắc giá</AyButton>
      </template>
    </AyPageHeader>

    <AyFilterBar :has-active-filters="Boolean(serviceFilter)" @reset="serviceFilter = ''">
      <AyField label="Lọc theo dịch vụ" class="min-w-[260px]">
        <template #default="{ id }">
          <select :id="id" v-model="serviceFilter" class="ay-input">
            <option value="">Tất cả dịch vụ</option>
            <option v-for="service in refs?.services ?? []" :key="service.id" :value="service.id">
              {{ i18n(service.name) }}
            </option>
          </select>
        </template>
      </AyField>
    </AyFilterBar>

    <AyLoading v-if="pending" />

    <div v-else class="ay-table-wrap">
      <table class="ay-table">
        <thead>
          <tr>
            <th scope="col">Dịch vụ</th>
            <th scope="col">Cửa hàng</th>
            <th scope="col">Phân khúc</th>
            <th scope="col" class="text-center">Độ khó</th>
            <th scope="col" class="text-right">Giá</th>
            <th scope="col">Hiệu lực</th>
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
            <td class="text-[12.5px] ay-muted">
              {{ rule.validFrom ?? '—' }} → {{ rule.validTo ?? '—' }}
            </td>
            <td>
              <button type="button" class="text-[12.5px] underline" @click="editing = { ...rule }">Sửa</button>
              <button type="button" class="ml-2 text-[12.5px] text-danger underline" @click="deleteTarget = rule">Xóa</button>
            </td>
          </tr>
          <tr v-if="(rules ?? []).length === 0">
            <td colspan="7" class="p-0">
              <AyEmptyState
                title="Chưa có quy tắc giá nào"
                hint="Không có quy tắc, hệ thống dùng giá cơ sở khai báo ở màn hình dịch vụ."
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Bieu mau them hoac sua -->
    <div v-if="editing" class="ay-card grid gap-3 sm:grid-cols-3">
      <h2 class="font-heading text-[16px] sm:col-span-3">
        {{ editing.id ? 'Sửa quy tắc giá' : 'Thêm quy tắc giá' }}
      </h2>

      <AyField label="Dịch vụ" required>
        <template #default="{ id }">
          <select :id="id" v-model="editing.serviceId" class="ay-input">
            <option v-for="service in refs?.services ?? []" :key="service.id" :value="service.id">
              {{ i18n(service.name) }}
            </option>
          </select>
        </template>
      </AyField>

      <AyField label="Cửa hàng" hint="Bỏ trống = áp dụng mọi cửa hàng">
        <template #default="{ id }">
          <select :id="id" v-model="editing.storeId" class="ay-input">
            <option :value="null">Mọi cửa hàng</option>
            <option v-for="store in refs?.stores ?? []" :key="store.id" :value="store.id">
              {{ i18n(store.name) }}
            </option>
          </select>
        </template>
      </AyField>

      <AyField label="Độ khó" hint="1 tiêu chuẩn · 2 trung bình · 3 phức tạp">
        <template #default="{ id }">
          <select :id="id" v-model.number="editing.difficultyLevel" class="ay-input">
            <option :value="1">1</option><option :value="2">2</option><option :value="3">3</option>
          </select>
        </template>
      </AyField>

      <AyField label="Dung tích từ (cc)">
        <template #default="{ id }">
          <input :id="id" v-model.number="editing.engineCcFrom" class="ay-input" type="number" min="0">
        </template>
      </AyField>

      <AyField label="Đến (cc)" hint="Bỏ trống = không giới hạn trên">
        <template #default="{ id }">
          <input :id="id" v-model.number="editing.engineCcTo" class="ay-input" type="number" min="0">
        </template>
      </AyField>

      <AyField label="Giá (JPY)" required>
        <template #default="{ id }">
          <input :id="id" v-model.number="editing.price" class="ay-input" type="number" min="0">
        </template>
      </AyField>

      <AyField label="Hiệu lực từ">
        <template #default="{ id }">
          <input :id="id" v-model="editing.validFrom" class="ay-input" type="date">
        </template>
      </AyField>

      <AyField label="Hiệu lực đến">
        <template #default="{ id }">
          <input :id="id" v-model="editing.validTo" class="ay-input" type="date">
        </template>
      </AyField>

      <div class="flex items-end gap-2">
        <AyButton :loading="saving" @click="save">Lưu</AyButton>
        <AyButton variant="secondary" @click="editing = null">Hủy</AyButton>
      </div>
    </div>

    <AyConfirmDialog
      :open="Boolean(deleteTarget)"
      title="Xóa quy tắc giá"
      message="Sau khi xóa, dịch vụ sẽ tính theo quy tắc còn lại hoặc giá cơ sở."
      confirm-label="Xóa"
      danger
      @confirm="remove"
      @cancel="deleteTarget = null"
    />
  </div>
</template>

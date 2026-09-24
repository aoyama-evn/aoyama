<script setup lang="ts">
import type { Vehicle } from '~/types/models';

/** SC-29 Xe cua toi — FR-VEH-01, FR-VEH-07. */
definePageMeta({ middleware: 'auth' });

const api = useApi();
const ui = useUiStore();
const { number } = useFormat();

const { data: vehicles, refresh } = await useAsyncData('my-vehicles', () =>
  api.get<Vehicle[]>('/account/vehicles'),
);

const removeTarget = ref<Vehicle | null>(null);
const removing = ref(false);

async function remove(): Promise<void> {
  if (!removeTarget.value) return;
  removing.value = true;
  try {
    await api.del(`/account/vehicles/${removeTarget.value.id}`);
    ui.success('Đã gỡ xe khỏi danh sách', 'Lịch sử dịch vụ của xe vẫn được lưu lại.');
    removeTarget.value = null;
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  } finally {
    removing.value = false;
  }
}

useHead({ title: 'Xe của tôi' });
</script>

<template>
  <div class="flex flex-col gap-5">
    <AyPageHeader code="SC-29" title="Xe của tôi">
      <template #actions>
        <AyButton to="/account/vehicles/new/edit" size="sm">Thêm xe</AyButton>
      </template>
    </AyPageHeader>

    <AccountNav />

    <AyEmptyState
      v-if="(vehicles ?? []).length === 0"
      title="Bạn chưa đăng ký xe nào"
      hint="Thêm xe để hệ thống lưu lịch sử bảo dưỡng và nhắc bạn đến kỳ kiểm tra."
    >
      <AyButton to="/account/vehicles/new/edit" size="sm">Thêm xe đầu tiên</AyButton>
    </AyEmptyState>

    <ul v-else class="grid gap-3 md:grid-cols-2">
      <li v-for="vehicle in vehicles ?? []" :key="vehicle.id" class="card flex flex-col gap-2">
        <div>
          <p class="font-heading text-[18px]">{{ vehicle.plateNumber }}</p>
          <p class="text-[13.5px] text-muted">
            {{ vehicle.maker }} {{ vehicle.model }}
            <template v-if="vehicle.engineCc"> · {{ vehicle.engineCc }}cc</template>
          </p>
        </div>

        <dl class="flex gap-4 text-[13px]">
          <div><dt class="text-muted">Số km</dt><dd>{{ number(vehicle.currentOdometer) }}</dd></div>
          <div v-if="vehicle.modelYear"><dt class="text-muted">Năm</dt><dd>{{ vehicle.modelYear }}</dd></div>
          <div v-if="vehicle.color"><dt class="text-muted">Màu</dt><dd>{{ vehicle.color }}</dd></div>
        </dl>

        <div class="mt-auto flex flex-wrap gap-2 pt-2">
          <AyButton :to="`/account/vehicles/${vehicle.id}/history`" variant="secondary" size="sm">
            Lịch sử dịch vụ
          </AyButton>
          <AyButton :to="`/account/vehicles/${vehicle.id}/edit`" variant="secondary" size="sm">Sửa</AyButton>
          <AyButton variant="ghost" size="sm" @click="removeTarget = vehicle">Gỡ</AyButton>
        </div>
      </li>
    </ul>

    <AyConfirmDialog
      :open="Boolean(removeTarget)"
      title="Gỡ xe khỏi danh sách"
      :message="`Xe ${removeTarget?.plateNumber ?? ''} sẽ không còn hiện trong danh sách. Lịch sử dịch vụ vẫn được cửa hàng lưu lại.`"
      confirm-label="Gỡ xe"
      danger
      :loading="removing"
      @confirm="remove"
      @cancel="removeTarget = null"
    />
  </div>
</template>

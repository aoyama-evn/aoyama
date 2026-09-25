<script setup lang="ts">
import type { Vehicle } from '~/types/models';

/**
 * SC-12 Dat lich buoc 1 (khach) va SC-12a (thanh vien) — FR-BOOK-02, FR-BOOK-03.
 *
 * Ban thiet ke chia buoc nay thanh hai luong:
 *  - den tu tro ly AI: mo ta hien tuong, gui anh hoac ghi am, roi bam phan tich;
 *  - den tu danh muc: chi con o ghi chu them.
 * Cua hang khong chon o day ma o buoc 2, dung nhu ban thiet ke.
 */
const api = useApi();
const auth = useAuthStore();
const booking = useBookingStore();
const ui = useUiStore();
const { i18n, money, number } = useFormat();

const analysing = ref(false);

const { data: myVehicles } = await useAsyncData(
  'book-vehicles',
  () => (auth.isCustomer ? api.get<Vehicle[]>('/account/vehicles') : Promise.resolve([])),
  { watch: [() => auth.isCustomer] },
);

onMounted(() => {
  booking.restore();
});

/** Luong AI khi khach den tu SC-10 hoac tu bam nut phan tich o day. */
const aiFlow = computed(() => Boolean(booking.aiDiagnosisId) || booking.symptomPhotoUrls.length > 0);

const KINDS = [
  { value: 'MAINTENANCE' as const, label: 'Bảo dưỡng' },
  { value: 'REPAIR' as const, label: 'Sửa chữa' },
];

/** BR — chon ca hai nhom thi loai dich vu cua lich hen la BOTH. */
const kinds = computed<Set<'MAINTENANCE' | 'REPAIR'>>(() => {
  if (booking.serviceType === 'BOTH') return new Set(['MAINTENANCE', 'REPAIR']);
  return new Set([booking.serviceType as 'MAINTENANCE' | 'REPAIR']);
});

function toggleKind(kind: 'MAINTENANCE' | 'REPAIR'): void {
  const next = new Set(kinds.value);
  if (next.has(kind)) next.delete(kind);
  else next.add(kind);
  if (next.size === 2) booking.serviceType = 'BOTH';
  else if (next.size === 1) booking.serviceType = [...next][0];
  booking.persist();
}

function pickVehicle(item: Vehicle): void {
  booking.setVehicle(item);
}

function vehicleLine(item: Vehicle): string {
  const parts = [item.plateNumber];
  if (item.currentOdometer !== null) parts.push(`${number(item.currentOdometer)} km`);
  if (item.modelYear) parts.push(`đời ${item.modelYear}`);
  return parts.filter(Boolean).join(' · ');
}

/** SC-12 — bam "AI phan tich van de" thi gui mo ta sang phien chan doan. */
async function analyse(): Promise<void> {
  if (!booking.symptomDescription.trim() && booking.symptomPhotoUrls.length === 0) {
    ui.warning('Hãy mô tả hiện tượng hoặc gửi ảnh trước khi phân tích');
    return;
  }
  analysing.value = true;
  try {
    const session = await api.post<{ id: string }>('/ai/diagnosis/sessions', {
      sessionKey: `book-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      serviceIntent: booking.serviceType === 'BOTH' ? undefined : booking.serviceType,
      vehicleMaker: booking.vehicle.maker || undefined,
      vehicleModel: booking.vehicle.model || undefined,
    });
    booking.aiDiagnosisId = session.id;
    booking.persist();
    await navigateTo('/chat');
  } catch (error) {
    ui.error(normalizeError(error).message, 'Bạn vẫn có thể đặt lịch và mô tả trực tiếp tại cửa hàng.');
  } finally {
    analysing.value = false;
  }
}

useHead({ title: 'Đặt lịch — Bước 1' });
</script>

<template>
  <div class="flex flex-col gap-[15px] pb-4">
    <BookingSteps :current="1" />

    <!-- SC-12a: chon xe tu ho so -->
    <section v-if="auth.isCustomer && (myVehicles ?? []).length" class="flex flex-col gap-2.5">
      <h5>Chọn xe của bạn</h5>
      <label
        v-for="item in myVehicles ?? []"
        :key="item.id"
        class="radio gap-[11px] px-3.5 py-3"
        style="border-radius: 20px"
        :style="
          booking.vehicle.vehicleId === item.id
            ? 'background: var(--color-accent-200)'
            : 'background: var(--color-surface)'
        "
      >
        <input
          type="radio"
          name="bookbike"
          :checked="booking.vehicle.vehicleId === item.id"
          @change="pickVehicle(item)"
        />
        <span class="dot" />
        <span class="min-w-0 flex-1">
          <span
            class="block text-[14px]"
            :class="booking.vehicle.vehicleId === item.id ? 'font-semibold' : ''"
          >
            {{ item.maker }} {{ item.model }}
          </span>
          <span class="text-muted block truncate text-[11.5px]">{{ vehicleLine(item) }}</span>
        </span>
      </label>
      <NuxtLink
        to="/account/vehicles/new/edit"
        class="btn btn-secondary btn-block text-[13px]"
        style="margin: 0; min-height: 44px"
      >
        + Thêm xe khác
      </NuxtLink>
    </section>

    <section>
      <h5 class="mb-2.5">Bạn cần dịch vụ nào?</h5>
      <div class="flex gap-2.5">
        <button
          v-for="kind in KINDS"
          :key="kind.value"
          type="button"
          class="btn btn-secondary flex-1 gap-2 text-[13.5px]"
          :style="
            kinds.has(kind.value)
              ? 'border-color: var(--color-accent); color: var(--color-accent-700)'
              : ''
          "
          :aria-pressed="kinds.has(kind.value)"
          @click="toggleKind(kind.value)"
        >
          {{ kind.label }}
        </button>
      </div>
    </section>

    <!-- Luong AI -->
    <section v-if="aiFlow" class="flex flex-col gap-2.5">
      <h5>Mô tả hiện tượng của xe</h5>
      <textarea
        v-model="booking.symptomDescription"
        class="input"
        style="min-height: 92px"
        maxlength="1000"
        placeholder="vd: xe kêu lạ khi phanh gấp, phanh trước không ăn"
        @change="booking.persist()"
      />
      <div class="flex flex-wrap gap-2">
        <AyImageUpload v-model="booking.symptomPhotoUrls" :max="5" compact />
        <AyVideoUpload v-model="booking.symptomVideoUrl" compact />
        <AyVoiceRecorder compact @recorded="booking.symptomDescription += ' (có ghi âm kèm theo)'" />
      </div>

      <div
        v-if="booking.symptomPhotoUrls.length || booking.symptomVideoUrl"
        class="flex flex-wrap items-center gap-2"
      >
        <img
          v-for="(url, index) in booking.symptomPhotoUrls"
          :key="index"
          :src="url"
          alt="Ảnh đã tải"
          class="object-cover"
          style="width: 58px; height: 58px; border-radius: 12px"
        />
        <span
          v-if="booking.symptomVideoUrl"
          class="grid place-items-center"
          style="
            width: 58px; height: 58px; border-radius: 12px;
            background: var(--color-neutral-300); color: var(--color-neutral-700);
          "
          aria-label="Video đã tải"
        >
          <svg
            width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
          >
            <rect x="3" y="6" width="13" height="12" rx="3" />
            <path d="m16 10 5-3v10l-5-3" />
          </svg>
        </span>
        <span class="text-muted text-[11.5px]">
          {{ booking.symptomPhotoUrls.length + (booking.symptomVideoUrl ? 1 : 0) }} tệp ·
          tối đa 5 ảnh, 1 video ≤ 30 giây
        </span>
      </div>
      <button
        type="button"
        class="btn btn-primary btn-block gap-2.5 text-[14px]"
        style="min-height: 48px; margin: 0; background: var(--color-accent-2-600)"
        :disabled="analysing"
        @click="analyse"
      >
        <svg
          width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
        >
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
          <circle cx="12" cy="12" r="4" />
        </svg>
        AI phân tích vấn đề
      </button>
    </section>

    <!-- Luong danh muc -->
    <section v-else class="flex flex-col gap-2.5">
      <h5>
        Ghi chú thêm
        <span class="text-muted font-body text-[11.5px]">không bắt buộc</span>
      </h5>
      <textarea
        v-model="booking.symptomDescription"
        class="input"
        style="min-height: 76px"
        maxlength="1000"
        placeholder="vd: xe đã chạy 18.400 km, muốn kiểm tra thêm lốp"
        @change="booking.persist()"
      />
    </section>

    <section class="flex flex-col gap-2.5">
      <div class="flex items-baseline justify-between gap-2.5">
        <h5>Hạng mục đã chọn</h5>
        <NuxtLink
          :to="aiFlow ? '/chat' : '/services?pick=1'"
          class="btn btn-ghost px-1"
          aria-label="Sửa hạng mục"
          title="Sửa hạng mục"
        >
          <svg
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
          >
            <path d="M18 3 21 6l-9.5 9.5H8v-3.5L18 3Z" />
          </svg>
        </NuxtLink>
      </div>

      <div
        v-for="service in booking.selectedServices"
        :key="service.id"
        class="flex items-start gap-[11px] px-3.5 py-3"
        style="background: var(--color-surface); border-radius: 18px"
      >
        <span v-if="aiFlow" class="tag tag-accent-2 mt-0.5 text-[10px]">✦ AI</span>
        <span class="min-w-0 flex-1">
          <span class="block text-[14px] font-semibold">{{ i18n(service.name) }}</span>
          <span class="text-muted block text-[11.5px]">{{ service.durationMinutes }} phút</span>
        </span>
        <span class="whitespace-nowrap font-heading text-[14px]">
          {{ service.quoteOnly ? 'báo giá' : `~ ${money(service.basePrice)}` }}
        </span>
      </div>

      <p v-if="booking.selectedServices.length === 0" class="text-muted text-[12.5px]">
        Chưa chọn hạng mục nào.
      </p>

      <NuxtLink
        to="/services?pick=1"
        class="btn btn-secondary btn-block text-[13px]"
        style="margin: 0; min-height: 44px"
      >
        + Thêm hạng mục khác
      </NuxtLink>
    </section>

    <p
      class="pt-3 text-[12.5px] leading-[1.5]"
      style="border-top: 1px solid var(--color-divider); color: var(--color-neutral-700)"
    >
      <template v-if="aiFlow">
        Giá sẽ được ước tính sau khi AI phân tích và kỹ thuật viên kiểm tra thực tế.
      </template>
      <template v-else>Giá sẽ được ước tính sau khi kỹ thuật viên kiểm tra thực tế.</template>
    </p>

    <NuxtLink
      to="/booking/step2"
      class="btn btn-primary btn-block"
      style="min-height: 48px; font-size: 15px; margin: 0"
      :class="booking.selectedServiceIds.length ? '' : 'pointer-events-none opacity-50'"
      :aria-disabled="booking.selectedServiceIds.length === 0"
    >
      Tiếp theo →
    </NuxtLink>

    <NuxtLink to="/" class="btn btn-ghost self-center text-[13px]">← Quay lại</NuxtLink>
  </div>
</template>

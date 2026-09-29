<script setup lang="ts">
import type { AiDiagnosis, DiagnosisFinding, ServiceItem, Vehicle } from '~/types/models';

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
const { t, locale } = useI18n();
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

/**
 * Ba nhom, dung bang voi ba lua chon o chatbox SC-10. Thieu "Kiem tra" o day
 * thi khach chon kiem tra ben chatbox sang toi buoc nay lai thay nhom "Bao
 * duong" sang len.
 */
const KINDS = computed(() => [
  { value: 'MAINTENANCE' as const, label: t('sc12.maintenance') },
  { value: 'REPAIR' as const, label: t('sc12.repair') },
  { value: 'INSPECTION' as const, label: t('serviceType.INSPECTION') },
]);

/** BR — chon tu hai nhom tro len thi loai dich vu cua lich hen la BOTH. */
const kinds = computed<Set<BookingKind>>(() => kindsOfBookingServiceType(booking.serviceType));

function toggleKind(kind: BookingKind): void {
  const next = new Set(kinds.value);
  if (next.has(kind)) next.delete(kind);
  else next.add(kind);
  if (next.size === 0) return;
  booking.serviceType = bookingServiceTypeOf(next);
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

/**
 * SC-12 — bam "AI phan tich van de" thi phan tich ngay tai man nay va tra ve
 * danh sach hang muc de xuat. Truoc day nut nay day nguoi dung sang chatbox,
 * bo do ca mo ta vua go.
 */
const findings = ref<DiagnosisFinding[]>([]);

async function analyse(): Promise<void> {
  if (!booking.symptomDescription.trim() && booking.symptomPhotoUrls.length === 0) {
    ui.warning(t('sc12.needDescribe'));
    return;
  }
  analysing.value = true;
  findings.value = [];
  try {
    const session = await api.post<AiDiagnosis>('/ai/diagnosis/sessions', {
      sessionKey: `book-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      language: locale.value,
      serviceIntents: [...kinds.value],
      vehicleMaker: booking.vehicle.maker || undefined,
      vehicleModel: booking.vehicle.model || undefined,
    });
    booking.aiDiagnosisId = session.id;
    booking.persist();

    const analysed = await api.post<AiDiagnosis>(`/ai/diagnosis/sessions/${session.id}/messages`, {
      text: booking.symptomDescription.trim() || undefined,
      imageUrls: booking.symptomPhotoUrls.length ? booking.symptomPhotoUrls : undefined,
    });
    findings.value = analysed.findings ?? [];
    if (findings.value.length === 0) ui.info(t('sc10.failTitle'), t('sc12.aiNoResult'));
  } catch (error) {
    ui.error(normalizeError(error).message, t('sc10.failLead'));
  } finally {
    analysing.value = false;
  }
}

/** Them nhung hang muc khach tick vao danh sach dang chon cua lich hen. */
async function addSuggested(serviceCodes: string[]): Promise<void> {
  const all = await api.get<ServiceItem[]>('/services');
  const picked = all.filter((s) => serviceCodes.includes(s.code));
  let added = 0;
  for (const service of picked) {
    if (!booking.selectedServiceIds.includes(service.id)) {
      booking.toggleService(service);
      added += 1;
    }
    if (!booking.aiSuggestedServiceIds.includes(service.id)) {
      booking.aiSuggestedServiceIds = [...booking.aiSuggestedServiceIds, service.id];
    }
  }
  booking.persist();
  findings.value = [];
  ui.success(t('diag.added', { n: added }));
}

useHead({ title: () => `${t('sc01.bookCta')} — 1` });
</script>

<template>
  <div class="flex flex-col gap-[15px] pb-4">
    <BookingSteps :current="1" />

    <!-- SC-12a: chon xe tu ho so -->
    <section v-if="auth.isCustomer && (myVehicles ?? []).length" class="flex flex-col gap-2.5">
      <h5>{{ $t('sc12.pickVehicle') }}</h5>
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
        {{ $t('sc12.addVehicle') }}
      </NuxtLink>
    </section>

    <section>
      <h5 class="mb-2.5">{{ $t('sc12.whichService') }}</h5>
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
      <h5>{{ $t('sc12.describeTitle') }}</h5>
      <textarea
        v-model="booking.symptomDescription"
        class="input"
        style="min-height: 92px; border-radius: var(--radius-sm)"
        maxlength="1000"
        :placeholder="$t('sc12.describePlaceholder')"
        @change="booking.persist()"
      />
      <div class="flex flex-wrap gap-2">
        <AyImageUpload v-model="booking.symptomPhotoUrls" :max="5" compact />
        <AyVideoUpload v-model="booking.symptomVideoUrl" compact />
        <AyVoiceRecorder compact @recorded="booking.symptomDescription += t('rec.attached')" />
      </div>

      <div
        v-if="booking.symptomPhotoUrls.length || booking.symptomVideoUrl"
        class="flex flex-wrap items-center gap-2"
      >
        <img
          v-for="(url, index) in booking.symptomPhotoUrls"
          :key="index"
          :src="url"
          :alt="$t('sc10.photos', { n: 1, max: 5 })"
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
          :aria-label="$t('sc10.video')"
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
          {{
            $t('sc12.fileCount', {
              n: booking.symptomPhotoUrls.length + (booking.symptomVideoUrl ? 1 : 0),
            })
          }}
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
        {{ $t('sc12.analyseAi') }}
      </button>

      <!-- CP-16 — ket qua phan tich kem danh sach hang muc de tick -->
      <AyDiagnosisCard
        v-if="findings.length"
        :findings="findings"
        :vehicle-label="booking.vehicle.maker ? `${booking.vehicle.maker} ${booking.vehicle.model}` : null"
        mode="add"
        class="self-stretch"
        style="max-width: none"
        @book="addSuggested"
      />
    </section>

    <!-- Luong danh muc -->
    <section v-else class="flex flex-col gap-2.5">
      <h5>
        {{ $t('sc12.noteTitle') }}
        <span class="text-muted font-body text-[11.5px]">{{ $t('common.optional') }}</span>
      </h5>
      <textarea
        v-model="booking.symptomDescription"
        class="input"
        style="min-height: 76px; border-radius: var(--radius-sm)"
        maxlength="1000"
        :placeholder="$t('sc12.notePlaceholder')"
        @change="booking.persist()"
      />
    </section>

    <section class="flex flex-col gap-2.5">
      <h5>{{ $t('sc12.pickedTitle') }}</h5>

      <div
        v-for="service in booking.selectedServices"
        :key="service.id"
        class="flex items-start gap-[11px] px-3.5 py-3"
        style="background: var(--color-surface); border-radius: 18px"
      >
        <span
          v-if="booking.isAiSuggested(service.id)"
          class="tag tag-accent-2 mt-0.5 text-[10px]"
        >
          ✦ AI
        </span>
        <span class="min-w-0 flex-1">
          <span class="block text-[14px] font-semibold">{{ i18n(service.name) }}</span>
          <span class="text-muted block text-[11.5px]">
          {{ $t('common.minutes', { n: service.durationMinutes }) }}
        </span>
        </span>
        <span class="whitespace-nowrap font-heading text-[14px]">
          {{ service.quoteOnly ? $t('common.quoteOnly') : `~ ${money(service.basePrice)}` }}
        </span>
        <button
          type="button"
          class="ay-remove-item"
          :aria-label="$t('sc12.removePicked', { name: i18n(service.name) })"
          :title="$t('common.removeItem')"
          @click="booking.toggleService(service)"
        >
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="3" stroke-linecap="round" aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      <p v-if="booking.selectedServices.length === 0" class="text-muted text-[12.5px]">
        {{ $t('sc12.nonePicked') }}
      </p>

      <NuxtLink
        to="/services?pick=1"
        class="btn btn-secondary btn-block text-[13px]"
        style="margin: 0; min-height: 44px"
      >
        {{ $t('sc12.addMore') }}
      </NuxtLink>
    </section>

    <p
      class="pt-3 text-[12.5px] leading-[1.5]"
      style="border-top: 1px solid var(--color-divider); color: var(--color-neutral-700)"
    >
      <template v-if="aiFlow">
        {{ $t('sc12.priceNoteAi') }}
      </template>
      <template v-else>{{ $t('sc12.priceNote') }}</template>
    </p>

    <NuxtLink
      to="/booking/step2"
      class="btn btn-primary btn-block"
      style="min-height: 48px; font-size: 15px; margin: 0"
      :class="booking.selectedServiceIds.length ? '' : 'pointer-events-none opacity-50'"
      :aria-disabled="booking.selectedServiceIds.length === 0"
    >
      {{ $t('common.next') }}
    </NuxtLink>

    <NuxtLink to="/" class="btn btn-ghost self-center text-[13px]">{{ $t('common.back') }}</NuxtLink>
  </div>
</template>

<style scoped>
/**
 * Nut bo mot hang muc da chon. Vung bam 38px cho vua ngon tay tren dien thoai,
 * mau xam nhat de khong canh tranh voi nut chinh o cuoi man.
 */
.ay-remove-item {
  display: inline-grid;
  min-width: 38px;
  min-height: 38px;
  flex: none;
  place-items: center;
  margin: -6px -6px -6px 0;
  border-radius: 999px;
  color: var(--color-neutral-500);
}
.ay-remove-item:hover {
  background: var(--color-neutral-200);
  color: var(--color-danger);
}
</style>

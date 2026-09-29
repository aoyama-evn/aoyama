<script setup lang="ts">
import type { AiDiagnosis, ServiceItem, Vehicle } from '~/types/models';

/**
 * SC-10 Chatbox AI chan doan (khach) va SC-10a (thanh vien).
 * Ban thiet ke: dai tro ly mau accent-2 tren cung, bong tin nhan bo tron lech
 * ve phia nguoi noi, va o soan ghim duoi cung tren nen neutral-100.
 *
 * Chi chao kem ten khi nguoi dang dang nhap la KHACH HANG. Hai site dung chung
 * mot kho phien, nen mot tai khoan quan tri dang mo o tab khac van co
 * auth.user — nhung day la site khach, khong duoc goi ho bang ten tai khoan
 * quan tri.
 *
 * Tro ly hoi theo tung buoc: truoc het khach chon mot hoac nhieu viec can lam,
 * roi tuy lua chon do ma hoi tiep. Bao duong va kiem tra tong quat thi hoi ve
 * chiec xe; sua chua thi hoi xe dang gap van de gi. Chon ca hai thi hoi ca hai,
 * theo dung thu tu do.
 */
definePageMeta({ layout: 'chat' });

type Intent = 'MAINTENANCE' | 'INSPECTION' | 'REPAIR';

const api = useApi();
const auth = useAuthStore();
const booking = useBookingStore();
const ui = useUiStore();
const { t } = useI18n();
const { number } = useFormat();

const session = ref<AiDiagnosis | null>(null);
const intents = ref<Intent[]>([]);
const vehicle = ref<Vehicle | null>(null);
/** Khach vang lai khong co ho so xe nen tu khai bao. */
const manualVehicle = reactive({ maker: '', model: '', year: null as number | null });
const vehicleConfirmed = ref(false);
const text = ref('');
const images = ref<string[]>([]);
const transcript = ref<string | null>(null);
const sending = ref(false);
const scroller = ref<HTMLElement | null>(null);

const { makers: VEHICLE_MAKERS, otherLabel } = useVehicleMakers();

/**
 * Hang xe cho bam chon thay vi go tay. Bam "Khac" thi mo them mot o de go,
 * vi danh sach chi gom nhung hang hay gap.
 */
const makerOther = ref(false);

function pickMaker(name: string): void {
  makerOther.value = false;
  manualVehicle.maker = manualVehicle.maker === name ? '' : name;
}

function pickMakerOther(): void {
  makerOther.value = !makerOther.value;
  manualVehicle.maker = '';
}

const INTENT_OPTIONS: { value: Intent; labelKey: string }[] = [
  { value: 'REPAIR', labelKey: 'sc12.repair' },
  { value: 'MAINTENANCE', labelKey: 'sc12.maintenance' },
  { value: 'INSPECTION', labelKey: 'serviceType.INSPECTION' },
];

/** SC-10a — thanh vien chon xe tu ho so thay vi go tay hang va doi xe. */
const { data: myVehicles } = await useAsyncData(
  'chat-vehicles',
  () => (auth.isCustomer ? api.get<Vehicle[]>('/account/vehicles') : Promise.resolve([])),
  { watch: [() => auth.isCustomer] },
);

function toggleIntent(value: Intent): void {
  intents.value = intents.value.includes(value)
    ? intents.value.filter((x) => x !== value)
    : [...intents.value, value];
}

/** Bao duong va kiem tra tong quat deu can biet xe truoc khi goi y duoc gi. */
const needsVehicle = computed(
  () => intents.value.includes('MAINTENANCE') || intents.value.includes('INSPECTION'),
);
const needsSymptom = computed(() => intents.value.includes('REPAIR'));

const hasProfileVehicles = computed(() => auth.isCustomer && (myVehicles.value ?? []).length > 0);

/** Da du thong tin xe chua — tu ho so hoac tu ba o khach tu dien. */
const vehicleReady = computed(() =>
  Boolean(vehicle.value) || (manualVehicle.maker.trim() && manualVehicle.model.trim()),
);

const vehicleLabel = computed(() => {
  if (vehicle.value) return `${vehicle.value.maker} ${vehicle.value.model}`;
  const parts = [manualVehicle.maker.trim(), manualVehicle.model.trim()].filter(Boolean);
  if (manualVehicle.year) parts.push(String(manualVehicle.year));
  return parts.join(' ');
});

/** Chi hoi trieu chung sau khi da xong phan xe, de khong doi hai viec cung luc. */
const symptomStage = computed(
  () => needsSymptom.value && (!needsVehicle.value || vehicleConfirmed.value),
);

function confirmVehicle(): void {
  if (!vehicleReady.value) {
    ui.warning(t('sc10.needVehicle'));
    return;
  }
  vehicleConfirmed.value = true;
  // Chi bao duong / kiem tra thi khong con gi de go — gui luon cho tro ly.
  if (!needsSymptom.value) void send();
  else void scrollToEnd();
}

async function ensureSession(): Promise<AiDiagnosis> {
  if (session.value) return session.value;
  session.value = await api.post<AiDiagnosis>('/ai/diagnosis/sessions', {
    sessionKey: `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    serviceIntents: intents.value.length ? intents.value : undefined,
    vehicleMaker: vehicle.value?.maker ?? (manualVehicle.maker.trim() || undefined),
    vehicleModel: vehicle.value?.model ?? (manualVehicle.model.trim() || undefined),
    vehicleYear: vehicle.value?.modelYear ?? manualVehicle.year ?? undefined,
  });
  return session.value;
}

async function scrollToEnd(): Promise<void> {
  await nextTick();
  scroller.value?.scrollTo({ top: scroller.value.scrollHeight, behavior: 'smooth' });
}

const canSend = computed(() => {
  if (intents.value.length === 0) return false;
  if (needsVehicle.value && !vehicleConfirmed.value) return false;
  // Chi bao duong / kiem tra: xong phan xe la du, khong bat go them.
  if (!needsSymptom.value) return true;
  return Boolean(text.value.trim() || images.value.length || transcript.value);
});

async function send(): Promise<void> {
  if (!canSend.value) return;
  sending.value = true;
  try {
    const current = await ensureSession();
    session.value = await api.post<AiDiagnosis>(`/ai/diagnosis/sessions/${current.id}/messages`, {
      text: text.value.trim() || undefined,
      imageUrls: images.value.length ? images.value : undefined,
      transcript: transcript.value ?? undefined,
    });
    text.value = '';
    images.value = [];
    transcript.value = null;
    await scrollToEnd();
  } catch (error) {
    ui.error(normalizeError(error).message, t('sc10.failLead'));
  } finally {
    sending.value = false;
  }
}

/** SC-11 — bam dat lich tu ket qua chan doan thi mang theo phien AI sang. */
async function bookFromFinding(serviceCodes: string[]): Promise<void> {
  const services = await api.get<ServiceItem[]>('/services');
  const matched = services.filter((s) => serviceCodes.includes(s.code));

  booking.restore();
  // Gop het nhung gi khach da noi trong phien — truoc day chi lay cau dau tien,
  // nen phan khach mo ta them o nhung luot sau bi mat khi sang buoc dat lich.
  const saidByCustomer = (session.value?.messages ?? [])
    .filter((m) => m.role === 'user')
    .map((m) => (m.text || m.transcript || '').trim())
    .filter(Boolean)
    .join(' ');

  booking.applyDiagnosis({
    diagnosisId: session.value?.id ?? '',
    description: saidByCustomer || undefined,
    services: matched,
    replaceServices: true,
  });
  if (vehicle.value) booking.setVehicle(vehicle.value);
  await navigateTo('/booking/step1');
}

const findings = computed(() => session.value?.findings ?? []);
const analysisFailed = computed(() => session.value?.status === 'FAILED');

function vehicleLine(item: Vehicle): string {
  const parts = [item.plateNumber];
  if (item.currentOdometer !== null) parts.push(`${number(item.currentOdometer)} km`);
  if (item.modelYear) parts.push(t('common.modelYear', { year: item.modelYear }));
  return parts.filter(Boolean).join(' · ');
}

useHead({ title: () => t('sc10.assistant') });
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <!-- Dai tro ly -->
    <div
      class="flex flex-none items-center gap-2.5 px-4 py-3"
      style="background: var(--color-accent-2-100)"
    >
      <span
        class="grid place-items-center rounded-full text-white"
        style="width: 30px; height: 30px; background: var(--color-accent-2-500)"
        aria-hidden="true"
      >
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"
        >
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      </span>
      <div class="leading-[1.2]">
        <p class="font-heading text-[15px]">{{ $t('sc10.assistant') }}</p>
        <p class="text-[10.5px]" style="color: var(--color-accent-2-800)">
          {{ $t('sc10.assistantSub') }}
        </p>
      </div>
      <NuxtLink
        to="/"
        class="btn btn-ghost ml-auto px-2 text-[15px]"
        :aria-label="$t('sc10.closeAssistant')"
      >
        ✕
      </NuxtLink>
    </div>

    <!-- Dong tin nhan -->
    <div ref="scroller" class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
      <p class="ay-bubble-bot">
        {{
          auth.isCustomer && auth.user?.name
            ? $t('sc10.greetingNamed', { name: auth.user.name })
            : $t('sc10.greeting')
        }}
      </p>

      <!-- Buoc 1: chon mot hoac nhieu viec can lam -->
      <div class="flex flex-col gap-1.5 self-stretch">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="option in INTENT_OPTIONS"
            :key="option.value"
            type="button"
            class="btn btn-secondary text-[13px]"
            :class="intents.includes(option.value) ? 'ay-chip-on' : ''"
            :aria-pressed="intents.includes(option.value)"
            @click="toggleIntent(option.value)"
          >
            {{ $t(option.labelKey) }}
          </button>
        </div>
        <p v-if="intents.length === 0" class="text-muted text-[11px]">
          {{ $t('sc10.intentHint') }}
        </p>
      </div>

      <!-- Buoc 2a: bao duong hoac kiem tra tong quat thi hoi ve chiec xe -->
      <template v-if="needsVehicle">
        <p class="ay-bubble-bot">
          {{ hasProfileVehicles ? $t('sc10.whichVehicle') : $t('sc10.askVehicle') }}
        </p>

        <div v-if="!vehicleConfirmed" class="flex flex-col gap-2 self-stretch">
          <!-- SC-10a: thanh vien chon xe tu ho so -->
          <template v-if="hasProfileVehicles">
            <button
              v-for="item in myVehicles ?? []"
              :key="item.id"
              type="button"
              class="ay-row"
              :style="vehicle?.id === item.id ? 'background: var(--color-accent-200)' : undefined"
              :aria-pressed="vehicle?.id === item.id"
              @click="vehicle = vehicle?.id === item.id ? null : item"
            >
              <span class="min-w-0 flex-1">
                <span
                  class="block text-[13.5px]"
                  :class="vehicle?.id === item.id ? 'font-semibold' : ''"
                >
                  {{ item.maker }} {{ item.model }}
                </span>
                <span class="text-muted block truncate text-[11.5px]">{{ vehicleLine(item) }}</span>
              </span>
            </button>
          </template>

          <!-- Khach vang lai — hoac thanh vien muon khai xe khac -->
          <div v-if="!vehicle" class="grid grid-cols-2 gap-2">
            <div class="col-span-2 flex flex-col gap-1.5">
              <span class="label">{{ $t('sc14.maker') }}</span>
              <div class="flex flex-wrap gap-[7px]">
                <button
                  v-for="name in VEHICLE_MAKERS"
                  :key="name"
                  type="button"
                  class="btn btn-secondary px-3.5 text-[12.5px]"
                  style="min-height: 38px"
                  :class="manualVehicle.maker === name ? 'ay-chip-on' : ''"
                  :aria-pressed="manualVehicle.maker === name"
                  @click="pickMaker(name)"
                >
                  {{ name }}
                </button>
                <button
                  type="button"
                  class="btn btn-secondary px-3.5 text-[12.5px]"
                  style="min-height: 38px"
                  :class="makerOther ? 'ay-chip-on' : ''"
                  :aria-pressed="makerOther"
                  @click="pickMakerOther"
                >
                  {{ otherLabel }}
                </button>
              </div>
              <input
                v-if="makerOther"
                v-model="manualVehicle.maker"
                class="input"
                :placeholder="$t('sc10.makerPlaceholder')"
                :aria-label="$t('sc14.maker')"
              />
            </div>

            <AyField for="chat-model" :label="$t('sc14.model')">
              <input
                id="chat-model"
                v-model="manualVehicle.model"
                class="input"
                :placeholder="$t('sc10.modelPlaceholder')"
              />
            </AyField>
            <div class="col-span-2">
              <AyField for="chat-year" :label="$t('vehicle.modelYear')">
                <input
                  id="chat-year"
                  v-model.number="manualVehicle.year"
                  class="input"
                  type="number"
                  inputmode="numeric"
                  min="1970"
                  :max="new Date().getFullYear()"
                  :placeholder="$t('sc10.yearPlaceholder')"
                />
              </AyField>
            </div>
          </div>

          <button
            type="button"
            class="btn btn-primary btn-block"
            style="min-height: 44px; margin: 0"
            :disabled="!vehicleReady"
            @click="confirmVehicle"
          >
            {{ $t('sc10.vehicleDone') }}
          </button>
        </div>

        <p v-else class="ay-bubble-me">
          {{ $t('sc10.vehiclePicked', { label: vehicleLabel }) }}
        </p>
      </template>

      <!-- Buoc 2b: sua chua thi hoi xe dang gap van de gi -->
      <p v-if="symptomStage" class="ay-bubble-bot">
        {{ $t('sc10.askProblem') }}
      </p>

      <!-- Lich su tin nhan -->
      <template v-for="(message, index) in session?.messages ?? []" :key="index">
        <p
          v-if="message.text || message.transcript"
          :class="message.role === 'user' ? 'ay-bubble-me' : 'ay-bubble-bot'"
        >
          {{ message.text || message.transcript }}
        </p>
        <div v-if="message.imageUrls?.length" class="flex gap-[7px] self-end">
          <img
            v-for="(url, i) in message.imageUrls"
            :key="i"
            :src="url"
            :alt="$t('sc10.photos', { n: 1, max: 5 })"
            class="object-cover"
            style="width: 62px; height: 62px; border-radius: 14px"
          />
        </div>
      </template>

      <div
        v-if="sending"
        class="flex items-center gap-2 self-start rounded-[20px] px-3.5 py-2.5 text-[13px]"
        style="background: var(--color-surface); color: var(--color-neutral-700)"
      >
        <span class="flex gap-[3px]" aria-hidden="true">
          <span class="ay-dot" style="background: var(--color-accent-500)" />
          <span class="ay-dot" style="background: var(--color-accent-400)" />
          <span class="ay-dot" style="background: var(--color-accent-300)" />
        </span>
        {{ $t('sc12.analysing') }}
      </div>

      <!-- SC-11 ket qua chan doan -->
      <AyDiagnosisCard
        v-if="findings.length"
        :findings="findings"
        :vehicle-label="vehicleLabel || null"
        @book="bookFromFinding"
      />

      <div v-else-if="analysisFailed" class="card gap-2">
        <p class="text-[14px] font-semibold">{{ $t('sc10.failTitle') }}</p>
        <p class="text-muted text-[13px]">
          {{ $t('sc10.failLead') }}
        </p>
        <NuxtLink to="/booking/step1" class="btn btn-secondary self-start text-[12.5px]">
          {{ $t('sc10.bookInspection') }}
        </NuxtLink>
      </div>
    </div>

    <!-- O soan — chi mo khi da toi buoc ta trieu chung -->
    <div
      v-if="symptomStage"
      class="ay-safe-bottom flex flex-none flex-col gap-2.5 px-3.5 pb-4 pt-2.5"
      style="background: var(--color-neutral-100); border-top: 1px solid var(--color-divider)"
    >
      <div class="flex gap-2">
        <AyImageUpload v-model="images" :max="5" compact />
        <AyVoiceRecorder compact @recorded="transcript = t('rec.sent')" />
      </div>
      <div class="flex gap-2">
        <input
          v-model="text"
          class="input flex-1"
          maxlength="1000"
          :placeholder="$t('sc10.inputPlaceholder')"
          :aria-label="$t('sc10.inputPlaceholder')"
          @keydown.enter.exact.prevent="send"
        />
        <button
          type="button"
          class="btn btn-primary flex-none"
          :disabled="!canSend || sending"
          @click="send"
        >
          {{ $t('sc10.send') }}
        </button>
      </div>
      <p class="text-muted text-[11px] leading-[1.45]">
        {{ $t('sc10.privacyNote') }}
        <NuxtLink to="/privacy">{{ $t('sc15.privacyLink') }}</NuxtLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.ay-bubble-bot,
.ay-bubble-me {
  max-width: 82%;
  padding: 10px 14px;
  font-size: 13.5px;
  line-height: 1.45;
}
.ay-bubble-bot {
  align-self: flex-start;
  border-radius: 20px 20px 20px 6px;
  background: var(--color-surface);
}
.ay-bubble-me {
  align-self: flex-end;
  border-radius: 20px 20px 6px 20px;
  background: var(--color-accent-200);
}

/** The tra loi nhanh dang chon — ban thiet ke vien va chu mau accent. */
.ay-chip-on {
  border-color: var(--color-accent);
  color: var(--color-accent-700);
}

.ay-dot {
  display: block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
}
</style>

<script setup lang="ts">
import type { AiDiagnosis, ServiceItem, Store, Vehicle } from '~/types/models';

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
const { t, locale } = useI18n();
const { number, i18n, dayLabel, clock } = useFormat();

const session = ref<AiDiagnosis | null>(null);
const intents = ref<Intent[]>([]);
const vehicle = ref<Vehicle | null>(null);
/** Khach vang lai khong co ho so xe nen tu khai bao. */
const manualVehicle = reactive({ maker: '', model: '', year: null as number | null });
const vehicleConfirmed = ref(false);
const text = ref('');
const images = ref<string[]>([]);
/**
 * Video ngan khach quay lai trieu chung.
 *
 * Co nhung loi chi nghe moi biet — tieng ken ket khi bop phanh, tieng go
 * trong may — anh chup khong noi duoc gi. Gioi han 8MB: than yeu cau gui
 * len toi da 15MB ma ma hoa base64 thi mot tep phinh them chung mot phan
 * ba, 8MB la con vua.
 */
const video = ref<string | null>(null);
const transcript = ref<string | null>(null);

/**
 * Trinh duyet nay co nhan dang giong noi khong.
 *
 * Co thi cho khach noi va do thang ra chu; khong thi quay ve ghi am roi
 * gui ban ghi cho cua hang nghe. Phai doi sang client moi hoi duoc, nen
 * mac dinh la khong — may chu dung ve nut nao thi trinh duyet ve lai dung
 * nut do, khong lech.
 */
const noiDuocThanhChu = ref(false);
onMounted(() => {
  const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
  noiDuocThanhChu.value = Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition);
});
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
    // Khong gui thi may chu mac dinh tieng Nhat, ket qua chan doan hien ra se
    // lech ngon ngu voi phan con lai cua man hinh.
    language: locale.value,
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
  return Boolean(text.value.trim() || images.value.length || video.value || transcript.value);
});

async function send(): Promise<void> {
  if (!canSend.value) return;
  sending.value = true;
  try {
    const current = await ensureSession();
    session.value = await api.post<AiDiagnosis>(`/ai/diagnosis/sessions/${current.id}/messages`, {
      text: text.value.trim() || undefined,
      imageUrls: images.value.length ? images.value : undefined,
      videoUrl: video.value ?? undefined,
      transcript: transcript.value ?? undefined,
    });
    text.value = '';
    images.value = [];
    video.value = null;
    transcript.value = null;
    await scrollToEnd();
  } catch (error) {
    ui.error(normalizeError(error).message, t('sc10.failLead'));
  } finally {
    sending.value = false;
  }
}

/**
 * SC-11 — chon xong hang muc thi tro ly hoi not nhung thu con thieu ngay
 * trong cuoc tro chuyen, thay vi da khach sang bieu mau dat lich.
 *
 * Ba thu con thieu: xe nao, cua hang nao, gio nao. Hoi xong ca ba thi
 * nhay thang sang buoc 3 — khong con gi de chon o buoc 1 va buoc 2 nua.
 */
type BookStage = 'NONE' | 'VEHICLE' | 'STORE' | 'SLOT';
const bookStage = ref<BookStage>('NONE');
const pickedServices = ref<ServiceItem[]>([]);

async function bookFromFinding(serviceCodes: string[]): Promise<void> {
  const services = await api.get<ServiceItem[]>('/services');
  pickedServices.value = services.filter((s) => serviceCodes.includes(s.code));

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
    services: pickedServices.value,
    replaceServices: true,
  });

  // Da biet xe tu dau phien (luong bao duong) thi khong hoi lai.
  if (vehicle.value) {
    booking.setVehicle(vehicle.value);
    await goToStoreStage();
  } else {
    bookStage.value = 'VEHICLE';
    await scrollToEnd();
  }
}

/** Khach xac nhan xe o buoc nay roi moi sang chon cua hang. */
async function confirmBookVehicle(): Promise<void> {
  if (!vehicleReady.value) {
    ui.warning(t('sc10.needVehicle'));
    return;
  }
  if (vehicle.value) booking.setVehicle(vehicle.value);
  else {
    // O chat chi hoi hang va dong xe; bien so de buoc 3 hoi, dung bia ra.
    booking.setVehicle({
      plateNumber: '',
      maker: manualVehicle.maker.trim(),
      model: manualVehicle.model.trim(),
    });
  }
  await goToStoreStage();
}

// ---- Cua hang gan nhat ----
const stores = ref<Store[]>([]);
const locating = ref(false);
/** Khach tu choi chia se vi tri thi van chon duoc, chi la khong co khoang cach. */
const locationDenied = ref(false);
const storeDistances = ref<Record<string, number>>({});

const sortedStores = computed(() => {
  const list = [...stores.value];
  const d = storeDistances.value;
  if (Object.keys(d).length === 0) return list;
  return list.sort((a, b) => (d[a.id] ?? Infinity) - (d[b.id] ?? Infinity));
});

async function goToStoreStage(): Promise<void> {
  bookStage.value = 'STORE';
  await scrollToEnd();

  if (stores.value.length === 0) {
    stores.value = await api.get<Store[]>('/stores').catch(() => []);
  }

  locating.value = true;
  const here = await askBrowserLocation();
  locating.value = false;

  if (!here) {
    locationDenied.value = true;
    await scrollToEnd();
    return;
  }

  const map: Record<string, number> = {};
  for (const store of stores.value) {
    if (store.latitude === null || store.longitude === null) continue;
    map[store.id] = distanceKm(here, {
      lat: Number(store.latitude),
      lng: Number(store.longitude),
    });
  }
  storeDistances.value = map;
  await scrollToEnd();
}

// ---- Khung gio som nhat ----
interface SoonSlot {
  date: string;
  startTime: string;
  endTime: string;
  remaining: number;
}
const soonSlots = ref<SoonSlot[]>([]);
const loadingSlots = ref(false);
const chosenStore = ref<Store | null>(null);

/** Ba khung gio som nhat con cho, quet toi da hai tuan toi. */
async function pickStore(store: Store): Promise<void> {
  chosenStore.value = store;
  booking.storeId = store.id;
  booking.store = store;
  bookStage.value = 'SLOT';
  loadingSlots.value = true;
  soonSlots.value = [];
  await scrollToEnd();

  try {
    const today = new Date().toISOString().slice(0, 10);
    const days = await api.get<
      { date: string; slots: { startTime: string; endTime: string; remaining: number; available: boolean }[] }[]
    >('/bookings/availability', { storeId: store.id, from: today, days: 14 });

    const found: SoonSlot[] = [];
    for (const day of days ?? []) {
      for (const slot of day.slots ?? []) {
        if (!slot.available) continue;
        found.push({
          date: day.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          remaining: slot.remaining,
        });
        if (found.length >= 3) break;
      }
      if (found.length >= 3) break;
    }
    soonSlots.value = found;
  } catch {
    soonSlots.value = [];
  } finally {
    loadingSlots.value = false;
    await scrollToEnd();
  }
}

/**
 * Chon gio xong la du ca bon thu (hang muc, xe, cua hang, gio) nen di
 * thang sang buoc 3. Quay lai buoc 1 thi khach phai bam qua hai man ma
 * khong con gi de chon.
 */
async function pickSoonSlot(slot: SoonSlot): Promise<void> {
  booking.slot = { date: slot.date, startTime: slot.startTime };
  booking.persist();
  await navigateTo('/booking/step3');
}

/** Khong khung gio nao vua y thi mo lich day du o buoc 2. */
async function openFullCalendar(): Promise<void> {
  await navigateTo('/booking/step2');
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
        <!-- Video khach gui: xem lai duoc ngay trong cuoc tro chuyen. -->
        <video
          v-if="message.videoUrl"
          :src="message.videoUrl"
          controls
          playsinline
          preload="metadata"
          class="self-end"
          style="width: 190px; border-radius: 14px"
        />
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

      <!--
        Chon xong hang muc thi tro ly hoi not ba thu con thieu ngay tai day:
        xe nao, cua hang nao, gio nao. Hoi xong la du de dat lich, khach
        khong phai di lai tu dau o bieu mau.
      -->
      <section v-if="bookStage === 'VEHICLE'" class="card gap-2.5">
        <p class="text-[13.5px] font-semibold">{{ $t('sc10.askVehicleTitle') }}</p>

        <label
          v-for="item in myVehicles ?? []"
          :key="item.id"
          class="radio gap-[11px] px-3.5 py-2.5"
          style="border-radius: 18px; background: var(--color-neutral-100)"
        >
          <input type="radio" name="chatbike" :checked="vehicle?.id === item.id" @change="vehicle = item">
          <span class="dot" />
          <span class="min-w-0 flex-1">
            <span class="block text-[13.5px]">{{ item.maker }} {{ item.model }}</span>
            <span class="text-muted block truncate text-[11px]">{{ vehicleLine(item) }}</span>
          </span>
        </label>

        <!-- Khach vang lai go tay; bien so de buoc nhap thong tin hoi sau. -->
        <div v-if="!hasProfileVehicles" class="grid grid-cols-2 gap-2">
          <input v-model="manualVehicle.maker" class="input" :placeholder="$t('sc10.makerPlaceholder')">
          <input v-model="manualVehicle.model" class="input" :placeholder="$t('sc10.modelPlaceholder')">
        </div>

        <AyButton size="sm" class="self-start" @click="confirmBookVehicle">
          {{ $t('sc10.continueBooking') }}
        </AyButton>
      </section>

      <section v-else-if="bookStage === 'STORE'" class="card gap-2.5">
        <p class="text-[13.5px] font-semibold">{{ $t('sc10.askStoreTitle') }}</p>
        <p v-if="locating" class="text-muted text-[12px]">{{ $t('sc10.locating') }}</p>
        <p v-else-if="locationDenied" class="text-muted text-[12px]">{{ $t('sc10.locationOff') }}</p>

        <button
          v-for="store in sortedStores"
          :key="store.id"
          type="button"
          class="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left"
          style="border-radius: 18px; background: var(--color-neutral-100)"
          @click="pickStore(store)"
        >
          <span class="min-w-0 flex-1">
            <span class="block text-[13.5px] font-semibold">{{ i18n(store.name) }}</span>
            <span class="text-muted block truncate text-[11px]">{{ i18n(store.address) }}</span>
          </span>
          <span
            v-if="storeDistances[store.id] !== undefined"
            class="tag flex-none text-[11px]"
            style="background: var(--color-accent-200)"
          >
            {{ $t('sc10.kmAway', { km: storeDistances[store.id].toFixed(1) }) }}
          </span>
        </button>
      </section>

      <section v-else-if="bookStage === 'SLOT'" class="card gap-2.5">
        <p class="text-[13.5px] font-semibold">
          {{ $t('sc10.askSlotTitle', { store: i18n(chosenStore?.name ?? null) }) }}
        </p>
        <p v-if="loadingSlots" class="text-muted text-[12px]">{{ $t('sc10.findingSlots') }}</p>
        <p v-else-if="soonSlots.length === 0" class="text-muted text-[12px]">
          {{ $t('sc10.noSlotSoon') }}
        </p>

        <button
          v-for="(slot, index) in soonSlots"
          :key="index"
          type="button"
          class="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left"
          style="border-radius: 18px; background: var(--color-neutral-100)"
          @click="pickSoonSlot(slot)"
        >
          <span class="min-w-0 flex-1">
            <span class="block text-[13.5px] font-semibold">{{ dayLabel(slot.date) }}</span>
            <span class="text-muted block text-[11px]">
              {{ clock(slot.startTime) }} – {{ clock(slot.endTime) }}
            </span>
          </span>
          <span class="text-muted flex-none text-[11px]">
            {{ $t('sc10.slotsLeft', { n: slot.remaining }) }}
          </span>
        </button>

        <!-- Khong gio nao vua y thi mo lich day du. -->
        <AyButton variant="ghost" size="sm" class="self-start" @click="openFullCalendar">
          {{ $t('sc10.pickAnotherTime') }}
        </AyButton>
      </section>

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
        <AyVideoUpload v-model="video" :max-size-mb="8" compact />
        <!--
          Noi duoc thanh chu thi do thang vao o soan, khach sua lai duoc
          truoc khi gui. Trinh duyet khong lam duoc thi gui ban ghi am cho
          cua hang nghe — van hon la bat khach go tay.
        -->
        <AyVoiceToText v-if="noiDuocThanhChu" compact @text="text = $event" />
        <AyVoiceRecorder v-else compact @recorded="transcript = t('rec.sent')" />
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

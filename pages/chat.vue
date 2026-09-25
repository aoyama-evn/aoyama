<script setup lang="ts">
import type { AiDiagnosis, ServiceItem, Vehicle } from '~/types/models';

/**
 * SC-10 Chatbox AI chan doan (khach) va SC-10a (thanh vien).
 * Ban thiet ke: dai tro ly mau accent-2 tren cung, bong tin nhan bo tron lech
 * ve phia nguoi noi, va o soan ghim duoi cung tren nen neutral-100.
 * Ban thanh vien thay buoc "hang xe / doi xe" bang danh sach xe trong ho so.
 */
definePageMeta({ layout: 'chat' });

const api = useApi();
const auth = useAuthStore();
const booking = useBookingStore();
const ui = useUiStore();
const { t } = useI18n();
const { number } = useFormat();

const session = ref<AiDiagnosis | null>(null);
const intent = ref<'MAINTENANCE' | 'REPAIR' | null>(null);
const vehicle = ref<Vehicle | null>(null);
const text = ref('');
const images = ref<string[]>([]);
const transcript = ref<string | null>(null);
const sending = ref(false);
const scroller = ref<HTMLElement | null>(null);

/** SC-10a — thanh vien chon xe tu ho so thay vi go tay hang va doi xe. */
const { data: myVehicles } = await useAsyncData(
  'chat-vehicles',
  () => (auth.isCustomer ? api.get<Vehicle[]>('/account/vehicles') : Promise.resolve([])),
  { watch: [() => auth.isCustomer] },
);

async function ensureSession(): Promise<AiDiagnosis> {
  if (session.value) return session.value;
  session.value = await api.post<AiDiagnosis>('/ai/diagnosis/sessions', {
    sessionKey: `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    serviceIntent: intent.value ?? undefined,
    vehicleMaker: vehicle.value?.maker ?? undefined,
    vehicleModel: vehicle.value?.model ?? undefined,
  });
  return session.value;
}

async function scrollToEnd(): Promise<void> {
  await nextTick();
  scroller.value?.scrollTo({ top: scroller.value.scrollHeight, behavior: 'smooth' });
}

async function send(): Promise<void> {
  if (!text.value.trim() && images.value.length === 0 && !transcript.value) return;
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
    ui.error(
      normalizeError(error).message,
      t('sc10.failLead'),
    );
  } finally {
    sending.value = false;
  }
}

/** SC-11 — bam dat lich tu ket qua chan doan thi mang theo phien AI sang. */
async function bookFromFinding(serviceCodes: string[] | undefined): Promise<void> {
  const services = await api.get<ServiceItem[]>('/services');
  const matched = services.filter((s) => (serviceCodes ?? []).includes(s.code));

  booking.restore();
  booking.applyDiagnosis({
    diagnosisId: session.value?.id ?? '',
    description: session.value?.messages.find((m) => m.role === 'user')?.text,
    services: matched,
  });
  if (vehicle.value) booking.setVehicle(vehicle.value);
  await navigateTo('/booking/step1');
}

const findings = computed(() => session.value?.findings ?? []);
const analysisFailed = computed(() => session.value?.status === 'FAILED');
const canSend = computed(() => Boolean(text.value.trim() || images.value.length || transcript.value));

function vehicleLine(item: Vehicle): string {
  const parts = [item.plateNumber];
  if (item.currentOdometer !== null) parts.push(`${number(item.currentOdometer)} km`);
  if (item.modelYear) parts.push(`đời ${item.modelYear}`);
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
        <p class="text-[10.5px]" style="color: var(--color-accent-2-800)">{{ $t('sc10.assistantSub') }}</p>
      </div>
      <NuxtLink to="/" class="btn btn-ghost ml-auto px-2 text-[15px]" :aria-label="$t('sc10.closeAssistant')">
        ✕
      </NuxtLink>
    </div>

    <!-- Dong tin nhan -->
    <div ref="scroller" class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
      <p class="ay-bubble-bot">
        {{
          auth.user?.name
            ? $t('sc10.greetingNamed', { name: auth.user.name })
            : $t('sc10.greeting')
        }}
      </p>

      <div class="flex gap-2.5">
        <button
          type="button"
          class="btn btn-secondary text-[13px]"
          :class="intent === 'MAINTENANCE' ? 'ay-chip-on' : ''"
          @click="intent = 'MAINTENANCE'"
        >
          {{ $t('sc12.maintenance') }}
        </button>
        <button
          type="button"
          class="btn btn-secondary text-[13px]"
          :class="intent === 'REPAIR' ? 'ay-chip-on' : ''"
          @click="intent = 'REPAIR'"
        >
          {{ $t('sc12.repair') }}
        </button>
      </div>

      <!-- SC-10a: thanh vien chon xe tu ho so -->
      <template v-if="auth.isCustomer && (myVehicles ?? []).length">
        <p class="ay-bubble-bot">{{ $t('sc10.whichVehicle') }}</p>
        <div class="flex flex-col gap-2 self-stretch">
          <button
            v-for="item in myVehicles ?? []"
            :key="item.id"
            type="button"
            class="ay-row"
            :style="
              vehicle?.id === item.id ? 'background: var(--color-accent-200)' : undefined
            "
            @click="vehicle = item"
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
          <NuxtLink
            to="/account/vehicles/new/edit"
            class="btn btn-secondary text-[12.5px]"
            style="min-height: 44px"
          >
            {{ $t('sc10.otherVehicle') }}
          </NuxtLink>
        </div>
      </template>

      <p class="ay-bubble-bot">
        {{ $t('sc10.askSymptom') }}
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
        :vehicle-label="vehicle ? `${vehicle.maker} ${vehicle.model}` : null"
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

    <!-- O soan -->
    <div
      class="ay-safe-bottom flex flex-none flex-col gap-2.5 px-3.5 pb-4 pt-2.5"
      style="background: var(--color-neutral-100); border-top: 1px solid var(--color-divider)"
    >
      <div class="flex gap-2">
        <AyImageUpload v-model="images" :max="5" compact />
        <AyVoiceRecorder compact @recorded="transcript = 'Ghi âm đã gửi kèm'" />
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

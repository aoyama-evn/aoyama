<script setup lang="ts">
import type { OtpRequestResponse, TokenResponse, Vehicle } from '~/types/models';

/**
 * SC-14 Dat lich buoc 3 — FR-BOOK-01, FR-BOOK-06..08.
 *
 * Ban thiet ke ve bon che do tren cung mot man hinh:
 *  - SC-14a dang nhap bang so dien thoai va ma OTP, kem hai loi moi (dang ky /
 *    dat lich khong can tai khoan);
 *  - SC-14b khach vang lai: ho ten, so dien thoai, email, roi khai bao xe;
 *  - SC-14  thanh vien: the ho so, chon xe da co, cap nhat so km;
 *  - SC-14c dang ky thanh vien: ho so, xe, va o dong y nhan nhac bao duong.
 */
const api = useApi();
const auth = useAuthStore();
const booking = useBookingStore();
const ui = useUiStore();
const { t } = useI18n();
const { number } = useFormat();

type Mode = 'login' | 'guest' | 'member' | 'register';

const mode = ref<Mode>('login');
const myVehicles = ref<Vehicle[]>([]);
const errors = reactive<Record<string, string>>({});

/** SC-14a — o nhap OTP chi mo sau khi da bam gui ma. */
const otpSent = ref(false);
/** Ma may chu phat trien gui kem khi chua noi cong SMS — xem SC-19. */
const otpDevCode = ref('');
const otpCode = ref('');
const otpBusy = ref(false);
const marketingOptIn = ref(false);

onMounted(async () => {
  booking.restore();
  if (!booking.step2Complete) {
    await navigateTo('/booking/step2');
    return;
  }

  if (auth.isCustomer) {
    mode.value = 'member';
    if (!booking.contactName) booking.contactName = auth.user?.name ?? '';
    if (!booking.contactPhone) booking.contactPhone = auth.user?.phone ?? '';
    try {
      myVehicles.value = await api.get<Vehicle[]>('/account/vehicles');
      if (myVehicles.value.length > 0 && !booking.vehicle.vehicleId) {
        booking.setVehicle(myVehicles.value[0]);
      }
    } catch {
      // Khong lay duoc danh sach xe thi khach van khai bao tay duoc.
      myVehicles.value = [];
    }
  }
});

/** Che do nao phai khai bao xe bang tay. */
const showVehicleForm = computed(() => mode.value === 'guest' || mode.value === 'register');

async function requestOtp(): Promise<void> {
  if (!booking.contactPhone.trim()) {
    errors.contactPhone = t('validate.phone');
    return;
  }
  otpBusy.value = true;
  try {
    const sent = await api.post<OtpRequestResponse>('/auth/otp/request', {
      phone: booking.contactPhone.trim(),
      purpose: 'LOGIN',
    });
    otpDevCode.value = sent.devCode ?? '';
    otpSent.value = true;
    ui.success(t('common.otpSent'), t('common.otpValidNote'));
  } catch (error) {
    ui.error(normalizeError(error).message);
  } finally {
    otpBusy.value = false;
  }
}

async function verifyOtp(): Promise<void> {
  otpBusy.value = true;
  try {
    const session = await api.post<TokenResponse>('/auth/otp/verify', {
      phone: booking.contactPhone.trim(),
      code: otpCode.value.trim(),
      purpose: 'LOGIN',
    });
    auth.setSession(session, 'R-USER');
    mode.value = 'member';
    myVehicles.value = await api.get<Vehicle[]>('/account/vehicles').catch(() => []);
    booking.contactName = auth.user?.name ?? booking.contactName;
    booking.persist();
    ui.success(t('common.verified'));
  } catch (error) {
    ui.error(normalizeError(error).message);
  } finally {
    otpBusy.value = false;
  }
}

function pickVehicle(vehicle: Vehicle): void {
  booking.setVehicle(vehicle);
}

function vehicleLine(item: Vehicle): string {
  const parts = [item.plateNumber];
  if (item.currentOdometer !== null) parts.push(`${number(item.currentOdometer)} km`);
  if (item.modelYear) parts.push(t('common.modelYear', { year: item.modelYear }));
  return parts.filter(Boolean).join(' · ');
}

function validateAndContinue(): void {
  Object.keys(errors).forEach((key) => delete errors[key]);

  if (!booking.contactName.trim()) errors.contactName = t('validate.name');
  if (!booking.contactPhone.trim()) errors.contactPhone = t('validate.phone');
  else if (!/^[0-9+\-\s()]{8,20}$/.test(booking.contactPhone.trim())) {
    errors.contactPhone = t('validate.phoneBad');
  }
  if (booking.contactEmail.trim() && !/^\S+@\S+\.\S+$/.test(booking.contactEmail.trim())) {
    errors.contactEmail = t('validate.emailBad');
  }

  if (showVehicleForm.value) {
    if (!booking.vehicle.maker.trim()) errors.maker = t('validate.maker');
    if (!booking.vehicle.model.trim()) errors.model = t('validate.model');
    if (!booking.vehicle.plateNumber.trim()) errors.plateNumber = t('validate.plate');
  }

  if (Object.keys(errors).length > 0) return;
  booking.persist();
  void navigateTo('/booking/confirm');
}

useHead({ title: () => `${t('sc01.bookCta')} — 3` });
</script>

<template>
  <div class="flex flex-col gap-3.5 pb-4">
    <BookingSteps :current="3" />

    <!-- SC-14a Dang nhap -->
    <div v-if="mode === 'login'" class="flex flex-col gap-3">
      <h4 class="mb-1">{{ $t('sc14.loginTitle') }}</h4>

      <div class="field">
        <label for="phone">{{ $t('sc14.phone') }} *</label>
        <div class="mt-[5px] flex gap-2">
          <input
            id="phone"
            v-model="booking.contactPhone"
            class="input min-w-0 flex-1"
            type="tel"
            inputmode="tel"
            autocomplete="tel"
            placeholder="090-1234-5678"
          />
          <button
            type="button"
            class="btn btn-secondary flex-none whitespace-nowrap text-[12.5px]"
            style="min-height: 44px"
            :disabled="otpBusy"
            @click="requestOtp"
          >
            {{ $t('sc14.sendCode') }}
          </button>
        </div>
        <p v-if="errors.contactPhone" class="field-error mt-1">{{ errors.contactPhone }}</p>
      </div>

      <div
        v-if="otpDevCode"
        class="flex flex-wrap items-center gap-2 px-3.5 py-3"
        style="
          border: 1.5px dashed var(--color-accent-2-400);
          background: var(--color-accent-2-100);
          border-radius: 16px;
        "
      >
        <p class="w-full text-[11.5px] leading-[1.45]" style="color: var(--color-accent-2-800)">
          {{ $t('otpDev.notice') }}
        </p>
        <strong class="select-all font-heading text-[19px]" style="letter-spacing: 0.14em">
          {{ otpDevCode }}
        </strong>
        <button
          type="button"
          class="btn btn-secondary ml-auto text-[12px]"
          style="min-height: 38px"
          @click="otpCode = otpDevCode"
        >
          {{ $t('otpDev.fill') }}
        </button>
      </div>

      <div class="field">
        <label for="otp">{{ $t('sc14.otp') }} *</label>
        <input
          id="otp"
          v-model="otpCode"
          class="input font-heading"
          style="letter-spacing: 0.34em; font-size: 16px"
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength="6"
          :disabled="!otpSent"
        />
      </div>

      <div class="flex flex-wrap items-center justify-between gap-2.5">
        <span class="text-muted text-[12px]">{{ $t('sc14.otpValid') }}</span>
        <button type="button" class="btn btn-ghost px-1 text-[12.5px]" @click="requestOtp">
          {{ $t('sc14.resend') }}
        </button>
      </div>

      <button
        type="button"
        class="btn btn-primary btn-block"
        style="min-height: 48px; font-size: 15px; margin: 0"
        :disabled="otpBusy || otpCode.trim().length < 4"
        @click="verifyOtp"
      >
        {{ $t('sc14.verifyLogin') }}
      </button>

      <div class="flex items-center gap-2.5 text-[11px]" style="color: var(--color-neutral-500)">
        <span class="h-px flex-1" style="background: var(--color-divider)" />
        {{ $t('sc14.or') }}
        <span class="h-px flex-1" style="background: var(--color-divider)" />
      </div>

      <div
        class="flex flex-col gap-1.5 p-3"
        style="background: var(--color-accent-2-100); border-radius: 20px"
      >
        <p class="text-[13px] font-semibold">{{ $t('sc14.noAccount') }}</p>
        <p class="text-[12px] leading-[1.5]" style="color: var(--color-accent-2-800)">
          {{ $t('sc14.noAccountLead') }}
        </p>
        <button
          type="button"
          class="btn btn-secondary self-start text-[12.5px]"
          style="
            min-height: 44px;
            border-color: var(--color-accent-2-500);
            color: var(--color-accent-2-800);
          "
          @click="mode = 'register'"
        >
          {{ $t('sc14.registerCta') }}
        </button>
      </div>

      <div
        class="flex flex-col gap-1.5 p-3"
        style="background: var(--color-accent-100); border-radius: 20px"
      >
        <p class="text-[13px] font-semibold">{{ $t('sc14.guestTitle') }}</p>
        <p class="text-[12px] leading-[1.5]" style="color: var(--color-neutral-700)">
          {{ $t('sc14.guestLead') }}
        </p>
        <button
          type="button"
          class="btn btn-secondary self-start text-[12.5px]"
          style="min-height: 44px"
          @click="mode = 'guest'"
        >
          {{ $t('sc14.guestCta') }}
        </button>
      </div>
    </div>

    <!-- SC-14b Khach vang lai / SC-14c Dang ky -->
    <div v-else-if="mode === 'guest' || mode === 'register'" class="flex flex-col gap-3">
      <div
        v-if="mode === 'guest'"
        class="flex items-center gap-2.5 px-3.5 py-3"
        style="background: var(--color-surface); border-radius: 20px"
      >
        <span
          class="grid flex-none place-items-center rounded-full"
          style="
            width: 34px; height: 34px;
            background: var(--color-neutral-300); color: var(--color-neutral-700);
          "
          aria-hidden="true"
        >
          <svg
            width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"
          >
            <circle cx="12" cy="8" r="3.6" />
            <path d="M5 20a7 7 0 0 1 14 0" />
          </svg>
        </span>
        <span class="min-w-0 flex-1 leading-[1.3]">
          <span class="block text-[13.5px] font-semibold">{{ $t('sc14.guestBadge') }}</span>
          <span class="text-muted block text-[11.5px]">
            {{ $t('sc14.guestBadgeSub') }}
          </span>
        </span>
      </div>

      <div v-else class="flex items-center gap-2">
        <span class="tag tag-accent-2">{{ $t('sc14.registerBadge') }}</span>
      </div>

      <AyField for="name" :label="$t('sc14.fullName')" required :error="errors.contactName">
        <input id="name" v-model="booking.contactName" class="input" autocomplete="name" />
      </AyField>

      <AyField for="phone" :label="$t('sc14.phone')" required :error="errors.contactPhone">
        <input
          id="phone"
          v-model="booking.contactPhone"
          class="input"
          type="tel"
          inputmode="tel"
          autocomplete="tel"
        />
      </AyField>

      <AyField
        id="email"
        :label="mode === 'register' ? $t('sc14.emailOptional') : $t('sc14.email')"
        :error="errors.contactEmail"
      >
        <input
          id="email"
          v-model="booking.contactEmail"
          class="input"
          type="email"
          autocomplete="email"
          placeholder="a.nguyen@example.com"
        />
      </AyField>
    </div>

    <!-- SC-14 Thanh vien -->
    <div v-else class="flex flex-col gap-3">
      <div
        class="flex items-center gap-2.5 px-3.5 py-3"
        style="background: var(--color-accent-2-100); border-radius: 20px"
      >
        <span
          class="grid flex-none place-items-center rounded-full text-white"
          style="width: 38px; height: 38px; background: var(--color-accent-2-500)"
          aria-hidden="true"
        >
          <svg
            width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"
          >
            <circle cx="12" cy="8" r="3.6" />
            <path d="M5 20a7 7 0 0 1 14 0" />
          </svg>
        </span>
        <div class="flex-1 leading-[1.3]">
          <p class="text-[14px] font-semibold">{{ booking.contactName }}</p>
          <p class="text-muted text-[11.5px]">{{ booking.contactPhone }}</p>
        </div>
      </div>

      <label
        v-for="item in myVehicles"
        :key="item.id"
        class="radio gap-[11px] px-3.5 py-3"
        style="border-radius: 20px"
        :style="
          booking.vehicle.vehicleId === item.id
            ? 'background: var(--color-surface)'
            : 'background: var(--color-neutral-100)'
        "
      >
        <input
          type="radio"
          name="mybike"
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
        class="btn btn-secondary self-start text-[12.5px]"
      >
        {{ $t('sc12.addVehicle') }}
      </NuxtLink>

      <AyField for="odo" :label="$t('sc14.odometer')" :hint="$t('sc14.odometerHint')">
        <input
          id="odo"
          v-model.number="booking.vehicle.odometer"
          class="input"
          type="number"
          inputmode="numeric"
          min="0"
        />
      </AyField>
    </div>

    <!-- CP-13 Thong tin xe — chi hien o che do khach va dang ky -->
    <div v-if="showVehicleForm" class="pt-3" style="border-top: 1px solid var(--color-divider)">
      <h5 class="mb-2.5">{{ $t('sc14.vehicleTitle') }}</h5>
      <div class="grid grid-cols-2 gap-2.5">
        <AyField for="maker" :label="$t('sc14.maker')" required :error="errors.maker">
          <input id="maker" v-model="booking.vehicle.maker" class="input" placeholder="Honda" />
        </AyField>
        <AyField for="model" :label="$t('sc14.model')" required :error="errors.model">
          <input id="model" v-model="booking.vehicle.model" class="input" placeholder="Lead 125" />
        </AyField>
        <AyField for="cc" :label="$t('sc14.engineCc')">
          <input
            id="cc"
            v-model.number="booking.vehicle.engineCc"
            class="input"
            type="number"
            inputmode="numeric"
            min="0"
          />
        </AyField>
        <AyField for="plate" :label="$t('sc14.plate')" required :error="errors.plateNumber">
          <input
            id="plate"
            v-model="booking.vehicle.plateNumber"
            class="input"
            placeholder="34A1-234.56"
          />
        </AyField>
        <div class="col-span-2">
          <AyField for="odo2" :label="$t('sc14.odometer')">
            <input
              id="odo2"
              v-model.number="booking.vehicle.odometer"
              class="input"
              type="number"
              inputmode="numeric"
              min="0"
            />
          </AyField>
        </div>
      </div>
    </div>

    <label
      v-if="mode === 'register'"
      class="flex cursor-pointer items-start gap-2.5 text-[12.5px]"
    >
      <input v-model="marketingOptIn" type="checkbox" class="mt-[3px]" />
      <span>{{ $t('sc14.marketingOptIn') }}</span>
    </label>

    <template v-if="mode !== 'login'">
      <button
        type="button"
        class="btn btn-primary btn-block"
        style="min-height: 48px; font-size: 15px; margin: 0"
        @click="validateAndContinue"
      >
        {{ mode === 'register' ? $t('sc14.createAccount') : $t('common.next') }}
      </button>
    </template>

    <NuxtLink to="/booking/step2" class="btn btn-ghost self-center text-[13px]">
      {{ $t('common.back') }}
    </NuxtLink>
  </div>
</template>

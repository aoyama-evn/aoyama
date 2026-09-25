import { defineStore } from 'pinia';
import type { BookingServiceType } from '~/types/enums';
import type { ServiceItem, Store } from '~/types/models';

export interface BookingDraftVehicle {
  vehicleId?: string;
  plateNumber: string;
  maker: string;
  model: string;
  engineCc?: number | null;
  odometer?: number | null;
}

const DRAFT_KEY = 'aoyama_booking_draft';

/**
 * Trang thai luong dat lich SC-12 → SC-16.
 *
 * Ban nhap duoc giu trong sessionStorage: nguoi lon tuoi hay tai lai trang hoac
 * bam nut quay lai cua trinh duyet, mat du lieu giua chung la ly do bo cuoc
 * pho bien (RK-05).
 */
export const useBookingStore = defineStore('booking', () => {
  const storeId = ref<string | null>(null);
  const store = ref<Store | null>(null);
  const serviceType = ref<BookingServiceType>('MAINTENANCE');
  const selectedServiceIds = ref<string[]>([]);
  const selectedServices = ref<ServiceItem[]>([]);
  const slot = ref<{ date: string; startTime: string } | null>(null);
  const contactName = ref('');
  const contactPhone = ref('');
  const contactEmail = ref('');
  const vehicle = ref<BookingDraftVehicle>({
    plateNumber: '',
    maker: '',
    model: '',
    engineCc: null,
    odometer: null,
  });
  const symptomDescription = ref('');
  const symptomPhotoUrls = ref<string[]>([]);
  /** SC-12 — mot doan video ngan khach gui kem. */
  const symptomVideoUrl = ref<string | null>(null);
  const aiDiagnosisId = ref<string | null>(null);

  const estimatedTotal = computed(() =>
    selectedServices.value.reduce((sum, s) => sum + (s.quoteOnly ? 0 : s.basePrice), 0),
  );
  const estimatedMinutes = computed(() =>
    selectedServices.value.reduce((sum, s) => sum + s.durationMinutes, 0),
  );
  const hasQuoteOnly = computed(() => selectedServices.value.some((s) => s.quoteOnly));

  const step1Complete = computed(
    () => Boolean(storeId.value) && selectedServiceIds.value.length > 0,
  );
  const step2Complete = computed(() => step1Complete.value && Boolean(slot.value));
  const step3Complete = computed(
    () => step2Complete.value && contactName.value.trim().length > 0 && contactPhone.value.trim().length > 0,
  );

  /** SC-10a va SC-12a — chon mot xe da co trong ho so thanh vien. */
  function setVehicle(picked: {
    id?: string;
    plateNumber: string;
    maker: string;
    model: string;
    engineCc?: number | null;
    currentOdometer?: number | null;
  }): void {
    vehicle.value = {
      vehicleId: picked.id,
      plateNumber: picked.plateNumber,
      maker: picked.maker,
      model: picked.model,
      engineCc: picked.engineCc ?? null,
      odometer: picked.currentOdometer ?? null,
    };
    persist();
  }

  function toggleService(service: ServiceItem): void {
    if (selectedServiceIds.value.includes(service.id)) {
      selectedServiceIds.value = selectedServiceIds.value.filter((id) => id !== service.id);
      selectedServices.value = selectedServices.value.filter((s) => s.id !== service.id);
    } else {
      selectedServiceIds.value = [...selectedServiceIds.value, service.id];
      selectedServices.value = [...selectedServices.value, service];
    }
    syncServiceType();
    persist();
  }

  /** Chon ca hai loai dich vu thi lich hen duoc danh dau BOTH. */
  function syncServiceType(): void {
    const types = new Set(selectedServices.value.map((s) => s.type));
    if (types.size > 1) serviceType.value = 'BOTH';
    else if (types.has('REPAIR')) serviceType.value = 'REPAIR';
    else serviceType.value = 'MAINTENANCE';
  }

  /** Dan ket qua chan doan AI sang luong dat lich — SC-11 bam "Dat lich". */
  function applyDiagnosis(payload: {
    diagnosisId: string;
    description?: string;
    services: ServiceItem[];
  }): void {
    aiDiagnosisId.value = payload.diagnosisId;
    if (payload.description) symptomDescription.value = payload.description;
    for (const service of payload.services) {
      if (!selectedServiceIds.value.includes(service.id)) toggleService(service);
    }
  }

  function toPayload() {
    return {
      storeId: storeId.value as string,
      serviceType: serviceType.value,
      serviceIds: selectedServiceIds.value,
      date: slot.value?.date as string,
      startTime: slot.value?.startTime as string,
      contactName: contactName.value.trim(),
      contactPhone: contactPhone.value.trim(),
      contactEmail: contactEmail.value.trim() || undefined,
      vehicle: vehicle.value.plateNumber || vehicle.value.vehicleId ? vehicle.value : undefined,
      symptomDescription: symptomDescription.value.trim() || undefined,
      symptomPhotoUrls: symptomPhotoUrls.value.length ? symptomPhotoUrls.value : undefined,
      symptomVideoUrl: symptomVideoUrl.value ?? undefined,
      aiDiagnosisId: aiDiagnosisId.value ?? undefined,
    };
  }

  function persist(): void {
    if (!import.meta.client) return;
    try {
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          storeId: storeId.value,
          serviceType: serviceType.value,
          selectedServiceIds: selectedServiceIds.value,
          selectedServices: selectedServices.value,
          slot: slot.value,
          contactName: contactName.value,
          contactPhone: contactPhone.value,
          contactEmail: contactEmail.value,
          vehicle: vehicle.value,
          symptomDescription: symptomDescription.value,
          aiDiagnosisId: aiDiagnosisId.value,
        }),
      );
    } catch {
      // Khong luu duoc thi ban nhap chi song trong phien hien tai — chap nhan duoc.
    }
  }

  function restore(): void {
    if (!import.meta.client) return;
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      storeId.value = draft.storeId ?? null;
      serviceType.value = draft.serviceType ?? 'MAINTENANCE';
      selectedServiceIds.value = draft.selectedServiceIds ?? [];
      selectedServices.value = draft.selectedServices ?? [];
      slot.value = draft.slot ?? null;
      contactName.value = draft.contactName ?? '';
      contactPhone.value = draft.contactPhone ?? '';
      contactEmail.value = draft.contactEmail ?? '';
      vehicle.value = draft.vehicle ?? vehicle.value;
      symptomDescription.value = draft.symptomDescription ?? '';
      aiDiagnosisId.value = draft.aiDiagnosisId ?? null;
    } catch {
      reset();
    }
  }

  function reset(): void {
    storeId.value = null;
    store.value = null;
    serviceType.value = 'MAINTENANCE';
    selectedServiceIds.value = [];
    selectedServices.value = [];
    slot.value = null;
    contactName.value = '';
    contactPhone.value = '';
    contactEmail.value = '';
    vehicle.value = { plateNumber: '', maker: '', model: '', engineCc: null, odometer: null };
    symptomDescription.value = '';
    symptomPhotoUrls.value = [];
    symptomVideoUrl.value = null;
    aiDiagnosisId.value = null;
    if (import.meta.client) {
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        // Bo qua — khong xoa duoc ban nhap khong anh huong toi lich da tao.
      }
    }
  }

  return {
    storeId,
    store,
    serviceType,
    selectedServiceIds,
    selectedServices,
    slot,
    contactName,
    contactPhone,
    contactEmail,
    vehicle,
    symptomDescription,
    symptomPhotoUrls,
    symptomVideoUrl,
    aiDiagnosisId,
    estimatedTotal,
    estimatedMinutes,
    hasQuoteOnly,
    step1Complete,
    step2Complete,
    step3Complete,
    setVehicle,
    toggleService,
    applyDiagnosis,
    toPayload,
    persist,
    restore,
    reset,
  };
});

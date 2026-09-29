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
  /**
   * Ma nhung dich vu do AI de xuat, de SC-12 chi gan nhan "AI" dung vao chung.
   * Hang muc khach tu chon tu danh muc thi khong co nhan.
   */
  const aiSuggestedServiceIds = ref<string[]>([]);

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
      aiSuggestedServiceIds.value = aiSuggestedServiceIds.value.filter((id) => id !== service.id);
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
    /**
     * true khi khach bat dau dat lich tu ket qua chan doan: danh sach hang muc
     * phai dung bang nhung gi ho vua tick. Khong co co nay thi hang muc cua ban
     * nhap cu con lai se bi cong don vao, khach thay thua ra may dong khong
     * hieu tu dau. Cac muc khac cua ban nhap (cua hang, khung gio, lien he, xe)
     * van giu vi chung khong lien quan toi lan chan doan nay.
     */
    replaceServices?: boolean;
  }): void {
    aiDiagnosisId.value = payload.diagnosisId;
    if (payload.description) symptomDescription.value = payload.description;
    if (payload.replaceServices) {
      selectedServiceIds.value = [];
      selectedServices.value = [];
      aiSuggestedServiceIds.value = [];
    }
    for (const service of payload.services) {
      if (!selectedServiceIds.value.includes(service.id)) toggleService(service);
      if (!aiSuggestedServiceIds.value.includes(service.id)) {
        aiSuggestedServiceIds.value = [...aiSuggestedServiceIds.value, service.id];
      }
    }
    // Xoa het hang muc thi loai dich vu cung phai tinh lai.
    syncServiceType();
    persist();
  }

  /** Hang muc nay den tu goi y cua AI hay do khach tu chon. */
  function isAiSuggested(serviceId: string): boolean {
    return aiSuggestedServiceIds.value.includes(serviceId);
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
          aiSuggestedServiceIds: aiSuggestedServiceIds.value,
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
      aiSuggestedServiceIds.value = draft.aiSuggestedServiceIds ?? [];
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
    aiSuggestedServiceIds.value = [];
    if (import.meta.client) {
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        // Bo qua — khong xoa duoc ban nhap khong anh huong toi lich da tao.
      }
    }
  }

  return {
    aiSuggestedServiceIds,
    isAiSuggested,
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

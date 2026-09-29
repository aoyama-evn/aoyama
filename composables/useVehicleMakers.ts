/**
 * Danh sach hang xe cho khach chon san, dung chung cho CP-13 (bieu mau xe) va
 * SC-10 (chatbox). De o mot cho de hai man khong lech nhau khi them hang moi.
 *
 * "Khac" luon nam cuoi: chon muc nay thi man hinh mo them mot o de go tay,
 * vi danh sach nay chi gom nhung hang hay gap chu khong phai tat ca.
 */
export const VEHICLE_MAKERS = ['Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'Vespa'] as const;

export function useVehicleMakers() {
  const { t } = useI18n();

  /** Nhan "Khac" doi theo ngon ngu dang chon. */
  const otherLabel = computed(() => t('vehicle.makerOther'));

  /** Danh sach day du, kem muc "Khac" o cuoi — dung cho o chon tha xuong. */
  const withOther = computed<string[]>(() => [...VEHICLE_MAKERS, otherLabel.value]);

  /** Hang khach go tay co nam ngoai danh sach khong. */
  function isKnown(maker: string): boolean {
    return (VEHICLE_MAKERS as readonly string[]).includes(maker.trim());
  }

  return { makers: VEHICLE_MAKERS, otherLabel, withOther, isKnown };
}

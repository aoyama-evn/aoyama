import { Language, PaymentMethod, VehicleFuelType } from 'src/common/enums';

/**
 * Du lieu trinh dien.
 *
 * Khac voi seed-data.ts — la du lieu nen bat buoc phai co de he thong chay —
 * tep nay chi phuc vu buoi demo: khach hang, xe, lich hen, phieu dich vu va
 * thanh toan giong that, trai deu tren cac trang thai de moi man hinh deu co
 * gi do de xem.
 *
 * Moi ban ghi deu mang dau DEMO_TAG o ghi chu noi bo hoac ghi chu he thong,
 * nen go sach lai duoc bang `npm run seed:demo -- --reset`.
 */
export const DEMO_TAG = '[demo]';

export interface DemoVehicle {
  plateNumber: string;
  maker: string;
  model: string;
  modelYear: number;
  engineCc: number;
  color: string;
  fuelType: VehicleFuelType;
  nickname?: string;
  odometer: number;
}

export interface DemoCustomer {
  phone: string;
  name: string;
  nameKana?: string;
  email?: string;
  address?: string;
  language: Language;
  isGuest: boolean;
  internalNote?: string;
  vehicles: DemoVehicle[];
}

/** Tam khach hang — tron ten Nhat va ten Viet dung nhu ban thiet ke minh hoa. */
export const DEMO_CUSTOMERS: DemoCustomer[] = [
  {
    phone: '090-1234-5678',
    name: 'Nguyễn Văn A',
    email: 'a.nguyen@example.com',
    address: 'Hamamatsu, Shizuoka',
    language: Language.VI,
    isGuest: false,
    internalNote: 'Khách quen, thích gọi điện trước khi thay phụ tùng.',
    vehicles: [
      {
        plateNumber: '34A1-234.56',
        maker: 'Honda',
        model: 'Lead 125',
        modelYear: 2022,
        engineCc: 125,
        color: 'Trắng ngọc trai',
        fuelType: VehicleFuelType.GASOLINE,
        nickname: 'Xe đi làm',
        odometer: 18_400,
      },
      {
        plateNumber: '34B2-118.90',
        maker: 'Yamaha',
        model: 'Janus',
        modelYear: 2023,
        engineCc: 125,
        color: 'Xanh rêu',
        fuelType: VehicleFuelType.GASOLINE,
        odometer: 7_200,
      },
    ],
  },
  {
    phone: '090-2222-1111',
    name: 'Trần B',
    email: null as unknown as string,
    language: Language.VI,
    isGuest: false,
    vehicles: [
      {
        plateNumber: '29C1-456.78',
        maker: 'Honda',
        model: 'Vision 110',
        modelYear: 2021,
        engineCc: 110,
        color: 'Đỏ',
        fuelType: VehicleFuelType.GASOLINE,
        odometer: 24_600,
      },
    ],
  },
  {
    phone: '090-3333-4444',
    name: 'Lê C',
    email: 'le.c@example.com',
    language: Language.VI,
    isGuest: false,
    vehicles: [
      {
        plateNumber: '30F5-889.12',
        maker: 'Honda',
        model: 'PCX 125',
        modelYear: 2024,
        engineCc: 125,
        color: 'Đen nhám',
        fuelType: VehicleFuelType.GASOLINE,
        odometer: 5_100,
      },
    ],
  },
  {
    phone: '090-4444-7777',
    name: '山田 大輔',
    nameKana: 'ヤマダ ダイスケ',
    email: 'yamada@example.jp',
    address: '静岡県浜松市中区',
    language: Language.JA,
    isGuest: false,
    vehicles: [
      {
        plateNumber: '浜松 あ 12-34',
        maker: 'Honda',
        model: 'Super Cub 110',
        modelYear: 2019,
        engineCc: 110,
        color: 'ブルー',
        fuelType: VehicleFuelType.GASOLINE,
        nickname: '通勤用',
        odometer: 41_800,
      },
    ],
  },
  {
    phone: '090-5555-0000',
    name: '鈴木 恵子',
    nameKana: 'スズキ ケイコ',
    language: Language.JA,
    isGuest: true,
    vehicles: [
      {
        plateNumber: '浜松 い 55-01',
        maker: 'Yamaha',
        model: 'NMAX 155',
        modelYear: 2023,
        engineCc: 155,
        color: 'グレー',
        fuelType: VehicleFuelType.GASOLINE,
        odometer: 9_450,
      },
    ],
  },
  {
    phone: '090-6666-3322',
    name: '田中 健一',
    nameKana: 'タナカ ケンイチ',
    email: 'tanaka.k@example.jp',
    language: Language.JA,
    isGuest: false,
    vehicles: [
      {
        plateNumber: '沼津 う 88-12',
        maker: 'Kawasaki',
        model: 'Z125 Pro',
        modelYear: 2020,
        engineCc: 125,
        color: 'ライムグリーン',
        fuelType: VehicleFuelType.GASOLINE,
        odometer: 33_200,
      },
    ],
  },
  {
    phone: '090-7777-8899',
    name: 'Phạm D',
    language: Language.VI,
    isGuest: true,
    vehicles: [
      {
        plateNumber: '51G9-321.45',
        maker: 'Vespa',
        model: 'Sprint 125',
        modelYear: 2022,
        engineCc: 125,
        color: 'Vàng kem',
        fuelType: VehicleFuelType.GASOLINE,
        odometer: 12_050,
      },
    ],
  },
  {
    phone: '090-8888-1234',
    name: '佐藤 由美',
    nameKana: 'サトウ ユミ',
    email: 'sato.yumi@example.jp',
    language: Language.JA,
    isGuest: false,
    internalNote: 'Hẹn gọi sau 18:00.',
    vehicles: [
      {
        plateNumber: '三島 え 70-09',
        maker: 'Honda',
        model: 'Dio 110',
        modelYear: 2018,
        engineCc: 110,
        color: 'ホワイト',
        fuelType: VehicleFuelType.ELECTRIC,
        odometer: 52_300,
      },
    ],
  },
];

/** Phu tung dung khi dung phieu dich vu, doi chieu theo ma trong seed-data. */
export const DEMO_PART_USAGE = [
  { code: 'P-OIL-10W30', quantity: 1 },
  { code: 'P-BRAKE-PAD-F', quantity: 1 },
  { code: 'P-PLUG-CR7HSA', quantity: 2 },
  { code: 'P-CHAIN-428', quantity: 1 },
];

/** Cach thu tien, xoay vong cho cac phieu da ban giao. */
export const DEMO_PAYMENT_METHODS = [
  PaymentMethod.CASH,
  PaymentMethod.BANK_TRANSFER,
  PaymentMethod.CASH,
  PaymentMethod.CARD_AT_STORE,
];

/** Trieu chung khach mo ta, dung cho lich hen va chan doan. */
export const DEMO_SYMPTOMS = [
  'Xe kêu lạ khi phanh gấp, phanh trước không ăn.',
  'Máy hơi rung khi chạy chậm, thỉnh thoảng chết máy ở đèn đỏ.',
  'エンジンから異音、加速が鈍い。',
  'Đèn pha lúc sáng lúc tối, ắc quy có vẻ yếu.',
  'Lốp sau mòn không đều, cần kiểm tra.',
  '定期点検をお願いします。',
];

/** Ket qua chan doan AI gan vao mot lich hen, de SC-11 va SA-05 co gi de hien. */
export const DEMO_AI_FINDINGS = [
  {
    label: 'Mòn má phanh trước',
    matchPercent: 82,
    description: 'Tiếng kim loại khi phanh gấp thường do má phanh mòn tới chân.',
    suggestedServiceCodes: ['SVC-REPAIR-BRAKE-TYRE'],
    severity: 'HIGH' as const,
  },
  {
    label: 'Đĩa phanh cong',
    matchPercent: 41,
    description: 'Cần đo độ đảo của đĩa để loại trừ.',
    suggestedServiceCodes: ['SVC-REPAIR-BRAKE-TYRE'],
    severity: 'MEDIUM' as const,
  },
  {
    label: 'Dầu phanh bẩn',
    matchPercent: 23,
    description: 'Dầu quá hạn làm hành trình phanh dài hơn.',
    suggestedServiceCodes: ['SVC-MAINT-PERIODIC'],
    severity: 'LOW' as const,
  },
];

export const DEMO_AI_MESSAGES = [
  { role: 'user' as const, text: 'Xe kêu lạ khi phanh gấp, phanh trước không ăn' },
  {
    role: 'assistant' as const,
    text: 'Bạn cho biết xe đã chạy bao nhiêu km và lần thay má phanh gần nhất là khi nào?',
  },
  { role: 'user' as const, text: 'Khoảng 18.400 km, chưa thay má phanh lần nào.' },
  {
    role: 'assistant' as const,
    text: 'Nhiều khả năng má phanh trước đã mòn. Kỹ thuật viên sẽ kiểm tra thực tế khi bạn tới.',
  },
];

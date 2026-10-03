import { Language, NotificationChannel, NotificationEvent, ServiceType } from 'src/common/enums';
import { I18nText } from 'src/common/types';

export interface StoreSeed {
  code: string;
  name: I18nText;
  address: I18nText;
  phone: string;
  email: string;
  latitude: string;
  longitude: string;
  defaultCapacity: number;
  sortOrder: number;
}

/** Ba cua hang mau — con so thuc te cho khach hang xac nhan tai OQ-03. */
export const STORES: StoreSeed[] = [
  {
    code: 'AY-HAMAMATSU',
    name: {
      ja: 'アオヤマ 浜松店',
      en: 'AOYAMA Hamamatsu',
      vi: 'AOYAMA Hamamatsu',
    },
    address: {
      ja: '静岡県浜松市中区板屋町111-2',
      en: '111-2 Itayamachi, Naka-ku, Hamamatsu, Shizuoka',
      vi: '111-2 Itayamachi, Naka-ku, Hamamatsu, Shizuoka',
    },
    phone: '+81534501111',
    email: 'hamamatsu@aoyama-service.jp',
    latitude: '34.7108000',
    longitude: '137.7261000',
    defaultCapacity: 4,
    sortOrder: 1,
  },
  {
    code: 'AY-IWATA',
    name: { ja: 'アオヤマ 磐田店', en: 'AOYAMA Iwata', vi: 'AOYAMA Iwata' },
    address: {
      ja: '静岡県磐田市中泉1-1',
      en: '1-1 Nakaizumi, Iwata, Shizuoka',
      vi: '1-1 Nakaizumi, Iwata, Shizuoka',
    },
    phone: '+81538320000',
    email: 'iwata@aoyama-service.jp',
    latitude: '34.7180000',
    longitude: '137.8510000',
    defaultCapacity: 3,
    sortOrder: 2,
  },
  {
    code: 'AY-KAKEGAWA',
    name: { ja: 'アオヤマ 掛川店', en: 'AOYAMA Kakegawa', vi: 'AOYAMA Kakegawa' },
    address: {
      ja: '静岡県掛川市駅前1-5',
      en: '1-5 Ekimae, Kakegawa, Shizuoka',
      vi: '1-5 Ekimae, Kakegawa, Shizuoka',
    },
    phone: '+81537220000',
    email: 'kakegawa@aoyama-service.jp',
    latitude: '34.7690000',
    longitude: '138.0150000',
    defaultCapacity: 2,
    sortOrder: 3,
  },
];

export interface ServiceSeed {
  code: string;
  slug: string;
  type: ServiceType;
  name: I18nText;
  shortDescription: I18nText;
  checklistItems: I18nText[];
  durationMinutes: number;
  basePrice: number;
  quoteOnly?: boolean;
  iconKey: string;
  isFeatured: boolean;
  sortOrder: number;
  maintenanceIntervalMonths?: number;
  maintenanceIntervalKm?: number;
}

/** Danh muc dich vu khoi tao — bam theo cac the dich vu tren SC-01 cua thiet ke. */
export const SERVICES: ServiceSeed[] = [
  {
    code: 'SVC-MAINT-PERIODIC',
    slug: 'periodic-maintenance',
    type: ServiceType.MAINTENANCE,
    name: {
      ja: '定期点検・メンテナンス',
      en: 'Periodic maintenance',
      vi: 'Bảo dưỡng định kỳ',
    },
    shortDescription: {
      ja: 'エンジンオイル、チェーン、各部の点検',
      en: 'Engine oil, chain and general checks',
      vi: 'Dầu máy, xích, kiểm tra tổng thể',
    },
    checklistItems: [
      { ja: 'エンジンオイル交換', en: 'Engine oil change', vi: 'Thay dầu máy' },
      { ja: 'チェーン調整・給油', en: 'Chain adjustment', vi: 'Căng và tra dầu xích' },
      { ja: 'タイヤ空気圧', en: 'Tyre pressure', vi: 'Áp suất lốp' },
      { ja: 'ライト・ウインカー点検', en: 'Lights and signals', vi: 'Kiểm tra đèn và xi nhan' },
    ],
    durationMinutes: 45,
    basePrice: 2500,
    iconKey: 'leaf',
    isFeatured: true,
    sortOrder: 1,
    maintenanceIntervalMonths: 6,
    maintenanceIntervalKm: 3000,
  },
  {
    code: 'SVC-MAINT-INSPECT',
    slug: 'general-inspection',
    type: ServiceType.INSPECTION,
    name: { ja: '総合点検', en: 'General inspection', vi: 'Kiểm tra tổng quát' },
    shortDescription: {
      ja: '車両全体の状態チェック',
      en: 'Full vehicle condition check',
      vi: 'Kiểm tra toàn bộ tình trạng xe',
    },
    checklistItems: [
      { ja: 'ブレーキ点検', en: 'Brake check', vi: 'Kiểm tra phanh' },
      { ja: 'バッテリー点検', en: 'Battery check', vi: 'Kiểm tra ắc quy' },
      { ja: '電装系点検', en: 'Electrical check', vi: 'Kiểm tra hệ điện' },
    ],
    durationMinutes: 60,
    basePrice: 1800,
    iconKey: 'clock',
    isFeatured: true,
    sortOrder: 2,
    maintenanceIntervalMonths: 12,
    maintenanceIntervalKm: 6000,
  },
  {
    code: 'SVC-MAINT-OIL',
    slug: 'engine-oil-change',
    type: ServiceType.MAINTENANCE,
    name: { ja: 'エンジンオイル交換', en: 'Engine oil change', vi: 'Thay dầu máy' },
    shortDescription: {
      ja: 'オイルとフィルターの交換',
      en: 'Oil and filter replacement',
      vi: 'Thay dầu và lọc dầu',
    },
    checklistItems: [
      { ja: 'オイル抜き取り', en: 'Drain old oil', vi: 'Xả dầu cũ' },
      { ja: 'オイルフィルター交換', en: 'Replace oil filter', vi: 'Thay lọc dầu' },
    ],
    durationMinutes: 30,
    basePrice: 2500,
    iconKey: 'droplet',
    isFeatured: false,
    sortOrder: 3,
  },
  {
    code: 'SVC-REPAIR-BRAKE-TYRE',
    slug: 'brakes-and-tyres',
    type: ServiceType.REPAIR,
    name: { ja: 'ブレーキ・タイヤ整備', en: 'Brakes and tyres', vi: 'Phanh · lốp · vỏ xe' },
    shortDescription: {
      ja: 'ブレーキパッド、タイヤ交換・修理',
      en: 'Brake pads, tyre change and repair',
      vi: 'Má phanh, thay và vá lốp',
    },
    checklistItems: [
      { ja: 'ブレーキパッド残量', en: 'Brake pad wear', vi: 'Độ mòn má phanh' },
      { ja: 'タイヤ溝・損傷', en: 'Tyre tread and damage', vi: 'Gai lốp và hư hỏng' },
    ],
    durationMinutes: 45,
    basePrice: 3500,
    iconKey: 'target',
    isFeatured: true,
    sortOrder: 3,
  },
  {
    code: 'SVC-REPAIR-ENGINE',
    slug: 'engine-repair',
    type: ServiceType.REPAIR,
    name: { ja: 'エンジン修理', en: 'Engine repair', vi: 'Sửa chữa động cơ' },
    shortDescription: {
      ja: '始動不良、異音、出力低下など',
      en: 'Starting issues, noise, power loss',
      vi: 'Khó nổ, kêu lạ, yếu máy',
    },
    checklistItems: [
      { ja: '圧縮測定', en: 'Compression test', vi: 'Đo nén' },
      { ja: 'プラグ点検', en: 'Spark plug check', vi: 'Kiểm tra bugi' },
    ],
    durationMinutes: 120,
    basePrice: 0,
    quoteOnly: true,
    iconKey: 'wrench',
    isFeatured: false,
    sortOrder: 4,
  },
  {
    code: 'SVC-REPAIR-ELECTRIC',
    slug: 'electrical-and-battery',
    type: ServiceType.REPAIR,
    name: { ja: '電装・バッテリー', en: 'Electrical and battery', vi: 'Điện · ắc quy' },
    shortDescription: {
      ja: 'バッテリー上がり、配線、灯火類',
      en: 'Flat battery, wiring and lights',
      vi: 'Hết bình, dây điện, đèn',
    },
    checklistItems: [
      { ja: 'バッテリー電圧測定', en: 'Battery voltage test', vi: 'Đo điện áp ắc quy' },
      { ja: '充電系点検', en: 'Charging system check', vi: 'Kiểm tra hệ sạc' },
    ],
    durationMinutes: 40,
    basePrice: 2200,
    iconKey: 'bolt',
    isFeatured: false,
    sortOrder: 6,
  },
  {
    code: 'SVC-REPAIR-PAINT',
    slug: 'paint-and-bodywork',
    type: ServiceType.REPAIR,
    name: { ja: '塗装・板金', en: 'Paint and bodywork', vi: 'Sơn và đồng' },
    shortDescription: {
      ja: '傷・へこみの補修と塗装',
      en: 'Scratch and dent repair, repainting',
      vi: 'Xử lý trầy xước, móp và sơn lại',
    },
    checklistItems: [],
    durationMinutes: 240,
    basePrice: 0,
    quoteOnly: true,
    iconKey: 'brush',
    isFeatured: true,
    sortOrder: 5,
  },
  {
    code: 'SVC-PACKAGE-CARE-12M',
    slug: 'care-plan-12-months',
    type: ServiceType.PACKAGE,
    name: { ja: '12ヶ月メンテナンスパック', en: '12-month care plan', vi: 'Gói bảo dưỡng 12 tháng' },
    shortDescription: {
      ja: '年4回の定期メンテナンス',
      en: 'Four scheduled services a year',
      vi: '4 lần bảo dưỡng trong năm',
    },
    checklistItems: [
      { ja: '定期点検 4回', en: '4 periodic services', vi: '4 lần bảo dưỡng định kỳ' },
      { ja: 'オイル交換 4回', en: '4 oil changes', vi: '4 lần thay dầu' },
    ],
    durationMinutes: 45,
    basePrice: 18000,
    iconKey: 'shield',
    isFeatured: false,
    sortOrder: 8,
  },
  {
    code: 'SVC-INSURANCE',
    slug: 'insurance-consultation',
    type: ServiceType.MAINTENANCE,
    name: { ja: 'バイク保険相談', en: 'Insurance consultation', vi: 'Tư vấn bảo hiểm xe máy' },
    shortDescription: {
      ja: '店頭でのご相談',
      en: 'In-store consultation',
      vi: 'Tư vấn tại cửa hàng',
    },
    checklistItems: [],
    durationMinutes: 30,
    basePrice: 0,
    quoteOnly: true,
    iconKey: 'shield',
    isFeatured: true,
    sortOrder: 6,
  },
];

export interface PartSeed {
  code: string;
  name: I18nText;
  maker: string;
  makerPartNo: string;
  category: string;
  specification: string;
  costPrice: number;
  sellPrice: number;
  compatibleVehicles: string[];
}

export const PARTS: PartSeed[] = [
  {
    code: 'P-OIL-10W30',
    name: { ja: 'エンジンオイル 10W-30 1L', en: 'Engine oil 10W-30 1L', vi: 'Dầu máy 10W-30 1L' },
    maker: 'Honda',
    makerPartNo: '08232-99961',
    category: 'OIL',
    specification: '10W-30 / 1L',
    costPrice: 900,
    sellPrice: 1400,
    compatibleVehicles: ['Honda Super Cub 110', 'Honda PCX 125', 'Yamaha NMAX 155'],
  },
  {
    code: 'P-BRAKE-PAD-F',
    name: { ja: 'フロントブレーキパッド', en: 'Front brake pad', vi: 'Má phanh trước' },
    maker: 'Nissin',
    makerPartNo: 'NS-FP-110',
    category: 'BRAKE',
    specification: 'Front / semi-metallic',
    costPrice: 1800,
    sellPrice: 2900,
    compatibleVehicles: ['Honda PCX 125', 'Yamaha NMAX 155'],
  },
  {
    code: 'P-TYRE-9080-14',
    name: { ja: 'タイヤ 90/80-14', en: 'Tyre 90/80-14', vi: 'Lốp 90/80-14' },
    maker: 'IRC',
    makerPartNo: 'IRC-9080-14',
    category: 'TYRE',
    specification: '90/80-14 tubeless',
    costPrice: 3800,
    sellPrice: 5600,
    compatibleVehicles: ['Honda PCX 125'],
  },
  {
    code: 'P-PLUG-CR7HSA',
    name: { ja: 'スパークプラグ CR7HSA', en: 'Spark plug CR7HSA', vi: 'Bugi CR7HSA' },
    maker: 'NGK',
    makerPartNo: 'CR7HSA',
    category: 'ENGINE',
    specification: 'NGK CR7HSA',
    costPrice: 450,
    sellPrice: 800,
    compatibleVehicles: ['Honda Super Cub 110', 'Honda Wave 110'],
  },
  {
    code: 'P-BATTERY-YTZ7V',
    name: { ja: 'バッテリー YTZ7V', en: 'Battery YTZ7V', vi: 'Ắc quy YTZ7V' },
    maker: 'Yuasa',
    makerPartNo: 'YTZ7V',
    category: 'ELECTRIC',
    specification: '12V 6Ah',
    costPrice: 5200,
    sellPrice: 7800,
    compatibleVehicles: ['Honda PCX 125', 'Yamaha NMAX 155'],
  },
  {
    code: 'P-CHAIN-428',
    name: { ja: 'ドライブチェーン 428', en: 'Drive chain 428', vi: 'Xích tải 428' },
    maker: 'DID',
    makerPartNo: 'DID-428-118L',
    category: 'DRIVE',
    specification: '428 / 118 links',
    costPrice: 2400,
    sellPrice: 3900,
    compatibleVehicles: ['Honda Super Cub 110', 'Honda Wave 110'],
  },
];

export interface TemplateSeed {
  event: NotificationEvent;
  channel: NotificationChannel;
  language: Language;
  subject?: string;
  body: string;
  availableVariables: string[];
}

/**
 * Mau thong bao khoi tao cho ba ngon ngu (C-02).
 * Noi dung SMS giu ngan vi chi phi tinh theo do dai (RK-03).
 */
export const NOTIFICATION_TEMPLATES: TemplateSeed[] = [
  // --- Dat lai mat khau quan tri (SA-01b) ---
  {
    event: NotificationEvent.ADMIN_PASSWORD_RESET,
    channel: NotificationChannel.EMAIL,
    language: Language.JA,
    subject: '【AOYAMA Admin】パスワード再設定',
    body: '{{name}} 様\n\n下記のリンクからパスワードを再設定してください（{{minutes}}分間有効）。\n{{resetUrl}}\n\nお心当たりがない場合はこのメールを破棄してください。',
    availableVariables: ['name', 'resetUrl', 'minutes'],
  },
  {
    event: NotificationEvent.ADMIN_PASSWORD_RESET,
    channel: NotificationChannel.EMAIL,
    language: Language.EN,
    subject: '[AOYAMA Admin] Password reset',
    body: 'Hi {{name}},\n\nUse the link below to set a new password (valid {{minutes}} minutes).\n{{resetUrl}}\n\nIf you did not request this, you can ignore this email.',
    availableVariables: ['name', 'resetUrl', 'minutes'],
  },
  {
    event: NotificationEvent.ADMIN_PASSWORD_RESET,
    channel: NotificationChannel.EMAIL,
    language: Language.VI,
    subject: '[AOYAMA Admin] Dat lai mat khau',
    body: 'Chao {{name}},\n\nMo duong dan sau de dat mat khau moi (hieu luc {{minutes}} phut).\n{{resetUrl}}\n\nNeu ban khong yeu cau, hay bo qua email nay.',
    availableVariables: ['name', 'resetUrl', 'minutes'],
  },
  // --- OTP ---
  {
    event: NotificationEvent.OTP,
    channel: NotificationChannel.SMS,
    language: Language.JA,
    body: '【AOYAMA】認証コード: {{otpCode}} ({{minutes}}分間有効)',
    availableVariables: ['otpCode', 'minutes'],
  },
  {
    event: NotificationEvent.OTP,
    channel: NotificationChannel.SMS,
    language: Language.EN,
    body: '[AOYAMA] Your code: {{otpCode}} (valid {{minutes}} min)',
    availableVariables: ['otpCode', 'minutes'],
  },
  {
    event: NotificationEvent.OTP,
    channel: NotificationChannel.SMS,
    language: Language.VI,
    body: '[AOYAMA] Ma xac thuc: {{otpCode}} (hieu luc {{minutes}} phut)',
    availableVariables: ['otpCode', 'minutes'],
  },

  // --- Da nhan yeu cau dat lich ---
  {
    event: NotificationEvent.BOOKING_CREATED,
    channel: NotificationChannel.SMS,
    language: Language.JA,
    body: '【AOYAMA】ご予約を受け付けました。予約番号 {{bookingCode}} / {{scheduledAt}} / {{storeName}}。店舗確認後に確定のご連絡をします。',
    availableVariables: ['bookingCode', 'scheduledAt', 'storeName', 'customerName', 'serviceType'],
  },
  {
    event: NotificationEvent.BOOKING_CREATED,
    channel: NotificationChannel.SMS,
    language: Language.EN,
    body: '[AOYAMA] Booking received. Code {{bookingCode}} / {{scheduledAt}} / {{storeName}}. We will confirm shortly.',
    availableVariables: ['bookingCode', 'scheduledAt', 'storeName', 'customerName', 'serviceType'],
  },
  {
    event: NotificationEvent.BOOKING_CREATED,
    channel: NotificationChannel.SMS,
    language: Language.VI,
    body: '[AOYAMA] Da nhan lich hen. Ma {{bookingCode}} / {{scheduledAt}} / {{storeName}}. Cua hang se xac nhan som.',
    availableVariables: ['bookingCode', 'scheduledAt', 'storeName', 'customerName', 'serviceType'],
  },

  // --- Da xac nhan ---
  {
    event: NotificationEvent.BOOKING_CONFIRMED,
    channel: NotificationChannel.SMS,
    language: Language.JA,
    body: '【AOYAMA】{{customerName}} 様 ご予約確定\n予約番号 {{bookingCode}}\n車両 {{vehicle}}\n{{scheduledAt}} {{storeName}}\n進捗確認 {{link}}',
    availableVariables: ['bookingCode', 'customerName', 'vehicle', 'link', 'scheduledAt', 'storeName', 'storePhone'],
  },
  {
    event: NotificationEvent.BOOKING_CONFIRMED,
    channel: NotificationChannel.SMS,
    language: Language.EN,
    body: '[AOYAMA] {{customerName}}, your booking is confirmed.\nCode {{bookingCode}}\nVehicle {{vehicle}}\n{{scheduledAt}} {{storeName}}\nTrack it: {{link}}',
    availableVariables: ['bookingCode', 'customerName', 'vehicle', 'link', 'scheduledAt', 'storeName', 'storePhone'],
  },
  {
    event: NotificationEvent.BOOKING_CONFIRMED,
    channel: NotificationChannel.SMS,
    language: Language.VI,
    body: '[AOYAMA] {{customerName}} oi, lich hen da duoc xac nhan.\nMa lich {{bookingCode}}\nXe {{vehicle}}\n{{scheduledAt}} {{storeName}}\nTheo doi tien do: {{link}}',
    availableVariables: ['bookingCode', 'customerName', 'vehicle', 'link', 'scheduledAt', 'storeName', 'storePhone'],
  },

  // --- Nhac lich ---
  {
    event: NotificationEvent.BOOKING_REMINDER,
    channel: NotificationChannel.SMS,
    language: Language.JA,
    body: '【AOYAMA】明日のご予約 {{scheduledAt}} / {{storeName}} をお待ちしています。予約番号 {{bookingCode}}',
    availableVariables: ['bookingCode', 'scheduledAt', 'storeName', 'customerName'],
  },
  {
    event: NotificationEvent.BOOKING_REMINDER,
    channel: NotificationChannel.SMS,
    language: Language.EN,
    body: '[AOYAMA] Reminder: your appointment {{scheduledAt}} at {{storeName}}. Code {{bookingCode}}',
    availableVariables: ['bookingCode', 'scheduledAt', 'storeName', 'customerName'],
  },
  {
    event: NotificationEvent.BOOKING_REMINDER,
    channel: NotificationChannel.SMS,
    language: Language.VI,
    body: '[AOYAMA] Nhac lich hen {{scheduledAt}} tai {{storeName}}. Ma {{bookingCode}}',
    availableVariables: ['bookingCode', 'scheduledAt', 'storeName', 'customerName'],
  },

  // --- Da huy ---
  {
    event: NotificationEvent.BOOKING_CANCELLED,
    channel: NotificationChannel.SMS,
    language: Language.JA,
    body: '【AOYAMA】ご予約 {{bookingCode}} をキャンセルしました。',
    availableVariables: ['bookingCode', 'scheduledAt'],
  },
  {
    event: NotificationEvent.BOOKING_CANCELLED,
    channel: NotificationChannel.SMS,
    language: Language.EN,
    body: '[AOYAMA] Booking {{bookingCode}} has been cancelled.',
    availableVariables: ['bookingCode', 'scheduledAt'],
  },
  {
    event: NotificationEvent.BOOKING_CANCELLED,
    channel: NotificationChannel.SMS,
    language: Language.VI,
    body: '[AOYAMA] Lich hen {{bookingCode}} da duoc huy.',
    availableVariables: ['bookingCode', 'scheduledAt'],
  },

  // --- Doi lich ---
  {
    event: NotificationEvent.BOOKING_RESCHEDULED,
    channel: NotificationChannel.SMS,
    language: Language.JA,
    body: '【AOYAMA】ご予約 {{bookingCode}} を {{scheduledAt}} / {{storeName}} に変更しました。',
    availableVariables: ['bookingCode', 'scheduledAt', 'storeName'],
  },
  {
    event: NotificationEvent.BOOKING_RESCHEDULED,
    channel: NotificationChannel.SMS,
    language: Language.EN,
    body: '[AOYAMA] Booking {{bookingCode}} moved to {{scheduledAt}} at {{storeName}}.',
    availableVariables: ['bookingCode', 'scheduledAt', 'storeName'],
  },
  {
    event: NotificationEvent.BOOKING_RESCHEDULED,
    channel: NotificationChannel.SMS,
    language: Language.VI,
    body: '[AOYAMA] Lich hen {{bookingCode}} da doi sang {{scheduledAt}} tai {{storeName}}.',
    availableVariables: ['bookingCode', 'scheduledAt', 'storeName'],
  },

  // --- Bao gia ---
  {
    event: NotificationEvent.QUOTATION_SENT,
    channel: NotificationChannel.SMS,
    language: Language.JA,
    body: '【AOYAMA】{{customerName}} 様 お見積りをお送りしました。\n予約番号 {{bookingCode}}\n車両 {{vehicle}}\n合計 {{totalAmount}}円\nご確認 {{link}}',
    availableVariables: ['bookingCode', 'customerName', 'vehicle', 'link', 'quotationCode', 'totalAmount'],
  },
  {
    event: NotificationEvent.QUOTATION_SENT,
    channel: NotificationChannel.SMS,
    language: Language.EN,
    body: '[AOYAMA] {{customerName}}, your quotation is ready.\nBooking {{bookingCode}}\nVehicle {{vehicle}}\nTotal JPY {{totalAmount}}\nReview it: {{link}}',
    availableVariables: ['bookingCode', 'customerName', 'vehicle', 'link', 'quotationCode', 'totalAmount'],
  },
  {
    event: NotificationEvent.QUOTATION_SENT,
    channel: NotificationChannel.SMS,
    language: Language.VI,
    body: '[AOYAMA] {{customerName}} oi, cua hang da gui bao gia.\nMa lich {{bookingCode}}\nXe {{vehicle}}\nTong {{totalAmount}} JPY\nXem bao gia: {{link}}',
    availableVariables: ['bookingCode', 'customerName', 'vehicle', 'link', 'quotationCode', 'totalAmount'],
  },

  // --- Xe da xong ---
  {
    event: NotificationEvent.WORK_ORDER_COMPLETED,
    channel: NotificationChannel.SMS,
    language: Language.JA,
    body: '【AOYAMA】{{customerName}} 様 作業が完了しました。お引き取りをお待ちしております。\n予約番号 {{bookingCode}}\n車両 {{vehicle}}\n合計 {{totalAmount}}円\n詳細 {{link}}',
    availableVariables: ['bookingCode', 'customerName', 'vehicle', 'link', 'workOrderCode', 'totalAmount'],
  },
  {
    event: NotificationEvent.WORK_ORDER_COMPLETED,
    channel: NotificationChannel.SMS,
    language: Language.EN,
    body: '[AOYAMA] {{customerName}}, the work is done and your bike is ready for pickup.\nBooking {{bookingCode}}\nVehicle {{vehicle}}\nTotal JPY {{totalAmount}}\nDetails: {{link}}',
    availableVariables: ['bookingCode', 'customerName', 'vehicle', 'link', 'workOrderCode', 'totalAmount'],
  },
  {
    event: NotificationEvent.WORK_ORDER_COMPLETED,
    channel: NotificationChannel.SMS,
    language: Language.VI,
    body: '[AOYAMA] {{customerName}} oi, xe da sua xong, moi ban den nhan.\nMa lich {{bookingCode}}\nXe {{vehicle}}\nTong {{totalAmount}} JPY\nChi tiet: {{link}}',
    availableVariables: ['bookingCode', 'customerName', 'vehicle', 'link', 'workOrderCode', 'totalAmount'],
  },

  // --- Da ban giao ---
  {
    event: NotificationEvent.VEHICLE_DELIVERED,
    channel: NotificationChannel.SMS,
    language: Language.JA,
    body: '【AOYAMA】お引き渡し完了 {{workOrderCode}}。ご利用ありがとうございました。',
    availableVariables: ['workOrderCode', 'customerName'],
  },
  {
    event: NotificationEvent.VEHICLE_DELIVERED,
    channel: NotificationChannel.SMS,
    language: Language.EN,
    body: '[AOYAMA] Vehicle handed over {{workOrderCode}}. Thank you.',
    availableVariables: ['workOrderCode', 'customerName'],
  },
  {
    event: NotificationEvent.VEHICLE_DELIVERED,
    channel: NotificationChannel.SMS,
    language: Language.VI,
    body: '[AOYAMA] Da ban giao xe {{workOrderCode}}. Cam on ban.',
    availableVariables: ['workOrderCode', 'customerName'],
  },

  // --- Den ky bao duong ---
  {
    event: NotificationEvent.MAINTENANCE_DUE,
    channel: NotificationChannel.SMS,
    language: Language.JA,
    body: '【AOYAMA】{{plateNumber}} の次回点検時期が近づいています ({{dueDate}})。ご予約をお待ちしています。',
    availableVariables: ['customerName', 'plateNumber', 'dueDate'],
  },
  {
    event: NotificationEvent.MAINTENANCE_DUE,
    channel: NotificationChannel.SMS,
    language: Language.EN,
    body: '[AOYAMA] Next service for {{plateNumber}} is due around {{dueDate}}. Book anytime.',
    availableVariables: ['customerName', 'plateNumber', 'dueDate'],
  },
  {
    event: NotificationEvent.MAINTENANCE_DUE,
    channel: NotificationChannel.SMS,
    language: Language.VI,
    body: '[AOYAMA] Xe {{plateNumber}} sap den ky bao duong ({{dueDate}}). Moi ban dat lich.',
    availableVariables: ['customerName', 'plateNumber', 'dueDate'],
  },
];

export interface FaqSeed {
  question: I18nText;
  answer: I18nText;
  category: string;
  sortOrder: number;
}

export const FAQS: FaqSeed[] = [
  {
    question: {
      ja: '予約なしでも整備できますか？',
      en: 'Can I come without a booking?',
      vi: 'Không đặt lịch có sửa được không?',
    },
    answer: {
      ja: '可能ですが、お待ちいただく場合があります。事前予約をおすすめします。',
      en: 'Yes, but you may need to wait. We recommend booking in advance.',
      vi: 'Được, nhưng có thể phải chờ. Nên đặt lịch trước.',
    },
    category: 'BOOKING',
    sortOrder: 1,
  },
  {
    question: {
      ja: '予約のキャンセルはいつまでできますか？',
      en: 'Until when can I cancel a booking?',
      vi: 'Hủy lịch hẹn được đến khi nào?',
    },
    answer: {
      ja: 'ご予約時刻の2時間前までオンラインでキャンセルできます。それ以降は店舗へお電話ください。',
      en: 'Online cancellation is available up to 2 hours before the appointment. After that, please call the store.',
      vi: 'Có thể hủy trực tuyến đến trước giờ hẹn 2 tiếng. Sau đó vui lòng gọi cửa hàng.',
    },
    category: 'BOOKING',
    sortOrder: 2,
  },
  {
    question: {
      ja: '支払い方法は何がありますか？',
      en: 'What payment methods are accepted?',
      vi: 'Có những hình thức thanh toán nào?',
    },
    answer: {
      ja: '店頭でのお支払いのみです。現金、店頭カード決済に対応しています。',
      en: 'Payment is made at the store only, by cash or card at the counter.',
      vi: 'Chỉ thanh toán tại cửa hàng, bằng tiền mặt hoặc thẻ tại quầy.',
    },
    category: 'PAYMENT',
    sortOrder: 3,
  },
];

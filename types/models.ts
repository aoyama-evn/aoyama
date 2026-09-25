import type {
  AdminRole,
  BookingServiceType,
  BookingStatus,
  InventoryTxType,
  LanguageCode,
  NotificationChannel,
  NotificationSendStatus,
  PaymentMethod,
  PaymentStatus,
  QuotationStatus,
  ServiceType,
  UserRole,
  VehicleFuelType,
  WorkOrderStatus,
} from './enums';

/** Xuat lai de man hinh chi phai nho mot cho khi lay kieu. */
export type * from './enums';

/** Chuoi da ngon ngu tra ve tu API — C-02. */
export type I18nText = Partial<Record<LanguageCode, string>>;

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export interface Page<T> {
  items: T[];
  meta: PageMeta;
}

/** Dang loi chuan hoa tu AllExceptionsFilter cua backend. */
export interface ApiError {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
  path?: string;
  timestamp?: string;
}

// ---------------- Tai khoan ----------------

export interface AuthUser {
  sub: string;
  role: UserRole;
  adminRole?: AdminRole;
  phone?: string;
  storeId?: string | null;
  name?: string;
}

export interface CustomerProfile {
  id: string;
  phone: string;
  name: string;
  nameKana: string | null;
  email: string | null;
  address: string | null;
  isGuest: boolean;
  language: LanguageCode;
  notifySms: boolean;
  notifyEmail: boolean;
  internalNote?: string | null;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string | null;
  fullName: string;
  phone: string | null;
  role: AdminRole;
  storeId: string | null;
  store?: Store | null;
  language: LanguageCode;
  isActive: boolean;
  lastLoginAt: string | null;
  lockedUntil: string | null;
  mustChangePassword: boolean;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  isNewAccount?: boolean;
  user: Record<string, unknown>;
}

// ---------------- Cua hang ----------------

export interface StoreBusinessHour {
  id: string;
  weekday: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
}

export interface StoreHoliday {
  id: string;
  date: string;
  reason: string | null;
}

export interface TimeSlotConfig {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  capacity: number;
  isActive: boolean;
}

export interface Store {
  id: string;
  code: string;
  name: I18nText;
  description: I18nText | null;
  address: I18nText;
  phone: string;
  email: string | null;
  latitude: string | null;
  longitude: string | null;
  photoUrls: string[];
  defaultCapacity: number;
  isActive: boolean;
  sortOrder: number;
  businessHours?: StoreBusinessHour[];
  holidays?: StoreHoliday[];
  timeSlots?: TimeSlotConfig[];
}

// ---------------- Danh muc ----------------

export interface ServiceItem {
  id: string;
  slug: string;
  code: string;
  type: ServiceType;
  name: I18nText;
  shortDescription: I18nText | null;
  description: I18nText | null;
  checklistItems: I18nText[];
  durationMinutes: number;
  basePrice: number;
  quoteOnly: boolean;
  iconKey: string | null;
  imageUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  maintenanceIntervalMonths: number | null;
  maintenanceIntervalKm: number | null;
  priceRules?: PriceRule[];
}

export interface PriceRule {
  id: string;
  serviceId: string;
  service?: ServiceItem;
  storeId: string | null;
  engineCcFrom: number | null;
  engineCcTo: number | null;
  difficultyLevel: number;
  price: number;
  laborMinutes: number | null;
  validFrom: string | null;
  validTo: string | null;
  isActive: boolean;
  note: string | null;
}

// ---------------- Phuong tien ----------------

export interface Vehicle {
  id: string;
  customerId: string;
  customer?: CustomerProfile;
  plateNumber: string;
  maker: string;
  model: string;
  modelYear: number | null;
  engineCc: number | null;
  color: string | null;
  vinNumber: string | null;
  currentOdometer: number | null;
  photoUrls: string[];
  /** SC-30 — ten goi nho khach tu dat. */
  nickname: string | null;
  fuelType: VehicleFuelType;
  note: string | null;
  isActive: boolean;
  /** FR-VEH-07 — moc gan nhat va moc de xuat, chi co o SC-29 va SC-31. */
  lastServicedAt?: string | null;
  lastServiceOdometer?: number | null;
  nextServiceDueDate?: string | null;
  nextServiceDueOdometer?: number | null;
}

export interface ServiceHistory {
  id: string;
  vehicleId: string;
  workOrderId: string | null;
  storeId: string;
  servicedAt: string;
  type: ServiceType;
  summary: string;
  detail: string | null;
  odometer: number | null;
  totalAmount: number;
  itemNames: string[];
}

// ---------------- Dat lich ----------------

export interface BookingServiceLine {
  id: string;
  serviceId: string | null;
  serviceName: string;
  estimatedPrice: number;
  estimatedMinutes: number;
}

export interface BookingStatusHistory {
  id: string;
  fromStatus: BookingStatus | null;
  toStatus: BookingStatus;
  action: string;
  actorType: string;
  note: string | null;
  previousScheduledAt: string | null;
  createdAt: string;
}

export interface Booking {
  id: string;
  code: string;
  customerId: string;
  customer?: CustomerProfile;
  vehicleId: string | null;
  vehicle?: Vehicle | null;
  storeId: string;
  store?: Store;
  status: BookingStatus;
  serviceType: BookingServiceType;
  scheduledAt: string;
  slotStartTime: string;
  slotEndTime: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string | null;
  symptomDescription: string | null;
  symptomPhotoUrls: string[];
  aiDiagnosisId: string | null;
  createdByAdmin: boolean;
  qrToken: string | null;
  confirmedAt: string | null;
  receivedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  adminNote: string | null;
  services?: BookingServiceLine[];
  statusHistories?: BookingStatusHistory[];
  createdAt: string;
}

export interface SlotAvailability {
  startTime: string;
  endTime: string;
  capacity: number;
  booked: number;
  remaining: number;
  available: boolean;
  reason?: 'FULL' | 'PAST' | 'CLOSED';
}

export interface DayAvailability {
  date: string;
  isHoliday: boolean;
  isClosed: boolean;
  slots: SlotAvailability[];
}

export interface QrScanResult {
  valid: boolean;
  reason?: 'NOT_FOUND' | 'ALREADY_RECEIVED' | 'CANCELLED' | 'EXPIRED' | 'NOT_CONFIRMED';
  message?: string;
  booking?: Booking;
}

// ---------------- Phieu dich vu ----------------

export interface WorkOrderItem {
  id: string;
  serviceId: string | null;
  name: string;
  description: string | null;
  unitPrice: number;
  quantity: number;
  laborMinutes: number | null;
  suggestedByAi: boolean;
  isDone: boolean;
  sortOrder: number;
}

export interface WorkOrderPart {
  id: string;
  partId: string | null;
  partName: string;
  partCode: string | null;
  unitPrice: number;
  quantity: number;
  suggestedByAi: boolean;
}

export interface WorkOrderPhoto {
  id: string;
  stage: 'INTAKE' | 'PROGRESS' | 'COMPLETION' | string;
  url: string;
  caption: string | null;
  visibleToCustomer: boolean;
  createdAt: string;
}

export interface WorkOrderStatusHistory {
  id: string;
  fromStatus: WorkOrderStatus | null;
  toStatus: WorkOrderStatus;
  note: string | null;
  visibleToCustomer: boolean;
  createdAt: string;
}

export interface WorkOrder {
  id: string;
  code: string;
  bookingId: string | null;
  booking?: Booking | null;
  customerId: string;
  customer?: CustomerProfile;
  vehicleId: string;
  vehicle?: Vehicle;
  storeId: string;
  store?: Store;
  status: WorkOrderStatus;
  paymentStatus: PaymentStatus;
  intakeOdometer: number;
  /** Muc nhien lieu theo phan tu binh: 0..4. */
  intakeFuelLevel: number | null;
  /** SA-08 — phu kien khach de lai cung xe. */
  intakeAccessories: string | null;
  intakeNote: string | null;
  customerSymptom: string | null;
  diagnosisNote: string | null;
  diagnosisCause: string | null;
  progressPercent: number;
  progressNote: string | null;
  estimatedCompletionAt: string | null;
  laborSubtotal: number;
  partsSubtotal: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  completedAt: string | null;
  deliveredAt: string | null;
  items?: WorkOrderItem[];
  parts?: WorkOrderPart[];
  photos?: WorkOrderPhoto[];
  statusHistories?: WorkOrderStatusHistory[];
  createdAt: string;
}

/** Du lieu rut gon hien tren SC-26 — chi gom moc va anh duoc phep cho khach xem. */
export interface PublicProgress {
  bookingCode: string;
  bookingStatus: BookingStatus;
  /** SC-26 ve ca chang lich hen tren cung mot dong thoi gian. */
  bookingTimeline: { status: BookingStatus; at: string; note: string | null }[];
  hasQr: boolean;
  vehicle: { maker: string; model: string; plateNumber: string } | null;
  hasWorkOrder: boolean;
  status?: WorkOrderStatus;
  intakeOdometer?: number;
  /** Muc nhien lieu theo phan tu binh: 0..4. */
  intakeFuelLevel?: number | null;
  totalAmount?: number;
  progressPercent?: number;
  progressNote?: string | null;
  estimatedCompletionAt?: string | null;
  timeline?: { status: WorkOrderStatus; at: string; note: string | null }[];
  photos?: { url: string; caption: string | null; stage: string }[];
}

// ---------------- Bao gia va thanh toan ----------------

export interface QuotationItem {
  id: string;
  kind: 'LABOR' | 'PART' | 'OTHER' | string;
  serviceId: string | null;
  partId: string | null;
  name: string;
  description: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  isOptional: boolean;
  isAccepted: boolean;
  suggestedByAi: boolean;
  sortOrder: number;
}

export interface Quotation {
  id: string;
  code: string;
  workOrderId: string;
  workOrder?: WorkOrder;
  customerId: string;
  customer?: CustomerProfile;
  version: number;
  status: QuotationStatus;
  publicToken: string;
  subtotal: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  validUntil: string | null;
  note: string | null;
  sentAt: string | null;
  respondedAt: string | null;
  rejectReason: string | null;
  customerComment: string | null;
  items: QuotationItem[];
  createdAt: string;
}

export interface Payment {
  id: string;
  workOrderId: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  receiptNo: string | null;
  note: string | null;
  isVoided: boolean;
  voidReason: string | null;
}

// ---------------- Phu tung ----------------

export interface Part {
  id: string;
  code: string;
  name: I18nText;
  maker: string | null;
  makerPartNo: string | null;
  category: string | null;
  specification: string | null;
  unit: string;
  costPrice: number;
  sellPrice: number;
  compatibleVehicles: string[];
  imageUrls: string[];
  createdSource: string;
  isActive: boolean;
}

export interface Inventory {
  id: string;
  storeId: string;
  store?: Store;
  partId: string;
  part?: Part;
  quantity: number;
  minQuantity: number;
  locationNote: string | null;
}

export interface InventoryTransaction {
  id: string;
  storeId: string;
  store?: Store;
  partId: string;
  part?: Part;
  type: InventoryTxType;
  quantityChange: number;
  quantityAfter: number;
  unitCost: number | null;
  reason: string | null;
  createdAt: string;
}

// ---------------- AI ----------------

export interface DiagnosisFinding {
  label: string;
  matchPercent: number;
  description?: string;
  suggestedServiceCodes?: string[];
  severity?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface DiagnosisMessage {
  role: 'user' | 'assistant';
  text?: string;
  imageUrls?: string[];
  audioUrl?: string;
  transcript?: string;
  at: string;
}

export interface AiDiagnosis {
  id: string;
  sessionKey: string;
  language: LanguageCode;
  vehicleMaker: string | null;
  vehicleModel: string | null;
  serviceIntent: string | null;
  messages: DiagnosisMessage[];
  findings: DiagnosisFinding[];
  summaryText: string | null;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | string;
  latencyMs: number | null;
  bookingId: string | null;
}

export interface QuotationSuggestion {
  lines: {
    kind: 'LABOR' | 'PART';
    code?: string;
    name: string;
    unitPrice: number;
    quantity: number;
    reason?: string;
  }[];
  generatedAt: string;
  isFallback: boolean;
}

export interface PartRecognition {
  name?: string;
  makerPartNo?: string;
  maker?: string;
  category?: string;
  specification?: string;
  compatibleVehicles?: string[];
  confidence?: number;
  isFallback: boolean;
}

export interface TechAnswer {
  answer: string;
  citations: { documentId: string; title: string; excerpt: string }[];
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: string | null;
  applicableMakers: string[];
  applicableModels: string[];
  fileUrl: string | null;
  fileType: string | null;
  pageCount: number | null;
  indexStatus: string;
  createdAt: string;
}

// ---------------- Thong bao va he thong ----------------

export interface NotificationTemplate {
  id: string;
  event: string;
  channel: NotificationChannel;
  language: LanguageCode;
  subject: string | null;
  body: string;
  availableVariables: string[];
  isActive: boolean;
}

export interface NotificationLog {
  id: string;
  event: string;
  channel: NotificationChannel;
  language: LanguageCode;
  recipient: string;
  subject: string | null;
  body: string;
  status: NotificationSendStatus;
  sentAt: string | null;
  errorMessage: string | null;
  retryCount: number;
  createdAt: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: unknown;
  valueType: string;
  group: string | null;
  description: string | null;
  isEditable: boolean;
}

export interface AuditLog {
  id: string;
  actorId: string | null;
  actorName: string | null;
  actorType: string;
  action: string;
  entity: string;
  entityId: string | null;
  changes: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface Faq {
  id: string;
  question: I18nText;
  answer: I18nText;
  category: string | null;
  sortOrder: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  subject: string | null;
  message: string;
  isHandled: boolean;
  handlerNote: string | null;
  createdAt: string;
}

// ---------------- Bao cao ----------------

export interface DashboardStats {
  date: string;
  todayBookings: number;
  pendingBookings: number;
  openWorkOrders: number;
  awaitingQuotation: number;
  unpaidWorkOrders: number;
  lowStockCount: number;
  todayRevenue: number;
}

export interface SummaryReport {
  range: { from: string; to: string; storeId?: string };
  bookings: {
    total: number;
    byStatus: { status: BookingStatus; count: number }[];
    byServiceType: { serviceType: string; count: number }[];
    byDay: { date: string; count: number }[];
    cancelRate: number;
    noShowRate: number;
  };
  workOrders: {
    byStatus: { status: string; count: number }[];
    averageTurnaroundHours: number | null;
  };
  revenue: number;
}

export interface RevenueReport {
  range: { from: string; to: string };
  total: number;
  byDay: { date: string; amount: number; workOrders: number }[];
  byMethod: { method: string; amount: number }[];
  split: { labor: number; parts: number };
}

export interface PartsReport {
  range: { from: string; to: string };
  topUsed: { partName: string; partCode: string; quantity: number; amount: number }[];
  lowStock: Inventory[];
}

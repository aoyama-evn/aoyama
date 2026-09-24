import { Customer } from 'src/modules/customers/entities/customer.entity';
import { MaintenanceSchedule, ServiceHistory, Vehicle } from 'src/modules/vehicles/entities';
import { Store, StoreBusinessHour, StoreHoliday, TimeSlot } from 'src/modules/stores/entities';
import { PriceRule, Service } from 'src/modules/catalog/entities';
import { Inventory, InventoryTransaction, Part } from 'src/modules/parts/entities';
import { Booking, BookingService, BookingStatusHistory } from 'src/modules/bookings/entities';
import {
  WorkOrder,
  WorkOrderItem,
  WorkOrderPart,
  WorkOrderPhoto,
  WorkOrderStatusHistory,
} from 'src/modules/work-orders/entities';
import { Quotation, QuotationItem } from 'src/modules/quotations/entities';
import { Payment } from 'src/modules/payments/entities';
import { AiDiagnosis, KnowledgeDocument } from 'src/modules/ai/entities';
import { AdminUser } from 'src/modules/admin-users/entities';
import { OtpCode, RefreshToken } from 'src/modules/auth/entities';
import { NotificationLog, NotificationTemplate } from 'src/modules/notifications/entities';
import { AuditLog, SystemSetting } from 'src/modules/system/entities';
import { ContactMessage, Faq } from 'src/modules/content/entities';

/**
 * Danh sach thuc the dang ky voi TypeORM.
 * Giu tap trung o mot cho de data-source (CLI migration) va AppModule dung chung
 * dung mot tap, tranh tinh trang migration sinh thieu bang.
 */
export const ENTITIES = [
  // Khach hang va phuong tien
  Customer,
  Vehicle,
  ServiceHistory,
  MaintenanceSchedule,
  // Cua hang va lich lam viec
  Store,
  StoreBusinessHour,
  StoreHoliday,
  TimeSlot,
  // Danh muc dich vu
  Service,
  PriceRule,
  // Phu tung va ton kho
  Part,
  Inventory,
  InventoryTransaction,
  // Dat lich
  Booking,
  BookingService,
  BookingStatusHistory,
  // Phieu dich vu
  WorkOrder,
  WorkOrderItem,
  WorkOrderPart,
  WorkOrderPhoto,
  WorkOrderStatusHistory,
  // Bao gia va thanh toan
  Quotation,
  QuotationItem,
  Payment,
  // AI
  AiDiagnosis,
  KnowledgeDocument,
  // Tai khoan va xac thuc
  AdminUser,
  OtpCode,
  RefreshToken,
  // Thong bao
  NotificationTemplate,
  NotificationLog,
  // He thong va noi dung
  AuditLog,
  SystemSetting,
  Faq,
  ContactMessage,
];

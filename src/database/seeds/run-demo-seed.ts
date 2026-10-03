import { DataSource, In } from 'typeorm';
import {
  BookingServiceType,
  BookingStatus,
  PaymentStatus,
  QuotationStatus,
  ServiceType,
  WorkDifficulty,
  WorkOrderStatus,
} from 'src/common/enums';
import { formatBookingCode, generatePublicToken } from 'src/common/utils';
import { AdminUser } from 'src/modules/admin-users/entities/admin-user.entity';
import { AiDiagnosis } from 'src/modules/ai/entities/ai-diagnosis.entity';
import { Booking } from 'src/modules/bookings/entities/booking.entity';
import { BookingService } from 'src/modules/bookings/entities/booking-service.entity';
import { BookingStatusHistory } from 'src/modules/bookings/entities/booking-status-history.entity';
import { Service } from 'src/modules/catalog/entities/service.entity';
import { Customer } from 'src/modules/customers/entities/customer.entity';
import { Inventory } from 'src/modules/parts/entities/inventory.entity';
import { Part } from 'src/modules/parts/entities/part.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { Quotation } from 'src/modules/quotations/entities/quotation.entity';
import { QuotationItem } from 'src/modules/quotations/entities/quotation-item.entity';
import { Store } from 'src/modules/stores/entities/store.entity';
import { MaintenanceSchedule } from 'src/modules/vehicles/entities/maintenance-schedule.entity';
import { ServiceHistory } from 'src/modules/vehicles/entities/service-history.entity';
import { Vehicle } from 'src/modules/vehicles/entities/vehicle.entity';
import { WorkOrder } from 'src/modules/work-orders/entities/work-order.entity';
import { WorkOrderItem } from 'src/modules/work-orders/entities/work-order-item.entity';
import { WorkOrderPart } from 'src/modules/work-orders/entities/work-order-part.entity';
import { WorkOrderStatusHistory } from 'src/modules/work-orders/entities/work-order-status-history.entity';
import dataSource from '../data-source';
import {
  DEMO_AI_FINDINGS,
  DEMO_AI_MESSAGES,
  DEMO_CUSTOMERS,
  DEMO_PART_USAGE,
  DEMO_PAYMENT_METHODS,
  DEMO_SYMPTOMS,
  DEMO_TAG,
} from './demo-data';

/**
 * Nap du lieu trinh dien.
 *
 *   npm run seed:demo           nap du lieu
 *   npm run seed:demo -- --reset  xoa du lieu demo cu roi nap lai
 *
 * Chay duoc nhieu lan: moi lan nap deu xoa sach ban demo truoc do, nen so lieu
 * tren bang dieu khien khong bi cong don. Du lieu nen (cua hang, dich vu, phu
 * tung, tai khoan quan tri) do `npm run seed` lo, tep nay khong dung toi.
 *
 * Chi nhan dien ban ghi demo qua DEMO_TAG, nen du lieu that — neu co — khong
 * bi dong cham.
 */

const TZ_OFFSET_HOURS = 9; // C-03 — moi moc thoi gian tinh theo gio Nhat Ban.

/** Dung mot moc ngay theo gio Nhat Ban, tra ve Date o mui UTC. */
function atJst(daysFromToday: number, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const base = new Date();
  base.setUTCHours(0, 0, 0, 0);
  base.setUTCDate(base.getUTCDate() + daysFromToday);
  base.setUTCHours(h - TZ_OFFSET_HOURS, m, 0, 0);
  return base;
}

function jstDateString(daysFromToday: number): string {
  const d = new Date(Date.now() + daysFromToday * 86_400_000 + TZ_OFFSET_HOURS * 3_600_000);
  return d.toISOString().slice(0, 10);
}

async function main(): Promise<void> {
  const ds = await dataSource.initialize();
  try {
    await clearDemo(ds);
    if (process.argv.includes('--reset')) {
      console.log('Da xoa du lieu demo. Ket thuc vi co --reset.');
      return;
    }
    await seedDemo(ds);
  } finally {
    await ds.destroy();
  }
}

/**
 * Go du lieu demo cu. Di tu con len cha de khong vuong rang buoc khoa ngoai;
 * moc nhan dien la khach hang co DEMO_TAG trong ghi chu noi bo.
 */
async function clearDemo(ds: DataSource): Promise<void> {
  const customers = await ds.getRepository(Customer).find({
    where: { internalNote: In(demoNotes()) },
    select: { id: true },
  });
  const customerIds = customers.map((c) => c.id);
  if (customerIds.length === 0) return;

  const vehicleIds = (
    await ds
      .getRepository(Vehicle)
      .find({ where: { customerId: In(customerIds) }, select: { id: true } })
  ).map((v) => v.id);

  const workOrderIds = (
    await ds
      .getRepository(WorkOrder)
      .find({ where: { customerId: In(customerIds) }, select: { id: true } })
  ).map((w) => w.id);

  const bookingIds = (
    await ds
      .getRepository(Booking)
      .find({ where: { customerId: In(customerIds) }, select: { id: true } })
  ).map((b) => b.id);

  const quotationIds = workOrderIds.length
    ? (
        await ds
          .getRepository(Quotation)
          .find({ where: { workOrderId: In(workOrderIds) }, select: { id: true } })
      ).map((q) => q.id)
    : [];

  if (quotationIds.length) {
    await ds.getRepository(QuotationItem).delete({ quotationId: In(quotationIds) });
  }
  if (workOrderIds.length) {
    await ds.getRepository(Payment).delete({ workOrderId: In(workOrderIds) });
    await ds.getRepository(Quotation).delete({ workOrderId: In(workOrderIds) });
    await ds.getRepository(WorkOrderStatusHistory).delete({ workOrderId: In(workOrderIds) });
    await ds.getRepository(WorkOrderItem).delete({ workOrderId: In(workOrderIds) });
    await ds.getRepository(WorkOrderPart).delete({ workOrderId: In(workOrderIds) });
  }
  if (bookingIds.length) {
    await ds.getRepository(BookingStatusHistory).delete({ bookingId: In(bookingIds) });
    await ds.getRepository(BookingService).delete({ bookingId: In(bookingIds) });
  }
  if (vehicleIds.length) {
    await ds.getRepository(ServiceHistory).delete({ vehicleId: In(vehicleIds) });
    await ds.getRepository(MaintenanceSchedule).delete({ vehicleId: In(vehicleIds) });
  }
  await ds.getRepository(AiDiagnosis).delete({ customerId: In(customerIds) });
  if (workOrderIds.length) await ds.getRepository(WorkOrder).delete({ id: In(workOrderIds) });
  if (bookingIds.length) await ds.getRepository(Booking).delete({ id: In(bookingIds) });
  if (vehicleIds.length) await ds.getRepository(Vehicle).delete({ id: In(vehicleIds) });
  await ds.getRepository(Customer).delete({ id: In(customerIds) });

  console.log(`  Da go ${customerIds.length} khach hang demo va du lieu di kem`);
}

/** Ghi chu noi bo cua tung khach demo — dung lam moc nhan dien khi xoa. */
function demoNotes(): string[] {
  return DEMO_CUSTOMERS.map((c) => `${DEMO_TAG} ${c.internalNote ?? ''}`.trim());
}

async function seedDemo(ds: DataSource): Promise<void> {
  console.log('Nap du lieu trinh dien AOYAMA Service...');

  const stores = await ds.getRepository(Store).find({ order: { sortOrder: 'ASC' } });
  const services = await ds.getRepository(Service).find({ order: { sortOrder: 'ASC' } });
  const parts = await ds.getRepository(Part).find();
  const admins = await ds.getRepository(AdminUser).find();

  if (stores.length === 0 || services.length === 0 || parts.length === 0) {
    throw new Error('Chua co du lieu nen. Chay `npm run seed` truoc.');
  }

  const { customers, vehicles } = await seedCustomers(ds);
  const bookings = await seedBookings(ds, { customers, vehicles, stores, services });
  await seedAiDiagnosis(ds, customers, bookings);
  const workOrders = await seedWorkOrders(ds, {
    bookings,
    vehicles,
    parts,
    services,
    admins,
  });
  await seedQuotations(ds, workOrders, admins);
  await seedPayments(ds, workOrders, admins);
  await seedServiceHistory(ds, workOrders, vehicles);
  await seedMaintenanceSchedules(ds, vehicles);
  await seedLowStock(ds, stores, parts);

  console.log('Hoan tat. Dang nhap quan tri: admin / Aoyama@2026');
}

async function seedCustomers(ds: DataSource) {
  const customerRepo = ds.getRepository(Customer);
  const vehicleRepo = ds.getRepository(Vehicle);

  const customers: Customer[] = [];
  const vehicles: Vehicle[] = [];

  for (const seed of DEMO_CUSTOMERS) {
    const customer = await customerRepo.save(
      customerRepo.create({
        phone: seed.phone,
        name: seed.name,
        nameKana: seed.nameKana ?? null,
        email: seed.email ?? null,
        address: seed.address ?? null,
        isGuest: seed.isGuest,
        language: seed.language,
        notifySms: true,
        notifyEmail: Boolean(seed.email),
        internalNote: `${DEMO_TAG} ${seed.internalNote ?? ''}`.trim(),
      }),
    );
    customers.push(customer);

    for (const v of seed.vehicles) {
      vehicles.push(
        await vehicleRepo.save(
          vehicleRepo.create({
            customerId: customer.id,
            plateNumber: v.plateNumber,
            maker: v.maker,
            model: v.model,
            modelYear: v.modelYear,
            engineCc: v.engineCc,
            color: v.color,
            fuelType: v.fuelType,
            nickname: v.nickname ?? null,
            currentOdometer: v.odometer,
            photoUrls: [],
          }),
        ),
      );
    }
  }

  console.log(`  Khach hang: ${customers.length}, phuong tien: ${vehicles.length}`);
  return { customers, vehicles };
}

interface BookingPlan {
  days: number;
  time: string;
  status: BookingStatus;
  customerIndex: number;
  serviceIndexes: number[];
  storeIndex: number;
  symptomIndex?: number;
}

/**
 * Lich hen trai tu 26 ngay truoc den 12 ngay sau. Ngay hom nay co du cac trang
 * thai dau luong de bang dieu khien va man hinh tiep nhan deu co viec de lam.
 */
function bookingPlans(): BookingPlan[] {
  const plans: BookingPlan[] = [];

  // Qua khu: da hoan tat, dung de dung lich su va doanh thu.
  const pastDays = [26, 22, 19, 16, 13, 11, 8, 6, 5, 4, 3, 2, 1];
  pastDays.forEach((d, i) => {
    plans.push({
      days: -d,
      time: ['09:00', '10:30', '13:00', '14:30', '16:00'][i % 5],
      status: BookingStatus.DONE,
      customerIndex: i % DEMO_CUSTOMERS.length,
      serviceIndexes: [i % 4, (i + 2) % 4].filter((v, k, a) => a.indexOf(v) === k),
      storeIndex: i % 3,
    });
  });

  // Hai lich bi huy va mot lan khach khong den — bao cao can co ca hai.
  plans.push({
    days: -9,
    time: '10:30',
    status: BookingStatus.CANCELLED,
    customerIndex: 4,
    serviceIndexes: [0],
    storeIndex: 0,
  });
  plans.push({
    days: -15,
    time: '14:30',
    status: BookingStatus.CANCELLED,
    customerIndex: 6,
    serviceIndexes: [1],
    storeIndex: 1,
  });
  plans.push({
    days: -7,
    time: '16:00',
    status: BookingStatus.NO_SHOW,
    customerIndex: 5,
    serviceIndexes: [2],
    storeIndex: 0,
  });

  // Hom qua: ba xe con o xuong, de "Xe dang o xuong" va "Cho thanh toan" khac 0.
  [
    { customerIndex: 4, time: '09:00' },
    { customerIndex: 5, time: '13:00' },
    { customerIndex: 6, time: '14:30' },
  ].forEach((row, i) => {
    plans.push({
      days: -1,
      time: row.time,
      status: BookingStatus.RECEIVED,
      customerIndex: row.customerIndex,
      serviceIndexes: [i % 4, (i + 1) % 4],
      storeIndex: 0,
      symptomIndex: (i + 1) % DEMO_SYMPTOMS.length,
    });
  });

  // Hom nay: mot cho xac nhan, hai da xac nhan, hai da tiep nhan.
  plans.push({
    days: 0,
    time: '09:00',
    status: BookingStatus.RECEIVED,
    customerIndex: 0,
    serviceIndexes: [2, 0],
    storeIndex: 0,
    symptomIndex: 0,
  });
  plans.push({
    days: 0,
    time: '10:30',
    status: BookingStatus.RECEIVED,
    customerIndex: 1,
    serviceIndexes: [0],
    storeIndex: 0,
    symptomIndex: 1,
  });
  plans.push({
    days: 0,
    time: '13:00',
    status: BookingStatus.CONFIRMED,
    customerIndex: 2,
    serviceIndexes: [1],
    storeIndex: 0,
    symptomIndex: 5,
  });
  plans.push({
    days: 0,
    time: '14:30',
    status: BookingStatus.CONFIRMED,
    customerIndex: 3,
    serviceIndexes: [0, 1],
    storeIndex: 0,
    symptomIndex: 2,
  });
  plans.push({
    days: 0,
    time: '16:00',
    status: BookingStatus.PENDING,
    customerIndex: 7,
    serviceIndexes: [2],
    storeIndex: 0,
    symptomIndex: 3,
  });

  // Sap toi: mot it cho xac nhan va da xac nhan.
  const futureDays = [1, 2, 3, 5, 7, 9, 12];
  futureDays.forEach((d, i) => {
    plans.push({
      days: d,
      time: ['09:00', '13:00', '10:30', '16:00'][i % 4],
      status: i % 3 === 0 ? BookingStatus.PENDING : BookingStatus.CONFIRMED,
      customerIndex: (i + 2) % DEMO_CUSTOMERS.length,
      serviceIndexes: [(i + 1) % 4],
      storeIndex: i % 3,
      symptomIndex: i % DEMO_SYMPTOMS.length,
    });
  });

  return plans;
}

async function seedBookings(
  ds: DataSource,
  ctx: { customers: Customer[]; vehicles: Vehicle[]; stores: Store[]; services: Service[] },
) {
  const bookingRepo = ds.getRepository(Booking);
  const lineRepo = ds.getRepository(BookingService);
  const historyRepo = ds.getRepository(BookingStatusHistory);

  const bookings: Booking[] = [];
  /** So thu tu lich hen theo tung khach — dung de dung ma B-YYYYMMDDHHMMXXX. */
  const seqByCustomer = new Map<string, number>();

  for (const plan of bookingPlans()) {
    const customer = ctx.customers[plan.customerIndex];
    const vehicle = ctx.vehicles.find((v) => v.customerId === customer.id) ?? null;
    const store = ctx.stores[plan.storeIndex % ctx.stores.length];
    const picked = plan.serviceIndexes.map((i) => ctx.services[i % ctx.services.length]);

    const scheduledAt = atJst(plan.days, plan.time);
    const [h, m] = plan.time.split(':').map(Number);
    const endMinutes = h * 60 + m + 90;
    const slotEnd = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(
      endMinutes % 60,
    ).padStart(2, '0')}:00`;

    const hasRepair = picked.some((s) => s.type === ServiceType.REPAIR);
    const hasMaintenance = picked.some((s) => s.type !== ServiceType.REPAIR);
    const serviceType =
      hasRepair && hasMaintenance
        ? BookingServiceType.BOTH
        : hasRepair
          ? BookingServiceType.REPAIR
          : BookingServiceType.MAINTENANCE;

    const confirmed = plan.status !== BookingStatus.PENDING;

    // Lich duoc "gui" ba ngay truoc gio hen — ma mang dung moc do.
    const submittedAt = new Date(scheduledAt.getTime() - 3 * 86_400_000);
    const seq = seqByCustomer.get(customer.id) ?? 0;
    seqByCustomer.set(customer.id, seq + 1);
    const bookingCode = formatBookingCode(submittedAt, seq);

    const booking = await bookingRepo.save(
      bookingRepo.create({
        code: bookingCode,
        customerId: customer.id,
        vehicleId: vehicle?.id ?? null,
        storeId: store.id,
        status: plan.status,
        serviceType,
        scheduledAt,
        slotStartTime: `${plan.time}:00`,
        slotEndTime: slotEnd,
        contactName: customer.name,
        contactPhone: customer.phone,
        contactEmail: customer.email,
        symptomDescription:
          plan.symptomIndex !== undefined ? DEMO_SYMPTOMS[plan.symptomIndex] : null,
        symptomPhotoUrls: [],
        createdByAdmin: plan.days < 0 && plan.customerIndex % 4 === 0,
        qrToken: confirmed ? generatePublicToken() : null,
        confirmedAt: confirmed ? new Date(scheduledAt.getTime() - 20 * 3_600_000) : null,
        receivedAt:
          plan.status === BookingStatus.RECEIVED || plan.status === BookingStatus.DONE
            ? new Date(scheduledAt.getTime() + 4 * 60_000)
            : null,
        completedAt:
          plan.status === BookingStatus.DONE
            ? new Date(scheduledAt.getTime() + 3 * 3_600_000)
            : null,
        cancelledAt:
          plan.status === BookingStatus.CANCELLED
            ? new Date(scheduledAt.getTime() - 26 * 3_600_000)
            : null,
        cancelReason: plan.status === BookingStatus.CANCELLED ? 'Khách bận đột xuất' : null,
        createdAt: submittedAt,
      }),
    );

    await lineRepo.insert(
      picked.map((service) => ({
        bookingId: booking.id,
        serviceId: service.id,
        serviceName: service.name.vi ?? service.name.ja ?? service.code,
        estimatedPrice: service.quoteOnly ? 0 : service.basePrice,
        estimatedMinutes: service.durationMinutes,
      })),
    );

    // Dong thoi gian cua SC-26 doc tu bang nay, nen phai ghi du cac buoc.
    const steps: { from: BookingStatus | null; to: BookingStatus; at: Date; note?: string }[] = [
      { from: null, to: BookingStatus.PENDING, at: new Date(scheduledAt.getTime() - 3 * 86_400_000), note: 'Đặt lịch qua website' },
    ];
    if (confirmed) {
      steps.push({
        from: BookingStatus.PENDING,
        to: BookingStatus.CONFIRMED,
        at: new Date(scheduledAt.getTime() - 20 * 3_600_000),
        note: 'Cửa hàng xác nhận và gửi mã QR',
      });
    }
    if (plan.status === BookingStatus.RECEIVED || plan.status === BookingStatus.DONE) {
      steps.push({
        from: BookingStatus.CONFIRMED,
        to: BookingStatus.RECEIVED,
        at: new Date(scheduledAt.getTime() + 4 * 60_000),
        note: 'Lễ tân tiếp nhận xe',
      });
    }
    if (plan.status === BookingStatus.DONE) {
      steps.push({
        from: BookingStatus.RECEIVED,
        to: BookingStatus.DONE,
        at: new Date(scheduledAt.getTime() + 3 * 3_600_000),
      });
    }
    if (plan.status === BookingStatus.CANCELLED) {
      steps.push({
        from: BookingStatus.CONFIRMED,
        to: BookingStatus.CANCELLED,
        at: new Date(scheduledAt.getTime() - 26 * 3_600_000),
        note: 'Khách bận đột xuất',
      });
    }
    if (plan.status === BookingStatus.NO_SHOW) {
      steps.push({
        from: BookingStatus.CONFIRMED,
        to: BookingStatus.NO_SHOW,
        at: new Date(scheduledAt.getTime() + 2 * 3_600_000),
      });
    }

    await historyRepo.insert(
      steps.map((step) => ({
        bookingId: booking.id,
        fromStatus: step.from,
        toStatus: step.to,
        action: 'STATUS_CHANGE',
        actorType: step.to === BookingStatus.PENDING ? 'CUSTOMER' : 'ADMIN',
        note: step.note ?? null,
        createdAt: step.at,
      })),
    );

    bookings.push(booking);
  }

  console.log(`  Lich hen: ${bookings.length} (qua khu, hom nay va sap toi)`);
  return bookings;
}

/** Mot phien chan doan AI gan vao lich hen dau tien cua hom nay. */
async function seedAiDiagnosis(ds: DataSource, customers: Customer[], bookings: Booking[]) {
  const today = jstDateString(0);
  const target = bookings.find(
    (b) => b.scheduledAt.toISOString().slice(0, 10) >= today && b.symptomDescription,
  );
  if (!target) return;

  const repo = ds.getRepository(AiDiagnosis);
  const saved = await repo.save(
    repo.create({
      customerId: target.customerId,
      sessionKey: `demo-${target.code}`,
      language: customers.find((c) => c.id === target.customerId)?.language,
      vehicleMaker: 'Honda',
      vehicleModel: 'Lead 125',
      serviceIntent: 'REPAIR',
      messages: DEMO_AI_MESSAGES.map((m) => ({ ...m, at: new Date().toISOString() })),
      findings: DEMO_AI_FINDINGS,
      summaryText: 'Nhiều khả năng má phanh trước đã mòn tới chân.',
      status: 'COMPLETED',
      modelName: 'demo',
      latencyMs: 1_240,
      bookingId: target.id,
    }),
  );

  await ds.getRepository(Booking).update(target.id, { aiDiagnosisId: saved.id });
  console.log('  Phien chan doan AI: 1 (gan vao lich hen hom nay)');
}

async function seedWorkOrders(
  ds: DataSource,
  ctx: {
    bookings: Booking[];
    vehicles: Vehicle[];
    parts: Part[];
    services: Service[];
    admins: AdminUser[];
  },
) {
  const repo = ds.getRepository(WorkOrder);
  const itemRepo = ds.getRepository(WorkOrderItem);
  const partRepo = ds.getRepository(WorkOrderPart);
  const historyRepo = ds.getRepository(WorkOrderStatusHistory);

  /**
   * Phieu con dang mo — trai deu cac trang thai giua luong, ke ca buoc da xong
   * nhung chua thu tien de the "Cho thanh toan" tren SA-02 khac 0.
   */
  const OPEN_FLOW = [
    WorkOrderStatus.IN_PROGRESS,
    WorkOrderStatus.QUOTED,
    WorkOrderStatus.COMPLETED,
    WorkOrderStatus.DIAGNOSING,
    WorkOrderStatus.COMPLETED,
  ];

  const candidates = ctx.bookings.filter(
    (b) => b.status === BookingStatus.DONE || b.status === BookingStatus.RECEIVED,
  );

  const workOrders: WorkOrder[] = [];
  let openIndex = 0;
  let seq = 0;

  for (const booking of candidates) {
    const vehicle = ctx.vehicles.find((v) => v.id === booking.vehicleId);
    if (!vehicle) continue;

    const delivered = booking.status === BookingStatus.DONE;
    const status = delivered ? WorkOrderStatus.DELIVERED : OPEN_FLOW[openIndex++ % OPEN_FLOW.length];
    const receivedAt = booking.receivedAt ?? booking.scheduledAt;

    seq += 1;
    const day = new Date(receivedAt.getTime() + TZ_OFFSET_HOURS * 3_600_000)
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '');

    // Hai hang muc cong viec va mot phu tung — du de bang tien co gi de tinh.
    const pickedServices = [
      ctx.services[seq % ctx.services.length],
      ctx.services[(seq + 1) % ctx.services.length],
    ].filter((s) => !s.quoteOnly);
    const usage = DEMO_PART_USAGE[seq % DEMO_PART_USAGE.length];
    const part = ctx.parts.find((p) => p.code === usage.code) ?? ctx.parts[0];

    const laborSubtotal = pickedServices.reduce((sum, s) => sum + s.basePrice, 0);
    const partsSubtotal = part.sellPrice * usage.quantity;
    const taxRate = 10;
    const taxAmount = Math.floor(((laborSubtotal + partsSubtotal) * taxRate) / 100);
    const totalAmount = laborSubtotal + partsSubtotal + taxAmount;

    const workOrder = await repo.save(
      repo.create({
        code: `WO-${day}-${String(seq).padStart(3, '0')}`,
        bookingId: booking.id,
        customerId: booking.customerId,
        vehicleId: vehicle.id,
        storeId: booking.storeId,
        status,
        paymentStatus: delivered ? PaymentStatus.PAID : PaymentStatus.UNPAID,
        intakeOdometer: Math.max(0, (vehicle.currentOdometer ?? 10_000) - seq * 120),
        intakeFuelLevel: [1, 2, 2, 3][seq % 4],
        intakeAccessories: seq % 3 === 0 ? 'mũ bảo hiểm, cốp sau' : null,
        intakeNote: seq % 4 === 0 ? 'Khách xin gọi trước khi thay phụ tùng.' : null,
        customerSymptom: booking.symptomDescription,
        diagnosisNote:
          status === WorkOrderStatus.DIAGNOSING
            ? null
            : 'Tiếng kim loại khi phanh gấp, hành trình phanh trước dài.',
        diagnosisCause:
          status === WorkOrderStatus.DIAGNOSING
            ? null
            : 'Má phanh trước mòn tới chân, đĩa phanh còn trong dung sai.',
        difficulty: [WorkDifficulty.EASY, WorkDifficulty.MEDIUM, WorkDifficulty.HARD][seq % 3],
        assignedTechnicianId: ctx.admins[seq % ctx.admins.length]?.id ?? null,
        receivedById: ctx.admins[0]?.id ?? null,
        progressPercent: delivered ? 100 : [65, 30, 10][seq % 3],
        progressNote: delivered ? null : 'Đang thay má phanh trước, dự kiến xong trong hôm nay.',
        estimatedCompletionAt: delivered
          ? null
          : new Date(receivedAt.getTime() + 5 * 3_600_000),
        laborSubtotal,
        partsSubtotal,
        discountAmount: 0,
        taxRate,
        taxAmount,
        totalAmount,
        paidAmount: delivered ? totalAmount : 0,
        completedAt:
          delivered || status === WorkOrderStatus.COMPLETED
            ? new Date(receivedAt.getTime() + 2.5 * 3_600_000)
            : null,
        deliveredAt: delivered ? new Date(receivedAt.getTime() + 3 * 3_600_000) : null,
        createdAt: receivedAt,
      }),
    );

    await itemRepo.insert(
      pickedServices.map((service, index) => ({
        workOrderId: workOrder.id,
        serviceId: service.id,
        name: service.name.vi ?? service.name.ja ?? service.code,
        unitPrice: service.basePrice,
        quantity: 1,
        laborMinutes: service.durationMinutes,
        suggestedByAi: index === 1,
        isDone: delivered,
        sortOrder: index,
      })),
    );

    await partRepo.insert({
      workOrderId: workOrder.id,
      partId: part.id,
      partName: part.name.vi ?? part.name.ja ?? part.code,
      partCode: part.code,
      unitPrice: part.sellPrice,
      quantity: usage.quantity,
      suggestedByAi: false,
    });

    const flow: WorkOrderStatus[] = [
      WorkOrderStatus.RECEIVED,
      WorkOrderStatus.DIAGNOSING,
      WorkOrderStatus.QUOTED,
      WorkOrderStatus.IN_PROGRESS,
      WorkOrderStatus.COMPLETED,
      WorkOrderStatus.DELIVERED,
    ];
    const upto = flow.indexOf(status);
    await historyRepo.insert(
      flow.slice(0, upto + 1).map((to, index) => ({
        workOrderId: workOrder.id,
        fromStatus: index === 0 ? null : flow[index - 1],
        toStatus: to,
        note: null,
        visibleToCustomer: true,
        createdAt: new Date(receivedAt.getTime() + index * 35 * 60_000),
      })),
    );

    workOrders.push(workOrder);
  }

  const open = workOrders.filter((w) => w.status !== WorkOrderStatus.DELIVERED).length;
  console.log(`  Phieu dich vu: ${workOrders.length} (dang mo ${open})`);
  return workOrders;
}

async function seedQuotations(ds: DataSource, workOrders: WorkOrder[], admins: AdminUser[]) {
  const repo = ds.getRepository(Quotation);
  const itemRepo = ds.getRepository(QuotationItem);

  let count = 0;
  for (const [index, workOrder] of workOrders.entries()) {
    // Chi lap bao gia cho phieu da qua buoc chan doan.
    if (workOrder.status === WorkOrderStatus.DIAGNOSING) continue;
    if (workOrder.status === WorkOrderStatus.RECEIVED) continue;

    const status =
      workOrder.status === WorkOrderStatus.QUOTED
        ? QuotationStatus.SENT
        : index % 9 === 4
          ? QuotationStatus.REJECTED
          : QuotationStatus.ACCEPTED;

    const subtotal = workOrder.laborSubtotal + workOrder.partsSubtotal;
    const sentAt = new Date(workOrder.createdAt.getTime() + 70 * 60_000);

    const quotation = await repo.save(
      repo.create({
        code: `QT-${workOrder.code.replace('WO-', '')}-01`,
        workOrderId: workOrder.id,
        customerId: workOrder.customerId,
        version: 1,
        status,
        publicToken: generatePublicToken(),
        subtotal,
        discountAmount: 0,
        taxRate: workOrder.taxRate,
        taxAmount: workOrder.taxAmount,
        totalAmount: workOrder.totalAmount,
        validUntil: jstDateString(7),
        depositAmount: index % 5 === 0 ? 3_000 : null,
        depositDueAt: index % 5 === 0 ? new Date(sentAt.getTime() + 4 * 3_600_000) : null,
        note: 'Đĩa phanh còn dùng được, chưa cần thay.',
        createdById: admins[0]?.id ?? null,
        sentAt,
        createdAt: sentAt,
      }),
    );

    await itemRepo.insert([
      {
        quotationId: quotation.id,
        kind: 'LABOR',
        name: 'Tiền công theo hạng mục đã chẩn đoán',
        unitPrice: workOrder.laborSubtotal,
        quantity: 1,
        lineTotal: workOrder.laborSubtotal,
        isOptional: false,
        isAccepted: status === QuotationStatus.ACCEPTED,
        suggestedByAi: false,
        sortOrder: 0,
      },
      {
        quotationId: quotation.id,
        kind: 'PART',
        name: 'Phụ tùng thay thế',
        unitPrice: workOrder.partsSubtotal,
        quantity: 1,
        lineTotal: workOrder.partsSubtotal,
        isOptional: false,
        isAccepted: status === QuotationStatus.ACCEPTED,
        suggestedByAi: true,
        sortOrder: 1,
      },
    ]);
    count += 1;
  }

  console.log(`  Bao gia: ${count}`);
}

/**
 * Thanh toan cua cac phieu da ban giao. Moc thu tien lay theo ngay ban giao nen
 * bieu do doanh thu 7 ngay cua SA-02 co du cot.
 */
async function seedPayments(ds: DataSource, workOrders: WorkOrder[], admins: AdminUser[]) {
  const repo = ds.getRepository(Payment);
  const delivered = workOrders.filter((w) => w.status === WorkOrderStatus.DELIVERED);

  const rows = delivered.map((workOrder, index) => ({
    workOrderId: workOrder.id,
    amount: workOrder.totalAmount,
    method: DEMO_PAYMENT_METHODS[index % DEMO_PAYMENT_METHODS.length],
    paidAt: workOrder.deliveredAt ?? workOrder.createdAt,
    receiptNo: `R-${String(index + 1).padStart(4, '0')}`,
    receivedById: admins[index % admins.length]?.id ?? null,
    note: null,
    isVoided: false,
  }));

  if (rows.length) await repo.insert(rows);
  console.log(`  Lan thu tien: ${rows.length}`);
}

async function seedServiceHistory(ds: DataSource, workOrders: WorkOrder[], vehicles: Vehicle[]) {
  const repo = ds.getRepository(ServiceHistory);
  const itemRepo = ds.getRepository(WorkOrderItem);

  const delivered = workOrders.filter((w) => w.status === WorkOrderStatus.DELIVERED);
  let count = 0;

  for (const workOrder of delivered) {
    const items = await itemRepo.find({ where: { workOrderId: workOrder.id } });
    const vehicle = vehicles.find((v) => v.id === workOrder.vehicleId);
    if (!vehicle) continue;

    await repo.insert({
      vehicleId: vehicle.id,
      workOrderId: workOrder.id,
      storeId: workOrder.storeId,
      servicedAt: workOrder.deliveredAt ?? workOrder.createdAt,
      type: count % 3 === 0 ? ServiceType.MAINTENANCE : ServiceType.REPAIR,
      // Tom tat phai ta viec da lam, giong cach onCompleted() dung o ban chay
      // that. Truoc day nhet ma phieu vao day nen man chi tiet lich hen hien
      // ra "WO-2026..." thay vi ten hang muc.
      summary: items.length
        ? items.map((i) => i.name).join(', ')
        : (workOrder.diagnosisNote ?? ''),
      detail: workOrder.diagnosisCause,
      odometer: workOrder.intakeOdometer,
      totalAmount: workOrder.totalAmount,
      itemNames: items.map((i) => i.name),
    });
    count += 1;
  }

  console.log(`  Lich su dich vu: ${count}`);
}

/** FR-VEH-07 — moc bao duong de xuat, de SC-29 va SA-20 co gi de hien. */
async function seedMaintenanceSchedules(ds: DataSource, vehicles: Vehicle[]) {
  const repo = ds.getRepository(MaintenanceSchedule);
  const rows = vehicles.map((vehicle, index) => ({
    vehicleId: vehicle.id,
    serviceId: null,
    dueDate: jstDateString(index % 3 === 0 ? 18 : 120 + index * 15),
    dueOdometer: (vehicle.currentOdometer ?? 10_000) + 3_000,
    aiConfidence: null,
    isNotified: false,
    isDone: false,
  }));
  if (rows.length) await repo.insert(rows);
  console.log(`  Moc bao duong de xuat: ${rows.length}`);
}

/** Ha ton kho hai mat hang xuong duoi nguong de canh bao tren SA-02 sang len. */
async function seedLowStock(ds: DataSource, stores: Store[], parts: Part[]) {
  const repo = ds.getRepository(Inventory);
  const store = stores[0];
  const targets = parts.slice(0, 2);

  for (const part of targets) {
    const row = await repo.findOne({ where: { storeId: store.id, partId: part.id } });
    if (row) await repo.update(row.id, { quantity: Math.max(0, row.minQuantity - 2) });
  }
  console.log(`  Ha ton kho duoi nguong: ${targets.length} mat hang`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

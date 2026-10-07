import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { AdminRole, InventoryTxType, Language } from 'src/common/enums';
import { AdminUser } from 'src/modules/admin-users/entities/admin-user.entity';
import { PriceRule } from 'src/modules/catalog/entities/price-rule.entity';
import { Service } from 'src/modules/catalog/entities/service.entity';
import { Faq } from 'src/modules/content/entities/faq.entity';
import { NotificationTemplate } from 'src/modules/notifications/entities/notification-template.entity';
import { Inventory } from 'src/modules/parts/entities/inventory.entity';
import { InventoryTransaction } from 'src/modules/parts/entities/inventory-transaction.entity';
import { Part } from 'src/modules/parts/entities/part.entity';
import { Store } from 'src/modules/stores/entities/store.entity';
import { StoreBusinessHour } from 'src/modules/stores/entities/store-business-hour.entity';
import { StoreHoliday } from 'src/modules/stores/entities/store-holiday.entity';
import { TimeSlot } from 'src/modules/stores/entities/time-slot.entity';
import { SystemSetting } from 'src/modules/system/entities/system-setting.entity';
import { SETTING_KEYS } from 'src/modules/system/settings.service';
import dataSource from '../data-source';
import { FAQS, NOTIFICATION_TEMPLATES, PARTS, SERVICES, STORES } from './seed-data';

/**
 * Nap du lieu khoi tao. Chay lai duoc nhieu lan: moi buoc deu kiem tra ton tai
 * truoc khi ghi, nen khong sinh ban trung.
 *
 *   npm run seed
 */
async function seed(ds: DataSource): Promise<void> {
  await seedSettings(ds);
  const stores = await seedStores(ds);
  await seedServices(ds);
  await seedParts(ds, stores);
  await seedTemplates(ds);
  await seedFaqs(ds);
  await seedAdminUsers(ds, stores);
}

async function seedSettings(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(SystemSetting);
  const defaults: {
    key: string;
    value: unknown;
    valueType: string;
    group: string;
    description: string;
  }[] = [
    {
      key: SETTING_KEYS.BOOKING_CANCEL_CUTOFF_HOURS,
      value: 2,
      valueType: 'NUMBER',
      group: 'booking',
      description: 'BR-04 — so gio toi thieu truoc gio hen khach con huy duoc',
    },
    {
      key: SETTING_KEYS.BOOKING_RESCHEDULE_CUTOFF_HOURS,
      value: 2,
      valueType: 'NUMBER',
      group: 'booking',
      description: 'BR-05 — so gio toi thieu truoc gio hen khach con doi lich duoc',
    },
    {
      key: SETTING_KEYS.BOOKING_MAX_ADVANCE_DAYS,
      value: 60,
      valueType: 'NUMBER',
      group: 'booking',
      description: 'BR-08 — so ngay toi da duoc dat truoc',
    },
    {
      key: SETTING_KEYS.BOOKING_REMINDER_HOURS_BEFORE,
      value: 12,
      valueType: 'NUMBER',
      group: 'booking',
      description: 'FR-NOT-03 — nhac lich truoc bao nhieu gio',
    },
    {
      key: SETTING_KEYS.BOOKING_NO_SHOW_AFTER_HOURS,
      value: 24,
      valueType: 'NUMBER',
      group: 'booking',
      description: 'BR-13 — sau bao nhieu gio thi danh dau khach khong den',
    },
    {
      key: SETTING_KEYS.BOOKING_REQUIRE_OTP_FOR_GUEST,
      value: false,
      valueType: 'BOOLEAN',
      group: 'booking',
      description: 'OQ-05 — Guest dat lich co phai xac thuc OTP khong',
    },
    {
      key: SETTING_KEYS.TAX_RATE_PERCENT,
      value: 10,
      valueType: 'NUMBER',
      group: 'pricing',
      description: 'Thue tieu thu ap dung cho bao gia va phieu dich vu',
    },
    {
      key: SETTING_KEYS.MAINTENANCE_DEFAULT_INTERVAL_MONTHS,
      value: 6,
      valueType: 'NUMBER',
      group: 'maintenance',
      description: 'AI-05 — chu ky bao duong mac dinh theo thang',
    },
    {
      key: SETTING_KEYS.MAINTENANCE_DEFAULT_INTERVAL_KM,
      value: 3000,
      valueType: 'NUMBER',
      group: 'maintenance',
      description: 'AI-05 — chu ky bao duong mac dinh theo km',
    },
    {
      key: SETTING_KEYS.MAINTENANCE_REMINDER_DAYS_BEFORE,
      value: 14,
      valueType: 'NUMBER',
      group: 'maintenance',
      description: 'FR-NOT-05 — nhac ky bao duong truoc bao nhieu ngay',
    },
    {
      key: SETTING_KEYS.AI_MEDIA_RETENTION_DAYS,
      value: 30,
      valueType: 'NUMBER',
      group: 'ai',
      description: 'RK-07 — so ngay luu anh va ghi am cua phien chan doan',
    },
    {
      key: SETTING_KEYS.MAINTENANCE_MODE,
      value: false,
      valueType: 'BOOLEAN',
      group: 'system',
      description: 'SY-04 — bat che do bao tri',
    },
  ];

  for (const row of defaults) {
    const existing = await repo.findOne({ where: { key: row.key } });
    if (!existing) await repo.save(repo.create(row));
  }
  console.log(`  Tham so he thong: ${defaults.length} khoa`);
}

/** Nghi thu Hai hang tuan. 0 = Chu nhat. */
const CLOSED_WEEKDAY = 1;

/** Sinh truoc bao nhieu thang ngay nghi dinh ky — xem secondAndFourthTuesdays. */
const HOLIDAY_MONTHS = 18;

/**
 * Khung gio nhan xe trong mot ngay.
 *
 * Bang hieu ghi "整備受付は閉店時間の30分前まで" — nhan sua cham nhat la
 * nua tieng truoc gio dong cua, nen khung cuoi phai ket thuc truoc moc
 * do. Nghi trua 12:00-13:00.
 */
function bookableSlots(closeTime: string): [string, string][] {
  const toMinutes = (hhmm: string): number => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };
  const toClock = (minutes: number): string =>
    `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

  const LENGTH = 90;
  const LUNCH_FROM = toMinutes('12:00');
  const LUNCH_TO = toMinutes('13:00');
  const lastEnd = toMinutes(closeTime) - 30;

  const slots: [string, string][] = [];
  for (let start = toMinutes('10:00'); start + LENGTH <= lastEnd; start += LENGTH) {
    const end = start + LENGTH;
    // Khung nao dam vao gio nghi trua thi bo, vong sau tu nhay qua.
    if (start < LUNCH_TO && end > LUNCH_FROM) {
      start = LUNCH_TO - LENGTH;
      continue;
    }
    slots.push([toClock(start), toClock(end)]);
  }
  return slots;
}

/**
 * Ngay thu Ba cua tuan thu hai va thu tu moi thang — ngay nghi dinh ky
 * cua ca sau cua hang.
 *
 * Bang store_holidays chi nhan ngay cu the, khong co khai niem lap lai,
 * nen phai sinh san ra. Het 18 thang phai sinh tiep; chua co viec dinh
 * ky nao lo chuyen do.
 */
function secondAndFourthTuesdays(months: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 0; i < months; i += 1) {
    const year = now.getFullYear();
    const month = now.getMonth() + i;
    let seen = 0;
    for (let day = 1; day <= 31; day += 1) {
      const date = new Date(year, month, day);
      if (date.getMonth() !== ((month % 12) + 12) % 12) break;
      if (date.getDay() !== 2) continue;
      seen += 1;
      if (seen === 2 || seen === 4) {
        out.push(
          `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
            date.getDate(),
          ).padStart(2, '0')}`,
        );
      }
    }
  }
  return out;
}

async function seedStores(ds: DataSource): Promise<Store[]> {
  const storeRepo = ds.getRepository(Store);
  const hourRepo = ds.getRepository(StoreBusinessHour);
  const slotRepo = ds.getRepository(TimeSlot);
  const holidayRepo = ds.getRepository(StoreHoliday);
  const result: Store[] = [];

  for (const seedStore of STORES) {
    let store = await storeRepo.findOne({ where: { code: seedStore.code } });
    if (!store) {
      store = await storeRepo.save(storeRepo.create(seedStore));
    }
    result.push(store);

    const hourCount = await hourRepo.count({ where: { storeId: store.id } });
    if (hourCount === 0) {
      // Nghi thu Hai hang tuan — ca sau cua hang deu vay.
      await hourRepo.save(
        [0, 1, 2, 3, 4, 5, 6].map((weekday) =>
          hourRepo.create({
            storeId: store!.id,
            weekday,
            isClosed: weekday === CLOSED_WEEKDAY,
            openTime: weekday === CLOSED_WEEKDAY ? null : seedStore.openTime,
            closeTime: weekday === CLOSED_WEEKDAY ? null : seedStore.closeTime,
          }),
        ),
      );
    }

    const slotCount = await slotRepo.count({ where: { storeId: store.id } });
    if (slotCount === 0) {
      const slots: Partial<TimeSlot>[] = [];
      for (const weekday of [0, 2, 3, 4, 5, 6]) {
        for (const [startTime, endTime] of bookableSlots(seedStore.closeTime)) {
          slots.push({
            storeId: store.id,
            weekday,
            startTime,
            endTime,
            capacity: seedStore.defaultCapacity,
          });
        }
      }
      await slotRepo.save(slots.map((s) => slotRepo.create(s)));
    }

    const holidayCount = await holidayRepo.count({ where: { storeId: store.id } });
    if (holidayCount === 0) {
      await holidayRepo.save(
        secondAndFourthTuesdays(HOLIDAY_MONTHS).map((date) =>
          holidayRepo.create({ storeId: store!.id, date, reason: '第二・第四火曜日' }),
        ),
      );
    }
  }

  console.log(`  Cua hang: ${result.length}, kem gio lam viec va khung gio`);
  return result;
}

async function seedServices(ds: DataSource): Promise<void> {
  const serviceRepo = ds.getRepository(Service);
  const priceRepo = ds.getRepository(PriceRule);

  for (const seedService of SERVICES) {
    let service = await serviceRepo.findOne({ where: { code: seedService.code } });
    if (!service) {
      service = await serviceRepo.save(serviceRepo.create(seedService));
    }

    if (seedService.quoteOnly) continue;

    const ruleCount = await priceRepo.count({ where: { serviceId: service.id } });
    if (ruleCount === 0) {
      // Ba phan khuc dung tich theo cach phan loai xe may pho thong tai Nhat.
      await priceRepo.save([
        priceRepo.create({
          serviceId: service.id,
          engineCcFrom: 0,
          engineCcTo: 125,
          price: seedService.basePrice,
          laborMinutes: seedService.durationMinutes,
        }),
        priceRepo.create({
          serviceId: service.id,
          engineCcFrom: 126,
          engineCcTo: 250,
          price: Math.round(seedService.basePrice * 1.3),
          laborMinutes: Math.round(seedService.durationMinutes * 1.2),
        }),
        priceRepo.create({
          serviceId: service.id,
          engineCcFrom: 251,
          engineCcTo: null,
          price: Math.round(seedService.basePrice * 1.6),
          laborMinutes: Math.round(seedService.durationMinutes * 1.4),
        }),
      ]);
    }
  }
  console.log(`  Dich vu: ${SERVICES.length}, kem quy tac gia theo dung tich`);
}

async function seedParts(ds: DataSource, stores: Store[]): Promise<void> {
  const partRepo = ds.getRepository(Part);
  const invRepo = ds.getRepository(Inventory);
  const txRepo = ds.getRepository(InventoryTransaction);

  for (const seedPart of PARTS) {
    let part = await partRepo.findOne({ where: { code: seedPart.code } });
    if (!part) {
      part = await partRepo.save(partRepo.create(seedPart));
    }

    for (const store of stores) {
      const existing = await invRepo.findOne({ where: { storeId: store.id, partId: part.id } });
      if (existing) continue;

      const quantity = 10;
      await invRepo.save(
        invRepo.create({ storeId: store.id, partId: part.id, quantity, minQuantity: 3 }),
      );
      await txRepo.save(
        txRepo.create({
          storeId: store.id,
          partId: part.id,
          type: InventoryTxType.IN,
          quantityChange: quantity,
          quantityAfter: quantity,
          unitCost: seedPart.costPrice,
          reason: 'Ton kho khoi tao',
        }),
      );
    }
  }
  console.log(`  Phu tung: ${PARTS.length}, kem ton kho khoi tao cho moi cua hang`);
}

async function seedTemplates(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(NotificationTemplate);
  let created = 0;
  for (const template of NOTIFICATION_TEMPLATES) {
    const existing = await repo.findOne({
      where: {
        event: template.event,
        channel: template.channel,
        language: template.language,
      },
    });
    if (!existing) {
      await repo.save(repo.create(template));
      created += 1;
    }
  }
  console.log(`  Mau thong bao: ${created} moi / ${NOTIFICATION_TEMPLATES.length} tong`);
}

async function seedFaqs(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(Faq);
  const count = await repo.count();
  if (count === 0) {
    await repo.save(FAQS.map((f) => repo.create(f)));
  }
  console.log(`  Cau hoi thuong gap: ${FAQS.length}`);
}

async function seedAdminUsers(ds: DataSource, stores: Store[]): Promise<void> {
  const repo = ds.getRepository(AdminUser);

  const accounts = [
    {
      username: 'admin',
      password: 'Aoyama@2026',
      fullName: 'Quan tri he thong',
      role: AdminRole.ADMIN,
      storeId: null as string | null,
      email: 'admin@aoyama-service.jp',
    },
    {
      username: 'staff.hamamatsu',
      password: 'Aoyama@2026',
      fullName: 'Le tan Hamamatsu',
      role: AdminRole.STAFF,
      storeId: stores[0]?.id ?? null,
      email: 'staff.hamamatsu@aoyama-service.jp',
    },
  ];

  for (const account of accounts) {
    const existing = await repo.findOne({ where: { username: account.username } });
    if (existing) continue;

    const { password, ...rest } = account;
    await repo.save(
      repo.create({
        ...rest,
        passwordHash: await bcrypt.hash(password, 12),
        language: Language.JA,
        // Du lieu mau nen khong ep doi mat khau, de thu nghiem nhanh.
        mustChangePassword: false,
      }),
    );
  }
  console.log('  Tai khoan quan tri: admin / staff.hamamatsu (mat khau Aoyama@2026)');
}

async function main(): Promise<void> {
  console.log('Nap du lieu khoi tao AOYAMA Service...');
  await dataSource.initialize();
  try {
    await seed(dataSource);
    console.log('Hoan tat.');
  } finally {
    await dataSource.destroy();
  }
}

void main().catch((error) => {
  console.error('Nap du lieu that bai:', error);
  process.exit(1);
});

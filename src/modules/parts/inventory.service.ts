import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PageDto, PaginationQueryDto } from 'src/common/dto';
import { InventoryTxType } from 'src/common/enums';
import { Inventory } from './entities/inventory.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';

export interface StockLine {
  partId: string;
  quantity: number;
}

/** M-11 (phan ton kho) — FR-PRT-09..13, BR-42. SA-28, SA-29. */
@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory) private readonly repo: Repository<Inventory>,
    @InjectRepository(InventoryTransaction)
    private readonly txRepo: Repository<InventoryTransaction>,
    private readonly dataSource: DataSource,
  ) {}

  /** SA-28 — ton kho theo cua hang, kem canh bao sap het. */
  async list(
    query: PaginationQueryDto & { storeId?: string; keyword?: string; lowStockOnly?: boolean },
  ): Promise<PageDto<Inventory>> {
    const qb = this.repo
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.part', 'p')
      .leftJoinAndSelect('i.store', 's');

    if (query.storeId) qb.andWhere('i.store_id = :storeId', { storeId: query.storeId });
    if (query.keyword) {
      qb.andWhere('(p.code ILIKE :kw OR p.name::text ILIKE :kw OR p.maker ILIKE :kw)', {
        kw: `%${query.keyword}%`,
      });
    }
    // FR-PRT-12 — loc rieng nhung dong da cham nguong canh bao.
    if (query.lowStockOnly) qb.andWhere('i.quantity <= i.min_quantity');

    const [items, total] = await qb
      .orderBy('p.code', 'ASC')
      .skip(query.skip)
      .take(query.limit)
      .getManyAndCount();
    return new PageDto(items, total, query);
  }

  async getOrCreate(storeId: string, partId: string): Promise<Inventory> {
    const existing = await this.repo.findOne({ where: { storeId, partId } });
    if (existing) return existing;
    return this.repo.save(this.repo.create({ storeId, partId, quantity: 0 }));
  }

  /**
   * SA-29 — nhap, xuat hoac dieu chinh kho thu cong.
   * Moi thay doi deu di kem mot dong bien dong de SA-38 truy nguoc duoc.
   */
  async adjust(input: {
    storeId: string;
    partId: string;
    type: InventoryTxType;
    quantity: number;
    unitCost?: number | null;
    reason?: string | null;
    performedById?: string | null;
    workOrderId?: string | null;
  }): Promise<Inventory> {
    // IN, OUT va RETURN luon nhan so duong; rieng ADJUST nhan chenh lech co dau.
    if (input.type === InventoryTxType.ADJUST ? input.quantity === 0 : input.quantity <= 0) {
      throw new BadRequestException({
        code: 'INVALID_QUANTITY',
        message: 'So luong khong hop le',
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const invRepo = manager.getRepository(Inventory);
      let inventory = await invRepo.findOne({
        where: { storeId: input.storeId, partId: input.partId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!inventory) {
        inventory = await invRepo.save(
          invRepo.create({ storeId: input.storeId, partId: input.partId, quantity: 0 }),
        );
      }

      const delta = signedDelta(input.type, input.quantity);
      const next = inventory.quantity + delta;
      // BR-42 — khong cho ton kho am.
      if (next < 0) {
        throw new BadRequestException({
          code: 'INSUFFICIENT_STOCK',
          message: 'Ton kho khong du de xuat',
          details: { available: inventory.quantity, requested: input.quantity },
        });
      }

      inventory.quantity = next;
      await invRepo.save(inventory);

      await manager.getRepository(InventoryTransaction).save(
        manager.getRepository(InventoryTransaction).create({
          storeId: input.storeId,
          partId: input.partId,
          type: input.type,
          quantityChange: delta,
          quantityAfter: next,
          unitCost: input.unitCost ?? null,
          reason: input.reason ?? null,
          performedById: input.performedById ?? null,
          workOrderId: input.workOrderId ?? null,
        }),
      );

      return inventory;
    });
  }

  /** BR-42 — tru kho khi phieu dich vu hoan tat. */
  async deductForWorkOrder(
    workOrderId: string,
    storeId: string,
    lines: StockLine[],
    performedById: string | null,
  ): Promise<void> {
    for (const line of lines) {
      await this.adjust({
        storeId,
        partId: line.partId,
        type: InventoryTxType.OUT,
        quantity: line.quantity,
        workOrderId,
        performedById,
        reason: 'Su dung cho phieu dich vu',
      });
    }
  }

  /** Hoan kho khi phieu bi huy sau khi da tru. */
  async returnForWorkOrder(workOrderId: string, performedById: string | null): Promise<void> {
    const outs = await this.txRepo.find({
      where: { workOrderId, type: InventoryTxType.OUT },
    });
    for (const tx of outs) {
      await this.adjust({
        storeId: tx.storeId,
        partId: tx.partId,
        type: InventoryTxType.RETURN,
        quantity: Math.abs(tx.quantityChange),
        workOrderId,
        performedById,
        reason: 'Hoan kho do huy phieu dich vu',
      });
    }
  }

  async listTransactions(
    query: PaginationQueryDto & { storeId?: string; partId?: string; type?: InventoryTxType },
  ): Promise<PageDto<InventoryTransaction>> {
    const qb = this.txRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.part', 'p')
      .leftJoinAndSelect('t.store', 's');

    if (query.storeId) qb.andWhere('t.store_id = :storeId', { storeId: query.storeId });
    if (query.partId) qb.andWhere('t.part_id = :partId', { partId: query.partId });
    if (query.type) qb.andWhere('t.type = :type', { type: query.type });

    const [items, total] = await qb
      .orderBy('t.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.limit)
      .getManyAndCount();
    return new PageDto(items, total, query);
  }

  async setMinQuantity(storeId: string, partId: string, minQuantity: number): Promise<Inventory> {
    const inventory = await this.getOrCreate(storeId, partId);
    inventory.minQuantity = minQuantity;
    return this.repo.save(inventory);
  }

  /** FR-PRT-12 — danh sach phu tung sap het, hien tren SA-02 va SA-38. */
  async findLowStock(storeId?: string): Promise<Inventory[]> {
    const qb = this.repo
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.part', 'p')
      .leftJoinAndSelect('i.store', 's')
      .where('i.quantity <= i.min_quantity')
      .andWhere('i.min_quantity > 0');
    if (storeId) qb.andWhere('i.store_id = :storeId', { storeId });
    return qb.orderBy('i.quantity', 'ASC').getMany();
  }
}

function signedDelta(type: InventoryTxType, quantity: number): number {
  switch (type) {
    case InventoryTxType.OUT:
      return -quantity;
    case InventoryTxType.IN:
    case InventoryTxType.RETURN:
      return quantity;
    case InventoryTxType.ADJUST:
    default:
      // Dieu chinh kiem ke duoc gui len duoi dang so luong chenh lech co dau.
      return quantity;
  }
}

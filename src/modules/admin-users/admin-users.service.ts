import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { PageDto, PaginationQueryDto } from 'src/common/dto';
import { AdminRole } from 'src/common/enums';
import { AdminUser } from './entities/admin-user.entity';

/** M-17 — Nguoi dung quan tri va phan quyen. SA-39, SA-40. */
@Injectable()
export class AdminUsersService {
  constructor(@InjectRepository(AdminUser) private readonly repo: Repository<AdminUser>) {}

  async findById(id: string): Promise<AdminUser> {
    const user = await this.repo.findOne({ where: { id }, relations: { store: true } });
    if (!user) {
      throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'Khong tim thay tai khoan' });
    }
    return user;
  }

  async search(
    query: PaginationQueryDto & { keyword?: string; role?: AdminRole; storeId?: string },
  ): Promise<PageDto<AdminUser>> {
    const qb = this.repo.createQueryBuilder('u').leftJoinAndSelect('u.store', 's');

    if (query.keyword) {
      qb.andWhere('(u.username ILIKE :kw OR u.full_name ILIKE :kw OR u.email ILIKE :kw)', {
        kw: `%${query.keyword}%`,
      });
    }
    if (query.role) qb.andWhere('u.role = :role', { role: query.role });
    if (query.storeId) qb.andWhere('u.store_id = :storeId', { storeId: query.storeId });

    const [items, total] = await qb
      .orderBy('u.username', 'ASC')
      .skip(query.skip)
      .take(query.limit)
      .getManyAndCount();
    return new PageDto(items, total, query);
  }

  async create(
    data: Partial<AdminUser> & { username: string; password: string; fullName: string },
  ): Promise<AdminUser> {
    const existing = await this.repo.findOne({
      where: { username: data.username.trim() },
      withDeleted: true,
    });
    if (existing) {
      throw new BadRequestException({
        code: 'USERNAME_TAKEN',
        message: 'Ten dang nhap da duoc su dung',
      });
    }

    const { password, ...rest } = data;
    return this.repo.save(
      this.repo.create({
        ...rest,
        username: data.username.trim(),
        passwordHash: await bcrypt.hash(password, 12),
        // Tai khoan do Admin tao phai doi mat khau o lan dang nhap dau — NFR-SE-02.
        mustChangePassword: true,
      }),
    );
  }

  async update(id: string, data: Partial<AdminUser> & { password?: string }): Promise<AdminUser> {
    await this.findById(id);
    const { password, ...rest } = data;

    if (password) {
      (rest as Partial<AdminUser>).passwordHash = await bcrypt.hash(password, 12);
      (rest as Partial<AdminUser>).mustChangePassword = true;
    }
    // Ten dang nhap la dinh danh on dinh trong nhat ky thao tac nen khong cho doi.
    delete (rest as Partial<AdminUser>).username;

    await this.repo.update(id, rest);
    return this.findById(id);
  }

  /**
   * FR-USR-05 — khoa tai khoan thay vi xoa, de nhat ky thao tac con truy nguoc duoc.
   * Khong cho khoa tai khoan Admin cuoi cung dang hoat dong.
   */
  async setActive(id: string, isActive: boolean): Promise<AdminUser> {
    if (!isActive) {
      const user = await this.findById(id);
      if (user.role === AdminRole.ADMIN) {
        const activeAdmins = await this.repo.count({
          where: { role: AdminRole.ADMIN, isActive: true },
        });
        if (activeAdmins <= 1) {
          throw new BadRequestException({
            code: 'LAST_ADMIN',
            message: 'Khong the khoa tai khoan quan tri cuoi cung',
          });
        }
      }
    }
    await this.repo.update(id, { isActive, failedLoginCount: 0, lockedUntil: null });
    return this.findById(id);
  }

  /** Go khoa thu cong khi tai khoan bi khoa do dang nhap sai nhieu lan. */
  async unlock(id: string): Promise<AdminUser> {
    await this.repo.update(id, { lockedUntil: null, failedLoginCount: 0 });
    return this.findById(id);
  }

  async resetPassword(id: string, newPassword: string): Promise<void> {
    await this.repo.update(id, {
      passwordHash: await bcrypt.hash(newPassword, 12),
      mustChangePassword: true,
    });
  }
}

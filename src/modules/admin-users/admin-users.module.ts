import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminUser } from './entities/admin-user.entity';

/** M-17 — Nguoi dung quan tri va phan quyen. */
@Module({
  imports: [TypeOrmModule.forFeature([AdminUser])],
  controllers: [AdminUsersController],
  providers: [AdminUsersService],
  exports: [AdminUsersService],
})
export class AdminUsersModule {}

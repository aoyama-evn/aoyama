import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUser } from 'src/modules/admin-users/entities/admin-user.entity';
import { CustomersModule } from 'src/modules/customers/customers.module';
import { Customer } from 'src/modules/customers/entities/customer.entity';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpCode } from './entities/otp-code.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { JwtStrategy } from './jwt.strategy';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';

/** M-01 — Xac thuc va tai khoan. */
@Module({
  imports: [
    TypeOrmModule.forFeature([OtpCode, RefreshToken, Customer, AdminUser]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('auth.jwtSecret'),
        signOptions: { expiresIn: config.get<string>('auth.jwtExpiresIn') },
      }),
    }),
    CustomersModule,
    NotificationsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpService, TokenService, JwtStrategy],
  exports: [AuthService, OtpService, TokenService],
})
export class AuthModule {}

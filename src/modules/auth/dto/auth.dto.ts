import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MinLength,
} from 'class-validator';
import { Language } from 'src/common/enums';

export class RequestOtpDto {
  @ApiProperty({ example: '090-1234-5678', description: 'So dien thoai, se duoc chuan hoa E.164' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiPropertyOptional({ enum: ['LOGIN', 'REGISTER'], default: 'LOGIN' })
  @IsOptional()
  @IsIn(['LOGIN', 'REGISTER'])
  purpose?: 'LOGIN' | 'REGISTER';

  @IsOptional()
  @IsEnum(Language)
  language?: Language;
}

export class VerifyOtpDto {
  @IsString() @IsNotEmpty() phone!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(4, 8)
  code!: string;

  @IsOptional() @IsIn(['LOGIN', 'REGISTER']) purpose?: 'LOGIN' | 'REGISTER';

  @ApiPropertyOptional({ description: 'Bat buoc voi luong dang ky — SC-17' })
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsEnum(Language) language?: Language;
}

export class AdminLoginDto {
  @IsString() @IsNotEmpty() username!: string;
  @IsString() @IsNotEmpty() password!: string;
}

export class ForgotPasswordDto {
  @IsEmail() email!: string;
}

export class ResetPasswordDto {
  @IsUUID('4') adminId!: string;
  @IsString() @IsNotEmpty() token!: string;

  @ApiProperty({ description: 'Mat khau moi, toi thieu 10 ky tu — NFR-SE-04' })
  @IsString()
  @MinLength(10)
  newPassword!: string;
}

export class RefreshTokenDto {
  @IsString() @IsNotEmpty() refreshToken!: string;
}

export class UpdateProfileDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() nameKana?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsEnum(Language) language?: Language;
  @IsOptional() @IsBoolean() notifySms?: boolean;
  @IsOptional() @IsBoolean() notifyEmail?: boolean;
}

export class ChangePasswordDto {
  @IsString() @IsNotEmpty() currentPassword!: string;

  @ApiProperty({ description: 'Toi thieu 8 ky tu — NFR-SE-02' })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}

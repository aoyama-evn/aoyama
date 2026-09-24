import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { IsNull, Repository } from 'typeorm';
import { AuthUser } from 'src/common/decorators';
import { UserRole } from 'src/common/enums';
import { RefreshToken } from './entities/refresh-token.entity';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

/**
 * Cap va thu hoi token — NFR-SE-03.
 * Refresh token duoc luu duoi dang bam, va bi thu hoi khi dung lai (xoay vong),
 * de token bi lo chi dung duoc mot lan.
 */
@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(RefreshToken) private readonly repo: Repository<RefreshToken>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async issue(payload: AuthUser, meta?: { userAgent?: string; ip?: string }): Promise<TokenPair> {
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('auth.jwtSecret'),
      expiresIn: this.config.get<string>('auth.jwtExpiresIn'),
    });

    const refreshToken = await this.jwt.signAsync(
      { sub: payload.sub, role: payload.role },
      {
        secret: this.config.get<string>('auth.refreshSecret'),
        expiresIn: this.config.get<string>('auth.refreshExpiresIn'),
      },
    );

    const decoded = this.jwt.decode(refreshToken) as { exp: number };
    await this.repo.save(
      this.repo.create({
        subjectId: payload.sub,
        subjectRole: payload.role,
        tokenHash: await bcrypt.hash(refreshToken, 10),
        expiresAt: new Date(decoded.exp * 1000),
        userAgent: meta?.userAgent ?? null,
        ipAddress: meta?.ip ?? null,
      }),
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.get<string>('auth.jwtExpiresIn', '30m'),
    };
  }

  /** Doi refresh token lay cap moi, dong thoi thu hoi token vua dung. */
  async rotate(refreshToken: string, rebuild: (subjectId: string) => Promise<AuthUser>): Promise<TokenPair> {
    let decoded: { sub: string; role: UserRole };
    try {
      decoded = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get<string>('auth.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_INVALID',
        message: 'Phien dang nhap khong con hieu luc',
      });
    }

    const candidates = await this.repo.find({
      where: { subjectId: decoded.sub, revokedAt: IsNull() },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    let matched: RefreshToken | undefined;
    for (const row of candidates) {
      if (await bcrypt.compare(refreshToken, row.tokenHash)) {
        matched = row;
        break;
      }
    }
    if (!matched || matched.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_INVALID',
        message: 'Phien dang nhap khong con hieu luc',
      });
    }

    matched.revokedAt = new Date();
    await this.repo.save(matched);

    return this.issue(await rebuild(decoded.sub));
  }

  /** Thu hoi toan bo phien cua mot chu the — dung khi doi mat khau hoac khoa tai khoan. */
  async revokeAll(subjectId: string): Promise<void> {
    await this.repo.update({ subjectId, revokedAt: IsNull() }, { revokedAt: new Date() });
  }

  async revokeOne(refreshToken: string): Promise<void> {
    let decoded: { sub: string };
    try {
      decoded = this.jwt.decode(refreshToken) as { sub: string };
    } catch {
      return;
    }
    if (!decoded?.sub) return;

    const candidates = await this.repo.find({
      where: { subjectId: decoded.sub, revokedAt: IsNull() },
      take: 20,
    });
    for (const row of candidates) {
      if (await bcrypt.compare(refreshToken, row.tokenHash)) {
        row.revokedAt = new Date();
        await this.repo.save(row);
        return;
      }
    }
  }
}

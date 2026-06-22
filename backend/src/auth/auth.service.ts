import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';
import { LoginDto } from './dto/login.dto';

export interface UserPayload {
  id: number;
  username: string;
  role: string;
}

interface TokenPayload {
  sub: number;
  username: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async validateUser(username: string, password: string): Promise<UserPayload | null> {
    const user = await this.usersService.findByUsername(username);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _, ...result } = user;
      return result as unknown as UserPayload;
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string; user: UserPayload }> {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('用户名或密码不正确');
    }

    const payload: TokenPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload);
    return { access_token, user };
  }

  async logout(token: string): Promise<void> {
    const parts = token.split('.');
    if (parts.length !== 3) return;
    const signature = parts[2];

    try {
      const decoded = this.jwtService.decode(token) as any;
      const ttl = decoded.exp ? Math.max(0, decoded.exp - Math.floor(Date.now() / 1000)) : 86400;
      if (ttl > 0) {
        await this.redisService.addToBlacklist(signature, ttl);
      }
    } catch {
      // ignore decode errors for blacklist cleanup
    }
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    const parts = token.split('.');
    if (parts.length === 3) {
      const blacklisted = await this.redisService.isBlacklisted(parts[2]);
      if (blacklisted) {
        throw new UnauthorizedException('Token 已失效，请重新登录');
      }
    }
    try {
      return this.jwtService.verify<TokenPayload>(token);
    } catch {
      throw new UnauthorizedException('Token 无效或已过期');
    }
  }
}

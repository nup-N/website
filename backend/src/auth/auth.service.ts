import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

interface UserPayload {
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
  ) {}

  async validateUser(username: string, password: string): Promise<UserPayload | null> {
    const user = await this.usersService.findByUsername(username);

    if (user && await bcrypt.compare(password, user.password)) {
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

    return {
      access_token,
      user,
    };
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      return this.jwtService.verify<TokenPayload>(token);
    } catch (error) {
      throw new UnauthorizedException('Token 无效或已过期');
    }
  }
}

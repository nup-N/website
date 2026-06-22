import { Body, Controller, Post, Get, UseGuards, Request, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import type { Request as ExpressRequest } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return this.authService.login({
      username: user.username,
      password: createUserDto.password,
    });
  }

  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('validate')
  async validateToken(@Req() req: ExpressRequest) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { valid: false, message: '未提供有效的认证令牌' };
    }
    try {
      const token = authHeader.substring(7);
      const user = await this.authService.verifyToken(token);
      return {
        valid: true,
        user: {
          id: user.sub,
          username: user.username,
          role: user.role || 'user',
        },
      };
    } catch (error) {
      return { valid: false, message: 'Token 无效或已过期' };
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: ExpressRequest) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      await this.authService.logout(token);
    }
    return { message: '已成功登出' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Request() req) {
    return {
      id: req.user.userId || req.user.sub,
      username: req.user.username,
      role: req.user.role,
    };
  }
}

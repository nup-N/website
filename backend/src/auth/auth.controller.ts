import { Body, Controller, Post, Get, UseGuards, Request, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import type { Request as ExpressRequest } from 'express';

/**
 * 认证控制器
 * 
 * 提供用户认证相关的API端点，包括登录、令牌验证等
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * 用户注册
   * 
   * 创建新用户账号并自动登录，返回JWT访问令牌
   * 
   * @param createUserDto 用户注册数据
   * @returns 包含访问令牌和用户信息的对象
   */
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    // 创建用户
    const user = await this.usersService.create(createUserDto);
    
    // 自动登录，复用login逻辑
    return this.authService.login({
      username: user.username,
      password: createUserDto.password,
    });
  }

  /**
   * 用户登录
   * 
   * 验证用户凭据并返回JWT访问令牌
   * 
   * @param loginDto 登录数据传输对象
   * @returns 包含访问令牌和用户信息的对象
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * 验证 Token（通过 Authorization Header）
   * 
   * 验证请求头中的 JWT Token 是否有效（供其他系统调用）
   * 使用标准的 Authorization header，符合 RESTful 设计
   * 
   * @param req 请求对象（包含 Authorization header）
   * @returns Token 验证结果和用户信息（包含角色）
   */
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

  /**
   * 用户登出
   *
   * 验证 Token 并返回成功（客户端负责清除 Token）
   *
   * @param req 请求对象
   * @returns 登出结果
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req) {
    return {
      message: '已成功登出',
    };
  }

  /**
   * 获取当前用户信息
   *
   * 需要携带有效的 JWT Token
   *
   * @param req 请求对象（包含用户信息）
   * @returns 当前登录用户的信息
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Request() req) {
    return {
      id: req.user.userId || req.user.sub,
      username: req.user.username,
      role: req.user.role // 返回用户角色
    };
  }
}

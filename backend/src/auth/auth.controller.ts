import { Body, Controller, Post, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { JwtService } from '@nestjs/jwt';

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
    private readonly jwtService: JwtService,
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
    
    // 自动登录，生成JWT令牌
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role || 'user',
    };
    
    const access_token = this.jwtService.sign(payload);
    
    return {
      access_token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
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
   * 验证 Token（通过 Body）
   * 
   * 验证 JWT Token 是否有效（供其他系统调用）
   * 
   * @param token JWT Token
   * @returns Token 验证结果和用户信息
   */
  @Post('verify')
  async verifyToken(@Body('token') token: string) {
    try {
      const user = await this.authService.verifyToken(token);
      return {
        valid: true,
        user
      };
    } catch (error) {
      return {
        valid: false,
        message: error.message
      };
    }
  }

  /**
   * 验证 Token（通过 Authorization Header）
   * 
   * 验证请求头中的 JWT Token 是否有效（供其他系统调用）
   * 更符合 RESTful 设计，使用标准的 Authorization header
   * 
   * @param req 请求对象（包含 Authorization header）
   * @returns Token 验证结果和用户信息（包含角色）
   */
  @Post('validate')
  async validateToken(@Request() req) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          valid: false,
          message: '未提供有效的认证令牌'
        };
      }

      const token = authHeader.substring(7);
      const user = await this.authService.verifyToken(token);
      
      return {
        valid: true,
        user: {
          id: user.sub || user.id,
          username: user.username,
          role: user.role || 'user' // 返回用户角色
        }
      };
    } catch (error) {
      return {
        valid: false,
        message: error.message || 'Token 验证失败'
      };
    }
  }

  /**
   * 获取当前用户信息（新增）👈
   * 
   * 需要携带有效的 JWT Token
   * 
   * @param req 请求对象（包含用户信息）
   * @returns 当前登录用户的信息
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Request() req) {
    return {
      id: req.user.userId || req.user.sub,
      username: req.user.username,
      role: req.user.role // 返回用户角色
    };
  }
}

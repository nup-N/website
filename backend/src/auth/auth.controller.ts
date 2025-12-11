import { Body, Controller, Post, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * 认证控制器
 * 
 * 提供用户认证相关的API端点，包括登录、令牌验证等
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
   * 验证 Token（新增）👈
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
      id: req.user.sub,
      username: req.user.username
    };
  }
}

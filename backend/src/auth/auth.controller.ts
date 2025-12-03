import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

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
}
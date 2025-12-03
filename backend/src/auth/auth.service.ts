import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 验证用户
   * 
   * 根据用户名和密码验证用户身份
   * 
   * @param username 用户名
   * @param password 密码
   * @returns 验证成功返回用户信息（不含密码），失败返回null
   */
  async validateUser(username: string, password: string): Promise<any> {
    // 根据用户名查找用户（包含密码字段）
    const user = await this.usersService.findByUsername(username);
    
    // 如果用户存在且密码匹配
    if (user && await bcrypt.compare(password, user.password)) {
      // 返回用户信息（不含密码）
      const { password, ...result } = user;
      return result;
    }
    
    // 验证失败返回null
    return null;
  }

  /**
   * 用户登录
   * 
   * 验证用户凭据并生成JWT访问令牌
   * 
   * @param loginDto 登录数据传输对象
   * @returns 包含访问令牌和用户信息的对象
   * @throws UnauthorizedException 当用户凭据无效时
   */
  async login(loginDto: LoginDto): Promise<{ access_token: string; user: any }> {
    // 验证用户凭据
    const user = await this.validateUser(loginDto.username, loginDto.password);
    
    // 如果验证失败，抛出未授权异常
    if (!user) {
      throw new UnauthorizedException('用户名或密码不正确');
    }
    
    // 创建JWT载荷
    const payload = {
      sub: user.id,
      username: user.username,
    };
    
    // 生成JWT访问令牌
    const access_token = this.jwtService.sign(payload);
    
    // 返回访问令牌和用户信息
    return {
      access_token,
      user,
    };
  }
}
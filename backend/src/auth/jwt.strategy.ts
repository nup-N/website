import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

/**
 * JWT策略
 * 
 * 用于验证请求中的JWT令牌并提取用户信息
 * 继承自PassportStrategy，使用passport-jwt的Strategy
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * 构造函数
   * 
   * 注入ConfigService并配置JWT策略
   * 
   * @param configService 配置服务，用于获取JWT密钥
   */
  constructor(private readonly configService: ConfigService) {
    super({
      // 从请求的Authorization头部提取Bearer令牌
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      
      // 不忽略令牌过期时间，过期的令牌将被拒绝
      ignoreExpiration: false,
      
      // 从环境变量获取JWT密钥
      // 警告：实际生产环境必须设置JWT_SECRET环境变量，默认值仅用于开发
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret-key',
    });
  }

  /**
   * 验证JWT载荷
   * 
   * 当JWT令牌验证通过后，此方法将被调用
   * 返回的对象将被添加到请求对象中，可通过req.user访问
   * 
   * @param payload JWT令牌的载荷部分
   * @returns 包含用户ID、用户名和角色的对象
   */
  async validate(payload: { sub: number; username: string; role?: string }): Promise<{ userId: number; username: string; role?: string }> {
    // 从JWT载荷中提取用户信息（包含角色）
    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role, // 包含用户角色
    };
  }
}
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';

/**
 * 认证模块
 * 
 * 负责用户认证相关功能，包括登录、JWT令牌生成和验证等
 * 集成了JWT和用户模块，提供完整的认证解决方案
 */
@Module({
  imports: [
    // 导入用户模块，用于用户信息查询和验证
    UsersModule,
    
    // 导入配置模块，用于获取环境变量
    ConfigModule,
    
    // 导入JWT模块，用于生成和验证令牌
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        // 从环境变量获取JWT密钥
        secret: configService.get<string>('JWT_SECRET'),
        // 从环境变量获取JWT过期时间
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN') || '7d',
        },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtStrategy], // 导出AuthService和JwtStrategy以便其他模块使用
})
export class AuthModule {}
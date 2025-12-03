import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT认证守卫
 * 
 * 用于保护需要认证的路由，验证请求中的JWT令牌
 * 继承自Passport的AuthGuard，使用'jwt'策略
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * 判断请求是否可以访问受保护的路由
   * 
   * 可以在此方法中添加自定义的认证逻辑
   * 
   * @param context 执行上下文，包含请求和响应对象
   * @returns 如果认证成功返回true，否则返回false或抛出异常
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 调用父类的canActivate方法进行JWT验证
    // 如果JWT无效或不存在，会在handleRequest中处理
    return (await super.canActivate(context)) as boolean;
  }

  /**
   * 处理认证结果
   * 
   * 自定义认证成功和失败的处理逻辑
   * 
   * @param err 认证过程中的错误
   * @param user 认证成功后的用户信息
   * @param info 额外的认证信息
   * @returns 认证成功返回用户信息，失败抛出UnauthorizedException
   */
  handleRequest<TUser = any>(err: any, user: any, info: any): TUser {
    // 如果认证过程中有错误，或者用户信息不存在，则认证失败
    if (err || !user) {
      throw new UnauthorizedException('未授权访问，请先登录');
    }
    
    // 认证成功，返回用户信息
    return user;
  }
}
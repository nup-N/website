import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('未登录');
    }

    // 等级越高的角色拥有低等级的所有权限
    const roleHierarchy: Record<string, number> = {
      guest: 0,
      user: 1,
      premium: 2,
      admin: 3,
      super_admin: 4,
    };

    const userLevel = roleHierarchy[user.role] ?? -1;
    const requiredLevel = Math.min(
      ...requiredRoles.map((r) => roleHierarchy[r] ?? -1),
    );

    if (userLevel < requiredLevel) {
      throw new ForbiddenException('权限不足');
    }

    return true;
  }
}

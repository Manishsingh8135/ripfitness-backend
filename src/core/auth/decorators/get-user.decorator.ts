import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole, UserPermission } from '../../users/schemas/user.schema';

export interface JwtUser {
  userId: string;
  email: string;
  role: UserRole;
  permissions: UserPermission[];
}

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

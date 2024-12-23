import { SetMetadata } from '@nestjs/common';
import { UserPermission } from '../../users/schemas/user.schema';

export const PERMISSIONS_KEY = 'permissions';
// Changed to accept array of permissions
export const RequirePermissions = (permissions: UserPermission[]) => 
  SetMetadata(PERMISSIONS_KEY, permissions);

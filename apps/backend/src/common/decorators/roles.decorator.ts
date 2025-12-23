import { SetMetadata } from '@nestjs/common';
import { Role } from '../../modules/auth/role.enum';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);

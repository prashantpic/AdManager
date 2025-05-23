import { Expose, Type } from 'class-transformer';
import { RoleDto } from '../../rbac/dto/role.dto'; // Assuming RoleDto exists

export class UserDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  isActive: boolean;

  @Expose()
  @Type(() => RoleDto) // For transforming nested RoleEntity to RoleDto
  roles: RoleDto[];

  @Expose()
  isMfaEnabled: boolean;

  @Expose()
  createdAt: Date;

  // Do not expose sensitive fields like passwordHash, passwordHistory, lockoutUntil, etc.
}
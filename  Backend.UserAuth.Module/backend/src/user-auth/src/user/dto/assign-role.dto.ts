import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class AssignRoleDto {
  // This DTO is for the request body when assigning roles to a user.
  // The userId is typically part of the URL path (e.g., /admin/users/:userId/roles)
  // So, it might not be needed in the DTO body itself if taken from params.
  // However, SDS lists it in properties, implying it could be in body.
  // For consistency with `UpdateRoleDto` having `permissionIds`, we'll assume `roleIds` in body.

  // @IsNotEmpty()
  // @IsUUID()
  // userId: string; // If this DTO is used for a generic service method.
                    // For controller, userId is often a @Param.

  @IsArray()
  @IsNotEmpty({ message: 'Role IDs array cannot be empty.' }) // Or allow empty to remove all roles
  @IsUUID('all', { each: true, message: 'Each role ID must be a valid UUID.' })
  roleIds: string[];
}
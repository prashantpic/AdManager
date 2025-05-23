import { Expose } from 'class-transformer';

export class PermissionDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  resource?: string;

  @Expose()
  action?: string;
  
  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
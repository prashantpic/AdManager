import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PermissionEntity } from '../entities/permission.entity';

@Injectable()
export class PermissionRepository extends Repository<PermissionEntity> {
  constructor(
    @InjectRepository(PermissionEntity)
    private readonly repository: Repository<PermissionEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findByName(name: string): Promise<PermissionEntity | null> {
    return this.repository.findOneBy({ name });
  }

  async findByIds(ids: string[]): Promise<PermissionEntity[]> {
    if (!ids || ids.length === 0) {
        return [];
    }
    return this.repository.find({ where: { id: In(ids) } });
  }
}
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RoleEntity } from '../entities/role.entity';

@Injectable()
export class RoleRepository extends Repository<RoleEntity> {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly repository: Repository<RoleEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findByName(name: string): Promise<RoleEntity | null> {
    return this.repository.findOne({ where: { name }, relations: ['permissions'] });
  }

  async findByIds(ids: string[]): Promise<RoleEntity[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    return this.repository.find({ 
        where: { id: In(ids) },
        relations: ['permissions'] 
    });
  }

  async findAllWithPermissions(): Promise<RoleEntity[]> {
    return this.repository.find({ relations: ['permissions'] });
  }
}
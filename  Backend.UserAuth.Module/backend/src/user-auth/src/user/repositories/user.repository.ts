import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { UserAuthConfigService } from '../../config/user-auth.config';

@Injectable()
export class UserRepository extends Repository<UserEntity> {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
    private readonly userAuthConfigService: UserAuthConfigService,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.repository.findOne({ where: { email } });
  }
  
  async findByEmailWithPassword(email?: string, userId?: string): Promise<UserEntity | null> {
    if (!email && !userId) {
        throw new Error('Either email or userId must be provided');
    }
    
    const queryBuilder = this.repository.createQueryBuilder('user')
        .select([
            'user.id', 
            'user.email', 
            'user.passwordHash', 
            'user.firstName', 
            'user.lastName', 
            'user.isActive', 
            'user.failedLoginAttempts', 
            'user.lockoutUntil', 
            'user.isMfaEnabled',
            'user.passwordResetToken',
            'user.passwordResetExpires',
            // 'user.mfaSecret' // If mfaSecret is on UserEntity and selected
        ]);

    if (userId) {
        queryBuilder.where('user.id = :id', { id: userId });
    } else if (email) {
        queryBuilder.where('user.email = :email', { email });
    }
        
    return queryBuilder.getOne();
  }

  async findByIdWithRoles(id: string): Promise<UserEntity | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions'], // Eagerly load roles and their permissions
    });
  }

  async updatePasswordHistory(userId: string, newPasswordHash: string): Promise<void> {
    const user = await this.repository.findOneBy({ id: userId });
    if (!user) return;

    const historySize = this.userAuthConfigService.getPasswordHistoryCount();
    let history = user.passwordHistory || [];
    
    history.unshift(newPasswordHash); // Add new hash to the beginning
    history = history.slice(0, historySize); // Keep only the N most recent

    await this.repository.update({ id: userId }, { passwordHistory: history });
  }

  async updateLockoutStatus(userId: string, failedAttempts: number, lockoutUntil: Date | null): Promise<void> {
    await this.repository.update(
      { id: userId },
      { failedLoginAttempts, lockoutUntil },
    );
  }

  // You can add more custom methods here as needed, e.g.,
  // async findActiveUsersWithRole(roleName: string): Promise<UserEntity[]> { ... }
}
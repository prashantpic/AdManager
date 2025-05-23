import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditService } from '../../audit/audit.service'; // Assuming AuditService exists
import { UserEntity } from '../entities/user.entity';
// Define event payload interfaces for type safety if possible
// e.g. export interface UserLoginSuccessPayload { userId: string; ipAddress: string; }

@Injectable()
export class UserActivityListener {
  private readonly logger = new Logger(UserActivityListener.name);

  constructor(private readonly auditService: AuditService) {}

  @OnEvent('user.registered')
  async handleUserRegisteredEvent(payload: { user: UserEntity; ipAddress?: string }) {
    this.logger.log(`User registered: ${payload.user.email}`);
    await this.auditService.logEvent(
      payload.user.id,
      'USER_REGISTERED',
      payload.ipAddress || null,
      { email: payload.user.email, firstName: payload.user.firstName },
      true,
    );
  }

  @OnEvent('user.loggedIn')
  async handleUserLoggedInEvent(payload: { userId: string; email: string; ipAddress?: string; mfaUsed?: boolean }) {
    this.logger.log(`User logged in: ${payload.email}`);
    await this.auditService.logEvent(
      payload.userId,
      'USER_LOGIN_SUCCESS',
      payload.ipAddress || null,
      { email: payload.email, mfaUsed: payload.mfaUsed || false },
      true,
    );
  }

  @OnEvent('user.loginFailed')
  async handleUserLoginFailedEvent(payload: { emailAttempted: string; reason: string; ipAddress?: string; userId?: string }) {
    this.logger.warn(`User login failed for: ${payload.emailAttempted}, Reason: ${payload.reason}`);
    await this.auditService.logEvent(
      payload.userId || null, // userId might be known if account exists but password wrong
      'USER_LOGIN_FAILURE',
      payload.ipAddress || null,
      { emailAttempted: payload.emailAttempted, reason: payload.reason },
      false,
    );
  }

  @OnEvent('user.passwordChanged')
  async handleUserPasswordChangedEvent(payload: { userId: string; ipAddress?: string }) {
    this.logger.log(`Password changed for user ID: ${payload.userId}`);
    await this.auditService.logEvent(
      payload.userId,
      'USER_PASSWORD_CHANGED',
      payload.ipAddress || null,
      {},
      true,
    );
  }
  
  @OnEvent('user.passwordResetRequested')
  async handlePasswordResetRequestedEvent(payload: { userId?: string; email: string; ipAddress?: string }) {
    this.logger.log(`Password reset requested for email: ${payload.email}`);
    await this.auditService.logEvent(
      payload.userId || null, // userId might be null if only email is known at request time
      'USER_PASSWORD_RESET_REQUESTED',
      payload.ipAddress || null,
      { email: payload.email },
      true, // The request itself is a success
    );
  }

  @OnEvent('user.passwordResetCompleted')
  async handlePasswordResetCompletedEvent(payload: { userId: string; ipAddress?: string }) {
    this.logger.log(`Password reset completed for user ID: ${payload.userId}`);
    await this.auditService.logEvent(
      payload.userId,
      'USER_PASSWORD_RESET_COMPLETED',
      payload.ipAddress || null,
      {},
      true,
    );
  }

  @OnEvent('user.rolesAssigned')
  async handleUserRolesAssignedEvent(payload: { adminUserId: string; targetUserId: string; roles: string[]; ipAddress?: string }) {
    this.logger.log(`Roles assigned to user ID: ${payload.targetUserId} by admin ID: ${payload.adminUserId}`);
    await this.auditService.logEvent(
      payload.adminUserId, // Action performed by admin
      'USER_ROLES_ASSIGNED',
      payload.ipAddress || null,
      { targetUserId: payload.targetUserId, rolesAssigned: payload.roles },
      true,
    );
  }
  
  @OnEvent('user.mfaEnabled')
  async handleMfaEnabledEvent(payload: { userId: string; ipAddress?: string }) {
    this.logger.log(`MFA enabled for user ID: ${payload.userId}`);
    await this.auditService.logEvent(
      payload.userId,
      'USER_MFA_ENABLED',
      payload.ipAddress || null,
      {},
      true,
    );
  }

  @OnEvent('user.mfaDisabled')
  async handleMfaDisabledEvent(payload: { userId: string; ipAddress?: string }) {
    this.logger.log(`MFA disabled for user ID: ${payload.userId}`);
    await this.auditService.logEvent(
      payload.userId,
      'USER_MFA_DISABLED',
      payload.ipAddress || null,
      {},
      true,
    );
  }
  
  @OnEvent('user.accountLocked')
  async handleAccountLockedEvent(payload: { userId: string; ipAddress?: string; reason?: string }) {
    this.logger.warn(`Account locked for user ID: ${payload.userId}`);
    await this.auditService.logEvent(
      payload.userId,
      'USER_ACCOUNT_LOCKED',
      payload.ipAddress || null,
      { reason: payload.reason || 'Too many failed login attempts' },
      true, // The locking action was successful
    );
  }

  @OnEvent('user.accountUnlocked')
  async handleAccountUnlockedEvent(payload: { userId: string; adminUserId?: string; ipAddress?: string; reason?: string }) {
    this.logger.log(`Account unlocked for user ID: ${payload.userId}`);
    await this.auditService.logEvent(
      payload.adminUserId || payload.userId, // If admin unlocked it, log admin. If system auto-unlocked, log user context.
      'USER_ACCOUNT_UNLOCKED',
      payload.ipAddress || null,
      { targetUserId: payload.userId, reason: payload.reason || (payload.adminUserId ? 'Manual unlock by admin' : 'Automatic unlock') },
      true,
    );
  }
}
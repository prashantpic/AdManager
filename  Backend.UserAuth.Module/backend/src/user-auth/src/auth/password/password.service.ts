import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserService } from '../../user/user.service';
import { UserAuthConfigService } from '../../config/user-auth.config';
import { UserRepository } from '../../user/repositories/user.repository';
import { UserEntity } from '../../user/entities/user.entity';
import { PasswordPolicyValidator } from './password-policy.validator'; // Assuming this will be created in password.module.ts
// import { NotificationService } from '../../notification/notification.service'; // Placeholder
import { randomBytes, createHash } from 'crypto';

// Placeholder for NotificationService
@Injectable()
export class NotificationService {
  async sendPasswordResetEmail(email: string, token: string, name: string): Promise<void> {
    console.log(`Mock Email to ${email} with token ${token} for user ${name}`);
    // Actual implementation would use SES or similar
  }
}


@Injectable()
export class PasswordService {
  constructor(
    @Inject(forwardRef(() => UserService)) // Resolve circular dependency
    private readonly userService: UserService,
    private readonly userAuthConfigService: UserAuthConfigService,
    private readonly userRepository: UserRepository,
    private readonly notificationService: NotificationService, // Assuming this is provided by a NotificationModule
    private readonly passwordPolicyValidator: PasswordPolicyValidator,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10; // Configurable?
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  validatePasswordPolicy(password: string): string | null {
    // This method might directly use UserAuthConfigService or delegate to PasswordPolicyValidator class
    const errors = this.passwordPolicyValidator.validate(password);
    return errors.length > 0 ? errors.join(' ') : null;
  }

  async initiatePasswordReset(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (user) {
      // Generate a secure, unique, time-limited token
      const resetToken = randomBytes(32).toString('hex');
      const passwordResetTokenHash = createHash('sha256').update(resetToken).digest('hex');
      
      const passwordResetExpires = new Date();
      passwordResetExpires.setHours(
        passwordResetExpires.getHours() + 
        (this.userAuthConfigService.get('passwordResetTokenExpiryHours') || 1) // Default 1 hour
      );

      user.passwordResetToken = passwordResetTokenHash;
      user.passwordResetExpires = passwordResetExpires;
      await this.userRepository.save(user);

      try {
        // Send email via NotificationService
        // The actual reset link would be something like: frontendUrl/reset-password?token=${resetToken}
        await this.notificationService.sendPasswordResetEmail(user.email, resetToken, user.firstName);
        // Emit user.passwordResetRequested event
      } catch (error) {
        // Log error, but don't let user know if email sending failed to prevent enumeration
        console.error('Failed to send password reset email:', error);
      }
    }
    // Always return void or a generic success message to prevent email enumeration
    // The controller handles the user-facing message.
  }

  async finalizePasswordReset(token: string, newPassword: string): Promise<UserEntity> {
    if (!token || !newPassword) {
        throw new BadRequestException('Token and new password are required.');
    }
    const hashedToken = createHash('sha256').update(token).digest('hex');

    const user = await this.userRepository.findOne({
      where: {
        passwordResetToken: hashedToken,
        // passwordResetExpires: MoreThan(new Date()) // TypeORM query for date comparison
      },
    });
    
    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Password reset token is invalid or has expired.');
    }

    const policyError = this.validatePasswordPolicy(newPassword);
    if (policyError) {
      throw new BadRequestException(`Password does not meet policy: ${policyError}`);
    }

    const isPasswordInHistory = await this.userService.checkPasswordHistory(user.id, await this.hashPassword(newPassword));
    if (isPasswordInHistory) {
      throw new BadRequestException('New password cannot be one of your recent passwords.');
    }

    user.passwordHash = await this.hashPassword(newPassword);
    await this.userService.addPasswordToHistory(user.id, user.passwordHash); // UserService handles history size
    
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.failedLoginAttempts = 0; // Reset lockout attempts
    user.lockoutUntil = null;

    // Emit user.passwordResetCompleted event
    return this.userRepository.save(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<UserEntity> {
    const user = await this.userRepository.findByEmailWithPassword(null, userId); // Modified to fetch by ID with password
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const isCurrentPasswordValid = await this.comparePassword(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Incorrect current password.');
    }

    if (currentPassword === newPassword) {
        throw new BadRequestException('New password cannot be the same as the current password.');
    }

    const policyError = this.validatePasswordPolicy(newPassword);
    if (policyError) {
      throw new BadRequestException(`Password does not meet policy: ${policyError}`);
    }
    
    const newPasswordHash = await this.hashPassword(newPassword);
    const isPasswordInHistory = await this.userService.checkPasswordHistory(user.id, newPasswordHash);
    if (isPasswordInHistory) {
      throw new BadRequestException('New password cannot be one of your recent passwords.');
    }

    user.passwordHash = newPasswordHash;
    await this.userService.addPasswordToHistory(user.id, user.passwordHash); // UserService handles history size

    // Emit user.passwordChanged event
    return this.userRepository.save(user);
  }
}
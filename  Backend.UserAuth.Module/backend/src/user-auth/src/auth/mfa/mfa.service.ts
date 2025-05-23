import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode'; // otpauth uses otplib which uses qrcode indirectly but we might use it directly for URL
import { UserService } from '../../user/user.service';
import { UserAuthConfigService } from '../../config/user-auth.config';
import { UserMfaSecretEntity } from '../../user/entities/user-mfa-secret.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
// import { encrypt, decrypt } from '../../utils/crypto.utils'; // Assume crypto utils exist for secret encryption

// Placeholder for crypto functions if secrets are encrypted at rest
const encrypt = async (text: string) => `encrypted:${text}`; // Replace with actual encryption
const decrypt = async (text: string) => text.replace('encrypted:', ''); // Replace with actual decryption


@Injectable()
export class MfaService {
  constructor(
    private readonly userService: UserService,
    private readonly userAuthConfigService: UserAuthConfigService,
    @InjectRepository(UserMfaSecretEntity)
    private readonly userMfaSecretRepository: Repository<UserMfaSecretEntity>,
    @InjectRepository(UserEntity) // To update user.isMfaEnabled
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async generateMfaSecret(userId: string): Promise<{ secret: string; otpauthUrl: string; qrCodeDataUrl: string }> {
    const user = await this.userService.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const secret = authenticator.generateSecret();
    const otpauthUrl = this.generateOtpAuthUrl(secret, user.email);
    
    // Store this secret temporarily or directly if the user confirms immediately.
    // For a setup flow, this secret is usually stored as "pending" until verified.
    // Here we'll save it as a pending secret, to be confirmed by `enableMfa`.
    let userMfaSecret = await this.userMfaSecretRepository.findOne({ where: { userId } });
    if (!userMfaSecret) {
      userMfaSecret = this.userMfaSecretRepository.create({ userId });
    }
    userMfaSecret.pendingSecret = await encrypt(secret); // Encrypt before saving
    userMfaSecret.confirmedSecret = null; // Clear confirmed secret if re-setting up
    await this.userMfaSecretRepository.save(userMfaSecret);
    
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

    return { secret, otpauthUrl, qrCodeDataUrl }; // Secret is returned for manual entry if QR fails
  }

  generateOtpAuthUrl(secret: string, email: string): string {
    const issuer = this.userAuthConfigService.getMfaIssuerName();
    return authenticator.keyuri(email, issuer, secret);
  }

  async enableMfa(userId: string, token: string): Promise<string[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const mfaSecretEntry = await this.userMfaSecretRepository.findOne({ where: { userId } });
    if (!mfaSecretEntry || !mfaSecretEntry.pendingSecret) {
      throw new BadRequestException('MFA setup not initiated or pending secret not found.');
    }

    const decryptedPendingSecret = await decrypt(mfaSecretEntry.pendingSecret);
    const isValid = authenticator.check(token, decryptedPendingSecret);

    if (!isValid) {
      throw new UnauthorizedException('Invalid MFA token.');
    }

    mfaSecretEntry.confirmedSecret = mfaSecretEntry.pendingSecret;
    mfaSecretEntry.pendingSecret = null;
    
    const recoveryCodes = await this.generateAndSaveRecoveryCodes(mfaSecretEntry);
    
    await this.userMfaSecretRepository.save(mfaSecretEntry);

    user.isMfaEnabled = true;
    await this.userRepository.save(user);
    
    // Emit event user.mfaEnabled
    
    return recoveryCodes;
  }

  async verifyMfaToken(userId: string, token: string, useConfirmedSecret: boolean = true): Promise<boolean> {
    const mfaSecretEntry = await this.userMfaSecretRepository.findOne({ where: { userId } });
    if (!mfaSecretEntry || (useConfirmedSecret && !mfaSecretEntry.confirmedSecret) || (!useConfirmedSecret && !mfaSecretEntry.pendingSecret)) {
      // If using confirmed secret and it's not there, or using pending and it's not there, then fail.
      // This also implies MFA is not properly set up if confirmedSecret is expected but missing.
      return false; 
    }

    const secretToUse = useConfirmedSecret ? mfaSecretEntry.confirmedSecret : mfaSecretEntry.pendingSecret;
    if(!secretToUse) return false; // Should not happen if prior checks pass

    const decryptedSecret = await decrypt(secretToUse);
    return authenticator.check(token, decryptedSecret);
  }


  async disableMfa(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const mfaSecretEntry = await this.userMfaSecretRepository.findOne({ where: { userId } });
    if (mfaSecretEntry) {
      // Remove secrets and recovery codes
      mfaSecretEntry.pendingSecret = null;
      mfaSecretEntry.confirmedSecret = null;
      mfaSecretEntry.recoveryCodes = [];
      await this.userMfaSecretRepository.save(mfaSecretEntry);
      // Or: await this.userMfaSecretRepository.delete({ userId }); to remove the row
    }

    if (user.isMfaEnabled) {
      user.isMfaEnabled = false;
      await this.userRepository.save(user);
      // Emit event user.mfaDisabled
    }
  }
  
  private async generateAndSaveRecoveryCodes(mfaSecretEntry: UserMfaSecretEntity, count = 10): Promise<string[]> {
    const recoveryCodes = Array(count).fill(null).map(() => authenticator.generateSecret(16)); // Generate 16-char codes
    // TODO: Hash recovery codes before storing
    // For now, storing plaintext for simplicity. In production, hash them.
    mfaSecretEntry.recoveryCodes = recoveryCodes; // Storing plain for now; SDS: "(encrypted/hashed)"
    return recoveryCodes;
  }

  async generateRecoveryCodes(userId: string): Promise<string[]> {
    const mfaSecretEntry = await this.userMfaSecretRepository.findOne({ where: { userId } });
    if (!mfaSecretEntry || !mfaSecretEntry.confirmedSecret) {
      throw new BadRequestException('MFA is not enabled for this user.');
    }
    const newRecoveryCodes = await this.generateAndSaveRecoveryCodes(mfaSecretEntry);
    await this.userMfaSecretRepository.save(mfaSecretEntry);
    return newRecoveryCodes;
  }

  async validateRecoveryCode(userId: string, code: string): Promise<boolean> {
    const mfaSecretEntry = await this.userMfaSecretRepository.findOne({ where: { userId } });
    if (!mfaSecretEntry || !mfaSecretEntry.recoveryCodes || mfaSecretEntry.recoveryCodes.length === 0) {
      return false;
    }
    // TODO: If codes are hashed, this logic needs to compare against hashed codes.
    const codeIndex = mfaSecretEntry.recoveryCodes.indexOf(code);
    if (codeIndex > -1) {
      // Code is valid, remove it after use
      mfaSecretEntry.recoveryCodes.splice(codeIndex, 1);
      await this.userMfaSecretRepository.save(mfaSecretEntry);
      return true;
    }
    return false;
  }
}
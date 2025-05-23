import { Controller, Post, Body, Get, UseGuards, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import { MfaService } from './mfa.service';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UserEntity } from '../../user/entities/user.entity';
import { MfaSetupDto } from './dto/mfa-setup.dto';
import { MfaValidateDto } from './dto/mfa-validate.dto';
import { MfaRecoveryCodesDto } from './dto/mfa-recovery-codes.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
// import { MfaGuard, MfaProtected } from '../guards/mfa.guard'; // Assuming MfaGuard handles finer-grained control

@Controller('auth/mfa')
@UseGuards(JwtAuthGuard) // All MFA operations require an authenticated user
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @Post('setup')
  async setupMfa(@CurrentUser() user: UserEntity): Promise<MfaSetupDto> {
    if (!user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    if (user.isMfaEnabled) {
        // If MFA is already enabled, perhaps return current status or an error
        // For now, let's assume they want to re-setup or get a new secret, service handles logic
    }
    return this.mfaService.generateMfaSecret(user.id);
  }

  @Post('validate') // This endpoint is used to *enable* MFA by validating the first token
  @HttpCode(HttpStatus.OK)
  async validateAndEnableMfa(
    @CurrentUser() user: UserEntity,
    @Body() mfaValidateDto: MfaValidateDto,
  ): Promise<{ success: boolean; recoveryCodes?: string[] }> {
    if (!user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    // The MfaService.enableMfa should handle secret fetching (e.g. temp storage) & validation
    // For simplicity, we assume the secret was generated in a previous step and might be passed or stored temporarily.
    // The SDS for MfaService.enableMfa implies it takes the secret.
    // This flow needs careful consideration for how the secret from setup is passed to enableMfa.
    // Often, the secret used for validation is stored temporarily server-side or passed back from client.
    // Let's assume mfaService.enableMfa handles this internally or by retrieving a pending secret for the user.
    const recoveryCodes = await this.mfaService.enableMfa(user.id, mfaValidateDto.mfaToken);
    return { success: true, recoveryCodes };
  }
  
  @Post('verify') // This endpoint is used to verify an MFA token for login or sensitive actions (if not handled by guard/main login)
  @HttpCode(HttpStatus.OK)
  async verifyMfaToken(
    @CurrentUser() user: UserEntity,
    @Body() mfaValidateDto: MfaValidateDto,
  ): Promise<{ mfaVerified: boolean }> {
    if (!user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    const isValid = await this.mfaService.verifyMfaToken(user.id, mfaValidateDto.mfaToken, true); // true to check against confirmed secret
    return { mfaVerified: isValid };
  }

  @Post('disable')
  @HttpCode(HttpStatus.OK)
  async disableMfa(
    @CurrentUser() user: UserEntity,
    // @Body() mfaValidateDto: MfaValidateDto, // Optionally require current MFA token to disable
    ): Promise<{ success: boolean }> {
    if (!user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    // const isValid = await this.mfaService.verifyMfaToken(user.id, mfaValidateDto.mfaToken, true);
    // if (!isValid) {
    //   throw new UnauthorizedException('Invalid MFA token. Cannot disable MFA.');
    // }
    await this.mfaService.disableMfa(user.id);
    return { success: true };
  }

  @Get('recovery-codes')
  async getRecoveryCodes(@CurrentUser() user: UserEntity): Promise<MfaRecoveryCodesDto> {
    if (!user || !user.isMfaEnabled) {
      throw new UnauthorizedException('User not authenticated or MFA not enabled.');
    }
    // Typically, you generate new codes and invalidate old ones, or display existing ones if stored.
    // The MfaService.generateRecoveryCodes suggests generating new ones.
    const recoveryCodes = await this.mfaService.generateRecoveryCodes(user.id);
    return { recoveryCodes };
  }
}
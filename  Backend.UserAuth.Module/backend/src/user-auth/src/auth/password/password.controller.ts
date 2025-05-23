import { Controller, Post, Body, Patch, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { PasswordService } from './password.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UserEntity } from '../../user/entities/user.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Public } from '../decorators/public.decorator';

@Controller('auth/password')
export class PasswordController {
  constructor(private readonly passwordService: PasswordService) {}

  @Public()
  @Post('forgot')
  @HttpCode(HttpStatus.OK) // Return 200 even if email not found for security
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.passwordService.initiatePasswordReset(forgotPasswordDto.email);
    return { message: 'If a user with that email exists, a password reset link has been sent.' };
  }

  @Public()
  @Post('reset')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    await this.passwordService.finalizePasswordReset(resetPasswordDto.token, resetPasswordDto.newPassword);
    return { message: 'Password has been reset successfully.' };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change') // Using PATCH as it's a partial update to the user resource
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: UserEntity,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.passwordService.changePassword(
      user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
    return { message: 'Password has been changed successfully.' };
  }
}
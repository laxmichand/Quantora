import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MfaSetupDto {
  @ApiPropertyOptional({ description: 'MFA method: totp, sms, email' })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional({ description: 'Phone number for SMS MFA' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class MfaVerifyDto {
  @ApiProperty({ description: 'TOTP/OTP code' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: 'MFA session token from login' })
  @IsOptional()
  @IsString()
  mfaSessionToken?: string;
}

export class MfaDisableDto {
  @ApiProperty({ description: 'Current password' })
  @IsString()
  password: string;

  @ApiProperty({ description: 'Current TOTP code or backup code' })
  @IsString()
  code: string;
}

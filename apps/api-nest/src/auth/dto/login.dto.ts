import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ description: 'Client-generated device ID' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({ description: 'Device fingerprint data' })
  @IsOptional()
  fingerprint?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Geolocation latitude' })
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Geolocation longitude' })
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ description: 'IANA timezone' })
  @IsOptional()
  timezone?: string;
}

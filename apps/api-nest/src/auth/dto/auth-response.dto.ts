import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ description: 'User object' })
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

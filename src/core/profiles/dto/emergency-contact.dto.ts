import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class EmergencyContactDto {
  @ApiProperty({
    description: 'Name of emergency contact',
    example: 'John Doe'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Relationship with emergency contact',
    example: 'Parent'
  })
  @IsString()
  @IsNotEmpty()
  relationship: string;

  @ApiProperty({
    description: 'Phone number of emergency contact',
    example: '+1-555-555-5555'
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}

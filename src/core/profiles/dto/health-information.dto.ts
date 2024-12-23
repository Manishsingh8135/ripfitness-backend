import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsBoolean, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class HealthInformationDto {
  @ApiProperty({
    description: 'List of medical conditions',
    example: ['Asthma', 'High Blood Pressure'],
    required: false
  })
  @IsArray()
  @IsString({ each: true })
  medicalConditions: string[];

  @ApiProperty({
    description: 'List of allergies',
    example: ['Peanuts', 'Latex'],
    required: false
  })
  @IsArray()
  @IsString({ each: true })
  allergies: string[];

  @ApiProperty({
    description: 'List of current medications',
    example: ['Ventolin', 'Lisinopril'],
    required: false
  })
  @IsArray()
  @IsString({ each: true })
  medications: string[];

  @ApiProperty({
    description: 'Blood type',
    example: 'O+',
    required: false
  })
  @IsOptional()
  @IsString()
  bloodType?: string;

  @ApiProperty({
    description: 'Date of last medical checkup',
    example: '2023-01-01',
    required: false
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  lastMedicalCheckup?: Date;

  @ApiProperty({
    description: 'Has health insurance',
    example: true
  })
  @IsBoolean()
  hasInsurance: boolean;

  @ApiProperty({
    description: 'Insurance provider name',
    example: 'Blue Cross Blue Shield',
    required: false
  })
  @IsOptional()
  @IsString()
  insuranceProvider?: string;

  @ApiProperty({
    description: 'Insurance policy number',
    example: 'POL123456789',
    required: false
  })
  @IsOptional()
  @IsString()
  insurancePolicyNumber?: string;
}

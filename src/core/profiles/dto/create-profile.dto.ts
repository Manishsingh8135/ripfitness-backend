import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString, IsNotEmpty, IsEnum, IsDate, ValidateNested,
  IsOptional, IsNumber, Min, Max, IsBoolean, IsArray, ArrayMinSize
} from 'class-validator';
import { FitnessLevel, FitnessGoal } from '../schemas/profile.schema';
import { AddressDto } from './address.dto';
import { EmergencyContactDto } from './emergency-contact.dto';
import { HealthInformationDto } from './health-information.dto';

export class CreateProfileDto {
  @ApiProperty({
    description: 'Date of birth',
    example: '1990-01-01'
  })
  @Type(() => Date)
  @IsDate()
  dateOfBirth: Date;

  @ApiProperty({
    description: 'Gender',
    enum: ['male', 'female', 'other'],
    example: 'male'
  })
  @IsString()
  @IsEnum(['male', 'female', 'other'])
  gender: string;

  @ApiProperty({
    description: 'Address information'
  })
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ApiProperty({
    description: 'Emergency contact information'
  })
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact: EmergencyContactDto;

  @ApiProperty({
    description: 'Height in centimeters',
    example: 175,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;

  @ApiProperty({
    description: 'Weight in kilograms',
    example: 70,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiProperty({
    description: 'Body fat percentage',
    example: 15,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  bodyFatPercentage?: number;

  @ApiProperty({
    description: 'Fitness level',
    enum: FitnessLevel,
    example: FitnessLevel.INTERMEDIATE
  })
  @IsEnum(FitnessLevel)
  fitnessLevel: FitnessLevel;

  @ApiProperty({
    description: 'Fitness goals',
    enum: FitnessGoal,
    isArray: true,
    example: [FitnessGoal.WEIGHT_LOSS, FitnessGoal.MUSCLE_GAIN]
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(FitnessGoal, { each: true })
  fitnessGoals: FitnessGoal[];

  @ApiProperty({
    description: 'Preferred workout types',
    example: ['yoga', 'strength-training']
  })
  @IsArray()
  @IsString({ each: true })
  preferredWorkoutTypes: string[];

  @ApiProperty({
    description: 'Preferred workout days',
    example: ['monday', 'wednesday', 'friday']
  })
  @IsArray()
  @IsString({ each: true })
  preferredWorkoutDays: string[];

  @ApiProperty({
    description: 'Preferred workout time',
    example: '18:00',
    required: false
  })
  @IsOptional()
  @IsString()
  preferredWorkoutTime?: string;

  @ApiProperty({
    description: 'Health information'
  })
  @ValidateNested()
  @Type(() => HealthInformationDto)
  healthInfo: HealthInformationDto;

  @ApiProperty({
    description: 'Receive notifications',
    example: true
  })
  @IsBoolean()
  receiveNotifications: boolean;

  @ApiProperty({
    description: 'Receive emails',
    example: true
  })
  @IsBoolean()
  receiveEmails: boolean;

  @ApiProperty({
    description: 'Receive SMS',
    example: true
  })
  @IsBoolean()
  receiveSMS: boolean;

  @ApiProperty({
    description: 'Preferred language',
    example: 'en',
    default: 'en'
  })
  @IsString()
  preferredLanguage: string;
}

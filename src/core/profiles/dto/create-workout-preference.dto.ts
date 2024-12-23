import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString, IsEnum, IsArray, IsNumber,
  Min, Max, IsBoolean, IsOptional,
  ValidateNested, ArrayMinSize
} from 'class-validator';
import { WorkoutType, Equipment } from '../schemas/workout-preference.schema';

class TimePreferenceDto {
  @ApiProperty({
    description: 'Preferred workout days',
    example: ['monday', 'wednesday', 'friday']
  })
  @IsArray()
  @IsString({ each: true })
  preferredDays: string[];

  @ApiProperty({
    description: 'Preferred time slot',
    example: '06:00-08:00'
  })
  @IsString()
  preferredTimeSlot: string;

  @ApiProperty({
    description: 'Preferred workout duration in minutes',
    example: 60,
    minimum: 30,
    maximum: 240
  })
  @IsNumber()
  @Min(30)
  @Max(240)
  preferredDuration: number;
}

class IntensityPreferenceDto {
  @ApiProperty({
    description: 'Cardio intensity level',
    example: 3,
    minimum: 1,
    maximum: 5
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  cardioIntensity: number;

  @ApiProperty({
    description: 'Strength training intensity level',
    example: 3,
    minimum: 1,
    maximum: 5
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  strengthIntensity: number;

  @ApiProperty({
    description: 'Flexibility training intensity level',
    example: 3,
    minimum: 1,
    maximum: 5
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  flexibilityIntensity: number;
}

export class CreateWorkoutPreferenceDto {
  @ApiProperty({
    description: 'Preferred workout types',
    enum: WorkoutType,
    isArray: true,
    example: [WorkoutType.STRENGTH, WorkoutType.CARDIO]
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(WorkoutType, { each: true })
  preferredWorkoutTypes: WorkoutType[];

  @ApiProperty({
    description: 'Available equipment',
    enum: Equipment,
    isArray: true,
    example: [Equipment.DUMBBELLS, Equipment.TREADMILL]
  })
  @IsArray()
  @IsEnum(Equipment, { each: true })
  availableEquipment: Equipment[];

  @ApiProperty({
    description: 'Time preferences'
  })
  @ValidateNested()
  @Type(() => TimePreferenceDto)
  timePreference: TimePreferenceDto;

  @ApiProperty({
    description: 'Intensity preferences'
  })
  @ValidateNested()
  @Type(() => IntensityPreferenceDto)
  intensityPreference: IntensityPreferenceDto;

  @ApiProperty({
    description: 'Number of workouts per week',
    example: 3,
    minimum: 1,
    maximum: 7
  })
  @IsNumber()
  @Min(1)
  @Max(7)
  workoutsPerWeek: number;

  @ApiProperty({
    description: 'Needs workout modifications',
    example: false
  })
  @IsBoolean()
  needsModification: boolean;

  @ApiProperty({
    description: 'Injury considerations',
    example: ['Lower back pain', 'Knee injury'],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  injuryConsiderations?: string[];

  @ApiProperty({
    description: 'Exercises to exclude',
    example: ['Deadlifts', 'Box jumps'],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludedExercises?: string[];

  @ApiProperty({
    description: 'Preference for group workouts',
    example: true
  })
  @IsBoolean()
  preferGroupWorkouts: boolean;

  @ApiProperty({
    description: 'Special instructions',
    example: 'Prefer low-impact exercises',
    required: false
  })
  @IsOptional()
  @IsString()
  specialInstructions?: string;
}

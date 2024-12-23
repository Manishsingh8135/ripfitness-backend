import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsDate, IsString, IsOptional, ValidateNested } from 'class-validator';

class MeasurementDto {
  @ApiProperty({
    description: 'Measurement value',
    example: 75.5
  })
  @IsNumber()
  value: number;

  @ApiProperty({
    description: 'Measurement date',
    example: '2023-12-23'
  })
  @Type(() => Date)
  @IsDate()
  date: Date;

  @ApiProperty({
    description: 'Additional notes',
    example: 'After morning workout',
    required: false
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

class BodyMeasurementsDto {
  @ApiProperty({
    description: 'Weight measurements',
    type: [MeasurementDto]
  })
  @ValidateNested({ each: true })
  @Type(() => MeasurementDto)
  weight: MeasurementDto[];

  @ApiProperty({
    description: 'Body fat measurements',
    type: [MeasurementDto]
  })
  @ValidateNested({ each: true })
  @Type(() => MeasurementDto)
  bodyFat: MeasurementDto[];

  @ApiProperty({
    description: 'Chest measurements',
    type: [MeasurementDto]
  })
  @ValidateNested({ each: true })
  @Type(() => MeasurementDto)
  chest: MeasurementDto[];

  @ApiProperty({
    description: 'Waist measurements',
    type: [MeasurementDto]
  })
  @ValidateNested({ each: true })
  @Type(() => MeasurementDto)
  waist: MeasurementDto[];

  @ApiProperty({
    description: 'Hips measurements',
    type: [MeasurementDto]
  })
  @ValidateNested({ each: true })
  @Type(() => MeasurementDto)
  hips: MeasurementDto[];

  @ApiProperty({
    description: 'Biceps measurements',
    type: [MeasurementDto]
  })
  @ValidateNested({ each: true })
  @Type(() => MeasurementDto)
  biceps: MeasurementDto[];

  @ApiProperty({
    description: 'Thighs measurements',
    type: [MeasurementDto]
  })
  @ValidateNested({ each: true })
  @Type(() => MeasurementDto)
  thighs: MeasurementDto[];
}

class FitnessMetricsDto {
  @ApiProperty({
    description: 'Push-ups measurements',
    type: [MeasurementDto]
  })
  @ValidateNested({ each: true })
  @Type(() => MeasurementDto)
  pushUps: MeasurementDto[];

  @ApiProperty({
    description: 'Pull-ups measurements',
    type: [MeasurementDto]
  })
  @ValidateNested({ each: true })
  @Type(() => MeasurementDto)
  pullUps: MeasurementDto[];

  @ApiProperty({
    description: 'Squats measurements',
    type: [MeasurementDto]
  })
  @ValidateNested({ each: true })
  @Type(() => MeasurementDto)
  squats: MeasurementDto[];

  @ApiProperty({
    description: 'Plank time measurements',
    type: [MeasurementDto]
  })
  @ValidateNested({ each: true })
  @Type(() => MeasurementDto)
  plankTime: MeasurementDto[];

  @ApiProperty({
    description: 'Running distance measurements',
    type: [MeasurementDto]
  })
  @ValidateNested({ each: true })
  @Type(() => MeasurementDto)
  runningDistance: MeasurementDto[];

  @ApiProperty({
    description: 'Running time measurements',
    type: [MeasurementDto]
  })
  @ValidateNested({ each: true })
  @Type(() => MeasurementDto)
  runningTime: MeasurementDto[];
}

export class CreateFitnessProgressDto {
  @ApiProperty({
    description: 'Body measurements',
    type: BodyMeasurementsDto
  })
  @ValidateNested()
  @Type(() => BodyMeasurementsDto)
  bodyMeasurements: BodyMeasurementsDto;

  @ApiProperty({
    description: 'Fitness metrics',
    type: FitnessMetricsDto
  })
  @ValidateNested()
  @Type(() => FitnessMetricsDto)
  fitnessMetrics: FitnessMetricsDto;
}

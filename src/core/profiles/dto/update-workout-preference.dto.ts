import { PartialType } from '@nestjs/swagger';
import { CreateWorkoutPreferenceDto } from './create-workout-preference.dto';

export class UpdateWorkoutPreferenceDto extends PartialType(CreateWorkoutPreferenceDto) {}

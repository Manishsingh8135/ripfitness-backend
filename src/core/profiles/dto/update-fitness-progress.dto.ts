import { PartialType } from '@nestjs/swagger';
import { CreateFitnessProgressDto } from './create-fitness-progress.dto';

export class UpdateFitnessProgressDto extends PartialType(CreateFitnessProgressDto) {}

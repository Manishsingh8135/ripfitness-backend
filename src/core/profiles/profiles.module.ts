import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfileController } from './controllers/profile.controller';
import { FitnessProgressController } from './controllers/fitness-progress.controller';
import { WorkoutPreferenceController } from './controllers/workout-preference.controller';
import { ProfileService } from './services/profile.service';
import { FitnessProgressService } from './services/fitness-progress.service';
import { WorkoutPreferenceService } from './services/workout-preference.service';
import { ProfileRepository } from './repositories/profile.repository';
import { FitnessProgressRepository } from './repositories/fitness-progress.repository';
import { WorkoutPreferenceRepository } from './repositories/workout-preference.repository';
import { Profile, ProfileSchema } from './schemas/profile.schema';
import { FitnessProgress, FitnessProgressSchema } from './schemas/fitness-progress.schema';
import { WorkoutPreference, WorkoutPreferenceSchema } from './schemas/workout-preference.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Profile.name, schema: ProfileSchema },
      { name: FitnessProgress.name, schema: FitnessProgressSchema },
      { name: WorkoutPreference.name, schema: WorkoutPreferenceSchema },
    ]),
  ],
  controllers: [
    ProfileController,
    FitnessProgressController,
    WorkoutPreferenceController,
  ],
  providers: [
    ProfileService,
    FitnessProgressService,
    WorkoutPreferenceService,
    ProfileRepository,
    FitnessProgressRepository,
    WorkoutPreferenceRepository,
  ],
  exports: [
    ProfileService,
    FitnessProgressService,
    WorkoutPreferenceService,
  ],
})
export class ProfilesModule {}

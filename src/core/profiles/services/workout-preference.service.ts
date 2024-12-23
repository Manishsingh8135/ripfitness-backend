import { Injectable, NotFoundException } from '@nestjs/common';
import { WorkoutPreferenceRepository } from '../repositories/workout-preference.repository';
import { CreateWorkoutPreferenceDto } from '../dto/create-workout-preference.dto';
import { UpdateWorkoutPreferenceDto } from '../dto/update-workout-preference.dto';
import { WorkoutPreferenceDocument, WorkoutType } from '../schemas/workout-preference.schema';

@Injectable()
export class WorkoutPreferenceService {
  constructor(
    private readonly workoutPreferenceRepository: WorkoutPreferenceRepository,
  ) {}

  async createPreference(
    userId: string,
    createDto: CreateWorkoutPreferenceDto,
  ): Promise<WorkoutPreferenceDocument> {
    // Check if preferences already exist
    const existing = await this.workoutPreferenceRepository.findByUserId(userId);
    if (existing) {
      throw new Error('Workout preferences already exist for this user');
    }

    return this.workoutPreferenceRepository.create(userId, createDto);
  }

  async getPreference(userId: string): Promise<WorkoutPreferenceDocument> {
    const preference = await this.workoutPreferenceRepository.findByUserId(userId);
    if (!preference) {
      throw new NotFoundException('Workout preferences not found');
    }
    return preference;
  }

  async updatePreference(
    userId: string,
    updateDto: UpdateWorkoutPreferenceDto,
  ): Promise<WorkoutPreferenceDocument> {
    const preference = await this.workoutPreferenceRepository.update(userId, updateDto);
    if (!preference) {
      throw new NotFoundException('Workout preferences not found');
    }
    return preference;
  }

  async findMatchingWorkoutPartners(
    userId: string,
    options: {
      maxDistance?: number;
      intensityTolerance?: number;
      timeOverlap?: boolean;
    } = {},
  ): Promise<Array<{
    userId: string;
    matchScore: number;
    matchingCriteria: string[];
  }>> {
    const userPreference = await this.getPreference(userId);
    if (!userPreference) {
      throw new NotFoundException('User workout preferences not found');
    }

    const {
      maxDistance = 10000, // 10km default
      intensityTolerance = 1,
      timeOverlap = true,
    } = options;

    // Find users with matching workout types
    const matchingTypeUsers = await this.workoutPreferenceRepository.findByWorkoutType(
      userPreference.preferredWorkoutTypes[0],
    );

    const matches = await Promise.all(
      matchingTypeUsers
        .filter(match => match.userId.toString() !== userId)
        .map(async match => {
          const matchingCriteria: string[] = [];
          let matchScore = 0;

          // Workout type match
          const matchingTypes = userPreference.preferredWorkoutTypes.filter(type =>
            match.preferredWorkoutTypes.includes(type),
          );
          if (matchingTypes.length) {
            matchScore += matchingTypes.length * 10;
            matchingCriteria.push(`${matchingTypes.length} matching workout types`);
          }

          // Intensity match
          const intensityDiff = Math.abs(
            userPreference.intensityPreference.cardioIntensity -
            match.intensityPreference.cardioIntensity,
          );
          if (intensityDiff <= intensityTolerance) {
            matchScore += 20;
            matchingCriteria.push('Similar intensity preferences');
          }

          // Time preference match
          if (timeOverlap) {
            const hasTimeOverlap = userPreference.timePreference.preferredDays.some(day =>
              match.timePreference.preferredDays.includes(day),
            );
            if (hasTimeOverlap) {
              matchScore += 15;
              matchingCriteria.push('Overlapping schedule');
            }
          }

          // Equipment match
          const matchingEquipment = userPreference.availableEquipment.filter(eq =>
            match.availableEquipment.includes(eq),
          );
          if (matchingEquipment.length) {
            matchScore += matchingEquipment.length * 5;
            matchingCriteria.push(`${matchingEquipment.length} matching equipment`);
          }

          // Group preference match
          if (userPreference.preferGroupWorkouts === match.preferGroupWorkouts) {
            matchScore += 10;
            matchingCriteria.push('Matching group workout preference');
          }

          return {
            userId: match.userId.toString(),
            matchScore,
            matchingCriteria,
          };
        }),
    );

    // Sort by match score and return top matches
    return matches
      .filter(match => match.matchScore > 20) // Minimum match threshold
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  async getPreferenceStats() {
    return this.workoutPreferenceRepository.getPreferenceStats();
  }

  async generateWorkoutRecommendations(userId: string): Promise<{
    recommendedWorkouts: string[];
    recommendedEquipment: string[];
    scheduleSuggestions: string[];
  }> {
    const preference = await this.getPreference(userId);

    const recommendedWorkouts: string[] = [];
    const recommendedEquipment: string[] = [];
    const scheduleSuggestions: string[] = [];

    // Analyze workout types
    if (preference.preferredWorkoutTypes.length < 3) {
      const commonTypes = [WorkoutType.CARDIO, WorkoutType.STRENGTH, WorkoutType.FLEXIBILITY];
      const missingTypes = commonTypes.filter(
        type => !preference.preferredWorkoutTypes.includes(type),
      );
      recommendedWorkouts.push(
        `Consider adding ${missingTypes.join(', ')} to your routine for a more balanced workout`,
      );
    }

    // Analyze equipment
    if (preference.availableEquipment.length < 3) {
      recommendedEquipment.push(
        'Consider investing in basic equipment like resistance bands or dumbbells for more workout variety',
      );
    }

    // Analyze schedule
    if (preference.timePreference.preferredDays.length < 3) {
      scheduleSuggestions.push(
        'Try to schedule at least 3 workout days per week for optimal results',
      );
    }

    if (preference.timePreference.preferredDuration < 45) {
      scheduleSuggestions.push(
        'Consider increasing workout duration to 45-60 minutes for better results',
      );
    }

    return {
      recommendedWorkouts,
      recommendedEquipment,
      scheduleSuggestions,
    };
  }
}

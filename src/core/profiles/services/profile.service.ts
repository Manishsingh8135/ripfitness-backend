import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ProfileRepository } from '../repositories/profile.repository';
import { CreateProfileDto } from '../dto/create-profile.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ProfileDocument } from '../schemas/profile.schema';

@Injectable()
export class ProfileService {
  constructor(
    private readonly profileRepository: ProfileRepository,
  ) {}

  async createProfile(userId: string, createProfileDto: CreateProfileDto): Promise<ProfileDocument> {
    // Check if profile already exists
    const existingProfile = await this.profileRepository.findByUserId(userId);
    if (existingProfile) {
      throw new BadRequestException('Profile already exists for this user');
    }

    const profile = await this.profileRepository.create(userId, createProfileDto);
    
    // Calculate initial completion percentage
    await this.profileRepository.updateCompletionPercentage(userId);
    
    return profile;
  }

  async getProfile(userId: string): Promise<ProfileDocument> {
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<ProfileDocument> {
    const profile = await this.profileRepository.update(userId, updateProfileDto);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Recalculate completion percentage after update
    await this.profileRepository.updateCompletionPercentage(userId);

    return profile;
  }

  async deleteProfile(userId: string): Promise<void> {
    const profile = await this.profileRepository.delete(userId);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
  }

  async findNearbyProfiles(
    userId: string,
    longitude: number,
    latitude: number,
    maxDistance: number = 5000, // Default 5km
  ): Promise<ProfileDocument[]> {
    // Get nearby profiles excluding the searching user
    return this.profileRepository.findByLocation(longitude, latitude, maxDistance, userId);
  }

  async findProfilesByFitnessLevel(fitnessLevel: string): Promise<ProfileDocument[]> {
    return this.profileRepository.findByFitnessLevel(fitnessLevel);
  }

  async findProfilesByFitnessGoals(goals: string[]): Promise<ProfileDocument[]> {
    return this.profileRepository.findByFitnessGoals(goals);
  }

  async getProfileStats() {
    return this.profileRepository.getProfileStats();
  }

  async getProfileCompletionStatus(userId: string): Promise<{
    completionPercentage: number;
    missingFields: string[];
  }> {
    const profile = await this.getProfile(userId);
    
    const requiredFields = [
      'dateOfBirth',
      'gender',
      'address',
      'emergencyContact',
      'height',
      'weight',
      'fitnessLevel',
      'fitnessGoals',
      'preferredWorkoutTypes',
      'healthInfo',
    ];

    const missingFields = requiredFields.filter(field => {
      const value = profile[field];
      if (Array.isArray(value)) {
        return value.length === 0;
      }
      return value === undefined || value === null;
    });

    return {
      completionPercentage: profile.completionPercentage,
      missingFields,
    };
  }

  async searchProfiles(
    page: number = 1,
    limit: number = 10,
    filters?: {
      fitnessLevel?: string;
      fitnessGoals?: string[];
      ageRange?: { min: number; max: number };
      location?: { longitude: number; latitude: number; maxDistance: number };
    },
  ): Promise<{
    profiles: ProfileDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    // If no filters, return paginated results
    if (!filters) {
      return this.profileRepository.findAll(page, limit);
    }

    // Apply filters
    let profiles: ProfileDocument[] = [];

    if (filters.location) {
      profiles = await this.profileRepository.findByLocation(
        filters.location.longitude,
        filters.location.latitude,
        filters.location.maxDistance,
      );
    }

    if (filters.fitnessLevel) {
      const byLevel = await this.profileRepository.findByFitnessLevel(filters.fitnessLevel);
      profiles = profiles.length ? 
        profiles.filter(p => byLevel.some(b => b.userId.toString() === p.userId.toString())) :
        byLevel;
    }

    if (filters.fitnessGoals?.length) {
      const byGoals = await this.profileRepository.findByFitnessGoals(filters.fitnessGoals);
      profiles = profiles.length ?
        profiles.filter(p => byGoals.some(b => b.userId.toString() === p.userId.toString())) :
        byGoals;
    }

    if (filters.ageRange) {
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - filters.ageRange.max);
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() - filters.ageRange.min);

      profiles = profiles.length ?
        profiles.filter(p => {
          const dob = new Date(p.dateOfBirth);
          return dob >= minDate && dob <= maxDate;
        }) :
        profiles;
    }

    // Apply pagination to filtered results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const total = profiles.length;

    return {
      profiles: profiles.slice(startIndex, endIndex),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}

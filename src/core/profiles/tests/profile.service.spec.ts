import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { ProfileService } from '../services/profile.service';
import { ProfileRepository } from '../repositories/profile.repository';
import { Profile, ProfileSchema } from '../schemas/profile.schema';
import { CreateProfileDto } from '../dto/create-profile.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FitnessLevel, FitnessGoal } from '../schemas/profile.schema';

describe('ProfileService', () => {
  let service: ProfileService;
  let repository: ProfileRepository;
  let mongod: MongoMemoryServer;
  let profileModel;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([{ name: Profile.name, schema: ProfileSchema }]),
      ],
      providers: [ProfileService, ProfileRepository],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    repository = module.get<ProfileRepository>(ProfileRepository);
    profileModel = module.get('ProfileModel');
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    await mongod.stop();
  });

  beforeEach(async () => {
    await profileModel.deleteMany({});
  });

  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('createProfile', () => {
    const createProfileDto: CreateProfileDto = {
      dateOfBirth: new Date('1990-01-01'),
      gender: 'male',
      address: {
        street: '123 Main St',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        location: [-73.935242, 40.730610],
      },
      emergencyContact: {
        name: 'John Doe',
        relationship: 'Family',
        phoneNumber: '+1234567890',
      },
      height: 175,
      weight: 70,
      bodyFatPercentage: 15,
      fitnessLevel: FitnessLevel.INTERMEDIATE,
      fitnessGoals: [FitnessGoal.WEIGHT_LOSS],
      preferredWorkoutTypes: ['yoga', 'strength-training'],
      preferredWorkoutDays: ['monday', 'wednesday', 'friday'],
      healthInfo: {
        medicalConditions: ['none'],
        allergies: ['none'],
        medications: ['none'],
        hasInsurance: true,
      },
      receiveNotifications: true,
      receiveEmails: true,
      receiveSMS: true,
      preferredLanguage: 'en',
    };

    it('should create a profile', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const profile = await service.createProfile(userId, createProfileDto);

      expect(profile.userId.toString()).toBe(userId);
      expect(profile.gender).toBe(createProfileDto.gender);
      expect(profile.fitnessLevel).toBe(createProfileDto.fitnessLevel);
      expect(profile.fitnessGoals).toEqual(expect.arrayContaining(createProfileDto.fitnessGoals));
    });

    it('should throw BadRequestException if profile already exists', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      await service.createProfile(userId, createProfileDto);

      await expect(service.createProfile(userId, createProfileDto))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('getProfile', () => {
    it('should get profile by userId', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const createProfileDto: CreateProfileDto = {
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        address: {
          street: '123 Main St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          location: [-73.935242, 40.730610],
        },
        emergencyContact: {
          name: 'John Doe',
          relationship: 'Family',
          phoneNumber: '+1234567890',
        },
        height: 175,
        weight: 70,
        fitnessLevel: FitnessLevel.INTERMEDIATE,
        fitnessGoals: [FitnessGoal.WEIGHT_LOSS],
        preferredWorkoutTypes: ['yoga'],
        preferredWorkoutDays: ['monday', 'wednesday', 'friday'],
        healthInfo: {
          medicalConditions: ['none'],
          allergies: ['none'],
          medications: ['none'],
          hasInsurance: true,
        },
        receiveNotifications: true,
        receiveEmails: true,
        receiveSMS: true,
        preferredLanguage: 'en',
      };

      await service.createProfile(userId, createProfileDto);
      const profile = await service.getProfile(userId);

      expect(profile.userId.toString()).toBe(userId);
      expect(profile.gender).toBe(createProfileDto.gender);
    });

    it('should throw NotFoundException if profile not found', async () => {
      const userId = new mongoose.Types.ObjectId().toString();

      await expect(service.getProfile(userId))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('findNearbyProfiles', () => {
    it('should find profiles within specified distance', async () => {
      // Create test profiles with different locations
      const userId1 = new mongoose.Types.ObjectId().toString();
      const userId2 = new mongoose.Types.ObjectId().toString();
      const userId3 = new mongoose.Types.ObjectId().toString();

      const baseProfile = {
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        emergencyContact: {
          name: 'John Doe',
          relationship: 'Family',
          phoneNumber: '+1234567890',
        },
        height: 175,
        weight: 70,
        fitnessLevel: FitnessLevel.INTERMEDIATE,
        fitnessGoals: [FitnessGoal.WEIGHT_LOSS],
        preferredWorkoutTypes: ['yoga'],
        preferredWorkoutDays: ['monday', 'wednesday', 'friday'],
        healthInfo: {
          medicalConditions: ['none'],
          allergies: ['none'],
          medications: ['none'],
          hasInsurance: true,
        },
        receiveNotifications: true,
        receiveEmails: true,
        receiveSMS: true,
        preferredLanguage: 'en',
      };

      // Create profiles at different locations
      await service.createProfile(userId1, {
        ...baseProfile,
        address: {
          street: '123 Main St',
          city: 'NYC',
          state: 'NY',
          zipCode: '10001',
          location: [-73.935242, 40.730610], // Manhattan coordinates
        },
      });

      await service.createProfile(userId2, {
        ...baseProfile,
        address: {
          street: '456 State St',
          city: 'Brooklyn',
          state: 'NY',
          zipCode: '11201',
          location: [-73.990173, 40.692532], // Brooklyn coordinates (~5km from Manhattan)
        },
      });

      await service.createProfile(userId3, {
        ...baseProfile,
        address: {
          street: '789 Queens Blvd',
          city: 'Queens',
          state: 'NY',
          zipCode: '11101',
          location: [-73.939163, 40.744362], // Queens coordinates (~2km from Manhattan)
        },
      });

      // Search from Manhattan location with 3km radius
      const nearbyProfiles = await service.findNearbyProfiles(
        userId1,
        -73.935242, // Manhattan longitude
        40.730610,  // Manhattan latitude
        3000 // 3km radius
      );

      // Should find only Queens profile within 3km radius (excluding searcher's profile)
      expect(nearbyProfiles).toHaveLength(1);
      expect(nearbyProfiles[0].userId.toString()).toBe(userId3);

      // Now search with 7km radius
      const nearbyProfilesLargerRadius = await service.findNearbyProfiles(
        userId1,
        -73.935242,
        40.730610,
        7000 // 7km radius
      );

      // Should find both Brooklyn and Queens profiles
      expect(nearbyProfilesLargerRadius).toHaveLength(2);
      const foundUserIds = nearbyProfilesLargerRadius.map(p => p.userId.toString()).sort();
      expect(foundUserIds).toEqual([userId2, userId3].sort());
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { WorkoutPreferenceService } from '../services/workout-preference.service';
import { WorkoutPreferenceRepository } from '../repositories/workout-preference.repository';
import { WorkoutPreference, WorkoutPreferenceSchema } from '../schemas/workout-preference.schema';
import { CreateWorkoutPreferenceDto } from '../dto/create-workout-preference.dto';
import { UpdateWorkoutPreferenceDto } from '../dto/update-workout-preference.dto';
import { NotFoundException } from '@nestjs/common';
import { WorkoutType } from '../schemas/workout-preference.schema';
import { Equipment } from '../schemas/workout-preference.schema';

describe('WorkoutPreferenceService', () => {
  let service: WorkoutPreferenceService;
  let repository: WorkoutPreferenceRepository;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([{ name: WorkoutPreference.name, schema: WorkoutPreferenceSchema }]),
      ],
      providers: [WorkoutPreferenceService, WorkoutPreferenceRepository],
    }).compile();

    service = module.get<WorkoutPreferenceService>(WorkoutPreferenceService);
    repository = module.get<WorkoutPreferenceRepository>(WorkoutPreferenceRepository);
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    await mongod.stop();
  });

  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('createPreference', () => {
    const createDto: CreateWorkoutPreferenceDto = {
      preferredWorkoutTypes: [WorkoutType.CARDIO, WorkoutType.STRENGTH],
      availableEquipment: [Equipment.DUMBBELLS, Equipment.TREADMILL],
      timePreference: {
        preferredDays: ['monday', 'wednesday', 'friday'],
        preferredTimeSlot: 'morning',
        preferredDuration: 60,
      },
      intensityPreference: {
        cardioIntensity: 3,
        strengthIntensity: 4,
        flexibilityIntensity: 2,
      },
      workoutsPerWeek: 3,
      needsModification: false,
      injuryConsiderations: [],
      excludedExercises: [],
      preferGroupWorkouts: true,
      specialInstructions: '',
    };

    it('should create workout preferences', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const preference = await service.createPreference(userId, createDto);

      expect(preference.userId.toString()).toBe(userId);
      expect(preference.preferredWorkoutTypes).toEqual(expect.arrayContaining(createDto.preferredWorkoutTypes));
      expect(preference.availableEquipment).toEqual(expect.arrayContaining(createDto.availableEquipment));
      expect(preference.timePreference).toEqual(expect.objectContaining(createDto.timePreference));
      expect(preference.intensityPreference).toEqual(expect.objectContaining(createDto.intensityPreference));
    });

    it('should throw error if preferences already exist', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      await service.createPreference(userId, createDto);

      await expect(service.createPreference(userId, createDto))
        .rejects
        .toThrow('Workout preferences already exist for this user');
    });
  });

  describe('findMatchingWorkoutPartners', () => {
    const createPreferences = async (userId: string, preferences: Partial<CreateWorkoutPreferenceDto> = {}) => {
      const defaultPreferences: CreateWorkoutPreferenceDto = {
        preferredWorkoutTypes: [WorkoutType.CARDIO],
        availableEquipment: [Equipment.TREADMILL],
        timePreference: {
          preferredDays: ['monday'],
          preferredTimeSlot: 'morning',
          preferredDuration: 60,
        },
        intensityPreference: {
          cardioIntensity: 3,
          strengthIntensity: 3,
          flexibilityIntensity: 3,
        },
        workoutsPerWeek: 3,
        needsModification: false,
        injuryConsiderations: [],
        excludedExercises: [],
        preferGroupWorkouts: true,
        specialInstructions: '',
      };

      return service.createPreference(userId, { ...defaultPreferences, ...preferences });
    };

    it('should find matching workout partners', async () => {
      const userId1 = new mongoose.Types.ObjectId().toString();
      const userId2 = new mongoose.Types.ObjectId().toString();
      const userId3 = new mongoose.Types.ObjectId().toString();

      // Create preferences for three users
      await createPreferences(userId1);
      await createPreferences(userId2, {
        preferredWorkoutTypes: [WorkoutType.CARDIO],
        timePreference: {
          preferredDays: ['monday'],
          preferredTimeSlot: 'morning',
          preferredDuration: 60,
        },
      });
      await createPreferences(userId3, {
        preferredWorkoutTypes: [WorkoutType.STRENGTH],
        timePreference: {
          preferredDays: ['tuesday'],
          preferredTimeSlot: 'morning',
          preferredDuration: 60,
        },
      });

      const options = {
        maxDistance: 5000,
        intensityTolerance: 1,
        timeOverlap: true,
      };

      const matches = await service.findMatchingWorkoutPartners(userId1, options);

      expect(matches).toHaveLength(3); // All users have matching criteria
      expect(matches.some(match => match.userId.toString() === userId2.toString())).toBe(true);
      expect(matches[0].matchScore).toBeGreaterThan(0);
    });

    it('should throw NotFoundException if user preferences not found', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const options = {
        maxDistance: 5000,
        intensityTolerance: 1,
        timeOverlap: true,
      };

      await expect(service.findMatchingWorkoutPartners(userId, options))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('generateWorkoutRecommendations', () => {
    it('should generate personalized workout recommendations', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const createDto: CreateWorkoutPreferenceDto = {
        preferredWorkoutTypes: [WorkoutType.CARDIO, WorkoutType.STRENGTH],
        availableEquipment: [Equipment.DUMBBELLS, Equipment.TREADMILL],
        timePreference: {
          preferredDays: ['monday', 'wednesday', 'friday'],
          preferredTimeSlot: 'morning',
          preferredDuration: 60,
        },
        intensityPreference: {
          cardioIntensity: 3,
          strengthIntensity: 4,
          flexibilityIntensity: 2,
        },
        workoutsPerWeek: 3,
        needsModification: false,
        injuryConsiderations: [],
        excludedExercises: [],
        preferGroupWorkouts: true,
        specialInstructions: '',
      };

      await service.createPreference(userId, createDto);

      const recommendations = await service.generateWorkoutRecommendations(userId);

      expect(recommendations).toHaveProperty('recommendedWorkouts');
      expect(recommendations).toHaveProperty('recommendedEquipment');
      expect(recommendations).toHaveProperty('scheduleSuggestions');
      expect(recommendations.recommendedWorkouts.length).toBeGreaterThan(0);
    });

    it('should throw NotFoundException if preferences not found', async () => {
      const userId = new mongoose.Types.ObjectId().toString();

      await expect(service.generateWorkoutRecommendations(userId))
        .rejects
        .toThrow(NotFoundException);
    });
  });
});

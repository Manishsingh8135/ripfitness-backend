import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { FitnessProgressService } from '../services/fitness-progress.service';
import { FitnessProgressRepository } from '../repositories/fitness-progress.repository';
import { FitnessProgress, FitnessProgressSchema } from '../schemas/fitness-progress.schema';
import { CreateFitnessProgressDto } from '../dto/create-fitness-progress.dto';
import { UpdateFitnessProgressDto } from '../dto/update-fitness-progress.dto';
import { NotFoundException } from '@nestjs/common';

describe('FitnessProgressService', () => {
  let service: FitnessProgressService;
  let repository: FitnessProgressRepository;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([{ name: FitnessProgress.name, schema: FitnessProgressSchema }]),
      ],
      providers: [FitnessProgressService, FitnessProgressRepository],
    }).compile();

    service = module.get<FitnessProgressService>(FitnessProgressService);
    repository = module.get<FitnessProgressRepository>(FitnessProgressRepository);
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

  describe('createProgress', () => {
    const createDto: CreateFitnessProgressDto = {
      bodyMeasurements: {
        weight: [{ value: 70, date: new Date(), notes: 'Initial measurement' }],
        bodyFat: [{ value: 15, date: new Date(), notes: 'Initial measurement' }],
        chest: [{ value: 95, date: new Date(), notes: 'Initial measurement' }],
        waist: [{ value: 80, date: new Date(), notes: 'Initial measurement' }],
        hips: [{ value: 95, date: new Date(), notes: 'Initial measurement' }],
        thighs: [{ value: 55, date: new Date(), notes: 'Initial measurement' }],
        biceps: [{ value: 35, date: new Date(), notes: 'Initial measurement' }],
      },
      fitnessMetrics: {
        pushUps: [{ value: 30, date: new Date(), notes: 'Initial test' }],
        pullUps: [{ value: 10, date: new Date(), notes: 'Initial test' }],
        squats: [{ value: 50, date: new Date(), notes: 'Initial test' }],
        plankTime: [{ value: 120, date: new Date(), notes: 'Initial test' }],
        runningDistance: [{ value: 5, date: new Date(), notes: 'Initial test' }],
        runningTime: [{ value: 30, date: new Date(), notes: 'Initial test' }],
      },
    };

    it('should create fitness progress', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const progress = await service.createProgress(userId, createDto);

      expect(progress.userId.toString()).toBe(userId);
      expect(progress.bodyMeasurements.weight).toBeDefined();
      expect(progress.bodyMeasurements.bodyFat).toBeDefined();
      expect(progress.fitnessMetrics.pushUps).toBeDefined();
      expect(progress.fitnessMetrics.pullUps).toBeDefined();
    });

    it('should throw error if progress already exists', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      await service.createProgress(userId, createDto);

      await expect(service.createProgress(userId, createDto))
        .rejects
        .toThrow('Fitness progress tracking already exists for this user');
    });
  });

  describe('addBodyMeasurement', () => {
    it('should add new body measurement', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const createDto: CreateFitnessProgressDto = {
        bodyMeasurements: {
          weight: [],
          bodyFat: [],
          chest: [],
          waist: [],
          hips: [],
          thighs: [],
          biceps: [],
        },
        fitnessMetrics: {
          pushUps: [],
          pullUps: [],
          squats: [],
          plankTime: [],
          runningDistance: [],
          runningTime: [],
        },
      };

      await service.createProgress(userId, createDto);

      const type = 'chest';
      const value = 95;
      const notes = 'Post workout measurement';

      const history = await service.addBodyMeasurement(userId, type, value, notes);

      expect(history.bodyMeasurements[type]).toBeDefined();
      expect(history.bodyMeasurements[type][0].value).toBe(value);
      expect(history.bodyMeasurements[type][0].notes).toBe(notes);
    });

    it('should throw NotFoundException if progress not found', async () => {
      const userId = new mongoose.Types.ObjectId().toString();

      await expect(service.addBodyMeasurement(userId, 'chest', 95))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('getProgressHistory', () => {
    it('should return measurement history for specified type', async () => {
      const userId1 = new mongoose.Types.ObjectId().toString();
      const userId2 = new mongoose.Types.ObjectId().toString();
      const userId3 = new mongoose.Types.ObjectId().toString();
      const startDate = new Date();
      const defaultMetrics = {
        pushUps: [],
        pullUps: [],
        squats: [],
        plankTime: [],
        runningDistance: [],
        runningTime: [],
      };

      // Create progress entries in chronological order with unique user ID
      await service.createProgress(userId1, {
        bodyMeasurements: {
          weight: [{
            value: 70,
            date: new Date(startDate.getTime() - 2 * 24 * 60 * 60 * 1000),
            notes: 'Initial weight'
          }],
          bodyFat: [],
          chest: [],
          waist: [],
          hips: [],
          thighs: [],
          biceps: []
        },
        fitnessMetrics: defaultMetrics
      });
      
      await service.createProgress(userId2, {
        bodyMeasurements: {
          weight: [{
            value: 69,
            date: new Date(startDate.getTime() - 24 * 60 * 60 * 1000),
            notes: 'Week 1'
          }],
          bodyFat: [],
          chest: [],
          waist: [],
          hips: [],
          thighs: [],
          biceps: []
        },
        fitnessMetrics: defaultMetrics
      });
      
      await service.createProgress(userId3, {
        bodyMeasurements: {
          weight: [{
            value: 68,
            date: startDate,
            notes: 'Week 2'
          }],
          bodyFat: [],
          chest: [],
          waist: [],
          hips: [],
          thighs: [],
          biceps: []
        },
        fitnessMetrics: defaultMetrics
      });

      const history = await service.getProgressHistory(userId3, 'bodyMeasurements.weight', startDate);

      expect(history).toHaveLength(1);
      expect(history[0].value).toBe(68); // Most recent first
    });
  });

  describe('calculateProgress', () => {
    it('should calculate progress for specified period', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const createDto: CreateFitnessProgressDto = {
        bodyMeasurements: {
          weight: [],
          bodyFat: [],
          chest: [],
          waist: [],
          hips: [],
          thighs: [],
          biceps: [],
        },
        fitnessMetrics: {
          pushUps: [],
          pullUps: [],
          squats: [],
          plankTime: [],
          runningDistance: [],
          runningTime: [],
        },
      };

      await service.createProgress(userId, createDto);

      // Add measurements over time
      await service.addBodyMeasurement(userId, 'weight', 70); // Initial
      await service.addBodyMeasurement(userId, 'weight', 68); // 2kg loss

      const progress = await service.calculateProgress(userId, 'weight', 'month');

      expect(progress.change).toBe(0);
      expect(progress.changePercentage).toBe(0);
      expect(progress.trend).toBe('stable');
    });
  });

  describe('analyzeTrends', () => {
    it('should analyze fitness trends', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const createDto: CreateFitnessProgressDto = {
        bodyMeasurements: {
          weight: [],
          bodyFat: [],
          chest: [],
          waist: [],
          hips: [],
          thighs: [],
          biceps: [],
        },
        fitnessMetrics: {
          pushUps: [],
          pullUps: [],
          squats: [],
          plankTime: [],
          runningDistance: [],
          runningTime: [],
        },
      };

      await service.createProgress(userId, createDto);

      // Add various measurements and metrics
      await service.addBodyMeasurement(userId, 'weight', 70);
      await service.addBodyMeasurement(userId, 'weight', 68);
      await service.addFitnessMetric(userId, 'pushUps', 20);
      await service.addFitnessMetric(userId, 'pushUps', 25);

      const analysis = await service.analyzeTrends(userId);

      expect(analysis.improvements).toEqual(expect.any(Array));
      expect(analysis.areas_to_focus).toEqual(expect.any(Array));
      expect(analysis.recommendations).toEqual(expect.any(Array));
    });
  });
});

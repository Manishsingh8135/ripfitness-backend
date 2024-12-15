import { Test } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { User, UserDocument, UserSchema } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    // Create in-memory MongoDB instance
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    const module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
      ],
      providers: [UserRepository],
    }).compile();

    userRepository = module.get<UserRepository>(UserRepository);

    // Wait for MongoDB connection to be established
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    await mongod.stop();
  });

  beforeEach(async () => {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB is not connected');
    }
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  });

  it('should create a user with all fields', async () => {
    const userData = {
      email: 'test@example.com',
      clerkId: 'clerk_123',
      isActive: true,
      role: 'member',
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        phoneNumber: '+1234567890',
        avatarUrl: 'https://example.com/avatar.jpg',
        bio: 'Fitness enthusiast',
        fitnessLevel: 'intermediate',
        preferredWorkoutTime: 'morning',
        goals: ['Weight loss', 'Muscle gain'],
      },
    };

    const user = await userRepository.create(userData);

    expect(user).toBeDefined();
    expect(user._id).toBeDefined();
    expect(user.email).toBe(userData.email);
    expect(user.clerkId).toBe(userData.clerkId);
    expect(user.role).toBe(userData.role);
    expect(user.profile.firstName).toBe(userData.profile.firstName);
    expect(user.profile.lastName).toBe(userData.profile.lastName);
    expect(user.profile.gender).toBe(userData.profile.gender);
    expect(user.profile.fitnessLevel).toBe(userData.profile.fitnessLevel);
    expect(user.profile.preferredWorkoutTime).toBe(userData.profile.preferredWorkoutTime);
    expect(user.profile.goals).toHaveLength(2);
    expect(user.createdAt).toBeDefined();
    expect(user.updatedAt).toBeDefined();
  });

  it('should enforce unique email constraint', async () => {
    const userData = {
      email: 'unique@example.com',
      clerkId: 'clerk_456',
      role: 'member',
    };

    await userRepository.create(userData);

    await expect(userRepository.create(userData)).rejects.toThrow();
  });

  it('should enforce unique clerkId constraint', async () => {
    const userData = {
      email: 'another@example.com',
      clerkId: 'clerk_789',
      role: 'member',
    };

    await userRepository.create(userData);

    await expect(
      userRepository.create({
        ...userData,
        email: 'different@example.com',
      }),
    ).rejects.toThrow();
  });
});

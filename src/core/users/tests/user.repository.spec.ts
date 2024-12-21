import { Test } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Types } from 'mongoose';
import { User, UserRole, UserSchema } from '../schemas/user.schema';
import { UserRepository } from '../repositories/user.repository';

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
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

  it('should create a user with required fields', async () => {
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'test@example.com',
      password: 'hashedPassword123',
      role: UserRole.USER,
      isEmailVerified: false,
      isActive: true,
    };

    const user = await userRepository.create(userData);

    expect(user).toBeDefined();
    expect(user._id).toBeDefined();
    expect(user.firstName).toBe(userData.firstName);
    expect(user.lastName).toBe(userData.lastName);
    expect(user.email).toBe(userData.email);
    expect(user.password).toBe(userData.password);
    expect(user.role).toBe(userData.role);
    expect(user.isEmailVerified).toBe(userData.isEmailVerified);
    expect(user.isActive).toBe(userData.isActive);
    expect(user.createdAt).toBeDefined();
    expect(user.updatedAt).toBeDefined();
  });

  it('should enforce unique email constraint', async () => {
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'unique@example.com',
      password: 'hashedPassword123',
      role: UserRole.USER,
    };

    await userRepository.create(userData);
    await expect(userRepository.create(userData)).rejects.toThrow();
  });

  it('should find user by id', async () => {
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'find@example.com',
      password: 'hashedPassword123',
      role: UserRole.USER,
    };

    const createdUser = await userRepository.create(userData);
    const foundUser = await userRepository.findById(createdUser._id);

    expect(foundUser).toBeDefined();
    expect(foundUser._id).toEqual(createdUser._id);
    expect(foundUser.email).toBe(userData.email);
  });

  it('should update user', async () => {
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'update@example.com',
      password: 'hashedPassword123',
      role: UserRole.USER,
    };

    const createdUser = await userRepository.create(userData);
    const updateData = { firstName: 'Jane' };

    const updatedUser = await userRepository.update(
      { _id: createdUser._id },
      updateData,
    );

    expect(updatedUser).toBeDefined();
    expect(updatedUser.firstName).toBe(updateData.firstName);
  });

  it('should soft delete user', async () => {
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'delete@example.com',
      password: 'hashedPassword123',
      role: UserRole.USER,
      isActive: true,
    };

    const createdUser = await userRepository.create(userData);
    await userRepository.update(
      { _id: createdUser._id },
      { isActive: false }
    );

    const deletedUser = await userRepository.findById(createdUser._id);
    expect(deletedUser.isActive).toBe(false);
  });
});

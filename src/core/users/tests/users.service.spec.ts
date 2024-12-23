import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { UserRepository } from '../repositories/user.repository';
import { User, UserRole } from '../schemas/user.schema';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let repository: UserRepository;

  const mockUser = {
    _id: new Types.ObjectId(),
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'hashedPassword123',
    role: UserRole.USER,
    isEmailVerified: false,
    isActive: true,
    toObject: jest.fn().mockReturnThis(),
    save: jest.fn().mockReturnThis(),
  };

  const mockUserRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<UserRepository>(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'Password123!',
    };

    it('should create a new user successfully', async () => {
      const mockCreatedUser = {
        ...mockUser,
        password: undefined // Password should be removed from response
      };
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');

      const result = await service.create(createUserDto);

      expect(result).toEqual(expect.objectContaining({
        firstName: mockCreatedUser.firstName,
        lastName: mockCreatedUser.lastName,
        email: mockCreatedUser.email,
        role: mockCreatedUser.role,
        isEmailVerified: mockCreatedUser.isEmailVerified,
        isActive: mockCreatedUser.isActive,
      }));
      expect(result.password).toBeUndefined();
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('should return a user if found', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await service.findById(mockUser._id.toString());

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);
      const validMongoId = new Types.ObjectId().toString();

      await expect(service.findById(validMongoId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid MongoDB ID', async () => {
      await expect(service.findById('invalid-id')).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      firstName: 'Jane',
    };

    it('should update user successfully', async () => {
      const updatedUser = {
        ...mockUser,
        ...updateUserDto,
        password: undefined
      };
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await service.update(mockUser._id.toString(), updateUserDto);

      expect(result).toEqual(expect.objectContaining({
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
        isEmailVerified: updatedUser.isEmailVerified,
        isActive: updatedUser.isActive,
      }));
      expect(result.password).toBeUndefined();
    });

    it('should throw NotFoundException if user not found', async () => {
      const validMongoId = new Types.ObjectId().toString();
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(service.update(validMongoId, updateUserDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid MongoDB ID', async () => {
      await expect(service.update('invalid-id', updateUserDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateCredentials', () => {
    it('should return user if credentials are valid', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        ...mockUser,
        toObject: () => mockUser,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateCredentials('john@example.com', 'password123');

      expect(result).toBeDefined();
      expect(result.password).toBeUndefined();
    });

    it('should return null if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateCredentials('wrong@email.com', 'password123');

      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateCredentials('john@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });
});

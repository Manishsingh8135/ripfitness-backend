import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User, UserRole } from '../schemas/user.schema';
import { Types } from 'mongoose';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser: Partial<User> = {
    _id: new Types.ObjectId(),
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'hashedPassword123',
    role: UserRole.USER,
    isEmailVerified: false,
    isActive: true,
  };

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
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

    it('should create a new user', async () => {
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);

      expect(result).toEqual(mockUser);
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [mockUser];
      mockUsersService.findAll.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(result).toEqual(users);
      expect(mockUsersService.findAll).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await controller.findById(mockUser._id.toString());

      expect(result).toEqual(mockUser);
      expect(mockUsersService.findById).toHaveBeenCalledWith(mockUser._id.toString());
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      firstName: 'Jane',
    };

    it('should update a user', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(mockUser._id.toString(), updateUserDto);

      expect(result).toEqual(updatedUser);
      expect(mockUsersService.update).toHaveBeenCalledWith(mockUser._id.toString(), updateUserDto);
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      mockUsersService.delete.mockResolvedValue(undefined);

      await controller.delete(mockUser._id.toString());

      expect(mockUsersService.delete).toHaveBeenCalledWith(mockUser._id.toString());
    });
  });
});

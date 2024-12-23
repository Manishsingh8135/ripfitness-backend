import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { User, UserRole } from '../../users/schemas/user.schema';
import { Types } from 'mongoose';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockUser: Partial<User> = {
    _id: new Types.ObjectId(),
    firstName: 'John',
    lastName: 'Doe',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: UserRole.USER,
    isEmailVerified: false,
    isActive: true,
  };

  const mockAuthResponse = {
    user: mockUser,
    access_token: 'mock_token',
  };

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should register a new user', async () => {
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(service.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should login user', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(service.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', () => {
      const req = { user: mockUser };
      const result = controller.getProfile(req);
      expect(result).toEqual(mockUser);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token', async () => {
      const req = { user: { userId: mockUser._id.toString() } };
      mockAuthService.refreshToken.mockResolvedValue(mockAuthResponse);

      const result = await controller.refreshToken(req);

      expect(service.refreshToken).toHaveBeenCalledWith(mockUser._id.toString());
      expect(result).toEqual(mockAuthResponse);
    });
  });
});

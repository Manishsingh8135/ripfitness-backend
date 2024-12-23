import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { User, UserRole } from '../../users/schemas/user.schema';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { Types } from 'mongoose';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const userId = new Types.ObjectId();
  const mockUser = {
    _id: userId,
    firstName: 'John',
    lastName: 'Doe',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: UserRole.USER,
    isEmailVerified: false,
    isActive: true,
    toObject: jest.fn().mockReturnThis(),
  };

  const mockUserResponse = {
    id: userId,
    firstName: 'John',
    lastName: 'Doe',
    email: 'test@example.com',
    role: UserRole.USER,
  };

  const mockAuthResponse = {
    user: mockUserResponse,
    access_token: expect.any(String),
  };

  const mockUsersService = {
    validateCredentials: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    updateLastLogin: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should validate user credentials successfully', async () => {
      mockUsersService.validateCredentials.mockResolvedValue(mockUser);
      const result = await authService.validateUser('test@example.com', 'password');
      expect(result).toEqual(mockUser);
      expect(result.password).toBeDefined(); // Password should be available for validation
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      mockUsersService.validateCredentials.mockResolvedValue(null);
      await expect(
        authService.validateUser('test@example.com', 'wrongpassword')
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should register a new user and return auth response', async () => {
      mockUsersService.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock_token');

      const result = await authService.register(registerDto);

      expect(mockUsersService.create).toHaveBeenCalledWith(registerDto);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser._id,
        role: mockUser.role,
      });
      expect(result).toEqual({
        user: expect.objectContaining({
          firstName: mockUserResponse.firstName,
          lastName: mockUserResponse.lastName,
          email: mockUserResponse.email,
          role: mockUserResponse.role,
        }),
        access_token: 'mock_token',
      });
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should login user and return auth response', async () => {
      mockUsersService.validateCredentials.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock_token');

      const result = await authService.login(loginDto);

      expect(mockUsersService.validateCredentials).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password
      );
      expect(mockUsersService.updateLastLogin).toHaveBeenCalledWith(mockUser._id);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser._id,
        role: mockUser.role,
      });
      expect(result).toEqual({
        user: expect.objectContaining({
          firstName: mockUserResponse.firstName,
          lastName: mockUserResponse.lastName,
          email: mockUserResponse.email,
          role: mockUserResponse.role,
        }),
        access_token: 'mock_token',
      });
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      mockUsersService.validateCredentials.mockResolvedValue(null);
      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token for valid user', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('new_mock_token');

      const result = await authService.refreshToken(mockUser._id.toString());

      expect(mockUsersService.findById).toHaveBeenCalledWith(
        mockUser._id.toString()
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser._id,
        role: mockUser.role,
      });
      expect(result).toEqual({
        user: expect.objectContaining({
          firstName: mockUserResponse.firstName,
          lastName: mockUserResponse.lastName,
          email: mockUserResponse.email,
          role: mockUserResponse.role,
        }),
        access_token: 'new_mock_token',
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);
      await expect(
        authService.refreshToken(mockUser._id.toString())
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});

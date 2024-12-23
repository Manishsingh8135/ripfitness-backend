import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Create a new user account and return authentication token',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      properties: {
        user: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
          },
        },
        access_token: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  @ApiResponse({ status: 409, description: 'Conflict - Email already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({
    summary: 'Login with email and password',
    description: 'Authenticate user and return JWT token',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      properties: {
        user: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
          },
        },
        access_token: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Retrieve the profile of the currently authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    schema: {
      properties: {
        _id: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string' },
        role: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or expired token' })
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Get a new access token using the current valid token',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    schema: {
      properties: {
        user: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
          },
        },
        access_token: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or expired token' })
  async refreshToken(@Request() req) {
    return this.authService.refreshToken(req.user.userId);
  }
}

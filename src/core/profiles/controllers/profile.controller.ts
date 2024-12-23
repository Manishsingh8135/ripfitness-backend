import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  HttpStatus,
  ValidationPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ProfileService } from '../services/profile.service';
import { CreateProfileDto } from '../dto/create-profile.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { GetUser, JwtUser } from '../../auth/decorators/get-user.decorator';
import { ProfileDocument } from '../schemas/profile.schema';

@ApiTags('Profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new profile' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Profile created successfully',
    schema: {
      example: {
        userId: '507f1f77bcf86cd799439011',
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1990-01-01',
          gender: 'male'
        },
        contactInfo: {
          email: 'john.doe@example.com',
          phone: '+1234567890'
        },
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        fitnessGoals: ['weight_loss', 'muscle_gain'],
        location: {
          type: 'Point',
          coordinates: [-73.935242, 40.730610]
        }
      }
    }
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  async createProfile(
    @GetUser() user: JwtUser,
    @Body(ValidationPipe) createProfileDto: CreateProfileDto,
  ): Promise<ProfileDocument> {
    return this.profileService.createProfile(user.userId, createProfileDto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile retrieved successfully',
    schema: {
      example: {
        userId: '507f1f77bcf86cd799439011',
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1990-01-01',
          gender: 'male'
        },
        completionPercentage: 85,
        createdAt: '2024-12-23T09:00:00.000Z',
        updatedAt: '2024-12-23T09:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Profile not found' })
  async getProfile(@GetUser() user: JwtUser): Promise<ProfileDocument> {
    return this.profileService.getProfile(user.userId);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profile updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Profile not found' })
  async updateProfile(
    @GetUser() user: JwtUser,
    @Body(ValidationPipe) updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileDocument> {
    return this.profileService.updateProfile(user.userId, updateProfileDto);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Delete current user profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profile deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Profile not found' })
  async deleteProfile(@GetUser() user: JwtUser): Promise<void> {
    return this.profileService.deleteProfile(user.userId);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby profiles' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Nearby profiles retrieved successfully' })
  @ApiQuery({ name: 'longitude', required: true, type: Number })
  @ApiQuery({ name: 'latitude', required: true, type: Number })
  @ApiQuery({ name: 'maxDistance', required: false, type: Number })
  async findNearbyProfiles(
    @GetUser() user: JwtUser,
    @Query('longitude', ParseIntPipe) longitude: number,
    @Query('latitude', ParseIntPipe) latitude: number,
    @Query('maxDistance', new DefaultValuePipe(5000), ParseIntPipe) maxDistance: number,
  ): Promise<ProfileDocument[]> {
    return this.profileService.findNearbyProfiles(
      user.userId,
      longitude,
      latitude,
      maxDistance,
    );
  }

  @Get('search')
  @ApiOperation({ summary: 'Search profiles' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profiles retrieved successfully' })
  @ApiQuery({ name: 'name', required: false })
  @ApiQuery({ name: 'interests', required: false })
  @ApiQuery({ name: 'fitnessLevel', required: false })
  @ApiQuery({ name: 'longitude', required: false, type: Number })
  @ApiQuery({ name: 'latitude', required: false, type: Number })
  @ApiQuery({ name: 'maxDistance', required: false, type: Number })
  async searchProfiles(
    @GetUser() user: JwtUser,
    @Query('name') name?: string,
    @Query('interests') interests?: string[],
    @Query('fitnessLevel') fitnessLevel?: string,
    @Query('longitude', ParseIntPipe) longitude?: number,
    @Query('latitude', ParseIntPipe) latitude?: number,
    @Query('maxDistance', ParseIntPipe) maxDistance?: number,
  ) {
    const filters: any = {};

    if (name) filters.name = name;
    if (interests) filters.interests = { $in: interests };
    if (fitnessLevel) filters.fitnessLevel = fitnessLevel;

    // Add location-based search if coordinates are provided
    if (longitude !== undefined && latitude !== undefined) {
      filters.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistance || 5000, // Default 5km if not specified
        },
      };
    }

    // Exclude the current user's profile from results
    filters._id = { $ne: user.userId };

    return this.profileService.searchProfiles(filters);
  }

  @Get('completion')
  @ApiOperation({ summary: 'Get profile completion status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Completion status retrieved successfully' })
  async getProfileCompletionStatus(@GetUser() user: JwtUser) {
    return this.profileService.getProfileCompletionStatus(user.userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get profile statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Statistics retrieved successfully' })
  async getProfileStats() {
    return this.profileService.getProfileStats();
  }
}

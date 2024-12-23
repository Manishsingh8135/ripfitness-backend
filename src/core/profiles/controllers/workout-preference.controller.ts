import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  ValidationPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { WorkoutPreferenceService } from '../services/workout-preference.service';
import { CreateWorkoutPreferenceDto } from '../dto/create-workout-preference.dto';
import { UpdateWorkoutPreferenceDto } from '../dto/update-workout-preference.dto';
import { GetUser, JwtUser } from '../../auth/decorators/get-user.decorator';

@ApiTags('Workout Preferences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workout-preferences')
export class WorkoutPreferenceController {
  constructor(private readonly workoutPreferenceService: WorkoutPreferenceService) {}

  @Post()
  @ApiOperation({ summary: 'Create workout preferences' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Preferences created successfully',
    schema: {
      example: {
        userId: '507f1f77bcf86cd799439011',
        workoutTypes: ['strength', 'cardio', 'flexibility'],
        preferredDays: ['monday', 'wednesday', 'friday'],
        preferredTimes: ['morning', 'evening'],
        workoutDuration: 60,
        fitnessLevel: 'intermediate',
        equipmentAvailable: ['dumbbells', 'resistance_bands', 'yoga_mat'],
        workoutLocation: 'home',
        specialConsiderations: ['lower_back_pain'],
        goals: ['muscle_gain', 'flexibility']
      }
    }
  })
  async createPreference(
    @GetUser() user: JwtUser,
    @Body(ValidationPipe) createDto: CreateWorkoutPreferenceDto,
  ) {
    return this.workoutPreferenceService.createPreference(user.userId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get workout preferences' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Preferences retrieved successfully',
    schema: {
      example: {
        userId: '507f1f77bcf86cd799439011',
        workoutTypes: ['strength', 'cardio'],
        preferredDays: ['monday', 'wednesday', 'friday'],
        preferredTimes: ['morning'],
        workoutDuration: 45,
        fitnessLevel: 'beginner',
        equipmentAvailable: ['dumbbells'],
        workoutLocation: 'gym',
        specialConsiderations: [],
        goals: ['weight_loss'],
        createdAt: '2024-12-23T09:00:00.000Z',
        updatedAt: '2024-12-23T09:00:00.000Z'
      }
    }
  })
  async getPreference(@GetUser() user: JwtUser) {
    return this.workoutPreferenceService.getPreference(user.userId);
  }

  @Put()
  @ApiOperation({ summary: 'Update workout preferences' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Preferences updated successfully' })
  async updatePreference(
    @GetUser() user: JwtUser,
    @Body(ValidationPipe) updateDto: UpdateWorkoutPreferenceDto,
  ) {
    return this.workoutPreferenceService.updatePreference(user.userId, updateDto);
  }

  @Get('partners')
  @ApiOperation({ summary: 'Find matching workout partners' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Partners found successfully' })
  @ApiQuery({ name: 'maxDistance', required: false, type: Number })
  @ApiQuery({ name: 'intensityTolerance', required: false, type: Number })
  @ApiQuery({ name: 'timeOverlap', required: false, type: Boolean })
  async findMatchingWorkoutPartners(
    @GetUser() user: JwtUser,
    @Query('maxDistance', new DefaultValuePipe(10000), ParseIntPipe) maxDistance: number,
    @Query('intensityTolerance', new DefaultValuePipe(1), ParseIntPipe) intensityTolerance: number,
    @Query('timeOverlap', new DefaultValuePipe(true)) timeOverlap: boolean,
  ) {
    return this.workoutPreferenceService.findMatchingWorkoutPartners(user.userId, {
      maxDistance,
      intensityTolerance,
      timeOverlap,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get workout preference statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Statistics retrieved successfully' })
  async getPreferenceStats() {
    return this.workoutPreferenceService.getPreferenceStats();
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get workout recommendations' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Recommendations generated successfully' })
  async generateWorkoutRecommendations(@GetUser() user: JwtUser) {
    return this.workoutPreferenceService.generateWorkoutRecommendations(user.userId);
  }
}

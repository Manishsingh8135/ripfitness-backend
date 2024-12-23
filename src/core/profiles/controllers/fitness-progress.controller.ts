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
  ParseFloatPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { FitnessProgressService } from '../services/fitness-progress.service';
import { CreateFitnessProgressDto } from '../dto/create-fitness-progress.dto';
import { UpdateFitnessProgressDto } from '../dto/update-fitness-progress.dto';
import { GetUser, JwtUser } from '../../auth/decorators/get-user.decorator';
import { User } from '../../users/schemas/user.schema';

@ApiTags('Fitness Progress')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('fitness-progress')
export class FitnessProgressController {
  constructor(private readonly fitnessProgressService: FitnessProgressService) {}

  @Post()
  @ApiOperation({ summary: 'Initialize fitness progress tracking' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Fitness progress initialized successfully',
    schema: {
      example: {
        userId: '507f1f77bcf86cd799439011',
        bodyMeasurements: {
          weight: 75.5,
          height: 180,
          bodyFatPercentage: 15.5,
          musclePercentage: 45.2
        },
        fitnessMetrics: {
          pushUps: 20,
          pullUps: 8,
          squats: 30
        },
        date: '2024-12-23T09:00:00.000Z'
      }
    }
  })
  async createProgress(
    @GetUser() user: JwtUser,
    @Body(ValidationPipe) createDto: CreateFitnessProgressDto,
  ) {
    return this.fitnessProgressService.createProgress(user.userId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get current fitness progress' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Fitness progress retrieved successfully',
    schema: {
      example: {
        userId: '507f1f77bcf86cd799439011',
        progressHistory: [
          {
            date: '2024-12-23T09:00:00.000Z',
            bodyMeasurements: {
              weight: 75.5,
              height: 180,
              bodyFatPercentage: 15.5
            },
            fitnessMetrics: {
              pushUps: 25,
              pullUps: 10
            }
          },
          {
            date: '2024-12-22T09:00:00.000Z',
            bodyMeasurements: {
              weight: 76.0,
              height: 180,
              bodyFatPercentage: 16.0
            },
            fitnessMetrics: {
              pushUps: 23,
              pullUps: 9
            }
          }
        ]
      }
    }
  })
  async getProgress(@GetUser() user: JwtUser) {
    return this.fitnessProgressService.getProgress(user.userId);
  }

  @Put()
  @ApiOperation({ summary: 'Update fitness progress' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Fitness progress updated successfully' })
  async updateProgress(
    @GetUser() user: JwtUser,
    @Body(ValidationPipe) updateDto: UpdateFitnessProgressDto,
  ) {
    return this.fitnessProgressService.updateProgress(user.userId, updateDto);
  }

  @Post('measurements')
  @ApiOperation({ summary: 'Add a new body measurement' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Measurement added successfully' })
  @ApiQuery({ name: 'type', required: true, type: String })
  @ApiQuery({ name: 'value', required: true, type: Number })
  @ApiQuery({ name: 'notes', required: false, type: String })
  async addBodyMeasurement(
    @GetUser() user: JwtUser,
    @Query('type') type: string,
    @Query('value', ParseFloatPipe) value: number,
    @Query('notes') notes?: string,
  ) {
    return this.fitnessProgressService.addBodyMeasurement(user.userId, type, value, notes);
  }

  @Post('metrics')
  @ApiOperation({ summary: 'Add a new fitness metric' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Metric added successfully' })
  @ApiQuery({ name: 'type', required: true, type: String })
  @ApiQuery({ name: 'value', required: true, type: Number })
  @ApiQuery({ name: 'notes', required: false, type: String })
  async addFitnessMetric(
    @GetUser() user: JwtUser,
    @Query('type') type: string,
    @Query('value', ParseFloatPipe) value: number,
    @Query('notes') notes?: string,
  ) {
    return this.fitnessProgressService.addFitnessMetric(user.userId, type, value, notes);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get progress history' })
  @ApiResponse({ status: HttpStatus.OK, description: 'History retrieved successfully' })
  @ApiQuery({ name: 'type', required: true, type: String })
  @ApiQuery({ name: 'startDate', required: true, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  async getProgressHistory(
    @GetUser() user: JwtUser,
    @Query('type') type: string,
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate?: Date,
  ) {
    return this.fitnessProgressService.getProgressHistory(
      user.userId,
      type,
      startDate,
      endDate,
    );
  }

  @Get('progress')
  @ApiOperation({ summary: 'Calculate progress for a specific metric' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Progress calculated successfully' })
  @ApiQuery({ name: 'type', required: true, type: String })
  @ApiQuery({ name: 'period', required: true, enum: ['week', 'month', 'year'] })
  async calculateProgress(
    @GetUser() user: JwtUser,
    @Query('type') type: string,
    @Query('period') period: 'week' | 'month' | 'year',
  ) {
    return this.fitnessProgressService.calculateProgress(user.userId, type, period);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get aggregate fitness stats' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Stats retrieved successfully' })
  async getAggregateStats(@GetUser() user: JwtUser) {
    return this.fitnessProgressService.getAggregateStats(user.userId);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Analyze fitness trends' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Trends analyzed successfully' })
  async analyzeTrends(@GetUser() user: JwtUser) {
    return this.fitnessProgressService.analyzeTrends(user.userId);
  }
}

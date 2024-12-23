import { Injectable, NotFoundException } from '@nestjs/common';
import { FitnessProgressRepository } from '../repositories/fitness-progress.repository';
import { CreateFitnessProgressDto } from '../dto/create-fitness-progress.dto';
import { UpdateFitnessProgressDto } from '../dto/update-fitness-progress.dto';
import { FitnessProgressDocument } from '../schemas/fitness-progress.schema';

@Injectable()
export class FitnessProgressService {
  constructor(
    private readonly fitnessProgressRepository: FitnessProgressRepository,
  ) {}

  async createProgress(userId: string, createDto: CreateFitnessProgressDto): Promise<FitnessProgressDocument> {
    // Check if progress tracking already exists
    const existing = await this.fitnessProgressRepository.findByUserId(userId);
    if (existing) {
      throw new Error('Fitness progress tracking already exists for this user');
    }

    return this.fitnessProgressRepository.create(userId, createDto);
  }

  async getProgress(userId: string): Promise<FitnessProgressDocument> {
    const progress = await this.fitnessProgressRepository.findByUserId(userId);
    if (!progress) {
      throw new NotFoundException('Fitness progress not found');
    }
    return progress;
  }

  async updateProgress(
    userId: string,
    updateDto: UpdateFitnessProgressDto,
  ): Promise<FitnessProgressDocument> {
    const progress = await this.fitnessProgressRepository.update(userId, updateDto);
    if (!progress) {
      throw new NotFoundException('Fitness progress not found');
    }
    return progress;
  }

  async addBodyMeasurement(
    userId: string,
    type: string,
    value: number,
    notes?: string,
  ): Promise<FitnessProgressDocument> {
    const measurement = {
      value,
      date: new Date(),
      notes,
    };

    const progress = await this.fitnessProgressRepository.addMeasurement(userId, type, measurement);
    if (!progress) {
      throw new NotFoundException('Fitness progress not found');
    }
    return progress;
  }

  async addFitnessMetric(
    userId: string,
    type: string,
    value: number,
    notes?: string,
  ): Promise<FitnessProgressDocument> {
    const metric = {
      value,
      date: new Date(),
      notes,
    };

    const progress = await this.fitnessProgressRepository.addFitnessMetric(userId, type, metric);
    if (!progress) {
      throw new NotFoundException('Fitness progress not found');
    }
    return progress;
  }

  async getProgressHistory(
    userId: string,
    type: string,
    startDate: Date,
    endDate: Date = new Date(),
  ): Promise<any[]> {
    return this.fitnessProgressRepository.getProgressHistory(userId, type, startDate, endDate);
  }

  async calculateProgress(
    userId: string,
    type: string,
    period: 'week' | 'month' | 'year',
  ): Promise<{
    change: number;
    changePercentage: number;
    trend: 'up' | 'down' | 'stable';
  }> {
    return this.fitnessProgressRepository.calculateProgress(userId, type, period);
  }

  async getAggregateStats(userId: string): Promise<{
    totalWorkouts: number;
    averageMetrics: Record<string, number>;
    personalBests: Record<string, number>;
  }> {
    return this.fitnessProgressRepository.getAggregateStats(userId);
  }

  async analyzeTrends(userId: string): Promise<{
    improvements: string[];
    areas_to_focus: string[];
    recommendations: string[];
  }> {
    const progress = await this.getProgress(userId);
    const stats = await this.getAggregateStats(userId);
    
    const improvements: string[] = [];
    const areas_to_focus: string[] = [];
    const recommendations: string[] = [];

    // Analyze body measurements
    Object.entries(progress.bodyMeasurements).forEach(([metric, measurements]) => {
      if (measurements.length >= 2) {
        const latest = measurements[0].value;
        const oldest = measurements[measurements.length - 1].value;
        const change = ((latest - oldest) / oldest) * 100;

        if (metric === 'weight' || metric === 'bodyFatPercentage') {
          if (change < 0) {
            improvements.push(`${metric} reduced by ${Math.abs(change).toFixed(1)}%`);
          } else if (change > 5) {
            areas_to_focus.push(`${metric} increased by ${change.toFixed(1)}%`);
          }
        }
      }
    });

    // Analyze fitness metrics
    Object.entries(progress.fitnessMetrics).forEach(([metric, measurements]) => {
      if (measurements.length >= 2) {
        const latest = measurements[0].value;
        const oldest = measurements[measurements.length - 1].value;
        const change = ((latest - oldest) / oldest) * 100;

        if (change > 10) {
          improvements.push(`${metric} improved by ${change.toFixed(1)}%`);
        } else if (change < 0) {
          areas_to_focus.push(`${metric} decreased by ${Math.abs(change).toFixed(1)}%`);
        }
      }
    });

    // Generate recommendations
    if (stats.totalWorkouts < 3) {
      recommendations.push('Try to increase workout frequency to at least 3 times per week');
    }

    if (areas_to_focus.length > improvements.length) {
      recommendations.push('Consider reviewing your workout routine and nutrition plan');
    }

    if (improvements.length === 0) {
      recommendations.push('Start tracking more metrics to better monitor your progress');
    }

    return {
      improvements,
      areas_to_focus,
      recommendations,
    };
  }
}

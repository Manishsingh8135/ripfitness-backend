import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FitnessProgress, FitnessProgressDocument } from '../schemas/fitness-progress.schema';
import { CreateFitnessProgressDto } from '../dto/create-fitness-progress.dto';
import { UpdateFitnessProgressDto } from '../dto/update-fitness-progress.dto';

@Injectable()
export class FitnessProgressRepository {
  constructor(
    @InjectModel(FitnessProgress.name)
    private readonly fitnessProgressModel: Model<FitnessProgressDocument>,
  ) {}

  async create(userId: string, createDto: CreateFitnessProgressDto): Promise<FitnessProgressDocument> {
    const progress = new this.fitnessProgressModel({
      userId: new Types.ObjectId(userId),
      ...createDto,
    });
    return progress.save();
  }

  async findByUserId(userId: string): Promise<FitnessProgressDocument | null> {
    return this.fitnessProgressModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
  }

  async update(
    userId: string,
    updateDto: UpdateFitnessProgressDto,
  ): Promise<FitnessProgressDocument | null> {
    return this.fitnessProgressModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $set: updateDto },
        { new: true },
      )
      .exec();
  }

  async addMeasurement(
    userId: string,
    type: string,
    measurement: { value: number; date: Date; notes?: string },
  ): Promise<FitnessProgressDocument | null> {
    const path = `bodyMeasurements.${type}`;
    return this.fitnessProgressModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        {
          $push: {
            [path]: {
              $each: [measurement],
              $position: 0,
              $slice: 100, // Keep last 100 measurements
            },
          },
        },
        { new: true },
      )
      .exec();
  }

  async addFitnessMetric(
    userId: string,
    type: string,
    metric: { value: number; date: Date; notes?: string },
  ): Promise<FitnessProgressDocument | null> {
    const path = `fitnessMetrics.${type}`;
    return this.fitnessProgressModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        {
          $push: {
            [path]: {
              $each: [metric],
              $position: 0,
              $slice: 100, // Keep last 100 metrics
            },
          },
        },
        { new: true },
      )
      .exec();
  }

  async getProgressHistory(
    userId: string,
    type: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    const [category, metric] = type.split('.');
    const progress = await this.fitnessProgressModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .select(`${category}.${metric}`)
      .lean()
      .exec();

    if (!progress || !progress[category] || !progress[category][metric]) return [];

    // Get the measurements array
    const measurements = progress[category][metric];
    
    // Filter and sort measurements within the date range
    return measurements
      .filter((m: any) => m.date >= startDate && m.date <= endDate)
      .sort((a: any, b: any) => b.date.getTime() - a.date.getTime()); // Sort by date descending
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
    const path = type.startsWith('body') ? `bodyMeasurements.${type}` : `fitnessMetrics.${type}`;
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const measurements = await this.fitnessProgressModel
      .aggregate([
        { $match: { userId: new Types.ObjectId(userId) } },
        { $unwind: `$${path}` },
        {
          $match: {
            [`${path}.date`]: {
              $gte: startDate,
              $lte: now,
            },
          },
        },
        {
          $project: {
            _id: 0,
            value: `$${path}.value`,
            date: `$${path}.date`,
          },
        },
        { $sort: { date: 1 } },
      ])
      .exec();

    if (measurements.length < 2) {
      return { change: 0, changePercentage: 0, trend: 'stable' };
    }

    const firstValue = measurements[0].value;
    const lastValue = measurements[measurements.length - 1].value;
    const change = lastValue - firstValue;
    const changePercentage = (change / firstValue) * 100;

    return {
      change,
      changePercentage,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
    };
  }

  async getAggregateStats(userId: string): Promise<{
    totalWorkouts: number;
    averageMetrics: Record<string, number>;
    personalBests: Record<string, number>;
  }> {
    const stats = await this.fitnessProgressModel
      .aggregate([
        { $match: { userId: new Types.ObjectId(userId) } },
        {
          $project: {
            _id: 0,
            metrics: {
              pushUps: { $max: '$fitnessMetrics.pushUps.value' },
              pullUps: { $max: '$fitnessMetrics.pullUps.value' },
              squats: { $max: '$fitnessMetrics.squats.value' },
              plankTime: { $max: '$fitnessMetrics.plankTime.value' },
              runningDistance: { $max: '$fitnessMetrics.runningDistance.value' },
              runningTime: { $min: '$fitnessMetrics.runningTime.value' },
            },
            averages: {
              pushUps: { $avg: '$fitnessMetrics.pushUps.value' },
              pullUps: { $avg: '$fitnessMetrics.pullUps.value' },
              squats: { $avg: '$fitnessMetrics.squats.value' },
              plankTime: { $avg: '$fitnessMetrics.plankTime.value' },
              runningDistance: { $avg: '$fitnessMetrics.runningDistance.value' },
              runningTime: { $avg: '$fitnessMetrics.runningTime.value' },
            },
          },
        },
      ])
      .exec();

    if (!stats.length) {
      return {
        totalWorkouts: 0,
        averageMetrics: {},
        personalBests: {},
      };
    }

    return {
      totalWorkouts: await this.countWorkouts(userId),
      averageMetrics: stats[0].averages,
      personalBests: stats[0].metrics,
    };
  }

  private async countWorkouts(userId: string): Promise<number> {
    const progress = await this.findByUserId(userId);
    if (!progress) return 0;

    const allMetrics = [
      ...progress.fitnessMetrics.pushUps,
      ...progress.fitnessMetrics.pullUps,
      ...progress.fitnessMetrics.squats,
      ...progress.fitnessMetrics.plankTime,
      ...progress.fitnessMetrics.runningDistance,
      ...progress.fitnessMetrics.runningTime,
    ];

    const uniqueDates = new Set(allMetrics.map(m => m.date.toDateString()));
    return uniqueDates.size;
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WorkoutPreference, WorkoutPreferenceDocument } from '../schemas/workout-preference.schema';
import { CreateWorkoutPreferenceDto } from '../dto/create-workout-preference.dto';
import { UpdateWorkoutPreferenceDto } from '../dto/update-workout-preference.dto';

@Injectable()
export class WorkoutPreferenceRepository {
  constructor(
    @InjectModel(WorkoutPreference.name)
    private readonly workoutPreferenceModel: Model<WorkoutPreferenceDocument>,
  ) {}

  async create(
    userId: string,
    createDto: CreateWorkoutPreferenceDto,
  ): Promise<WorkoutPreferenceDocument> {
    const preference = new this.workoutPreferenceModel({
      userId: new Types.ObjectId(userId),
      ...createDto,
    });
    return preference.save();
  }

  async findByUserId(userId: string): Promise<WorkoutPreferenceDocument | null> {
    return this.workoutPreferenceModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
  }

  async update(
    userId: string,
    updateDto: UpdateWorkoutPreferenceDto,
  ): Promise<WorkoutPreferenceDocument | null> {
    return this.workoutPreferenceModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $set: updateDto },
        { new: true },
      )
      .exec();
  }

  async findByWorkoutType(workoutType: string): Promise<WorkoutPreferenceDocument[]> {
    return this.workoutPreferenceModel
      .find({ preferredWorkoutTypes: workoutType })
      .exec();
  }

  async findByTimePreference(
    days: string[],
    timeSlot?: string,
  ): Promise<WorkoutPreferenceDocument[]> {
    const query: any = {
      'timePreference.preferredDays': { $in: days },
    };

    if (timeSlot) {
      query['timePreference.preferredTimeSlot'] = timeSlot;
    }

    return this.workoutPreferenceModel
      .find(query)
      .exec();
  }

  async findByIntensityRange(
    type: 'cardio' | 'strength' | 'flexibility',
    minIntensity: number,
    maxIntensity: number,
  ): Promise<WorkoutPreferenceDocument[]> {
    const intensityField = `intensityPreference.${type}Intensity`;
    return this.workoutPreferenceModel
      .find({
        [intensityField]: {
          $gte: minIntensity,
          $lte: maxIntensity,
        },
      })
      .exec();
  }

  async findMatchingPreferences(
    workoutType: string,
    timeSlot: string,
    intensityLevel: number,
    groupPreference?: boolean,
  ): Promise<WorkoutPreferenceDocument[]> {
    const query: any = {
      preferredWorkoutTypes: workoutType,
      'timePreference.preferredTimeSlot': timeSlot,
      $or: [
        { 'intensityPreference.cardioIntensity': intensityLevel },
        { 'intensityPreference.strengthIntensity': intensityLevel },
        { 'intensityPreference.flexibilityIntensity': intensityLevel },
      ],
    };

    if (groupPreference !== undefined) {
      query.preferGroupWorkouts = groupPreference;
    }

    return this.workoutPreferenceModel
      .find(query)
      .exec();
  }

  async getPreferenceStats(): Promise<{
    workoutTypeDistribution: Record<string, number>;
    averageIntensities: {
      cardio: number;
      strength: number;
      flexibility: number;
    };
    popularTimeSlots: Array<{ timeSlot: string; count: number }>;
    groupPreference: {
      group: number;
      individual: number;
    };
  }> {
    const [
      workoutTypes,
      intensities,
      timeSlots,
      groupPrefs,
    ] = await Promise.all([
      this.workoutPreferenceModel.aggregate([
        { $unwind: '$preferredWorkoutTypes' },
        {
          $group: {
            _id: '$preferredWorkoutTypes',
            count: { $sum: 1 },
          },
        },
      ]),
      this.workoutPreferenceModel.aggregate([
        {
          $group: {
            _id: null,
            avgCardio: { $avg: '$intensityPreference.cardioIntensity' },
            avgStrength: { $avg: '$intensityPreference.strengthIntensity' },
            avgFlexibility: { $avg: '$intensityPreference.flexibilityIntensity' },
          },
        },
      ]),
      this.workoutPreferenceModel.aggregate([
        {
          $group: {
            _id: '$timePreference.preferredTimeSlot',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      this.workoutPreferenceModel.aggregate([
        {
          $group: {
            _id: '$preferGroupWorkouts',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    return {
      workoutTypeDistribution: Object.fromEntries(
        workoutTypes.map(({ _id, count }) => [_id, count]),
      ),
      averageIntensities: {
        cardio: intensities[0]?.avgCardio || 0,
        strength: intensities[0]?.avgStrength || 0,
        flexibility: intensities[0]?.avgFlexibility || 0,
      },
      popularTimeSlots: timeSlots.map(({ _id, count }) => ({
        timeSlot: _id,
        count,
      })),
      groupPreference: {
        group: groupPrefs.find(p => p._id === true)?.count || 0,
        individual: groupPrefs.find(p => p._id === false)?.count || 0,
      },
    };
  }
}

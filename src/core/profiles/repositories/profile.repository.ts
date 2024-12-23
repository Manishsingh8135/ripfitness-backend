import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Profile, ProfileDocument } from '../schemas/profile.schema';
import { CreateProfileDto } from '../dto/create-profile.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';

@Injectable()
export class ProfileRepository {
  constructor(
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
  ) {}

  async create(userId: string, createProfileDto: CreateProfileDto): Promise<ProfileDocument> {
    const profile = new this.profileModel({
      userId: new Types.ObjectId(userId),
      ...createProfileDto,
    });
    return profile.save();
  }

  async findByUserId(userId: string): Promise<ProfileDocument | null> {
    return this.profileModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .lean()
      .exec() as Promise<ProfileDocument | null>;
  }

  async findAll(page = 1, limit = 10): Promise<{
    profiles: ProfileDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const [profiles, total] = await Promise.all([
      this.profileModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec() as Promise<ProfileDocument[]>,
      this.profileModel.countDocuments(),
    ]);

    return {
      profiles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileDocument | null> {
    return this.profileModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $set: updateProfileDto },
        { new: true, runValidators: true }
      )
      .lean()
      .exec() as Promise<ProfileDocument | null>;
  }

  async delete(userId: string): Promise<ProfileDocument | null> {
    return this.profileModel
      .findOneAndDelete({ userId: new Types.ObjectId(userId) })
      .lean()
      .exec() as Promise<ProfileDocument | null>;
  }

  async findByLocation(
    longitude: number, 
    latitude: number, 
    maxDistance: number,
    excludeUserId?: string
  ): Promise<ProfileDocument[]> {
    const query: any = {
      'address.location': {
        $geoWithin: {
          $centerSphere: [
            [longitude, latitude],
            maxDistance / 6371000 // Convert meters to radians (Earth's radius in meters)
          ]
        }
      }
    };

    if (excludeUserId) {
      query.userId = { $ne: new Types.ObjectId(excludeUserId) };
    }

    return this.profileModel
      .find(query)
      .lean()
      .exec() as Promise<ProfileDocument[]>;
  }

  async findByFitnessLevel(fitnessLevel: string): Promise<ProfileDocument[]> {
    return this.profileModel
      .find({ fitnessLevel })
      .lean()
      .exec() as Promise<ProfileDocument[]>;
  }

  async findByFitnessGoals(goals: string[]): Promise<ProfileDocument[]> {
    return this.profileModel
      .find({ fitnessGoals: { $in: goals } })
      .lean()
      .exec() as Promise<ProfileDocument[]>;
  }

  async updateCompletionPercentage(userId: string): Promise<number> {
    const profile = await this.findByUserId(userId);
    if (!profile) return 0;

    const fields = [
      'dateOfBirth',
      'gender',
      'address',
      'emergencyContact',
      'height',
      'weight',
      'fitnessLevel',
      'fitnessGoals',
      'preferredWorkoutTypes',
      'healthInfo',
    ];

    const completedFields = fields.filter(field => {
      const value = profile[field];
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== undefined && value !== null;
    });

    const completionPercentage = Math.round((completedFields.length / fields.length) * 100);
    
    await this.profileModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $set: { completionPercentage } },
      { new: true }
    ).exec();
    
    return completionPercentage;
  }

  async getProfileStats(): Promise<{
    totalProfiles: number;
    averageCompletion: number;
    fitnessLevelDistribution: Record<string, number>;
    goalDistribution: Record<string, number>;
  }> {
    const [
      totalProfiles,
      averageCompletion,
      fitnessLevelDistribution,
      goalDistribution,
    ] = await Promise.all([
      this.profileModel.countDocuments(),
      this.profileModel.aggregate([
        {
          $group: {
            _id: null,
            average: { $avg: '$completionPercentage' },
          },
        },
      ]),
      this.profileModel.aggregate([
        {
          $group: {
            _id: '$fitnessLevel',
            count: { $sum: 1 },
          },
        },
      ]),
      this.profileModel.aggregate([
        { $unwind: '$fitnessGoals' },
        {
          $group: {
            _id: '$fitnessGoals',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    return {
      totalProfiles,
      averageCompletion: averageCompletion[0]?.average || 0,
      fitnessLevelDistribution: Object.fromEntries(
        fitnessLevelDistribution.map(({ _id, count }) => [_id, count]),
      ),
      goalDistribution: Object.fromEntries(
        goalDistribution.map(({ _id, count }) => [_id, count]),
      ),
    };
  }
}

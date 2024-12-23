import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) {}

  async create(data: Partial<User>): Promise<UserDocument> {
    return this.userModel.create(data);
  }

  async findOne(filter: FilterQuery<User>): Promise<UserDocument | null> {
    return this.userModel.findOne(filter).exec();
  }

  async find(filter: FilterQuery<User>): Promise<UserDocument[]> {
    return this.userModel.find(filter).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async updateOne(filter: FilterQuery<User>, update: Partial<User>): Promise<UserDocument | null> {
    return this.userModel.findOneAndUpdate(filter, update, { new: true }).exec();
  }

  async deleteOne(filter: FilterQuery<User>): Promise<boolean> {
    const result = await this.userModel.deleteOne(filter);
    return result.deletedCount > 0;
  }

  async countDocuments(filter: FilterQuery<User>): Promise<number> {
    return this.userModel.countDocuments(filter).exec();
  }
}

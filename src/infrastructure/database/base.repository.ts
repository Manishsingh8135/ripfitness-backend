import { Model, FilterQuery } from 'mongoose';
import { BaseDocument } from './interfaces/base.interface';

export abstract class BaseRepository<T extends BaseDocument> {
  constructor(protected readonly model: Model<T>) {}

  async create(data: Partial<T>): Promise<T> {
    const entity = new this.model(data);
    return entity.save();
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return this.model.findOne({ ...filter, isDeleted: false } as FilterQuery<T>).exec();
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findOne({ _id: id, isDeleted: false }).exec();
  }

  async find(filter: FilterQuery<Omit<T, '$where'>>): Promise<T[]> {
    return this.model.find({ ...filter, isDeleted: false } as FilterQuery<T>).exec();
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    return this.model
      .findOneAndUpdate({ _id: id, isDeleted: false }, data, { new: true })
      .exec();
  }

  async softDelete(id: string): Promise<T | null> {
    return this.model
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true, deletedAt: new Date() },
        { new: true },
      )
      .exec();
  }

  async hardDelete(id: string): Promise<boolean> {
    const result = await this.model.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }
}

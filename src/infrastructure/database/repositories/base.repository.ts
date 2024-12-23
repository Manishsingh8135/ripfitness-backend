import { Document, FilterQuery, Model, UpdateQuery } from 'mongoose';
import { BaseDocument } from '../interfaces/base.interface';
import { PaginatedResult, PaginationParams, QueryOptions } from '../types/common.types';

export abstract class BaseRepository<T extends BaseDocument> {
  constructor(protected readonly model: Model<T>) {}

  protected getNotDeletedFilter(filter: FilterQuery<T> = {}): FilterQuery<T> {
    return {
      ...filter,
      $or: [
        { isDeleted: { $exists: false } },
        { isDeleted: false }
      ]
    } as FilterQuery<T>;
  }

  async create(data: Partial<T>): Promise<T> {
    const entity = new this.model(data);
    return entity.save();
  }

  async findById(id: string, options: QueryOptions = {}): Promise<T | null> {
    const query = this.model.findById(id).where({
      $or: [
        { isDeleted: { $exists: false } },
        { isDeleted: false }
      ]
    });
    this.applyQueryOptions(query, options);
    return query.exec();
  }

  async findOne(filter: FilterQuery<T>, options: QueryOptions = {}): Promise<T | null> {
    const query = this.model.findOne(this.getNotDeletedFilter(filter));
    this.applyQueryOptions(query, options);
    return query.exec();
  }

  async find(filter: FilterQuery<T>, options: QueryOptions = {}): Promise<T[]> {
    const query = this.model.find(this.getNotDeletedFilter(filter));
    this.applyQueryOptions(query, options);
    return query.exec();
  }

  async paginate(
    filter: FilterQuery<T>,
    params: PaginationParams,
    options: QueryOptions = {},
  ): Promise<PaginatedResult<T>> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const finalFilter = this.getNotDeletedFilter(filter);

    const query = this.model.find(finalFilter);
    this.applyQueryOptions(query, options);

    const [items, total] = await Promise.all([
      query.skip(skip).limit(limit).exec(),
      this.model.countDocuments(finalFilter),
    ]);

    const pages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    };
  }

  async update(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options: QueryOptions = {},
  ): Promise<T | null> {
    const query = this.model.findOneAndUpdate(
      this.getNotDeletedFilter(filter),
      update,
      { new: true }
    );
    this.applyQueryOptions(query, options);
    return query.exec();
  }

  async delete(filter: FilterQuery<T>): Promise<boolean> {
    const result = await this.model.deleteOne(filter);
    return result.deletedCount > 0;
  }

  async softDelete(filter: FilterQuery<T>): Promise<T | null> {
    return this.update(filter, {
      $set: { deletedAt: new Date(), isDeleted: true },
    } as UpdateQuery<T>);
  }

  private applyQueryOptions(query: any, options: QueryOptions): void {
    if (options.populate) {
      const populates = Array.isArray(options.populate)
        ? options.populate
        : [options.populate];
      populates.forEach((field) => query.populate(field));
    }

    if (options.select) {
      const selects = Array.isArray(options.select)
        ? options.select.join(' ')
        : options.select;
      query.select(selects);
    }

    if (options.sort) {
      query.sort(options.sort);
    }

    if (options.lean) {
      query.lean();
    }
  }
}

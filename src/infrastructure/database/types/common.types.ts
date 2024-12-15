import { Types } from 'mongoose';

export type ObjectIdType = Types.ObjectId;
export type DocumentId = string | Types.ObjectId;

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
}

export interface QueryOptions {
  lean?: boolean;
  populate?: string | string[];
  select?: string | string[];
  sort?: Record<string, 1 | -1>;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

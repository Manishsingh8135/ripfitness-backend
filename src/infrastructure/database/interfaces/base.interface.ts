import { Document, Types } from 'mongoose';

export interface BaseDocument extends Document {
  isDeleted?: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BaseEntityProps {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  isDeleted?: boolean;
}

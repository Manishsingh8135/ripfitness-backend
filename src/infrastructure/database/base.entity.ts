import { Prop, Schema } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ _id: true })
export abstract class BaseEntity {
  @Prop({ type: Types.ObjectId, auto: true })
  _id?: Types.ObjectId;

  @Prop({ type: Date })
  createdAt?: Date;

  @Prop({ type: Date })
  updatedAt?: Date;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;

  @Prop({ type: Boolean, default: false })
  isDeleted?: boolean;
}

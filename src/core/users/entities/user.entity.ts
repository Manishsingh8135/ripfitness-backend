import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseDocument } from '../../../infrastructure/database/interfaces/base.interface';

@Schema({
  collection: 'users',
  timestamps: { createdAt: true, updatedAt: true },
  versionKey: false,
})
export class User implements Omit<BaseDocument, keyof Document> {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, unique: true })
  clerkId: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: String, enum: ['admin', 'trainer', 'member'], default: 'member' })
  role: string;

  @Prop({
    type: {
      firstName: String,
      lastName: String,
      dateOfBirth: Date,
      gender: String,
      phoneNumber: String,
      avatarUrl: String,
      bio: String,
      fitnessLevel: String,
      preferredWorkoutTime: String,
      goals: [String],
    },
  })
  profile: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    gender?: string;
    phoneNumber?: string;
    avatarUrl?: string;
    bio?: string;
    fitnessLevel?: string;
    preferredWorkoutTime?: string;
    goals?: string[];
  };

  createdAt: Date;
  updatedAt: Date;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);

// Add post-find middleware to transform _id
UserSchema.set('toJSON', {
  virtuals: true,
  transform: (_, converted) => {
    converted.id = converted._id?.toString();
    if (converted._id) delete converted._id;
    if (converted.__v) delete converted.__v;
    return converted;
  },
});

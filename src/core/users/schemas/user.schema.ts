import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Base User Interface
export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  permissions: UserPermission[];
  isEmailVerified: boolean;
  phoneNumber?: string;
  profilePicture?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = User & Document;

export enum UserRole {
  USER = 'user',           // Regular gym member
  TRAINER = 'trainer',     // Gym trainer
  ADMIN = 'admin',         // Gym administrator
  SUPER_ADMIN = 'super_admin'  // System owner
}

export enum UserPermission {
  MANAGE_USERS = 'manage:users',           // Create, update, delete users
  MANAGE_TRAINERS = 'manage:trainers',     // Assign, manage trainers
  MANAGE_WORKOUTS = 'manage:workouts',     // Create, modify workout plans
  MANAGE_CLASSES = 'manage:classes',       // Schedule, modify classes
  VIEW_ANALYTICS = 'view:analytics',       // View gym analytics
  SYSTEM_SETTINGS = 'system:settings'      // Modify system settings
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: [String], enum: Object.values(UserPermission), default: [] })
  permissions: UserPermission[];

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ trim: true })
  phoneNumber?: string;

  @Prop()
  profilePicture?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLogin?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

// Create and export the schema
export const UserSchema = SchemaFactory.createForClass(User);

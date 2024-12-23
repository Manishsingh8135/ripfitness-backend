import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type ProfileDocument = Profile & Document;

@Schema({ _id: false })
class Address {
  @Prop({ required: true, trim: true })
  street: string;

  @Prop({ required: true, trim: true })
  city: string;

  @Prop({ required: true, trim: true })
  state: string;

  @Prop({ required: true, trim: true })
  zipCode: string;

  @Prop({ type: [Number], index: { type: '2dsphere', sparse: true } })
  location: [number, number]; // [longitude, latitude]
}

@Schema({ _id: false })
class EmergencyContact {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  relationship: string;

  @Prop({ required: true, trim: true })
  phoneNumber: string;
}

@Schema({ _id: false })
class HealthInformation {
  @Prop({ type: [String], default: [] })
  medicalConditions: string[];

  @Prop({ type: [String], default: [] })
  allergies: string[];

  @Prop({ type: [String], default: [] })
  medications: string[];

  @Prop({ trim: true })
  bloodType?: string;

  @Prop()
  lastMedicalCheckup?: Date;

  @Prop({ type: Boolean, default: false })
  hasInsurance: boolean;

  @Prop({ trim: true })
  insuranceProvider?: string;

  @Prop({ trim: true })
  insurancePolicyNumber?: string;
}

export enum FitnessLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export enum FitnessGoal {
  WEIGHT_LOSS = 'weight_loss',
  MUSCLE_GAIN = 'muscle_gain',
  ENDURANCE = 'endurance',
  FLEXIBILITY = 'flexibility',
  STRENGTH = 'strength',
  GENERAL_FITNESS = 'general_fitness',
  ATHLETIC_PERFORMANCE = 'athletic_performance',
  REHABILITATION = 'rehabilitation'
}

@Schema({ timestamps: true })
export class Profile {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: User;

  // Personal Information
  @Prop({ required: true })
  dateOfBirth: Date;

  @Prop({ required: true, enum: ['male', 'female', 'other'] })
  gender: string;

  @Prop({ type: Address, required: true })
  address: Address;

  @Prop({ type: EmergencyContact, required: true })
  emergencyContact: EmergencyContact;

  // Physical Attributes
  @Prop({ type: Number, min: 0 })
  height?: number; // in centimeters

  @Prop({ type: Number, min: 0 })
  weight?: number; // in kilograms

  @Prop({ type: Number, min: 0, max: 100 })
  bodyFatPercentage?: number;

  // Fitness Information
  @Prop({ type: String, enum: FitnessLevel, default: FitnessLevel.BEGINNER })
  fitnessLevel: FitnessLevel;

  @Prop({ type: [String], enum: FitnessGoal, default: [] })
  fitnessGoals: FitnessGoal[];

  @Prop({ type: [String], default: [] })
  preferredWorkoutTypes: string[];

  @Prop({ type: [String], default: [] })
  preferredWorkoutDays: string[];

  @Prop({ type: String })
  preferredWorkoutTime?: string;

  // Health Information
  @Prop({ type: HealthInformation })
  healthInfo: HealthInformation;

  // Preferences
  @Prop({ type: Boolean, default: true })
  receiveNotifications: boolean;

  @Prop({ type: Boolean, default: true })
  receiveEmails: boolean;

  @Prop({ type: Boolean, default: true })
  receiveSMS: boolean;

  @Prop({ type: String, default: 'en' })
  preferredLanguage: string;

  // Profile Completion
  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  completionPercentage: number;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);

// Indexes
ProfileSchema.index({ userId: 1 }, { unique: true });
ProfileSchema.index({ 'address.location': '2dsphere' });
ProfileSchema.index({ fitnessLevel: 1 });
ProfileSchema.index({ fitnessGoals: 1 });
ProfileSchema.index({ completionPercentage: 1 });

// Middleware to calculate profile completion
ProfileSchema.pre('save', function(next) {
  const profile = this as ProfileDocument;
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
    'healthInfo'
  ];

  const completedFields = fields.filter(field => {
    const value = profile[field];
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== undefined && value !== null;
  });

  profile.completionPercentage = Math.round((completedFields.length / fields.length) * 100);
  next();
});

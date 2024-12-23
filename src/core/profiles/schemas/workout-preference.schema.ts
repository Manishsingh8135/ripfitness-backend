import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export enum WorkoutType {
  CARDIO = 'CARDIO',
  STRENGTH = 'STRENGTH',
  FLEXIBILITY = 'FLEXIBILITY',
  HIIT = 'HIIT',
  YOGA = 'YOGA',
  PILATES = 'PILATES',
  CROSSFIT = 'CROSSFIT',
  SWIMMING = 'SWIMMING',
  CYCLING = 'CYCLING',
  RUNNING = 'RUNNING'
}

export enum Equipment {
  DUMBBELLS = 'DUMBBELLS',
  BARBELLS = 'BARBELLS',
  TREADMILL = 'TREADMILL',
  ELLIPTICAL = 'ELLIPTICAL',
  RESISTANCE_BANDS = 'RESISTANCE_BANDS',
  KETTLEBELLS = 'KETTLEBELLS',
  YOGA_MAT = 'YOGA_MAT',
  FOAM_ROLLER = 'FOAM_ROLLER',
  PULL_UP_BAR = 'PULL_UP_BAR',
  BENCH = 'BENCH'
}

export type WorkoutPreferenceDocument = WorkoutPreference & Document;

@Schema({ timestamps: true })
export class WorkoutPreference {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: User;

  @Prop({ type: [String], enum: WorkoutType, required: true })
  preferredWorkoutTypes: WorkoutType[];

  @Prop({ type: [String], enum: Equipment, required: true })
  availableEquipment: Equipment[];

  @Prop({
    type: {
      preferredDays: [String],
      preferredTimeSlot: String,
      preferredDuration: Number,
    },
    required: true,
  })
  timePreference: {
    preferredDays: string[];
    preferredTimeSlot: string;
    preferredDuration: number;
  };

  @Prop({
    type: {
      cardioIntensity: Number,
      strengthIntensity: Number,
      flexibilityIntensity: Number,
    },
    required: true,
  })
  intensityPreference: {
    cardioIntensity: number;
    strengthIntensity: number;
    flexibilityIntensity: number;
  };

  @Prop({ type: Number, required: true, min: 1, max: 7 })
  workoutsPerWeek: number;

  @Prop({ type: Boolean, default: false })
  needsModification: boolean;

  @Prop({ type: [String], default: [] })
  injuryConsiderations?: string[];

  @Prop({ type: [String], default: [] })
  excludedExercises?: string[];

  @Prop({ type: Boolean, required: true })
  preferGroupWorkouts: boolean;

  @Prop({ type: String, trim: true })
  specialInstructions?: string;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export const WorkoutPreferenceSchema = SchemaFactory.createForClass(WorkoutPreference);

// Indexes
WorkoutPreferenceSchema.index({ userId: 1 }, { unique: true });
WorkoutPreferenceSchema.index({ preferredWorkoutTypes: 1 });
WorkoutPreferenceSchema.index({ 'timePreference.preferredDays': 1 });
WorkoutPreferenceSchema.index({ workoutsPerWeek: 1 });

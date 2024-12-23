import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type FitnessProgressDocument = FitnessProgress & Document;

@Schema({ _id: false })
class Measurement {
  @Prop({ required: true, type: Number, min: 0 })
  value: number;

  @Prop({ required: true })
  date: Date;

  @Prop({ trim: true })
  notes?: string;
}

@Schema({ _id: false })
class BodyMeasurements {
  @Prop({ type: [Measurement], default: [] })
  weight: Measurement[]; // in kg

  @Prop({ type: [Measurement], default: [] })
  bodyFat: Measurement[]; // percentage

  @Prop({ type: [Measurement], default: [] })
  chest: Measurement[]; // in cm

  @Prop({ type: [Measurement], default: [] })
  waist: Measurement[]; // in cm

  @Prop({ type: [Measurement], default: [] })
  hips: Measurement[]; // in cm

  @Prop({ type: [Measurement], default: [] })
  biceps: Measurement[]; // in cm

  @Prop({ type: [Measurement], default: [] })
  thighs: Measurement[]; // in cm
}

@Schema({ _id: false })
class FitnessMetrics {
  @Prop({ type: [Measurement], default: [] })
  pushUps: Measurement[]; // count in 1 minute

  @Prop({ type: [Measurement], default: [] })
  pullUps: Measurement[]; // count in 1 minute

  @Prop({ type: [Measurement], default: [] })
  squats: Measurement[]; // count in 1 minute

  @Prop({ type: [Measurement], default: [] })
  plankTime: Measurement[]; // in seconds

  @Prop({ type: [Measurement], default: [] })
  runningDistance: Measurement[]; // in km

  @Prop({ type: [Measurement], default: [] })
  runningTime: Measurement[]; // in minutes
}

@Schema({ timestamps: true })
export class FitnessProgress {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: User;

  @Prop({ type: BodyMeasurements, default: {} })
  bodyMeasurements: BodyMeasurements;

  @Prop({ type: FitnessMetrics, default: {} })
  fitnessMetrics: FitnessMetrics;

  // Calculated Fields
  @Prop({ type: Number })
  bmi?: number;

  @Prop({ type: String })
  bmiCategory?: string;

  @Prop({ type: Number })
  bodyFatPercentage?: number;

  @Prop({ type: String })
  bodyFatCategory?: string;

  // Progress Tracking
  @Prop({ type: Map, of: Number, default: {} })
  progressPercentages: Map<string, number>;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export const FitnessProgressSchema = SchemaFactory.createForClass(FitnessProgress);

// Indexes
FitnessProgressSchema.index({ userId: 1 }, { unique: true });
FitnessProgressSchema.index({ 'bodyMeasurements.weight.date': -1 });
FitnessProgressSchema.index({ 'bodyMeasurements.bodyFat.date': -1 });
FitnessProgressSchema.index({ 'fitnessMetrics.runningDistance.date': -1 });

// Middleware to calculate BMI and categories
FitnessProgressSchema.pre('save', function(next) {
  const progress = this as FitnessProgressDocument;
  
  // Calculate BMI if weight and height are available
  const latestWeight = progress.bodyMeasurements?.weight?.[0]?.value;
  if (latestWeight) {
    // TODO: Get height from profile
    // const heightInMeters = height / 100;
    // progress.bmi = latestWeight / (heightInMeters * heightInMeters);
    // progress.bmiCategory = calculateBMICategory(progress.bmi);
  }

  // Calculate body fat category if available
  const latestBodyFat = progress.bodyMeasurements?.bodyFat?.[0]?.value;
  if (latestBodyFat) {
    progress.bodyFatPercentage = latestBodyFat;
    // TODO: Calculate body fat category based on gender and age
    // progress.bodyFatCategory = calculateBodyFatCategory(latestBodyFat, gender, age);
  }

  next();
});

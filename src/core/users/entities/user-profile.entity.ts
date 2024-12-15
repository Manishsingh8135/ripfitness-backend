import { Prop, Schema } from '@nestjs/mongoose';
import { Gender, FitnessLevel, PreferredWorkoutTime } from '../enums/user.enums';

@Schema({ _id: false })
export class UserProfile {
  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop()
  dateOfBirth?: Date;

  @Prop({ type: String, enum: Gender })
  gender?: Gender;

  @Prop()
  phoneNumber?: string;

  @Prop()
  avatarUrl?: string;

  @Prop()
  bio?: string;

  @Prop({ type: String, enum: FitnessLevel })
  fitnessLevel?: FitnessLevel;

  @Prop({ type: String, enum: PreferredWorkoutTime })
  preferredWorkoutTime?: PreferredWorkoutTime;

  @Prop([String])
  goals?: string[];
}

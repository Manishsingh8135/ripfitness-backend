import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../core/users/schemas/user.schema';
import { InitialSetupSeed } from './seeds/initial-setup.seed';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [InitialSetupSeed],
  exports: [InitialSetupSeed],
})
export class DatabaseModule {}

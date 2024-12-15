import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import databaseConfig from './config/database/database.config';
import clerkConfig from './config/clerk/clerk.config';
import redisConfig from './config/redis/redis.config';
import s3Config from './config/s3/s3.config';
import { DatabaseModule } from './infrastructure/database/database.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, clerkConfig, redisConfig, s3Config],
      envFilePath: '.env',
    }),
    // Database
    DatabaseModule,
    // Event Emitter
    EventEmitterModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

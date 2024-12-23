import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import databaseConfig from './config/database/database.config';
import clerkConfig from './config/clerk/clerk.config';
import redisConfig from './config/redis/redis.config';
import s3Config from './config/s3/s3.config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { UsersModule } from './core/users/users.module';
import { AuthModule } from './core/auth/auth.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, clerkConfig, redisConfig, s3Config],
      envFilePath: '.env',
    }),
    // Database
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
        ...configService.get('database.options'),
      }),
      inject: [ConfigService],
    }),
    DatabaseModule,
    // Event Emitter
    EventEmitterModule.forRoot(),
    // Core Modules
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

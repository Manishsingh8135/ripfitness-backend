import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mongoose from 'mongoose';
import { DATABASE_CONNECTION } from './constants/database.constants';

export const databaseProviders: Provider[] = [
  {
    provide: DATABASE_CONNECTION,
    useFactory: async (configService: ConfigService): Promise<typeof mongoose> => {
      try {
        const uri = configService.get<string>('database.uri');
        const options = configService.get('database.options');

        console.log('🔄 Attempting to connect to MongoDB...');
        
        const connection = await mongoose.connect(uri, options);

        // Log successful connection details
        console.log('✅ Successfully connected to MongoDB!');
        console.log('📊 Connection Details:');
        console.log(`🗄️  Database Name: ${connection.connection.name}`);
        console.log(`🌐 Host: ${connection.connection.host}`);
        console.log(`🔌 Port: ${connection.connection.port}`);
        console.log('🔗 Connection State:', connection.connection.readyState === 1 ? 'Connected' : 'Not Connected');

        // Handle connection events
        connection.connection.on('error', (error) => {
          console.error('❌ MongoDB connection error:', error);
        });

        connection.connection.on('disconnected', () => {
          console.warn('⚠️  MongoDB disconnected');
        });

        connection.connection.on('reconnected', () => {
          console.log('🔄 MongoDB reconnected');
        });

        // Handle process termination
        process.on('SIGINT', async () => {
          await connection.connection.close();
          console.log('🔒 MongoDB connection closed through app termination');
          process.exit(0);
        });

        return connection;
      } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error);
        throw error;
      }
    },
    inject: [ConfigService],
  },
];

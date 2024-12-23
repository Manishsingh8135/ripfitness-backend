import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { UsersService } from '../../core/users/users.service';
import { UserRole } from '../../core/users/schemas/user.schema';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  try {
    // Check if super admin exists
    const existingSuperAdmin = await usersService.findByEmail(process.env.SUPER_ADMIN_EMAIL || 'admin@ripfitness.com');
    
    if (!existingSuperAdmin) {
      // Create super admin
      const superAdmin = await usersService.createAdmin({
        email: process.env.SUPER_ADMIN_EMAIL || 'admin@ripfitness.com',
        password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123',
        firstName: 'Super',
        lastName: 'Admin',
      }, true); // true flag creates a super admin

      console.log('Super Admin created:', superAdmin);
    } else {
      console.log('Super Admin already exists');
    }

    // Check if regular admin exists
    const existingAdmin = await usersService.findByEmail('admin2@ripfitness.com');
    
    if (!existingAdmin) {
      // Create a regular admin
      const admin = await usersService.createAdmin({
        email: 'admin2@ripfitness.com',
        password: 'Admin@123',
        firstName: 'Regular',
        lastName: 'Admin',
      }, false); // false flag creates a regular admin

      console.log('Regular Admin created:', admin);
    } else {
      console.log('Regular Admin already exists');
    }

    // Check if trainer exists
    const existingTrainer = await usersService.findByEmail('trainer@ripfitness.com');
    
    if (!existingTrainer) {
      // Create a trainer
      const trainer = await usersService.createTrainer({
        email: 'trainer@ripfitness.com',
        password: 'Trainer@123',
        firstName: 'Test',
        lastName: 'Trainer',
      });

      console.log('Trainer created:', trainer);
    } else {
      console.log('Trainer already exists');
    }

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await app.close();
  }
}

bootstrap();

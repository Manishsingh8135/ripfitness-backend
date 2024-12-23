import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserRole, UserPermission } from '../../core/users/schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class InitialSetupSeed {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async seed() {
    // Create Super Admin if doesn't exist
    const superAdminExists = await this.userModel.findOne({ role: UserRole.SUPER_ADMIN });
    if (!superAdminExists) {
      const password = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await this.userModel.create({
        firstName: 'Super',
        lastName: 'Admin',
        email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@ripfitness.com',
        password: hashedPassword,
        role: UserRole.SUPER_ADMIN,
        permissions: Object.values(UserPermission), // All permissions
        isEmailVerified: true,
        isActive: true
      });
    }

    // Create default admin if doesn't exist
    const adminExists = await this.userModel.findOne({ role: UserRole.ADMIN });
    if (!adminExists) {
      const password = process.env.ADMIN_PASSWORD || 'Admin@123';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await this.userModel.create({
        firstName: 'Gym',
        lastName: 'Admin',
        email: process.env.ADMIN_EMAIL || 'admin@ripfitness.com',
        password: hashedPassword,
        role: UserRole.ADMIN,
        permissions: [
          UserPermission.MANAGE_USERS,
          UserPermission.MANAGE_TRAINERS,
          UserPermission.MANAGE_WORKOUTS,
          UserPermission.MANAGE_CLASSES,
          UserPermission.VIEW_ANALYTICS
        ],
        isEmailVerified: true,
        isActive: true
      });
    }
  }
}

import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole, UserPermission, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(createUserDto: CreateUserDto): Promise<Partial<User>> {
    // Validate email format
    if (!this.isValidEmail(createUserDto.email)) {
      throw new BadRequestException('Invalid email format');
    }

    // Check if user exists
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Validate password strength
    if (!this.isValidPassword(createUserDto.password)) {
      throw new BadRequestException(
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create user with hashed password
    const user = await this.userRepository.create({
      ...createUserDto,
      email: createUserDto.email.toLowerCase(),
      password: hashedPassword,
      role: createUserDto.role || UserRole.USER,
    });

    // Remove password from response
    const { password, ...result } = user.toObject();
    return result;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userRepository.findOne({ email: email.toLowerCase() });
  }

  async findById(id: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }
    return this.userRepository.findById(id);
  }

  async validateCredentials(
    email: string,
    password: string,
  ): Promise<UserDocument | null> {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<Partial<User>> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const result = await this.userRepository.updateOne(
      { _id: new Types.ObjectId(id) },
      updateUserDto
    );

    if (!result) {
      throw new NotFoundException('User not found');
    }

    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...resultUser } = user.toObject();
    return resultUser;
  }

  async updateLastLogin(id: string | Types.ObjectId): Promise<void> {
    await this.userRepository.updateOne(
      { _id: new Types.ObjectId(id.toString()) },
      { lastLogin: new Date() }
    );
  }

  async delete(id: string): Promise<void> {
    const result = await this.userRepository.deleteOne({ _id: new Types.ObjectId(id) });
    if (!result) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async remove(id: string): Promise<void> {
    return this.delete(id);
  }

  async createTrainer(createUserDto: CreateUserDto): Promise<Partial<User>> {
    const trainerDto = {
      ...createUserDto,
      role: UserRole.TRAINER,
      permissions: [
        UserPermission.MANAGE_WORKOUTS,
        UserPermission.MANAGE_CLASSES
      ]
    };
    return this.create(trainerDto);
  }

  async createAdmin(createUserDto: CreateUserDto, isSuperAdmin: boolean = false): Promise<Partial<User>> {
    const adminDto = {
      ...createUserDto,
      role: isSuperAdmin ? UserRole.SUPER_ADMIN : UserRole.ADMIN,
      permissions: isSuperAdmin 
        ? Object.values(UserPermission)
        : [
            UserPermission.MANAGE_USERS,
            UserPermission.MANAGE_TRAINERS,
            UserPermission.MANAGE_WORKOUTS,
            UserPermission.MANAGE_CLASSES,
            UserPermission.VIEW_ANALYTICS
          ]
    };
    return this.create(adminDto);
  }

  async findAllByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({ role });
  }

  async findAllTrainers(): Promise<User[]> {
    return this.findAllByRole(UserRole.TRAINER);
  }

  async findAllAdmins(): Promise<User[]> {
    return this.userRepository.find({ 
      role: { $in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] } 
    });
  }

  async findAll(options: { role?: UserRole; isActive?: boolean } = {}): Promise<Partial<User>[]> {
    const filter: any = {};
    if (options.role) filter.role = options.role;
    if (typeof options.isActive === 'boolean') filter.isActive = options.isActive;
    
    const users = await this.userRepository.find(filter);
    return users.map(user => {
      const { password, ...result } = user.toObject();
      return result;
    });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPassword(password: string): boolean {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }
}

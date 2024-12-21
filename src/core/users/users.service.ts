import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
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
    return result as User;
  }

  async findAll(options: { role?: UserRole; isActive?: boolean } = {}): Promise<User[]> {
    const filter: any = {};
    if (options.role) filter.role = options.role;
    if (typeof options.isActive === 'boolean') filter.isActive = options.isActive;
    
    const users = await this.userRepository.find(filter);
    return users.map(user => {
      const { password, ...result } = user.toObject();
      return result as User;
    });
  }

  async findById(id: string): Promise<UserDocument> {
    // Validate MongoDB ID
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    if (!email) return null;
    return this.userRepository.findOne({ email: email.toLowerCase() });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<Partial<UserDocument>> {
    const user = await this.findById(id);

    // If email is being updated, check if it's already taken
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const emailExists = await this.findByEmail(updateUserDto.email);
      if (emailExists) {
        throw new ConflictException('Email already exists');
      }
    }

    // If password is being updated, hash it
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Update the user
    Object.assign(user, updateUserDto);
    const updatedUser = await user.save();
    
    // Convert to plain object and remove sensitive data
    const userObject = updatedUser.toObject();
    delete userObject.password;
    return userObject;
  }

  async updateLastLogin(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const result = await this.userRepository.update(
      { _id: id },
      { $set: { lastLogin: new Date() } },
    );

    if (!result) {
      throw new NotFoundException('User not found');
    }
  }

  async validateCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ email });

    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return null;

    // Remove password from response
    const userObj = user.toObject ? user.toObject() : user;
    const { password: _, ...result } = userObj;
    return result as User;
  }

  async delete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const result = await this.userRepository.softDelete({ _id: id });
    if (!result) {
      throw new NotFoundException('User not found');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPassword(password: string): boolean {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }
}

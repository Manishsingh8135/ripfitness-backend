import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<UserDocument> {
    const user = await this.usersService.validateCredentials(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);
    return this.generateAuthResponse(user);
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    // Update last login
    await this.usersService.updateLastLogin(user._id);
    return this.generateAuthResponse(user);
  }

  async refreshToken(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.generateAuthResponse(user);
  }

  private generateAuthResponse(user: UserDocument | Partial<User>) {
    // If it's a UserDocument, convert to plain object
    const userObj = 'toObject' in user ? user.toObject() : user;

    const payload = {
      email: userObj.email,
      sub: userObj._id,
      role: userObj.role,
      permissions: userObj.permissions, // Include permissions in JWT
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: userObj._id,
        email: userObj.email,
        firstName: userObj.firstName,
        lastName: userObj.lastName,
        role: userObj.role,
        permissions: userObj.permissions, // Include permissions in response
      },
    };
  }
}

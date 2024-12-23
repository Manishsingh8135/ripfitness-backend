import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { UserPermission, UserRole } from './schemas/user.schema';
import { User } from './schemas/user.schema';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

@Controller('users')
@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('trainers')
  @ApiOperation({ summary: 'Create a new trainer account' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Trainer account created successfully',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        email: 'trainer@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'trainer',
        permissions: ['MANAGE_CLIENTS', 'VIEW_ANALYTICS'],
        createdAt: '2024-12-23T09:00:00.000Z'
      }
    }
  })
  @RequirePermissions([UserPermission.MANAGE_TRAINERS])
  async createTrainer(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createTrainer(createUserDto);
  }

  @Post('admins')
  @ApiOperation({ summary: 'Create a new admin account' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Admin account created successfully',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439012',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        permissions: ['SYSTEM_SETTINGS'],
        createdAt: '2024-12-23T09:00:00.000Z'
      }
    }
  })
  @RequirePermissions([UserPermission.SYSTEM_SETTINGS])
  async createAdmin(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createAdmin(createUserDto, false);
  }

  @Get('trainers')
  @ApiOperation({ summary: 'Get all trainers' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all trainers',
    schema: {
      example: [{
        _id: '507f1f77bcf86cd799439011',
        email: 'trainer1@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'trainer',
        permissions: ['MANAGE_CLIENTS'],
        createdAt: '2024-12-23T09:00:00.000Z'
      }]
    }
  })
  @RequirePermissions([UserPermission.MANAGE_TRAINERS])
  async findAllTrainers() {
    return this.usersService.findAllTrainers();
  }

  @Get('admins')
  @ApiOperation({ summary: 'Get all admin users' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all admin users',
    schema: {
      example: [{
        _id: '507f1f77bcf86cd799439012',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        permissions: ['SYSTEM_SETTINGS'],
        createdAt: '2024-12-23T09:00:00.000Z'
      }]
    }
  })
  @RequirePermissions([UserPermission.SYSTEM_SETTINGS])
  async findAllAdmins() {
    return this.usersService.findAllAdmins();
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all users',
    schema: {
      example: [{
        _id: '507f1f77bcf86cd799439011',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
        permissions: [],
        createdAt: '2024-12-23T09:00:00.000Z'
      }]
    }
  })
  @RequirePermissions([UserPermission.MANAGE_USERS])
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User found',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
        permissions: [],
        createdAt: '2024-12-23T09:00:00.000Z'
      }
    }
  })
  @RequirePermissions([UserPermission.MANAGE_USERS])
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User updated successfully',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
        permissions: [],
        createdAt: '2024-12-23T09:00:00.000Z'
      }
    }
  })
  @RequirePermissions([UserPermission.MANAGE_USERS])
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'User deleted successfully'
  })
  @RequirePermissions([UserPermission.MANAGE_USERS])
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}

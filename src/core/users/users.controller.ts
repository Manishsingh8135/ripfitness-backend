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

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('trainers')
  @RequirePermissions([UserPermission.MANAGE_TRAINERS])
  async createTrainer(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createTrainer(createUserDto);
  }

  @Post('admins')
  @RequirePermissions([UserPermission.SYSTEM_SETTINGS])
  async createAdmin(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createAdmin(createUserDto, false);
  }

  @Get('trainers')
  @RequirePermissions([UserPermission.MANAGE_TRAINERS])
  async findAllTrainers() {
    return this.usersService.findAllTrainers();
  }

  @Get('admins')
  @RequirePermissions([UserPermission.SYSTEM_SETTINGS])
  async findAllAdmins() {
    return this.usersService.findAllAdmins();
  }

  @Get()
  @RequirePermissions([UserPermission.MANAGE_USERS])
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @RequirePermissions([UserPermission.MANAGE_USERS])
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @RequirePermissions([UserPermission.MANAGE_USERS])
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @RequirePermissions([UserPermission.MANAGE_USERS])
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}

import { IsString, IsEmail, IsOptional, IsEnum, ValidateNested, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UserProfileDto } from './create-user.dto';
import { UserRole } from '../schemas/user.schema';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'New password (must be at least 8 characters with mixed case, numbers, and special characters)',
  })
  @IsString()
  @IsOptional()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  profilePicture?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional()
  @ValidateNested()
  @Type(() => UserProfileDto)
  @IsOptional()
  profile?: UserProfileDto;
}

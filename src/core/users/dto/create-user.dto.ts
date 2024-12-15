import { IsString, IsEmail, IsOptional, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UserProfileDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  fitnessLevel?: string;

  @IsString()
  @IsOptional()
  preferredWorkoutTime?: string;

  @IsString({ each: true })
  @IsOptional()
  goals?: string[];
}

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  clerkId: string;

  @IsEnum(['admin', 'trainer', 'member'])
  @IsOptional()
  role?: string;

  @ValidateNested()
  @Type(() => UserProfileDto)
  @IsOptional()
  profile?: UserProfileDto;
}

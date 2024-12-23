import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, ArrayMinSize, ArrayMaxSize, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class AddressDto {
  @ApiProperty({
    description: 'Street address',
    example: '123 Fitness Street'
  })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({
    description: 'City name',
    example: 'New York'
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    description: 'State name',
    example: 'NY'
  })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({
    description: 'ZIP code',
    example: '10001'
  })
  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @ApiProperty({
    description: 'Geographical coordinates [longitude, latitude]',
    example: [-73.935242, 40.730610],
    type: [Number]
  })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @Transform(({ value }) => value.map(Number))
  @IsNumber({}, { each: true })
  location: [number, number];
}

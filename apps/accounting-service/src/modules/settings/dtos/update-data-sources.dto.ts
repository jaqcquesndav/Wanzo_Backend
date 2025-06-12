import { IsString, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DataSourceStatus } from '../entities/data-source.entity';

export class DataSourceUpdateDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty({ enum: DataSourceStatus })
  @IsEnum(DataSourceStatus)
  status!: DataSourceStatus;
}

export class UpdateDataSourcesDto {
  @ApiProperty({ type: [DataSourceUpdateDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DataSourceUpdateDto)
  sources!: DataSourceUpdateDto[];
}

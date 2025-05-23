import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, Min, ValidateNested } from 'class-validator';

/**
 * @description Generic DTO for paginated API responses.
 */
export class PagedResultDto<T> {
  @IsArray()
  @ValidateNested({ each: true })
  @ApiProperty({ isArray: true, description: 'Array of items for the current page.' })
  @IsNotEmpty()
  items: T[];

  @IsInt()
  @Min(0)
  @ApiProperty({ example: 100, description: 'Total number of items available.' })
  totalCount: number;

  @IsInt()
  @Min(1)
  @ApiProperty({ example: 1, description: 'Current page number.' })
  page: number;

  @IsInt()
  @Min(1)
  @ApiProperty({ example: 10, description: 'Number of items per page.' })
  pageSize: number;

  @IsInt()
  @Min(0)
  @ApiProperty({ example: 10, description: 'Total number of pages.' })
  totalPages: number;

  constructor(items: T[], totalCount: number, page: number, pageSize: number) {
    this.items = items;
    this.totalCount = totalCount;
    this.page = page;
    this.pageSize = pageSize;
    this.totalPages = pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0;
  }
}
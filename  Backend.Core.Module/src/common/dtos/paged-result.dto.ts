import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, Min, ValidateNested } from 'class-validator';

/**
 * @class PagedResultDto
 * @description Generic DTO for paginated API responses.
 */
export class PagedResultDto<T> {
  @ApiProperty({
    isArray: true,
    description: 'The list of items for the current page.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  // @Type(() => Object) // This needs to be set by the consuming DTO with the actual type
  items: T[];

  @ApiProperty({
    type: Number,
    description: 'The total number of items available.',
    example: 100,
  })
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  totalCount: number;

  @ApiProperty({
    type: Number,
    description: 'The current page number.',
    example: 1,
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  page: number;

  @ApiProperty({
    type: Number,
    description: 'The number of items per page.',
    example: 10,
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  pageSize: number;

  constructor(items: T[], totalCount: number, page: number, pageSize: number) {
    this.items = items;
    this.totalCount = totalCount;
    this.page = page;
    this.pageSize = pageSize;
  }
}
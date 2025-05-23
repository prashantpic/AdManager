import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';

/**
 * @file Defines a generic DTO for paginated API responses.
 * @namespace AdManager.Platform.Backend.Core.Common.DTOs
 */

export class PagedResultDto<T> {
  /**
   * The items for the current page.
   * @example [{ "id": "uuid", "name": "Item 1" }]
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object) // Needs to be specified by the consuming DTO if items are of a specific class type
  items: T[];

  /**
   * The total number of items available across all pages.
   * @example 100
   */
  @IsInt()
  @Min(0)
  totalCount: number;

  /**
   * The current page number.
   * @example 1
   */
  @IsInt()
  @Min(1)
  page: number;

  /**
   * The number of items per page.
   * @example 10
   */
  @IsInt()
  @Min(1)
  pageSize: number;

  /**
   * The total number of pages.
   * @example 10
   */
  @IsInt()
  @Min(0)
  totalPages: number;

  /**
   * Indicates if there is a next page.
   * @example true
   */
  @IsOptional()
  hasNextPage?: boolean;

  /**
   * Indicates if there is a previous page.
   * @example false
   */
  @IsOptional()
  hasPreviousPage?: boolean;

  constructor(
    items: T[],
    totalCount: number,
    page: number,
    pageSize: number,
  ) {
    this.items = items;
    this.totalCount = totalCount;
    this.page = page;
    this.pageSize = pageSize;
    this.totalPages = Math.ceil(totalCount / pageSize);
    this.hasNextPage = page < this.totalPages;
    this.hasPreviousPage = page > 1;
  }
}
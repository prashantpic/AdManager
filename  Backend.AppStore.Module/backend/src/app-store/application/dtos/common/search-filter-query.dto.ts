import { IsOptional, IsString, IsUUID, IsEnum } from 'class-validator';
import { AppPricingModel } from '../../../common/enums/app-pricing-model.enum';
import { PaginationQueryDto } from './pagination-query.dto';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class SearchFilterQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string; // Keyword search

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsEnum(AppPricingModel)
  pricingModel?: AppPricingModel;

  @IsOptional()
  @IsString()
  sortBy?: string; // e.g., 'name', 'rating', 'releaseDate'

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.ASC;
}
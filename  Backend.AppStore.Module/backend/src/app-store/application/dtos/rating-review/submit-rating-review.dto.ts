import {
  IsUUID,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsString,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class SubmitRatingReviewDto {
  @IsUUID()
  @IsNotEmpty()
  appId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  @MaxLength(5000) // Example max length for review text
  reviewText?: string;
}
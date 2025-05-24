import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  Matches,
  MaxLength,
} from 'class-validator';

export class PublishSnsEventDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^arn:aws:sns:.*$/, { message: 'topicArn must be a valid AWS SNS Topic ARN' })
  topicArn: string;

  @IsNotEmpty()
  message: Record<string, any> | string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  subject?: string;

  @IsOptional()
  @IsObject()
  messageAttributes?: Record<string, {
    DataType: 'String' | 'Number' | 'Binary' | 'String.Array';
    StringValue?: string;
    BinaryValue?: Buffer;
    StringArrayValue?: string[];
  }>;
}
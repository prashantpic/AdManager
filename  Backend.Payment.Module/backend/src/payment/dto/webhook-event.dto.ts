import { IsEnum, IsString, IsObject, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { GatewayIdentifier } from '../constants/payment.constants';

export class WebhookEventDto {
  @IsEnum(GatewayIdentifier)
  gateway: GatewayIdentifier;

  @IsString()
  eventType: string; // Gateway-specific event type string

  @IsObject()
  payload: Record<string, any>; // Non-sensitive payload data

  @Type(() => Date)
  @IsDate()
  receivedAt: Date; // Timestamp when the webhook was received by our system
}
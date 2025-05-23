/**
 * @file campaign-performance.dto.ts
 * @description Platform-neutral DTO for campaign performance metrics after mapping from ad network specific format.
 * @namespace AdManager.Platform.Backend.Integration.AdNetworks.Common.Dtos
 */

import { IsNumber, IsOptional } from 'class-validator';

/**
 * Represents campaign performance metrics consistently after retrieval and normalization
 * from specific ad networks. Contains common advertising performance metrics.
 * @requirement REQ-11-013
 * @requirement REQ-7-004
 */
export class CampaignPerformanceDto {
  /**
   * Return On Ad Spend.
   */
  @IsOptional()
  @IsNumber()
  public roas?: number;

  /**
   * Cost Per Acquisition/Action.
   */
  @IsOptional()
  @IsNumber()
  public cpa?: number;

  /**
   * Cost Per Click.
   */
  @IsOptional()
  @IsNumber()
  public cpc?: number;

  /**
   * Click-Through Rate.
   */
  @IsOptional()
  @IsNumber()
  public ctr?: number;

  /**
   * Number of conversions.
   */
  @IsOptional()
  @IsNumber()
  public conversions?: number;

  /**
   * Number of impressions.
   */
  @IsOptional()
  @IsNumber()
  public impressions?: number;

  /**
   * Number of clicks.
   */
  @IsOptional()
  @IsNumber()
  public clicks?: number;

  /**
   * Total amount spent on the campaign.
   */
  @IsOptional()
  @IsNumber()
  public spend?: number;
}
/**
 * @file external-service.enum.ts
 * @description Enumeration for different external services integrated with the platform.
 * @namespace AdManager.Platform.Backend.Integration.Common.Enums
 */

/**
 * Provides type-safe identifiers for various external services.
 * Used in configuration, routing logic, and to identify specific integration clients.
 * @requirement REQ-11-001
 * @requirement REQ-11-013
 * @requirement REQ-11-014
 * @requirement REQ-11-015
 * @requirement REQ-11-016
 * @requirement REQ-11-018
 */
export enum ExternalServiceId {
  GOOGLE_ADS = 'GOOGLE_ADS',
  FACEBOOK_ADS = 'FACEBOOK_ADS',
  TIKTOK_ADS = 'TIKTOK_ADS',
  SNAPCHAT_ADS = 'SNAPCHAT_ADS',
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  MADA = 'MADA',
  STC_PAY = 'STC_PAY',
  SHIPPO = 'SHIPPO',
  ZAPIER = 'ZAPIER',
  PAYPAL_PAYOUTS = 'PAYPAL_PAYOUTS',
  WISE_PAYOUTS = 'WISE_PAYOUTS',
}
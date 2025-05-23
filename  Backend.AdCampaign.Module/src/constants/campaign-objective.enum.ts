export enum CampaignObjective {
  SALES = 'SALES',
  LEADS = 'LEADS',
  AWARENESS = 'AWARENESS',
  WEBSITE_TRAFFIC = 'WEBSITE_TRAFFIC',
  APP_INSTALLS = 'APP_INSTALLS',
  ENGAGEMENT = 'ENGAGEMENT',
  // APP_PROMOTION from SDS section 2.4, using APP_INSTALLS as per specific file instruction.
  // If APP_PROMOTION is distinct and needed, it should be added. For now, sticking to file instruction.
}
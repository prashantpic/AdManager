import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { IUserContextProvider } from '../domain/interfaces/services/user-context-provider.interface';
import { ICampaignRepository } from '../domain/interfaces/repositories/campaign.repository.interface';
import { IAdSetRepository } from '../domain/interfaces/repositories/ad-set.repository.interface';
import { IAdRepository } from '../domain/interfaces/repositories/ad.repository.interface';
import { IAudienceRepository } from '../domain/interfaces/repositories/audience.repository.interface';
import { ICreativeRepository } from '../domain/interfaces/repositories/creative.repository.interface';
// ICampaignSyncLogRepository might not be needed here unless checking ownership of logs directly.

@Injectable()
export class CampaignOwnerGuard implements CanActivate {
  private readonly logger = new Logger(CampaignOwnerGuard.name);

  constructor(
    @Inject('IUserContextProvider')
    private readonly userContextProvider: IUserContextProvider,
    @Inject('ICampaignRepository')
    private readonly campaignRepository: ICampaignRepository,
    @Inject('IAdSetRepository')
    private readonly adSetRepository: IAdSetRepository,
    @Inject('IAdRepository')
    private readonly adRepository: IAdRepository,
    @Inject('IAudienceRepository')
    private readonly audienceRepository: IAudienceRepository,
    @Inject('ICreativeRepository')
    private readonly creativeRepository: ICreativeRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const params = request.params;
    const body = request.body; // For create operations where ID is in body

    let merchantId: string;
    try {
      merchantId = this.userContextProvider.getMerchantId();
    } catch (error) {
      this.logger.warn('MerchantId not found in context for CampaignOwnerGuard');
      throw new ForbiddenException('User context not available.');
    }

    let resourceOwned = false;

    if (params.campaignId) {
      const campaign = await this.campaignRepository.findById(params.campaignId, merchantId);
      if (!campaign) throw new NotFoundException(`Campaign with ID ${params.campaignId} not found or not accessible.`);
      resourceOwned = campaign.merchantId === merchantId;
    } else if (params.adSetId) {
      const adSet = await this.adSetRepository.findById(params.adSetId, merchantId);
      if (!adSet) throw new NotFoundException(`Ad Set with ID ${params.adSetId} not found or not accessible.`);
      resourceOwned = adSet.campaign.merchantId === merchantId; // Check via campaign
    } else if (params.adId) {
      const ad = await this.adRepository.findById(params.adId, merchantId);
      if (!ad) throw new NotFoundException(`Ad with ID ${params.adId} not found or not accessible.`);
      resourceOwned = ad.adSet.campaign.merchantId === merchantId; // Check via adSet.campaign
    } else if (params.audienceId) {
      const audience = await this.audienceRepository.findById(params.audienceId, merchantId);
      if (!audience) throw new NotFoundException(`Audience with ID ${params.audienceId} not found or not accessible.`);
      resourceOwned = audience.merchantId === merchantId;
    } else if (params.creativeId) {
      const creative = await this.creativeRepository.findById(params.creativeId, merchantId);
      if (!creative) throw new NotFoundException(`Creative with ID ${params.creativeId} not found or not accessible.`);
      resourceOwned = creative.merchantId === merchantId;
    } else if (body?.campaignId) { // e.g. CreateAdSetDto has campaignId
        const campaign = await this.campaignRepository.findById(body.campaignId, merchantId);
        if (!campaign) throw new NotFoundException(`Campaign with ID ${body.campaignId} not found or not accessible for creating child resource.`);
        resourceOwned = campaign.merchantId === merchantId;
    } else if (body?.adSetId) { // e.g. CreateAdDto has adSetId
        const adSet = await this.adSetRepository.findById(body.adSetId, merchantId);
        if (!adSet) throw new NotFoundException(`Ad Set with ID ${body.adSetId} not found or not accessible for creating child resource.`);
        resourceOwned = adSet.campaign.merchantId === merchantId;
    }
    // Add more checks if other ID parameters are used (e.g., for sync logs through campaign)
    // If no specific ID is in params, it might be a list endpoint scoped by merchantId in the service.
    // Or for create endpoints where the parent ID is in the body.
    else {
        // This guard is typically for specific resource access. List/Create endpoints
        // are often handled by service-level merchant scoping.
        // If applied to a general create endpoint (e.g. POST /campaigns), it implicitly passes
        // as ownership is established upon creation with the current merchantId.
        // For now, if no ID is found to check, assume it's okay or not this guard's primary concern.
        // However, for safety, one might default to false if no specific resource ID is checked.
        // For actions like POST /audiences, POST /creatives (not under campaign path), this guard would need to be smart
        // or not applied, relying on service layer to use merchantId.
        // This example assumes it's for :id based routes or create-child routes.
        // If it's a general GET /campaigns, this guard may not be strictly necessary if the service scopes by merchant.
        // Let's assume if no params matched, and it's not a creation with parent ID in body, it's a general merchant-scoped call handled by services.
        return true; // Or throw if an ID was expected but not found in a relevant param
    }


    if (!resourceOwned) {
      this.logger.warn(
        `Forbidden access attempt by merchant ${merchantId} to resource. Params: ${JSON.stringify(params)}`,
      );
      throw new ForbiddenException('Access to this resource is forbidden.');
    }

    return true;
  }
}
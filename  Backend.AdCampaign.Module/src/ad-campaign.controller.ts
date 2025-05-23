```typescript
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  UseGuards,
  Inject,
  ValidationPipe,
  UsePipes,
  ParseUUIDPipe,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger'; // Assuming Swagger is used for API documentation

import { CampaignCrudService } from './application/services/campaign-crud.service';
import { CampaignOrchestrationService } from './application/services/campaign-orchestration.service';
import { AudienceService } from './application/services/audience.service';
import { CreativeManagementService } from './application/services/creative-management.service';
import { CampaignPreviewService } from './application/services/campaign-preview.service';

import { CreateCampaignDto } from './application/dtos/campaign/create-campaign.dto';
import { UpdateCampaignDto } from './application/dtos/campaign/update-campaign.dto';
import { CampaignDto } from './application/dtos/campaign/campaign.dto';
import { CreateAdSetDto } from './application/dtos/ad-set/create-ad-set.dto';
import { UpdateAdSetDto } from './application/dtos/ad-set/update-ad-set.dto';
import { AdSetDto } from './application/dtos/ad-set/ad-set.dto';
import { CreateAdDto } from './application/dtos/ad/create-ad.dto';
import { UpdateAdDto } from './application/dtos/ad/update-ad.dto';
import { AdDto } from './application/dtos/ad/ad.dto';
import { DefineAudienceDto } from './application/dtos/audience/define-audience.dto';
import { AudienceDto } from './application/dtos/audience/audience.dto';
import { UploadCreativeAssetDto } from './application/dtos/creative/upload-creative-asset.dto';
import { CreativeDto } from './application/dtos/creative/creative.dto';
import { AssociateCreativeDto } from './application/dtos/creative/associate-creative.dto';
import { CampaignSyncLogDto } from './application/dtos/sync/campaign-sync-log.dto';

import { AdNetworkType } from './constants/ad-network-type.enum';
import { CampaignStatus } from './constants/campaign-status.enum';

import { IUserContextProvider } from './domain/interfaces/services/user-context-provider.interface';
import { CampaignOwnerGuard } from './guards/campaign-owner.guard';
import { FeatureAccessGuard } from './guards/feature-access.guard';

// Placeholder for a DTO used in updateCampaignStatus
class UpdateCampaignStatusDto {
  @ApiProperty({ enum: CampaignStatus })
  status: CampaignStatus;
}
import { ApiProperty } from '@nestjs/swagger';


@ApiTags('Ad Campaigns')
@Controller('campaigns')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
// @UseGuards(JwtAuthGuard) // Assuming JwtAuthGuard is applied globally or in a higher-level module
export class AdCampaignController {
  constructor(
    private readonly campaignCrudService: CampaignCrudService,
    private readonly campaignOrchestrationService: CampaignOrchestrationService,
    private readonly audienceService: AudienceService,
    private readonly creativeManagementService: CreativeManagementService,
    private readonly campaignPreviewService: CampaignPreviewService,
    @Inject(IUserContextProvider) private readonly userContextProvider: IUserContextProvider,
  ) {}

  @Post()
  @UseGuards(FeatureAccessGuard) // For overall campaign limit check if applicable
  @ApiOperation({ summary: 'Create a new campaign' })
  @ApiResponse({ status: 201, description: 'Campaign created successfully.', type: CampaignDto })
  async createCampaign(@Body() createCampaignDto: CreateCampaignDto): Promise<CampaignDto> {
    const merchantId = this.userContextProvider.getMerchantId();
    return this.campaignCrudService.createCampaign(merchantId, createCampaignDto);
  }

  @Get(':id')
  @UseGuards(CampaignOwnerGuard)
  @ApiOperation({ summary: 'Get a campaign by ID' })
  @ApiResponse({ status: 200, description: 'Campaign details.', type: CampaignDto })
  async getCampaignById(@Param('id', ParseUUIDPipe) id: string): Promise<CampaignDto> {
    const merchantId = this.userContextProvider.getMerchantId();
    return this.campaignCrudService.getCampaignById(merchantId, id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all campaigns for the merchant' })
  @ApiResponse({ status: 200, description: 'List of campaigns.', type: [CampaignDto] })
  async getCampaignsByMerchantId(): Promise<CampaignDto[]> {
    const merchantId = this.userContextProvider.getMerchantId();
    return this.campaignCrudService.getCampaignsByMerchantId(merchantId);
  }

  @Put(':id')
  @UseGuards(CampaignOwnerGuard)
  @ApiOperation({ summary: 'Update a campaign' })
  @ApiResponse({ status: 200, description: 'Campaign updated successfully.', type: CampaignDto })
  async updateCampaign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
  ): Promise<CampaignDto> {
    const merchantId = this.userContextProvider.getMerchantId();
    return this.campaignCrudService.updateCampaign(merchantId, id, updateCampaignDto);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(CampaignOwnerGuard)
  @ApiOperation({ summary: 'Archive a campaign' })
  @ApiResponse({ status: 204, description: 'Campaign archived successfully.' })
  async archiveCampaign(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    const merchantId = this.userContextProvider.getMerchantId();
    await this.campaignCrudService.archiveCampaign(merchantId, id);
  }

  @Post(':id/duplicate')
  @UseGuards(CampaignOwnerGuard, FeatureAccessGuard)
  @ApiOperation({ summary: 'Duplicate a campaign' })
  @ApiResponse({ status: 201, description: 'Campaign duplicated successfully.', type: CampaignDto })
  async duplicateCampaign(@Param('id', ParseUUIDPipe) id: string): Promise<CampaignDto> {
    const merchantId = this.userContextProvider.getMerchantId();
    return this.campaignCrudService.duplicateCampaign(merchantId, id);
  }

  @Post(':id/publish/:adNetwork')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(CampaignOwnerGuard, FeatureAccessGuard)
  @ApiOperation({ summary: 'Publish a campaign to an ad network' })
  @ApiParam({ name: 'adNetwork', enum: AdNetworkType })
  @ApiResponse({ status: 202, description: 'Campaign publish request accepted.' })
  async publishCampaign(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('adNetwork') adNetwork: AdNetworkType,
  ): Promise<void> {
    const merchantId = this.userContextProvider.getMerchantId();
    await this.campaignOrchestrationService.publishCampaign(merchantId, id, adNetwork);
  }

  @Post(':id/status')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CampaignOwnerGuard, FeatureAccessGuard)
  @ApiOperation({ summary: 'Update campaign status on ad networks' })
  @ApiBody({ type: UpdateCampaignStatusDto })
  @ApiResponse({ status: 200, description: 'Campaign status update request processed.' })
  async updateCampaignStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateCampaignStatusDto,
  ): Promise<void> {
    const merchantId = this.userContextProvider.getMerchantId();
    // Note: The SDS implies CampaignOrchestrationService.updateCampaignStatus might take adNetwork.
    // Current spec for service in 2.6.2 does not specify adNetwork, assuming it handles all linked networks or a default one.
    // If specific ad network update is needed, DTO and service might need adjustment.
    // For now, assuming newStatus is intended for internal and potentially external sync.
    await this.campaignOrchestrationService.updateCampaignStatus(merchantId, id, updateStatusDto.status);
  }

  @Get(':id/sync-logs')
  @UseGuards(CampaignOwnerGuard)
  @ApiOperation({ summary: 'Fetch synchronization logs for a campaign' })
  @ApiResponse({ status: 200, description: 'List of sync logs.', type: [CampaignSyncLogDto] })
  async fetchCampaignSyncLogs(@Param('id', ParseUUIDPipe) id: string): Promise<CampaignSyncLogDto[]> {
    const merchantId = this.userContextProvider.getMerchantId();
    return this.campaignOrchestrationService.fetchCampaignSyncLogs(merchantId, id);
  }

  @Post(':id/sync-status/:adNetwork')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CampaignOwnerGuard)
  @ApiOperation({ summary: 'Sync campaign status from an ad network' })
  @ApiParam({ name: 'adNetwork', enum: AdNetworkType })
  @ApiResponse({ status: 200, description: 'Campaign status synced.', type: Object }) // Returns { status: CampaignStatus }
  async syncCampaignStatusFromAdNetwork(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('adNetwork') adNetwork: AdNetworkType,
  ): Promise<{ status: CampaignStatus }> {
    const merchantId = this.userContextProvider.getMerchantId();
    const status = await this.campaignOrchestrationService.syncCampaignStatusFromAdNetwork(merchantId, id, adNetwork);
    return { status };
  }

  // --- AdSet Endpoints ---
  @Post('ad-sets')
  @UseGuards(CampaignOwnerGuard, FeatureAccessGuard) // CampaignOwnerGuard needs to check createAdSetDto.campaignId
  @ApiOperation({ summary: 'Create a new ad set' })
  @ApiResponse({ status: 201, description: 'Ad set created successfully.', type: AdSetDto })
  async createAdSet(@Body() createAdSetDto: CreateAdSetDto): Promise<AdSetDto> {
    const merchantId = this.userContextProvider.getMerchantId();
    return this.campaignCrudService.createAdSet(merchantId, createAdSetDto.campaignId, createAdSetDto);
  }

  @Put('ad-sets/:id')
  @UseGuards(CampaignOwnerGuard)
  @ApiOperation({ summary: 'Update an ad set' })
  @ApiResponse({ status: 200, description: 'Ad set updated successfully.', type: AdSetDto })
  async updateAdSet(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAdSetDto: UpdateAdSetDto,
  ): Promise<AdSetDto> {
    const merchantId = this.userContextProvider.getMerchantId();
    return this.campaignCrudService.updateAdSet(merchantId, id, updateAdSetDto);
  }

  @Get('ad-sets/:id')
  @UseGuards(CampaignOwnerGuard)
  @ApiOperation({ summary: 'Get an ad set by ID' })
  @ApiResponse({ status: 200, description: 'Ad set details.', type: AdSetDto })
  async getAdSetById(@Param('id', ParseUUIDPipe) id: string): Promise<AdSetDto> {
    const merchantId = this.userContextProvider.getMerchantId();
    return this.campaignCrudService.getAdSetById(merchantId, id);
  }

  @Get('ad-sets/:adSetId/ads')
  @UseGuards(CampaignOwnerGuard) // Guard needs to check ownership of adSetId
  @ApiOperation({ summary: 'Get all ads for an ad set' })
  @ApiResponse({ status: 200, description: 'List of ads.', type: [AdDto] })
  async getAdsByAdSetId(@Param('adSetId', ParseUUIDPipe) adSetId: string): Promise<AdDto[]> {
    const merchantId = this.userContextProvider.getMerchantId();
    return this.campaignCrudService.getAdsByAdSetId(merchantId, adSetId);
  }


  // --- Ad Endpoints ---
  @Post('ads')
  @UseGuards(CampaignOwnerGuard, FeatureAccessGuard) // CampaignOwnerGuard needs to check createAdDto.adSetId
  @ApiOperation({ summary: 'Create a new ad' })
  @ApiResponse({ status: 201, description: 'Ad created successfully.', type: AdDto })
  async createAd(@Body() createAdDto: CreateAdDto): Promise<AdDto> {
    const merchantId = this.userContextProvider.getMerchantId();
    return this.campaignCrudService.createAd(merchantId, createAdDto.adSetId, createAdDto);
  }

  @Put('ads/:id')
  @UseGuards(CampaignOwnerGuard)
  @ApiOperation({ summary: 'Update an ad' })
  @ApiResponse({ status: 200, description: 'Ad updated successfully.', type: AdDto })
  async updateAd(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAdDto: UpdateAdDto,
  ): Promise<AdDto> {
    const merchantId = this.userContextProvider.getMerchantId();
    return this.campaignCrudService.updateAd(merchantId, id, updateAdDto);
  }

  @Post('ads/:adId/associate-creative')
  @UseGuards(CampaignOwnerGuard) // Guard needs to check ownership of adId
  @ApiOperation({ summary: 'Associate a creative with an ad' })
  @ApiResponse({ status: 200, description: 'Creative associated successfully.', type: AdDto })
  async associateCreativeWithAd(
    @Param('adId', ParseUUIDPipe) adId: string,
    @Body() associateCreativeDto: AssociateCreativeDto,
  ): Promise<AdDto> {
    const merchantId = this.userContextProvider.getMerchantId();
    return this.creativeManagementService.associateCreativeWithAd(
      merchantId,
      adId,
      associateCreativeDto.creativeId,
      associateCreativeDto.adCreativeContent,
    );
  }

  @Post('ads/:id/preview/:adNetwork')
  @UseGuards(CampaignOwnerGuard, FeatureAccessGuard)
  @ApiOperation({ summary: 'Get ad preview from an ad network' })
  @ApiParam({ name: 'adNetwork', enum: AdNetworkType })
  @ApiResponse({ status: 200, description: 'Ad preview URL.', type: Object }) // Returns { previewUrl: string }
  async getAdPreview(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('adNetwork') adNetwork: AdNetworkType,
  ): Promise<{ previewUrl: string }> {
    const merchantId = this.userContextProvider.getMerchantId();
    const previewUrl = await this.campaignPreviewService.getAdPreview(merchantId, id, adNetwork);
    return { previewUrl };
  }

  // --- Creative Endpoints ---
  @Post('creatives/upload')
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(FeatureAccessGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
      description: 'Creative asset file and metadata',
      type: UploadCreativeAssetDto, // Swagger might need a more specific type for multipart
  })
  @ApiOperation({ summary: 'Upload a creative asset' })
  @ApiResponse({ status: 201, description: 'Creative asset uploaded successfully.', type: CreativeDto })
  async uploadCreativeAsset(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadCreativeAssetDto: UploadCreativeAssetDto,
  ): Promise<CreativeDto> {
    const merchantId = this.userContextProvider.getMerchantId();
    if (!file) {
        // Handle error: file not provided
        throw new Error('File not provided for creative asset upload.');
    }
    return this.creativeManagementService.uploadCreativeAsset(
      merchantId,
      file.buffer,
      file.originalname,
      file.mimetype,
      uploadCreativeAssetDto.name,
      uploadCreativeAssetDto.type,
    );
  }

  @Get('creatives/:id')
  @UseGuards(CampaignOwnerGuard) // Guard needs to check ownership of creativeId
  @ApiOperation({ summary: 'Get a creative by ID' })
  @ApiResponse({ status: 200, description: 'Creative details.', type: CreativeDto })
  async getCreativeById(@Param('id', ParseUUIDPipe) id: string): Promise<CreativeDto> {
    const merchantId = this.userContextProvider.getMerchantId();
    return this.creativeManagementService.getCreativeById(merchantId, id);
  }

  @Get('creatives')
  @ApiOperation({ summary: 'Get all creatives for the merchant' })
  @ApiResponse({ status: 200, description: 'List of creatives.', type: [CreativeDto] })
  async getCreativesByMerchantId(): Promise<CreativeDto[]> {
    const merchantId = this.userContextProvider.getMerchantId();
    return this.creativeManagementService.getCreativesByMerchantId(merchantId);
  }

  // --- Audience Endpoints ---
  @Post('audiences')
  @UseGuards(FeatureAccessGuard)
  @ApiOperation({ summary: 'Define a new audience' })
  @ApiResponse({ status: 201, description: 'Audience defined successfully.', type: AudienceDto })
  async defineAudience(@Body() defineAudienceDto: DefineAudienceDto): Promise<AudienceDto> {
    const merchantId = this.userContextProvider.getMerchantId();
    return this.audienceService.defineAudience(merchantId, defineAudienceDto);
  }

  @Put('audiences/:id')
  @UseGuards(CampaignOwnerGuard) // Guard needs to check ownership of audienceId
  @ApiOperation({ summary: 'Update an audience' })
  @ApiResponse({ status: 200, description: 'Audience updated successfully.', type: AudienceDto })
  async updateAudience(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() defineAudienceDto: DefineAudienceDto,
  ): Promise<AudienceDto> {
    const merchantId = this.userContextProvider.getMerchantId();
    return this.audienceService.updateAudience(merchantId, id, defineAudienceDto);
  }

  @Get('audiences/:id')
  @UseGuards(CampaignOwnerGuard) // Guard needs to check ownership of audienceId
  @ApiOperation({ summary: 'Get an audience by ID' })
  @ApiResponse({ status: 200, description: 'Audience details.', type: AudienceDto })
  async getAudienceById(@Param('id', ParseUUIDPipe) id: string): Promise<AudienceDto> {
    const merchantId = this.userContextProvider.getMerchantId();
    return this.audienceService.getAudienceById(merchantId, id);
  }

  @Get('audiences')
  @ApiOperation({ summary: 'Get all audiences for the merchant' })
  @ApiResponse({ status: 200, description: 'List of audiences.', type: [AudienceDto] })
  async getAudiencesByMerchantId(): Promise<AudienceDto[]> {
    const merchantId = this.userContextProvider.getMerchantId();
    return this.audienceService.getAudiencesByMerchantId(merchantId);
  }
}
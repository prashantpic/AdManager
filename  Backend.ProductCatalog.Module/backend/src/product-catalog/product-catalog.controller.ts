import {
  Controller,
  Post,
  Body,
  Put,
  Param,
  Get,
  Delete,
  UsePipes,
  ValidationPipe,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ProductCatalogService } from './application/services/product-catalog.service';
import {
  CreateCatalogDto,
  UpdateCatalogDto,
  CatalogDto,
  FeedGenerationRequestDto,
  SyncStatusDto,
  WebhookPayloadDto,
  CatalogSyncHistoryDto,
} from './application/dtos';
import { AdPlatform, FeedFormat } from './domain/common/enums';
import { CatalogMapper } from './application/mappers/catalog.mapper';
import { SyncHistoryMapper } from './application/mappers/sync-history.mapper';
import { AuthenticatedUser, User } from '@admanager/backend-core'; // Assuming @User decorator and AuthenticatedUser type

/**
 * @Namespace AdManager.Platform.Backend.ProductCatalog
 * @Purpose Exposes product catalog functionalities via HTTP API endpoints, ensuring proper authentication and authorization.
 * @ComponentId product-catalog-controller-001
 * @GeneratedBy ADM-Tools
 */
@Controller('product-catalogs')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
// @UseGuards(JwtAuthGuard, MerchantScopeGuard) // Example guards, assuming they exist
export class ProductCatalogController {
  constructor(private readonly productCatalogService: ProductCatalogService) {}

  /**
   * @Endpoint POST /product-catalogs
   * @Summary Creates a new product catalog.
   * @REQ REQ-PCM-001
   */
  @Post()
  async createCatalog(
    @Body() createCatalogDto: CreateCatalogDto,
    @User() currentUser: AuthenticatedUser,
  ): Promise<CatalogDto> {
    const catalog = await this.productCatalogService.createCatalog(
      createCatalogDto,
      currentUser.merchantId,
    );
    // Fetch last sync history if needed for DTO, or mapper handles it if Catalog entity has it
    const lastSync = null; // Placeholder, CatalogMapper might need logic to fetch this
    return CatalogMapper.toDto(catalog, lastSync);
  }

  /**
   * @Endpoint PUT /product-catalogs/:catalogId
   * @Summary Updates an existing product catalog.
   * @REQ REQ-PCM-001, REQ-PCM-002
   */
  @Put(':catalogId')
  async updateCatalog(
    @Param('catalogId', ParseUUIDPipe) catalogId: string,
    @Body() updateCatalogDto: UpdateCatalogDto,
    @User() currentUser: AuthenticatedUser,
  ): Promise<CatalogDto> {
    const catalog = await this.productCatalogService.updateCatalog(
      catalogId,
      updateCatalogDto,
      currentUser.merchantId,
    );
    const lastSync = null; // Placeholder
    return CatalogMapper.toDto(catalog, lastSync);
  }

  /**
   * @Endpoint GET /product-catalogs/:catalogId
   * @Summary Retrieves details of a specific product catalog.
   * @REQ REQ-PCM-001
   */
  @Get(':catalogId')
  async getCatalogById(
    @Param('catalogId', ParseUUIDPipe) catalogId: string,
    @User() currentUser: AuthenticatedUser,
  ): Promise<CatalogDto> {
    const catalog = await this.productCatalogService.findCatalogByIdForMerchant(
      catalogId,
      currentUser.merchantId,
    );
    if (!catalog) {
        // This will be caught by NestJS default exception filter or a custom one
        throw new Error('Catalog not found'); // Or specific CatalogNotFoundException
    }
    // TODO: Fetch last sync history for this specific catalog for its primary adPlatform
    // const syncHistory = await this.productCatalogService.getSyncHistoryForCatalog(catalogId, currentUser.merchantId);
    // const lastSync = SyncHistoryMapper.toSyncStatusDto(syncHistory, catalog.adPlatform);
    const lastSync = null; // Simplified for now
    return CatalogMapper.toDto(catalog, lastSync);
  }

  /**
   * @Endpoint GET /product-catalogs
   * @Summary Lists all product catalogs for the authenticated merchant.
   * @REQ REQ-PCM-001
   */
  @Get()
  async listCatalogs(
    @User() currentUser: AuthenticatedUser,
  ): Promise<CatalogDto[]> {
    const catalogs = await this.productCatalogService.findAllCatalogsByMerchant(
      currentUser.merchantId,
    );
    // TODO: Efficiently fetch last sync history for all catalogs
    return CatalogMapper.toDtoList(catalogs); // Simplified for now
  }

  /**
   * @Endpoint DELETE /product-catalogs/:catalogId
   * @Summary Deletes a product catalog.
   * @REQ REQ-PCM-001
   */
  @Delete(':catalogId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCatalog(
    @Param('catalogId', ParseUUIDPipe) catalogId: string,
    @User() currentUser: AuthenticatedUser,
  ): Promise<void> {
    await this.productCatalogService.deleteCatalogForMerchant(
      catalogId,
      currentUser.merchantId,
    );
  }

  /**
   * @Endpoint POST /product-catalogs/:catalogId/generate-feed
   * @Summary Triggers on-demand feed generation and returns a temporary URL.
   * @REQ REQ-PCM-003
   */
  @Post(':catalogId/generate-feed')
  async generateCatalogFeed(
    @Param('catalogId', ParseUUIDPipe) catalogId: string,
    @Body() feedRequestDto: FeedGenerationRequestDto,
    @User() currentUser: AuthenticatedUser,
  ): Promise<{ feedUrl: string }> {
    const feedUrl = await this.productCatalogService.generateFeed(
      catalogId,
      feedRequestDto.format,
      currentUser.merchantId,
    );
    return { feedUrl };
  }

  /**
   * @Endpoint POST /product-catalogs/:catalogId/sync/:adPlatform
   * @Summary Triggers on-demand synchronization for a specific ad platform.
   * @REQ REQ-PCM-005
   */
  @Post(':catalogId/sync/:adPlatform')
  @HttpCode(HttpStatus.ACCEPTED) // Sync is async
  async triggerCatalogSync(
    @Param('catalogId', ParseUUIDPipe) catalogId: string,
    @Param('adPlatform') adPlatform: AdPlatform, // Assuming AdPlatform enum is correctly parsed
    @User() currentUser: AuthenticatedUser,
  ): Promise<void> {
    // Validation for adPlatform enum can be done with a custom pipe if needed
    // For now, assume adPlatform is a valid value from the AdPlatform enum.
    await this.productCatalogService.initiateSyncForPlatform(
      catalogId,
      adPlatform,
      currentUser.merchantId,
    );
  }

  /**
   * @Endpoint GET /product-catalogs/:catalogId/sync-status
   * @Summary Retrieves sync status data for the dashboard for a specific catalog.
   * @REQ REQ-PCM-008
   */
  @Get(':catalogId/sync-status')
  async getSyncStatusDashboard(
    @Param('catalogId', ParseUUIDPipe) catalogId: string,
    @User() currentUser: AuthenticatedUser,
  ): Promise<SyncStatusDto[]> { // Returns an array of SyncStatusDto, one per platform maybe
    const historyEntries =
      await this.productCatalogService.getSyncHistoryForCatalog(
        catalogId,
        currentUser.merchantId,
      );
    
    // Group history by platform and get the latest for each
    const platformStatusMap = new Map<AdPlatform, CatalogSyncHistory[]>();
    historyEntries.forEach(entry => {
        if (!platformStatusMap.has(entry.adPlatform)) {
            platformStatusMap.set(entry.adPlatform, []);
        }
        platformStatusMap.get(entry.adPlatform)?.push(entry);
    });

    const syncStatusDtos: SyncStatusDto[] = [];
    platformStatusMap.forEach((entries, platform) => {
        const dto = SyncHistoryMapper.toSyncStatusDto(entries, platform);
        if (dto) {
            syncStatusDtos.push(dto);
        }
    });

    return syncStatusDtos;
  }

  /**
   * @Endpoint POST /product-catalogs/webhook/:platformIdentifier
   * @Summary Handles incoming webhooks from external platforms (e.g., inventory updates).
   * @REQ REQ-PCM-006
   */
  @Post('webhook/:platformIdentifier')
  @HttpCode(HttpStatus.ACCEPTED)
  async handlePlatformWebhook(
    @Param('platformIdentifier') platformIdentifier: string,
    @Body() payload: WebhookPayloadDto, // DTO needs robust validation
    // @Headers('X-Webhook-Signature') signature: string, // For webhook signature validation
  ): Promise<void> {
    // TODO: Implement webhook signature validation for security
    // For example:
    // if (!this.webhookValidatorService.isValid(platformIdentifier, payload, signature)) {
    //   throw new ForbiddenException('Invalid webhook signature');
    // }

    // The payload should contain merchant identification if not authenticated via other means
    // Assuming WebhookPayloadDto has merchantId or it's derived.
    // If webhook is generic and not tied to a user session, payload must identify merchant.
    if (!payload.merchantId) {
        throw new Error("Webhook payload must contain merchantId."); // Or BadRequestException
    }

    await this.productCatalogService.processInventoryUpdateWebhook(
      payload,
      platformIdentifier,
    );
  }


  /**
   * @Endpoint GET /product-catalogs/:catalogId/sync-history
   * @Summary Retrieves detailed sync history for a catalog.
   */
  @Get(':catalogId/sync-history')
  async getCatalogSyncHistory(
    @Param('catalogId', ParseUUIDPipe) catalogId: string,
    @User() currentUser: AuthenticatedUser,
    @Query('platform') adPlatform?: AdPlatform, // Optional filter by platform
  ): Promise<CatalogSyncHistoryDto[]> {
    let historyEntries =
      await this.productCatalogService.getSyncHistoryForCatalog(
        catalogId,
        currentUser.merchantId,
      );

    if (adPlatform) {
      historyEntries = historyEntries.filter(
        (entry) => entry.adPlatform === adPlatform,
      );
    }
    return SyncHistoryMapper.toCatalogSyncHistoryDtoList(historyEntries);
  }
}
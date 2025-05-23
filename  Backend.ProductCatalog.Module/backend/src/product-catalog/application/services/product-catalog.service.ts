import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SqsProducerService } from '@admanager/backend-core'; // Assuming core module exports this

import { ICatalogRepository } from '../../domain/catalog/interfaces/catalog.repository.interface';
import { IProductRepository } from '../../domain/product/interfaces/product.repository.interface';
import { ICatalogSyncHistoryRepository } from '../../domain/sync-history/interfaces/catalog-sync-history.repository.interface';
import { IFeedGenerator } from '../../domain/common/interfaces/feed-generator.interface';
import { ProductCatalogS3Adapter } from '../../infrastructure/adapters/s3.adapter';
import { ProductCatalogNotificationAdapter } from '../../infrastructure/adapters/notification.adapter';
import { ProductCatalogAdPlatformIntegrationAdapter } from '../../infrastructure/adapters/ad-platform-integration.adapter';

import { Catalog } from '../../domain/catalog/catalog.aggregate';
import { Product } from '../../domain/product/product.entity';
import { CatalogSyncHistory } from '../../domain/sync-history/catalog-sync-history.entity';
import { CatalogProductItem } from '../../domain/catalog/catalog-product-item.entity';

import { CreateCatalogDto, UpdateCatalogDto, WebhookPayloadDto } from '../dtos';
import { AdPlatform, FeedFormat, SyncStatus, OutOfStockHandling } from '../../domain/common/enums';

import { CatalogMapper } from '../mappers/catalog.mapper';
import { ProductMapper } from '../mappers/product.mapper';

import { CatalogNotFoundException } from '../../domain/common/exceptions/catalog-not-found.exception';
import { FeedGenerationException } from '../../domain/common/exceptions/feed-generation.exception';
import { SyncFailedException } from '../../domain/common/exceptions/sync-failed.exception';
import { FeedSettingsValueObject } from '../../domain/catalog/value-objects/feed-settings.value-object';
import { OutOfStockRuleValueObject } from '../../domain/catalog/value-objects/out-of-stock-rule.value-object';

/**
 * @Namespace AdManager.Platform.Backend.ProductCatalog.Application.Services
 * @Purpose Encapsulates the core business logic and use cases for managing and synchronizing product catalogs.
 * @ComponentId product-catalog-service-001
 * @GeneratedBy ADM-Tools
 */
@Injectable()
export class ProductCatalogService {
  private readonly logger = new Logger(ProductCatalogService.name);

  constructor(
    @Inject('ICatalogRepository')
    private readonly catalogRepository: ICatalogRepository,
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    @Inject('ICatalogSyncHistoryRepository')
    private readonly catalogSyncHistoryRepository: ICatalogSyncHistoryRepository,
    @Inject('IFeedGenerator') // Injected as an array of all feed generators
    private readonly feedGenerators: IFeedGenerator[],
    private readonly s3Adapter: ProductCatalogS3Adapter,
    private readonly notificationAdapter: ProductCatalogNotificationAdapter,
    private readonly adPlatformIntegrationAdapter: ProductCatalogAdPlatformIntegrationAdapter,
    private readonly configService: ConfigService,
    // Assuming SqsProducerService is provided by a CoreModule and injected
    private readonly sqsProducerService: SqsProducerService,
  ) {}

  async createCatalog(
    createCatalogDto: CreateCatalogDto,
    merchantId: string,
  ): Promise<Catalog> {
    this.logger.log(
      `Creating catalog for merchant ${merchantId}: ${createCatalogDto.name}`,
    );
    const catalog = new Catalog();
    catalog.merchantId = merchantId;
    catalog.name = createCatalogDto.name;
    catalog.description = createCatalogDto.description;
    catalog.adPlatform = createCatalogDto.adPlatform;
    catalog.feedSettings = new FeedSettingsValueObject(
      createCatalogDto.feedSettings.format,
      createCatalogDto.feedSettings.customFileName,
    );
    catalog.outOfStockRule = new OutOfStockRuleValueObject(
      createCatalogDto.outOfStockRule.handling,
      createCatalogDto.outOfStockRule.temporaryAllowanceDays,
    );
    catalog.productItems = [];

    if (createCatalogDto.productIds && createCatalogDto.productIds.length > 0) {
      // Optionally validate if products exist for merchant if strict validation is needed upfront
      // For now, we assume productIds are valid and belong to the merchant
      createCatalogDto.productIds.forEach((productId) => {
        const item = new CatalogProductItem();
        item.productId = productId;
        // item.catalog = catalog; // This will be set by TypeORM cascade or manual linking
        catalog.addProductItem(item.productId); // Assuming addProductItem creates and adds CatalogProductItem
      });
    }
    return this.catalogRepository.save(catalog);
  }

  async updateCatalog(
    catalogId: string,
    updateCatalogDto: UpdateCatalogDto,
    merchantId: string,
  ): Promise<Catalog> {
    this.logger.log(
      `Updating catalog ${catalogId} for merchant ${merchantId}`,
    );
    const catalog = await this.findCatalogByIdForMerchant(
      catalogId,
      merchantId,
    );
    if (!catalog) {
      throw new CatalogNotFoundException(catalogId);
    }

    catalog.updateDetails(
      updateCatalogDto.name,
      updateCatalogDto.description,
      updateCatalogDto.adPlatform,
    );

    if (updateCatalogDto.feedSettings) {
      catalog.updateFeedSettings(
        new FeedSettingsValueObject(
          updateCatalogDto.feedSettings.format,
          updateCatalogDto.feedSettings.customFileName,
        ),
      );
    }
    if (updateCatalogDto.outOfStockRule) {
      catalog.updateOutOfStockRule(
        new OutOfStockRuleValueObject(
          updateCatalogDto.outOfStockRule.handling,
          updateCatalogDto.outOfStockRule.temporaryAllowanceDays,
        ),
      );
    }

    // Handle product items update: replace all items
    // More sophisticated logic (add/remove specific items) can be added if needed
    if (updateCatalogDto.productIds) {
      // Clear existing product items and add new ones
      // This requires careful handling of orphan removal or cascading deletes for CatalogProductItem
      // For simplicity, let's assume the repository handles replacement correctly or domain method does
      catalog.productItems = []; // Clear existing
      updateCatalogDto.productIds.forEach((productId) => {
         // Here, we'd ideally manage CatalogProductItem entities directly
         // or the Catalog aggregate handles the creation and association.
         // The `addProductItem` in Catalog aggregate should handle creation of CatalogProductItem.
        catalog.addProductItem(productId, updateCatalogDto.productOverrides?.[productId]?.customTitle, updateCatalogDto.productOverrides?.[productId]?.customDescription);
      });
    }


    return this.catalogRepository.save(catalog);
  }

  async findCatalogByIdForMerchant(
    catalogId: string,
    merchantId: string,
  ): Promise<Catalog | null> {
    this.logger.debug(
      `Finding catalog ${catalogId} for merchant ${merchantId}`,
    );
    const catalog = await this.catalogRepository.findByIdAndMerchantId(
      catalogId,
      merchantId,
    );
    if (!catalog) {
        return null;
    }
    return catalog;
  }

  async findAllCatalogsByMerchant(merchantId: string): Promise<Catalog[]> {
    this.logger.debug(`Finding all catalogs for merchant ${merchantId}`);
    return this.catalogRepository.findAllByMerchantId(merchantId);
  }

  async deleteCatalogForMerchant(
    catalogId: string,
    merchantId: string,
  ): Promise<void> {
    this.logger.log(
      `Deleting catalog ${catalogId} for merchant ${merchantId}`,
    );
    const catalog = await this.findCatalogByIdForMerchant(
      catalogId,
      merchantId,
    );
    if (!catalog) {
      throw new CatalogNotFoundException(catalogId);
    }
    await this.catalogRepository.deleteByIdAndMerchantId(catalogId, merchantId);
  }

  async generateFeed(
    catalogId: string,
    format: FeedFormat,
    merchantId: string,
  ): Promise<string> {
    this.logger.log(
      `Generating feed for catalog ${catalogId}, format ${format}, merchant ${merchantId}`,
    );
    const catalog = await this.catalogRepository.findByIdAndMerchantIdWithItems(catalogId, merchantId);
    if (!catalog) {
      throw new CatalogNotFoundException(catalogId);
    }

    const productIds = catalog.productItems.map((item) => item.productId);
    if (productIds.length === 0) {
        this.logger.warn(`Catalog ${catalogId} has no products. Generating empty feed.`);
        // Return empty feed or handle as error depending on requirements
    }

    let products = await this.productRepository.findByIdsAndMerchantId(
      productIds,
      merchantId,
    );

    products = await this.applyOutOfStockRulesToProducts(
      catalog, // Pass the fetched catalog
      products,
    );
    
    const itemOverridesMap = new Map<string, CatalogProductItem>();
    catalog.productItems.forEach(item => itemOverridesMap.set(item.productId, item));


    const generator = this.feedGenerators.find((g) => g.supports(format));
    if (!generator) {
      throw new FeedGenerationException(
        `No feed generator found for format: ${format}`,
      );
    }

    try {
      const productDtos = ProductMapper.toCatalogProductDtoList(products, itemOverridesMap);
      const feedContent = await generator.generate(catalog, productDtos); // Generator expects DTOs or Products+Overrides
      
      const fileName = `${catalog.feedSettings.customFileName || catalog.name.replace(/\s+/g, '_')}-${Date.now()}.${format.toLowerCase()}`;
      const contentType = format === FeedFormat.CSV ? 'text/csv' : 'application/xml';
      
      const feedUrl = await this.s3Adapter.uploadFeed(
        feedContent,
        fileName,
        contentType,
        merchantId,
        catalogId,
      );
      this.logger.log(`Feed generated and uploaded to S3: ${feedUrl}`);
      return feedUrl;
    } catch (error) {
      this.logger.error(
        `Error generating feed for catalog ${catalogId}: ${error.message}`,
        error.stack,
      );
      throw new FeedGenerationException(
        `Failed to generate feed: ${error.message}`,
      );
    }
  }

  async initiateSyncForPlatform(
    catalogId: string,
    platform: AdPlatform,
    merchantId: string,
  ): Promise<void> {
    this.logger.log(
      `Initiating sync for catalog ${catalogId} to platform ${platform}, merchant ${merchantId}`,
    );
    const catalog = await this.findCatalogByIdForMerchant(catalogId, merchantId);
    if (!catalog) {
      throw new CatalogNotFoundException(catalogId);
    }
    if (catalog.adPlatform !== platform) {
        this.logger.warn(`Attempting to sync catalog ${catalogId} to ${platform}, but it's configured for ${catalog.adPlatform}. Proceeding anyway for on-demand sync.`);
        // Or throw an error: throw new Error(`Catalog ${catalogId} is configured for ${catalog.adPlatform}, not ${platform}`);
    }

    let syncHistoryEntry: CatalogSyncHistory | null = null;
    try {
      syncHistoryEntry = await this.recordSyncAttempt(
        catalogId,
        platform,
        SyncStatus.PENDING,
        'Sync initiated',
      );

      const feedUrl = await this.generateFeed(
        catalogId,
        catalog.feedSettings.format, // Use the catalog's configured format
        merchantId,
      );

      // Placeholder for merchant platform credentials
      // In a real app, these would be fetched securely, e.g., from a Vault or encrypted store
      const merchantPlatformCredentials = { apiKey: 'dummyApiKeyForNow' };

      const syncResult =
        await this.adPlatformIntegrationAdapter.syncCatalogToPlatform(
          catalog,
          feedUrl,
          platform,
          merchantPlatformCredentials,
        );

      if (syncResult.success) {
        await this.recordSyncAttempt(
          catalogId,
          platform,
          SyncStatus.SUCCESS,
          JSON.stringify(syncResult.platformSpecificResponse || {}),
          undefined,
          undefined,
          syncResult.retries,
          syncHistoryEntry.id
        );
        await this.notificationAdapter.sendSyncSuccessNotification(
          merchantId,
          catalog.name,
          platform,
        );
      } else {
        throw new SyncFailedException(
            platform,
            syncResult.error?.message || 'Unknown platform error',
            syncResult.error?.code,
            syncResult.error?.isTransient,
            syncResult.retries
        );
      }
    } catch (error) {
      this.logger.error(
        `Sync failed for catalog ${catalogId} to platform ${platform}: ${error.message}`,
        error.stack,
      );
      const errorMessage = error.message || 'Sync failed due to an internal error.';
      const errorCode = error instanceof SyncFailedException ? error.platformErrorCode : undefined;
      const retries = error instanceof SyncFailedException ? error.retries : 0;

      await this.recordSyncAttempt(
        catalogId,
        platform,
        SyncStatus.FAILED,
        `Error: ${errorMessage}`,
        errorMessage,
        errorCode,
        retries,
        syncHistoryEntry?.id
      );
      await this.notificationAdapter.sendSyncFailureNotification(
        merchantId,
        catalog.name,
        platform,
        errorMessage,
        errorCode,
      );
      // Re-throw or handle as per broader error strategy.
      // If it's a SyncFailedException, it might already have the right HTTP status.
      if (!(error instanceof SyncFailedException)) {
          throw new SyncFailedException(platform, errorMessage, errorCode, false, retries);
      } else {
          throw error;
      }
    }
  }

  async recordSyncAttempt(
    catalogId: string,
    platform: AdPlatform,
    status: SyncStatus,
    details?: string,
    errorMessage?: string,
    errorCode?: string,
    retries?: number,
    existingHistoryId?: string,
  ): Promise<CatalogSyncHistory> {
    this.logger.debug(
      `Recording sync attempt for catalog ${catalogId}, platform ${platform}, status ${status}`,
    );
    let historyEntry: CatalogSyncHistory | null = null;

    if (existingHistoryId) {
        historyEntry = await this.catalogSyncHistoryRepository.findById(existingHistoryId);
    }
    
    if (!historyEntry) {
        historyEntry = new CatalogSyncHistory();
        historyEntry.catalog = { id: catalogId } as Catalog; // Relation
        historyEntry.adPlatform = platform;
        historyEntry.syncStartedAt = new Date();
    }

    historyEntry.status = status;
    historyEntry.details = details ? { log: details } : undefined;
    historyEntry.errorMessage = errorMessage;
    historyEntry.errorCode = errorCode;
    historyEntry.retries = retries || 0;

    if (status === SyncStatus.SUCCESS || status === SyncStatus.FAILED || status === SyncStatus.PARTIAL) {
      historyEntry.syncEndedAt = new Date();
    }

    return this.catalogSyncHistoryRepository.save(historyEntry);
  }

  async getSyncHistoryForCatalog(
    catalogId: string,
    merchantId: string, // To ensure merchant owns catalog
  ): Promise<CatalogSyncHistory[]> {
    this.logger.debug(
      `Fetching sync history for catalog ${catalogId}, merchant ${merchantId}`,
    );
    // First, verify catalog ownership
    const catalog = await this.catalogRepository.findByIdAndMerchantId(
      catalogId,
      merchantId,
    );
    if (!catalog) {
      throw new CatalogNotFoundException(catalogId);
    }
    return this.catalogSyncHistoryRepository.findByCatalogId(catalogId);
  }

  /**
   * Applies out-of-stock rules to a list of products for a given catalog.
   * This method modifies the products array or filters it based on the catalog's rules.
   */
  async applyOutOfStockRulesToProducts(
    catalog: Catalog, // Pass the full catalog object
    products: Product[],
  ): Promise<Product[]> {
    this.logger.debug(
      `Applying out-of-stock rules for catalog ${catalog.id}`,
    );
    const rule = catalog.outOfStockRule;
    if (!rule) {
      this.logger.warn(`No out-of-stock rule found for catalog ${catalog.id}. Returning products as is.`);
      return products;
    }

    return products
      .map(product => {
        const isOutOfStock = product.stockLevel <= 0 || product.availability === 'out_of_stock';
        if (isOutOfStock) {
          if (rule.handling === OutOfStockHandling.HIDE_ITEM) {
            return null; // Mark for removal
          }
          if (rule.handling === OutOfStockHandling.SET_AVAILABILITY_TO_OUT_OF_STOCK) {
            // Create a new product object to avoid mutating the original from repository
            return { ...product, availability: 'out_of_stock' };
          }
          // TODO: Implement OutOfStockHandling.ALLOW_TEMPORARILY if needed.
          // This would require checking product.sourceUpdatedAt against rule.temporaryAllowanceDays.
          // For now, if ALLOW_TEMPORARILY and out of stock, we might still show it or mark it differently.
          // Defaulting to showing it if not HIDE or SET_AVAILABILITY.
        }
        return product;
      })
      .filter(product => product !== null) as Product[];
  }


  async processInventoryUpdateWebhook(
    payload: WebhookPayloadDto, // Define this DTO based on expected webhook structures
    platformIdentifier: string, // e.g., 'shopify', 'woocommerce'
  ): Promise<void> {
    this.logger.log(
      `Processing inventory update webhook from ${platformIdentifier}`,
    );

    const enableRealtimeProcessing = this.configService.get<boolean>(
      'productCatalog.featureFlags.enableRealtimeWebhookProcessingForProductUpdates',
    );

    if (!enableRealtimeProcessing) {
      this.logger.log(
        'Realtime webhook processing is disabled. Skipping sync trigger.',
      );
      // Optionally, still update local product data even if sync is not triggered
    }

    // 1. Parse payload and identify affected products
    // This is highly dependent on the `WebhookPayloadDto` structure and `platformIdentifier`
    // Example: payload might contain [{ productId: 'xyz', newStock: 10 }, ...]
    const productUpdates = payload.productUpdates || []; // Assume payload.productUpdates: {externalId: string, stock?: number, availability?: string}[]
    if (productUpdates.length === 0) {
        this.logger.warn('Webhook received with no product updates.');
        return;
    }

    const updatedProductSourceIds = productUpdates.map(p => p.externalId);


    // 2. Fetch corresponding internal Product entities
    // This assumes Product entity has a `sourceId` or similar field to map external IDs.
    // For this example, let's assume `product.id` is the external ID for simplicity.
    const internalProducts = await this.productRepository.findBySourceIds(updatedProductSourceIds, payload.merchantId);


    // 3. Update local Product entities
    const productsToSave: Product[] = [];
    for (const pUpdate of productUpdates) {
        const internalProduct = internalProducts.find(p => p.id === pUpdate.externalId); // Or mapping logic
        if (internalProduct) {
            if (pUpdate.stock !== undefined) internalProduct.stockLevel = pUpdate.stock;
            if (pUpdate.availability) internalProduct.availability = pUpdate.availability;
            internalProduct.sourceUpdatedAt = new Date();
            productsToSave.push(internalProduct);
        } else {
            this.logger.warn(`Product with external ID ${pUpdate.externalId} not found for merchant ${payload.merchantId}.`);
        }
    }

    if (productsToSave.length > 0) {
      await this.productRepository.saveMany(productsToSave);
      this.logger.log(`Updated ${productsToSave.length} products from webhook.`);
    } else {
      this.logger.log('No products to update from webhook after matching.');
      return;
    }

    if (!enableRealtimeProcessing) return;

    // 4. Identify related catalogs that need syncing
    const affectedProductIds = productsToSave.map(p => p.id);
    const catalogsToSync = await this.catalogRepository.findCatalogsByProductIds(affectedProductIds, payload.merchantId);


    // 5. Enqueue sync trigger messages to SQS
    const sqsQueueName = this.configService.get<string>('productCatalog.sqsQueueCatalogSyncTrigger');
    for (const catalog of catalogsToSync) {
      if (catalog.adPlatform) { // Ensure catalog has an ad platform configured
        const messageBody = {
          catalogId: catalog.id,
          adPlatform: catalog.adPlatform,
          merchantId: catalog.merchantId,
          triggerType: 'INVENTORY_UPDATE_WEBHOOK',
          sourcePlatform: platformIdentifier
        };
        try {
          await this.sqsProducerService.sendMessage({
            queueUrl: sqsQueueName, // Or construct queue URL if producer expects that
            messageBody: JSON.stringify(messageBody),
            messageGroupId: catalog.id, // For FIFO, if applicable
            messageDeduplicationId: `${catalog.id}-${Date.now()}` // For FIFO
          });
          this.logger.log(
            `Enqueued sync trigger for catalog ${catalog.id} (Platform: ${catalog.adPlatform}) due to inventory update.`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to enqueue sync trigger for catalog ${catalog.id}: ${error.message}`, error.stack
          );
        }
      }
    }
  }
}
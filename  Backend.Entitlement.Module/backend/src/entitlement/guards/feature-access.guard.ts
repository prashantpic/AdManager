import { Injectable, CanActivate, ExecutionContext, Inject, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EntitlementService } from '../services/entitlement.service';
import { FeatureKey } from '../constants/feature.constants';
import { ENTITLEMENT_METADATA_KEY, EntitlementMetadata } from '../decorators/has-entitlement.decorator';
// Assuming UserAuthModule provides user/merchant context on the request
// import { AuthenticatedRequest } from '../../auth/interfaces/authenticated-request.interface'; 

@Injectable()
export class FeatureAccessGuard implements CanActivate {
  private readonly logger = new Logger(FeatureAccessGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly entitlementService: EntitlementService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const entitlementMetadata = this.reflector.getAllAndOverride<EntitlementMetadata | undefined>(
      ENTITLEMENT_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!entitlementMetadata || !entitlementMetadata.featureKey) {
      // If no specific entitlement is required, access is granted by this guard
      return true;
    }

    const { featureKey, quantityToAdd } = entitlementMetadata;

    const request = context.switchToHttp().getRequest();
    // const request = context.switchToHttp().getRequest<AuthenticatedRequest>(); // If using a typed request
    
    // Placeholder: Extract merchantId from the authenticated user context
    // This depends on how UserAuthModule makes user/merchant information available.
    // Common patterns: request.user.merchantId, request.merchant.id
    const merchantId = request.user?.merchantId || request.merchant?.id; 

    if (!merchantId) {
      this.logger.warn('Merchant ID not found in request context. Denying access.');
      // Or throw a specific Authentication/Authorization error if appropriate
      return false; 
    }

    this.logger.debug(
      `FeatureAccessGuard: Checking feature '${featureKey}' for merchant '${merchantId}' (quantityToAdd: ${quantityToAdd || 1})`,
    );

    try {
      // canPerformAction will throw an exception if access is denied or limit violated
      await this.entitlementService.canPerformAction(merchantId, featureKey, quantityToAdd);
      return true; // Access granted
    } catch (error) {
      this.logger.warn(
        `Access denied by FeatureAccessGuard for merchant '${merchantId}', feature '${featureKey}': ${error.message}`,
      );
      // Re-throw the specific entitlement exception (FeatureNotAvailableException or EntitlementViolationException)
      // NestJS global exception filter will handle it.
      throw error;
    }
  }
}
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IUserContextProvider } from '../domain/interfaces/services/user-context-provider.interface';
import { IEntitlementValidationService } from '../domain/interfaces/services/entitlement-validation.interface';

export const FEATURE_KEY = 'feature';
export const Feature = (featureName: string) => SetMetadata(FEATURE_KEY, featureName);

@Injectable()
export class FeatureAccessGuard implements CanActivate {
  private readonly logger = new Logger(FeatureAccessGuard.name);

  constructor(
    private readonly reflector: Reflector,
    @Inject('IUserContextProvider')
    private readonly userContextProvider: IUserContextProvider,
    @Inject('IEntitlementValidationService')
    private readonly entitlementService: IEntitlementValidationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<string>(
      FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredFeature) {
      // If no feature is specified, access is granted by default (or denied, based on policy)
      return true;
    }

    let merchantId: string;
    try {
      merchantId = this.userContextProvider.getMerchantId();
    } catch (error) {
      this.logger.warn('MerchantId not found in context for FeatureAccessGuard');
      throw new ForbiddenException('User context not available.');
    }
    
    const hasAccess = await this.entitlementService.checkFeatureEntitlement(
      merchantId,
      requiredFeature,
    );

    if (!hasAccess) {
      this.logger.warn(
        `Merchant ${merchantId} denied access to feature: ${requiredFeature}`,
      );
      throw new ForbiddenException(
        `Your current plan does not allow access to the feature: ${requiredFeature}.`,
      );
    }

    return true;
  }
}
import { AdManager as CommonDtoAdManager } from '../../../common/dto/pagination-query.dto';
import { AdManager as AppDevDtoAdManager } from '../../application/dto/commission-query.dto';
import { AdManager as EntitiesAdManager } from '../entities/calculated-app-commission.entity';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace AppDeveloperCommissions {
          export namespace Domain {
            export namespace Repositories {
              export interface ICalculatedAppCommissionRepository {
                findById(
                  id: string,
                ): Promise<EntitiesAdManager.Platform.Backend.PlatformBilling.AppDeveloperCommissions.Domain.Entities.CalculatedAppCommission | null>;
                findByAppSaleTransactionId(
                  transactionId: string,
                ): Promise<EntitiesAdManager.Platform.Backend.PlatformBilling.AppDeveloperCommissions.Domain.Entities.CalculatedAppCommission | null>;
                findByDeveloperId(
                  developerId: string,
                  query: AppDevDtoAdManager.Platform.Backend.PlatformBilling.AppDeveloperCommissions.Application.Dto.CommissionQueryDto,
                ): Promise<CommonDtoAdManager.Platform.Backend.PlatformBilling.Common.Dto.PaginatedResponseDto<EntitiesAdManager.Platform.Backend.PlatformBilling.AppDeveloperCommissions.Domain.Entities.CalculatedAppCommission>>;
                save(
                  commission: EntitiesAdManager.Platform.Backend.PlatformBilling.AppDeveloperCommissions.Domain.Entities.CalculatedAppCommission,
                ): Promise<EntitiesAdManager.Platform.Backend.PlatformBilling.AppDeveloperCommissions.Domain.Entities.CalculatedAppCommission>;
                saveMany(
                  commissions: EntitiesAdManager.Platform.Backend.PlatformBilling.AppDeveloperCommissions.Domain.Entities.CalculatedAppCommission[],
                ): Promise<EntitiesAdManager.Platform.Backend.PlatformBilling.AppDeveloperCommissions.Domain.Entities.CalculatedAppCommission[]>;
              }
            }
          }
        }
      }
    }
  }
}
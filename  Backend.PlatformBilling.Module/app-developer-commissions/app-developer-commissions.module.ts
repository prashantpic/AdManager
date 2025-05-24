import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDeveloperCommissionsController } from './adapters/app-developer-commissions.controller';
import { AppCommissionApplicationService } from './application/services/app-commission.application-service';
import { AppCommissionConfig } from './domain/entities/app-commission-config.entity';
import { CalculatedAppCommission } from './domain/entities/calculated-app-commission.entity';
import { DeveloperPayout } from './domain/entities/developer-payout.entity';
import { TypeOrmAppCommissionConfigRepository } from './infrastructure/repositories/typeorm-app-commission-config.repository';
import { TypeOrmCalculatedAppCommissionRepository } from './infrastructure/repositories/typeorm-calculated-app-commission.repository';
import { TypeOrmDeveloperPayoutRepository } from './infrastructure/repositories/typeorm-developer-payout.repository';
// import { IntegrationModule } from '../../integration/integration.module'; // Assuming path for IntegrationModule

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AppCommissionConfig,
      CalculatedAppCommission,
      DeveloperPayout,
    ]),
    // IntegrationModule, // Import when IntegrationModule is available
  ],
  controllers: [AppDeveloperCommissionsController],
  providers: [
    AppCommissionApplicationService,
    {
      provide: 'IAppCommissionConfigRepository',
      useClass: TypeOrmAppCommissionConfigRepository,
    },
    {
      provide: 'ICalculatedAppCommissionRepository',
      useClass: TypeOrmCalculatedAppCommissionRepository,
    },
    {
      provide: 'IDeveloperPayoutRepository',
      useClass: TypeOrmDeveloperPayoutRepository,
    },
  ],
  exports: [AppCommissionApplicationService],
})
export class AppDeveloperCommissionsModule {}
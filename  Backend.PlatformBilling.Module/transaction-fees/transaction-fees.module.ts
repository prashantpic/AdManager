import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionFeesController } from './adapters/transaction-fees.controller';
import { TransactionFeeApplicationService } from './application/services/transaction-fee.application-service';
import { TransactionFeeConfig } from './domain/entities/transaction-fee-config.entity';
import { AppliedTransactionFee } from './domain/entities/applied-transaction-fee.entity';
import { TransactionFeeDispute } from './domain/entities/transaction-fee-dispute.entity';
import { TypeOrmTransactionFeeConfigRepository } from './infrastructure/repositories/typeorm-transaction-fee-config.repository';
import { TypeOrmAppliedTransactionFeeRepository } from './infrastructure/repositories/typeorm-applied-transaction-fee.repository';
import { TypeOrmTransactionFeeDisputeRepository } from './infrastructure/repositories/typeorm-transaction-fee-dispute.repository';
import { ITransactionFeeConfigRepository } from './domain/repositories/transaction-fee-config.repository.interface';
import { IAppliedTransactionFeeRepository } from './domain/repositories/applied-transaction-fee.repository.interface';
import { ITransactionFeeDisputeRepository } from './domain/repositories/transaction-fee-dispute.repository.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TransactionFeeConfig,
      AppliedTransactionFee,
      TransactionFeeDispute,
    ]),
  ],
  controllers: [TransactionFeesController],
  providers: [
    TransactionFeeApplicationService,
    {
      provide: 'ITransactionFeeConfigRepository',
      useClass: TypeOrmTransactionFeeConfigRepository,
    },
    {
      provide: 'IAppliedTransactionFeeRepository',
      useClass: TypeOrmAppliedTransactionFeeRepository,
    },
    {
      provide: 'ITransactionFeeDisputeRepository',
      useClass: TypeOrmTransactionFeeDisputeRepository,
    },
  ],
  exports: [TransactionFeeApplicationService],
})
export class TransactionFeesModule {}
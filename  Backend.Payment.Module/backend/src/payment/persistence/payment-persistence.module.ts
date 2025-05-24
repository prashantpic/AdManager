import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentTransactionLog } from './entities/payment-transaction-log.entity';
import { PaymentTransactionLogRepository } from './repositories/payment-transaction-log.repository';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentTransactionLog])],
  providers: [PaymentTransactionLogRepository],
  exports: [PaymentTransactionLogRepository],
})
export class PaymentPersistenceModule {}
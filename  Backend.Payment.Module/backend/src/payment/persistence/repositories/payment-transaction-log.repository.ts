import { DataSource, Repository } from 'typeorm';
import { PaymentTransactionLog } from '../entities/payment-transaction-log.entity';
import { Injectable } from '@nestjs/common';
import { PaymentStatus, TransactionType } from '../../constants/payment.constants';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class PaymentTransactionLogRepository extends Repository<PaymentTransactionLog> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(PaymentTransactionLog, dataSource.createEntityManager());
  }

  async createLog(logData: Partial<PaymentTransactionLog>): Promise<PaymentTransactionLog> {
    const newLog = this.create(logData);
    return this.save(newLog);
  }

  async updateLogStatus(
    id: string,
    status: PaymentStatus,
    gatewayResponse?: any,
    errorMessage?: string,
  ): Promise<PaymentTransactionLog> {
    const log = await this.findOneBy({ id });
    if (!log) {
      // Consider throwing a NotFoundException or a custom domain exception
      throw new Error(`Transaction log with id ${id} not found for status update.`);
    }
    log.status = status;
    if (gatewayResponse !== undefined) {
      // Ensure gatewayResponse is an object if it's meant to be JSONB
      log.gatewayResponse = typeof gatewayResponse === 'string' ? { raw: gatewayResponse } : gatewayResponse;
    }
    if (errorMessage !== undefined) {
        log.errorMessage = errorMessage;
    }
    return this.save(log);
  }

  async findByGatewayTransactionId(gatewayTransactionId: string): Promise<PaymentTransactionLog | null> {
      return this.findOne({
          where: { gatewayTransactionId },
      });
  }

  async findByGatewaySubscriptionId(gatewaySubscriptionId: string): Promise<PaymentTransactionLog[]> {
      return this.find({
          where: { gatewaySubscriptionId },
          order: { createdAt: 'DESC' }, // Typically want newest first for subscription history
      });
  }

  async findLatestFailedAttemptBySubscriptionId(gatewaySubscriptionId: string): Promise<PaymentTransactionLog | null> {
      return this.findOne({
          where: [ // OR condition for different failed types
              {
                  gatewaySubscriptionId: gatewaySubscriptionId,
                  status: PaymentStatus.FAILED,
                  transactionType: TransactionType.RECURRING_RENEWAL,
              },
              {
                  gatewaySubscriptionId: gatewaySubscriptionId,
                  status: PaymentStatus.FAILED,
                  transactionType: TransactionType.RECURRING_RETRY,
              }
          ],
          order: { createdAt: 'DESC' },
      });
  }

   // Additional useful methods could be:
   // async findByOrderId(orderId: string): Promise<PaymentTransactionLog[]>
   // async findByMerchantId(merchantId: string, paginationOptions: any): Promise<[PaymentTransactionLog[], number]>
   // async findSuccessfulSaleByOrderId(orderId: string): Promise<PaymentTransactionLog | null>
}
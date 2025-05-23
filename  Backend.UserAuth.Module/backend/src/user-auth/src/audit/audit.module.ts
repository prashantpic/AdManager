import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuditListener } from './audit.listener';
import { AuditLogEntity } from './entities/audit-log.entity';

// Temporary placeholder entity until it's fully defined
// class AuditLogEntity {}

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity])],
  providers: [AuditService, AuditListener],
  exports: [AuditService],
})
export class AuditModule {}
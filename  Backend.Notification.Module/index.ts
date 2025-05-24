export * from './notification.module';
export * from './application/notification.service';
export * from './application/dto/send-email.dto';
export * from './application/dto/publish-sns-event.dto';
export * from './application/dto/notification-status.dto';
// Also exporting interfaces, adapters, and sub-barrel files as per common practice and previous example.
export * from './domain/interfaces/email-notification-params.interface';
export * from './domain/interfaces/event-notification-params.interface';
export * from './infrastructure/ses/ses.adapter';
export * from './infrastructure/sns/sns.adapter';
export * from './config'; // Exports from ./config/index.ts
export * from './constants'; // Exports from ./constants/index.ts
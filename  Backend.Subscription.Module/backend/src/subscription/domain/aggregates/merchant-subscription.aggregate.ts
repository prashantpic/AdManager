import { SubscriptionStatus } from '../../common/enums/subscription-status.enum';
import { BillingDetailsVO } from '../value-objects/billing-details.vo';
import { MerchantSubscribedEvent } from '../events/definitions/merchant-subscribed.event';
import { SubscriptionPaymentFailedEvent } from '../events/definitions/subscription-payment-failed.event';
import { BillingCycle } from '../../common/enums/billing-cycle.enum';
// Assuming a simple AggregateRoot base class for event handling (defined in SubscriptionPlanAggregate for now)
abstract class BaseAggregateRoot {
  private _domainEvents: any[] = [];
  public get domainEvents(): any[] { return this._domainEvents; }
  protected addDomainEvent(domainEvent: any): void { this._domainEvents.push(domainEvent); }
  public clearDomainEvents(): void { this._domainEvents.length = 0; }
}

// Placeholder for PaymentRecordVO, as it's not in the file list for generation
export class PaymentRecordVO {
  constructor(
    public readonly amount: number,
    public readonly currency: string,
    public readonly date: Date,
    public readonly type: 'charge' | 'refund',
    public readonly status: 'success' | 'failed',
    public readonly gatewayTransactionId: string,
    public readonly reason?: string,
  ) {
    Object.freeze(this);
  }
}

export class MerchantSubscriptionAggregate extends BaseAggregateRoot {
  public readonly id: string;
  public readonly merchantId: string; // Use string as MerchantIdVO not defined
  private _planId: string;
  private _status: SubscriptionStatus;
  private _startDate: Date;
  private _endDate: Date | null;
  private _currentPeriodStart: Date;
  private _currentPeriodEnd: Date;
  private _billingInfo: BillingDetailsVO | null;
  private _paymentHistory: PaymentRecordVO[];
  private _billingCycle: BillingCycle;
  private _dunningAttempts: number = 0;
  private _lastPaymentAttemptDate: Date | null = null;


  private constructor(props: {
    id: string;
    merchantId: string;
    planId: string;
    status: SubscriptionStatus;
    startDate: Date;
    endDate: Date | null;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    billingInfo: BillingDetailsVO | null;
    paymentHistory: PaymentRecordVO[];
    billingCycle: BillingCycle;
  }) {
    super();
    if (!props.id) throw new Error("MerchantSubscription ID cannot be empty.");
    if (!props.merchantId) throw new Error("Merchant ID cannot be empty.");
    if (!props.planId) throw new Error("Plan ID cannot be empty.");

    this.id = props.id;
    this.merchantId = props.merchantId;
    this._planId = props.planId;
    this._status = props.status;
    this._startDate = props.startDate;
    this._endDate = props.endDate;
    this._currentPeriodStart = props.currentPeriodStart;
    this._currentPeriodEnd = props.currentPeriodEnd;
    this._billingInfo = props.billingInfo;
    this._paymentHistory = [...(props.paymentHistory || [])];
    this._billingCycle = props.billingCycle;
  }

  public static subscribe(props: {
    id: string;
    merchantId: string;
    planId: string;
    billingInfo: BillingDetailsVO;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    billingCycle: BillingCycle;
  }): MerchantSubscriptionAggregate {
    const subscription = new MerchantSubscriptionAggregate({
      ...props,
      status: SubscriptionStatus.PENDING, // Initial status, becomes ACTIVE upon successful payment
      startDate: new Date(),
      endDate: null,
      paymentHistory: [],
    });
    subscription.addDomainEvent(
      new MerchantSubscribedEvent(subscription.id, subscription.merchantId, subscription.planId),
    );
    return subscription;
  }

  public get planId(): string { return this._planId; }
  public get status(): SubscriptionStatus { return this._status; }
  public get startDate(): Date { return this._startDate; }
  public get endDate(): Date | null { return this._endDate; }
  public get currentPeriodStart(): Date { return this._currentPeriodStart; }
  public get currentPeriodEnd(): Date { return this._currentPeriodEnd; }
  public get billingInfo(): BillingDetailsVO | null { return this._billingInfo; }
  public get paymentHistory(): PaymentRecordVO[] { return [...this._paymentHistory]; }
  public get billingCycle(): BillingCycle { return this._billingCycle; }
  public get dunningAttempts(): number { return this._dunningAttempts; }
  public get lastPaymentAttemptDate(): Date | null { return this._lastPaymentAttemptDate; }


  public cancel(cancellationDate: Date = new Date()): void {
    if (this._status === SubscriptionStatus.CANCELLED || this._status === SubscriptionStatus.TERMINATED) {
      return; // Already in a final state
    }
    const oldStatus = this._status;
    this._status = SubscriptionStatus.CANCELLED;
    // Decide cancellation policy: immediate or at end of period
    // For now, assume cancellation at end of current period for paid services
    this._endDate = this._currentPeriodEnd > cancellationDate ? this._currentPeriodEnd : cancellationDate;
    this.addDomainEvent({ name: `${SUBSCRIPTION_STATUS_CHANGED_EVENT_PREFIX}.cancelled`, subscriptionId: this.id, merchantId: this.merchantId, oldStatus, newStatus: this._status });
  }

  public changePlan(newPlanId: string, prorationAmount: number, newBillingCycle?: BillingCycle): void {
    if (this._status === SubscriptionStatus.CANCELLED || this._status === SubscriptionStatus.TERMINATED) {
      throw new Error('Cannot change plan for a cancelled or terminated subscription.');
    }
    const oldPlanId = this._planId;
    const oldStatus = this._status;
    this._planId = newPlanId;
    if (newBillingCycle) {
        this._billingCycle = newBillingCycle;
    }
    // Potentially adjust currentPeriodEnd based on proration or new cycle terms
    // For now, assume proration is handled financially, and period dates adjust on next renewal
    this.addDomainEvent({ name: `${SUBSCRIPTION_STATUS_CHANGED_EVENT_PREFIX}.plan_changed`, subscriptionId: this.id, merchantId: this.merchantId, oldPlanId, newPlanId: this._planId, prorationAmount });
    if(this._status !== SubscriptionStatus.ACTIVE) { // If it was pending or past_due, and now changes plan, it could become active
        this._status = SubscriptionStatus.ACTIVE; // Simplified: assume plan change makes it active
        this.addDomainEvent({ name: `${SUBSCRIPTION_STATUS_CHANGED_EVENT_PREFIX}.activated`, subscriptionId: this.id, merchantId: this.merchantId, oldStatus, newStatus: this._status });
    }
  }

  public processFailedPayment(attemptCountFromService: number, reason: string): void {
    const oldStatus = this._status;
    this._dunningAttempts = attemptCountFromService; // Service tracks attempts based on config
    this._lastPaymentAttemptDate = new Date();

    if (this._status !== SubscriptionStatus.PAST_DUE && this._status !== SubscriptionStatus.SUSPENDED && this._status !== SubscriptionStatus.TERMINATED) {
      this._status = SubscriptionStatus.PAST_DUE;
      this.addDomainEvent({ name: `${SUBSCRIPTION_STATUS_CHANGED_EVENT_PREFIX}.past_due`, subscriptionId: this.id, merchantId: this.merchantId, oldStatus, newStatus: this._status, reason });
    }
    // Else, it's already in a dunning state or worse, escalation handled by dunning job/service based on total attempts
    
    this.addPaymentRecord(new PaymentRecordVO(0, '', new Date(), 'charge', 'failed', `failed-attempt-${this._dunningAttempts}`, reason));
    this.addDomainEvent(
      new SubscriptionPaymentFailedEvent(this.id, this.merchantId, this._dunningAttempts, reason),
    );
  }

  public markPaymentSuccessful(amount: number, currency: string, gatewayTransactionId: string): void {
    const oldStatus = this._status;
    this._status = SubscriptionStatus.ACTIVE;
    this._dunningAttempts = 0; // Reset dunning state
    this._lastPaymentAttemptDate = null;
    this.addPaymentRecord(new PaymentRecordVO(amount, currency, new Date(), 'charge', 'success', gatewayTransactionId));
    if (oldStatus !== SubscriptionStatus.ACTIVE) {
        this.addDomainEvent({ name: `${SUBSCRIPTION_STATUS_CHANGED_EVENT_PREFIX}.activated`, subscriptionId: this.id, merchantId: this.merchantId, oldStatus, newStatus: this._status });
    }
  }

  public suspend(): void {
    if (this._status === SubscriptionStatus.SUSPENDED || this._status === SubscriptionStatus.TERMINATED || this._status === SubscriptionStatus.CANCELLED) {
      return;
    }
    const oldStatus = this._status;
    this._status = SubscriptionStatus.SUSPENDED;
    this.addDomainEvent({ name: `${SUBSCRIPTION_STATUS_CHANGED_EVENT_PREFIX}.suspended`, subscriptionId: this.id, merchantId: this.merchantId, oldStatus, newStatus: this._status });
  }

  public terminate(): void {
    if (this._status === SubscriptionStatus.TERMINATED) {
      return;
    }
    const oldStatus = this._status;
    this._status = SubscriptionStatus.TERMINATED;
    this._endDate = new Date(); // Termination effective immediately
    this.addDomainEvent({ name: `${SUBSCRIPTION_STATUS_CHANGED_EVENT_PREFIX}.terminated`, subscriptionId: this.id, merchantId: this.merchantId, oldStatus, newStatus: this._status });
  }

  public renew(newPeriodStart: Date, newPeriodEnd: Date): void {
    if (this._status !== SubscriptionStatus.ACTIVE && this._status !== SubscriptionStatus.PAST_DUE) {
        throw new Error(`Cannot renew subscription in status ${this._status}`);
    }
    const oldStatus = this._status;
    this._currentPeriodStart = newPeriodStart;
    this._currentPeriodEnd = newPeriodEnd;
    this._status = SubscriptionStatus.ACTIVE; // Ensure active on renewal
    this._dunningAttempts = 0;
    this._lastPaymentAttemptDate = null;

    // It's implied payment was successful if renew is called
    this.addDomainEvent({ name: `${SUBSCRIPTION_STATUS_CHANGED_EVENT_PREFIX}.renewed`, subscriptionId: this.id, merchantId: this.merchantId, newPeriodEnd });
     if (oldStatus !== SubscriptionStatus.ACTIVE) {
        this.addDomainEvent({ name: `${SUBSCRIPTION_STATUS_CHANGED_EVENT_PREFIX}.activated`, subscriptionId: this.id, merchantId: this.merchantId, oldStatus, newStatus: this._status });
    }
  }
  
  public addPaymentRecord(record: PaymentRecordVO): void {
    this._paymentHistory.push(record);
  }

  public updateBillingInfo(newBillingInfo: BillingDetailsVO): void {
    this._billingInfo = newBillingInfo;
    // Potentially add an event: BillingInfoUpdated
  }
}
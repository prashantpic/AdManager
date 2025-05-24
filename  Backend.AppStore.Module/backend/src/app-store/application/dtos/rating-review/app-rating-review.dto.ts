export enum AppReviewModerationStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

export class AppRatingReviewDto {
  id: string;
  appId: string;
  merchantId: string; // Or merchant display name
  rating: number;
  reviewText?: string;
  submittedAt: Date;
  moderationStatus: AppReviewModerationStatus;
  // Potentially include reviewer comments if rejected and visible to merchant
  createdAt: Date;
  updatedAt: Date;
}
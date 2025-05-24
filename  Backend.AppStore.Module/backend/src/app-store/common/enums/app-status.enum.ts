export enum AppStatus {
  DRAFT = 'DRAFT',
  PENDING_SUBMISSION = 'PENDING_SUBMISSION', // App details saved by dev, not yet submitted for review
  PENDING_REVIEW = 'PENDING_REVIEW', // Submitted by dev, awaiting admin review
  APPROVED = 'APPROVED', // Approved by admin, but not yet published by developer
  REJECTED = 'REJECTED', // Rejected by admin
  PUBLISHED = 'PUBLISHED', // Live in the App Store
  UNPUBLISHED = 'UNPUBLISHED', // Was live, but developer unpublished it
  ARCHIVED = 'ARCHIVED', // No longer active, kept for records
}
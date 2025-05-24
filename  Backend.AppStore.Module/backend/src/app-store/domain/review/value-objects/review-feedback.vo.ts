export interface ReviewCriteriaFeedback {
  criteriaName: string;
  comments: string;
  passed: boolean;
}

export class ReviewFeedback {
  public readonly overallComments?: string | null;
  public readonly criteriaFeedback?: ReviewCriteriaFeedback[] | null;

  constructor(
    overallComments?: string | null,
    criteriaFeedback?: ReviewCriteriaFeedback[] | null,
  ) {
    this.overallComments = overallComments;
    this.criteriaFeedback = criteriaFeedback;

    Object.freeze(this);
  }
}
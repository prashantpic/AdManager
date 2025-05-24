import { RATING_MIN_VALUE, RATING_MAX_VALUE } from '../../../common/constants/app-store.constants';

export class ReviewContent {
  public readonly rating: number;
  public readonly text?: string | null;

  constructor(rating: number, text?: string | null) {
    if (rating < RATING_MIN_VALUE || rating > RATING_MAX_VALUE) {
      throw new Error(
        `Rating must be between ${RATING_MIN_VALUE} and ${RATING_MAX_VALUE}.`,
      );
    }
    if (text && text.length > 5000) { // Example length limit
        throw new Error('Review text cannot exceed 5000 characters.');
    }

    this.rating = rating;
    this.text = text;

    Object.freeze(this);
  }
}
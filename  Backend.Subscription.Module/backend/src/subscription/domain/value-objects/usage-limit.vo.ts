export class UsageLimitVO {
  public readonly featureKey: string; // e.g., 'api_calls', 'storage_gb'
  public readonly limit: number; // -1 for unlimited, 0 for disabled, >0 for specific limit
  public readonly unit: string; // e.g., 'count', 'GB', 'users'

  constructor(featureKey: string, limit: number, unit: string) {
    if (!featureKey || featureKey.trim() === '') {
      throw new Error('Usage limit feature key cannot be empty.');
    }
    if (limit < -1) {
      throw new Error('Usage limit must be -1 (unlimited) or >= 0.');
    }
    if (!unit || unit.trim() === '') {
      throw new Error('Usage limit unit cannot be empty.');
    }
    this.featureKey = featureKey;
    this.limit = limit;
    this.unit = unit;
    Object.freeze(this); // Make immutable
  }

  public equals(other?: UsageLimitVO): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (other.constructor.name !== this.constructor.name) {
        return false;
    }
    return (
      this.featureKey === other.featureKey &&
      this.limit === other.limit &&
      this.unit === other.unit
    );
  }
}
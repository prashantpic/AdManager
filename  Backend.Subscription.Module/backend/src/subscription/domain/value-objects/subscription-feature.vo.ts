export class SubscriptionFeatureVO {
  public readonly name: string;
  public readonly description: string;

  constructor(name: string, description: string) {
    if (!name || name.trim() === '') {
      throw new Error('Feature name cannot be empty.');
    }
    // Description can be empty or a longer text
    this.name = name;
    this.description = description;
    Object.freeze(this); // Make immutable
  }

  public equals(other?: SubscriptionFeatureVO): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (other.constructor.name !== this.constructor.name) {
        return false;
    }
    return this.name === other.name && this.description === other.description;
  }
}
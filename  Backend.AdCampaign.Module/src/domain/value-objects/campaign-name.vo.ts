import { ArgumentInvalidException } from '../exceptions/argument-invalid.exception'; // Assuming a generic invalid arg exception

export class CampaignName {
  private readonly value: string;

  constructor(name: string) {
    if (!name || name.trim().length === 0) {
      throw new ArgumentInvalidException('Campaign name cannot be empty.');
    }
    if (name.length < 3) {
      throw new ArgumentInvalidException('Campaign name must be at least 3 characters long.');
    }
    if (name.length > 100) {
      throw new ArgumentInvalidException('Campaign name cannot exceed 100 characters.');
    }
    // Add more specific character restrictions if needed, e.g., /^[a-zA-Z0-9\s_-\.]+$/
    this.value = name.trim();
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other?: CampaignName): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    return this.value === other.getValue();
  }
}
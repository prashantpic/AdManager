export class DeveloperInfo {
  public readonly name: string;
  public readonly email: string;
  public readonly website?: string | null;

  constructor(name: string, email: string, website?: string | null) {
    if (!name || !email) {
      throw new Error('Developer name and email are required.');
    }
    // Basic email validation (can be enhanced)
    if (!/\S+@\S+\.\S+/.test(email)) {
      throw new Error('Invalid developer email format.');
    }
    if (website && !/^https?:\/\/.+/.test(website)) {
        throw new Error('Invalid developer website URL format. Must include http(s)://');
    }

    this.name = name;
    this.email = email;
    this.website = website;

    Object.freeze(this); // Ensure immutability
  }
}
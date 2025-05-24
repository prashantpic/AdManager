export class InstallationConfig {
  // Flexible structure for app-specific settings
  public readonly settings: Record<string, any>;

  constructor(settings: Record<string, any> = {}) {
    this.settings = settings;
    Object.freeze(this);
  }
}
export class SubmissionDetails {
  public readonly versionNumber: string;
  public readonly packageUrl: string;
  public readonly changelog: string;
  public readonly submissionNotes?: string | null;

  constructor(
    versionNumber: string,
    packageUrl: string,
    changelog: string,
    submissionNotes?: string | null,
  ) {
    if (!versionNumber || !packageUrl || !changelog) {
      throw new Error('Version number, package URL, and changelog are required for submission details.');
    }

    this.versionNumber = versionNumber;
    this.packageUrl = packageUrl;
    this.changelog = changelog;
    this.submissionNotes = submissionNotes;

    Object.freeze(this);
  }
}
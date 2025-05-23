import { ArgumentInvalidException } from '../exceptions/argument-invalid.exception';

export class ScheduleDetails {
  public readonly startDate: Date;
  public readonly endDate?: Date;
  public readonly timeZone?: string; // e.g., 'America/New_York'

  constructor(startDate: Date, endDate?: Date, timeZone?: string) {
    if (!startDate) {
      throw new ArgumentInvalidException('Schedule start date is required.');
    }
    if (startDate.getTime() <= Date.now()) {
      // Allowing creation of past schedules for importing existing data,
      // but business logic in services might prevent activating such schedules.
      // For new schedules, validation should be stricter in the service layer or DTO.
      // console.warn('Schedule start date is in the past.');
    }
    if (endDate && endDate.getTime() <= startDate.getTime()) {
      throw new ArgumentInvalidException('Schedule end date must be after the start date.');
    }
    // Basic timezone validation, could use a library like moment-timezone for comprehensive validation
    if (timeZone && timeZone.trim().length === 0) {
      throw new ArgumentInvalidException('Timezone, if provided, cannot be empty.');
    }

    this.startDate = startDate;
    this.endDate = endDate;
    this.timeZone = timeZone;
  }

  // Getter methods can be added
}
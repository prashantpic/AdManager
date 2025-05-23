import { NotFoundException } from '@nestjs/common';

export class EntityNotFoundException extends NotFoundException {
  constructor(entityType: string, entityId: string, criteria?: Record<string, any>) {
    let message = `${entityType} with ID '${entityId}' not found.`;
    if (criteria && Object.keys(criteria).length > 0) {
        message = `${entityType} not found matching criteria: ${JSON.stringify(criteria)}.`;
    } else if (!entityId && criteria) {
        message = `${entityType} not found matching criteria.`;
    } else if (!entityId && !criteria) {
        message = `${entityType} not found.`;
    }
    super(message);
  }
}
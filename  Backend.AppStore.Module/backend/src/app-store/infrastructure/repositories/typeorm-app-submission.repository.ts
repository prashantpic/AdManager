import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AppSubmissionEntity, IAppSubmissionRepository } from '../../domain';
import { AppReviewStatus } from '../../common/enums';

@Injectable()
export class TypeOrmAppSubmissionRepository implements IAppSubmissionRepository {
  constructor(
    @InjectRepository(AppSubmissionEntity)
    private readonly submissionOrmRepository: Repository<AppSubmissionEntity>,
  ) {}

  async findById(id: string): Promise<AppSubmissionEntity | null> {
    return this.submissionOrmRepository.findOne({ where: { id }, relations: ['app', 'appVersion', 'reviewProcess'] });
  }
  
  async findByIdWithRelations(id: string): Promise<AppSubmissionEntity | null> {
    return this.submissionOrmRepository.findOne({
        where: { id },
        relations: ['app', 'app.developerInfoVo', 'appVersion', 'reviewProcess', 'reviewProcess.feedbackVo'] // Adjust relations as needed
    });
  }

  async findByDeveloperId(developerId: string, pagination?: { page: number, limit: number }): Promise<AppSubmissionEntity[]> {
    const options = {
        where: { developerId },
        relations: ['app', 'appVersion', 'reviewProcess'],
        order: { submittedAt: 'DESC' },
    };
    if(pagination) {
        options['skip'] = (pagination.page - 1) * pagination.limit;
        options['take'] = pagination.limit;
    }
    return this.submissionOrmRepository.find(options);
  }

  async findPendingReview(pagination: { page: number, limit: number }): Promise<AppSubmissionEntity[]> {
    const { page = 1, limit = 10 } = pagination;
    return this.submissionOrmRepository.find({
      where: { status: In([AppReviewStatus.PENDING_REVIEW, AppReviewStatus.IN_REVIEW]) }, // Or just PENDING_REVIEW
      relations: ['app', 'appVersion', 'reviewProcess'],
      order: { submittedAt: 'ASC' }, // Oldest first for review queue
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async save(submission: AppSubmissionEntity): Promise<AppSubmissionEntity> {
    return this.submissionOrmRepository.save(submission);
  }

  async delete(id: string): Promise<void> {
    await this.submissionOrmRepository.delete(id);
  }
}
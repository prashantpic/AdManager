import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppReviewProcessEntity, IAppReviewProcessRepository } from '../../domain';

@Injectable()
export class TypeOrmAppReviewProcessRepository implements IAppReviewProcessRepository {
  constructor(
    @InjectRepository(AppReviewProcessEntity)
    private readonly reviewProcessOrmRepository: Repository<AppReviewProcessEntity>,
  ) {}

  async findById(id: string): Promise<AppReviewProcessEntity | null> {
    return this.reviewProcessOrmRepository.findOne({ where: { id }, relations: ['submission', 'submission.app'] });
  }
  
  async findByIdWithSubmission(id: string): Promise<AppReviewProcessEntity | null> {
    return this.reviewProcessOrmRepository.findOne({
        where: { id },
        relations: ['submission', 'submission.app', 'submission.appVersion']
    });
  }

  async findBySubmissionId(submissionId: string): Promise<AppReviewProcessEntity | null> {
    return this.reviewProcessOrmRepository.findOne({ where: { submissionId }, relations: ['submission'] });
  }

  async save(reviewProcess: AppReviewProcessEntity): Promise<AppReviewProcessEntity> {
    return this.reviewProcessOrmRepository.save(reviewProcess);
  }

  async delete(id: string): Promise<void> {
    await this.reviewProcessOrmRepository.delete(id);
  }
}
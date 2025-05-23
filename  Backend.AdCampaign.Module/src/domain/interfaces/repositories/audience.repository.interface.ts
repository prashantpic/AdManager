import { Audience } from '../../entities/audience.entity';

export interface IAudienceRepository {
  findById(id: string, merchantId: string): Promise<Audience | null>;
  findAll(merchantId: string): Promise<Audience[]>;
  findByName(name: string, merchantId: string): Promise<Audience | null>;
  save(audience: Audience): Promise<Audience>;
  remove(audience: Audience): Promise<void>; // Or removeById(id: string, merchantId: string)
}

export const IAudienceRepository = Symbol('IAudienceRepository');
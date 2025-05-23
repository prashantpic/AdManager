import { Creative } from '../../entities/creative.entity';

export interface ICreativeRepository {
  findById(id: string, merchantId: string): Promise<Creative | null>;
  findAll(merchantId: string): Promise<Creative[]>;
  save(creative: Creative): Promise<Creative>;
  remove(creative: Creative): Promise<void>; // Or removeById(id: string, merchantId: string)
}

export const ICreativeRepository = Symbol('ICreativeRepository');
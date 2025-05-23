import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { CreativeType } from '../../constants/creative-type.enum';
import { AssetLocation } from '../value-objects/asset-location.vo';
import { AdCreativeContent } from '../value-objects/ad-creative-content.vo';
import { Ad } from './ad.entity';

@Entity('creatives')
export class Creative {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  merchantId: string;

  @Column({ length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: CreativeType,
  })
  type: CreativeType;

  @Column({ type: 'jsonb' }) // Stores AssetLocation VO structure
  assetLocation: AssetLocation;

  @Column({ type: 'jsonb', nullable: true }) // Stores AdCreativeContent VO structure
  content?: AdCreativeContent;

  @OneToMany(() => Ad, ad => ad.creative)
  ads: Ad[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  // Domain logic methods
  updateAssetLocation(location: AssetLocation): void {
    this.assetLocation = location;
  }

  updateContent(newContent?: AdCreativeContent): void {
    this.content = newContent;
  }

  updateDetails(data: {
    name?: string;
    type?: CreativeType;
    assetLocation?: AssetLocation;
    content?: AdCreativeContent | null;
  }): void {
    if (data.name !== undefined) this.name = data.name;
    if (data.type !== undefined) this.type = data.type;
    if (data.assetLocation !== undefined) this.assetLocation = data.assetLocation;
    if (data.content !== undefined) this.content = data.content === null ? undefined : data.content;
  }
}
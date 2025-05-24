import { Column, Embeddable } from 'typeorm';

@Embeddable()
export class CustomerInformationTypeOrmEmbeddable {
  @Column()
  email: string;

  @Column({ name: 'first_name', nullable: true })
  firstName?: string;

  @Column({ name: 'last_name', nullable: true })
  lastName?: string;

  @Column({ nullable: true })
  phone?: string;
}
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';

/**
 * Tham so he thong — FR-SYS-01, FR-SYS-02, sua tai SA-43.
 * Cac nguong nghiep vu BR-04..BR-08 doc tu day truoc, lui ve bien moi truong
 * khi chua co ban ghi.
 */
@Entity('system_settings')
export class SystemSetting extends BaseEntity {
  @Index({ unique: true })
  @Column({ length: 64 })
  key!: string;

  @Column({ type: 'jsonb' })
  value!: unknown;

  /** STRING | NUMBER | BOOLEAN | JSON — de SA-43 chon dung o nhap. */
  @Column({ name: 'value_type', length: 16, default: 'STRING' })
  valueType!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  group!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  /** false khi tham so chi doc, vi du phien ban ung dung. */
  @Column({ name: 'is_editable', default: true })
  isEditable!: boolean;

  @Column({ name: 'updated_by_id', type: 'uuid', nullable: true })
  updatedById!: string | null;
}

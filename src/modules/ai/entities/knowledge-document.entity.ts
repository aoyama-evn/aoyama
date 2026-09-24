import { Column, Entity, Index } from 'typeorm';
import { SoftDeletableEntity } from 'src/common/entities/base.entity';

/**
 * Kho tai lieu ky thuat — SA-31, nguon trich dan cho tro ly AI ky thuat (AI-03).
 * Kha thi cua module nay phu thuoc OQ-08: AOYAMA co tai lieu dang so hay khong.
 */
@Entity('knowledge_documents')
@Index(['category'])
export class KnowledgeDocument extends SoftDeletableEntity {
  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  category!: string | null;

  /** Hang va dong xe tai lieu ap dung — de loc khi tra cuu. */
  @Column({ name: 'applicable_makers', type: 'jsonb', default: () => "'[]'" })
  applicableMakers!: string[];

  @Column({ name: 'applicable_models', type: 'jsonb', default: () => "'[]'" })
  applicableModels!: string[];

  @Column({ type: 'varchar', name: 'file_url', length: 512, nullable: true })
  fileUrl!: string | null;

  @Column({ type: 'varchar', name: 'file_type', length: 16, nullable: true })
  fileType!: string | null;

  /** Noi dung da boc tach de tim kiem toan van. */
  @Column({ type: 'text', nullable: true })
  content!: string | null;

  @Column({ name: 'page_count', type: 'int', nullable: true })
  pageCount!: number | null;

  /** PENDING | INDEXED | FAILED */
  @Column({ name: 'index_status', length: 16, default: 'PENDING' })
  indexStatus!: string;

  @Column({ name: 'indexed_at', type: 'timestamptz', nullable: true })
  indexedAt!: Date | null;

  @Column({ name: 'uploaded_by_id', type: 'uuid', nullable: true })
  uploadedById!: string | null;
}

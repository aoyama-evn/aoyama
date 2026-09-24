import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageDto, PaginationQueryDto } from 'src/common/dto';
import { ContactMessage } from './entities/contact-message.entity';
import { Faq } from './entities/faq.entity';

/** M-02 — Noi dung cong khai. SC-07, SC-08. */
@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Faq) private readonly faqRepo: Repository<Faq>,
    @InjectRepository(ContactMessage) private readonly contactRepo: Repository<ContactMessage>,
  ) {}

  /** SC-07 — cau hoi thuong gap. */
  async listFaqs(category?: string): Promise<Faq[]> {
    return this.faqRepo.find({
      where: category ? { isActive: true, category } : { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async upsertFaq(data: Partial<Faq>): Promise<Faq> {
    if (data.id) {
      await this.faqRepo.update(data.id, data);
      return this.faqRepo.findOneOrFail({ where: { id: data.id } });
    }
    return this.faqRepo.save(this.faqRepo.create(data));
  }

  async removeFaq(id: string): Promise<void> {
    await this.faqRepo.softDelete(id);
  }

  /** SC-08 — khach gui lien he. */
  async submitContact(data: Partial<ContactMessage>): Promise<ContactMessage> {
    return this.contactRepo.save(this.contactRepo.create(data));
  }

  async listContacts(
    query: PaginationQueryDto & { isHandled?: boolean },
  ): Promise<PageDto<ContactMessage>> {
    const [items, total] = await this.contactRepo.findAndCount({
      where: query.isHandled === undefined ? {} : { isHandled: query.isHandled },
      order: { createdAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });
    return new PageDto(items, total, query);
  }

  async markContactHandled(
    id: string,
    handledById: string,
    note?: string,
  ): Promise<ContactMessage> {
    await this.contactRepo.update(id, {
      isHandled: true,
      handledById,
      handledAt: new Date(),
      handlerNote: note ?? null,
    });
    return this.contactRepo.findOneOrFail({ where: { id } });
  }
}

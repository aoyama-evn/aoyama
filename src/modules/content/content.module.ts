import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminContentController, PublicContentController } from './content.controller';
import { ContentService } from './content.service';
import { ContactMessage } from './entities/contact-message.entity';
import { Faq } from './entities/faq.entity';

/** M-02 — Noi dung cong khai. */
@Module({
  imports: [TypeOrmModule.forFeature([Faq, ContactMessage])],
  controllers: [PublicContentController, AdminContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogModule } from 'src/modules/catalog/catalog.module';
import { PartsModule } from 'src/modules/parts/parts.module';
import { WorkOrdersModule } from 'src/modules/work-orders/work-orders.module';
import { AdminAiController, PublicAiController } from './ai.controller';
import { AI_PROVIDER, DisabledAiProvider, LlmAiProvider } from './ai.provider';
import { AiService } from './ai.service';
import { AiDiagnosis } from './entities/ai-diagnosis.entity';
import { KnowledgeDocument } from './entities/knowledge-document.entity';

/** M-03 Chatbox AI chan doan va M-12 Tro ly AI ky thuat. */
@Module({
  imports: [
    TypeOrmModule.forFeature([AiDiagnosis, KnowledgeDocument]),
    CatalogModule,
    PartsModule,
    WorkOrdersModule,
  ],
  controllers: [PublicAiController, AdminAiController],
  providers: [
    AiService,
    DisabledAiProvider,
    LlmAiProvider,
    {
      provide: AI_PROVIDER,
      inject: [ConfigService, DisabledAiProvider, LlmAiProvider],
      useFactory: (
        config: ConfigService,
        disabled: DisabledAiProvider,
        llm: LlmAiProvider,
      ) => (config.get<boolean>('ai.enabled') ? llm : disabled),
    },
  ],
  exports: [AiService],
})
export class AiModule {}

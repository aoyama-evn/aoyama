import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogModule } from 'src/modules/catalog/catalog.module';
import { PartsModule } from 'src/modules/parts/parts.module';
import { WorkOrdersModule } from 'src/modules/work-orders/work-orders.module';
import { AdminAiController, PublicAiController } from './ai.controller';
import { AI_PROVIDER, DisabledAiProvider, LlmAiProvider } from './ai.provider';
import { RuleBasedAiProvider } from './rule-based.provider';
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
    RuleBasedAiProvider,
    LlmAiProvider,
    {
      provide: AI_PROVIDER,
      inject: [ConfigService, DisabledAiProvider, RuleBasedAiProvider, LlmAiProvider],
      /**
       * AI_ENABLED=true va co AI_API_KEY thi goi mo hinh that. Chua cau hinh thi
       * dung bo luat chay tai cho, de chatbox chan doan van tra loi duoc thay vi
       * lan nao cung bao thieu thong tin. AI_FALLBACK=off thi tat han.
       */
      useFactory: (
        config: ConfigService,
        disabled: DisabledAiProvider,
        rules: RuleBasedAiProvider,
        llm: LlmAiProvider,
      ) => {
        if (config.get<boolean>('ai.enabled') && config.get<string>('ai.apiKey')) return llm;
        return config.get<string>('ai.fallback') === 'off' ? disabled : rules;
      },
    },
  ],
  exports: [AiService],
})
export class AiModule {}

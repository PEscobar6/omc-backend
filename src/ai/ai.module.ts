import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { AI_PROVIDER } from './providers/ai-provider.interface';
import { MockProvider } from './providers/mock.provider';
import { OpenAiCompatibleProvider } from './providers/openai-compatible.provider';

const SUPPORTED_PROVIDERS = ['openai', 'groq', 'gemini'];

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: AI_PROVIDER,
      useFactory: (configService: ConfigService) => {
        const provider = configService.get<string>('AI_PROVIDER', 'groq');
        const apiKey = configService.get<string>('AI_PROVIDER_API_KEY');

        if (!apiKey || !SUPPORTED_PROVIDERS.includes(provider)) {
          return new MockProvider();
        }

        return new OpenAiCompatibleProvider(provider, apiKey);
      },
      inject: [ConfigService],
    },
    AiService,
  ],
  exports: [AiService],
})
export class AiModule {}

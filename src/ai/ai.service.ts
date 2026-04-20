import { Inject, Injectable } from '@nestjs/common';
import { Lead } from '../leads/entities/lead.entity';
import { AI_PROVIDER } from './providers/ai-provider.interface';
import type { IAiProvider } from './providers/ai-provider.interface';

@Injectable()
export class AiService {
  constructor(
    @Inject(AI_PROVIDER)
    private readonly provider: IAiProvider,
  ) {}

  generateLeadsSummary(leads: Lead[]): Promise<string> {
    return this.provider.generateLeadsSummary(leads);
  }
}

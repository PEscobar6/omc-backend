import { Lead } from '../../leads/entities/lead.entity';

export interface IAiProvider {
  generateLeadsSummary(leads: Lead[]): Promise<string>;
}

export const AI_PROVIDER = 'AI_PROVIDER';

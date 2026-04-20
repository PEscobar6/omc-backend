import OpenAI from 'openai';
import { Lead } from '../../leads/entities/lead.entity';
import { IAiProvider } from './ai-provider.interface';

const PROMPT_TEMPLATE = (data: string) =>
  `Eres un analista de marketing. Analiza estos leads y genera:
1. Resumen general
2. Fuente principal de leads
3. Recomendaciones accionables

Datos: ${data}`;

const PROVIDER_CONFIG: Record<string, { baseURL: string; model: string }> = {
  openai: {
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
  groq: {
    baseURL: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
  },
  gemini: {
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    model: 'gemini-1.5-flash',
  },
};

export class OpenAiCompatibleProvider implements IAiProvider {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(provider: string, apiKey: string) {
    const config = PROVIDER_CONFIG[provider];
    this.client = new OpenAI({ apiKey, baseURL: config.baseURL });
    this.model = config.model;
  }

  async generateLeadsSummary(leads: Lead[]): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: 500,
      messages: [{ role: 'user', content: PROMPT_TEMPLATE(JSON.stringify(leads)) }],
    });

    return response.choices[0]?.message?.content ?? 'No se pudo generar el resumen.';
  }
}

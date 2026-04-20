import { Lead } from '../../leads/entities/lead.entity';
import { IAiProvider } from './ai-provider.interface';

export class MockProvider implements IAiProvider {
  async generateLeadsSummary(leads: Lead[]): Promise<string> {
    return `[MOCK — configura AI_PROVIDER y AI_PROVIDER_API_KEY para respuestas reales]

1. Resumen general: Se analizaron ${leads.length} leads. La mayoría provienen de redes sociales con presupuestos entre $50 y $500.

2. Fuente principal: Instagram es la fuente con mayor volumen, seguida de Facebook y landing pages.

3. Recomendaciones accionables:
   - Incrementar inversión en campañas de Instagram dado el alto volumen de leads.
   - Implementar seguimiento automatizado para leads con presupuesto mayor a $200.
   - Crear landing pages específicas por producto para mejorar la conversión orgánica.`;
  }
}

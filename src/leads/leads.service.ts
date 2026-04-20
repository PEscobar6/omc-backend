import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AiService } from '../ai/ai.service';
import { AiSummaryDto } from './dto/ai-summary.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { FilterLeadDto } from './dto/filter-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { Lead } from './entities/lead.entity';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    private readonly aiService: AiService,
  ) {}

  async create(createLeadDto: CreateLeadDto): Promise<Lead> {
    const lead = this.leadRepository.create(createLeadDto);
    return this.leadRepository.save(lead);
  }

  async findAll(filters: FilterLeadDto) {
    const { page = 1, limit = 10, fuente, from, to } = filters;

    const qb = this.leadRepository.createQueryBuilder('lead');

    if (fuente) qb.andWhere('lead.fuente = :fuente', { fuente });
    if (from)   qb.andWhere('lead.createdAt >= :from', { from: new Date(from) });
    if (to)     qb.andWhere('lead.createdAt <= :to',   { to: new Date(to) });

    const [data, total] = await qb
      .orderBy('lead.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
    };
  }

  async getStats() {
    const [bySource, total, active] = await Promise.all([
      this.leadRepository
        .createQueryBuilder('lead')
        .select('lead.fuente', 'fuente')
        .addSelect('COUNT(*)', 'count')
        .groupBy('lead.fuente')
        .getRawMany(),
      this.leadRepository.count(),
      this.leadRepository.count({ where: { status: true } }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      bySource,
    };
  }

  async getAiSummary(dto: AiSummaryDto) {
    const { fuente, from, to } = dto;

    const qb = this.leadRepository.createQueryBuilder('lead');

    if (fuente) qb.andWhere('lead.fuente = :fuente', { fuente });
    if (from)   qb.andWhere('lead.createdAt >= :from', { from: new Date(from) });
    if (to)     qb.andWhere('lead.createdAt <= :to',   { to: new Date(to) });

    const leads = await qb.orderBy('lead.createdAt', 'DESC').getMany();

    if (leads.length === 0) {
      return { summary: 'No se encontraron leads con los filtros aplicados.', leadsAnalyzed: 0 };
    }

    const summary = await this.aiService.generateLeadsSummary(leads);

    return { summary, leadsAnalyzed: leads.length };
  }

  async findOne(id: string): Promise<Lead> {
    const lead = await this.leadRepository.findOne({ where: { id } });
    if (!lead) throw new NotFoundException(`Lead #${id} not found`);
    return lead;
  }

  async update(id: string, updateLeadDto: UpdateLeadDto): Promise<Lead> {
    const lead = await this.findOne(id);
    Object.assign(lead, updateLeadDto);
    return this.leadRepository.save(lead);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.leadRepository.softDelete(id);
  }
}

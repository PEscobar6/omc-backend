import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AiService } from '../ai/ai.service';
import { AiSummaryDto } from './dto/ai-summary.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { FilterLeadDto } from './dto/filter-lead.dto';
import { Lead, LeadSource } from './entities/lead.entity';
import { LeadsService } from './leads.service';

const mockLead = (): Lead => ({
  id: 'uuid-1',
  nombre: 'María García',
  email: 'maria@example.com',
  telefono: '+57 300 123 4567',
  fuente: LeadSource.INSTAGRAM,
  productoInteres: 'Curso de Marketing',
  presupuesto: 150,
  status: true,
  createdAt: new Date('2026-04-01'),
  updatedAt: new Date('2026-04-01'),
  deletedAt: null as any,
});

const buildQbMock = (overrides: Record<string, any> = {}) => {
  const qb: any = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(overrides.getRawMany ?? []),
    getRawOne: jest.fn().mockResolvedValue(overrides.getRawOne ?? null),
    getManyAndCount: jest.fn().mockResolvedValue(overrides.getManyAndCount ?? [[], 0]),
    getMany: jest.fn().mockResolvedValue(overrides.getMany ?? []),
    getCount: jest.fn().mockResolvedValue(overrides.getCount ?? 0),
  };
  return qb;
};

describe('LeadsService', () => {
  let service: LeadsService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    softDelete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockAiService = {
    generateLeadsSummary: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: getRepositoryToken(Lead), useValue: mockRepository },
        { provide: AiService, useValue: mockAiService },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
    jest.clearAllMocks();
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('given a valid DTO, when create is called, then it saves and returns the lead', async () => {
      const dto: CreateLeadDto = {
        nombre: 'María García',
        email: 'maria@example.com',
        fuente: LeadSource.INSTAGRAM,
      };
      const lead = mockLead();
      mockRepository.create.mockReturnValue(lead);
      mockRepository.save.mockResolvedValue(lead);

      const result = await service.create(dto);

      expect(mockRepository.create).toHaveBeenCalledWith(dto);
      expect(mockRepository.save).toHaveBeenCalledWith(lead);
      expect(result).toEqual(lead);
    });
  });

  // ── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('given no filters, when findAll is called, then it returns paginated leads with meta', async () => {
      const leads = [mockLead()];
      const qb = buildQbMock({ getManyAndCount: [leads, 1] });
      mockRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll({ page: 1, limit: 10 } as FilterLeadDto);

      expect(result.data).toEqual(leads);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 10, lastPage: 1 });
    });

    it('given a fuente filter, when findAll is called, then it adds a WHERE clause for fuente', async () => {
      const qb = buildQbMock({ getManyAndCount: [[], 0] });
      mockRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll({ fuente: LeadSource.FACEBOOK } as FilterLeadDto);

      expect(qb.andWhere).toHaveBeenCalledWith(
        'lead.fuente = :fuente',
        { fuente: LeadSource.FACEBOOK },
      );
    });

    it('given from and to date filters, when findAll is called, then it adds date range WHERE clauses', async () => {
      const qb = buildQbMock({ getManyAndCount: [[], 0] });
      mockRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll({ from: '2026-01-01', to: '2026-12-31' } as FilterLeadDto);

      expect(qb.andWhere).toHaveBeenCalledWith(
        'lead.createdAt >= :from',
        expect.objectContaining({ from: expect.any(Date) }),
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        'lead.createdAt <= :to',
        expect.objectContaining({ to: expect.any(Date) }),
      );
    });

    it('given 25 total leads and limit 10, when findAll is called, then lastPage is 3', async () => {
      const qb = buildQbMock({ getManyAndCount: [[], 25] });
      mockRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll({ page: 1, limit: 10 } as FilterLeadDto);

      expect(result.meta.lastPage).toBe(3);
    });
  });

  // ── getStats ──────────────────────────────────────────────────────────────

  describe('getStats', () => {
    it('given leads in DB, when getStats is called, then it returns all stat fields correctly', async () => {
      const bySourceQb = buildQbMock({ getRawMany: [{ fuente: 'instagram', count: '5' }] });
      const avgQb      = buildQbMock({ getRawOne: { avg: '147.50' } });
      const lastSevenQb = buildQbMock({ getCount: 3 });

      mockRepository.createQueryBuilder
        .mockReturnValueOnce(bySourceQb)
        .mockReturnValueOnce(avgQb)
        .mockReturnValueOnce(lastSevenQb);

      mockRepository.count
        .mockResolvedValueOnce(12)
        .mockResolvedValueOnce(10);

      const result = await service.getStats();

      expect(result.total).toBe(12);
      expect(result.active).toBe(10);
      expect(result.inactive).toBe(2);
      expect(result.avgPresupuesto).toBe(147.5);
      expect(result.lastSevenDays).toBe(3);
      expect(result.bySource).toEqual([{ fuente: 'instagram', count: '5' }]);
    });

    it('given no leads have a budget set, when getStats is called, then avgPresupuesto is 0', async () => {
      const bySourceQb  = buildQbMock({ getRawMany: [] });
      const avgQb       = buildQbMock({ getRawOne: { avg: null } });
      const lastSevenQb = buildQbMock({ getCount: 0 });

      mockRepository.createQueryBuilder
        .mockReturnValueOnce(bySourceQb)
        .mockReturnValueOnce(avgQb)
        .mockReturnValueOnce(lastSevenQb);

      mockRepository.count.mockResolvedValue(0);

      const result = await service.getStats();

      expect(result.avgPresupuesto).toBe(0);
    });
  });

  // ── getAiSummary ──────────────────────────────────────────────────────────

  describe('getAiSummary', () => {
    it('given filters that match no leads, when getAiSummary is called, then it returns a message without calling AI', async () => {
      const qb = buildQbMock({ getMany: [] });
      mockRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getAiSummary({} as AiSummaryDto);

      expect(mockAiService.generateLeadsSummary).not.toHaveBeenCalled();
      expect(result.leadsAnalyzed).toBe(0);
      expect(result.summary).toContain('No se encontraron leads');
    });

    it('given leads exist, when getAiSummary is called, then it calls AI and returns the summary', async () => {
      const leads = [mockLead(), mockLead()];
      const qb = buildQbMock({ getMany: leads });
      mockRepository.createQueryBuilder.mockReturnValue(qb);
      mockAiService.generateLeadsSummary.mockResolvedValue('Resumen generado por IA');

      const result = await service.getAiSummary({} as AiSummaryDto);

      expect(mockAiService.generateLeadsSummary).toHaveBeenCalledWith(leads);
      expect(result.summary).toBe('Resumen generado por IA');
      expect(result.leadsAnalyzed).toBe(2);
    });
  });

  // ── findOne ───────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('given an existing lead ID, when findOne is called, then it returns the lead', async () => {
      const lead = mockLead();
      mockRepository.findOne.mockResolvedValue(lead);

      const result = await service.findOne('uuid-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'uuid-1' } });
      expect(result).toEqual(lead);
    });

    it('given a non-existent ID, when findOne is called, then it throws NotFoundException', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('given an existing lead and update data, when update is called, then it saves and returns the updated lead', async () => {
      const lead = mockLead();
      const updated = { ...lead, presupuesto: 300 };
      mockRepository.findOne.mockResolvedValue(lead);
      mockRepository.save.mockResolvedValue(updated);

      const result = await service.update('uuid-1', { presupuesto: 300 });

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.presupuesto).toBe(300);
    });

    it('given a non-existent ID, when update is called, then it throws NotFoundException', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent', {})).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('given an existing lead ID, when remove is called, then it soft deletes the lead', async () => {
      mockRepository.findOne.mockResolvedValue(mockLead());
      mockRepository.softDelete.mockResolvedValue(undefined);

      await service.remove('uuid-1');

      expect(mockRepository.softDelete).toHaveBeenCalledWith('uuid-1');
    });

    it('given a non-existent ID, when remove is called, then it throws NotFoundException', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});

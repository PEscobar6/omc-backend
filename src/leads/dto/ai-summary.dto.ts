import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { LeadSource } from '../entities/lead.entity';

export class AiSummaryDto {
    @ApiPropertyOptional({ enum: LeadSource, description: 'Filter by lead source' })
    @IsEnum(LeadSource)
    @IsOptional()
    fuente?: LeadSource;

    @ApiPropertyOptional({ example: '2024-01-01', description: 'Filter from date (inclusive)' })
    @IsDateString()
    @IsOptional()
    from?: string;

    @ApiPropertyOptional({ example: '2024-12-31', description: 'Filter to date (inclusive)' })
    @IsDateString()
    @IsOptional()
    to?: string;
}

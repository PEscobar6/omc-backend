import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { LeadSource } from '../entities/lead.entity';

export class FilterLeadDto {
    @ApiPropertyOptional({ default: 1, minimum: 1 })
    @IsInt()
    @Min(1)
    @IsOptional()
    @Type(() => Number)
    page?: number = 1;

    @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
    @IsInt()
    @Min(1)
    @Max(100)
    @IsOptional()
    @Type(() => Number)
    limit?: number = 10;

    @ApiPropertyOptional({ enum: LeadSource })
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

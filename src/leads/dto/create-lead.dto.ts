import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { LeadSource } from '../entities/lead.entity';

export class CreateLeadDto {
    @ApiProperty({ example: 'María García', minLength: 2, maxLength: 255 })
    @IsString()
    @MinLength(2)
    @MaxLength(255)
    nombre!: string;

    @ApiProperty({ example: 'maria@example.com' })
    @IsEmail()
    @MaxLength(255)
    email!: string;

    @ApiPropertyOptional({ example: '+57 300 123 4567', maxLength: 50 })
    @IsString()
    @MaxLength(50)
    @IsOptional()
    telefono?: string;

    @ApiProperty({ enum: LeadSource, example: LeadSource.INSTAGRAM })
    @IsEnum(LeadSource)
    fuente!: LeadSource;

    @ApiPropertyOptional({ example: 'Curso de Marketing Digital', maxLength: 255 })
    @IsString()
    @MaxLength(255)
    @IsOptional()
    productoInteres?: string;

    @ApiPropertyOptional({ example: 150, minimum: 0 })
    @IsNumber()
    @Min(0)
    @IsOptional()
    presupuesto?: number;
}

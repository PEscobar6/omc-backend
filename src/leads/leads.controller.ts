import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { LeadsService } from './leads.service';
import { AiSummaryDto } from './dto/ai-summary.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { FilterLeadDto } from './dto/filter-lead.dto';
import { Auth } from '../auth/decorators';

@ApiTags('Leads')
@Auth()
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new lead' })
  @ApiResponse({ status: 201, description: 'Lead created' })
  @ApiResponse({ status: 400, description: 'Invalid data or duplicate email' })
  create(@Body() createLeadDto: CreateLeadDto) {
    return this.leadsService.create(createLeadDto);
  }

  @Get()
  @ApiOperation({ summary: 'List leads with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Paginated leads list' })
  findAll(@Query() filters: FilterLeadDto) {
    return this.leadsService.findAll(filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get leads statistics by source and status' })
  @ApiResponse({ status: 200, description: 'Stats summary' })
  getStats() {
    return this.leadsService.getStats();
  }

  @Post('ai/summary')
  @ApiOperation({ summary: 'Generate AI summary of leads using GPT' })
  @ApiResponse({ status: 201, description: 'Returns summary text and number of leads analyzed' })
  getAiSummary(@Body() dto: AiSummaryDto) {
    return this.leadsService.getAiSummary(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a lead by UUID' })
  @ApiResponse({ status: 200, description: 'Lead found' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.leadsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partially update a lead' })
  @ApiResponse({ status: 200, description: 'Lead updated' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateLeadDto: UpdateLeadDto) {
    return this.leadsService.update(id, updateLeadDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a lead' })
  @ApiResponse({ status: 204, description: 'Lead deleted' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.leadsService.remove(id);
  }
}

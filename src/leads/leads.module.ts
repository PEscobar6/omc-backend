import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { Lead } from './entities/lead.entity';

@Module({
  controllers: [LeadsController],
  providers: [LeadsService],
  imports: [
    TypeOrmModule.forFeature([Lead]),
    AuthModule,
    AiModule,
  ],
  exports: [TypeOrmModule],
})
export class LeadsModule {}

import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from './entities/lead.entity';

@Module({
  controllers: [LeadsController],
  providers: [LeadsService],
  imports: [
    TypeOrmModule.forFeature([Lead]),
  ],
  exports: [TypeOrmModule],
})
export class LeadsModule { }

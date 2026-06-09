import { Module } from '@nestjs/common';
import { DataModule } from '@financial-hub/data';
import { DatabaseService } from './database.service';

@Module({
  imports: [DataModule],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}

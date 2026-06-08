import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DataModule } from '@financial-hub/data';

@Module({
  imports: [DataModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

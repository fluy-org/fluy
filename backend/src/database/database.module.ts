import { Global, Module } from '@nestjs/common';
import { databaseProvider } from '@/database/database.provider';

@Global()
@Module({
  providers: [databaseProvider],
  exports: [databaseProvider],
})
export class DatabaseModule {}

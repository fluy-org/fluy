import { Global, Module } from '@nestjs/common';
import {
  databasePoolProvider,
  databaseProvider,
} from '@/database/database.provider';

@Global()
@Module({
  providers: [databasePoolProvider, databaseProvider],
  exports: [databasePoolProvider, databaseProvider],
})
export class DatabaseModule {}

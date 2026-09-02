import { Global, Module } from '@nestjs/common';
import { STORAGE_PROVIDER } from '@/shared/storage/contracts';
import { R2StorageProvider } from '@/shared/providers/r2/r2-storage.provider';

@Global()
@Module({
  providers: [
    R2StorageProvider,
    {
      provide: STORAGE_PROVIDER,
      useExisting: R2StorageProvider,
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class R2StorageModule {}

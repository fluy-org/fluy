import { Module } from '@nestjs/common';
import { TenantContextGuard } from '@/shared/tenant-context/guards/tenant-context.guard';
import { TenantContextRepository } from '@/shared/tenant-context/tenant-context.repository';
import { TenantContextResolver } from '@/shared/tenant-context/tenant-context.resolver';

@Module({
  providers: [
    TenantContextRepository,
    TenantContextResolver,
    TenantContextGuard,
  ],
  exports: [TenantContextGuard],
})
export class TenantContextModule {}

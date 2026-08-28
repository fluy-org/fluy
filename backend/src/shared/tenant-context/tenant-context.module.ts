import { Module } from '@nestjs/common';
import { TenantContextGuard } from './guards/tenant-context.guard';
import { TenantContextRepository } from './tenant-context.repository';
import { TenantContextResolver } from './tenant-context.resolver';

@Module({
  providers: [
    TenantContextRepository,
    TenantContextResolver,
    TenantContextGuard,
  ],
  exports: [TenantContextGuard],
})
export class TenantContextModule {}

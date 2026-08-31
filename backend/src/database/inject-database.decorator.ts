import { Inject } from '@nestjs/common';
import { DATABASE } from '@/database/database.provider';

export const InjectDatabase = () => Inject(DATABASE);

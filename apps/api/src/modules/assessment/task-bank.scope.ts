import { SetMetadata } from '@nestjs/common';
import type { TaskBankScope } from './task-bank.types';

export const TASK_BANK_SCOPES_KEY = 'task_bank_scopes';
export const RequireTaskBankScopes = (...scopes: TaskBankScope[]) => SetMetadata(TASK_BANK_SCOPES_KEY, scopes);

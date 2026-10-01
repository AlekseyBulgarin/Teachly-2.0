import { SetMetadata } from '@nestjs/common';
import type { TheoryScope } from './theory.types';

export const THEORY_SCOPES_KEY = 'theory_scopes';
export const RequireTheoryScopes = (...scopes: TheoryScope[]) => SetMetadata(THEORY_SCOPES_KEY, scopes);


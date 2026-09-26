import { SetMetadata } from '@nestjs/common';

export const MACHINE_AUTH_KEY = 'machine_authenticated';
export const MachineAuthenticated = () => SetMetadata(MACHINE_AUTH_KEY, true);

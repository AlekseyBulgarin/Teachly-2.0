import type { PublicTaskVersion } from '../education/education.types';
import type { ResultView } from '../attempts/attempts.types';

export type TrainerSessionStatus = 'active' | 'completed';

export type TrainerSessionItemView = {
  id: string;
  position: number;
  status: 'pending' | 'started' | 'submitted';
  task: PublicTaskVersion;
  attemptId: string | null;
  result: ResultView | null;
};


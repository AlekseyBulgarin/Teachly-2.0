import type { PublicTaskVersion } from '../education/education.types';

export type AttemptView = {
  id: string;
  taskVersionId: string;
  assignmentId: string | null;
  status: 'started' | 'submitted';
  startedAt: Date;
  submittedAt: Date | null;
};

export type ResultView = {
  id: string;
  attemptId: string;
  submissionId: string;
  evaluationRule: string;
  outcome: 'correct' | 'incorrect' | 'invalid';
  isCorrect: boolean;
  score: number;
  evaluatedAt: Date;
  learningHandoff?: 'recorded' | 'skipped_skill_unmapped';
};

export type StartedAttempt = {
  attempt: AttemptView;
  task: PublicTaskVersion;
};

export type SubmittedAttempt = {
  attempt: AttemptView;
  result: ResultView;
  manualReviewStatus: 'pending' | null;
  idempotentReplay: boolean;
};

export type AttemptResult = {
  attempt: AttemptView;
  result: ResultView;
  manualReviewStatus: 'pending' | null;
};

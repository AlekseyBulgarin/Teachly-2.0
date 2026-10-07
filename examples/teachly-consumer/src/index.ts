import 'dotenv/config';
import { runReferencePilot, type PilotMode } from './reference-pilot.js';

const requestedMode = process.argv[2] ?? 'run';
if (requestedMode !== 'preflight' && requestedMode !== 'run') {
  throw new Error('Usage: pnpm start [preflight|run]');
}

void main(requestedMode);

async function main(mode: PilotMode) {
  const report = await runReferencePilot({
    mode,
    baseUrl: required('TEACHLY_API_URL'),
    apiKey: required('TEACHLY_API_KEY'),
    externalUserId: required('TEACHLY_EXTERNAL_USER_ID'),
    runId: process.env.TEACHLY_PILOT_RUN_ID?.trim() || undefined,
    answerOptionId: process.env.TEACHLY_SAMPLE_ANSWER_OPTION_ID?.trim() || undefined,
    learnerQuestion: process.env.TEACHLY_LEARNER_QUESTION?.trim() || undefined,
  });

  console.log(JSON.stringify(report, null, 2));
  if (report.status === 'blocked') process.exitCode = 2;
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

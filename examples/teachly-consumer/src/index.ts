import 'dotenv/config';
import { createTeachlyClient, type components } from '@teachly/contracts';

const baseUrl = required('TEACHLY_API_URL');
const apiKey = required('TEACHLY_API_KEY');
const externalUserId = required('TEACHLY_EXTERNAL_USER_ID');
const client = createTeachlyClient({ baseUrl, apiKey });

void main();

async function main() {
  const synchronized = await client.POST('/v1/external-users', {
    body: { externalUserId },
  });
  if (!synchronized.data) fail('synchronize learner', synchronized.response);

  const learners = await client.GET('/v1/external-users', {
    params: { query: { limit: 50 } },
  });
  if (!learners.data) fail('list synchronized learners', learners.response);
  const learnerRows: readonly components['schemas']['ExternalUserResponseDto'][] = learners.data;

  console.log(JSON.stringify({
    synchronized: synchronized.data.externalUserId,
    activeLearners: learnerRows
      .filter((learner) => learner.status === 'active')
      .map((learner) => learner.externalUserId),
    requestId: learners.response.headers.get('x-request-id'),
    apiVersion: learners.response.headers.get('x-teachly-api-version'),
  }, null, 2));
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function fail(action: string, response: Response): never {
  throw new Error(`Unable to ${action} (HTTP ${response.status})`);
}

export function extractBearerToken(value: string | string[] | undefined): string | null {
  const authorization = Array.isArray(value) ? value[0] : value;
  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) return null;
  return authorization.slice('Bearer '.length).trim() || null;
}

export function isTeachlyApiKey(token: string | null): token is string {
  return Boolean(token?.startsWith('tlk_'));
}

export async function expectDatabaseError(
  operation: Promise<unknown>,
  expectedMessage: RegExp,
): Promise<void> {
  try {
    await operation;
    throw new Error('Expected database operation to fail');
  } catch (error) {
    const messages: string[] = [];
    const seen = new Set<unknown>();
    let current: unknown = error;
    while (current instanceof Error && !seen.has(current)) {
      seen.add(current);
      messages.push(current.message);
      current = current.cause;
    }
    expect(messages.join('\n')).toMatch(expectedMessage);
  }
}

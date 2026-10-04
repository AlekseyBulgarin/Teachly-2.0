import { createHmac, timingSafeEqual } from 'node:crypto';

const boardIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const bindingVersion = 'v1';

function signatureFor(boardId: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(`teachly-demo-board:${bindingVersion}:${boardId.toLowerCase()}`)
    .digest('base64url');
}

export function createDemoBoardBinding(boardId: string, secret: string): string {
  if (!boardIdPattern.test(boardId)) throw new Error('Invalid whiteboard id');
  if (!secret) throw new Error('Demo board session secret is required');
  const normalizedId = boardId.toLowerCase();
  return `${normalizedId}.${signatureFor(normalizedId, secret)}`;
}

export function verifyDemoBoardBinding(binding: string | undefined, boardId: string, secret: string): boolean {
  if (!binding || !boardIdPattern.test(boardId) || !secret) return false;
  const separator = binding.lastIndexOf('.');
  if (separator < 1) return false;
  const boundId = binding.slice(0, separator).toLowerCase();
  const suppliedSignature = binding.slice(separator + 1);
  const normalizedId = boardId.toLowerCase();
  if (boundId !== normalizedId || !boardIdPattern.test(boundId)) return false;
  const expectedSignature = signatureFor(normalizedId, secret);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

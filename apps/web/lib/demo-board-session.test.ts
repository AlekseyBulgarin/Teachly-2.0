import assert from 'node:assert/strict';
import test from 'node:test';
import { createDemoBoardBinding, verifyDemoBoardBinding } from './demo-board-session';

const boardId = '123e4567-e89b-42d3-a456-426614174000';
const otherBoardId = '123e4567-e89b-42d3-a456-426614174001';

test('accepts only the board and secret used to create the binding', () => {
  const binding = createDemoBoardBinding(boardId, 'server-only-secret');
  assert.equal(verifyDemoBoardBinding(binding, boardId, 'server-only-secret'), true);
  assert.equal(verifyDemoBoardBinding(binding, otherBoardId, 'server-only-secret'), false);
  assert.equal(verifyDemoBoardBinding(binding, boardId, 'different-secret'), false);
});

test('rejects malformed and tampered bindings', () => {
  const binding = createDemoBoardBinding(boardId, 'server-only-secret');
  assert.equal(verifyDemoBoardBinding(undefined, boardId, 'server-only-secret'), false);
  assert.equal(verifyDemoBoardBinding(`${binding}x`, boardId, 'server-only-secret'), false);
  assert.equal(verifyDemoBoardBinding('not-a-binding', boardId, 'server-only-secret'), false);
  assert.throws(() => createDemoBoardBinding('not-a-uuid', 'server-only-secret'));
});

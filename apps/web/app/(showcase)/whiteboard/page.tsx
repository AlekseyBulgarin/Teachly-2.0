'use client';

import { useCallback } from 'react';
import { TeachlyWhiteboard, type BoardData } from '@/components/whiteboard';

const DEMO_BOARD_ID = 'demo-whiteboard-1';

export default function WhiteboardDemoPage() {
  const handleLoadBoard = useCallback(async (boardId: string): Promise<BoardData | null> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return null;
  }, []);

  const handleSaveBoard = useCallback(async (boardId: string, data: BoardData): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
  }, []);

  const apiRows = [
    { prop: 'boardId', type: 'string' },
    { prop: 'loadBoard', type: '(id: string) => Promise<BoardData | null>' },
    { prop: 'saveBoard', type: '(id: string, data: BoardData) => Promise<void>' },
    { prop: 'debounceMs', type: 'number (default 1000)' },
    { prop: 'onSaveStatusChange', type: '(status) => void' },
    { prop: 'initialData', type: 'BoardData | null' },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-50">Whiteboard Demo</h1>
        <p className="mt-2 text-slate-400">
          TeachlyWhiteboard component with Excalidraw integration. Drawing changes are debounced and saved via
          the provided callbacks. Status indicator shows save state.
        </p>
      </div>

      <TeachlyWhiteboard
        boardId={DEMO_BOARD_ID}
        loadBoard={handleLoadBoard}
        saveBoard={handleSaveBoard}
        debounceMs={1000}
        className="min-h-[600px]"
      />

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h3 className="text-lg font-semibold text-slate-50">Component API</h3>
        <div className="mt-3 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
          {apiRows.map((row) => (
            <div key={row.prop}>
              <code className="font-mono text-emerald-200">{row.prop}</code>: {row.type}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { ExcalidrawElement, OrderedExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import type { AppState } from '@excalidraw/excalidraw/types';
import type { BinaryFiles } from '@excalidraw/excalidraw/types';
import type { ImportedDataState } from '@excalidraw/excalidraw/data/types';
import type { LibraryItems } from '@excalidraw/excalidraw/types';
import type { ExportOpts } from '@excalidraw/excalidraw/types';
import '@excalidraw/excalidraw/index.css';

const ExcalidrawComponent = dynamic(
  () => import('@excalidraw/excalidraw').then((mod) => mod.Excalidraw),
  { ssr: false }
);

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export type BoardData = {
  elements: readonly ExcalidrawElement[];
  appState: AppState;
  files: BinaryFiles;
};

type LoadBoard = (boardId: string) => Promise<BoardData | null>;
type SaveBoard = (boardId: string, data: BoardData) => Promise<void>;

export interface TeachlyWhiteboardProps {
  boardId: string;
  loadBoard: LoadBoard;
  saveBoard: SaveBoard;
  className?: string;
  debounceMs?: number;
  onSaveStatusChange?: (status: SaveStatus) => void;
  initialData?: BoardData | null;
}

export function TeachlyWhiteboard({
  boardId,
  loadBoard,
  saveBoard,
  className = '',
  debounceMs = 1000,
  onSaveStatusChange,
  initialData,
}: TeachlyWhiteboardProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const [loadedData, setLoadedData] = useState<BoardData | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDataRef = useRef<BoardData | null>(null);
  const isMountedRef = useRef(true);
  const saveStatusRef = useRef<SaveStatus>('idle');

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, []);

  const applySaveStatus = useCallback(
    (status: SaveStatus) => {
      saveStatusRef.current = status;
      setSaveStatus(status);
      onSaveStatusChange?.(status);
    },
    [onSaveStatusChange]
  );

  useEffect(() => {
    if (initialData && excalidrawAPI) {
      excalidrawAPI.addFiles(Object.values(initialData.files));
      excalidrawAPI.updateScene({
        elements: initialData.elements,
        appState: initialData.appState,
      });
    }
  }, [initialData, excalidrawAPI]);

  const loadInitialData = useCallback(async () => {
    if (initialData) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await loadBoard(boardId);
      if (!isMountedRef.current) return;
      setLoadedData(data);
      const api = excalidrawAPIRef.current;
      if (data && api) {
        api.addFiles(Object.values(data.files));
        api.updateScene({
          elements: data.elements,
          appState: data.appState,
        });
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load board');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [boardId, loadBoard, initialData]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleChange = useCallback(
    (elements: readonly OrderedExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
      const data: BoardData = { elements, appState, files };
      pendingDataRef.current = data;

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);

      applySaveStatus('saving');

      saveTimeoutRef.current = setTimeout(async () => {
        if (!isMountedRef.current || !pendingDataRef.current) return;

        try {
          await saveBoard(boardId, pendingDataRef.current);
          if (!isMountedRef.current) return;
          applySaveStatus('saved');
          idleTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current && saveStatusRef.current === 'saved') {
              applySaveStatus('idle');
            }
          }, 2000);
        } catch (err) {
          if (isMountedRef.current) {
            applySaveStatus('error');
            setError(err instanceof Error ? err.message : 'Failed to save board');
          }
        }
      }, debounceMs);
    },
    [boardId, saveBoard, debounceMs, applySaveStatus]
  );

  const handleLibraryChange = useCallback(
    (items: LibraryItems) => {
      if (excalidrawAPI) {
        excalidrawAPI.updateLibrary({ libraryItems: items });
      }
    },
    [excalidrawAPI]
  );

  const handleExcalidrawApi = useCallback((api: ExcalidrawImperativeAPI | null) => {
    excalidrawAPIRef.current = api;
    setExcalidrawAPI(api);
  }, []);

  const retryLoad = useCallback(() => {
    loadInitialData();
  }, [loadInitialData]);

  const retrySave = useCallback(async () => {
    if (!pendingDataRef.current) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    applySaveStatus('saving');
    try {
      await saveBoard(boardId, pendingDataRef.current);
      if (!isMountedRef.current) return;
      applySaveStatus('saved');
      setError(null);
      idleTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current && saveStatusRef.current === 'saved') {
          applySaveStatus('idle');
        }
      }, 2000);
    } catch (err) {
      if (isMountedRef.current) {
        applySaveStatus('error');
        setError(err instanceof Error ? err.message : 'Failed to save board');
      }
    }
  }, [boardId, saveBoard, applySaveStatus]);

  const boardData = initialData ?? loadedData;
  const initialDataForExcalidraw = useMemo<ImportedDataState | undefined>(
    () =>
      boardData
        ? {
            elements: boardData.elements,
            appState: boardData.appState,
            files: boardData.files,
          }
        : undefined,
    [boardData]
  );

  const uiOptions = useMemo(
    () => ({
      canvasActions: {
        export: {} as ExportOpts | false,
        clearCanvas: true,
        loadScene: true,
      },
    }),
    []
  );

  if (isLoading) {
    return (
      <div
        className={`flex min-h-[500px] w-full items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] ${className}`}
        role="status"
        aria-label="Loading whiteboard"
      >
        <div className="flex flex-col items-center gap-4 text-slate-500">
          <div className="size-8 border-2 border-emerald-300/30 border-t-emerald-300 rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading whiteboard…</p>
        </div>
      </div>
    );
  }

  if (error && !excalidrawAPI) {
    return (
      <div
        className={`flex min-h-[500px] w-full flex-col items-center justify-center gap-4 rounded-2xl border border-amber-300/15 bg-amber-300/[.06] p-6 ${className}`}
        role="alert"
      >
        <div className="flex flex-col items-center gap-3 text-center text-slate-300">
          <svg className="size-12 text-amber-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="max-w-md text-sm">{error}</p>
          <button
            onClick={retryLoad}
            className="rounded-lg border border-amber-200/20 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-200/10"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col w-full ${className}`}>
      <div className="flex h-[600px] w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden [&_.excalidraw]:h-full [&_.excalidraw]:w-full">
        <ExcalidrawComponent
          excalidrawAPI={handleExcalidrawApi}
          onChange={handleChange}
          onLibraryChange={handleLibraryChange}
          initialData={initialDataForExcalidraw}
          UIOptions={uiOptions}
          theme="dark"
          autoFocus={true}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span
            className={`size-2 rounded-full ${
              saveStatus === 'saving'
                ? 'bg-amber-300 animate-pulse'
                : saveStatus === 'saved'
                ? 'bg-emerald-300'
                : saveStatus === 'error'
                ? 'bg-rose-300'
                : 'bg-slate-500'
            }`}
            aria-hidden="true"
          />
          <span className="capitalize">
            {saveStatus === 'saving'
              ? 'Saving…'
              : saveStatus === 'saved'
              ? 'Saved'
              : saveStatus === 'error'
              ? 'Save failed'
              : 'Idle'}
          </span>
        </div>

        {saveStatus === 'error' && (
          <button
            onClick={retrySave}
            className="rounded-lg border border-amber-200/20 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-200/10"
          >
            Retry save
          </button>
        )}
      </div>
    </div>
  );
}
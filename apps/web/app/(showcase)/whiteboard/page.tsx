'use client';

import { useCallback, useRef } from 'react';
import { TeachlyWhiteboard, type BoardData } from '@/components/whiteboard';
import { CapabilityPage } from '@/components/showcase/capabilities';
import { useEcosystem } from '@/lib/ecosystem-context';
import { api, ApiError } from '@/lib/api';

const STORAGE_KEY = 'teachly-showcase-whiteboard-id';
const LEGACY_STORAGE_KEY = 'teachly-showcase-whiteboard:demo-whiteboard-1';
const BOARD_UI_KEY = 'showcase-whiteboard';
const BOARD_TITLE = 'Showcase visitor board';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type BoardHandle = { id: string; revision: number };
type BoardResolution = { handle: BoardHandle; data: BoardData | null };

function readStoredBoardId(): string | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored && UUID_PATTERN.test(stored) ? stored : null;
  } catch {
    return null;
  }
}

function writeStoredBoardId(id: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    return;
  }
}

function clearStoredBoardId(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    return;
  }
}

function removeLegacyBoardScene(): void {
  try {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    return;
  }
}

export default function WhiteboardDemoPage() {
  const { locale } = useEcosystem();
  const boardPromiseRef = useRef<Promise<BoardResolution> | null>(null);
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());

  const resolveBoard = useCallback((): Promise<BoardResolution> => {
    if (boardPromiseRef.current) return boardPromiseRef.current;
    const pending = (async (): Promise<BoardResolution> => {
      removeLegacyBoardScene();
      const storedId = readStoredBoardId();
      if (storedId) {
        try {
          const state = await api.whiteboardState(storedId);
          return {
            handle: { id: storedId, revision: state.revision },
            data: state.data as BoardData | null,
          };
        } catch (error) {
          if (!(error instanceof ApiError) || error.status !== 404) throw error;
          clearStoredBoardId();
        }
      }
      const created = await api.whiteboardCreate(BOARD_TITLE);
      writeStoredBoardId(created.id);
      return { handle: { id: created.id, revision: created.currentRevision }, data: null };
    })();
    boardPromiseRef.current = pending.catch((error: unknown) => {
      boardPromiseRef.current = null;
      throw error;
    });
    return boardPromiseRef.current;
  }, []);

  const handleLoadBoard = useCallback(async (): Promise<BoardData | null> => {
    const resolution = await resolveBoard();
    return resolution.data;
  }, [resolveBoard]);

  const handleSaveBoard = useCallback((_boardId: string, data: BoardData): Promise<void> => {
    const run = async (): Promise<void> => {
      const { handle } = await resolveBoard();
      const result = await api.whiteboardSave(handle.id, handle.revision, data);
      handle.revision = result.revision;
    };
    const chained = saveChainRef.current.then(run, run);
    saveChainRef.current = chained.then(() => undefined, () => undefined);
    return chained;
  }, [resolveBoard]);

  const labels = locale === 'ru'
    ? { loading: 'Загрузка доски…', loadError: 'Не удалось загрузить доску', retry: 'Повторить', saving: 'Сохранение…', saved: 'Сохранено', saveError: 'Не удалось сохранить', idle: 'Готово', retrySave: 'Повторить сохранение' }
    : { loading: 'Loading whiteboard…', loadError: 'Failed to load board', retry: 'Retry', saving: 'Saving…', saved: 'Saved', saveError: 'Save failed', idle: 'Ready', retrySave: 'Retry save' };

  return (
    <CapabilityPage
      capability="whiteboard"
      demo={
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-6 text-slate-400">
            {locale === 'ru'
              ? 'Черновики сохраняются на сервере и переживают перезагрузку страницы. Каждый посетитель работает на собственной доске. Совместное редактирование в реальном времени не входит в эту демоверсию.'
              : 'Drafts are saved on the server and survive a page reload. Each visitor gets their own board. Real-time collaboration is not part of this demo.'}
          </p>
          <TeachlyWhiteboard
            boardId={BOARD_UI_KEY}
            loadBoard={handleLoadBoard}
            saveBoard={handleSaveBoard}
            debounceMs={1000}
            className="min-h-[600px]"
            labels={labels}
            language={locale === 'ru' ? 'ru-RU' : 'en'}
          />
        </div>
      }
    />
  );
}

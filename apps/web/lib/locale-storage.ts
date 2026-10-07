import type { Locale } from '@/lib/i18n';

export const LOCALE_STORAGE_KEY = 'teachly-showcase-locale';

export function parseStoredLocale(value: string | null): Locale | null {
  return value === 'ru' || value === 'en' ? value : null;
}

export function readStoredLocale(storage: Pick<Storage, 'getItem'>): Locale | null {
  return parseStoredLocale(storage.getItem(LOCALE_STORAGE_KEY));
}

export function writeStoredLocale(storage: Pick<Storage, 'setItem'>, locale: Locale): void {
  storage.setItem(LOCALE_STORAGE_KEY, locale);
}

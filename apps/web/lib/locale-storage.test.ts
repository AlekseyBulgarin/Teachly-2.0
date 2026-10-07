import assert from 'node:assert/strict';
import test from 'node:test';
import { LOCALE_STORAGE_KEY, parseStoredLocale, readStoredLocale, writeStoredLocale } from './locale-storage';

test('accepts only supported stored locales', () => {
  assert.equal(parseStoredLocale('ru'), 'ru');
  assert.equal(parseStoredLocale('en'), 'en');
  assert.equal(parseStoredLocale('de'), null);
  assert.equal(parseStoredLocale(null), null);
});

test('reads and writes the stable locale key', () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
  writeStoredLocale(storage, 'en');
  assert.equal(values.get(LOCALE_STORAGE_KEY), 'en');
  assert.equal(readStoredLocale(storage), 'en');
});

/**
 * Abertura do banco local. Um único arquivo, um único handle.
 *
 * `enableChangeListener: true` é o que faz o `useLiveQuery` do Drizzle funcionar:
 * o SQLite avisa quando uma tabela muda e a UI re-renderiza sem polling.
 */

import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import { DATABASE_NAME } from '../../config';
import { schema } from './schema';

export const sqliteDatabase = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });

export const db = drizzle(sqliteDatabase, { schema });

export type AppDatabase = typeof db;

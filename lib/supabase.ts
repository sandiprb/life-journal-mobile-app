import { createClient } from '@supabase/supabase-js';
import { openDatabaseSync } from 'expo-sqlite';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Use expo-sqlite for session persistence on native
class ExpoSQLiteStorage {
  private db = openDatabaseSync('supabase-storage.db');

  constructor() {
    this.db.execSync(
      'CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT);'
    );
  }

  getItem(key: string): string | null {
    const row = this.db.getFirstSync<{ value: string }>(
      'SELECT value FROM kv WHERE key = ?;',
      [key]
    );
    return row?.value ?? null;
  }

  setItem(key: string, value: string): void {
    this.db.runSync(
      'INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?);',
      [key, value]
    );
  }

  removeItem(key: string): void {
    this.db.runSync('DELETE FROM kv WHERE key = ?;', [key]);
  }
}

const storage = Platform.OS !== 'web' ? new ExpoSQLiteStorage() : undefined;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    ...(storage ? { storage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

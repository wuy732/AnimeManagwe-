import { readFileSync, writeFileSync } from 'fs';

/**
 * Create a simple JSON file database accessor.
 * Replaces the duplicated readDB/writeDB inner functions across route files.
 */
export function createDB(dbPath) {
  return {
    read() {
      return JSON.parse(readFileSync(dbPath, 'utf-8'));
    },
    write(data) {
      writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
    }
  };
}

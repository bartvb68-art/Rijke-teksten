import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const SCHEMA = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS teachers (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  school TEXT NOT NULL DEFAULT '',
  pass_hash TEXT NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0,
  must_change INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  last_login INTEGER
);

CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY,
  teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  groep INTEGER NOT NULL DEFAULT 8,
  code TEXT NOT NULL UNIQUE,
  settings TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL COLLATE NOCASE,
  pass_hash TEXT NOT NULL,
  settings TEXT NOT NULL DEFAULT '{}',
  xp INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  last_login INTEGER,
  UNIQUE (class_id, name)
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

-- Geschatte vaardigheid per leerling per onderdeel
CREATE TABLE IF NOT EXISTS abilities (
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  theta REAL NOT NULL,
  n INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (student_id, skill)
);

-- Opgaven die klaarstaan (antwoord blijft op de server)
CREATE TABLE IF NOT EXISTS pending (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  test_id INTEGER,
  item TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS pending_student ON pending (student_id);

CREATE TABLE IF NOT EXISTS answers (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  domain TEXT NOT NULL,
  item_key TEXT NOT NULL,
  difficulty REAL NOT NULL,
  correct INTEGER NOT NULL,
  given TEXT NOT NULL,
  answer TEXT NOT NULL,
  prompt TEXT NOT NULL,
  mode TEXT NOT NULL,
  test_id INTEGER,
  ms INTEGER NOT NULL,
  theta_after REAL NOT NULL,
  location TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS answers_student_time ON answers (student_id, created_at);

CREATE TABLE IF NOT EXISTS tests (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  week TEXT NOT NULL,
  plan TEXT NOT NULL,
  pos INTEGER NOT NULL DEFAULT 0,
  started_at INTEGER NOT NULL,
  finished_at INTEGER,
  result TEXT
);
CREATE INDEX IF NOT EXISTS tests_student ON tests (student_id, started_at);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

export function openDb(file) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  const db = new DatabaseSync(file);
  if (file !== ':memory:') db.exec('PRAGMA journal_mode = WAL;');
  db.exec(SCHEMA);
  return db;
}

/** Voer een functie uit binnen één transactie. */
export function tx(db, fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function parseJson(text, fallback) {
  try {
    const v = JSON.parse(text);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

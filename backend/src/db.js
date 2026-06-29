const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'auth.db');

let db;

function initDatabase() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('guest','user','premium','admin','super_admin')),
      token_version INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  return db;
}

function createUser({ username, email, password }) {
  const hashed = bcrypt.hashSync(password, 10);
  const stmt = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)');
  const result = stmt.run(username, email, hashed);
  return getById(result.lastInsertRowid);
}

function getById(id) {
  return db.prepare('SELECT id, username, email, role, token_version, created_at, updated_at FROM users WHERE id = ?').get(id) || null;
}

function getByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) || null;
}

function getAllUsers() {
  return db.prepare('SELECT id, username, email, role, created_at, updated_at FROM users').all();
}

function updateUser(id, fields) {
  const sets = [];
  const values = [];
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      if (key === 'password') {
        sets.push('password = ?');
        values.push(bcrypt.hashSync(value, 10));
      } else {
        sets.push(`${key} = ?`);
        values.push(value);
      }
    }
  }
  if (sets.length === 0) return getById(id);
  sets.push("updated_at = datetime('now')");
  values.push(id);
  db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return getById(id);
}

function deleteUser(id) {
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

function incrementTokenVersion(id) {
  db.prepare("UPDATE users SET token_version = token_version + 1, updated_at = datetime('now') WHERE id = ?").run(id);
}

module.exports = { initDatabase, createUser, getById, getByUsername, getAllUsers, updateUser, deleteUser, incrementTokenVersion };

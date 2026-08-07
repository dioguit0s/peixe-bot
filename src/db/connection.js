const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const { dbPath } = require('../config/env');

const resolvedPath = path.resolve(process.cwd(), dbPath);
fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

const db = new Database(resolvedPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;

import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import { DB_PATH, DATA_DIR } from '../config/env.js'
import { logger } from '../config/logger.js'

let dbInstance = null

export function getDb() {
  if (dbInstance) return dbInstance

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }

  dbInstance = new DatabaseSync(DB_PATH)

  dbInstance.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    PRAGMA temp_store = MEMORY;
  `)

  logger.info({ path: DB_PATH }, 'Basis data SQLite terhubung')
  return dbInstance
}

export function closeDb() {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
    logger.info('Basis data SQLite ditutup')
  }
}

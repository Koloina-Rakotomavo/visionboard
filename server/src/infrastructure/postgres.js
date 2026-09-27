import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import pg from 'pg'

const { Pool } = pg
const databaseUrl = process.env.DATABASE_URL?.trim()
export const postgresEnabled = Boolean(databaseUrl)

const isLocalDatabase = databaseUrl ? /localhost|127\.0.0.1/.test(databaseUrl) : false
export const postgresPool = postgresEnabled
  ? new Pool({
      connectionString: databaseUrl,
      max: Number(process.env.PGPOOL_MAX) || 5,
      ssl: process.env.PGSSL === 'disable' || isLocalDatabase ? undefined : { rejectUnauthorized: false },
    })
  : null

let schemaPromise

const ensureSchema = async () => {
  if (!postgresPool) return
  if (!schemaPromise) {
    schemaPromise = postgresPool.query(`
      CREATE TABLE IF NOT EXISTS visionboard_records (
        collection TEXT NOT NULL,
        record_id TEXT NOT NULL,
        payload JSONB NOT NULL,
        created_at BIGINT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (collection, record_id)
      );
      CREATE INDEX IF NOT EXISTS visionboard_records_collection_idx
        ON visionboard_records (collection);
    `)
  }
  await schemaPromise
}

const readJsonFile = async (filePath) => {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'))
  } catch {
    return []
  }
}

const recordId = (record) => String(record?.id ?? crypto.randomUUID())
const recordCreatedAt = (record) => {
  const value = record?.created_at ?? record?.createdAt
  const timestamp = value instanceof Date ? value.getTime() : Number(value)
  return Number.isFinite(timestamp) ? timestamp : Date.now()
}

export const initializePostgres = async (collectionFiles = {}) => {
  if (!postgresPool) return
  await ensureSchema()

  for (const [collection, filePath] of Object.entries(collectionFiles)) {
    const countResult = await postgresPool.query(
      'SELECT COUNT(*)::int AS count FROM visionboard_records WHERE collection = $1',
      [collection],
    )
    if (countResult.rows[0].count > 0) continue

    const records = await readJsonFile(filePath)
    if (!Array.isArray(records) || !records.length) continue

    const client = await postgresPool.connect()
    try {
      await client.query('BEGIN')
      for (const record of records) {
        await client.query(
          `INSERT INTO visionboard_records (collection, record_id, payload, created_at)
           VALUES ($1, $2, $3::jsonb, $4)
           ON CONFLICT (collection, record_id) DO NOTHING`,
          [collection, recordId(record), JSON.stringify(record), recordCreatedAt(record)],
        )
      }
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}

export const readPostgresCollection = async (collection) => {
  if (!postgresPool) return []
  await ensureSchema()
  const result = await postgresPool.query(
    'SELECT payload FROM visionboard_records WHERE collection = $1 ORDER BY created_at DESC NULLS LAST',
    [collection],
  )
  return result.rows.map((row) => row.payload)
}

export const writePostgresCollection = async (collection, records) => {
  if (!postgresPool) return
  await ensureSchema()
  const client = await postgresPool.connect()
  try {
    await client.query('BEGIN')
    await client.query('DELETE FROM visionboard_records WHERE collection = $1', [collection])
    for (const record of records) {
      await client.query(
        'INSERT INTO visionboard_records (collection, record_id, payload, created_at) VALUES ($1, $2, $3::jsonb, $4)',
        [collection, recordId(record), JSON.stringify(record), recordCreatedAt(record)],
      )
    }
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export const checkPostgresConnection = async () => {
  if (!postgresPool) return false
  await ensureSchema()
  await postgresPool.query('SELECT 1')
  return true
}

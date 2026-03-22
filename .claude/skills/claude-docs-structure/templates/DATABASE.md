# Database

## Overview
<!-- Postgres version, connection pooling setup, ORM or raw queries -->

## Schema Summary

| Table | Purpose | Key columns |
|---|---|---|
| <!-- table name --> | <!-- purpose --> | <!-- id, foreign keys, indexed columns --> |

## Migration Strategy

- Tool: <!-- e.g. node-pg-migrate, Kysely, Flyway -->
- Location: `db/migrations/`
- Never modify existing migrations — always add new ones
- Run migrations before deploying new app versions

## Indexing Conventions

- All foreign keys are indexed
- Columns used in WHERE clauses are indexed
- Index naming: `idx_<table>_<column>`

## Connection

<!-- How the app connects — pool size, env vars used -->
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
DB_POOL_SIZE=10
```

## Backup Strategy

<!-- How and when the database is backed up -->

/**
 * SQLite Database Configuration
 * Uses better-sqlite3 for database operations
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { initDatabase } from './init-database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = path.join(__dirname, '../../database.db');

// Initialize database if it doesn't exist
let db;
try {
  db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON');
} catch (error) {
  console.error('Error opening database:', error);
  // Initialize database if it doesn't exist
  initDatabase();
  db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON');
}

/**
 * Generate UUID
 */
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Convert SQLite row to object (handle snake_case to camelCase if needed)
 */
function rowToObject(row) {
  return { ...row };
}

/**
 * Helper function to sanitize SQLite values
 * SQLite can only bind numbers, strings, bigints, buffers, and null
 */
function sanitizeValue(value) {
  if (value === undefined) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'object' && value !== null) return JSON.stringify(value);
  return value;
}

/**
 * Query builder class that mimics Supabase query builder
 */
class QueryBuilder {
  constructor(tableName) {
    this.tableName = tableName;
    this.filters = [];
    this.orderBy = [];
    this.limitCount = null;
    this.singleResult = false;
  }

  select(columns = '*') {
    return this;
  }

  eq(column, value) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }

  neq(column, value) {
    this.filters.push({ type: 'neq', column, value });
    return this;
  }

  in(column, values) {
    this.filters.push({ type: 'in', column, values });
    return this;
  }

  ilike(column, pattern) {
    this.filters.push({ type: 'ilike', column, pattern });
    return this;
  }

  order(column, options = {}) {
    this.orderBy.push({ column, ascending: options.ascending !== false });
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  async execute() {
    try {
      let query = `SELECT * FROM ${this.tableName}`;
      const params = [];
      const conditions = [];

      // Build WHERE clause
      this.filters.forEach((filter, index) => {
        if (filter.type === 'eq') {
          conditions.push(`${filter.column} = ?`);
          params.push(sanitizeValue(filter.value));
        } else if (filter.type === 'neq') {
          conditions.push(`${filter.column} != ?`);
          params.push(sanitizeValue(filter.value));
        } else if (filter.type === 'in') {
          const placeholders = filter.values.map(() => '?').join(', ');
          conditions.push(`${filter.column} IN (${placeholders})`);
          params.push(...filter.values.map(sanitizeValue));
        } else if (filter.type === 'ilike') {
          conditions.push(`${filter.column} LIKE ?`);
          params.push(sanitizeValue(filter.pattern.replace(/%/g, '%')));
        }
      });

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      // Add ORDER BY
      if (this.orderBy && this.orderBy.length > 0) {
        const orderClauses = this.orderBy.map(order => 
          `${order.column} ${order.ascending ? 'ASC' : 'DESC'}`
        );
        query += ' ORDER BY ' + orderClauses.join(', ');
      }

      // Add LIMIT
      if (this.limitCount) {
        query += ` LIMIT ${this.limitCount}`;
      }

      const stmt = db.prepare(query);
      let rows = stmt.all(...params);
      rows = rows.map(rowToObject);

      // Single result
      if (this.singleResult) {
        if (rows.length === 0) {
          return { data: null, error: { code: 'PGRST116', message: 'No rows found' } };
        }
        return { data: rows[0], error: null };
      }

      return { data: rows, error: null };
    } catch (error) {
      console.error(`Query error on ${this.tableName}:`, error);
      return { data: null, error };
    }
  }

  // Make it thenable (promise-like)
  then(onResolve, onReject) {
    return Promise.resolve(this.execute()).then(onResolve, onReject);
  }
}

/**
 * Insert builder
 */
class InsertBuilder {
  constructor(tableName, records) {
    this.tableName = tableName;
    this.records = Array.isArray(records) ? records : [records];
    this.singleResult = false;
  }

  select(columns = '*') {
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  async execute() {
    try {
      const newRecords = [];
      
      for (const record of this.records) {
        const newRecord = { ...record };
        
        // Generate ID if not provided
        if (!newRecord.id) {
          newRecord.id = generateId();
        }
        
        // Set timestamps (only if table has these columns)
        const now = new Date().toISOString();
        if (!newRecord.created_at) {
          newRecord.created_at = now;
        }
        // Only add updated_at if it's not explicitly set to null/undefined
        // Some tables like order_items don't have updated_at column
        if (newRecord.updated_at === undefined) {
          // Check if table has updated_at column by trying to get table info
          // For now, only add updated_at if it's not in the record and table might have it
          // We'll let SQLite handle missing columns with an error that we can catch
        }

        // Build INSERT query
        const columns = Object.keys(newRecord);
        const placeholders = columns.map(() => '?').join(', ');
        const values = columns.map(col => sanitizeValue(newRecord[col]));
        
        const query = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
        const stmt = db.prepare(query);
        
        try {
          stmt.run(...values);
        } catch (sqlError) {
          // If error is about missing column (like updated_at), remove it and retry
          if (sqlError.message && sqlError.message.includes('no such column: updated_at')) {
            delete newRecord.updated_at;
            const columns2 = Object.keys(newRecord);
            const placeholders2 = columns2.map(() => '?').join(', ');
            const values2 = columns2.map(col => sanitizeValue(newRecord[col]));
            const query2 = `INSERT INTO ${this.tableName} (${columns2.join(', ')}) VALUES (${placeholders2})`;
            const stmt2 = db.prepare(query2);
            stmt2.run(...values2);
          } else {
            throw sqlError;
          }
        }
        
        // Fetch the inserted record
        const selectStmt = db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`);
        const inserted = selectStmt.get(newRecord.id);
        newRecords.push(rowToObject(inserted));
      }

      if (this.singleResult) {
        return { data: newRecords[0], error: null };
      }
      return { data: newRecords, error: null };
    } catch (error) {
      console.error(`Insert error on ${this.tableName}:`, error);
      return { data: null, error };
    }
  }

  then(onResolve, onReject) {
    return Promise.resolve(this.execute()).then(onResolve, onReject);
  }
}

/**
 * Update builder
 */
class UpdateBuilder {
  constructor(tableName, updates) {
    this.tableName = tableName;
    this.updates = { ...updates, updated_at: new Date().toISOString() };
    this.filters = [];
    this.singleResult = false;
  }

  eq(column, value) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }

  select(columns = '*') {
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  async execute() {
    try {
      const conditions = [];
      const params = [];

      // Build WHERE clause
      this.filters.forEach(filter => {
        if (filter.type === 'eq') {
          conditions.push(`${filter.column} = ?`);
          params.push(sanitizeValue(filter.value));
        }
      });

      if (conditions.length === 0) {
        return { data: null, error: { message: 'No conditions specified for update' } };
      }

      // Build SET clause
      const setClause = Object.keys(this.updates).map(key => `${key} = ?`).join(', ');
      const updateValues = Object.values(this.updates).map(sanitizeValue);

      const query = `UPDATE ${this.tableName} SET ${setClause} WHERE ${conditions.join(' AND ')}`;
      const stmt = db.prepare(query);
      stmt.run(...updateValues, ...params);

      // Fetch updated records
      const selectQuery = `SELECT * FROM ${this.tableName} WHERE ${conditions.join(' AND ')}`;
      const selectStmt = db.prepare(selectQuery);
      const rows = selectStmt.all(...params);
      const updated = rows.map(rowToObject);

      if (this.singleResult) {
        return { data: updated[0] || null, error: updated.length === 0 ? { code: 'PGRST116' } : null };
      }
      return { data: updated, error: null };
    } catch (error) {
      console.error(`Update error on ${this.tableName}:`, error);
      return { data: null, error };
    }
  }

  then(onResolve, onReject) {
    return Promise.resolve(this.execute()).then(onResolve, onReject);
  }
}

/**
 * Delete builder
 */
class DeleteBuilder {
  constructor(tableName) {
    this.tableName = tableName;
    this.filters = [];
  }

  eq(column, value) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }

  async execute() {
    try {
      const conditions = [];
      const params = [];

      this.filters.forEach(filter => {
        if (filter.type === 'eq') {
          conditions.push(`${filter.column} = ?`);
          params.push(sanitizeValue(filter.value));
        }
      });

      if (conditions.length === 0) {
        return { data: null, error: { message: 'No conditions specified for delete' } };
      }

      const query = `DELETE FROM ${this.tableName} WHERE ${conditions.join(' AND ')}`;
      const stmt = db.prepare(query);
      stmt.run(...params);

      return { data: null, error: null };
    } catch (error) {
      console.error(`Delete error on ${this.tableName}:`, error);
      return { data: null, error };
    }
  }

  then(onResolve, onReject) {
    return Promise.resolve(this.execute()).then(onResolve, onReject);
  }
}

/**
 * Database client that mimics Supabase API
 */
function createClient() {
  return {
    from(tableName) {
      return {
        select(columns = '*') {
          const builder = new QueryBuilder(tableName);
          builder.select(columns);
          return builder;
        },
        insert(records) {
          return new InsertBuilder(tableName, records);
        },
        update(updates) {
          return new UpdateBuilder(tableName, updates);
        },
        delete() {
          return new DeleteBuilder(tableName);
        },
      };
    },
    async rpc(functionName) {
      try {
        if (functionName === 'generate_order_number') {
          const stmt = db.prepare('SELECT COUNT(*) as count FROM orders');
          const result = stmt.get();
          const orderNum = result.count + 1000;
          return { data: `#TAZ${orderNum}`, error: null };
        }
        if (functionName === 'generate_otp') {
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          return { data: otp, error: null };
        }
        return { data: null, error: { message: 'RPC function not found' } };
      } catch (error) {
        return { data: null, error };
      }
    },
  };
}

// Create database client instances
const supabase = createClient();
const supabaseAdmin = createClient();

export { supabase, supabaseAdmin };
export default supabase;

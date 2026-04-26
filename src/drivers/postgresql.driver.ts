import type { DatabaseDriverResult, IDatabaseDriver } from "../core/db.js";
import type { ClientConfig } from "pg";
import { Client } from "pg";

export class PostgreSqlDriver implements IDatabaseDriver {

  private connection: Client | null = null;
  private connectionConfig: string | ClientConfig;

  constructor(connectionConfig: string | ClientConfig) {
    this.connectionConfig = connectionConfig;
  }

  private getWhereClause(conditions?: Record<string, unknown>, startIndex = 1): string {
    if(!conditions || Object.keys(conditions).length === 0) return '';
    const whereCondition = Object.keys(conditions)
      .map((key, index) => `${key} = ${this.getNumberedPlaceholder(startIndex + index)}`)
      .join(' AND ');
    return ` WHERE ${whereCondition}`;
  }

  private getLimitOffset(limit?: number, offset?: number): string {
      const parts: string[] = [];
    if (limit !== undefined && limit !== null) {
      parts.push(`LIMIT ${limit}`);
    }
    if (offset !== undefined && offset !== null) {
      parts.push(`OFFSET ${offset}`);
    }
    return parts.length > 0 ? ` ${parts.join(' ')}` : '';
  }

  async connect(): Promise<void> {
    if(this.connection) return;

    this.connection = typeof this.connectionConfig === "string" ? new Client({ connectionString: this.connectionConfig}) : new Client(this.connectionConfig)

    await this.connection.connect();
  }

  async disconnect(): Promise<void> {
    if(!this.connection) return;

    await this.connection.end();
    this.connection = null;
  }

  async execute(query: string, params?: any[]): Promise<DatabaseDriverResult> {
    if(!this.connection) throw new Error("Not connected to the database");

    const result = await this.connection.query(query, params);

    console.log(`[QUERY]: ${query}\n[PARAM]: ${params}`)

    if(result.rows.length > 0) {
      const dbResult: DatabaseDriverResult = {
        rows: result.rows,
        affectedRows: 0
      }
      console.log(dbResult)
      return dbResult;
    }

    const dbResult: DatabaseDriverResult = {
      affectedRows: result.rowCount ?? 0
    }

    console.log(dbResult)
    return dbResult;
  }

  getPlaceholderPrefix(): string {
    return '$';
  }

  getNumberedPlaceholder(index: number): string {
    return `${this.getPlaceholderPrefix()}${index}`;
  }

  getInsertQuery(tableName: string, columns: string[]): string {
    const placeholders = columns.map((_, i) => this.getNumberedPlaceholder(i + 1)).join(', ')
    return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING id`
  }

  getUpsertQuery(tableName: string, columns: string[], conflictColumns?: string[]): string {
    const placeholders = columns.map((_, i) => this.getNumberedPlaceholder(i + 1)).join(', ');
    const resolvedConflictColumns = conflictColumns?.filter(Boolean) ?? [];

    if (resolvedConflictColumns.length === 0) {
      return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING id`;
    }

    const conflictedColumns = resolvedConflictColumns.join(', ');
    const updateColumns = columns.filter(
      column => !resolvedConflictColumns.includes(column) && column !== 'created_at'
    );
    const updateClause = updateColumns.length <= 0
      ? `DO NOTHING`
      : `DO UPDATE SET ${updateColumns.map(column => `${column} = EXCLUDED.${column}`).join(', ')}`;

    return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT (${conflictedColumns}) ${updateClause} RETURNING id`;
  }

  getUpdateQuery(tableName: string, columns: string[], conditions: Record<string, unknown>): string {
    const updateColums = columns.map((key, index) => `${key} = ${this.getNumberedPlaceholder(index + 1)}`).join(', ');
    return `UPDATE ${tableName} SET ${updateColums}${this.getWhereClause(conditions, columns.length + 1)}`;
  }

  getDeleteQuery(tableName: string, conditions: Record<string, unknown>, limit?: number, offset?: number): string {
     const whereClause = this.getWhereClause(conditions);

    if(limit === undefined || offset === undefined) {
      `DELETE FROM ${tableName}${whereClause}`
    }

    const scopedSelect = [`SELECT ctid FROM ${tableName}${whereClause}`];
    if(limit !== undefined) {
      scopedSelect.push(`LIMIT ${limit}`);
    }
    if(offset !== undefined) [
      scopedSelect.push(`OFFSET ${offset}`)
    ]
    return `DELETE FROM ${tableName} WHERE ctid IN (${scopedSelect.join(' ')})`;
  }

  getSelectQuery(tableName: string, columns: string[], conditions?: Record<string, unknown>, limit?: number, offset?: number): string {
    return `SELECT ${columns.join(', ')} FROM ${tableName}${this.getWhereClause(conditions)}${this.getLimitOffset(limit, offset)}`;
  }

  getCountQuery(tableName: string, conditions?: Record<string, unknown>): string {
    return `SELECT COUNT(*) AS count FROM ${tableName}${this.getWhereClause(conditions)}`;
  }
  
}
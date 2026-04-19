import type { IDatabaseDriver } from "../core/db.js";
import type { ClientConfig } from "pg";
import { Client } from "pg";

interface PostgreSqlDriverResult {
  rows?: Record<string, unknown>[],
  affectedRows: number,
  insertId?: number,
  info?: string
}

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

  async execute(query: string, params?: any[]): Promise<any> {
    if(!this.connection) throw new Error("Not connected to the database");

    const result = await this.connection.query(query, params);
    console.log(result)

    /* IN PROGRESS... */

    return result;
  }

  getPlaceholderPrefix(): string {
    return '$';
  }

  getNumberedPlaceholder(index: number): string {
    return `${this.getPlaceholderPrefix()}${index}`;
  }

  getInsertQuery(tableName: string, columns: string[]): string {
    const placeholders = columns.map((k, i) => this.getNumberedPlaceholder(i + 1)).join(', ')
    return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})  RETURNING id`
  }

  getUpsertQuery(tableName: string, columns: string[], conflictColums: string[]): string {
    const placeholders = columns.map((k, i) => this.getNumberedPlaceholder(i + 1)).join(', ')
    const conflictColumns = conflictColums.join(', ')
    const updateColumns = columns.filter(column => !conflictColums.includes(column));
    const updateClause = updateColumns.length <= 0
      ? `DO NOTHING`
      : `DO UPDATE SET ${updateColumns.map(column => `${column} = EXCLUDED.${column}`).join(', ')}`;
    return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT (${conflictColumns}) ${updateClause}`
  }

  getUpdateQuery(tableName: string, columns: string[], conditions: Record<string, unknown>): string {
    const updateColums = columns.map((key, index) => `${key} = ${this.getNumberedPlaceholder(index + 1)}`).join(', ');
    return `UPDATE ${tableName} SET ${updateColums}${this.getWhereClause(conditions, columns.length + 1)}`;
  }

  getDeleteQuery(tableName: string, conditions: Record<string, unknown>, limit?: number, offset?: number): string {
    return `DELETE FROM ${tableName}${this.getWhereClause(conditions)}${this.getLimitOffset(limit, offset)}`;
  }

  getSelectQuery(tableName: string, columns: string[], conditions?: Record<string, unknown>, limit?: number, offset?: number): string {
    return `SELECT ${columns.join(', ')} FROM ${tableName}${this.getWhereClause(conditions)}${this.getLimitOffset(limit, offset)}`;
  }

  getCountQuery(tableName: string, conditions?: Record<string, unknown>): string {
    return `SELECT COUNT(*) AS count FROM ${tableName}${this.getWhereClause(conditions)}`;
  }
  
}
import mysql from "mysql2/promise"
import type { Connection, ConnectionOptions } from "mysql2/promise";
import type { DatabaseDriverResult, IDatabaseDriver } from "../core/db.js";
import { createConnection } from "mysql2/promise";

export class MySqlDriver implements IDatabaseDriver  {

  private connection: Connection | null = null;
  private connectionConfig: string | ConnectionOptions;

  private getWhereClause(conditions?: Record<string, unknown>): string {
    if(!conditions || Object.keys(conditions).length === 0) return '';
    const whereCondition = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
    return ` WHERE ${whereCondition}`;
  }

  private getLimitOffset(limit?: number, offset?: number): string {
    if(!limit) return '';
    if(!offset) return ` LIMIT ${limit}`;
    return ` LIMIT ${limit} OFFSET ${offset}`;
  }

  constructor(connectionConfig: string | ConnectionOptions) {
    this.connectionConfig = connectionConfig;
  }

  async connect(): Promise<void> {
    if(this.connection) return;
    
    this.connection = await (typeof this.connectionConfig === "string" ? createConnection(this.connectionConfig) : createConnection(this.connectionConfig))
  }
  
  async disconnect(): Promise<void> {
    if(!this.connection) return;

    await this.connection.end();
    this.connection = null;
  }

  async execute(query: string, params?: any[]): Promise<DatabaseDriverResult> {
    if(!this.connection) throw new Error("Not connected to the database");

    const [result] = await this.connection.execute(query, params);

    if(Array.isArray(result)) {
      const dbResult: DatabaseDriverResult = {
        rows: result as Record<string, unknown>[],
        affectedRows: 0
      }
      return dbResult
    }
    
    const dbResult: DatabaseDriverResult = {
      affectedRows: result.affectedRows
    }

    if(result.insertId > 0) {
      dbResult.insertedId = result.insertId;
    }

    if("info" in result && result.info.trim() !== "") {
      dbResult.info = result.info;
    }
    return result;
  }

  getPlaceholderPrefix(): string {
    return '?';
  }

  getInsertQuery(tableName: string, columns: string[]): string {
    const placeholders = columns.map(() => this.getPlaceholderPrefix()).join(', ');
    return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`
  }

  getUpsertQuery(tableName: string, columns: string[]): string {
    const placeholders = columns.map(() => this.getPlaceholderPrefix()).join(', ');
    const update = columns
      .filter(column => column !== 'id')
      .map(columns => `${columns} = VALUES(${columns})`)
      .join(', ')
    return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${update}`
  }

  getUpdateQuery(tableName: string, columns: string[], conditions: Record<string, unknown>): string {
    const updateColums = columns.map(key => `${key} = ?`).join(', ');
    return `UPDATE ${tableName} SET ${updateColums}${this.getWhereClause(conditions)}`;
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
import type { Connection, ConnectionOptions } from "mysql2/promise";
import type { DatabaseDriverResult, IDatabaseDriver } from "../core/db.js";
import type { Condition } from "../core/expression.js";
import { createConnection } from "mysql2/promise";

export class MySqlDriver implements IDatabaseDriver  {

  private connection: Connection | null = null;
  private connectionConfig: string | ConnectionOptions;

  private escapeIdentifier(identifier: string): string {
    if (!identifier || typeof identifier !== "string") {
      throw new Error("Identifier must be a non-empty string");
    }

    return `\`${identifier.replace(/`/g, "``")}\``;
  }

  private escapeTableName(tableName: string): string {
    return this.escapeIdentifier(tableName)
  }

  private escapeColumnName(columnName: string): string {
    if(columnName === '*') return "*"
    return this.escapeIdentifier(columnName)
  }

  private getWhereClause(conditions?: Condition): string {
    if (!conditions || Object.keys(conditions).length === 0) {
      return ""
    }

    const predicates = Object.entries(conditions).map(([column, expression]) => {
      const safeColumn = this.escapeColumnName(column);
      const value = expression.value;

      switch (expression.op) {
        case "equal":
          if (value === null) {
            return `${safeColumn} IS NULL`;
          }
          return `${safeColumn} = ${this.getPlaceholderPrefix()}`;

        case "notEqual":
          if (value === null) {
            return `${safeColumn} IS NOT NULL`;
          }
          return `${safeColumn} != ${this.getPlaceholderPrefix()}`;

        case "greaterThan":
          return `${safeColumn} > ${this.getPlaceholderPrefix()}`;

        case "lessThan":
          return `${safeColumn} < ${this.getPlaceholderPrefix()}`;

        case "greaterThanOrEqual":
          return `${safeColumn} >= ${this.getPlaceholderPrefix()}`;

        case "lessThanOrEqual":
          return `${safeColumn} <= ${this.getPlaceholderPrefix()}`;

        case "startsWith":
          return `${safeColumn} LIKE ${this.getPlaceholderPrefix()}%`;

        case "endsWith":
          return `${safeColumn} LIKE %${this.getPlaceholderPrefix()}`;

        case "contains":
          return `${safeColumn} LIKE %${this.getPlaceholderPrefix()}%`;
      }
    });

    return ` WHERE ${predicates.join(" AND ")}`;
  }

  private getLimitOffset(limit?: number, offset?: number): string {
    if(limit === undefined || limit === null) return '';
    if(offset === undefined || offset === null) return ` LIMIT ${limit}`;
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
    return dbResult;
  }

  getPlaceholderPrefix(): string {
    return '?';
  }

  getInsertQuery(tableName: string, columns: string[]): string {
    const escapedTableName = this.escapeTableName(tableName);
    const escapedColumns = columns.map((column) => this.escapeColumnName(column)).join(', ');
    const placeholders = columns.map(() => this.getPlaceholderPrefix()).join(', ');
    return `INSERT INTO ${escapedTableName} (${escapedColumns}) VALUES (${placeholders})`
  }

  getUpsertQuery(tableName: string, columns: string[]): string {
    const escapedTableName = this.escapeTableName(tableName);
    const escapedColumns = columns.map((column) => this.escapeColumnName(column));
    const placeholders = columns.map(() => this.getPlaceholderPrefix()).join(', ');
    const update = columns
      .filter(column => column !== 'id' && column !== 'created_at')
      .map((column) => {
        const safeColumn = this.escapeColumnName(column);
        return `${safeColumn} = VALUES(${safeColumn})`;
      })
      .join(', ')
    return `INSERT INTO ${escapedTableName} (${escapedColumns.join(', ')}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${update}`
  }

  getUpdateQuery(tableName: string, updates: Record<string, unknown>, conditions: Condition): string {
    const escapedTableName = this.escapeTableName(tableName);
    const updatePairs = Object.entries(updates).map(([column]) =>
      `${this.escapeColumnName(column)} = ?`
    ).join(', ');
    return `UPDATE ${escapedTableName} SET ${updatePairs}${this.getWhereClause(conditions)}`;
  }

  getDeleteQuery(tableName: string, conditions: Condition, limit?: number, offset?: number): string {
    const escapedTableName = this.escapeTableName(tableName);
    return `DELETE FROM ${escapedTableName}${this.getWhereClause(conditions)}${this.getLimitOffset(limit, offset)}`;
  }

  getSelectQuery(tableName: string, columns: string[], conditions?: Condition, limit?: number, offset?: number): string {
    const escapedTableName = this.escapeTableName(tableName);
    const escapedColumns = columns.map((column) => this.escapeColumnName(column)).join(', ');
    return `SELECT ${escapedColumns} FROM ${escapedTableName}${this.getWhereClause(conditions)}${this.getLimitOffset(limit, offset)}`;
  }

  getCountQuery(tableName: string, conditions?: Condition): string {
    const escapedTableName = this.escapeTableName(tableName);
    return `SELECT COUNT(*) AS count FROM ${escapedTableName}${this.getWhereClause(conditions)}`;
  }
}
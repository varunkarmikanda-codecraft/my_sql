import type { Connection, ConnectionOptions } from "mysql2/promise";
import type { DatabaseDriverResult, IDatabaseDriver, QueryData } from "../core/db.js";
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

  private getWhereClause(conditions?: Condition): { whereClause: string, params: unknown[]} {
    if (!conditions || Object.keys(conditions).length === 0) {
      return {
        whereClause: "",
        params: []
      }
    }
    const params: unknown[] = [];

    const predicates = Object.entries(conditions).map(([column, expression]) => {
      const escapedColumn = this.escapeColumnName(column);
      const value = expression.value;

      switch (expression.op) {
        case "equal":
          if (value === null) {
            return `${escapedColumn} IS NULL`;
          }
          params.push(value)
          return `${escapedColumn} = ${this.getPlaceholderPrefix()}`;

        case "notEqual":
          if (value === null) {
            return `${escapedColumn} IS NOT NULL`;
          }
          params.push(value)
          return `${escapedColumn} != ${this.getPlaceholderPrefix()}`;

        case "greaterThan":
          params.push(value)
          return `${escapedColumn} > ${this.getPlaceholderPrefix()}`;

        case "lessThan":
          params.push(value)
          return `${escapedColumn} < ${this.getPlaceholderPrefix()}`;

        case "greaterThanOrEqual":
          params.push(value)
          return `${escapedColumn} >= ${this.getPlaceholderPrefix()}`;

        case "lessThanOrEqual":
          params.push(value)
          return `${escapedColumn} <= ${this.getPlaceholderPrefix()}`;

        case "startsWith":
          params.push(`${value}%`)
          return `${escapedColumn} LIKE ${this.getPlaceholderPrefix()}`;
          
          case "endsWith":
          params.push(`%${value}`)
          return `${escapedColumn} LIKE ${this.getPlaceholderPrefix()}`;
          
          case "contains":
          params.push(`%${value}%`)
          return `${escapedColumn} LIKE ${this.getPlaceholderPrefix()}`;
      }
    });

    return {
      whereClause: ` WHERE ${predicates.join(" AND ")}`,
      params
    }
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

  getInsertQuery(tableName: string, values: Record<string, unknown>): QueryData {
    const escapedTableName = this.escapeTableName(tableName);
    const columns = Object.keys(values);
    const data = Object.values(values);
    const escapedColumns = columns.map((column) => this.escapeColumnName(column)).join(', ');
    const placeholders = columns.map(() => this.getPlaceholderPrefix()).join(', ');
    return {
      sql: `INSERT INTO ${escapedTableName} (${escapedColumns}) VALUES (${placeholders})`,
      params: data
    }
  }

  getUpsertQuery(tableName: string, values: Record<string, unknown>): QueryData {
    const escapedTableName = this.escapeTableName(tableName);
    const columns = Object.keys(values);
    const data = Object.values(values);
    const escapedColumns = columns.map((column) => this.escapeColumnName(column));
    const placeholders = columns.map(() => this.getPlaceholderPrefix()).join(', ');
    const update = columns
      .filter(column => column !== 'id' && column !== 'created_at')
      .map((column) => {
        const escapedColumn = this.escapeColumnName(column);
        return `${escapedColumn} = VALUES(${escapedColumn})`;
      })
      .join(', ')
    return {
      sql: `INSERT INTO ${escapedTableName} (${escapedColumns.join(', ')}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${update}`,
      params: data
    }
  }

  getUpdateQuery(tableName: string, updates: Record<string, unknown>, conditions: Condition): QueryData {
    const escapedTableName = this.escapeTableName(tableName);
    const updatePairs = Object.entries(updates).map(([column]) =>
      `${this.escapeColumnName(column)} = ?`
    ).join(', ');
    const { whereClause, params } = this.getWhereClause(conditions);
    return {
      sql: `UPDATE ${escapedTableName} SET ${updatePairs}${whereClause}`,
      params: [...Object.values(updates), ...params]
    };
  }

  getDeleteQuery(tableName: string, conditions: Condition, limit?: number, offset?: number): QueryData {
    const escapedTableName = this.escapeTableName(tableName);
    const { whereClause, params } = this.getWhereClause(conditions);
    return {
      sql: `DELETE FROM ${escapedTableName}${whereClause}${this.getLimitOffset(limit, offset)}`,
      params: params
    };
  }

  getSelectQuery(tableName: string, columns: string[], conditions?: Condition, limit?: number, offset?: number): QueryData {
    const escapedTableName = this.escapeTableName(tableName);
    const escapedColumns = columns.map((column) => this.escapeColumnName(column)).join(', ');
    const { whereClause, params } = this.getWhereClause(conditions);
    return {
      sql: `SELECT ${escapedColumns} FROM ${escapedTableName}${whereClause}${this.getLimitOffset(limit, offset)}`,
      params: params
    };
  }

  getCountQuery(tableName: string, conditions?: Condition): QueryData {
    const escapedTableName = this.escapeTableName(tableName);
    const { whereClause, params } = this.getWhereClause(conditions);
    return {
      sql: `SELECT COUNT(*) AS count FROM ${escapedTableName}${whereClause}`,
      params: params
    };
  }
}
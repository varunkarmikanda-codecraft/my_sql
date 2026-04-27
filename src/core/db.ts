import type { Condition } from "./expression.js";

export interface DatabaseDriverResult {
  rows?: Record<string, unknown>[],
  affectedRows: number,
  insertedId?: number,
  info?: string
}

export interface QueryData {
  sql: string;
  params: unknown[];
}

export interface IDatabaseDriver {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  execute(query: string, params?: any[]): Promise<DatabaseDriverResult>;
  getConditionParams?(conditions?: Condition): unknown[];

  getPlaceholderPrefix(): string ;
  getInsertQuery(tableName: string, values: Record<string, unknown>): QueryData;
  getUpsertQuery(tableName: string, values: Record<string, unknown>, conflictColumns?: string[]): QueryData;
  getUpdateQuery(tableName: string, updates: Record<string, unknown>, conditions: Condition): QueryData;
  getDeleteQuery(tableName: string, conditions: Condition, limit?: number, offset?: number): QueryData;
  getSelectQuery(tableName: string, columns: string[], conditions?: Condition, limit?: number, offset?: number): QueryData;
  getCountQuery(tableName: string, conditions?: Condition): QueryData;
}

export class DB {
  private static instance: IDatabaseDriver;
  
  static setDriver(driver: IDatabaseDriver) {
    this.instance = driver;
  }

  static get driver(): IDatabaseDriver {
    if(!this.instance) {
      throw new Error("Database driver not set!")
    }
    return this.instance;
  }
}
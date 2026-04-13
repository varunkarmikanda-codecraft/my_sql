import type { IDatabaseDriver } from "./idatabase-driver.js";

export class MySqlDriver implements IDatabaseDriver {
  connect(): Promise<void> {
    // console.log("[SIMULATING]: Connecting to MySQL database...");
    return Promise.resolve();
  }
  disconnect(): Promise<void> {
    // console.log("[SIMULATING]: Disconnecting from MySQL database...");
    return Promise.resolve();
  }
  execute(query: string, params?: any[]): Promise<any> {
    console.log(`[SIMULATING]: Executing query...\n${query}\n${params}`);
    return Promise.resolve();
  }

  getPlaceholderPrefix(): string {
    return '?';
  }
  getInsertQuery(tableName: string, columns: string[]): string {
    const placeholders = columns.map(() => this.getPlaceholderPrefix()).join(', ');
    return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`
  }
  getUpdateQuery(tableName: string, columns: string[], conditions: Record<string, unknown>): string {
    return ``;
  }
  getDeleteQuery(tableName: string, conditions: Record<string, unknown>, limit?: number, offset?: number): string {
    return ``;
    
  }
  getSelectQuery(tableName: string, columns: string[], conditions?: Record<string, unknown>, limit?: number, offset?: number): string {
    let findConditions = ``;
    if(conditions && Object.keys(conditions).length > 0) {
      const mappedConditions = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ')
      findConditions += ` WHERE ${mappedConditions}`;
    }
    if(limit) findConditions += ` LIMIT ${limit}`;
    if(offset) findConditions += ` OFFSET ${offset}`;
    return `SELECT ${columns.join(', ')} FROM ${tableName}${findConditions}`;
    
  }
  getCountQuery(tableName: string, conditions?: Record<string, unknown>): string {
    return ``;
    
  }

}
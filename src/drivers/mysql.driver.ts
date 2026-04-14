import mysql from "mysql2/promise"
import type { Connection } from "mysql2/promise";
import type { IDatabaseDriver } from "../core/db.js";

export class MySqlDriver implements IDatabaseDriver  {

  private connection: Connection | null = null;

  async connect(): Promise<void> {
    try {
      this.connection = await mysql.createConnection({
        host: process.env.DB_HOST ||  'localhost',
        user: process.env.DB_USER || 'groot',
        password: process.env.DB_PASSWORD || 'groot123',
        database: process.env.DB_NAME || 'my_sql'
      });
      console.log("Connected to MySQL..")
    } catch (error) {
      this.connection = null;
      console.error("Failed to connect to MySQL:", error);
      throw error;
    }
    return Promise.resolve();
  }
  async disconnect(): Promise<void> {
    try {
      if (this.connection) {
        await this.connection.end();
        console.log("Disconnected from MySQL..")
      }
    } catch (error) {
      console.error("Error during MySQL disconnection:", error);
    } finally {
      this.connection = null; // Ensure state is reset regardless
    }
  }
  execute(query: string, params?: any[]): Promise<any> {
    console.log(`[SIMULATING]: Executing query...\n${query}\n\n${params}`);
    return Promise.resolve([]);
  }

  getPlaceholderPrefix(): string {
    return '?';
  }
  getInsertQuery(tableName: string, columns: string[]): string {
    const placeholders = columns.map(() => this.getPlaceholderPrefix()).join(', ');
    const update = columns
      .filter(column => column !== 'id')
      .map(columns => `${columns} = VALUES(${columns})`)
      .join(', ')
    return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${update}`
  }
  getUpdateQuery(tableName: string, columns: string[], conditions: Record<string, unknown>): string {
    const updateColums = columns.map(key => `${key} = ?`).join(', ');
    let updateCondition = '';
    if(Object.keys(conditions).length > 0) {
      const mappedConditions = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
      updateCondition = ` WHERE ${mappedConditions}`;
    }
    return `UPDATE ${tableName} SET ${updateColums}${updateCondition}`;
  }
  getDeleteQuery(tableName: string, conditions: Record<string, unknown>, limit?: number, offset?: number): string {
    let deleteConditions = ''
    if(Object.keys(conditions).length > 0) {
      const mappedConditions = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ')
      deleteConditions = ` WHERE ${mappedConditions}`;
    }
    if(limit) {
      deleteConditions += ` LIMIT ${limit}`;
      if(offset) {
        deleteConditions += ` OFFSET ${offset}`;
      }
    }
    return `DELETE FROM ${tableName}${deleteConditions}`;
    
  }
  getSelectQuery(tableName: string, columns: string[], conditions?: Record<string, unknown>, limit?: number, offset?: number): string {
    let findConditions = ``;
    if(conditions && Object.keys(conditions).length > 0) {
      const mappedConditions = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ')
      findConditions += ` WHERE ${mappedConditions}`;
    }
    if(limit){ 
      findConditions += ` LIMIT ${limit}`;
      if(offset) findConditions += ` OFFSET ${offset}`;
    }
    return `SELECT ${columns.join(', ')} FROM ${tableName}${findConditions}`;
    
  }
  getCountQuery(tableName: string, conditions?: Record<string, unknown>): string {
    let countConditions = ''
    if(conditions && Object.keys(conditions).length > 0) {
      const mappedConditions = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
      countConditions = ` WHERE ${mappedConditions}`
    }
    return `SELECT COUNT(*) AS count FROM ${tableName}${countConditions}`;
  }

}
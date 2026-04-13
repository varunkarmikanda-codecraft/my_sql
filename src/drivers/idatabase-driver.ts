export interface IDatabaseDriver {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  execute(query: string, params?: any[]): Promise<any>;

  getPlaceholderPrefix(): string ;
  getInsertQuery(tableName: string, columns: string[]): string;
  getUpdateQuery(tableName: string, columns: string[], conditions: Record<string, unknown>): string;
  getDeleteQuery(tableName: string, conditions: Record<string, unknown>, limit?: number, offset?: number): string;
  getSelectQuery(tableName: string, columns: string[], conditions?: Record<string, unknown>, limit?: number, offset?: number): string;
  getCountQuery(tableName: string, conditions?: Record<string, unknown>): string;
}
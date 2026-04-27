// import type { DatabaseDriverResult, IDatabaseDriver } from "../core/db.js";
// import type { ClientConfig } from "pg";
// import { Client } from "pg";
// import type { Condition } from "../core/expression.js";

// export class PostgreSqlDriver implements IDatabaseDriver {

//   private connection: Client | null = null;
//   private connectionConfig: string | ClientConfig;

//   constructor(connectionConfig: string | ClientConfig) {
//     this.connectionConfig = connectionConfig;
//   }

//   private escapeIdentifier(identifier: string): string {
//     return `\"${identifier.replace(/"/g, '""')}\"`;
//   }

//   private escapeTableName(tableName: string): string {
//     return this.escapeIdentifier(tableName);
//   }

//   private escapeColumnName(columnName: string): string {
//     return this.escapeIdentifier(columnName);
//   }

//   private getWhereClause(conditions?: Condition): string {
//     if (!conditions || Object.keys(conditions).length === 0) {
//       return "";
//     }

//     const predicates = Object.entries(conditions).map(([column, expression]) => {
//       const safeColumn = this.escapeColumnName(column);
//       const raw = expression.value;

//       switch (expression.op) {
//         case "equal":
//           return raw === null
//             ? `${safeColumn} IS NULL`
//             : `${safeColumn} = ${this.serializeValue(raw)}`;

//         case "notEqual":
//           return raw === null
//             ? `${safeColumn} IS NOT NULL`
//             : `${safeColumn} != ${this.serializeValue(raw)}`;

//         case "greaterThan":
//           return `${safeColumn} > ${this.serializeValue(raw)}`;

//         case "lessThan":
//           return `${safeColumn} < ${this.serializeValue(raw)}`;

//         case "greaterThanOrEqual":
//           return `${safeColumn} >= ${this.serializeValue(raw)}`;

//         case "lessThanOrEqual":
//           return `${safeColumn} <= ${this.serializeValue(raw)}`;

//         case "startsWith":
//           return `${safeColumn} LIKE ${this.serializeValue(`raw%`)}`;

//         case "endsWith":
//           return `${safeColumn} LIKE ${this.serializeValue(`%raw`)}`;

//         case "contains":
//           return `${safeColumn} LIKE ${this.serializeValue(`%raw%`)}`;
//       }
//     });

//     return ` WHERE ${predicates.join(" AND ")}`;
//   }

//   private serializeValue(value: unknown): string {
//     if (value === null) {
//         return "NULL";
//     }

//     if (typeof value === "number") {
//         if (!Number.isFinite(value)) {
//             throw new Error(`Invalid numeric value: ${value}`);
//         }
//         return value.toString();
//     }

//     if (typeof value === "boolean") {
//         return value ? "TRUE" : "FALSE";
//     }

//     if (value instanceof Date) {
//         return `'${value.toISOString()}'`;
//     }

//     if (typeof value === "bigint") {
//         return value.toString();
//     }

//     const serialized = typeof value === "string" ? value : JSON.stringify(value);
//     return `'${serialized.replace(/'/g, "''")}'`;
//   } 

//   private getLimitOffset(limit?: number, offset?: number): string {
//       const parts: string[] = [];
//     if (limit !== undefined && limit !== null) {
//       parts.push(`LIMIT ${limit}`);
//     }
//     if (offset !== undefined && offset !== null) {
//       parts.push(`OFFSET ${offset}`);
//     }
//     return parts.length > 0 ? ` ${parts.join(' ')}` : '';
//   }

//   async connect(): Promise<void> {
//     if(this.connection) return;

//     this.connection = typeof this.connectionConfig === "string" ? new Client({ connectionString: this.connectionConfig}) : new Client(this.connectionConfig)

//     await this.connection.connect();
//   }

//   async disconnect(): Promise<void> {
//     if(!this.connection) return;

//     await this.connection.end();
//     this.connection = null;
//   }

//   async execute(query: string, params?: any[]): Promise<DatabaseDriverResult> {
//     if(!this.connection) throw new Error("Not connected to the database");

//     const result = await this.connection.query(query, params);

//     console.log(`[QUERY]: ${query}\n[PARAM]: ${params}`)

//     if(result.rows.length > 0) {
//       const dbResult: DatabaseDriverResult = {
//         rows: result.rows,
//         affectedRows: 0
//       }
//       console.log(dbResult)
//       return dbResult;
//     }

//     const dbResult: DatabaseDriverResult = {
//       affectedRows: result.rowCount ?? 0
//     }

//     console.log(dbResult)
//     return dbResult;
//   }

//   getPlaceholderPrefix(): string {
//     return '$';
//   }

//   getNumberedPlaceholder(index: number): string {
//     return `${this.getPlaceholderPrefix()}${index}`;
//   }

//   getInsertQuery(tableName: string, columns: string[]): string {
//     const placeholders = columns.map((_, i) => this.getNumberedPlaceholder(i + 1)).join(', ')
//     const escapedTableName = this.escapeTableName(tableName);
//     const escapedColumns = columns.map((column) => this.escapeColumnName(column)).join(', ');
//     return `INSERT INTO ${escapedTableName} (${escapedColumns}) VALUES (${placeholders}) RETURNING id`
//   }

//   getUpsertQuery(tableName: string, columns: string[], conflictColumns?: string[]): string {
//     const placeholders = columns.map((_, i) => this.getNumberedPlaceholder(i + 1)).join(', ');
//     const escapedTableName = this.escapeTableName(tableName);
//     const escapedColumns = columns.map((column) => this.escapeColumnName(column));
//     const resolvedConflictColumns = conflictColumns?.filter(Boolean) ?? [];
//     const escapedConflictColumns = resolvedConflictColumns.map((column) => this.escapeColumnName(column));

//     if (resolvedConflictColumns.length === 0) {
//       return `INSERT INTO ${escapedTableName} (${escapedColumns.join(', ')}) VALUES (${placeholders}) RETURNING id`;
//     }

//     const conflictedColumns = escapedConflictColumns.join(', ');
//     const updateColumns = columns.filter(
//       column => !resolvedConflictColumns.includes(column) && column !== 'created_at'
//     );
//     const updateClause = updateColumns.length <= 0
//       ? `DO NOTHING`
//       : `DO UPDATE SET ${updateColumns
//         .map((column) => {
//           const safeColumn = this.escapeColumnName(column);
//           return `${safeColumn} = EXCLUDED.${safeColumn}`;
//         })
//         .join(', ')}`;

//     return `INSERT INTO ${escapedTableName} (${escapedColumns.join(', ')}) VALUES (${placeholders}) ON CONFLICT (${conflictedColumns}) ${updateClause} RETURNING id`;
//   }

//   getUpdateQuery(tableName: string, updates: Record<string, unknown>, conditions: Condition): string {
//     const escapedTableName = this.escapeTableName(tableName);
//     const updatePairs = Object.entries(updates).map(([column, value]) =>
//     `${this.escapeColumnName(column)} = ${this.serializeValue(value)}`
//   ).join(', ');
//     return `UPDATE ${escapedTableName} SET ${updatePairs}${this.getWhereClause(conditions)}`;
//   }

//   getDeleteQuery(tableName: string, conditions: Condition, limit?: number, offset?: number): string {
//      const escapedTableName = this.escapeTableName(tableName);
//      const whereClause = this.getWhereClause(conditions);

//     if(limit === undefined || offset === undefined) {
//       return `DELETE FROM ${escapedTableName}${whereClause}`;
//     }

//     const scopedSelect = [`SELECT ctid FROM ${escapedTableName}${whereClause}`];
//     if(limit !== undefined) {
//       scopedSelect.push(`LIMIT ${limit}`);
//     }
//     if(offset !== undefined) [
//       scopedSelect.push(`OFFSET ${offset}`)
//     ]
//     return `DELETE FROM ${escapedTableName} WHERE ctid IN (${scopedSelect.join(' ')})`;
//   }

//   getSelectQuery(tableName: string, columns: string[], conditions?: Condition, limit?: number, offset?: number): string {
//     const escapedTableName = this.escapeTableName(tableName);
//     const escapedColumns = columns.map((column) => this.escapeColumnName(column)).join(', ');
//     return `SELECT ${escapedColumns} FROM ${escapedTableName}${this.getWhereClause(conditions)}${this.getLimitOffset(limit, offset)}`;
//   }

//   getCountQuery(tableName: string, conditions?: Condition): string {
//     const escapedTableName = this.escapeTableName(tableName);
//     return `SELECT COUNT(*) AS count FROM ${escapedTableName}${this.getWhereClause(conditions)}`;
//   }
  
// }
import { Column, COLUMN_METADATA_KEY, getColumnSqlName } from "./column.decorator.js";
import { DB } from "./db.js";
import type { Condition, Expression } from "./expression.js";
import { TABLE_METADATA_KEY } from "./table.decorator.js";

export interface IBaseEntity {
  id?: number | undefined;

  createdAt: Date;
  createdBy: number;
  updatedAt: Date;
  updatedBy: number;
}

export abstract class BaseEntity implements IBaseEntity {
  @Column()
  id?: number | undefined;

  @Column("created_at")
  createdAt: Date;
  @Column("created_by")
  createdBy: number;
  @Column("updated_at")
  updatedAt: Date;
  @Column("updated_by")
  updatedBy: number;

  constructor(entity: IBaseEntity) {
    this.id = entity.id;
    this.createdAt = entity.createdAt;
    this.createdBy = entity.createdBy;
    this.updatedAt = entity.updatedAt;
    this.updatedBy = entity.updatedBy;
  }

  private getTableName(): string {
    const ctor = this.constructor;
    return Reflect.getMetadata(TABLE_METADATA_KEY, ctor)
  }

  private static getTableName(ctor: Function): string {
    return Reflect.getMetadata(TABLE_METADATA_KEY, ctor);
  }

  private static whitelistAndMapDbColums(proto: object, conditions?: Condition): Condition {
    if (!conditions || Object.keys(conditions).length === 0) return {};

    return Object.entries(conditions).reduce((accumulator, [property, expression]) => {

      if (Reflect.getMetadata(COLUMN_METADATA_KEY, proto, property)) {
        const { dbColumnName } = getColumnSqlName(proto, property);
        return { ...accumulator, [dbColumnName]: expression };
      }

      return accumulator;
    }, {});
  }

  private static whitelistAndMapUpdateColumns(proto: object, updates?: Record<string, unknown>): Record<string, unknown> {
    if (!updates || Object.keys(updates).length === 0) return {};

    return Object.entries(updates).reduce((accumulator, [property, value]) => {
      if(Reflect.getMetadata(COLUMN_METADATA_KEY, proto, property)) {
        const { dbColumnName } = getColumnSqlName(proto, property);
        return { ...accumulator, [dbColumnName]: value }
      } 
      return accumulator
    }, {})
  }

  private getUpsertConflictColumns(columns: string[]): string[] {
    if (columns.includes("id")) return ["id"];
    if (columns.includes("email")) return ["email"];
    
    return [];
  }
  

  async save(): Promise<void> {
    const proto = Object.getPrototypeOf(this);

    const propertyValues = Object.keys(this).reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = (this as any)[key];
      return acc;
    }, {});

    const persistableValues = Object.entries(propertyValues).reduce<Record<string, unknown>>((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});

    const mappedValues = BaseEntity.whitelistAndMapUpdateColumns(proto, persistableValues);
    const columns = Object.keys(mappedValues);
    if (columns.length === 0) {
      throw new Error("Cannot save entity without any mapped columns");
    }


    const conflictColumns = this.getUpsertConflictColumns(columns);
    const {sql, params} = DB.driver.getUpsertQuery(this.getTableName(), mappedValues);
    const result = await DB.driver.execute(sql, params);

    const resolvedId = BaseEntity.resolveNumericId(result.insertedId ?? result.rows?.[0]?.id);

    if (resolvedId !== undefined) {
      this.id = resolvedId;
    }

    const returnedRow = result.rows?.[0];
    if (returnedRow) {
      this.hydrateFromRow(proto, returnedRow);
      return;
    }
  }

  static async findById<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T, id: number): Promise<T | null> {
    const result = await (this as any).findOne({ id: { op: "equal", value: id}});
    return result;
  }

  static async findAll<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T, conditions?: Condition, limit?: number, offset?: number): Promise<T[]> {
    const proto = this.prototype;
    const normalizedConditions = BaseEntity.whitelistAndMapDbColums(proto, conditions);
    const { sql, params } = DB.driver.getSelectQuery(BaseEntity.getTableName(this), ["*"], normalizedConditions, limit, offset);
    const result = await DB.driver.execute(sql, params);
    const rows = result.rows ?? [];

    return rows.map((row: Record<string, unknown>) => {
      const tempEntity = new this(row as I);

      const mapped = Object.keys(tempEntity).reduce<Record<string, unknown>>((acc, key) => {
        const { dbColumnName } = getColumnSqlName(proto, key);
        acc[key] = (dbColumnName in row ? row[dbColumnName] : (tempEntity as Record<string, unknown>)[key]);
        return acc;
      }, {});

      return new this(mapped as I);
    })  
  }

  static async findOne<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T , conditions: Condition): Promise<T | null> {
    const result = await (this as any).findAll(conditions)
    return result.length > 0 ? result[0] : null;
  }

  static async deleteById<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T, id: number): Promise<boolean> {
    return await (this as any).deleteOne({ id: { op: "equal", value: id}});
  }

  static async deleteAll<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T, conditions: Condition, limit?: number, offset?: number): Promise<number> {
    const proto = this.prototype;
    const normalizedConditions = BaseEntity.whitelistAndMapDbColums(proto, conditions);
    const { sql, params } = DB.driver.getDeleteQuery(BaseEntity.getTableName(this), normalizedConditions, limit, offset);
    const result = await DB.driver.execute(sql, params);
    return result.affectedRows;
  }

  static async deleteOne<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T, conditions: Condition): Promise<boolean> {
    const affectedRows = await (this as any).deleteAll(conditions, 1);
    return affectedRows > 0;
  }

  static async updateAll<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T, updates: Record<string, unknown>, conditions: Condition): Promise<number> {
    const proto = this.prototype;
    const normalizedUpdates = BaseEntity.whitelistAndMapUpdateColumns(proto, updates);
    const normalizedConditions = BaseEntity.whitelistAndMapDbColums(proto, conditions);
    const { sql, params } = DB.driver.getUpdateQuery(BaseEntity.getTableName(this), normalizedUpdates, normalizedConditions);
    const result = await DB.driver.execute(sql, params);
    return result.affectedRows;
  }

  static async updateById<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T, id: number, updates: Record<string, unknown>): Promise<boolean> {
    const affectedRows = await (this as any).updateAll(updates, { id: { op: "equal", value: id}});
    return affectedRows > 0;
  }

  static async count<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T, conditions?: Condition): Promise<number> {
    const proto = this.prototype;
    const normalizedConditions = conditions ? BaseEntity.whitelistAndMapDbColums(proto, conditions) : {};
    const { sql, params } = DB.driver.getCountQuery(BaseEntity.getTableName(this), normalizedConditions);
    const result = await DB.driver.execute(sql, params);
    const count = result.rows?.[0]?.count;
    return typeof count === "number" ? count : Number(count ?? 0);
  }

  private static resolveNumericId(value: unknown): number | undefined {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
      return Number(value);
    }
    return undefined;
  }
  
  private hydrateFromRow(prototype: object, row: Record<string, unknown>): void {
    const propertyToColumn = Object.keys(this).reduce<Record<string, string>>((acc, propertyName) => {
      const metadata = getColumnSqlName(prototype, propertyName);
      if (metadata.dbColumnName) {
        acc[metadata.dbColumnName] = propertyName;
      }
      return acc;
    }, {});

    for (const [columnName, value] of Object.entries(row)) {
      const propertyName = propertyToColumn[columnName] ?? columnName;
      if (propertyName in this) {
        (this as Record<string, unknown>)[propertyName] = value;
      }
    }
  }

}

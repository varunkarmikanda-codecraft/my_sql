import { Column, getColumnSqlName } from "./column.decorator.js";
import { DB } from "./db.js";
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

  static getTableName(): string {
    return Reflect.getMetadata(TABLE_METADATA_KEY, this);
  }

  async save(): Promise<void> {
    const ctor = this.constructor;
    const proto = Object.getPrototypeOf(this);
    const keys = Object.keys(this);
    const columnMetaData = keys.map(key => getColumnSqlName(proto, key)).filter(metadata => metadata.dbColumnName);
    const values = columnMetaData.map(column => (this as any)[column.propertyName])
    const columns = columnMetaData.map(column => column.dbColumnName)
    const query = DB.driver.getInsertQuery(Reflect.getMetadata(TABLE_METADATA_KEY, ctor), columns)
    await DB.driver.execute(query, values);
  }

  static async findById<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T, id: number): Promise<T | null> {
    const result = await (this as any).findOne({ id })
    return result;
  }

  static async findAll<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T, conditions?: Record<string, unknown>, limit?: number, offset?: number): Promise<T[]> {

    const query = DB.driver.getSelectQuery(Reflect.getMetadata(TABLE_METADATA_KEY, this), ["*"], conditions, limit, offset);
    const result = await DB.driver.execute(query);
    // return result.map((row: any) => new this(row))
    return []
  }

  static async findOne<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T , conditions: Partial<I>): Promise<T | null> {
    const result = await (this as any).findAll(conditions)
    return result.length > 0 ? result[0] : null;
  }

  static async deleteById<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T, id: number): Promise<boolean> {
    return await (this as any).deleteOne({ id });
  }

  static async deleteAll<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T, conditions: Record<string, unknown>, limit?: number, offset?: number): Promise<number> {
    const query = DB.driver.getDeleteQuery(Reflect.getMetadata(TABLE_METADATA_KEY, this), conditions, limit, offset);
    const result = await DB.driver.execute(query);
    // return result.affectedRows;
    return 0
  }

  static async deleteOne<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T, conditions: Record<string, unknown>): Promise<boolean> {
    const affectedRows = await (this as any).deleteAll(conditions, 1);
    return affectedRows > 0;
  }

  static async updateAll<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T, updates: Record<string, unknown>, conditions: Record<string, unknown>): Promise<number> {
    const query = DB.driver.getUpdateQuery(Reflect.getMetadata(TABLE_METADATA_KEY, this), Object.keys(updates), conditions);
    const params = [...Object.values(updates), ...Object.values(conditions)];
    const result = await DB.driver.execute(query, params);
    // return result.affectedRows;
    return 0;
  }

  static async updateById<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T, id: number, updates: Record<string, unknown>): Promise<boolean> {
    const affectedRows = await (this as any).updateAll(updates, { id });
    return affectedRows > 0;
  }

  static async count<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T, conditions?: Record<string, unknown>): Promise<number> {
    const query = DB.driver.getCountQuery(Reflect.getMetadata(TABLE_METADATA_KEY, this), conditions);
    const result = await DB.driver.execute(query);
    // return result[0].count;
    return 0;
  }
  
}

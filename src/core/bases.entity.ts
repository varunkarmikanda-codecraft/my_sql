import { Column, COLUMN_METADATA_KEY, getColumnSqlName } from "./column.decorator.js";
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

  private getTableName(): string {
    const ctor = this.constructor;
    return Reflect.getMetadata(TABLE_METADATA_KEY, ctor)
  }

  private static getTableName(ctor: Function): string {
    return Reflect.getMetadata(TABLE_METADATA_KEY, ctor);
  }

  private static whitelistAndMapDbColums(proto: object, conditions?:Record<string, unknown>): Record<string, unknown> {
    const mapAndWhiteList: Record<string, unknown> = {}
    if(conditions && Object.keys(conditions).length > 0){
      Object.entries(conditions).map(([property, value]) => {
        if(Reflect.getMetadata(COLUMN_METADATA_KEY, proto, property)) {
          const { dbColumnName } = getColumnSqlName(proto, property);
          mapAndWhiteList[dbColumnName] = value;
        }
      })
    }
    return mapAndWhiteList;
  }
  

  async save(): Promise<void> {
    const ctor = this.constructor;
    const proto = Object.getPrototypeOf(this);
    const columnMetaData = Object.keys(this).filter(key => Reflect.hasMetadata(COLUMN_METADATA_KEY, proto, key)).filter(key => (this as any)[key] !== undefined).map(key => getColumnSqlName(proto, key))
    const values = columnMetaData.map(column => (this as any)[column.propertyName])
    const columns = columnMetaData.map(column => column.dbColumnName)
    const query = DB.driver.getUpsertQuery(this.getTableName(), columns, ["id"]);
    await DB.driver.execute(query, values);
  }

  static async findById<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T, id: number): Promise<T | null> {
    const result = await (this as any).findOne({ id })
    return result;
  }

  static async findAll<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T, conditions?: Partial<I>, limit?: number, offset?: number): Promise<T[]> {
    const proto = this.prototype;
    const normalizedConditions = BaseEntity.whitelistAndMapDbColums(proto, conditions);
    const values = Object.values(normalizedConditions);
    const query = DB.driver.getSelectQuery(BaseEntity.getTableName(this), ["*"], normalizedConditions, limit, offset) as string;
    const result = await DB.driver.execute(query, values);

    return result.rows.map((row: Record<string, unknown>) => {
      const tempEntity = new this(row as I);

      const mapped = Object.keys(tempEntity).reduce<Record<string, unknown>>((acc, key) => {
        const { dbColumnName } = getColumnSqlName(proto, key);
        acc[key] = (dbColumnName in row ? row[dbColumnName] : (tempEntity as Record<string, unknown>)[key]);
        return acc;
      }, {});

      return new this(mapped as I);
    })  
  }

  static async findOne<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T , conditions: Partial<I>): Promise<T | null> {
    const result = await (this as any).findAll(conditions)
    return result.length > 0 ? result[0] : null;
  }

  static async deleteById<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T, id: number): Promise<boolean> {
    return await (this as any).deleteOne({ id });
  }

  static async deleteAll<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T, conditions: Partial<I>, limit?: number, offset?: number): Promise<number> {
    const proto = this.prototype;
    const normalizedConditions = BaseEntity.whitelistAndMapDbColums(proto, conditions);
    const values = Object.values(normalizedConditions);
    const query = DB.driver.getDeleteQuery(BaseEntity.getTableName(this), normalizedConditions, limit, offset) as string;
    const result = await DB.driver.execute(query, values);
    return result.affectedRows;
  }

  static async deleteOne<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T, conditions: Partial<I>): Promise<boolean> {
    const affectedRows = await (this as any).deleteAll(conditions, 1);
    return affectedRows > 0;
  }

  static async updateAll<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T, updates: Partial<I>, conditions: Partial<I>): Promise<number> {
    const proto = this.prototype;
    const normalizedColums = BaseEntity.whitelistAndMapDbColums(proto, updates);
    const normalizedConditions = BaseEntity.whitelistAndMapDbColums(proto, conditions);
    const query = DB.driver.getUpdateQuery(BaseEntity.getTableName(this), Object.keys(normalizedColums), normalizedConditions) as string;
    const params = [...Object.values(normalizedColums), ...Object.values(normalizedConditions)];
    const result = await DB.driver.execute(query, params);
    return result.affectedRows;
  }

  static async updateById<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T, id: number, updates: Partial<I>): Promise<boolean> {
    const affectedRows = await (this as any).updateAll(updates, { id });
    return affectedRows > 0;
  }

  static async count<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T, conditions?: Partial<I>): Promise<number> {
    const proto = this.prototype;
    const normalizedConditions = BaseEntity.whitelistAndMapDbColums(proto, conditions);
    const values = Object.values(normalizedConditions);
    const query = DB.driver.getCountQuery(BaseEntity.getTableName(this), normalizedConditions) as string;
    const result = await DB.driver.execute(query, values);
    return result.rows[0].count;
  }
  
}

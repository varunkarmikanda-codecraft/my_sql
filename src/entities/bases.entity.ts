import { TABLE_METADATA_KEY } from "./table.decorator.js";

export interface IBaseEntity {
  id: number;

  createdAt: Date;
  createdBy: number;
  updatedAt: Date;
  updatedBy: number;
}

export abstract class BaseEntity implements IBaseEntity {
  id: number;

  createdAt: Date;
  createdBy: number;
  updatedAt: Date;
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
    const keys = Object.keys(this);
    const columns = keys.join(", ");

    const values_placeholder = "?, ".repeat(keys.length).slice(0, -2);

    const query = `INSERT INTO ${(this.constructor as typeof BaseEntity).getTableName()} (${columns}) VALUES (${values_placeholder})`;
    console.log(query);

    // await db.execute(query, Object.values(this));
  }

  static async findById<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T, id: number): Promise<T | null> {
    const query = `SELECT * FROM ${Reflect.getMetadata(TABLE_METADATA_KEY, this)} WHERE id = ?`;
    console.log(query);
    return null;
    // const result = await db.execute(query, [id]);
    // const instance = new this(result[0]);
    // return instance;
  }

  static async findAll<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T): Promise<T[]> {
    const query = `SELECT * FROM ${Reflect.getMetadata(TABLE_METADATA_KEY, this)}`;
    console.log(query);
    return [];
    // const result = await db.execute(query);
    // const instance = new this(result);
    // return instance;
  }

  static async findOne<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T , conditions: Partial<I>): Promise<T | null> {

    const query = `SELECT * FROM ${Reflect.getMetadata(TABLE_METADATA_KEY, this)} WHERE ${Object.keys(conditions)} = ? LIMIT 1`;
    console.log(query);
    // const result = await db.execute(query, Object.values(conditions));
    return null;
  }

  static async deleteById<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T, id: number): Promise<T[]> {
    const query = `DELETE FROM ${Reflect.getMetadata(TABLE_METADATA_KEY, this)} WHERE id = ?`;
    console.log(query);
    // const result = await db.execute(query, [id]);
    return []
  }

  static async deleteAll<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T): Promise<T[]> {
    const query = `DELETE FROM ${Reflect.getMetadata(TABLE_METADATA_KEY, this)}`;
    console.log(query);
    // const result = await db.execute(query);
    return [];
  }

  static async deleteOne<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T, conditions: Partial<I>): Promise<T | null> {
    const query = `DELETE FROM ${Reflect.getMetadata(TABLE_METADATA_KEY, this)} WHERE ${Object.keys(conditions)} = ? LIMIT 1`;
    console.log(query);
    // const result = await db.execute(query, Object.values(conditions))
    return null;
  }
  
}

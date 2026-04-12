import { TABLE_METADATA_KEY } from "./table.decorator.js";

export interface IBaseEntity {
  id: number;

  createdAt: Date;
  createdBy: number;
  updatedAt: Date;
  updatedBy: number;
}

interface Pagination {
  limit?: number;
  offset?: number;
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

  static async findAll<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T, pagination: Pagination = { limit: 5, offset: 0}, conditions?: Partial<I>): Promise<T[]> {
    let findConditions = '';
    const queryValues: (string | number | Date)[] = []
    if(conditions) {
      const mappedConditions = Object.entries(conditions).map(([key, value]) => {
        queryValues.push(value)
        return `${key} = ?`
      }).join(' AND ')
      findConditions = `WHERE ${mappedConditions} `
    }
    const query =`SELECT * FROM ${Reflect.getMetadata(TABLE_METADATA_KEY, this)} ${findConditions}LIMIT ${pagination.limit} OFFSET ${pagination.offset}`
    console.log(query)
    // console.log(Object.values(conditions))
    console.log(queryValues)
    return [];
    // const result = await db.execute(query, queryValues);
    // const instance = new this(result);
    // return instance;
  }

  static async findOne<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T , conditions: Partial<I>): Promise<T | null> {
    const findConditions = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');

    const query = `SELECT * FROM ${Reflect.getMetadata(TABLE_METADATA_KEY, this)} WHERE ${findConditions} LIMIT 1`;
    console.log(query);
    // const result = await db.execute(query, Object.values(conditions));
    return null;
  }

  static async deleteById<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T, id: number): Promise<boolean> {
    const query = `DELETE FROM ${Reflect.getMetadata(TABLE_METADATA_KEY, this)} WHERE id = ?`;
    console.log(query);
    // const result = await db.execute(query, [id]);
    return false;
  }

  static async deleteAll<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T, limit: number = 5, conditions?: Partial<I>): Promise<number> {
    let deleteConditions = '';
    const queryValues: (string | number | Date)[] = []
    if(conditions) {
      const mappedConditions = Object.entries(conditions).map(([key, value]) => {
        queryValues.push(value);
        return `${key} = ?`
      }).join(' AND ');
      deleteConditions = `WHERE ${mappedConditions} `
    }
    const query = `DELETE FROM ${Reflect.getMetadata(TABLE_METADATA_KEY, this)} ${deleteConditions}LIMIT ${limit}`;
    console.log(query);
    console.log(queryValues)
    // const result = await db.execute(query, queryValues);
    return 0;
  }

  static async deleteOne<T extends BaseEntity, I extends IBaseEntity>(this: new (entity: I) => T, conditions: Partial<I>): Promise<boolean> {
    const deleteConditions = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ')
    const query = `DELETE FROM ${Reflect.getMetadata(TABLE_METADATA_KEY, this)} WHERE ${deleteConditions} LIMIT 1`;
    console.log(query);
    // const result = await db.execute(query, Object.values(conditions))
    return false;
  }
  
}

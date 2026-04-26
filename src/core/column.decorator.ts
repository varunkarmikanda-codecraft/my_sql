import type { BaseEntity, IBaseEntity } from "./bases.entity.js";

export const COLUMN_METADATA_KEY = Symbol('column');

export interface ColumnOptions {
  name?: string;
}

const normalizeOptions = (options?: string | ColumnOptions): ColumnOptions => {
  if(options === undefined) return {};
  if(typeof options === "string") return { name: options };
  return options;
}

export const Column = (options?: string | ColumnOptions) => {
  const resolved = normalizeOptions(options);
  return (target: object, propertyKey: string | symbol): void => {
    Reflect.defineMetadata(COLUMN_METADATA_KEY, resolved, target, propertyKey);
  }
}

interface ColumnMetaData {
  dbColumnName: string;
  propertyName: string;
}

export const getColumnSqlName = (prototype: object, propertyKey: string): ColumnMetaData => {
  const meta = Reflect.getMetadata(COLUMN_METADATA_KEY, prototype, propertyKey) as ColumnOptions | undefined;

  return { dbColumnName: meta?.name ?? propertyKey, propertyName: propertyKey};
}
import type { BaseEntity, IBaseEntity } from "./bases.entity.js";

export const COLUMN_METADATA_KEY = Symbol('column');

export const Column = (column?: string) => {
  return (target: IBaseEntity, propertyKey: string) => {
    const columnName = column || propertyKey;
    Reflect.defineMetadata(COLUMN_METADATA_KEY, columnName, target, propertyKey)
  }
}

export const getColumns = (instance: BaseEntity): Map<string, string> => {
  const columnMap = new Map<string, string>();
  const properties = Object.keys(instance);

  properties.forEach((prop) => {
    const columName = Reflect.getMetadata(COLUMN_METADATA_KEY, instance, prop);
    if(columName) columnMap.set(prop, columName);
  });
  return columnMap;
}
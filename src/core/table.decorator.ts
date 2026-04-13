import 'reflect-metadata';
import type { BaseEntity } from './bases.entity.js';

export const TABLE_METADATA_KEY = Symbol('table')

export const Table = <T extends typeof BaseEntity>(tableName: string) => (target: T) => {
  Reflect.defineMetadata(TABLE_METADATA_KEY, tableName, target)
}
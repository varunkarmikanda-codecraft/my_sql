import 'reflect-metadata';
import type { BaseEntity } from './bases.entity.js';

export const TABLE_METADATA_KEY = Symbol('table')

const isConsonent = (char: string): boolean => {
  return char !== "" && !/[aeiou]/.test(char);
}

const pluralize = (word: string): string => {
  const wordLength = word.length;
  if(wordLength === 0) return word;

  const last = word[wordLength - 1];
  const secondLast = wordLength > 2 ? word[wordLength - 2]! : "";

  if(last === 'y' && isConsonent(secondLast)) {
    return `${word.slice(0, -1)}ies`;
  }
  if(last === 's' || last === 'x' || last === 'z' || word.endsWith('ch') || word.endsWith('sh')) {
    return `${word}es`
  }
  return `${word}s`;
}

const defaultTableNameForClass = (ctor: Function): string => {
  const raw = ctor.name;
  if(!raw) {
    throw new Error("Unable to determine table name from class name");
  }
  const stem = raw.charAt(0).toLowerCase() + raw.slice(1);
  return pluralize(stem);
}

export const Table = <TARGET extends typeof BaseEntity>(tableName?: string) => (target: TARGET) => {
  const name = tableName ?? defaultTableNameForClass(target);
  Reflect.defineMetadata(TABLE_METADATA_KEY, name, target)
}
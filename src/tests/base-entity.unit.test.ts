import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

import { DB } from "../core/db.js";
import { User, type IUser } from "../entities/user.entity.js";
import type { IDatabaseDriver } from "../core/db.js";

type MockState = {
  nextResult: any;
  calls: Record<string, any[]>;
  rawQueries: { query: string; params?: any[] }[];
};

const createMockDriver = (state: MockState): IDatabaseDriver => {
  const spy = (name: string, returnValue: string) => (...args: any[]): string => {
    state.calls[name] = args;
    return returnValue;
  };

  return {
    connect: async (): Promise<void> => {},
    disconnect: async (): Promise<void> => {},
    execute: async (query: string, params?: any[]) => {
      state.rawQueries.push(params === undefined ? { query } : { query, params });
      return state.nextResult;
    },
    getPlaceholderPrefix: (): string => "?",
    getInsertQuery: spy("insert", "INSERT"),
    getUpsertQuery: spy("upsert", "UPSERT"),
    getUpdateQuery: spy("update", "UPDATE"),
    getDeleteQuery: spy("delete", "DELETE"),
    getSelectQuery: spy("select", "SELECT"),
    getCountQuery: spy("count", "COUNT")
  };
};

const buildUser = (email: string): IUser => ({
  name: "Varun",
  address: "123 Docker Lane",
  dob: new Date("1995-05-20"),
  email,
  createdAt: new Date(),
  createdBy: 1,
  updatedAt: new Date(),
  updatedBy: 1
});

let state: MockState;

beforeEach(() => {
  state = {
    nextResult: { rows: [], affectedRows: 0 },
    calls: {},
    rawQueries: []
  };
  DB.setDriver(createMockDriver(state));
});

test("save: maps camelCase to snake_case", async () => {
  await new User(buildUser("s@e.com")).save();

  const [table, columns] = state.calls.upsert ?? [];
  assert.equal(table, "users");
  assert.ok((columns as string[]).includes("date_of_birth"));
  assert.ok(state.rawQueries[0]?.query.includes("UPSERT"));
});

test("findAll: hydrates rows correctly", async () => {
  state.nextResult = {
    rows: [{ id: 1, date_of_birth: new Date("1995-05-20"), email: "v@e.com" }],
    affectedRows: 0
  };

  const [user] = await User.findAll({ dob: new Date("1995-05-20") });

  const [, , conditions] = state.calls.select ?? [];
  assert.ok(conditions && "date_of_birth" in conditions);

  assert.ok(user instanceof User);
  assert.equal(user?.email, "v@e.com");
  assert.ok(user?.dob instanceof Date);
});

test("write operations: return correct metadata", async () => {
  state.nextResult = { affectedRows: 5 };

  const updated = await User.updateAll({ name: "New" }, { id: 1 });
  const deleted = await User.deleteOne({ id: 1 });

  assert.equal(updated, 5);
  assert.equal(deleted, true);
});

test("count: parses result array", async () => {
  state.nextResult = { rows: [{ count: 10 }], affectedRows: 0 };
  const total = await User.count();
  assert.equal(total, 10);
});

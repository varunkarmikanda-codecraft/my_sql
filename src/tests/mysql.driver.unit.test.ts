import assert from "node:assert/strict";
import { test } from "node:test";

import { MySqlDriver } from "../drivers/mysql.driver.js";
import type { Condition } from "../core/expression.js";

test("select query", () => {
  const driver = new MySqlDriver({});

  const { sql, params } = driver.getSelectQuery("users", ["*"], { email: { op: "equal", value: "a@example.com" } }, 10, 5);

  assert.equal(
    sql,
    "SELECT * FROM `users` WHERE `email` = ? LIMIT 10 OFFSET 5"
  );
  assert.deepEqual(params, ["a@example.com"]);
})

test("update query", () => {
  const driver = new MySqlDriver({});
  const { sql, params } = driver.getUpdateQuery(
      "users",
      { name: "John", updated_at: "2026-04-26T18:36:55.106Z" },
      { id: { op: "equal", value: 1 } }
    );
  assert.equal(
    sql,
    "UPDATE `users` SET `name` = ?, `updated_at` = ? WHERE `id` = ?"
  );
  assert.deepEqual(params, ["John", "2026-04-26T18:36:55.106Z", 1]);
})

test("delete query", () => {
  const driver = new MySqlDriver({});
  const { sql, params } = driver.getDeleteQuery("users", { id: { op: "equal", value: 1 } }, 1);

  assert.equal(
    sql,
    "DELETE FROM `users` WHERE `id` = ? LIMIT 1"
  );
  assert.deepEqual(params, [1]);
})

test("count query", () => {
  const driver = new MySqlDriver({});
  const { sql, params } = driver.getCountQuery("users", { name: { op: "equal", value: "Varun" } });
  assert.equal(
    sql,
    "SELECT COUNT(*) AS count FROM `users` WHERE `name` = ?"
  );
  assert.deepEqual(params, ["Varun"]);
})


test("upsert query", () => {
  const driver = new MySqlDriver({});
  const { sql, params } = driver.getUpsertQuery("users", { id: 1, name: "Varun", created_at: "2023-01-01T00:00:00.000Z", updated_at: "2023-01-01T00:00:00.000Z" });
  assert.equal(
    sql,
    "INSERT INTO `users` (`id`, `name`, `created_at`, `updated_at`) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `updated_at` = VALUES(`updated_at`)"
  );
  assert.deepEqual(params, [1, "Varun", "2023-01-01T00:00:00.000Z", "2023-01-01T00:00:00.000Z"]);
});

test("condition params follow operator semantics", () => {
  const driver = new MySqlDriver({});

  const conditions: Condition = {
    name: { op: "startsWith", value: "Va" },
    email: { op: "contains", value: "@example.com" },
    age: { op: "greaterThanOrEqual", value: 18 },
    deleted_at: { op: "equal", value: null }
  };

  const { sql, params } = driver.getSelectQuery("users", ["id", "name"], conditions);

  assert.equal(
    sql,
    "SELECT `id`, `name` FROM `users` WHERE `name` LIKE ? AND `email` LIKE ? AND `age` >= ? AND `deleted_at` IS NULL"
  );
  assert.deepEqual(params, ["Va%", "%@example.com%", 18]);
});

test("condition params support endsWith and notEqual null", () => {
  const driver = new MySqlDriver({});

  const conditions: Condition = {
    city: { op: "endsWith", value: "pur" },
    archived_at: { op: "notEqual", value: null }
  };

  const { sql, params } = driver.getDeleteQuery("users", conditions);
  assert.equal(
    sql,
    "DELETE FROM `users` WHERE `city` LIKE ? AND `archived_at` IS NOT NULL"
  );
  assert.deepEqual(params, ["%pur"]);
});

test("limit/offset keeps zero values", () => {
  const driver = new MySqlDriver({});

  const { sql, params } = driver.getSelectQuery("users", ["*"], undefined, 0, 0);
  assert.equal(
    sql,
    "SELECT * FROM `users` LIMIT 0 OFFSET 0"
  );
  assert.deepEqual(params, []);
});

test("execute throws when not connected", async () => {
  const driver = new MySqlDriver({});

  await assert.rejects(async () => {
    await driver.execute("SELECT 1", []);
  }, /Not connected to the database/);
});

test("execute returns rows for select-like results", async () => {
  const driver = new MySqlDriver({});

  (driver as any).connection = {
    execute: async () => [[{ id: 1, name: "Varun" }], []],
    end: async () => undefined
  };

  const result = await driver.execute("SELECT * FROM users", []);

  assert.deepEqual(result.rows, [{ id: 1, name: "Varun" }]);
  assert.equal(result.affectedRows, 0);
});

test("execute returns affectedRows and insertId for write-like results", async () => {
  const driver = new MySqlDriver({});

  (driver as any).connection = {
    execute: async () => [{ affectedRows: 2, insertId: 10, info: "rows changed" }, []],
    end: async () => undefined
  };

  const result = await driver.execute("UPDATE users SET name = ? WHERE id = ?", ["A", 1]);

  assert.equal(result.affectedRows, 2);
  assert.equal(result.insertedId, 10);
  assert.equal(result.info, "rows changed");
});

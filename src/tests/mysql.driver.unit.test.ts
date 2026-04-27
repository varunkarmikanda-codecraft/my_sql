import assert from "node:assert/strict";
import { test } from "node:test";

import { MySqlDriver } from "../drivers/mysql.driver.js";
import type { Condition } from "../core/expression.js";

test("query helpers build escaped SQL", () => {
  const driver = new MySqlDriver({});

  assert.equal(
    driver.getSelectQuery("users", ["*"], { email: { op: "equal", value: "a@example.com" } }, 10, 5),
    "SELECT * FROM `users` WHERE `email` = ? LIMIT 10 OFFSET 5"
  );

  assert.equal(
    driver.getUpdateQuery(
      "users",
      { name: "John", updated_at: "2026-04-26T18:36:55.106Z" },
      { id: { op: "equal", value: 1 } }
    ),
    "UPDATE `users` SET `name` = ?, `updated_at` = ? WHERE `id` = ?"
  );

  assert.equal(
    driver.getDeleteQuery("users", { id: { op: "equal", value: 1 } }, 1),
    "DELETE FROM `users` WHERE `id` = ? LIMIT 1"
  );

  assert.equal(
    driver.getCountQuery("users", { name: { op: "equal", value: "Varun" } }),
    "SELECT COUNT(*) AS count FROM `users` WHERE `name` = ?"
  );

  assert.equal(
    driver.getUpsertQuery("users", ["id", "name", "created_at", "updated_at"]),
    "INSERT INTO `users` (`id`, `name`, `created_at`, `updated_at`) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `updated_at` = VALUES(`updated_at`)"
  );
});

test("condition params follow operator semantics", () => {
  const driver = new MySqlDriver({});

  const conditions: Condition = {
    name: { op: "startsWith", value: "Va" },
    email: { op: "contains", value: "@example.com" },
    age: { op: "greaterThanOrEqual", value: 18 },
    deleted_at: { op: "equal", value: null }
  };

  assert.equal(
    driver.getSelectQuery("users", ["id", "name"], conditions),
    "SELECT `id`, `name` FROM `users` WHERE `name` LIKE ?% AND `email` LIKE %?% AND `age` >= ? AND `deleted_at` IS NULL"
  );
});

test("condition params support endsWith and notEqual null", () => {
  const driver = new MySqlDriver({});

  const conditions: Condition = {
    city: { op: "endsWith", value: "pur" },
    archived_at: { op: "notEqual", value: null }
  };

  assert.equal(
    driver.getDeleteQuery("users", conditions),
    "DELETE FROM `users` WHERE `city` LIKE %? AND `archived_at` IS NOT NULL"
  );
});

test("limit/offset keeps zero values", () => {
  const driver = new MySqlDriver({});

  assert.equal(
    driver.getSelectQuery("users", ["*"], undefined, 0, 0),
    "SELECT * FROM `users` LIMIT 0 OFFSET 0"
  );
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

import assert from "node:assert/strict";
import { test } from "node:test";

import { MySqlDriver } from "../drivers/mysql.driver.js";

test("query helpers build expected SQL", () => {
  const driver = new MySqlDriver({});

  assert.equal(
    driver.getSelectQuery("users", ["*"], { email: "a@example.com" }, 10, 5),
    "SELECT * FROM users WHERE email = ? LIMIT 10 OFFSET 5"
  );

  assert.equal(
    driver.getUpdateQuery("users", ["name", "updated_at"], { id: 1 }),
    "UPDATE users SET name = ?, updated_at = ? WHERE id = ?"
  );

  assert.equal(
    driver.getDeleteQuery("users", { id: 1 }, 1),
    "DELETE FROM users WHERE id = ? LIMIT 1"
  );

  assert.equal(
    driver.getCountQuery("users", { name: "Varun" }),
    "SELECT COUNT(*) AS count FROM users WHERE name = ?"
  );

  assert.equal(
    driver.getUpsertQuery("users", ["id", "name", "created_at", "updated_at"]),
    "INSERT INTO users (id, name, created_at, updated_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), updated_at = VALUES(updated_at)"
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

test("execute returns affectedRows for write-like results", async () => {
  const driver = new MySqlDriver({});

  (driver as any).connection = {
    execute: async () => [{ affectedRows: 2, insertId: 10, info: "rows changed" }, []],
    end: async () => undefined
  };

  const result = await driver.execute("UPDATE users SET name = ? WHERE id = ?", ["A", 1]);

  assert.equal((result as any).affectedRows, 2);
  assert.equal((result as any).insertId, 10);
});

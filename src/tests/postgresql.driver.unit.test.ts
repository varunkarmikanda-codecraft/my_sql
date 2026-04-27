// import assert from "node:assert/strict";
// import { test } from "node:test";

// import { PostgreSqlDriver } from "../drivers/postgresql.driver.js";


// test("query helpers build expected SQL", () => {
//   const driver = new PostgreSqlDriver({});

//   assert.equal(
//     driver.getSelectQuery("users", ["*"], { "email\"x": { op: "equal", value: "a@example.com" } }, 10, 5),
//     "SELECT * FROM \"users\" WHERE \"email\"\"x\" = 'a@example.com' LIMIT 10 OFFSET 5"
//   );

//   assert.equal(
//     driver.getUpdateQuery("users", { name: "John", updated_at: '2026-04-26T18:36:55.106Z' }, { id: { op: "equal", value: 1 } }),
//     "UPDATE users SET name = 'John', updated_at = '2026-04-26T18:36:55.106Z' WHERE id = 1"
//   );

//   assert.equal(
//     driver.getDeleteQuery("users", { id: { op: "equal", value: 1 } }, 1),
//     "DELETE FROM users WHERE id = 1"
//   );

//   assert.equal(
//     driver.getCountQuery("users", { name: { op: "equal", value: "Varun" } }),
//     "SELECT COUNT(*) AS count FROM users WHERE name = 'Varun'"
//   );

//   assert.equal(
//     driver.getUpsertQuery("users", ["id", "name", "created_at", "updated_at"]),
//     "INSERT INTO users (id, name, created_at, updated_at) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = EXCLUDED.updated_atxx"
//   );
// });

// test("execute throws when not connected", async () => {
//   const driver = new PostgreSqlDriver({});

//   await assert.rejects(async () => {
//     await driver.execute("SELECT 1", []);
//   }, /Not connected to the database/);
// });

// test("execute returns rows for select-like results", async () => {
//   const driver = new PostgreSqlDriver({});

//   (driver as any).connection = {
//     execute: async () => [[{ id: 1, name: "Varun" }], []],
//     end: async () => undefined
//   };

//   const result = await driver.execute("SELECT * FROM users", []);

//   assert.deepEqual(result.rows, [{ id: 1, name: "Varun" }]);
//   assert.equal(result.affectedRows, 0);
// });

// test("execute returns affectedRows for write-like results", async () => {
//   const driver = new PostgreSqlDriver({});

//   (driver as any).connection = {
//     execute: async () => [{ affectedRows: 2, insertId: 10, info: "rows changed" }, []],
//     end: async () => undefined
//   };

//   const result = await driver.execute("UPDATE users SET name = $1 WHERE id = $2", ["A", 1]);

//   assert.equal((result as any).affectedRows, 2);
//   assert.equal((result as any).insertId, 10);
// });

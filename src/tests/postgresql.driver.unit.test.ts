import assert from "node:assert/strict";
import { test } from "node:test";

import { PostgreSqlDriver } from "../drivers/postgresql.driver.js";

test("query helpers build expected PostgreSQL SQL", () => {
  const driver = new PostgreSqlDriver({});

  assert.equal(
    driver.getUpsertQuery("users", ["id", "email", "created_at", "updated_at"], ["email"]),
    "INSERT INTO users (id, email, created_at, updated_at) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO UPDATE SET id = EXCLUDED.id, updated_at = EXCLUDED.updated_at RETURNING id"
  );

  assert.equal(
    driver.getUpsertQuery("users", ["name", "created_at"]),
    "INSERT INTO users (name, created_at) VALUES ($1, $2) RETURNING id"
  );
});

test("execute returns insertedId when RETURNING id is present", async () => {
  const driver = new PostgreSqlDriver({});

  (driver as any).connection = {
    query: async () => ({
      rows: [{ id: 7 }],
      rowCount: 1,
      command: "INSERT"
    }),
    end: async () => undefined
  };

  const result = await driver.execute("INSERT INTO users(name) VALUES($1) RETURNING id", ["A"]);

  assert.equal(result.insertedId, 7);
  assert.equal(result.affectedRows, 1);
});

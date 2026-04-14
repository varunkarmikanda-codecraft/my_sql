import { DB } from "./core/db.js";
import { MySqlDriver } from "./drivers/mysql.driver.js";
import { User, type IUser } from "./entities/user.entity.js";

const connectionConfig = {
  host: "localhost",
  port: 3306,
  database: "my_sql",
  user: "groot",
  password: "groot123"
};

DB.setDriver(new MySqlDriver(connectionConfig));

const user: IUser = {
  name: "Varun",
  address: "123 Docker Lane, Container City",
  dob: new Date("1995-05-20"),
  email: "varun@example.com",
  createdAt: new Date("2026-01-01T10:00:00Z"),
  createdBy: 123,
  updatedAt: new Date("2026-04-10T12:00:00Z"),
  updatedBy: 123
};

const main = async () => {
  await DB.driver.connect();

  try {
    const newUser = new User(user);
    await newUser.save();
  } finally {
    await DB.driver.disconnect();
  }
}

main();
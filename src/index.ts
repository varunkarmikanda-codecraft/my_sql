import { DB } from "./core/db.js";
import { MySqlDriver } from "./drivers/mysql.driver.js";
import { PostgreSqlDriver } from "./drivers/postgresql.driver.js";
import { User, type IUser } from "./entities/user.entity.js";

// const connectionConfig = {
//   host: "localhost",
//   port: 3306,
//   database: "my_sql",
//   user: "groot",
//   password: "groot123"
// };

const connectionConfig = {
  host: "localhost",
  port: 5432,
  database: "my_postgres_db",
  user: "postgres_user",
  password: "postgres_password",
};

// DB.setDriver(new MySqlDriver(connectionConfig));
DB.setDriver(new PostgreSqlDriver(connectionConfig));

const user: IUser = {
  name: "Varun",
  address: "123 Docker Lane, Container City",
  dob: new Date("1995-05-20"),
  email: "varun@example.com",
  createdAt: new Date("2026-01-01T10:00:00Z"),
  createdBy: 123,
  updatedAt: new Date("2026-04-10T12:00:00Z"),
  updatedBy: 123,
};

const main = async () => {
  await DB.driver.connect();

  try {
    const newUser = new User(user);
    await newUser.save();
    console.log("saved");

    // const f1 = await User.findAll();
    // console.log(JSON.stringify(f1, null, 2))
    // const f2 = await User.findAll({ name: "Varun" }, undefined, 4);
    // console.log(JSON.stringify(f2, null, 2))
    // const f3 = await User.findOne({ email: "varun@example.com" });
    // console.log(JSON.stringify(f3, null, 2))

    // const f4 = await User.updateAll(
    //   { address: "Updated address", updatedAt: new Date(), updatedBy: 123 },
    //   { email: "varun@example.com" }
    // );
    // console.log(f4)

    // const x = await User.count({ name: "Varun" });
    // console.log(x)

    // const y = await User.deleteOne({ email: "varun@example.com" });
    // console.log(y)
  } finally {
    await DB.driver.disconnect();
  }
};

main();

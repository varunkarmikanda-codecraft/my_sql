import { getColumnSqlName } from "./core/column.decorator.js";
import { DB } from "./core/db.js";
import { MySqlDriver } from "./drivers/mysql.driver.js";
import { Employee, type IEmployee } from "./entities/employee.entity.js";
import { User, type IUser } from "./entities/user.entity.js";

DB.setDriver(new MySqlDriver("MySQL"))

// async function testConnection() {
//   const driver = new MySqlDriver();
//   DB.setDriver(driver);

//   try {
//     console.log("Testing connection...");
//     await DB.driver.connect();
    
//     await DB.driver.disconnect();
//     console.log("All tests passed!");
//   } catch (error) {
//     console.error("Test failed:", error);
//   }
// }

// testConnection();

const user: IUser = {
  id: 123,
  name: "Varun",
  address: "123 Docker Lane, Container City",
  dob: new Date("1995-05-20"),
  email: "varun@example.com",
  createdAt: new Date("2026-01-01T10:00:00Z"),
  createdBy: 123,
  updatedAt: new Date("2026-04-10T12:00:00Z"),
  updatedBy: 123
};

const newUser = new User(user);

// const properties = Object.keys(newUser);
// properties.forEach((prop) => {
//   const mapping = getColumnSqlName(Object.getPrototypeOf(newUser), prop);
//   console.log(`${mapping.propertyName} -> ${mapping.dbColumnName}`);
// });

console.log(newUser.save());
User.findById(123)

User.findAll()
User.findAll({ id: 1, createdAt: new Date(), updatedBy: 56 })
User.findAll({ id: 1, createdAt: new Date(), updatedBy: 56 }, 6, 7)
User.findAll({} , undefined, 7)

User.findOne({ id: 123 })
User.findOne({ id: 123, createdAt: new Date() })

User.deleteById(67);
User.deleteAll({name: "varun", id: 5});
User.deleteAll({ id: 1}, 5, 10);
User.deleteAll({ id: 1, createdAt: new Date(), updatedBy: 56 }, undefined, 7);
User.deleteOne({ name: 'varun' })
User.deleteOne({ name: 'varun', id: 5 })

User.updateAll({ name: "var", updatedAt: new Date() }, { id: 123})
User.updateAll({ name: "var", updatedAt: new Date() }, { name: "varun" })
User.updateAll({ name: "var", updatedAt: new Date() }, {})
User.updateAll({ name: "var", updatedAt: new Date() }, { id: 123 }) 
User.updateById(1, { name: "var", updatedAt: new Date() }) 

User.count({ name: "varun"})

// console.log()

// const employee: IEmployee = {
//   id: 123,
//   name: "Varun",
//   position: "dev",
//   department: 'backend',
//   salary: 9999999,
//   createdAt: new Date("2026-01-01T10:00:00Z"),
//   createdBy: 123,
//   updatedAt: new Date("2026-04-10T12:00:00Z"),
//   updatedBy: 123
// };

// const newEmployee = new Employee(employee);
// newEmployee.save();
// Employee.findById(123)
// Employee.findAll()
// Employee.findOne({ name: 'john' })
// Employee.deleteById(26);
// Employee.deleteAll();
// Employee.deleteOne({ id: 6 })
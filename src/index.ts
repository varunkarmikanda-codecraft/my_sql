import { getColumns } from "./core/column.decorator.js";
import { Employee, type IEmployee } from "./entities/employee.entity.js";
import { User, type IUser } from "./entities/user.entity.js";

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
console.log(getColumns(newUser));
// newUser.save();
// User.findById(123)
// console.log()
// User.findAll()
// User.findAll({limit: 6, offset: 7})
// User.findAll({limit: 6, offset: 7}, { id: 1})
// User.findAll({limit: 6, offset: 7}, { id: 1, createdAt: new Date(), updatedBy: 56 })
// console.log()
// User.findOne({ id: 123 })
// User.findOne({ id: 123, createdAt: new Date() })
// console.log()
// User.deleteById(67);
// console.log()
// User.deleteAll(6);
// User.deleteAll(6, { id: 1});
// User.deleteAll(6, { id: 1, createdAt: new Date(), updatedBy: 56 });
// console.log()
// User.deleteOne({ name: 'varun' })
// User.deleteOne({ name: 'varun', id: 5 })
// User.update({ name: "var", updatedAt: new Date() })
// User.update({ name: "var", updatedAt: new Date() }, { id: 123})
// User.update({ name: "var", updatedAt: new Date() }, { name: "varun" })
// User.update({ name: "var", updatedAt: new Date() }, {}, 5)
// User.update({ name: "var", updatedAt: new Date() }, { id: 123 }, 6)

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
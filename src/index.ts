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
newUser.save();
User.findById(123)
User.findAll()
User.findOne({ id: 123 })
User.deleteById(67);
User.deleteAll();
User.deleteOne({ name: 'varun' })

console.log()

const employee: IEmployee = {
  id: 123,
  name: "Varun",
  position: "dev",
  department: 'backend',
  salary: 9999999,
  createdAt: new Date("2026-01-01T10:00:00Z"),
  createdBy: 123,
  updatedAt: new Date("2026-04-10T12:00:00Z"),
  updatedBy: 123
};

const newEmployee = new Employee(employee);
newEmployee.save();
Employee.findById(123)
Employee.findAll()
Employee.findOne({ name: 'john' })
Employee.deleteById(26);
Employee.deleteAll();
Employee.deleteOne({ id: 6 })
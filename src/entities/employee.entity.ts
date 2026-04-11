import { BaseEntity, type IBaseEntity } from "./bases.entity.js";

interface IEmployee extends IBaseEntity {
  name: string;
  position: string;
  department: string;
  salary: number;
}

class Employee extends BaseEntity implements IEmployee {

  name: string;
  position: string;
  department: string;
  salary: number;

  constructor(employee: IEmployee) {
    super(employee);
    this.name = employee.name;
    this.position = employee.position;
    this.department = employee.department;
    this.salary = employee.salary;
  }

}
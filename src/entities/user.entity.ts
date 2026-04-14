import { BaseEntity, type IBaseEntity } from "../core/bases.entity.js";
import { Column } from "../core/column.decorator.js";
import { Table } from "../core/table.decorator.js";

export interface IUser extends IBaseEntity {
  name: string;
  address: string;
  dob: Date;
  email: string;
}

@Table()
export class User extends BaseEntity implements IUser {

  @Column()
  name: string;
  @Column()
  address: string;
  @Column("date_of_birth")
  dob: Date;
  @Column()
  email: string;

  constructor(user: IUser) {
    super(user);
    this.name = user.name;
    this.address = user.address;
    this.dob = user.dob;
    this.email = user.email;
  }

}

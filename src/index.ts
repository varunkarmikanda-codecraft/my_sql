import { User, type IUser } from "./entities/user.entity.js";

const mockUser: IUser = {
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

const newUser = new User(mockUser);

newUser.save();

User.findById(123)


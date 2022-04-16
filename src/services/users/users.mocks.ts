import { APIMocks } from "unimocks";
import { UsersAPI } from "./users.api";
import { User } from "./users.dto";
import { UserFactory } from "./users.factory";

const users = UserFactory.buildList(10);

export const mocks: APIMocks<UsersAPI> = {
  getUsers: () => users,
  addUser: (user) => {
    const newUser = UserFactory.build(user);
    users.push(newUser);
    return newUser;
  },
  updateUser: ({ id, user }) => {
    const originalUser = users.find((u) => u.id === id);
    if (originalUser) {
      Object.keys(user).forEach((key) => {
        (originalUser as any)[key] = (user as any)[key];
      });
    }
    return originalUser as User;
  },
  deleteUser: (id) => {
    const user = users.findIndex((u) => u.id === id);
    if (user !== -1) {
      users.splice(user, 1);
    }
  },
};

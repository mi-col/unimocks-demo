import { makeFactory, each } from "factory.ts";
import { User } from "../../src/services/users/users.dto";

export const userFactory = {
  UserFactory: makeFactory<User>({
    id: each((i) => `user${i}`),
    firstName: 'John',
    lastName: 'Doe',
    job: 'Professional Alcoholic',
    age: 33,
    email: 'john.doe@drinkers.com',
  })
}

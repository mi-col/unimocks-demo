import { makeFactory, each } from "factory.ts";
import faker from "@faker-js/faker";
import { User } from "./users.dto";

export const UserFactory = makeFactory<User>({
  id: each(() => faker.datatype.uuid()),
  firstName: each(() => faker.name.firstName()),
  lastName: each(() => faker.name.lastName()),
  job: each(() => faker.name.jobTitle()),
  age: each(() => faker.datatype.number({min: 20, max: 80})),
  email: '',
}).withDerivation('email', (user) => faker.internet.email(user.firstName, user.lastName));

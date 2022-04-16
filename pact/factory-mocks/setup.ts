import { userFactory } from "./users.factory";

jest.mock('../../src/services/users/users.factory', () => userFactory);

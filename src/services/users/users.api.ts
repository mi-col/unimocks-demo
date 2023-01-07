import axios from "axios";
import { APIRequest, APIRequests, APIService } from  "unimocks";
import { User } from "./users.dto";
import { UserFactory } from "./users.factory";

export interface UsersAPI extends APIRequests {
  getUsers: APIRequest<User[], void>;
}

export const usersAPI = new APIService<UsersAPI>(
  "users",
  {
    getUsers: () => axios.get<User[]>("/users").then(({ data }) => data),
  },
  {
    /*dev:start*/
    mocks: {
      getUsers: () => UserFactory.buildList(10),
    },
    /*dev:end*/
    integrationMocks: !!process.env.REACT_APP_INTEGRATION,
  }
);

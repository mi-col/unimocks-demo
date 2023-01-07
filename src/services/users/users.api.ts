import axios from "axios";
import {
  APIRequest,
  APIRequests,
  APIService,
} from "unimocks";
import { User } from "./users.dto";
import { mocks } from "./users.mocks";

export interface UsersAPI extends APIRequests {
  getUsers: APIRequest<User[], void>;
  addUser: APIRequest<User, Partial<User>>;
  updateUser: APIRequest<User, { user: Partial<User>; id: string }>;
  deleteUser: APIRequest<void, string>;
}

export const usersAPI = new APIService<UsersAPI>(
  "users",
  {
    getUsers: () => axios.get<User[]>("/users").then(({ data }) => data),
    addUser: (user) => axios.post<User>("/users", user).then(({ data }) => data),
    updateUser: ({user, id}) => axios.patch<User>(`/users/${id}`, user).then(({ data }) => data),
    deleteUser: (id) => axios.delete<void>(`/users/${id}`).then(({ data }) => data),
  },
  {
    /*dev:start*/ mocks, /*dev:end*/
    integrationMocks: !!process.env.REACT_APP_INTEGRATION
  }
);

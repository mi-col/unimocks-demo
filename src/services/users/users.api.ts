import {
  MetaAPIRequest,
  MetaAPIRequests,
  MetaAPIService,
  weedOutFields,
} from "unimocks";
import { axiosRequest } from "../axios.request";
import { User } from "./users.dto";
import { mocks } from "./users.mocks";

const defaultBaseURL = "/api";

export interface UsersAPI extends MetaAPIRequests {
  getUsers: MetaAPIRequest<User[], void>;
  addUser: MetaAPIRequest<User, Partial<User>>;
  updateUser: MetaAPIRequest<User, { user: Partial<User>; id: string }>;
  deleteUser: MetaAPIRequest<void, string>;
}

export const usersAPI = (baseURL = defaultBaseURL) =>
  new MetaAPIService<UsersAPI>(
    "users",
    {
      getUsers: axiosRequest({ baseURL, method: 'GET', path: `/users`}),
      addUser: axiosRequest({ baseURL, method: 'POST', path: `/users`, body: (input) => input}),
      updateUser: axiosRequest({ baseURL, method: 'PATCH', path: ({id}) => `/users/${id}`, body: weedOutFields(['id'])}),
      deleteUser: axiosRequest({ baseURL, method: 'DELETE', path: (id) => `/users/${id}` }),
    },
    {
      /*dev:start*/ mocks, /*dev:end*/
      integrationMocks: !!process.env.REACT_APP_INTEGRATION
    }
  );

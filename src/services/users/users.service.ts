import { useQuery } from "react-query";
import { usersAPI } from "./users.api";

export const useUsers = () => useQuery(["users"], () => usersAPI.requests.getUsers());
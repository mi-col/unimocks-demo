import { useMutation, useQuery, useQueryClient } from "react-query";
import { usersAPI } from "./users.api";

const API = usersAPI();

export const useUsers = () => useQuery(['users'], () => API.requests.getUsers());
export const useAddUser = () => {
    const queryClient = useQueryClient();
    return useMutation(API.requests.addUser, {onSuccess: () => queryClient.invalidateQueries(['users'])});
}
export const useUpdateUser = () => {
    const queryClient = useQueryClient();
    return useMutation(API.requests.updateUser, {onSuccess: () => queryClient.invalidateQueries(['users'])});
}
export const useDeleteUser = () => {
    const queryClient = useQueryClient();
    return useMutation(API.requests.deleteUser, {onSuccess: () => queryClient.invalidateQueries(['users'])});
}

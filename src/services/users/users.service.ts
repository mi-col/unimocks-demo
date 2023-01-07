import { useMutation, useQuery, useQueryClient } from "react-query";
import { usersAPI } from "./users.api";

export const useUsers = () => useQuery(['users'], () => usersAPI.requests.getUsers());
export const useAddUser = () => {
    const queryClient = useQueryClient();
    return useMutation(usersAPI.requests.addUser, {onSuccess: () => queryClient.invalidateQueries(['users'])});
}
export const useUpdateUser = () => {
    const queryClient = useQueryClient();
    return useMutation(usersAPI.requests.updateUser, {onSuccess: () => queryClient.invalidateQueries(['users'])});
}
export const useDeleteUser = () => {
    const queryClient = useQueryClient();
    return useMutation(usersAPI.requests.deleteUser, {onSuccess: () => queryClient.invalidateQueries(['users'])});
}

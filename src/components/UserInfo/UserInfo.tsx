import React, { FC } from "react";
import { User } from "../../services/users/users.dto";

import './UserInfo.css';

export interface UserProps {
  user: User;
  onDelete: (id: string) => void;
}

const UserInfo: FC<UserProps> = ({user, onDelete}) => (
  <div className="user">
    <div><label>Name: </label><span>{user.firstName} {user.lastName}</span></div>
    <div><label>Job: </label><span>{user.job}</span></div>
    <div><label>Email: </label><span>{user.email}</span></div>
    <div><label>Age: </label><span>{user.age}</span></div>
    <div><button onClick={() => onDelete(user.id)}>Delete</button></div>
  </div>
)

export default UserInfo;

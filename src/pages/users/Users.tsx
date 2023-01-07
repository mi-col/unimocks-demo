import React, { useState } from 'react';
import UserInfo from '../../components/UserInfo/UserInfo';
import { User } from '../../services/users/users.dto';
import { useUsers, useDeleteUser, useAddUser } from '../../services/users/users.service';

import './Users.css';

function App() {
  const {data} = useUsers();
  const {mutate: deleteUser} = useDeleteUser();
  const {mutate: addUser} = useAddUser();
  const [newUser, setNewUser] = useState<Partial<User>>({});

  return (
    <div className="app">
      <div className="user-input">
        <div><label htmlFor="firstName">First Name: </label><input name="firstName" onChange={(e) => setNewUser({...newUser, firstName: e.target.value})} value={newUser?.firstName}></input></div>
        <div><label htmlFor="lastName">Last Name: </label><input name="lastName" onChange={(e) => setNewUser({...newUser, lastName: e.target.value})} value={newUser?.lastName}></input></div>
        <div><label htmlFor="job">Job: </label><input name="job" onChange={(e) => setNewUser({...newUser, job: e.target.value})} value={newUser?.job}></input></div>
        <div><label htmlFor="email">Email: </label><input name="email" onChange={(e) => setNewUser({...newUser, email: e.target.value})} value={newUser?.email}></input></div>
        <div><label htmlFor="age">Age: </label><input type="number" name="age" onChange={(e) => setNewUser({...newUser, age: +e.target.value})} value={newUser?.age}></input></div>
        <button onClick={() => addUser(newUser)}>Create</button>
      </div>
      {data?.map((user) => (<UserInfo key={user.id} user={user} onDelete={deleteUser}/>))}
    </div>
  );
}

export default App;

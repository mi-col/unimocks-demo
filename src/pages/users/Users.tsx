import React from 'react';
import UserInfo from '../../components/UserInfo/UserInfo';
import { useUsers } from '../../services/users/users.service';

import './Users.css';

function App() {
  const { data } = useUsers();

  return (
    <div className="app">
      {data?.map((user) => (
        <UserInfo key={user.id} user={user} onDelete={() => {}} />
      ))}
    </div>
  );
}

export default App;

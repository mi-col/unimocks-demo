import React from 'react';
import { render, screen } from '@testing-library/react';
import UserInfo from './UserInfo';
import { UserFactory } from '../../services/users/users.factory';

test('renders user information', async () => {
  const user = UserFactory.build();
  const handleDelete = jest.fn();
  render(<UserInfo user={user} onDelete={handleDelete}/>);
  const name = screen.getByText(`${user.firstName} ${user.lastName}`);
  const job = screen.getByText(user.job);
  const email = screen.getByText(user.email);
  const age = screen.getByText(user.age);
  (await screen.findByText('Delete')).click();
  expect(name).toBeInTheDocument();
  expect(job).toBeInTheDocument();
  expect(email).toBeInTheDocument();
  expect(age).toBeInTheDocument();
  expect(handleDelete).toHaveBeenCalled();
});

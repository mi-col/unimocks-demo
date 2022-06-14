import { usersAPI } from '../../src/services/users/users.api';
import { mockAPI, ServiceMock } from 'unimocks/puppeteer';
import { MainPage } from '../poms/main';
import { UserFactory } from '../../src/services/users/users.factory';

describe('App', () => {
  let main: MainPage;
  let userMocks: ServiceMock<ReturnType<typeof usersAPI>>;

  beforeAll(async () => {
    userMocks = await mockAPI(usersAPI(), page);
    main = await new MainPage(page).open();
    await page.goto('http://localhost:3000', {waitUntil: 'domcontentloaded'});
  });

  it('should add new user', async () => {
    const user = UserFactory.build({id: undefined});
    await main.userInput.createUser(user);
    await page.waitForNetworkIdle();
    const users = await main.users.locator();
    expect(await users[users.length - 1].getUser()).toEqual({...user, id: undefined});
  });
})

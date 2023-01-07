import { usersAPI } from '../../src/services/users/users.api';
import { mockAPI, ServiceMock } from 'unimocks/puppeteer';
import { MainPage } from '../poms/main';

describe('App', () => {
  let main: MainPage;
  let userMocks: ServiceMock<typeof usersAPI>;

  beforeAll(async () => {
    userMocks = await mockAPI(usersAPI, page);
    main = await new MainPage(page).open();
    await page.goto('http://localhost:3000', {waitUntil: 'domcontentloaded'});
  });

  it('should see 10 users', async () => {
    await page.waitForNetworkIdle();
    const users = await main.users.locator();
    expect(users.length).toEqual(10);
  });
})

import { PompElement, PompPage } from "pompeteer";
import { User } from "../../src/services/users/users.dto";

export class MainPage extends PompPage {
  async open(url = "http://localhost:3000") {
    await this.page.goto(url, {waitUntil: 'domcontentloaded'});
    return this;
  }

  users = this.$$('.user', UserBox);
}

export class UserBox extends PompElement {
  name = this.$x(".//label[contains(text(),'Name')]/following-sibling::span");
  job = this.$x(".//label[contains(text(),'Job')]/following-sibling::span");
  email = this.$x(".//label[contains(text(),'Email')]/following-sibling::span");
  age = this.$x(".//label[contains(text(),'Age')]/following-sibling::span");
  deleteButton = this.$('button');

  getUser = async (): Promise<Partial<User>> => {
    const name = await this.name.text();
    const firstName = name.split(' ')[0];
    const lastName = name.split(' ')[1];
    const job = await this.job.text();
    const email = await this.email.text();
    const age = +(await this.age.text());
    return {
      firstName,
      lastName,
      job,
      email,
      age,
    }
  }
}
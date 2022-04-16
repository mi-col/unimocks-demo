import { pactWith } from "jest-pact";
import { ServiceInteractionBuilders, setupInteractionBuilders } from "unimocks/pact";
import { Matchers } from "@pact-foundation/pact";
import { UsersAPI, usersAPI } from "../../../src/services/users/users.api";
import { userFactory as userFactories } from "../../factory-mocks/users.factory";

pactWith({ consumer: "UsersUI", provider: "UsersAPI" }, (provider) => {
  let client: ReturnType<typeof usersAPI>;
  let interactions: ServiceInteractionBuilders<UsersAPI>;

  beforeEach(async () => {
    client = usersAPI(provider.mockService.baseUrl);
    interactions = setupInteractionBuilders(client, {
      resetEnv: () => Object.values(userFactories).forEach((factory) => factory.resetSequenceNumber()),
    });
  });

  describe("Get users endpoint", () => {
    it("retrieves users", async () => {
      const { interaction, output } = await interactions.getUsers({
        state: "Server is healthy",
        uponReceiving: "a GET request for the list of users",
        input: undefined,
      });
      await provider.addInteraction(interaction);
      expect(await client.requests.getUsers()).toEqual(output);
    });
  });

  describe("Create user endpoint", () => {
    it("creates a user", async () => {
      const { id, ...user } = userFactories.UserFactory.build();
      userFactories.UserFactory.resetSequenceNumber();
      const { interaction, output, input } = await interactions.addUser({
        state: "Server is healthy",
        uponReceiving: "a POST request to add a user",
        input: user,
        response: {
          body: {
            firstName: Matchers.regex({generate: user.firstName, matcher: user.firstName}),
            lastName: Matchers.regex({generate: user.lastName, matcher: user.lastName}),
            job: Matchers.regex({generate: user.job, matcher: user.job}),
            email: Matchers.regex({generate: user.email, matcher: user.email}),
            age: Matchers.integer(user.age)
          }
        }
      });
      await provider.addInteraction(interaction);
      expect(await client.requests.addUser(input)).toEqual(output);
    });
  });
});

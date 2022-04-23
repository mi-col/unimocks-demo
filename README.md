# Guide to UI-driven development with Pact, Puppeteer, React Query and Unimocks

Have you ever done UI-driven development and felt exhausted from having to create multiple similar fake APIs or mocks to run your code in dev or testing? Or are you fairly new to UI-driven development and looking for a single package that would guide you and simplify this process? In either case this guide is for you, as it will show you the strategy to setting up a flexible UI-driven APP with no dependency on the API, no duplicated mocks scattered across different parts of the code, no extra fake server process to run and a simple way to deploy against live API without any extra changes.

# Contents
  - [Concept](#Concept)
  - [Creating the app](#creating-the-app)
    - [Simple components](#simple-components)
    - [Universal data generation](#universal-data-generation)
    - [Mock API](#mock-api)
      - [Build optimization](#build-optimization)
    - [Data managed components](#data-managed-components)
    - [Integration testing](#integration-testing)
      - [Puppeteer setup](#puppeteer-setup)
      - [Integration mocks](#integration-mocks)
      - [Page object models](#page-object-models)
    - [Contract testing](#contract-testing)
      - [Setup for Pact](#setup-for-pact)
      - [Using ServiceInteractionBuilders](#using-serviceinteractionbuilders)
  - [Conclusion](#conclusion)
    - [Tips](#tips)


# Concept

The first step to easily developing a web application without an API is to define strict separations of concerns between the application's layers, so there are no extraneous dependencies between. Let's look at the following diagram that denotes the layers of our application:

![Application layers](https://i.ibb.co/RN7sx0b/t-1.png)

You can find similar diagrams online, especially when it comes to separating component types in React, with many definitions of this distinction, from smart/stupid components to logic/view components. The terminology isn't relevant here as long as we try to follow the practice of **distinguishing independent components reused in the application from the ones bound to the data layer**.

What is more important for this particular guide is the data layer, which has a structure specific to our UI-driven development approach:

![Data layer](https://i.ibb.co/S54wh1B/t-2.png)

As you can see, we **separate the data management layer from the data querying layer** though a single Input/Output interface, which allows us to manage the data in our application regardless if it comes from a live API or any of our mocks, which we will talk about later.

Another upside of this approach is that we can have a full testing suite of our app without ever communicating with a live API. Here is the color-coded structure of our app, denoting which area is covered by which type of testing:
![Testing layers](https://i.ibb.co/thCLWGx/t-3.png)

Now that we have conceptualized our app's structure, let's start writing actual code.

# Creating the app

> **NOTE:** This guide will be using a React application, but the tools and conceptual approach is not bound to any UI library/framework, aside from the ones promoted in the guide.

> **REPO:** This guide assumes that you have some experience in both web development and writing tests. If you'd like to see the entirety of the code, for this or any other reason, you can find it at https://github.com/mic-c/unimocks-demo

First thing's first, let's create a React app, we'll be using CRA to speed up the process:

```bash
npx create-react-app my-app --template typescript
```

## Simple components

Our app will be a simple list of users with CRUD functionality, so first let's create an example of a simple unit-testable display component with our user's info.

```typescript
import React, { FC } from "react";

import { User } from "../../services/users/users.dto";

import "./UserInfo.css";

export interface UserProps {
  user: User;

  onDelete: (id: string) => void;
}

const UserInfo: FC<UserProps> = ({ user, onDelete }) => (
  <div className="user">
    <div>
      <label>Name: </label>
      <span>
        {user.firstName} {user.lastName}
      </span>
    </div>

    <div>
      <label>Job: </label>
      <span>{user.job}</span>
    </div>

    <div>
      <label>Email: </label>
      <span>{user.email}</span>
    </div>

    <div>
      <label>Age: </label>
      <span>{user.age}</span>
    </div>

    <div>
      <button onClick={() => onDelete(user.id)}>Delete</button>
    </div>
  </div>
);

export default UserInfo;
```

Now that we have our first simple component we can write our first unit test. But in order to test our component we need to provide it with a fake user, and that is where we starting getting into the universal approach to data mocking.

## Universal data generation

Since we know in advance that we will be generating a lot of fake data, be it for unit tests, for running a development version of the app, for integration tests, or for contract tests, we can save ourselves a lot of time and effort by creating data-generators, which we can then reuse across all areas of our app.

In order to do that we will use a combination of two libraries: [factory.ts](https://github.com/willryan/factory.ts#readme) and [Faker](https://fakerjs.dev/) to make controlled random data factories. Let's create one for our users:

```typescript
export const UserFactory = makeFactory<User>({
  id: each(() => faker.datatype.uuid()),

  firstName: each(() => faker.name.firstName()),

  lastName: each(() => faker.name.lastName()),

  job: each(() => faker.name.jobTitle()),

  age: each(() => faker.datatype.number({ min: 20, max: 80 })),

  email: "",
}).withDerivation("email", (user) =>
  faker.internet.email(user.firstName, user.lastName)
);
```

You can read up more about both `Faker` and `factory.ts`, but here is a short summary of what UserFactory does. it provides us with methods that generate either a single or several instances of a User with the ability to override any fields. So if we wanted to create a senior user, we could call

```typescript
const user = UserFactory.build({ age: 70 });
```

`each` is a `factory.ts` method that allows us to generate non-static data. It could be bound to the index of the object being generated, but since we are lazy and just want random data, we delegate that to `Faker`.

Now that we have a way to easily generate fake data, we can use it in our unit test:

```typescript
test("renders user information", async () => {
  const user = UserFactory.build();

  const handleDelete = jest.fn();

  render(<UserInfo user={user} onDelete={handleDelete} />);

  // Validate the fields
});
```

## Mock API

Our next step is to create a component that will display our list of users, but for that we need to get our list of users from somewhere, and since we have no live API at this point, we need to create a mock API. As I've mentioned previously we want to be able to reuse our mocks across both testing and development, so in order to standardize our approach to mocking we will be using [Unimocks](https://github.com/mic-c/unimocks) [^1].

First let's define our API and the Input/Output format of our request that we've mentioned in the conceptualizing stage. It will be a method that outputs an array of `User` objects and takes no input parameters.

```typescript
import { APIRequest, APIRequests, APIService } from  "unimocks";
-------------------------------
export interface UsersAPI extends APIRequests {
  getUsers: APIRequest<User[]>;
}
```

Now we can create an API object with both live and mock implementations of that requests. As mentioned previously we have completely separated the live and mock implementations, aside from being bound by the same I/O interface, so if we wanted, we could postpone the live implementation for a later date. But for demonstration purposes let's use axios to send our live API request.

```typescript
export const usersAPI = new APIService<UsersAPI>(
  "users",
  {
    getUsers: () => axios.get<User[]>("/users").then(({ data }) => data),
  },
  {
    mocks: {
      getUsers: () => UserFactory.buildList(10),
    },
  }
);
```

As we can see we've defined our live endpoint as well as provided a mock to generate 10 random users for us in development. `Unimocks` will substitute any calls to this method with the provided mocks, as well as help us out later with integration testing, which is what the `"users"` name will be used for.

### Build optimization

Something that might immediately come to mind is build optimization. Since we now have mocks that will be bundled into a production build, tagging along large libraries that we don't need. Depending on which bundler you are using there are different ways to negate that, but ultimately what we want is to remove the mocks from our api file.

Since this example is using Webpack, I've written a small loader that will remove code before bundling:

```javascript
module.exports = function (source) {
  return source.replace(
    /\/\*  *dev:start ?\*\/[\s\S]*?\*  *dev:end *\*\//g,
    ""
  );
};
```

So now let's move our mocks to a separate file and mark the code for deletion, thankfully Webpack's optimization will remove the unused import.

```typescript
import { mocks } from  "./users.mocks";
--------------------------------------
{
  /*dev:start*/  mocks, /*dev:end*/
}
```

Now all that is left is to add this loader to our webpack config. For a simple, but far from perfect, example of how to do that within CRA please see the repo.

## Data managed components

Now that we have our data querying layer set up, let's do the same for our data management layer. This isn't a layer every application will necessarily have, but if you're using React I would strongly recommend using [React Query](https://react-query.tanstack.com/), as it very easy to use and solves the overwhelming majority of data management scenarios that you are likely to run into. Let's create a simple hook to retrieve our list of users:

```typescript
import { usersAPI } from "./users.api";
export const useUsers = () => useQuery(["users"], () => usersAPI.requests.getUsers());
```

Now we can create our users list component to display what we get back from our ~~API~~ mocks.

```typescript
function App() {
  const { data } = useUsers();

  return (
    <div className="app">
      {data?.map((user) => (
        <UserInfo key={user.id} user={user} />
      ))}
    </div>
  );
}
```

## Integration testing

Since we've added unit tests to our simple components, let's add some integration testing for our more complex data-driven components. As mentioned previously we'll be using `Unimocks` to reuse the data generation in our integration testing as well. But first we need to setup [puppeteer](https://github.com/puppeteer/puppeteer) to actually run our tests.

### Puppeteer setup

We need our `puppeteer` to do several things: run tests via `jest`, accept typescript and run a dev-server to test against. First let's install all of the needed dependencies (there's quite a few):

```bash
npm i --save-dev puppeteer @types/puppeteer @types/expect-puppeteer @types/jest-environment-puppeteer jest-dev-server jest-puppeteer
```

Now let's go into our `tsconfig.json` and add the types we've just installed:

```json
"types": [
  "puppeteer",
  "jest-environment-puppeteer",
  "expect-puppeteer"
]
```

Next, let's configure all of the dependencies to work together, starting with our integration jest config. We would usually setup jest with the preset of `'jest-puppeteer'` to integrate with puppeteer. On the other hand we would also usually set up jest with the `'ts-jest'` preset, to write our tests with jest. The solution to that conflict is to use only the transformer config from ts-jest.

```javascript
const { defaults: tsJest } = require("ts-jest/presets");

process.env.JEST_PUPPETEER_CONFIG = require.resolve("./puppeteer.config.js");

module.exports = {
  preset: "jest-puppeteer",
  setupFilesAfterEnv: ["@testing-library/jest-dom", "expect-puppeteer"],
  testTimeout: 60000,
  transform: tsJest.transform,
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};
```

As you've probably noticed from the jest config, the next step is to configure puppeteer. Since we will potentially want to debug our integration tests, let's provide a debug option in the config to open up our browser and slow down the operations a bit, so we can see what is happening in the test. You can of course reconfigure this however you like.

```javascript
const config = {
  launch: {
    timeout: 30000,
    dumpio: true,
  },
};

const isDebugMode = process.argv.includes("--debug");

if (isDebugMode) {
  config.launch = {
    ...config.launch,
    headless: false,
    slowMo: 10,
    devtools: true,
    args: ["--start-maximized"],
  };
}

module.exports = config;
```

And finally the dev-server. Since we would potentially like to run our tests against an already running server, we separated the configs in two, let's add the second config for when we want jest to setup the server automatically.

```javascript
var baseConfig = require("./jest.config");

module.exports = {
  ...baseConfig,
  globalSetup: "./devserver.setup.js",
  globalTeardown: "./devserver.teardown.js",
};

// devserver.setup.js
const { setup: setupDevServer } = require("jest-dev-server");
const { setup: setupPuppeteer } = require("jest-environment-puppeteer");

module.exports = async (globalConfig) => {
  await setupPuppeteer(globalConfig);
  await setupDevServer({
    command: "npm run start",
    launchTimeout: 60000,
    debug: true,
    port: 3000,
  });
};

// devserver.teardown.js
const { teardown: teardownDevServer } = require("jest-dev-server");

const { teardown: teardownPuppeteer } = require("jest-environment-puppeteer");

module.exports = async (globalConfig) => {
  await teardownDevServer(globalConfig);
  await teardownPuppeteer();
};
```

Lastly we can add a couple of scripts to our `package.json` for the different ways in which our tests can be run:

```json
"test-integration": "jest --config ./puppeteer/jest.devserver.config.js",
"test-integration:serverless": "jest --config ./puppeteer/jest.config.js",
"test-integration:debug": "jest --config ./puppeteer/jest.config.js --debug",
```

### Integration mocks

Now that we can actually run integration tests let's see how `Unimocks` can help us with our data mocking.
First, let's go to our api object and add a new option:

```typescript
  {
    /*dev:start*/  mocks, /*dev:end*/,
    integrationMocks: !!process.env.REACT_APP_INTEGRATION
  }
```

We set this environment variable to be able to run a production-like version of our app, that will send mock requests handled by our integration setup. So let's add the script `"start-integration": "REACT_APP_INTEGRATION=true react-scripts start",` to our `package.json` and don't forget to change the `command` in `devserver.setup.js`.

Now that `Unimocks` is fully configured we can move on to the test in question, where we add the following to our `beforeAll`:

``` typescript
import { mockAPI } from 'unimocks/puppeteer';
----------------------------------------------------------
const userMocks = await mockAPI(usersAPI, page);
```

This will make sure all of the requests from `usersAPI` are intercepted and mocked, while allowing us to see the calls that were made and validate the request input via `userMocks.getUsers.calls` as well as create our custom scenarios for testing by modifying the responses with `userMocks.getUsers.setResponse` and `userMocks.getUsers.setError`.

As a result, not only did we reuse our development mocks without any additional complex code, but we also have access to a flexible tool for simulating and testing any scenario imaginable.

### Page object models

If you're new to puppeteer and come from a Selenium or TestCafe background, you're probably used to working with nestable and configurable POMs. Sadly puppeteer does not provide such a functionality, and most people simply opt to store selectors in their would-be POM's fields, which is neither comfortable, nor nestable. Thankfully there is a small and simple utility for creating proper POMs - [pompeteer](https://github.com/mic-c/pompeteer)[^2].

## Contract testing

The final part of our setup is contract testing that will make sure the live API is developed correctly. For contract testing we will be using [pact](https://docs.pact.io/) and the submodule `unimocks/pact`.

### Setup for Pact

The first step to integrate our contract tests and data generation with unimocks is to redefine our API by adding meta information needed for contract tests for each request and also transform it into a function with a baseURL for linking with Pact.

```typescript
const defaultBaseURL = "/api";

export const usersAPI = (baseURL = defaultBaseURL) =>
  new MetaAPIService<UsersAPI>(
    "users",
    {
      getUsers: metaRequest(
        ({ method, path }) => axios.request({ method, path }).then(({ data }) => data),
        { method: "GET", path: "/users" }
      ),
    },
    {
      /*dev:start*/ mocks /*dev:end*/,
      integrationMocks: !!process.env.REACT_APP_INTEGRATION,
    }
  );
```

If you don't like writing extra code, you can easily define a utility method for creating your request definitions with your http library of choice. Here is an example of such for `axios`.

```typescript
import axios, { Method } from "axios";

import { HTTPMethod, MetaAPIRequest, metaRequest } from "unimocks";

export const axiosRequest = <Output, Input>(options: {
  baseURL: string;
  method: HTTPMethod | ((input: Input) => HTTPMethod);
  path: string | ((input: Input) => string);
  query?: (input: Input) => {
    [name: string]: string;
  };
  headers?: (input: Input) => {
    [name: string]: string;
  };
  body?: (input: Input) => any;
}): MetaAPIRequest<Output, Input> =>
  metaRequest(
    (config) => axios
      .request({
        baseURL: options.baseURL,
        method: config.method as Method,
        url: config.path,
        params: config.query,
        headers: config.headers,
        data: config.body,
      })
      .then(({ data }) => data),
    options
  );
```

Making our code much more concise, especially for more complex requests.

```typescript
  getUsers: axiosRequest({ baseURL, method: 'GET', path: `/users`}),
```

There are also helpful functions `filterFields` and `weedOutFields`, which you can use to easily deconstruct which parts of the input you'd like to be put into the body, params or headers of the request.

```typescript
  updateUser: axiosRequest({ baseURL, method: 'PATCH', path: ({id}) => `/users/${id}`, body: weedOutFields(['id'])}),
```

Now that we have added metadata to our requests, we can use it to easily build interactions with pact via `ServiceInteractionBuilders`. But before we start, lets take a look at some of the best practices from Pact's docs.

> If you are using a Pact Broker to exchange pacts, then avoid using random data in your pacts. If a new pact is published that is exactly the same as a previous version that has already been verified, the existing verification results will be applied to the new pact publication. This means that you don't have to wait for the provider verification to run before deploying your consumer - you can go straight to prod. Random data makes it look like the contract has changed, and therefore you lose this optimization.

Though this may seem like a deal-breaker for our setup, it is actually quite simple to manage using `jest` by setting up mocks of our data generators.

![Xmockit](https://i.imgflip.com/6dgfae.jpg)

Let's create a Jest setup file for our pact testing and use a fake UserFactory, that wil produce predictable and consistent data.

```typescript
import { userFactory } from "./users.factory";
jest.mock("../../src/services/users/users.factory", () => userFactory);

//./users/factory.ts
import { makeFactory, each } from "factory.ts";

import { User } from "../../src/services/users/users.dto";

export const userFactory = {
  UserFactory: makeFactory<User>({
    id: each((i) => `user${i}`),
    firstName: "John",
    lastName: "Doe",
    job: "Professional Alcoholic",
    age: 33,
    email: "john.doe@drinkers.com",
  }),
};
```

And lastly let's add an appropriate script to run the contract tests:

`"test-contract": "jest --roots \"<rootDir>/pact/tests\" --setupFilesAfterEnv \"<rootDir>/pact/factory-mocks/setup.ts\" --detectOpenHandles --runInBand --testMatch=\"**/?(*.)+(pacttest).[tj]s?(x)\"",`

### Using ServiceInteractionBuilders

Now that we've set everything up we can finally begin writing pact tests that will generate predictable data without us having to define a mock response and request details for each test manually, thanks to our interaction builders, which we initialize before the tests.

```typescript
beforeEach(async () => {
  client = usersAPI(provider.mockService.baseUrl);
  interactions = setupInteractionBuilders(client, {
    resetEnv: () =>
      Object.values(userFactories).forEach((factory) =>
        factory.resetSequenceNumber()
      ),
  });
});
```

Since we want consistent data generation and running each request in isolation, we call `resetSequenceNumber` on each of our factories after building each interaction. Now let's add a simple test for our users GET endpoint.

```typescript
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
```

As we can see the use of interaction builders shortens the amount of code, and more importantly removes any duplication, be it with mock data or with http request definition, between the app code and the contract tests. At the same time it provides overrides for any and all areas, so you have just as much control as without it. Let's look at the test for user creation as an example.

```typescript
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
```

In this scenario we would like to make sure that the API returns the exact same values for all fields but the `id`, as the ones we've sent in the input. Since by default the response body will be purely a type match with the generated output body, we override the fields we want an exact match on with regex matchers.

> The syntax is subject to change in the near future with the release of a new pact-js version with better matching api.

# Conclusion

Though the setup for all of this may seem a bit much, once your project starts growing, the repetitive code you will have saved yourself from writing quickly outweighs the amount of effort to set everything up. Additionally the conceptual separation of data layers makes it easy to integrate with a live API or make any changes, while still being able to use mocks in testing and development.

## Tips
- You can quickly disable mocks for any service in development by commenting out the `mocks` option.

- Depending on how thorough you want your testing coverage to be, it may be a good idea to add an extra layer of small cross-browser smoke tests with live APIs.

- To avoid circular dependency and have a neater file structure I would advise having a `services` directory, with a sub-directory named after each service, i.e. `users`, that would contain all of the interfaces and api definitions in a `users.d.ts` or `users.types.ts` file, your api object in a `users.api.ts` file, your mocks in a `users.mocks.ts` file, your factories in a `users.factories.ts` file and finally your data management, which is the file most components will import, in a `users.services.ts` file.

- When running integration tests make sure to validate that the inputs of your requests are correct. Similarly when first adding dev mocks it may help to output the inputs that aren't used in the mock to make sure you haven't missed something.

- For more flexible and live-like CRUD mocks take a look at the `users.mocks.ts` file in the repo. This approach provides a lot more flexibility to properly test and demo your app than static mocks.

- Always check your generated contract to make sure your matchers ended up the way you intended.

[^1]: Disclosure: I am the author of Unimocks, so this guide is partially a demo of how to use it.

[^2]: I'm also the author of Pompeteer, so this was a shameless plug.

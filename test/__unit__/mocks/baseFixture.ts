import { createItemApi, type Item } from "./itemApi";
import { ApiClient, type IApiClient } from "./apiClient";
import { type IItemController, ItemController } from "./itemController";
import { createFixture } from "../../../src/container/fixture";
import { onlyValue } from "../../../src/container/fixtureUtils";
import type { ICrudApi } from "./crudApi";
import { createUserApi, type User } from "./userApi";

export type BaseContainer = {
  login: string;
  password: string;
  constructItem: (
    type: "draft" | "task" | "metatask",
    header: string,
    text: string,
  ) => Item;
  apiClient: IApiClient;
  itemApi: ICrudApi<Item>;
  userApi: ICrudApi<User>;
  itemController: IItemController;
};

export const createBaseAppFixture = () => {
  return createFixture<BaseContainer>({
    login: onlyValue("login"),
    password: onlyValue("password"),
    apiClient: ({ login, password }, use) =>
      use(new ApiClient(login, password)),
    itemApi: async ({ apiClient }, use) => use(await createItemApi(apiClient)),
    userApi: async ({ apiClient }, use) => use(await createUserApi(apiClient)),
    constructItem: onlyValue(
      (type: "draft" | "task" | "metatask", header: string, text: string) => ({
        type,
        header,
        text,
        id: ((Math.random() * 1000) % 1000) + "",
        comments: [],
      }),
    ),
    itemController: ({ itemApi, userApi }, use) =>
      use(new ItemController(itemApi, userApi)),
  });
};

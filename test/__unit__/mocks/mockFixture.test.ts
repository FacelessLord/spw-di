// noinspection ES6RedundantAwait

import { describe, expect, it } from "vitest";
import { createBaseAppFixture } from "./baseFixture";
import { createFixtureMock } from "../../../src/testing/mockFixture";
import { mockItemController } from "./mocks";
import { onlyValue } from "../../../src/container/fixtureUtils";
import { ApiClient } from "./apiClient";
import type { Item } from "./itemApi";
import type { User } from "./userApi";
import { ensureSuccess, isSuccess } from "./operationResult";

describe("mockFixture", () => {
  it("can't resolve deps when no dependencies redeclared", async () => {
    const fixture = createBaseAppFixture();
    const mockFixture = createFixtureMock(fixture);

    const container = mockFixture.buildContainer();
    await expect(
      async () => await container.resolveDependency("itemController"),
    ).rejects.toThrow(
      'Dependency value mock was not provided: "itemController"',
    );
  });
  it("can resolve redeclared dependencies", async () => {
    let fixture = createBaseAppFixture();
    let mockFixture = createFixtureMock(fixture);

    mockFixture = mockFixture.extend({
      itemController: onlyValue(mockItemController),
    });

    const container = mockFixture.buildContainer();
    const resolvedItemController =
      await container.resolveDependency("itemController");
    expect(resolvedItemController.value).toBe(mockItemController);
  });
  it("can't resolve partial transitive dependencies", async () => {
    const fixture = createBaseAppFixture();
    let mockFixture = createFixtureMock(fixture);
    mockFixture = mockFixture.extend({
      password: onlyValue("password2"),
    });

    const container = mockFixture.buildContainer();
    await expect(
      async () => await container.resolveDependency("apiClient"),
    ).rejects.toThrow('Dependency value mock was not provided: "apiClient"');
  });
  it("allows new dependencies to be introduced", async () => {
    const fixture = createBaseAppFixture();
    const mockFixture = createFixtureMock(fixture);

    const newMockFixture = mockFixture.extend<{
      passwordProvider: () => string;
    }>({
      passwordProvider: onlyValue(() => "new_password"),
      password: ({ passwordProvider }, use) => use(passwordProvider()),
    });

    const container = newMockFixture.buildContainer();
    const password = await container.resolveDependency("password");
    expect(password.value).toBe("new_password");
  });
  it("can resolve transitive dependencies", async () => {
    const fixture = createBaseAppFixture();
    let mockFixture = createFixtureMock(fixture);
    mockFixture = mockFixture.extend({
      password: onlyValue("password2"),
      login: onlyValue("login"),
    });

    const container = mockFixture.buildContainer();
    const apiClient = await container.resolveDependency("apiClient");
    expect(apiClient.value).toBeInstanceOf(ApiClient);
  });
  it("can execute with correct redeclarations", async () => {
    const fixture = createBaseAppFixture();
    let mockFixture = createFixtureMock(fixture);
    mockFixture = mockFixture.extend({
      password: onlyValue("password2"),
      login: onlyValue("login"),
    });

    const container = mockFixture.buildContainer();
    await container.execute(async ({ itemApi, userApi, itemController }) => {
      const item: Item = {
        id: "1",
        type: "metatask",
        header: "My task",
        text: "There is a long text, where I could've described my critical task, but I'd better say you just need to do good and to not do bad.",
        comments: [],
      };
      const user: User = {
        id: "1",
        name: "admin",
      };
      ensureSuccess(await itemApi.create(item));
      ensureSuccess(await userApi.create(user));
      ensureSuccess(await itemController.changeTaskType(item.id, "task"));
      ensureSuccess(await itemController.addComment(
        item.id,
        "This task was too meta",
        user.id,
      ));

      const updatedTaskResult = await itemApi.get(item.id);
      ensureSuccess(updatedTaskResult);
      expect(updatedTaskResult.value.type).toBe("task");
      expect(updatedTaskResult.value.comments).toHaveLength(1);
      expect(updatedTaskResult.value.comments[0]).toEqual({
        text: "This task was too meta",
        author: user,
      });
    });
  });
});

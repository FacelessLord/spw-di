import { describe, expect, it } from "vitest";
import { getConsumerDependencies } from "../../src/container/fixtureUtils";
import { ItemController } from "./mocks/itemController";
import type { ICrudApi } from "./mocks/crudApi";
import type { Item } from "./mocks/itemApi";
import type { User } from "./mocks/userApi";

describe("getConsumerDependencies", () => {
  describe("with simple consumer", () => {
    it("works with no deps", () => {
      const deps = getConsumerDependencies<{}>(async () => {});
      expect(deps).toEqual([]);
    });
    it("works with empty deps", () => {
      const deps = getConsumerDependencies<{ aasfas: number; basf: string }>(
        async ({}) => {},
      );
      expect(deps).toEqual([]);
    });
    it("works with one dep", () => {
      const deps = getConsumerDependencies<{ a: number }>(async ({ a }) => {});
      expect(deps).toEqual(["a"]);
    });
    it("works with multiple dep", () => {
      const deps = getConsumerDependencies<{ aasfas: number; basf: string }>(
        async ({ aasfas, basf }) => {
          return basf + aasfas;
        },
      );
      expect(deps).toEqual(["aasfas", "basf"]);
    });
    it("works with multiple dep 2", () => {
      const deps = getConsumerDependencies<{
        itemApi: ICrudApi<Item>;
        userApi: ICrudApi<User>;
      }>(async ({ itemApi, userApi }, use) =>
        use(new ItemController(itemApi, userApi)),
      );
      expect(deps).toEqual(["itemApi", "userApi"]);
    });
  });
  describe("with declaration", () => {
    it("works with empty deps", () => {
      const deps = getConsumerDependencies<{ aasfas: number; basf: string }>(
        async ({}, use) => {},
      );
      expect(deps).toEqual([]);
    });
    it("works with one dep", () => {
      const deps = getConsumerDependencies<{ a: number }>(
        async ({ a }, use) => a,
      );
      expect(deps).toEqual(["a"]);
    });
    it("works with multiple dep", () => {
      const deps = getConsumerDependencies<{ aasfas: number; basf: string }>(
        async ({ aasfas, basf }, use) => {
          return basf + aasfas;
        },
      );
      expect(deps).toEqual(["aasfas", "basf"]);
    });
  });
});

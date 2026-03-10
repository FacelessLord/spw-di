// noinspection ES6RedundantAwait

import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { type Provider, use } from "react";
import {
  createFixture,
  type Declaration,
  type Fixture,
} from "../../src/container/fixture";
import { defaultValue } from "../../src/container/fixtureUtils";

type BaseContainer = {
  a: number;
  b: string;
};
type FixtureC = {
  c: string;
};

const aProvider: Declaration<number, BaseContainer> = ({}, use) => use(7);

const bProvider: Declaration<string, BaseContainer> = ({}, use) => use("abc");

const cProvider: Declaration<string, BaseContainer> = ({ a, b }, use) =>
  use((b as string).repeat(a as number));

describe("fixture", () => {
  it("can be created", async () => {
    const fixture = createFixture<BaseContainer>({
      a: aProvider,
      b: bProvider,
    });

    expectTypeOf(fixture).toEqualTypeOf<Fixture<BaseContainer>>();
    const container = fixture.buildContainer();
    const disposableA = await container.resolveDependency("a");
    expect(disposableA.value).toBe(7);
    const disposableB = await container.resolveDependency("b");
    expect(disposableB.value).toBe("abc");
  });
  it("errors when asked unknown dependency", async () => {
    const fixture = createFixture<BaseContainer>({
      a: aProvider,
      b: bProvider,
    });

    const container = fixture.buildContainer();

    await expect(
      // @ts-expect-error dependency "c" is not defined
      async () => await container.resolveDependency("c"),
    ).rejects.toThrowError('Invalid required dependency "c"');
  });

  it("can be extended", async () => {
    const fixture = createFixture<BaseContainer>({
      a: aProvider,
      b: bProvider,
    });

    const extendedFixture = fixture.extend<FixtureC>({
      c: cProvider,
    });

    const container = extendedFixture.buildContainer();
    const disposableC = await container.resolveDependency("c");
    expect(disposableC.value).toBe("abcabcabcabcabcabcabc");
  });

  it("allows dependency redeclaration", async () => {
    const fixture = createFixture<BaseContainer>({
      a: aProvider,
      b: bProvider,
    });

    const extendedFixture = fixture.extend<{ a: number }>({
      a: ({}, use) => use(6),
    });

    const container = extendedFixture.buildContainer();
    const disposableA = await container.resolveDependency("a");
    expect(disposableA.value).toBe(6);
  });

  it("type-errors on dependency type redeclaration", async () => {
    const fixture = createFixture<BaseContainer>({
      a: aProvider,
      b: bProvider,
    });

    // @ts-expect-error you mustn't redeclare dependency type. It is probably unintended
    const extendedFixture = fixture.extend<{ a: string }>({
      a: ({}, use) => use(""),
    });
  });

  it("requires deconstructed argument", async () => {
    const fixture = createFixture<BaseContainer>({
      a: (container, use) => use(7),
      b: bProvider,
    });

    expect(() => fixture.buildContainer()).toThrowError(
      "Selector must be arrow-function with deconstructed argument",
    );
  });

  it("required dependency have to be defined", async () => {
    const fixture = createFixture<BaseContainer>({
      a: [undefined, { default: undefined }],
      b: bProvider,
    });

    expect(() => fixture.buildContainer()).toThrowError(
      'Dependency value not defined: "a"',
    );
  });

  it("non-required dependency don't have to be defined", async () => {
    const fixture = createFixture<BaseContainer>({
      a: [undefined, { default: undefined, required: false }],
      b: bProvider,
    });

    const container = fixture.buildContainer();
    const a = await container.resolveDependency("a");
    expect(a.value).toBeUndefined();
  });

  it("detects declarations with no value or config", async () => {
    const fixture = createFixture<BaseContainer>({
      a: [undefined],
      b: bProvider,
    });

    expect(() => fixture.buildContainer()).toThrowError('Bad declaration "a"');
  });
  it("stops when declaration throws an error", async () => {
    const fixture = createFixture<BaseContainer>({
      a: ({}, use) => {
        throw new Error("F");
      },
      b: bProvider,
    });

    const container = fixture.buildContainer();
    await expect(
      async () => await container.resolveDependency("a"),
    ).rejects.toThrowError('Error during resolution of "a": F');
  });

  it("resolution does not clear evaluated values", async () => {
    const fixture = createFixture<{
      a: number;
      b: number;
      c: [number, number];
    }>({
      a: ({}, use) => use(Math.random()),
      b: ({ a }, use) => use(a),
      c: ({ a, b }, use) => use([a, b] as const),
    });

    const container = fixture.buildContainer();

    const {
      value: [a, b],
    } = await container.resolveDependency("c");

    expect(a).toBe(a);
  });

  it("resolution in execution does not clear evaluated values", async () => {
    const fixture = createFixture<{
      a: number;
      b: number;
    }>({
      a: ({}, use) => use(Math.random()),
      b: ({ a }, use) => use(a),
    });

    const container = fixture.buildContainer();

    await container.execute(async ({ a, b }) => {
      expect(a).toBe(b);
    });
  });

  it("detects recursion", async () => {
    const fixture = createFixture<{ a: number; b: number; c: number }>({
      a: ({ b }, use) => use(b + 1),
      b: ({ c }, use) => use(c + 1),
      c: ({ a }, use) => use(a + 1),
    });

    expect(() => fixture.buildContainer()).toThrowError(
      `Recursion detected while resolving "c".\nRecursion path: c->a->b->c`,
    );
  });

  it("allows declaration override", async () => {
    const fixture = createFixture<BaseContainer>({
      a: aProvider,
      b: bProvider,
    });

    const extendedFixture = fixture.extend<{ a: number }>({
      a: ({}, use) => use(6),
    });

    const container = extendedFixture.buildContainer();
    const disposableA = await container.resolveDependency("a");
    expect(disposableA.value).toBe(6);
  });

  it("allows execution", async () => {
    const fixture = createFixture<BaseContainer>({
      a: aProvider,
      b: bProvider,
    });

    const container = fixture.buildContainer();
    const result = await container.execute(async ({ a, b }) => {
      return b.repeat(a);
    });
    expect(result).toBe("abcabcabcabcabcabcabc");
  });

  it("singleton config saves execution results between runs but disposing clears values", async () => {
    type RandomFixture = {
      seed: number;
      random: () => number;
      a: number;
      b: number;
    };

    let seed = 1;
    const fixture = createFixture<RandomFixture>({
      seed: [
        async ({}, use) => {
          await use(seed);
          seed += 1;
        },
        {
          singleton: true,
        },
      ],
      random: async ({ seed }, use) => {
        let rngState = seed;
        const next = () => {
          const nextState = (137 * rngState + 271) % 109;
          rngState = nextState;
          return nextState / 109;
        };
        await use(next);
      },
      a: ({ random }, use) => use(random()),
      b: ({ random }, use) => use(random()),
    });

    const container = fixture.buildContainer();

    const runner = async ({ a, b }) => {
      return { a, b };
    };

    const result1 = await container.execute(runner);
    const result2 = await container.execute(runner);
    expect(result1.a).toBe(result2.a);
    expect(result1.b).toBe(result2.b);
    await container.reset();
    const result3 = await container.execute(runner);
    expect(result3.a).not.toBe(result1.a);
    expect(result3.b).not.toBe(result1.b);
  });

  it("throws on singleton from non-singleton", async () => {
    type RandomFixture = {
      seed: number;
      random: () => number;
      a: number;
      b: number;
    };

    let seed = 1;
    const fixture = createFixture<RandomFixture>({
      seed: async ({}, use) => {
        await use(seed);
        seed += 1;
      },
      random: [
        async ({ seed }, use) => {
          let rngState = seed;
          const next = () => {
            const nextState = (137 * rngState + 271) % 109;
            rngState = nextState;
            return nextState / 109;
          };
          await use(next);
        },
        {
          singleton: true,
        },
      ],
      a: ({ random }, use) => use(random()),
      b: ({ random }, use) => use(random()),
    });

    expect(() => fixture.buildContainer()).toThrowError(
      'Singleton from non-singleton detected when resolving "random"',
    );
  });

  it("doesn't throw on singleton from non-singleton when allowed", async () => {
    type RandomFixture = {
      seed: number;
      random: () => number;
      a: number;
      b: number;
    };

    let seed = 1;
    const fixture = createFixture<RandomFixture>({
      seed: async ({}, use) => {
        await use(seed);
        seed += 1;
      },
      random: [
        async ({ seed }, use) => {
          let rngState = seed;
          const next = () => {
            const nextState = (137 * rngState + 271) % 109;
            rngState = nextState;
            return nextState / 109;
          };
          await use(next);
        },
        {
          singleton: true,
          allowSingletonFromNonSingleton: true,
        },
      ],
      a: ({ random }, use) => use(random()),
      b: ({ random }, use) => use(random()),
    });

    fixture.buildContainer();
  });
});

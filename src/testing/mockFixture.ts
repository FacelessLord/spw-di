import type {
  Declaration,
  Declarations,
  Fixture,
} from "../container/fixture.ts";
import type { Join } from "../container/types/join.ts";
import { buildContainer } from "../container/container.ts";
import {
  constructDependencyMap,
  type DependencyMap,
} from "../container/checks/constructDependencyMap.ts";

export type MockFixture<S extends {}> = Omit<Fixture<S>, "extend"> & {
  extend<const T extends Partial<S> & Object>(
    declarations: Partial<Declarations<T & Partial<S>, S>>,
  ): MockFixture<Join<S, T>>;
  __mockedDeps: (keyof S & string)[];
};

export const createFixtureMock = <const S extends {}>(
  fixture: Fixture<S>,
  mockedDeps: (keyof S & string)[] = [],
): MockFixture<S> => {
  return {
    extend<const T extends Partial<S> & Object>(
      declarations: Declarations<T & Partial<S>, S>,
    ): MockFixture<Join<S, T>> {
      const newFixture = fixture.extend(declarations);
      return createFixtureMock<Join<S, T>>(newFixture, [
        ...this.__mockedDeps,
        ...Object.keys(declarations),
      ] as (keyof Join<S, T> & string)[]);
    },
    __mockedDeps: mockedDeps,
    __decls: fixture.__decls,
    buildContainer() {
      const baseDeclarations = fixture.__decls;
      const dependencyMap = constructDependencyMap(baseDeclarations);
      const closure = getDependencyClosure(this.__mockedDeps, dependencyMap);

      const mockDeclarations = {} as Declarations<S>;

      for (const dep in baseDeclarations) {
        mockDeclarations[dep] = closure.has(dep)
          ? baseDeclarations[dep]
          : (undefinedDeclaration<S, Extract<keyof S, string>>(
              dep,
            ) as Declarations<S>[typeof dep]);
      }

      return buildContainer<S>(mockDeclarations);
    },
  };
};
const getDependencyClosure = <const S extends {}>(
  keys: (keyof S & string)[],
  dependencyMap: DependencyMap<S>,
) => {
  const closure = new Set<string>(keys);

  for (let i = 0; i < Object.keys(dependencyMap).length; i++) {
    for (const key in dependencyMap) {
      if(closure.has(key))
        continue;
      const deps = dependencyMap[key as keyof DependencyMap<S>].dependencies;
      if (!deps.length) continue;
      if (deps.every((dep) => closure.has(dep))) closure.add(key);
    }
  }
  return closure;
};

const undefinedDeclaration =
  <const S extends {}, Key extends Extract<keyof S, string>>(
    key: Key,
  ): Declaration<S[Key], S> =>
  async ({}) => {
    throw new Error(`Dependency value mock was not provided: "${key}"`);
  };

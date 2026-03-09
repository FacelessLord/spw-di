import type { Config, Declarations } from "../fixture.ts";
import { declarationReader, getConsumerDependencies } from "../fixtureUtils.ts";

export type DependencyNode<S extends {}> = {
  dependencies: (keyof S & string)[];
  config: Config<unknown>;
};

export type DependencyMap<S extends {}> = Record<
  keyof S & string,
  DependencyNode<S>
>;

export const constructDependencyMap = <const S extends {}>(
  declarations: Declarations<S, {}>,
): Record<keyof S & string, DependencyNode<S>> => {
  const dependencyMap = {} as Record<keyof S, DependencyNode<S>>;
  const readDeclaration = declarationReader<S>();

  for (const declarationKey in declarations) {
    const { declaration, config } = readDeclaration(
      declarationKey,
      declarations[declarationKey],
    );
    if (!declaration) {
      if (config.required && config.default === undefined) {
        throw new Error(`Dependency value not defined "${declarationKey}"`);
      }
      dependencyMap[declarationKey] = {
        dependencies: [],
        config,
      } as DependencyNode<S>;
      continue;
    }
    dependencyMap[declarationKey] = {
      dependencies: getConsumerDependencies<S>(declaration),
      config,
    } as DependencyNode<S>;
  }
  return dependencyMap;
};

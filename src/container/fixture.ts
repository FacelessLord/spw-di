import type { Join } from "./types/join.ts";
import { buildContainer, type Container } from "./container.ts";

type ValueFactory<T, S extends {}> = (
  container: S,
  use: (t: T) => Promise<void>,
) => Promise<void>;

export type RawDeclaration<T, S extends {}> = ValueFactory<T, S>;

export type Config<T> = {
  singleton: boolean;
  allowSingletonFromNonSingleton: boolean;
  default: T;
  required: boolean;
};

export type Declaration<T, S extends {}> =
  | RawDeclaration<T, S>
  | [RawDeclaration<T, S>, Partial<Config<T>>?]
  | [undefined, Partial<Config<T>> & { default: T }];

export type Declarations<T extends {}, S extends {}={}> = {
  [k in keyof T]: Declaration<T[k], Omit<Join<S, T>, k>>;
};

export type Fixture<S extends {}> = {
  __decls: Declarations<S>;
  extend<const T extends Partial<S> & Object>(
    declarations: Declarations<T, S>,
  ): Fixture<Join<S, T>>;
  buildContainer: () => Container<S>;
};

export const createFixture = <const S extends {}>(
  declarations: Declarations<S>,
): Fixture<S> => {
  return {
    __decls: declarations,
    extend: <const T extends {}>(newDecls: Declarations<T, S>) => {
      const resultDecls = { ...declarations, ...newDecls } as Declarations<
        Join<S, T>,
        {}
      >;
      return createFixture(resultDecls);
    },
    buildContainer: () => buildContainer(declarations),
  };
};

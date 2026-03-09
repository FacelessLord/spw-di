import type { Join } from "./types/join.ts";
import { buildContainer, type Container } from "./container.ts";

type ValueFactory<T, S extends Object> = (
  container: S,
  use: (t: T) => Promise<void>,
) => Promise<void>;

export type RawDeclaration<T, S extends Object> = ValueFactory<T, S>;

export type Config<T> = {
  singleton: boolean;
  allowSingletonFromNonSingleton: boolean;
  default: T;
  required: boolean;
};

export type Declaration<T, S extends Object> =
  | RawDeclaration<T, S>
  | [RawDeclaration<T, S>, Partial<Config<T>>?]
  | [undefined, Partial<Config<T>> & { default: T }];

export type Declarations<T extends Object, S extends Object> = {
  [k in keyof T]: Declaration<T[k], Omit<Join<S, T>, k>>;
};

export type Fixture<S extends Object> = {
  __decls: Declarations<S, {}>;
  extend<const T extends Partial<S> & Object>(
    declarations: Declarations<T, S>,
  ): Fixture<Join<S, T>>;
  buildContainer: () => Container<S>;
};

export const createFixture = <const S extends Object>(
  declarations: Declarations<S, {}>,
): Fixture<S> => {
  return {
    __decls: declarations,
    extend: <const T extends Object>(newDecls: Declarations<T, S>) => {
      const resultDecls = { ...declarations, ...newDecls } as Declarations<
        Join<S, T>,
        {}
      >;
      return createFixture(resultDecls);
    },
    buildContainer: () => buildContainer(declarations),
  };
};

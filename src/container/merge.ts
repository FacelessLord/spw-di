import type { Join } from "./types/join.ts";
import {
  createFixture,
  type Declarations,
  type Fixture,
} from "./fixture.ts";

type DFixture<T extends Object> = {} extends T ? undefined : Fixture<T>;

export function merge<
  const A extends Object,
  const B extends Object,
  const C extends Object = {},
  const D extends Object = {},
  const E extends Object = {},
  const F extends Object = {},
  const G extends Object = {},
>(
  a: DFixture<A>,
  b: DFixture<B>,
  c?: DFixture<C>,
  d?: DFixture<D>,
  e?: DFixture<E>,
  f?: DFixture<F>,
  g?: DFixture<G>,
): Fixture<Join<A, B, C, D, E, F, G>> {
  const fixtures = [a, b, c, d, e, f, g].filter(Boolean).map((x) => x!);
  let resultDecls = {};
  for (const fixture of fixtures) {
    resultDecls = { ...resultDecls, ...fixture.__decls };
  }
  return createFixture(
    resultDecls as Declarations<Join<A, B, C, D, E, F, G>, {}>,
  );
}

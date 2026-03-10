import type { Join } from "./types/join.ts";
import { createFixture, type Declarations, type Fixture } from "./fixture.ts";
import type { MockFixture } from "../testing/mockFixture.ts";

type DFixture<T extends {}> = {} extends T
  ? undefined
  : Fixture<T> | MockFixture<T>;

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
  const mockedDeps: string[] = [];
  for (const fixture of fixtures) {
    resultDecls = { ...resultDecls, ...fixture.__decls };
    if ("__mockedDeps" in fixture) mockedDeps.push(...fixture.__mockedDeps);
  }
  const fixture = createFixture(
    resultDecls as Declarations<Join<A, B, C, D, E, F, G>>,
  );

  if (mockedDeps.length) {
    const mockFixture = fixture as MockFixture<Join<A, B, C, D, E, F, G>>;
    mockFixture.__mockedDeps = mockedDeps as (keyof Join<A, B, C, D, E, F, G> &
      string)[];
    return mockFixture;
  }

  return fixture;
}

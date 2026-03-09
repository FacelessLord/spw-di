import type { Prettify } from "./prettify.ts";
import type { PropagateNever } from "./propagateNever.ts";

type JoinTwo<A, B> = {} extends A
  ? B
  : PropagateNever<
      Prettify<{
        [key in keyof (A & B)]: key extends keyof A
          ? key extends keyof B
            ? B[key] extends A[key]
              ? B[key]
              : never
            : A[key]
          : key extends keyof B
            ? B[key]
            : never;
      }>
    >;
type JoinThree<A, B, C> = JoinTwo<JoinTwo<A, B>, C>;
type JoinFour<A, B, C, D> = JoinThree<JoinTwo<A, B>, C, D>;
type JoinFive<A, B, C, D, E> = JoinFour<JoinTwo<A, B>, C, D, E>;
type JoinSix<A, B, C, D, E, F> = JoinFive<JoinTwo<A, B>, C, D, E, F>;
type JoinSeven<A, B, C, D, E, F, G> = JoinSix<JoinTwo<A, B>, C, D, E, F, G>;

export type Join<A, B, C = {}, D = {}, E = {}, F = {}, G = {}> = {} extends G
  ? {} extends F
    ? {} extends E
      ? {} extends D
        ? {} extends C
          ? JoinTwo<A, B>
          : JoinThree<A, B, C>
        : JoinFour<A, B, C, D>
      : JoinFive<A, B, C, D, E>
    : JoinSix<A, B, C, D, E, F>
  : JoinSeven<A, B, C, D, E, F, G>;

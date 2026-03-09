export type PropagateNever<T, K extends keyof T = keyof T> = 0 extends (
  K extends string ? (T[K] extends never ? 0 : 1) : never
)
  ? never
  : T;

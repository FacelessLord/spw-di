
export type Disposable<T> = {
  value: T;
  dispose: () => Promise<void>;
};


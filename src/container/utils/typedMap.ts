import type { Disposable } from "./disposable.ts";

export class TypedCache<const S extends Object> {
  private cache: Map<keyof S, Disposable<S[keyof S]>> = new Map();
  public async getOrCreate<const Key extends keyof S & string>(
    key: Key,
    factory: () => Promise<Disposable<S[Key]>>,
  ): Promise<Disposable<S[Key]>> {
    if (this.cache.has(key)) {
      return this.cache.get(key)! as Disposable<S[Key]>;
    }
    const disposable = await factory();
    const cacheDispose = async () => {
      await disposable.dispose();
      this.cache.delete(key);
    };
    const cacheDisposable: Disposable<S[Key]> = {
      value: disposable.value,
      dispose: cacheDispose,
    };

    this.cache.set(key, cacheDisposable);

    return cacheDisposable;
  }
}

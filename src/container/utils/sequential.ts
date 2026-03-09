export const sequential = async <T>(
  promises: (() => Promise<T>)[],
): Promise<T[]> => {
  const values = [];
  for await (const promise of promises) {
    values.push(await promise());
  }
  return values;
};

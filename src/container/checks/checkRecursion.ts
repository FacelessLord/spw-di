import { type DependencyMap } from "./constructDependencyMap.ts";

export const checkRecursionInPlace = <
  const S extends {},
  const Key extends keyof S & string,
>(
  dependencyKey: Key,
  resolutionStack: string[],
) => {
  if (resolutionStack.includes(dependencyKey)) {
    const recursionPath = resolutionStack.slice(
      resolutionStack.indexOf(dependencyKey),
    );
    recursionPath.push(dependencyKey);
    throwRecursionDetectedError(dependencyKey, recursionPath);
  }
};

export const checkRecursion = <const S extends Object>(
  dependencyMap: DependencyMap<S>,
) => {
  const starts = Object.keys(dependencyMap);

  for (const start of starts) {
    const path: string[] = [];
    const stack: (keyof S & string)[][] = [[start]];
    while (stack.length) {
      while (stack[stack.length - 1].length) {
        const current = stack[stack.length - 1].pop()!;
        if (path.includes(current)) {
          const recursionPath = path.slice(path.indexOf(current));
          recursionPath.push(current);
          throwRecursionDetectedError(current, recursionPath);
        }

        if (dependencyMap[current].dependencies.length) {
          path.push(current);
          stack.push([...dependencyMap[current].dependencies]);
        }
      }
      stack.pop();
    }
  }
};

const throwRecursionDetectedError = (
  dependencyKey: string,
  recursionPath: string[],
): never => {
  throw new Error(
    `Recursion detected while resolving "${dependencyKey}".\nRecursion path: ${recursionPath.join("->")}`,
  );
};

import { type DependencyMap } from "./constructDependencyMap.ts";

export const checkSingletonFromNonSingleton = <const S extends Object>(
  dependencyMap: DependencyMap<S>,
) => {
  const deps = Object.keys(dependencyMap);

  for (const dep of deps) {
    const node = dependencyMap[dep];
    if(!node.config.singleton || node.config.allowSingletonFromNonSingleton)
      continue;

    const nodeDeps = node.dependencies;
    const hasNonSingletonDeps = nodeDeps.some(d => !dependencyMap[d].config.singleton);
    if(hasNonSingletonDeps){
      throwSingletonDeclarationError(dep);
    }
  }
};

const throwSingletonDeclarationError = (
  dependencyKey: string,
): never => {
  throw new Error(
    `Singleton from non-singleton detected when resolving "${dependencyKey}"`,
  );
};

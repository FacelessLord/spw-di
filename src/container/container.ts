import type { Declarations } from "./fixture.ts";
import { TypedCache } from "./utils/typedMap.ts";
import type { Disposable } from "./utils/disposable.ts";
import { noopAsync } from "./utils/noop.ts";
import { sequential } from "./utils/sequential.ts";
import { declarationReader, getConsumerDependencies } from "./fixtureUtils.ts";
import {
  checkRecursion,
  checkRecursionInPlace,
} from "./checks/checkRecursion.ts";
import { constructDependencyMap } from "./checks/constructDependencyMap.ts";
import { checkSingletonFromNonSingleton } from "./checks/checkSingletonFromNonSingleton.ts";

export type Container<S extends {}> = {
  execute: <R>(consumer: (container: S) => Promise<R>) => Promise<R>;
  resolveDependency<Key extends keyof S & string>(
    key: Key,
    resolutionStack?: string[],
    intermediateContainer?: Partial<S>,
    disposes?: (() => Promise<void>)[],
  ): Promise<Disposable<S[Key]>>;
  reset: () => Promise<void>;
};

export const buildContainer = <S extends {}>(
  declarations: Declarations<S>,
  disableRecursionCheckOnBuild: boolean = false,
): Container<S> => {
  const readDeclaration = declarationReader<S>();
  const cache = new TypedCache<S>();
  const singletonDisposes: (() => Promise<void>)[] = [];

  const dependencyMap = constructDependencyMap(declarations);
  if (!disableRecursionCheckOnBuild) checkRecursion(dependencyMap);
  checkSingletonFromNonSingleton(dependencyMap);

  return {
    async execute<R>(consumer: (container: S) => Promise<R>): Promise<R> {
      const consumerDeps = getConsumerDependencies<S>(consumer);
      const dependencies: Partial<S> = {};
      const cleanups: (() => Promise<void>)[] = [];
      for (const dep of consumerDeps) {
        const disposable = await this.resolveDependency(dep, [], dependencies);
        dependencies[dep] = disposable.value;
        cleanups.push(disposable.dispose);
      }

      const value = await consumer(dependencies as S);
      await sequential(cleanups.reverse());
      return value;
    },
    async resolveDependency<const Key extends keyof S & string>(
      dependencyKey: Key,
      resolutionStack?: string[],
      intermediateContainer?: Partial<S>,
      disposes?: (() => Promise<void>)[],
    ) {
      if (!(dependencyKey in declarations))
        throw new Error(`Invalid required dependency "${dependencyKey}"`);
      resolutionStack = resolutionStack ?? [];
      intermediateContainer = intermediateContainer ?? {};
      disposes = disposes ?? [];

      if (dependencyKey in intermediateContainer) {
        return {
          value: intermediateContainer[dependencyKey]!,
          dispose: noopAsync,
        };
      }
      if (disableRecursionCheckOnBuild)
        checkRecursionInPlace<S, Key>(dependencyKey, resolutionStack);

      const { declaration, config } = readDeclaration(
        dependencyKey,
        declarations[dependencyKey],
      );

      if (!declaration) {
        if (config.required && config.default === undefined) {
          throw new Error(`Dependency value not defined "${dependencyKey}"`);
        }
        return {
          value: config.default,
          dispose: noopAsync,
        };
      }

      const dependencyFactory = async (): Promise<Disposable<S[Key]>> => {
        for (const dep of dependencyMap[dependencyKey].dependencies) {
          const disposable = await this.resolveDependency(
            dep,
            [...resolutionStack, dependencyKey],
            intermediateContainer,
            disposes,
          );
          intermediateContainer[dep] = disposable.value;
          // singleton disposes should only be added once
          if (!disposes?.includes(disposable.dispose))
            disposes.push(disposable.dispose);
        }

        let resolveValue: ((value: S[Key]) => void) | undefined = undefined;
        let rejectValue: ((e: unknown) => void) | undefined = undefined;
        const usePromise = new Promise<S[Key]>((resolve, reject) => {
          resolveValue = resolve;
          rejectValue = reject;
        });

        let resolveUse: (() => void) | undefined = undefined;
        const use = async (resolvedValue: S[Key]) => {
          resolveValue!(resolvedValue);
          return new Promise<void>((resolve) => (resolveUse = resolve));
        };

        const declarationPromise = declaration(
          intermediateContainer as S,
          use,
        ).catch((e) => {
          rejectValue?.(e);
        });

        return {
          value: await usePromise,
          dispose: async () => {
            resolveUse?.();
            await declarationPromise;
          },
        };
      };

      if (config.singleton) {
        const disposable = await cache.getOrCreate(
          dependencyKey,
          dependencyFactory,
        );
        if (!singletonDisposes.includes(disposable.dispose))
          singletonDisposes.push(disposable.dispose);

        return {
          value: disposable.value,
          dispose: noopAsync,
        };
      }
      try {
        return await dependencyFactory();
      } catch (e: unknown) {
        const errorMessage =
          e instanceof Object && "message" in e ? " " + e.message : null;
        throw new Error(
          `Error during resolution of "${dependencyKey}":` + errorMessage,
          {
            cause: e,
          },
        );
      }
    },
    reset: async () => {
      const disposes = singletonDisposes.reverse();
      for (const dispose of disposes) {
        await dispose();
      }
    },
  };
};

import type { Config, Declaration, RawDeclaration } from "./fixture.ts";

export const defaultValue = <T>(t: T): Declaration<T, Object> => [
  undefined,
  {
    default: t,
    required: !!t,
  },
];
const defaultConfig: Config<never> = {
  singleton: false,
  allowSingletonFromNonSingleton: false,
  required: true,
  default: undefined as never,
};

export const declarationReader =
  <const S extends {}>() =>
  <const Key extends keyof S & string, D extends S[Key] = S[Key]>(
    key: Key,
    declaration: Declaration<D, S>,
  ): { declaration: RawDeclaration<D, S> | undefined; config: Config<D> } => {
    if (Array.isArray(declaration)) {
      if (declaration.length === 1) {
        if (!declaration[0]) throw new Error(`Bad declaration "${key}"`);
        return { declaration: declaration[0], config: defaultConfig };
      }
      return {
        declaration: declaration[0],
        config: { ...defaultConfig, ...declaration[1] },
      };
    }
    return { declaration, config: defaultConfig };
  };

export const getConsumerDependencies = <const S extends {}>(
  consumer: (
    container: S,
    use: (u: unknown) => Promise<void>,
  ) => Promise<unknown>,
): (keyof S & string)[] => {
  const functionString = consumer.toString();

  if (functionString.startsWith("function")) throwInvalidSelectorError();

  let argumentsString = functionString.split("=>")[0].trim();
  argumentsString = argumentsString.replace("async", "").trim();

  if (argumentsString.endsWith("use)")) {
    argumentsString = argumentsString.replace(",use", "").replace(", use", "");
  }

  if (!argumentsString.includes("{") && argumentsString.length > 2)
    throwInvalidSelectorError();

  if (argumentsString.length === 2) return [];

  const argNamesString = argumentsString.substring(
    2,
    argumentsString.length - 2,
  );

  if (argNamesString === "") return [];
  return argNamesString
    .split(",")
    .map((a) => (a.includes(":") ? a.split(":")[0] : a))
    .map((e) => e.trim()) as (keyof S & string)[];
};

const throwInvalidSelectorError = (): never => {
  throw new Error(
    "Selector must be arrow-function with deconstructed argument",
  );
};

type Factory<T> = (...args: unknown[]) => T
type Value<T> = Factory<T> | T;
type ProviderOptions = Partial<{ singleton: boolean }> | undefined;
type Provider<T> = Value<T> | [Value<T>, ProviderOptions]

export class Container {
    private readonly providersList;
    private readonly providerMap: Record<string, any>;
    private readonly cache: Map<Factory<unknown>, any> = new Map();

    constructor(providers: any[]) {
        this.providersList = providers;
        this.providerMap = Object.assign({}, ...this.providersList);
    }

    public select<T>(selector: Provider<T>, options?: ProviderOptions): T {
        if (Array.isArray(selector)) {
            options = selector[1]
            selector = selector[0];
        }

        if (!this.isFunction(selector))
            return selector;

        if (options?.singleton && this.cache.has(selector))
            return this.cache.get(selector) as T;

        const dependencyNames = this.getSelectorDependencies(selector);
        const extractedDeps = Object.fromEntries(dependencyNames.map(name => [name, this.select(this.providerMap[name])]));
        const value = selector(extractedDeps);

        if (options?.singleton) {
            this.cache.set(selector, value);
        }
        return value
    }

    public merge(containers: Container[]): Container {
        const allProviders = [...this.providersList];
        allProviders.push(...containers.flatMap(container => container.providersList));

        return new Container(allProviders);
    }

    public extend(provider: Record<string, Provider<unknown>>): Container {
        return new Container([...this.providersList, provider])
    }

    private isFunction<T>(selector: Provider<T>): selector is Factory<T> {
        return typeof selector === "function";
    }

    private getSelectorDependencies(selector: Function): string[] {
        const functionString = selector.toString();

        if (functionString.startsWith("function"))
            this.throwInvalidSelectorError();

        const argumentsString = functionString.split("=>")[0].trim();
        if (!argumentsString.includes('{') && argumentsString.length > 2)
            this.throwInvalidSelectorError();

        if (argumentsString.length === 2)
            return [];

        const argNamesString = argumentsString.substring(2, argumentsString.length - 2);

        return argNamesString.split(',')
            .map(a => a.includes(":") ? a.split(":")[0] : a)
            .map(e => e.trim());
    }

    private throwInvalidSelectorError(): never {
        throw new Error("Selector must be arrow-function with deconstructed argument");
    }
}
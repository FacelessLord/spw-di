import {describe, expect, it, vi} from "vitest";
import {Container} from "../../src/container";

type FixtureA = {
    a: number,
}
type FixtureB = {
    b: string;
}

const aProvider = () => 7;
const bProvider = () => "asf";
const bProviderSingleton = [() => "asf", {singleton: true}] as [() => string, { singleton: boolean }]; // TODO add warning if singleton value created from non-singleton
const bProviderValue = "asf";
const bProviderValueConfig = ["asf"];

type FixtureC = {
    c: string,
}

const cProvider = ({a, b}) => (b as string).repeat(a as number)
const cProvider2 = ({a, b}) => b[a % b.length];


describe("container", () => {
    it("works with simple provider", () => {
        let container = new Container([]);
        container = container.extend({
            a: aProvider,
        });

        const a = container.select(({a}) => a);

        expect(a).toBe(7)
    })
    it("works with joined providers", () => {
        let container = new Container([]);
        container = container.extend({
            a: aProvider,
            b: bProvider,
        });
        container = container.extend({
            c: cProvider
        })

        const c = container.select(({c}) => c);

        expect(c).toBe("asfasfasfasfasfasfasf")
    })
    it("allows provider override", () => {
        let container = new Container([]);
        container = container.extend({
            a: aProvider,
            b: bProvider,
        });
        container = container.extend({
            c: cProvider
        })
        container = container.extend({
            c: cProvider2
        })

        const c = container.select(({c}) => c);

        expect(c).toBe("s")
    })
    it("allows singleton", () => {
        let container = new Container([]);
        const mock = vi.fn(bProviderSingleton[0]);
        bProviderSingleton[0] = () => mock();
        container = container.extend({
            a: aProvider,
            b: bProviderSingleton,
        });
        container = container.extend({
            c: cProvider2
        })

        const c1 = container.select(({c}) => c);
        const c2 = container.select(({c}) => c);

        expect(c1).toBe(c2);
        expect(mock).toHaveBeenCalledOnce();
    })
    it("allows const value", () => {
        let container = new Container([]);
        container = container.extend({
            a: aProvider,
            b: bProviderValue,
        });
        container = container.extend({
            c: cProvider2
        })

        const c = container.select(({c}) => c);
        expect(c).toBe("s")
    })
    it("allows const value in config", () => {
        let container = new Container([]);
        container = container.extend({
            a: aProvider,
            b: bProviderValueConfig,
        });
        container = container.extend({
            c: cProvider2
        })

        const c = container.select(({c}) => c);
        expect(c).toBe("s")
    })
    it("allows const value in config", () => {
        let container = new Container([]);
        const containerA = container.extend({
            a: aProvider,
        });
        const containerB = container.extend({
            b: bProvider
        })
        container = container.merge([containerA, containerB]).extend({
            c: cProvider2
        });

        const c = container.select(({c}) => c);
        expect(c).toBe("s")
    })
})
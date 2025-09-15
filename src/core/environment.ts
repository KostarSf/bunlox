import { runtimeError } from "./error";
import type { Literal, Token } from "./token";

export function createEnvironment() {
    const values = new Map<string, Literal>();

    const define = (name: string, value: Literal) => {
        values.set(name, value);
    };

    const get = (name: Token) => {
        const value = values.get(name.lexeme);
        if (value === undefined) {
            throw runtimeError(name, `Undefined variable '${name.lexeme}'.`);
        }
        return value;
    };

    return { define, get };
}

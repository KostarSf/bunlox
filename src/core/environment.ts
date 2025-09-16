import { runtimeError } from "./error";
import type { Literal, Token } from "./token";

export interface Environment {
    define: (name: string, value: Literal) => void;
    get: (name: Token) => Literal;
    assign: (name: Token, value: Literal) => void;
}

export function createEnvironment(): Environment {
    const values = new Map<string, Literal>();

    const define: Environment["define"] = (name, value) => {
        values.set(name, value);
    };

    const get: Environment["get"] = (name) => {
        const value = values.get(name.lexeme);
        if (value === undefined) {
            throw runtimeError(name, `Undefined variable '${name.lexeme}'.`);
        }
        return value;
    };

    const assign: Environment["assign"] = (name, value) => {
        if (values.has(name.lexeme)) {
            values.set(name.lexeme, value);
            return;
        }
        throw runtimeError(name, `Undefined variable '${name.lexeme}'.`);
    };

    return { define, get, assign };
}

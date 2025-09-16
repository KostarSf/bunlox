import { runtimeError } from "./error";
import type { Literal, Token } from "./token";

export interface Environment {
    enclosing: Environment | null;

    define: (name: string, value: Literal) => void;
    get: (name: Token) => Literal;
    assign: (name: Token, value: Literal) => void;
}

export function createEnvironment(
    enclosing: Environment | null = null
): Environment {
    const values = new Map<string, Literal>();

    const define: Environment["define"] = (name, value) => {
        values.set(name, value);
    };

    const get: Environment["get"] = (name) => {
        const value = values.get(name.lexeme);

        if (value !== undefined) {
            return value;
        }

        if (enclosing) {
            return enclosing.get(name);
        }

        throw runtimeError(name, `Undefined variable '${name.lexeme}'.`);
    };

    const assign: Environment["assign"] = (name, value) => {
        if (values.has(name.lexeme)) {
            values.set(name.lexeme, value);
            return;
        }

        if (enclosing) {
            enclosing.assign(name, value);
            return;
        }

        throw runtimeError(name, `Undefined variable '${name.lexeme}'.`);
    };

    return Object.freeze({ enclosing, define, get, assign });
}

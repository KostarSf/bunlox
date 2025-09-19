import { runtimeError } from "./error";
import { createCallable, type Literal } from "./literal";
import type { Token } from "./token";

export interface Environment {
    enclosing: Environment | null;
    global: Environment | null;
    values: Map<string, Literal>;

    define: (name: Token, value: Literal) => void;
    get: (name: Token, distance?: number) => Literal;
    assign: (name: Token, value: Literal, distance?: number) => void;
}

function defineGlobals(values: Map<string, Literal>) {
    values.set(
        "clock",
        createCallable(0, () => Date.now() / 1000)
    );
}

export function createEnvironment(
    enclosing: Environment | null = null
): Environment {
    const values = new Map<string, Literal>();

    if (!enclosing) defineGlobals(values);

    const global = !enclosing ? null : enclosing.global ?? enclosing;

    const ancestor = (distance: number | undefined) => {
        let environment = enclosing;

        if (distance === undefined) {
            return global;
        }

        for (let i = 1; i < distance; i++) {
            environment = environment?.enclosing ?? null;
        }

        if (environment === null) {
            throw new Error(`Can't find environment at distance ${distance}.`);
        }

        return environment;
    };

    const define: Environment["define"] = (name, value) => {
        if (enclosing && values.has(name.lexeme)) {
            const message = `Variable '${name.lexeme}' has already been declared.`;
            throw runtimeError(name, message);
        }

        values.set(name.lexeme, value);
    };

    const get: Environment["get"] = (name, distance) => {
        const targetValues =
            (distance !== 0 && ancestor(distance)?.values) || values;

        const value = targetValues.get(name.lexeme);
        if (value !== undefined) return value;

        throw runtimeError(name, `Undefined variable '${name.lexeme}'.`);
    };

    const assign: Environment["assign"] = (name, value, distance) => {
        const targetValues =
            (distance !== 0 && ancestor(distance)?.values) || values;

        if (!targetValues.has(name.lexeme)) {
            throw runtimeError(name, `Undefined variable '${name.lexeme}'.`);
        }

        targetValues.set(name.lexeme, value);
    };

    return Object.freeze({ values, enclosing, global, define, get, assign });
}

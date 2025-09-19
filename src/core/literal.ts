import { createEnvironment, type Environment } from "./environment";
import { ReturnError } from "./error";
import type { FunctionStmt } from "./statements";

export type Literal = string | number | boolean | null | LoxCallable;

export interface LoxCallable {
    arity: number;
    call(args: Literal[], enclosing: Environment): Literal;
    toString(): string;
}

export interface LoxFunction extends LoxCallable {
    declaration: FunctionStmt;
}

export function isCallable(value: Literal): value is LoxCallable {
    return typeof value === "object" && value !== null && "call" in value;
}

export function isFunction(value: Literal): value is LoxFunction {
    return isCallable(value) && "declaration" in value;
}

export function createCallable(
    arity: number,
    call: (args: Literal[]) => Literal
): LoxCallable {
    return Object.freeze({
        arity,
        call,
        toString: () => "<fn>",
    } satisfies LoxCallable);
}

export function createFunction(
    declaration: FunctionStmt,
    execFn: (declaration: FunctionStmt, enclosing: Environment) => undefined
): LoxFunction {
    return Object.freeze({
        declaration,
        get arity() {
            return declaration.parameters.length;
        },
        call: (args: Literal[], enclosing: Environment) => {
            const scope = createEnvironment(enclosing);
            for (let i = 0; i < declaration.parameters.length; i++) {
                const parameter = declaration.parameters[i];
                const argument = args[i];
                if (parameter === undefined)
                    throw new Error("Parameter is undefined");
                if (argument === undefined)
                    throw new Error("Argument is undefined");
                scope.define(parameter, argument);
            }
            try {
                execFn(declaration, scope);
            } catch (error) {
                if (error instanceof ReturnError) {
                    return error.value;
                }
                throw error;
            }
            return null;
        },
        toString: () => `<fn ${declaration.name.lexeme}>`,
    } satisfies LoxFunction);
}

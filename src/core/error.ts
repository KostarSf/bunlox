import { type Token } from "./token";

export class LoxError extends Error {
    constructor(message: string, nestedErrors: LoxError[] = []) {
        const nestedErrorMessages = nestedErrors
            .map((error) => error.message)
            .join("");
        super(message + "\n" + nestedErrorMessages);
    }
}

export class SyntaxError extends LoxError {
    constructor(line: number, message: string) {
        super(`[line ${line}] Error: ${message}`);
    }
}

export class ParseError extends LoxError {
    constructor(line: number, where: string, message: string) {
        super(`[line ${line}] Error${where}: ${message}`);
    }
}

export class RuntimeError extends LoxError {
    token: Token;

    constructor(token: Token, message: string) {
        super(`[line ${token.line}] Error: ${message}`);
        this.token = token;
    }
}

export class BreakError extends RuntimeError {
    constructor(token: Token, message: string) {
        super(token, message);
    }
}

export function syntaxError(line: number, message: string) {
    return new SyntaxError(line, message);
}

export function parseError(token: Token, message: string) {
    return new ParseError(
        token.line,
        token.type === "EOF" ? " at end" : ` at '${token.lexeme}'`,
        message
    );
}

export function runtimeError(token: Token, message: string) {
    return new RuntimeError(token, message);
}

export function breakError(token: Token, message: string) {
    return new BreakError(token, message);
}

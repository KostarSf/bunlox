import type { TokenType } from "./token-types";

export type Literal = string | number | boolean | null;

type TokenArgs = Pick<Token, "type"> &
    Partial<Pick<Token, "lexeme" | "literal" | "line">>;

export class Token {
    type: TokenType;
    lexeme: string;
    literal: Literal;
    line: number;

    constructor(args: TokenArgs) {
        this.type = args.type;
        this.lexeme = args.lexeme ?? "";
        this.literal = args.literal ?? null;
        this.line = args.line ?? 1;
    }

    toString(): string {
        return `Token { type: ${this.type}, lexeme: ${this.lexeme}, literal: ${this.literal}, line: ${this.line} }`;
    }

    [Symbol.for("nodejs.util.inspect.custom")](): string {
        return this.toString();
    }
}

export function token(
    type: TokenType,
    lexeme?: string,
    literal?: Literal,
    line?: number
): Token;
export function token(args: TokenArgs): Token;
export function token(
    argsOrType: TokenArgs | TokenType,
    lexeme?: string,
    literal?: Literal,
    line?: number
): Token {
    if (typeof argsOrType === "string") {
        return new Token({ type: argsOrType, lexeme, literal, line });
    }
    return new Token(argsOrType);
}

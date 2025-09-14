import type { TokenType } from "./token-types";

export type Literal = string | number | boolean | null;

type TokenArgs = Pick<Token, "type" | "line"> &
    Partial<Pick<Token, "lexeme" | "literal">>;

export class Token {
    type: TokenType;
    lexeme: string;
    literal: Literal;
    line: number;

    constructor(args: TokenArgs) {
        this.type = args.type;
        this.lexeme = args.lexeme ?? "";
        this.literal = args.literal ?? null;
        this.line = args.line;
    }

    toString(): string {
        return `Token { type: ${this.type}, lexeme: ${this.lexeme}, literal: ${this.literal}, line: ${this.line} }`;
    }

    [Symbol.for("nodejs.util.inspect.custom")](): string {
        return this.toString();
    }
}

export function token(args: TokenArgs): Token {
    return new Token(args);
}

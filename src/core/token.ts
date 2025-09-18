import type { Literal } from "./literal";
import type { TokenType } from "./token-types";

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
        Object.freeze(this);
    }

    toString(): string {
        return `Token { type: ${this.type}, lexeme: ${this.lexeme}, literal: ${this.literal}, line: ${this.line} }`;
    }

    [Symbol.for("nodejs.util.inspect.custom")]() {
        return this.toString();
    }

    toJSON() {
        return {
            type: this.type,
            lexeme: this.lexeme,
            literal: this.literal,
            line: this.line,
        };
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

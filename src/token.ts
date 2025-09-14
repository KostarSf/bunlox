import type { TokenType } from "./token-type";

export interface Token {
    type: TokenType;
    lexeme: string;
    literal: string | number | boolean | null;
    line: number;
}

export function token(args: Token) {
    return {
        type: args.type,
        lexeme: args.lexeme,
        literal: args.literal,
        line: args.line,
        toString: () => `${args.type} ${args.lexeme} ${args.literal}`,
    } as Token;
}

import { TOKEN_TYPES, type TokenType } from "./token-types";

type TokenKeywords = Record<string, TokenType | undefined>;

/**
 * A map of token keywords to their corresponding token types.
 */
export const TOKEN_KEYWORDS: TokenKeywords = {
    and: TOKEN_TYPES.AND,
    class: TOKEN_TYPES.CLASS,
    else: TOKEN_TYPES.ELSE,
    false: TOKEN_TYPES.FALSE,
    fun: TOKEN_TYPES.FUN,
    for: TOKEN_TYPES.FOR,
    if: TOKEN_TYPES.IF,
    nil: TOKEN_TYPES.NIL,
    or: TOKEN_TYPES.OR,
    print: TOKEN_TYPES.PRINT,
    return: TOKEN_TYPES.RETURN,
    super: TOKEN_TYPES.SUPER,
    this: TOKEN_TYPES.THIS,
    true: TOKEN_TYPES.TRUE,
    var: TOKEN_TYPES.VAR,
    while: TOKEN_TYPES.WHILE,
};

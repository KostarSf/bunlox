import { LoxError, syntaxError, type SyntaxError } from "./error";
import { token, type Literal } from "./token";
import { TOKEN_KEYWORDS } from "./token-keywords";
import type { TokenType } from "./token-types";

const SINGLE_TOKENS: Record<string, TokenType> = {
    "(": "LEFT_PAREN",
    ")": "RIGHT_PAREN",
    "{": "LEFT_BRACE",
    "}": "RIGHT_BRACE",
    ",": "COMMA",
    ".": "DOT",
    "-": "MINUS",
    "+": "PLUS",
    ";": "SEMICOLON",
    "*": "STAR",
    "/": "SLASH",
};

const TWO_CHAR_OPERATORS: Record<
    string,
    { withEq: TokenType; withoutEq: TokenType }
> = {
    "!": { withEq: "BANG_EQUAL", withoutEq: "BANG" },
    "=": { withEq: "EQUAL_EQUAL", withoutEq: "EQUAL" },
    "<": { withEq: "LESS_EQUAL", withoutEq: "LESS" },
    ">": { withEq: "GREATER_EQUAL", withoutEq: "GREATER" },
};

export function* scanTokens(source: string) {
    let start = 0;
    let current = 0;
    let line = 1;
    const errors: SyntaxError[] = [];

    const isAtEnd = () => current >= source.length;
    const peek = (offset = 0) => source[current + offset] ?? "\0";
    const advance = () => source[current++] ?? "";
    const match = (expected: string) => {
        if (isAtEnd() || source[current] !== expected) return false;
        current++;
        return true;
    };
    const makeToken = (type: TokenType, literal: Literal = null) =>
        token(type, source.slice(start, current), literal, line);
    const isDigit = (ch: string) => ch >= "0" && ch <= "9";
    const isAlpha = (ch: string) =>
        (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_";
    const isAlphaNumeric = (ch: string) => isAlpha(ch) || isDigit(ch);

    function* scanString() {
        while (peek() !== '"' && !isAtEnd()) {
            if (peek() === "\n") line++;
            advance();
        }
        if (isAtEnd()) {
            errors.push(syntaxError(line, "Unterminated string."));
            return;
        }
        advance(); // closing quote
        const value = source.slice(start + 1, current - 1);
        yield makeToken("STRING", value);
    }

    function* scanNumber() {
        while (isDigit(peek())) advance();
        if (peek() === "." && isDigit(peek(1))) {
            advance();
            while (isDigit(peek())) advance();
        }
        yield makeToken("NUMBER", parseFloat(source.slice(start, current)));
    }

    function* scanIdentifier() {
        while (isAlphaNumeric(peek())) advance();
        const text = source.slice(start, current);
        const type = TOKEN_KEYWORDS[text] ?? "IDENTIFIER";
        yield makeToken(type);
    }

    while (!isAtEnd()) {
        start = current;
        const ch = advance();

        // Whitespace/newlines
        if (ch === " " || ch === "\r" || ch === "\t") continue;
        if (ch === "\n") {
            line++;
            continue;
        }

        // Comments and slash
        if (ch === "/") {
            if (match("/")) {
                while (peek() !== "\n" && !isAtEnd()) advance();
            } else {
                yield makeToken("SLASH");
            }
            continue;
        }

        // Strings
        if (ch === '"') {
            yield* scanString();
            continue;
        }

        // Two-char operators
        const pair = TWO_CHAR_OPERATORS[ch];
        if (pair) {
            yield makeToken(match("=") ? pair.withEq : pair.withoutEq);
            continue;
        }

        // Single-char tokens
        const single = SINGLE_TOKENS[ch];
        if (single) {
            yield makeToken(single);
            continue;
        }

        // Numbers / identifiers
        if (isDigit(ch)) {
            yield* scanNumber();
            continue;
        }
        if (isAlpha(ch)) {
            yield* scanIdentifier();
            continue;
        }

        errors.push(syntaxError(line, `Unexpected character: '${ch}'`));
    }

    yield token({ type: "EOF", line });
    if (errors.length > 0) {
        throw new LoxError("Syntax error", errors);
    }
}

import { LoxError, syntaxError, type SyntaxLoxError } from "./error";
import { token, type Literal, type Token } from "./token";
import { TOKEN_KEYWORDS } from "./token-keywords";
import { TOKEN_TYPES, type TokenType } from "./token-types";

class Scanner {
    #source: string;
    #tokens: Token[] = [];

    #start = 0;
    #current = 0;
    #line = 1;

    #errors: SyntaxLoxError[] = [];

    constructor(source: string) {
        this.#source = source;
    }

    scanTokens() {
        while (!this.#isAtEnd()) {
            // We are at the beginning of the next lexeme.
            this.#start = this.#current;
            this.#scanToken();
        }

        this.#tokens.push(token({ type: TOKEN_TYPES.EOF, line: this.#line }));

        if (this.#errors.length > 0) {
            throw new LoxError("Syntax error", this.#errors);
        }

        return this.#tokens;
    }

    #isAtEnd() {
        return this.#current >= this.#source.length;
    }

    #scanToken() {
        const char = this.#advance();

        switch (char) {
            case "(":
                this.#addToken(TOKEN_TYPES.LEFT_PAREN);
                break;
            case ")":
                this.#addToken(TOKEN_TYPES.RIGHT_PAREN);
                break;
            case "{":
                this.#addToken(TOKEN_TYPES.LEFT_BRACE);
                break;
            case "}":
                this.#addToken(TOKEN_TYPES.RIGHT_BRACE);
                break;
            case ",":
                this.#addToken(TOKEN_TYPES.COMMA);
                break;
            case ".":
                this.#addToken(TOKEN_TYPES.DOT);
                break;
            case "-":
                this.#addToken(TOKEN_TYPES.MINUS);
                break;
            case "+":
                this.#addToken(TOKEN_TYPES.PLUS);
                break;
            case ";":
                this.#addToken(TOKEN_TYPES.SEMICOLON);
                break;
            case "*":
                this.#addToken(TOKEN_TYPES.STAR);
                break;

            case "!":
                this.#addToken(
                    this.#match("=") ? TOKEN_TYPES.BANG_EQUAL : TOKEN_TYPES.BANG
                );
                break;
            case "=":
                this.#addToken(
                    this.#match("=")
                        ? TOKEN_TYPES.EQUAL_EQUAL
                        : TOKEN_TYPES.EQUAL
                );
                break;
            case "<":
                this.#addToken(
                    this.#match("=") ? TOKEN_TYPES.LESS_EQUAL : TOKEN_TYPES.LESS
                );
                break;
            case ">":
                this.#addToken(
                    this.#match("=")
                        ? TOKEN_TYPES.GREATER_EQUAL
                        : TOKEN_TYPES.GREATER
                );
                break;

            case "/":
                if (this.#match("/")) {
                    while (this.#peek() !== "\n" && !this.#isAtEnd()) {
                        this.#advance();
                    }
                } else {
                    this.#addToken(TOKEN_TYPES.SLASH);
                }
                break;

            case " ":
            case "\r":
            case "\t":
                break;

            case "\n":
                this.#line++;
                break;

            case '"':
                this.#string();
                break;

            default:
                if (this.#isDigit(char)) {
                    this.#number();
                    break;
                }

                if (this.#isAlpha(char)) {
                    this.#identifier();
                    break;
                }

                const message = `Unexpected character: '${char}'`;
                this.#errors.push(syntaxError(this.#line, message));
                break;
        }
    }

    #advance() {
        return this.#source[this.#current++] ?? "";
    }

    #addToken(type: TokenType, literal: Literal = null) {
        const lexeme = this.#source.slice(this.#start, this.#current);
        this.#tokens.push(token({ type, lexeme, literal, line: this.#line }));
    }

    #match(expected: string) {
        if (this.#isAtEnd()) return false;
        if (this.#source[this.#current] !== expected) return false;

        this.#current++;
        return true;
    }

    #peek(offset = 0) {
        return this.#source[this.#current + offset] ?? "\0";
    }

    #string() {
        while (this.#peek() !== '"' && !this.#isAtEnd()) {
            if (this.#peek() === "\n") this.#line++;
            this.#advance();
        }

        if (this.#isAtEnd()) {
            this.#errors.push(syntaxError(this.#line, "Unterminated string."));
            return;
        }

        // The closing quote.
        this.#advance();

        // Trim the surrounding quotes.
        const value = this.#source.slice(this.#start + 1, this.#current - 1);
        this.#addToken(TOKEN_TYPES.STRING, value);
    }

    #isDigit(char: string) {
        return char >= "0" && char <= "9";
    }

    #number() {
        while (this.#isDigit(this.#peek())) {
            this.#advance();
        }

        if (this.#peek() === "." && this.#isDigit(this.#peek(1))) {
            this.#advance();
            while (this.#isDigit(this.#peek())) {
                this.#advance();
            }
        }

        this.#addToken(
            TOKEN_TYPES.NUMBER,
            parseFloat(this.#source.slice(this.#start, this.#current))
        );
    }

    #identifier() {
        while (this.#isAlphaNumeric(this.#peek())) {
            this.#advance();
        }

        const text = this.#source.slice(this.#start, this.#current);
        const type = TOKEN_KEYWORDS[text];
        this.#addToken(type ?? TOKEN_TYPES.IDENTIFIER);
    }

    #isAlpha(char: string) {
        return (
            (char >= "a" && char <= "z") ||
            (char >= "A" && char <= "Z") ||
            char === "_"
        );
    }

    #isAlphaNumeric(char: string) {
        return this.#isAlpha(char) || this.#isDigit(char);
    }
}

export function scan(source: string) {
    const scanner = new Scanner(source);
    return scanner.scanTokens();
}

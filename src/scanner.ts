import { LoxError, syntaxError, type SyntaxLoxError } from "./error";
import { token, type Literal, type Token } from "./token";
import { TOKEN_KEYWORDS } from "./token-keywords";
import { type TokenType } from "./token-types";

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

        this.#tokens.push(token({ type: "EOF", line: this.#line }));

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
                this.#addToken("LEFT_PAREN");
                break;
            case ")":
                this.#addToken("RIGHT_PAREN");
                break;
            case "{":
                this.#addToken("LEFT_BRACE");
                break;
            case "}":
                this.#addToken("RIGHT_BRACE");
                break;
            case ",":
                this.#addToken("COMMA");
                break;
            case ".":
                this.#addToken("DOT");
                break;
            case "-":
                this.#addToken("MINUS");
                break;
            case "+":
                this.#addToken("PLUS");
                break;
            case ";":
                this.#addToken("SEMICOLON");
                break;
            case "*":
                this.#addToken("STAR");
                break;

            case "!":
                this.#addToken(this.#match("=") ? "BANG_EQUAL" : "BANG");
                break;
            case "=":
                this.#addToken(this.#match("=") ? "EQUAL_EQUAL" : "EQUAL");
                break;
            case "<":
                this.#addToken(this.#match("=") ? "LESS_EQUAL" : "LESS");
                break;
            case ">":
                this.#addToken(this.#match("=") ? "GREATER_EQUAL" : "GREATER");
                break;

            case "/":
                if (this.#match("/")) {
                    while (this.#peek() !== "\n" && !this.#isAtEnd()) {
                        this.#advance();
                    }
                } else {
                    this.#addToken("SLASH");
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
        this.#tokens.push(token(type, lexeme, literal, this.#line));
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
        this.#addToken("STRING", value);
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
            "NUMBER",
            parseFloat(this.#source.slice(this.#start, this.#current))
        );
    }

    #identifier() {
        while (this.#isAlphaNumeric(this.#peek())) {
            this.#advance();
        }

        const text = this.#source.slice(this.#start, this.#current);
        const type = TOKEN_KEYWORDS[text];
        this.#addToken(type ?? "IDENTIFIER");
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

import { LoxError, syntaxError, type SyntaxLoxError } from "./error";
import { token, type Literal, type Token } from "./token";
import { TOKEN_TYPE, type TokenType } from "./token-type";

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

        this.#tokens.push(token({ type: TOKEN_TYPE.EOF, line: this.#line }));

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
                this.#addToken(TOKEN_TYPE.LEFT_PAREN);
                break;
            case ")":
                this.#addToken(TOKEN_TYPE.RIGHT_PAREN);
                break;
            case "{":
                this.#addToken(TOKEN_TYPE.LEFT_BRACE);
                break;
            case "}":
                this.#addToken(TOKEN_TYPE.RIGHT_BRACE);
                break;
            case ",":
                this.#addToken(TOKEN_TYPE.COMMA);
                break;
            case ".":
                this.#addToken(TOKEN_TYPE.DOT);
                break;
            case "-":
                this.#addToken(TOKEN_TYPE.MINUS);
                break;
            case "+":
                this.#addToken(TOKEN_TYPE.PLUS);
                break;
            case ";":
                this.#addToken(TOKEN_TYPE.SEMICOLON);
                break;
            case "*":
                this.#addToken(TOKEN_TYPE.STAR);
                break;

            case "!":
                this.#addToken(
                    this.#match("=") ? TOKEN_TYPE.BANG_EQUAL : TOKEN_TYPE.BANG
                );
                break;
            case "=":
                this.#addToken(
                    this.#match("=") ? TOKEN_TYPE.EQUAL_EQUAL : TOKEN_TYPE.EQUAL
                );
                break;
            case "<":
                this.#addToken(
                    this.#match("=") ? TOKEN_TYPE.LESS_EQUAL : TOKEN_TYPE.LESS
                );
                break;
            case ">":
                this.#addToken(
                    this.#match("=")
                        ? TOKEN_TYPE.GREATER_EQUAL
                        : TOKEN_TYPE.GREATER
                );
                break;

            case "/":
                if (this.#match("/")) {
                    while (this.#peek() !== "\n" && !this.#isAtEnd()) {
                        this.#advance();
                    }
                } else {
                    this.#addToken(TOKEN_TYPE.SLASH);
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
                } else {
                    this.#errors.push(
                        syntaxError(
                            this.#line,
                            `Unexpected character: '${char}'`
                        )
                    );
                }
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
        this.#addToken(TOKEN_TYPE.STRING, value);
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
            TOKEN_TYPE.NUMBER,
            parseFloat(this.#source.slice(this.#start, this.#current))
        );
    }
}

export function scan(source: string) {
    const scanner = new Scanner(source);
    return scanner.scanTokens();
}

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

    get errors() {
        return [...this.#errors];
    }

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

            default:
                this.#errors.push(
                    syntaxError(this.#line, `Unexpected character: '${char}'`)
                );
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

    #peek() {
        return this.#source[this.#current] ?? "\0";
    }
}

export function scan(source: string) {
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();

    if (scanner.errors.length > 0) {
        throw new LoxError("Syntax error", scanner.errors);
    }

    return tokens;
}

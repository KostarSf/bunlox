import { LoxError, parseError, ParseError } from "./error";
import type { Expr } from "./expressions";
import * as ex from "./expressions";
import type { Token } from "./token";
import type { TokenType } from "./token-types";

/**
 * @throws {ParseError}
 */
export function parseAst(tokens: Token[]) {
    let current = 0;
    const errors: ParseError[] = [];

    const expression = (): Expr => equality();
    const equality = (): Expr =>
        leftSeries(() => comparison(), ["BANG_EQUAL", "EQUAL_EQUAL"]);
    const comparison = (): Expr =>
        leftSeries(
            () => term(),
            ["GREATER", "GREATER_EQUAL", "LESS", "LESS_EQUAL"]
        );
    const term = (): Expr => leftSeries(() => factor(), ["MINUS", "PLUS"]);
    const factor = (): Expr => leftSeries(() => unary(), ["SLASH", "STAR"]);
    const unary = (): Expr => {
        if (match("BANG", "MINUS")) {
            return ex.unary(previous(), unary());
        }
        return primary();
    };
    const primary = (): Expr => {
        if (match("FALSE")) return ex.literal(false);
        if (match("TRUE")) return ex.literal(true);
        if (match("NIL")) return ex.literal(null);

        if (match("NUMBER", "STRING")) return ex.literal(previous().literal);

        if (match("LEFT_PAREN")) {
            const expr = expression();
            consume("RIGHT_PAREN", "Expect ')' after expression.");
            return ex.grouping(expr);
        }

        throw parseError(peek(), "Expect expression.");
    };

    /**  Method for parsing a left-associative series of binary operators */
    const leftSeries = (exprFn: () => Expr, matchTypes: TokenType[]) => {
        let expr = exprFn();
        while (match(...matchTypes)) {
            expr = ex.binary(expr, previous(), exprFn());
        }
        return expr;
    };
    const match = (...types: TokenType[]) => {
        if (types.some(check)) {
            advance();
            return true;
        }

        return false;
    };
    const check = (type: TokenType) => !isAtEnd() && peek().type === type;
    const advance = () => {
        if (!isAtEnd()) current++;
        return previous();
    };
    const isAtEnd = () => peek().type === "EOF";
    const peek = () => get(current);
    const previous = () => get(current - 1);
    const get = (index: number) => {
        const token = tokens[index];
        if (!token) {
            const note = `${index} (last is ${tokens.length - 1})`;
            throw new Error(`Token index is out of range: ${note}`);
        }
        return token;
    };
    /**
     * @throws {ParseError}
     */
    const consume = (type: TokenType, message: string) => {
        if (check(type)) return advance();
        throw parseError(peek(), message);
    };

    const synchronize = () => {
        advance();

        while (!isAtEnd()) {
            if (previous().type === "SEMICOLON") return;

            switch (peek().type) {
                case "CLASS":
                case "FUN":
                case "VAR":
                case "FOR":
                case "IF":
                case "WHILE":
                case "PRINT":
                case "RETURN":
                    return;
            }

            advance();
        }
    };

    try {
        return expression();
    } catch (error) {
        if (error instanceof ParseError) {
            errors.push(error);
            throw new LoxError("Syntax error", errors);
        } else {
            throw error;
        }
    }
}
